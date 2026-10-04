"""RoutedChatModel: the graph's chat model when Gemini / Groq are configured (AGENT_MODEL=gemini).

Same contract as :class:`PhrasingChatModel`, routed through :class:`LLMRouter` (Gemini -> Groq -> template):

* ``[task:load_context]`` - the deterministic mock (which datasets to fetch is not a judgement call).
* ``[task:ask]``          - the LLM picks the tool calls (validated: known tool, ids that exist in the run,
                            enum op/reason); the mock's picks are the template. The answer is the mock's grounded
                            text from the tool results, phrased by the LLM under a fact check.
* ``[task:explain]``      - the mock's deterministic panel, phrased by the LLM under a fact check.

Each phrased reply carries ``response_metadata["llm"]`` (provider, model, fallback reason, degraded, tokens).
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.utils.function_calling import convert_to_openai_tool
from pydantic import ConfigDict, Field

from ..domain.deferrals import REASON_CODES
from . import tasks
from .mock import MockChatModel, _call_id, _json
from .phrasing import _question, _task
from .router import LLMRouter

ID_ARGS = {"order_id": "orderIds", "vehicle_id": "vehicleIds", "outlet_id": "outletIds"}


def validate_calls(calls: list[tasks.ToolCallOut], snapshot: dict[str, Any], tools: dict[str, Any]) -> list[dict[str, Any]]:
    """Keep only calls to offered tools whose ids exist in the run and whose enums are valid."""
    out: list[dict[str, Any]] = []
    for call in calls:
        if call.name not in tools:
            continue
        allowed = set(tools[call.name].get("parameters", {}).get("properties", {}))
        args = {k: v for k, v in call.args.items() if k in allowed and v is not None}
        ok = all(str(args[k]) in set(snapshot.get(key, [])) for k, key in ID_ARGS.items() if k in args)
        required = tools[call.name].get("parameters", {}).get("required", [])
        ok = ok and all(r in args for r in required)
        if call.name == "propose_edit":
            ok = ok and args.get("op") in ("move", "defer")
            ok = ok and (args.get("reason") is None or args.get("reason") in REASON_CODES)
            ok = ok and (args.get("trip_no") is None or args.get("trip_no") in (1, 2))
            ok = ok and (args.get("op") != "move" or "vehicle_id" in args)
            ok = ok and (args.get("op") != "defer" or "reason" in args)
        if ok:
            out.append({"name": call.name, "args": args, "id": _call_id(call.name, args), "type": "tool_call"})
    return out


class RoutedChatModel(BaseChatModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    router: LLMRouter
    fallback: MockChatModel = Field(default_factory=MockChatModel)
    model_name: str = "lodestar-routed"

    @property
    def _llm_type(self) -> str:
        return "lodestar-routed"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {"model_name": self.model_name, "chain": self.router.chain}

    def bind_tools(self, tools: Sequence[Any], *, tool_choice: Any = None, **kwargs: Any):  # type: ignore[override]
        return self.bind(tools=[convert_to_openai_tool(t) for t in tools], **kwargs)

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        decided = self.fallback._generate(messages, stop=stop, run_manager=run_manager, **kwargs)
        message = decided.generations[0].message
        task = _task(messages)
        if task == "ask" and isinstance(message, AIMessage) and message.tool_calls:
            return self._choose_tools(messages, message, kwargs)
        if task not in ("ask", "explain") or not isinstance(message, AIMessage) or message.tool_calls or not str(message.content).strip():
            return decided
        meta = _json(str(messages[0].content).partition("\n")[2])
        result = tasks.phrase(
            self.router, task, str(message.content), _question(messages) if task == "ask" else "",
            run_date=str(meta.get("runDate", "")), plan_version=meta.get("version", ""),
        )
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=result.data.text, response_metadata={"llm": result.audit()}))])

    def _choose_tools(self, messages: list[BaseMessage], template_msg: AIMessage, kwargs: dict[str, Any]) -> ChatResult:
        tools = {t["function"]["name"]: t["function"] for t in kwargs.get("tools") or []}
        snapshot = _json(str(messages[0].content).partition("\n")[2])
        last_human = max(i for i, m in enumerate(messages) if isinstance(m, HumanMessage))
        if any(isinstance(m, ToolMessage) for m in messages[last_human + 1 :]):
            return ChatResult(generations=[ChatGeneration(message=template_msg)])
        template = tasks.ToolPlanOut(calls=[tasks.ToolCallOut(name=c["name"], args=c["args"]) for c in template_msg.tool_calls])
        result = tasks.select_tools(self.router, str(messages[last_human].content), template)
        calls = validate_calls(result.data.calls, snapshot, tools)
        audit = result.audit()
        if not calls:  # nothing valid from the LLM: the deterministic picks
            calls = list(template_msg.tool_calls)
            if result.provider != "template":
                audit = {**audit, "fallbackReason": "invalid_tool_choice", "provider": "template"}
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content="", tool_calls=calls, response_metadata={"llm": audit}))])
