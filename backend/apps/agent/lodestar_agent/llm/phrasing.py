"""PhrasingChatModel: a real LLM that only phrases, over the deterministic MockChatModel.

Every decision stays with the mock: which datasets ``load_context`` fetches, which tools ``ask`` calls (lookups
and edit proposals) and the facts in every answer. The LLM (Azure OpenAI) only rewrites the finished text of an
``explain`` panel or an ``ask`` answer for the dispatcher. Any error, timeout or empty reply from the LLM falls
back to the mock's own text, so a run never fails or changes because of the LLM.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Any

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.utils.function_calling import convert_to_openai_tool
from pydantic import Field

from .mock import TASK_RE, MockChatModel

log = logging.getLogger(__name__)

#: tasks whose final text the LLM may phrase (load_context summaries stay the mock's)
PHRASED_TASKS = frozenset({"explain", "ask"})

PHRASE_PROMPT = (
    "You write for a delivery dispatcher at a Sri Lankan retail depot. Rewrite the DRAFT below so it reads clearly "
    "and briefly. Use only the facts in the DRAFT: keep every number, order, vehicle, outlet and rule id exactly as "
    "written, add no new facts, recommendations or promises, and keep its section headings and bullet lists. "
    "Never say a plan was published: the agent drafts, a human approves. Reply with the rewritten text only."
)


def _task(messages: Sequence[BaseMessage]) -> str:
    system = next((m for m in messages if isinstance(m, SystemMessage)), None)
    match = TASK_RE.match(str(system.content) if system else "")
    return match.group(1) if match else "chat"


def _question(messages: Sequence[BaseMessage]) -> str:
    human = [m for m in messages if isinstance(m, HumanMessage)]
    return str(human[-1].content) if human else ""


class PhrasingChatModel(BaseChatModel):
    """Deterministic decisions from ``fallback``; wording of explanations and answers from ``primary``."""

    primary: Any
    fallback: MockChatModel = Field(default_factory=MockChatModel)
    model_name: str = "lodestar-phrasing"

    @property
    def _llm_type(self) -> str:
        return "lodestar-phrasing"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {"model_name": self.model_name, "primary": getattr(self.primary, "deployment_name", None) or type(self.primary).__name__}

    def bind_tools(self, tools: Sequence[Any], *, tool_choice: Any = None, **kwargs: Any):  # type: ignore[override]
        # tools are offered to the deterministic model only: the LLM never picks a tool
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
        if task not in PHRASED_TASKS or not isinstance(message, AIMessage) or message.tool_calls or not str(message.content).strip():
            return decided
        draft = str(message.content)
        phrased = self.phrase(task, draft, _question(messages) if task == "ask" else "")
        if phrased is None:
            return decided
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=phrased, response_metadata={"phrasedBy": self._llm_name()}))])

    def phrase(self, task: str, draft: str, question: str = "") -> str | None:
        """The LLM's wording of ``draft``, or None (use the draft) on any error or an empty reply."""
        human = (f"Question from the dispatcher: {question}\n\n" if question else "") + f"DRAFT ({task}):\n{draft}"
        try:
            reply = self.primary.invoke([SystemMessage(PHRASE_PROMPT), HumanMessage(human)])
        except Exception as exc:  # noqa: BLE001 - any LLM failure keeps the deterministic text
            log.warning("LLM phrasing failed, using the deterministic text", extra={"task": task, "error": type(exc).__name__})
            return None
        text = reply.content if isinstance(reply, BaseMessage) else reply
        if not isinstance(text, str) or not text.strip():
            log.warning("LLM phrasing returned no text, using the deterministic text", extra={"task": task})
            return None
        return text.strip()

    def _llm_name(self) -> str:
        return str(getattr(self.primary, "deployment_name", None) or type(self.primary).__name__)
