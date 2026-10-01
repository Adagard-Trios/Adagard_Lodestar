"""Chat model selection (AGENT_MODEL)."""

from __future__ import annotations

from langchain_core.language_models import BaseChatModel

from ..config import Settings
from .mock import MockChatModel

__all__ = ["MockChatModel", "ModelNotConfiguredError", "create_chat_model"]


class ModelNotConfiguredError(RuntimeError):
    pass


AZURE_VARS = ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_DEPLOYMENT", "AZURE_OPENAI_API_VERSION")


def create_chat_model(settings: Settings) -> BaseChatModel:
    """``mock`` (default) or ``azure-openai``. The graph does not change between them."""
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
        try:  # optional dependency, not installed in the default image
            from langchain_openai import AzureChatOpenAI  # type: ignore[import-not-found]
        except ImportError as exc:
            raise ModelNotConfiguredError("AGENT_MODEL=azure-openai needs the 'langchain-openai' package in the image") from exc
        return AzureChatOpenAI(  # pragma: no cover - never exercised without real credentials
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            azure_deployment=settings.azure_openai_deployment,
            api_version=settings.azure_openai_api_version,
            temperature=0,
        )
    raise ModelNotConfiguredError(f"Unknown AGENT_MODEL '{choice}' (expected 'mock' or 'azure-openai')")
