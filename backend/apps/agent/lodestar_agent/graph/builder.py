"""The planning StateGraph (PLATFORM.md section 4).

load_context -> draft_plan -> check_rules -(violations, <= max_redrafts)-> draft_plan
                                         -> rank_deferrals -> explain -> await_approval
await_approval (interrupt) -> approve | reject -> END
                           -> edit -> apply_edits -> check_rules -> ...
The graph has no node that publishes: approval only records the human decision.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from ..domain import deferrals as deferral_rules
from ..domain import edits as edit_rules
from ..domain import planner, rules
from ..domain.context import PlanningContext
from ..odata import ODataClient
from ..tools import DATASETS, build_context_tools
from .state import AgentState

log = logging.getLogger("lodestar_agent.graph")

MAX_TOOL_ROUNDS = 3


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run_tool_loop(model: BaseChatModel, tools: list[BaseTool], messages: list[BaseMessage], max_rounds: int = MAX_TOOL_ROUNDS) -> list[BaseMessage]:
    """Let the model pick tools, execute them, feed results back; stop when it answers."""
    by_name = {t.name: t for t in tools}
    bound = model.bind_tools(tools)
    for _ in range(max_rounds):
        ai: AIMessage = bound.invoke(messages)  # type: ignore[assignment]
        messages.append(ai)
        if not ai.tool_calls:
            break
        for call in ai.tool_calls:
            tool = by_name.get(call["name"])
            content = tool.invoke(call["args"]) if tool else json.dumps({"error": f"unknown tool {call['name']}"})
            messages.append(ToolMessage(content=str(content), tool_call_id=call["id"], name=call["name"]))
    return messages


def build_graph(
    model: BaseChatModel,
    odata_factory: Callable[[], ODataClient],
    checkpointer: BaseCheckpointSaver,
    *,
    max_redrafts: int = 3,
    first_departure: str = "03:30",
):
    def ctx_of(state: AgentState) -> PlanningContext:
        return PlanningContext.from_raw(state.get("raw", {}), state["depot"], state["runDate"], first_departure)

    # ---------------------------------------------------------------- nodes
    def load_context(state: AgentState) -> dict[str, Any]:
        raw = dict(state.get("raw") or {})
        missing = [name for name, (_, key) in DATASETS.items() if key not in raw]
        tools, loaded = build_context_tools(odata_factory(), state["depot"], state["runDate"])
        messages: list[BaseMessage] = [
            SystemMessage("[task:load_context]\nYou load planning data for one depot and run date. Call a fetch tool for every missing dataset."),
            HumanMessage(json.dumps({"depot": state["depot"], "run_date": state["runDate"], "missing": missing})),
        ]
        messages = run_tool_loop(model, tools, messages)
        raw.update(loaded)
        still_missing = [name for name, (_, key) in DATASETS.items() if key not in raw]
        if still_missing:
            raise RuntimeError(f"could not load planning data: {', '.join(still_missing)}")
        ctx = PlanningContext.from_raw(raw, state["depot"], state["runDate"], first_departure)
        note = str(messages[-1].content) if messages else ""
        return {
            "raw": raw,
            "status": "DRAFTING",
            "contextSummary": ctx.summary(),
            "constraints": [],
            "redrafts": 0,
            "editMode": False,
            "history": [{"node": "load_context", "at": _now(), "note": note}],
        }

    def draft_plan(state: AgentState) -> dict[str, Any]:
        ctx = ctx_of(state)
        version = int((state.get("plan") or {}).get("version", 0)) + 1
        plan = planner.draft_plan(ctx, state.get("constraints") or [], version)
        note = f"v{version}: {len(plan['trips'])} trips, {len(plan['unassigned'])} unplaced"
        return {"plan": plan, "redraftRequested": False, "history": [{"node": "draft_plan", "at": _now(), "note": note}]}

    def check_rules(state: AgentState) -> dict[str, Any]:
        ctx = ctx_of(state)
        checks, violations = rules.check_rules(ctx, state["plan"])
        update: dict[str, Any] = {"ruleChecks": checks, "violations": violations, "redraftRequested": False}
        redrafts = int(state.get("redrafts") or 0)
        if violations and not state.get("editMode") and redrafts < max_redrafts:
            update["constraints"] = rules.constraints_for(violations, state.get("constraints") or [])
            update["redrafts"] = redrafts + 1
            update["redraftRequested"] = True
        failed = sorted({v["rule"] for v in violations})
        update["history"] = [{"node": "check_rules", "at": _now(), "note": "all 7 pass" if not failed else "violations: " + ", ".join(failed)}]
        return update

    def route_after_check(state: AgentState) -> str:
        return "draft_plan" if state.get("redraftRequested") else "rank_deferrals"

    def rank_deferrals(state: AgentState) -> dict[str, Any]:
        ctx = ctx_of(state)
        result = deferral_rules.rank_deferrals(ctx, state["plan"], state.get("violations") or [], strip_violations=not state.get("editMode"))
        checks, violations = rules.check_rules(ctx, result["plan"])
        return {
            "plan": result["plan"],
            "deferrals": result["deferrals"],
            "needsReview": result["needsReview"],
            "actions": result["actions"],
            "ruleChecks": checks,
            "violations": violations,
            "history": [{"node": "rank_deferrals", "at": _now(), "note": f"{len(result['deferrals'])} candidates, {len(result['needsReview'])} review"}],
        }

    def explain(state: AgentState) -> dict[str, Any]:
        ctx = ctx_of(state)
        plan = state["plan"]
        summary = ctx.summary()
        vehicles = sorted({t["vehicleId"] for t in plan["trips"]})
        planned = sum(len(t["orderIds"]) for t in plan["trips"])
        dem, cap = summary["chilledDemand"], summary["reeferCapacity"]
        did = [
            f"Read {summary['orders']} open orders, {summary['vehicles']} vehicles and {summary['outlets']} outlets for {state['depot']} through OData.",
        ]
        if summary["vehiclesDown"]:
            did.append(f"Left out vehicles not available today: {', '.join(summary['vehiclesDown'])}.")
        short = round(dem["m3"] - cap["m3"], 1)
        did.append(f"Chilled demand {dem['m3']} m3 against {cap['m3']} m3 of available reefers" + (f" (short {short} m3)." if short > 0 else "."))
        did.append(
            f"Packed {planned} orders onto {len(plan['trips'])} trips on {len(vehicles)} vehicles: chilled on reefers, van_only on vans, "
            "one brand and one district per trip, at most 2 trips per vehicle."
        )
        if state.get("redrafts"):
            fixed = sorted({c.get("rule", "?") for c in state.get("constraints") or []})
            did.append(f"Redrafted {state['redrafts']} time(s) to fix {', '.join(fixed)}.")
        if state.get("editMode") and state.get("lastEdits"):
            did.append("Applied your edits: " + "; ".join(state["lastEdits"]) + ".")
        did.extend(state.get("actions") or [])
        deferrals = state.get("deferrals") or []
        if deferrals:
            did.append(f"Ranked {len(deferrals)} deferral candidate(s), lowest score first: " + ", ".join(f"{d['orderId']} {d['reason']}" for d in deferrals) + ".")
        review = state.get("needsReview") or []
        if review:
            did.append("Protected and never deferred, needs your call: " + ", ".join(r["orderId"] for r in review) + ".")
        checked = [f"{'pass' if c['passed'] else 'FAIL'} - {c['label']}" + ("" if c["passed"] else f" ({c['violations']})") for c in state.get("ruleChecks") or []]
        stats = {
            "version": plan.get("version", 1),
            "depot": state["depot"],
            "runDate": state["runDate"],
            "orders": summary["orders"],
            "planned": planned,
            "trips": len(plan["trips"]),
            "vehicles": len(vehicles),
            "deferrals": len(deferrals),
            "needsReview": len(review),
        }
        ai = model.invoke(
            [
                SystemMessage("[task:explain]\nWrite the 'What it did / What it checked' panel for the dispatcher from these facts only."),
                HumanMessage(json.dumps({"did": did, "checked": checked, "stats": stats})),
            ]
        )
        return {
            "explanation": {"text": str(ai.content), "did": did, "checked": checked},
            "status": "NEEDS_APPROVAL",
            "history": [{"node": "explain", "at": _now()}],
        }

    def await_approval(state: AgentState) -> dict[str, Any]:
        resume = interrupt(
            {
                "runId": state["runId"],
                "status": "NEEDS_APPROVAL",
                "version": state["plan"].get("version", 1),
                "ask": "Approve & go live, edit, or reject. The agent cannot publish.",
            }
        )
        # Defence in depth (the API already checked): a bad or unauthorised resume is
        # recorded and ignored, and the run goes back to waiting for a dispatcher.
        problem = None
        if not isinstance(resume, dict) or resume.get("decision") not in ("approve", "edit", "reject"):
            problem = "invalid resume value"
        elif "dispatcher" not in (resume.get("roles") or []):
            problem = "only a dispatcher can resume a planning run"
        if problem:
            log.warning("resume ignored", extra={"run_id": state["runId"], "reason": problem})
            return {"status": "NEEDS_APPROVAL", "history": [{"node": "await_approval", "at": _now(), "note": f"ignored: {problem}"}]}
        record = {"decision": resume["decision"], "by": resume.get("by"), "at": _now(), "version": state["plan"].get("version", 1)}
        if resume.get("comment"):
            record["comment"] = resume["comment"]
        update: dict[str, Any] = {"decision": record, "decisions": [record], "history": [{"node": "await_approval", "at": _now(), "note": resume["decision"]}]}
        if resume["decision"] == "approve":
            update["status"] = "APPROVED"
        elif resume["decision"] == "reject":
            update["status"] = "REJECTED"
        else:
            update["status"] = "DRAFTING"
            update["pendingEdits"] = list(resume.get("edits") or [])
        return update

    def route_after_approval(state: AgentState) -> str:
        status = state.get("status")
        if status == "NEEDS_APPROVAL":
            return "await_approval"
        return "apply_edits" if status == "DRAFTING" else END

    def apply_edits(state: AgentState) -> dict[str, Any]:
        ctx = ctx_of(state)
        plan, applied = edit_rules.apply_edits(ctx, state["plan"], state.get("pendingEdits") or [])
        return {"plan": plan, "editMode": True, "lastEdits": applied, "pendingEdits": [], "history": [{"node": "apply_edits", "at": _now(), "note": "; ".join(applied)}]}

    # ---------------------------------------------------------------- wiring
    g = StateGraph(AgentState)
    g.add_node("load_context", load_context)
    g.add_node("draft_plan", draft_plan)
    g.add_node("check_rules", check_rules)
    g.add_node("rank_deferrals", rank_deferrals)
    g.add_node("explain", explain)
    g.add_node("await_approval", await_approval)
    g.add_node("apply_edits", apply_edits)
    g.add_edge(START, "load_context")
    g.add_edge("load_context", "draft_plan")
    g.add_edge("draft_plan", "check_rules")
    g.add_conditional_edges("check_rules", route_after_check, ["draft_plan", "rank_deferrals"])
    g.add_edge("rank_deferrals", "explain")
    g.add_edge("explain", "await_approval")
    g.add_conditional_edges("await_approval", route_after_approval, ["await_approval", "apply_edits", END])
    g.add_edge("apply_edits", "check_rules")
    return g.compile(checkpointer=checkpointer)
