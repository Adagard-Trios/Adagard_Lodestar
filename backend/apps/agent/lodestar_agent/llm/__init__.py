"""Chat model selection (AGENT_MODEL)."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.language_models import BaseChatModel

from ..config import Settings
from .mock import MockChatModel
from .phrasing import PhrasingChatModel

__all__ = ["MockChatModel", "ModelNotConfiguredError", "PhrasingChatModel", "chat_model_or_mock", "create_chat_model"]


log = logging.getLogger(__name__)


class ModelNotConfiguredError(RuntimeError):
    pass


AZURE_VARS = ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_DEPLOYMENT", "AZURE_OPENAI_API_VERSION")


def create_chat_model(settings: Settings, http_client: Any = None) -> BaseChatModel:
    """``mock`` (default) or ``azure-openai``. The graph does not change between them.

    ``azure-openai`` wraps Azure OpenAI in :class:`PhrasingChatModel`: the deterministic mock still makes every
    decision and the LLM only words explanations and answers, falling back to the mock's text on any error.
    ``http_client`` replaces the HTTP client of the Azure SDK (tests).
    """
    choice = settings.agent_model
    if choice == "mock":
        return MockChatModel()
    if choice in ("azure-openai", "azure_openai", "azure"):
        values = (
            settings.azure_openai_endpoint,
            settings.azure_openai_api_key,
            settings.azure_openai_deployment,
            settings.azure_openai_api_version,
        )
        missing = [name for name, val in zip(AZURE_VARS, values, strict=True) if not val]
        if missing:
            raise ModelNotConfiguredError(
                "AGENT_MODEL=azure-openai is not configured yet: set " + ", ".join(missing) + " (or use AGENT_MODEL=mock)"
            )
        try:
            from langchain_openai import AzureChatOpenAI
        except ImportError as exc:  # pragma: no cover - pinned in requirements.txt
            raise ModelNotConfiguredError("AGENT_MODEL=azure-openai needs the 'langchain-openai' package in the image") from exc
        llm = AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            azure_deployment=settings.azure_openai_deployment,
            api_version=settings.azure_openai_api_version,
            temperature=0,
            timeout=settings.azure_openai_timeout_s,
            max_retries=1,
            **({"http_client": http_client} if http_client is not None else {}),
        )
        # planning stays deterministic (the mock decides); the LLM only phrases, and the mock's text is the fallback
        return PhrasingChatModel(primary=llm)
    raise ModelNotConfiguredError(f"Unknown AGENT_MODEL '{choice}' (expected 'mock' or 'azure-openai')")


def chat_model_or_mock(settings: Settings) -> BaseChatModel:
    """The configured model, or the deterministic mock (with a warning) when AGENT_MODEL cannot be set up.

    GET /config still reports the configured model and what is missing, so the desk shows why the mock is answering.
    """
    try:
        return create_chat_model(settings)
    except ModelNotConfiguredError as exc:
        log.warning("falling back to the deterministic mock model: %s", exc)
        return MockChatModel()
