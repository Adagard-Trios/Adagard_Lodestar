"""Provider abstraction for structured LLM calls (Gemini, Groq).

A provider turns (system prompt, user prompt, response schema) into a validated pydantic object or raises
:class:`LLMError` with a category the router uses to choose between one retry, the next provider and the
deterministic template. Keys live only in the provider's HTTP headers: never in prompts, logs, state or responses.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

ErrorCategory = Literal["auth", "rate_limit", "quota", "timeout", "network", "server", "invalid_response", "schema_validation", "unknown"]

#: categories worth one retry on the same provider; everything else goes straight to the next provider
TRANSIENT: frozenset[str] = frozenset({"rate_limit", "timeout", "network", "server"})

T = TypeVar("T", bound=BaseModel)


class LLMError(RuntimeError):
    def __init__(self, category: ErrorCategory, message: str, *, status: int | None = None):
        super().__init__(f"{category}: {message}")
        self.category: ErrorCategory = category
        self.status = status


@dataclass
class LLMResponse:
    data: BaseModel
    provider: str
    model: str
    latency_ms: float
    input_tokens: int = 0
    output_tokens: int = 0
    raw_text: str = field(default="", repr=False)


class LLMProvider(Protocol):
    name: str
    model: str

    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[T],
        model: str | None = None,
        temperature: float = 0.0,
        max_output_tokens: int = 256,
    ) -> LLMResponse: ...


def classify_http_error(status: int, body: str) -> ErrorCategory:
    text = body.lower()
    if status in (401, 403) or "api_key_invalid" in text or "api key not valid" in text or "invalid api key" in text:
        return "auth"
    if status == 429:
        # Gemini free tier: RESOURCE_EXHAUSTED naming a per-day quota; Groq: "tokens per day"
        return "quota" if "per day" in text or "perday" in text or "daily" in text else "rate_limit"
    if status == 408:
        return "timeout"
    if status >= 500:
        return "server"
    if status == 400:
        return "invalid_response"
    return "unknown"


def parse_structured(text: str, schema: type[T]) -> T:
    """Parse a JSON reply (tolerating a ```json fence) and validate it; never returns partial output."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    try:
        payload = json.loads(cleaned)
    except ValueError as exc:
        raise LLMError("invalid_response", "reply is not JSON") from exc
    try:
        return schema.model_validate(payload)
    except ValidationError as exc:
        raise LLMError("schema_validation", f"{exc.error_count()} schema error(s)") from exc


class HttpJsonProvider:
    """Shared HTTP plumbing: one POST, error classification, timing. Subclasses build the body and read the reply."""

    name = "base"

    def __init__(self, api_key: str, model: str, *, timeout_s: float = 20.0, max_output_tokens: int = 512, client: httpx.Client | None = None):
        if not api_key:
            raise LLMError("auth", f"{self.name} has no API key")
        self._api_key = api_key
        self.model = model
        self.timeout_s = timeout_s
        self.max_output_tokens = max_output_tokens
        self._client = client or httpx.Client(timeout=timeout_s)

    def __repr__(self) -> str:  # never shows the key
        return f"{type(self).__name__}(model={self.model!r})"

    # subclass hooks -------------------------------------------------------------
    def _request(self, system_prompt: str, user_prompt: str, model: str, temperature: float, max_tokens: int) -> tuple[str, dict[str, str], dict[str, Any]]:
        raise NotImplementedError

    def _read(self, body: dict[str, Any]) -> tuple[str, int, int]:
        raise NotImplementedError

    # ---------------------------------------------------------------------------
    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[T],
        model: str | None = None,
        temperature: float = 0.0,
        max_output_tokens: int = 256,
    ) -> LLMResponse:
        model = model or self.model
        max_tokens = min(max_output_tokens, self.max_output_tokens)
        url, headers, body = self._request(system_prompt, user_prompt, model, temperature, max_tokens)
        started = time.perf_counter()
        try:
            resp = self._client.post(url, headers=headers, json=body, timeout=self.timeout_s)
        except httpx.TimeoutException as exc:
            raise LLMError("timeout", f"{self.name} timed out after {self.timeout_s}s") from exc
        except httpx.HTTPError as exc:
            raise LLMError("network", f"{self.name} {type(exc).__name__}") from exc
        if resp.status_code != 200:
            raise LLMError(classify_http_error(resp.status_code, resp.text[:2000]), f"{self.name} HTTP {resp.status_code}", status=resp.status_code)
        try:
            text, tin, tout = self._read(resp.json())
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise LLMError("invalid_response", f"{self.name} reply has no text") from exc
        data = parse_structured(text, response_schema)
        return LLMResponse(data, self.name, model, round((time.perf_counter() - started) * 1000, 1), tin, tout, text)
