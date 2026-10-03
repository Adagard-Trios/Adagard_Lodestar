"""AGENT_MODEL=azure-openai against a mocked Azure OpenAI endpoint (httpx.MockTransport, no real key).

The deterministic mock still decides everything (datasets to load, tools to call, facts); the LLM only phrases
the explanation and the answers, and any LLM error falls back to the mock's own text.
"""

from __future__ import annotations

import json

import httpx
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import SecretStr

from lodestar_agent.config import Settings
from lodestar_agent.llm import MockChatModel, PhrasingChatModel, chat_model_or_mock, create_chat_model

from . import fixtures as fx
from .test_mock_model import fetch_orders, fetch_vehicles

SETTINGS = Settings(
    AGENT_MODEL="azure-openai",
    AZURE_OPENAI_ENDPOINT="https://lodestar-test.openai.azure.com",
    AZURE_OPENAI_API_KEY=SecretStr("test-key"),
    AZURE_OPENAI_DEPLOYMENT="gpt-4o-mini",
    AZURE_OPENAI_API_VERSION="2024-10-21",
)


def completion(text: str) -> dict:
    return {
        "id": "chatcmpl-1", "object": "chat.completion", "created": 0, "model": "gpt-4o-mini",
        "choices": [{"index": 0, "finish_reason": "stop", "message": {"role": "assistant", "content": text}}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
    }


class FakeAzure:
    """Records the requests the Azure SDK sends and answers them like Azure OpenAI would."""

    def __init__(self, reply: str = "Phrased by the LLM.", status: int = 200):
        self.reply, self.status, self.requests = reply, status, []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if self.status != 200:
            return httpx.Response(self.status, json={"error": {"code": "InternalServerError", "message": "boom"}})
        return httpx.Response(200, json=completion(self.reply))

    def model(self) -> PhrasingChatModel:
        model = create_chat_model(SETTINGS, http_client=httpx.Client(transport=httpx.MockTransport(self)))
        assert isinstance(model, PhrasingChatModel)
        return model


EXPLAIN = [
    SystemMessage("[task:explain]\nWrite the panel."),
    HumanMessage(json.dumps({"did": ["Packed 7 orders"], "checked": ["pass - Weight"], "stats": {"version": 1, "depot": "NORTH", "runDate": "2030-01-08"}})),
]


def test_explanation_is_phrased_by_azure_openai_with_the_deterministic_draft_as_input():
    fake = FakeAzure("Draft v1 for NORTH: 7 orders packed. All checks pass.")
    ai = fake.model().invoke(EXPLAIN)
    assert ai.content == "Draft v1 for NORTH: 7 orders packed. All checks pass."
    assert ai.response_metadata["phrasedBy"] == "gpt-4o-mini"
    [req] = fake.requests
    assert req.url.path == "/openai/deployments/gpt-4o-mini/chat/completions"
    assert req.url.params["api-version"] == "2024-10-21" and req.headers["api-key"] == "test-key"
    body = json.loads(req.content)
    assert body["temperature"] == 0 and "tools" not in body  # the LLM is never offered a tool
    sent = body["messages"][1]["content"]
    assert "DRAFT (explain)" in sent and "- Packed 7 orders" in sent and "What it checked" in sent


def test_any_llm_error_falls_back_to_the_mock_text():
    fake = FakeAzure(status=500)
    ai = fake.model().invoke(EXPLAIN)
    assert ai.content == MockChatModel().invoke(EXPLAIN).content
    assert fake.requests  # it did try


def test_an_empty_llm_reply_falls_back_to_the_mock_text():
    ai = FakeAzure(reply="  ").model().invoke(EXPLAIN)
    assert ai.content == MockChatModel().invoke(EXPLAIN).content


def test_tool_choice_stays_deterministic_and_never_reaches_the_llm():
    fake = FakeAzure()
    model = fake.model().bind_tools([fetch_orders, fetch_vehicles])
    msgs = [SystemMessage("[task:load_context]\n{}"), HumanMessage(json.dumps({"missing": ["orders", "vehicles"], "depot": "D", "run_date": "2030-01-08"}))]
    ai = model.invoke(msgs)
    assert [c["name"] for c in ai.tool_calls] == ["fetch_orders", "fetch_vehicles"]
    assert ai.tool_calls == MockChatModel().bind_tools([fetch_orders, fetch_vehicles]).invoke(msgs).tool_calls
    assert fake.requests == []


def test_a_whole_run_and_an_answer_with_azure_keep_the_same_plan(make_runtime):
    """Same plan, rule checks and deferrals as the mock; only the wording of the explanation and answer differs."""
    fake = FakeAzure("Phrased: 7 orders on 5 trips.")
    rt = make_runtime(model=fake.model())
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    plain = make_runtime().start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    assert run["plan"]["trips"] == plain["plan"]["trips"] and run["deferrals"] == plain["deferrals"]
    assert run["ruleChecks"] == plain["ruleChecks"]
    assert run["explanation"]["text"] == "Phrased: 7 orders on 5 trips."
    assert run["explanation"]["did"] == plain["explanation"]["did"]
    answer = rt.ask(run["id"], "Why is O-1 on its trip?")
    assert answer["answer"] == "Phrased: 7 orders on 5 trips." and answer["toolCalls"] == ["explain_order"]
    assert len(fake.requests) == 2  # one explanation, one answer


def test_misconfigured_azure_falls_back_to_the_mock_at_startup():
    assert isinstance(chat_model_or_mock(Settings(AGENT_MODEL="azure-openai")), MockChatModel)
    assert isinstance(chat_model_or_mock(Settings(AGENT_MODEL="mock")), MockChatModel)
    assert isinstance(chat_model_or_mock(SETTINGS), PhrasingChatModel)
