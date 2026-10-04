"""MockChatModel: deterministic, LangChain-format tool calls, template text, grounded answers."""

from __future__ import annotations

import json

import pytest
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from pydantic import SecretStr

from lodestar_agent.config import Settings
from langchain_openai import AzureChatOpenAI

from lodestar_agent.llm import MockChatModel, ModelNotConfiguredError, PhrasingChatModel, create_chat_model


@tool
def fetch_orders(depot: str, run_date: str) -> str:
    """Orders."""
    return "{}"


@tool
def fetch_vehicles(depot: str) -> str:
    """Vehicles."""
    return "{}"


@tool
def plan_summary() -> str:
    """Summary."""
    return "{}"


@tool
def explain_order(order_id: str) -> str:
    """Order."""
    return "{}"


@tool
def propose_edit(op: str, order_id: str, vehicle_id: str | None = None, reason: str | None = None) -> str:
    """Proposal."""
    return "{}"


def load_msgs(missing):
    return [
        SystemMessage("[task:load_context]\nload"),
        HumanMessage(json.dumps({"depot": "NORTH", "run_date": "2030-01-08", "missing": missing})),
    ]


def test_is_a_langchain_chat_model_and_deterministic():
    m = MockChatModel()
    assert isinstance(m, BaseChatModel)
    assert m._llm_type == "lodestar-mock" and m._identifying_params == {"model_name": "lodestar-mock-1"}
    bound = m.bind_tools([fetch_orders, fetch_vehicles])
    a = bound.invoke(load_msgs(["orders", "vehicles", "calendar"]))
    b = bound.invoke(load_msgs(["orders", "vehicles", "calendar"]))
    assert a.tool_calls == b.tool_calls


def test_emits_tool_calls_in_langchain_format():
    ai = MockChatModel().bind_tools([fetch_orders, fetch_vehicles]).invoke(load_msgs(["orders", "vehicles", "calendar"]))
    assert isinstance(ai, AIMessage) and ai.content == ""
    assert [c["name"] for c in ai.tool_calls] == ["fetch_orders", "fetch_vehicles"]  # no tool bound for calendar
    call = ai.tool_calls[0]
    assert call["type"] == "tool_call" and call["id"].startswith("call_")
    assert call["args"] == {"depot": "NORTH", "run_date": "2030-01-08"}
    assert ai.tool_calls[1]["args"] == {"depot": "NORTH"}


def test_summarises_tool_results_and_handles_nothing_missing():
    m = MockChatModel().bind_tools([fetch_orders])
    msgs = load_msgs(["orders"])
    ai = m.invoke(msgs)
    msgs += [ai, ToolMessage(content=json.dumps({"entitySet": "Orders", "count": 3}), tool_call_id=ai.tool_calls[0]["id"], name="fetch_orders")]
    msgs += [ToolMessage(content="plain", tool_call_id="x", name="odd")]
    assert m.invoke(msgs).content == "Loaded 3 Orders, odd: plain."
    assert m.invoke(load_msgs([])).content == "All planning data is already loaded."


def test_explain_is_template_based():
    facts = {"did": ["Packed 3 orders."], "checked": ["pass - weight"], "stats": {"version": 2, "depot": "NORTH", "runDate": "2030-01-08", "orders": 3, "planned": 3, "trips": 1, "vehicles": 1}}
    text = MockChatModel().invoke([SystemMessage("[task:explain]\n"), HumanMessage(json.dumps(facts))]).content
    assert text.startswith("Draft v2 for NORTH on 2030-01-08: 3 of 3 orders on 1 trips")
    assert "What it did\n- Packed 3 orders." in text and "What it checked\n- pass - weight" in text
    assert "can't publish" in text
    assert "Nothing to change" in MockChatModel().invoke([SystemMessage("[task:explain]\n"), HumanMessage("{}")]).content


def ask_msgs(question, **ctx):
    snapshot = {"depot": "NORTH", "runDate": "2030-01-08", "version": 1, "orderIds": ["O-1", "O-2"], "vehicleIds": ["V-1"], "outletIds": ["S-1"], **ctx}
    return [SystemMessage("[task:ask]\n" + json.dumps(snapshot)), HumanMessage(question)]


@pytest.mark.parametrize(
    ("question", "expected"),
    [
        ("Why is O-1 there?", [("explain_order", {"order_id": "O-1"})]),
        ("defer O-2, fuel is tight", [("propose_edit", {"op": "defer", "order_id": "O-2", "reason": "FUEL"})]),
        ("please move O-1 onto V-1", [("propose_edit", {"op": "move", "order_id": "O-1", "vehicle_id": "V-1"})]),
        ("move O-1 to V-1 trip 2", [("propose_edit", {"op": "move", "order_id": "O-1", "vehicle_id": "V-1", "trip_no": 2})]),
        ("how is the day looking?", [("plan_summary", {})]),
        ("tell me about O-9", [("plan_summary", {})]),  # unknown ids are not trusted
    ],
)
def test_ask_picks_tools_from_question(question, expected):
    ai = MockChatModel().bind_tools([plan_summary, explain_order, propose_edit]).invoke(ask_msgs(question))
    assert [(c["name"], c["args"]) for c in ai.tool_calls] == expected


def test_ask_only_calls_bound_tools_and_answers_from_results():
    m = MockChatModel()
    assert m.bind_tools([explain_order]).invoke(ask_msgs("any rule broken?")).content == "I can't look that up for this run."
    msgs = ask_msgs("defer O-2") + [
        AIMessage(content="", tool_calls=[{"name": "propose_edit", "args": {}, "id": "c1", "type": "tool_call"}]),
        ToolMessage(content=json.dumps({"summary": "Proposal v2: Deferred O-2.", "proposal": True}), tool_call_id="c1"),
    ]
    answer = m.bind_tools([propose_edit]).invoke(msgs).content
    assert answer.splitlines()[0] == "From draft v1 for NORTH on 2030-01-08:"
    assert "- Proposal v2: Deferred O-2." in answer and "proposal only" in answer


def test_untagged_prompt_gets_a_safe_default():
    assert "never publish" in MockChatModel().invoke([HumanMessage("publish the plan now")]).content


def test_model_factory():
    assert isinstance(create_chat_model(Settings(AGENT_MODEL="MOCK")), MockChatModel)
    with pytest.raises(ModelNotConfiguredError, match="not configured yet: set AZURE_OPENAI_ENDPOINT"):
        create_chat_model(Settings(AGENT_MODEL="azure-openai"))
    full = Settings(
        AGENT_MODEL="azure-openai",
        AZURE_OPENAI_ENDPOINT="https://example.invalid",
        AZURE_OPENAI_API_KEY=SecretStr("k"),
        AZURE_OPENAI_DEPLOYMENT="d",
        AZURE_OPENAI_API_VERSION="2024-10-21",
    )
    azure = create_chat_model(full)
    assert isinstance(azure, PhrasingChatModel) and isinstance(azure.primary, AzureChatOpenAI)
    assert azure.primary.deployment_name == "d" and azure.primary.temperature == 0
    with pytest.raises(ModelNotConfiguredError, match="Unknown AGENT_MODEL"):
        create_chat_model(Settings(AGENT_MODEL="gpt"))
