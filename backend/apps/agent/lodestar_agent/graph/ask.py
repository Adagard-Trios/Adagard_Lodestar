"""'Ask the planning agent' (DSP-39/40): a small tool-calling graph over a run snapshot.

It never mutates the run. A ``propose_edit`` result is returned as a proposal the
dispatcher can apply with ``POST /runs/{id}/resume {decision: "edit", edits}``.
"""

from __future__ import annotations

import json
from typing import Annotated, Any, TypedDict

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from ..domain.context import PlanningContext
from ..tools import build_ask_tools


class AskState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


def answer_question(model: BaseChatModel, ctx: PlanningContext, run: dict[str, Any], question: str) -> dict[str, Any]:
    tools, proposals = build_ask_tools(ctx, run)
    bound = model.bind_tools(tools)

    def agent(state: AskState) -> dict[str, Any]:
        return {"messages": [bound.invoke(state["messages"])]}

    g = StateGraph(AskState)
    g.add_node("agent", agent)
    g.add_node("tools", ToolNode(tools))
    g.add_edge(START, "agent")
    g.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    g.add_edge("tools", "agent")
    graph = g.compile()

    snapshot = {
        "depot": ctx.depot,
        "runDate": ctx.run_date,
        "version": run["plan"].get("version", 1),
        "orderIds": sorted(ctx.orders),
        "vehicleIds": sorted(ctx.vehicles),
        "outletIds": sorted(ctx.outlets),
    }
    result = graph.invoke(
        {
            "messages": [
                SystemMessage("[task:ask]\n" + json.dumps(snapshot)),
                HumanMessage(question),
            ]
        },
        {"recursion_limit": 8},
    )
    messages = result["messages"]
    tool_calls = [c["name"] for m in messages if isinstance(m, AIMessage) for c in m.tool_calls]
    answer = next((str(m.content) for m in reversed(messages) if isinstance(m, AIMessage) and not m.tool_calls), "")
    return {"answer": answer, "toolCalls": tool_calls, "proposal": proposals[0] if proposals else None}
