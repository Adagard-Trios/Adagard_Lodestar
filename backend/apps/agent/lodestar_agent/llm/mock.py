"""MockChatModel: a deterministic LangChain chat model.

It behaves like a tool-calling LLM without calling one:

* ``[task:load_context]`` - emits one tool call per missing dataset, then summarises the tool results.
* ``[task:ask]``          - picks lookup / proposal tools from the question and the ids it recognises
                            in the run snapshot, then answers only from the tool results (grounded).
* ``[task:explain]``      - renders the "What it did / What it checked" text from the facts it is given.

The task tag is the first line of the system message; the payload is JSON.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Sequence
from typing import Any

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.utils.function_calling import convert_to_openai_tool

TASK_RE = re.compile(r"^\[task:([a-z_]+)\]")
ID_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_\-]*[0-9][A-Za-z0-9_\-]*")
REASON_WORDS = {
    "fuel": "FUEL",
    "window": "WINDOW",
    "access": "ACCESS",
    "reefer": "CAP_REEFER",
    "workshop": "VEH_DOWN",
    "down": "VEH_DOWN",
}


def _call_id(name: str, args: dict[str, Any]) -> str:
    digest = hashlib.sha1(f"{name}:{json.dumps(args, sort_keys=True)}".encode()).hexdigest()[:12]
    return f"call_{digest}"


def _json(text: Any) -> dict[str, Any]:
    if not isinstance(text, str):
        return {}
    try:
        data = json.loads(text)
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


class MockChatModel(BaseChatModel):
    """Deterministic, template-based stand-in for the production LLM."""

    model_name: str = "lodestar-mock-1"

    @property
    def _llm_type(self) -> str:
        return "lodestar-mock"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {"model_name": self.model_name}

    def bind_tools(self, tools: Sequence[Any], *, tool_choice: Any = None, **kwargs: Any):  # type: ignore[override]
        return self.bind(tools=[convert_to_openai_tool(t) for t in tools], **kwargs)

    # ------------------------------------------------------------------ core
    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        tools = {t["function"]["name"]: t["function"] for t in kwargs.get("tools") or []}
        system = next((m for m in messages if isinstance(m, SystemMessage)), None)
        header, _, payload = (str(system.content) if system else "").partition("\n")
        match = TASK_RE.match(header)
        task = match.group(1) if match else "chat"
        context = _json(payload)
        last_human = max((i for i, m in enumerate(messages) if isinstance(m, HumanMessage)), default=-1)
        human = messages[last_human] if last_human >= 0 else HumanMessage(content="")
        results = [m for m in messages[last_human + 1 :] if isinstance(m, ToolMessage)]

        if task == "load_context":
            message = self._load_context(_json(human.content), tools, results)
        elif task == "ask":
            message = self._ask(str(human.content), context, tools, results)
        elif task == "explain":
            message = AIMessage(content=self._explain(_json(human.content)))
        else:
            message = AIMessage(content="I draft delivery plans, explain them and answer questions about them. I never publish a plan.")
        return ChatResult(generations=[ChatGeneration(message=message)])

    # ------------------------------------------------------------------ load_context
    @staticmethod
    def _tool_calls(picks: list[tuple[str, dict[str, Any]]]) -> list[dict[str, Any]]:
        return [{"name": n, "args": a, "id": _call_id(n, a), "type": "tool_call"} for n, a in picks]

    def _load_context(self, facts: dict[str, Any], tools: dict[str, Any], results: list[ToolMessage]) -> AIMessage:
        if results:
            parts = []
            for r in results:
                data = _json(r.content)
                parts.append(f"{data.get('count', 0)} {data.get('entitySet', r.name)}" if data else f"{r.name}: {r.content}")
            return AIMessage(content="Loaded " + ", ".join(parts) + ".")
        picks = []
        for dataset in facts.get("missing", []):
            name = f"fetch_{dataset}"
            if name in tools:
                props = tools[name].get("parameters", {}).get("properties", {})
                picks.append((name, {k: facts[k] for k in props if k in facts}))
        if not picks:
            return AIMessage(content="All planning data is already loaded.")
        return AIMessage(content="", tool_calls=self._tool_calls(picks))

    # ------------------------------------------------------------------ ask
    def _ask(self, question: str, ctx: dict[str, Any], tools: dict[str, Any], results: list[ToolMessage]) -> AIMessage:
        if results:
            return AIMessage(content=self._grounded_answer(ctx, results))
        tokens = ID_RE.findall(question)
        orders = [t for t in tokens if t in set(ctx.get("orderIds", []))]
        vehicles = [t for t in tokens if t in set(ctx.get("vehicleIds", []))]
        outlets = [t for t in tokens if t in set(ctx.get("outletIds", []))]
        q = question.lower()
        picks: list[tuple[str, dict[str, Any]]] = []
        if re.search(r"\bdefer", q) and orders:
            reason = next((code for word, code in REASON_WORDS.items() if word in q), "CAP_TIME")
            picks.append(("propose_edit", {"op": "defer", "order_id": orders[0], "reason": reason}))
        elif re.search(r"\b(move|put|swap)\b", q) and orders and vehicles:
            args: dict[str, Any] = {"op": "move", "order_id": orders[0], "vehicle_id": vehicles[0]}
            trip = re.search(r"\btrip\s*([12])\b", q)
            if trip:
                args["trip_no"] = int(trip.group(1))
            picks.append(("propose_edit", args))
        else:
            picks += [("explain_order", {"order_id": o}) for o in orders]
            picks += [("lookup_vehicle", {"vehicle_id": v}) for v in vehicles]
            picks += [("lookup_outlet", {"outlet_id": s}) for s in outlets]
            if not orders and re.search(r"defer|protect|bump|left over", q):
                picks.append(("list_deferrals", {}))
            if re.search(r"rule|check|violat|broke|break|legal", q):
                picks.append(("rule_checks", {}))
            if re.search(r"capacity|short|reefer|chilled|space", q):
                picks.append(("capacity", {}))
            if not picks:
                picks.append(("plan_summary", {}))
        picks = [(n, a) for n, a in picks if n in tools]
        if not picks:
            return AIMessage(content="I can't look that up for this run.")
        return AIMessage(content="", tool_calls=self._tool_calls(picks))

    @staticmethod
    def _grounded_answer(ctx: dict[str, Any], results: list[ToolMessage]) -> str:
        lines = [f"From draft v{ctx.get('version', 1)} for {ctx.get('depot', '?')} on {ctx.get('runDate', '?')}:"]
        proposal = False
        for r in results:
            data = _json(r.content)
            lines.append(f"- {data.get('summary') or r.content}")
            proposal = proposal or bool(data.get("proposal"))
        if proposal:
            lines.append("I've drafted this as a proposal only. It changes nothing until you apply it as an edit and approve the plan.")
        return "\n".join(lines)

    # ------------------------------------------------------------------ explain
    @staticmethod
    def _explain(facts: dict[str, Any]) -> str:
        stats = facts.get("stats", {})
        head = (
            f"Draft v{stats.get('version', 1)} for {stats.get('depot', '?')} on {stats.get('runDate', '?')}: "
            f"{stats.get('planned', 0)} of {stats.get('orders', 0)} orders on {stats.get('trips', 0)} trips "
            f"using {stats.get('vehicles', 0)} vehicles; {stats.get('deferrals', 0)} deferral candidates, "
            f"{stats.get('needsReview', 0)} for review."
        )
        did = "\n".join(f"- {line}" for line in facts.get("did", [])) or "- Nothing to change."
        checked = "\n".join(f"- {line}" for line in facts.get("checked", []))
        return (
            f"{head}\n\nWhat it did\n{did}\n\nWhat it checked\n{checked}\n\n"
            "Draft only: I can't publish, message stores or unlock protected outlets. Review it and approve on the plan board."
        )
