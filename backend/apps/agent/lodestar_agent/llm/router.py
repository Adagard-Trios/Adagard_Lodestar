"""LLMRouter: Gemini -> Groq -> deterministic template, with one retry for transient errors.

Graph nodes never call a provider: they call :meth:`LLMRouter.generate_structured` with a task, a strict
response schema and a ``template`` (the deterministic answer). The router

* answers from the cache for cacheable tasks (intent, preferences, summary),
* tries each configured provider in order, retrying once only for rate_limit / timeout / network / server,
* moves to the next provider on any failure (auth, quota, invalid JSON, schema violation, ...),
* returns the template when every provider failed (``degraded=True``) or none is configured (``degraded=False``),
* logs and counts provider, model, fallback reason, latency, tokens and retries. It never logs keys, and logs
  prompts / responses only when LLM_LOG_PROMPTS / LLM_LOG_RESPONSES are on.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel

from ..config import Settings
from .base import TRANSIENT, LLMError, LLMProvider
from .cache import CACHEABLE_TASKS, LLMCache, cache_key
from .metrics import METRICS, LLMMetrics

log = logging.getLogger("lodestar_agent.llm")

T = TypeVar("T", bound=BaseModel)


@dataclass
class RouterResult:
    data: Any
    task: str
    provider: str  # "gemini" | "groq" | "template"
    model: str | None
    fallback_reason: str | None = None
    degraded: bool = False
    cached: bool = False
    retries: int = 0
    latency_ms: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    attempts: list[dict[str, str]] = field(default_factory=list)

    def audit(self) -> dict[str, Any]:
        """What is stored on the run (state / audit): no prompts, no keys."""
        return {
            "task": self.task,
            "provider": self.provider,
            "model": self.model,
            "fallbackReason": self.fallback_reason,
            "degraded": self.degraded,
            "cached": self.cached,
            "retries": self.retries,
            "latencyMs": self.latency_ms,
            "tokensIn": self.input_tokens,
            "tokensOut": self.output_tokens,
            "attempts": self.attempts,
        }


class LLMRouter:
    def __init__(
        self,
        providers: list[LLMProvider] | None = None,
        *,
        max_retries: int = 1,
        enable_fallback: bool = True,
        temperature: float = 0.0,
        cache: LLMCache | None = None,
        metrics: LLMMetrics = METRICS,
        log_prompts: bool = False,
        log_responses: bool = False,
        retry_backoff_s: float = 0.5,
        missing: list[str] | None = None,
    ):
        self.providers = list(providers or [])
        if not enable_fallback:
            self.providers = self.providers[:1]
        self.max_retries = max(0, max_retries)
        self.temperature = temperature
        self.cache = cache
        self.metrics = metrics
        self.log_prompts = log_prompts
        self.log_responses = log_responses
        self.retry_backoff_s = retry_backoff_s
        self.missing = missing or []

    @property
    def configured(self) -> bool:
        return bool(self.providers)

    @property
    def chain(self) -> list[str]:
        return [f"{p.name}:{p.model}" for p in self.providers] + ["template"]

    def generate_structured(
        self,
        task: str,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[T],
        *,
        template: Callable[[], T],
        max_output_tokens: int = 256,
        prompt_version: str = "v1",
        cache_payload: Any = None,
        planning_date: str = "",
        plan_version: Any = "",
        run_id: str | None = None,
    ) -> RouterResult:
        key = None
        if self.cache is not None and task in CACHEABLE_TASKS and self.providers:
            key = cache_key(task, prompt_version, ",".join(self.chain), cache_payload if cache_payload is not None else user_prompt, planning_date, plan_version)
            hit = self.cache.get(key)
            if hit is not None:
                self.metrics.incr("cacheHits")
                result = RouterResult(response_schema.model_validate(hit["data"]), task, hit["provider"], hit["model"], cached=True)
                self._log(result, run_id)
                return result
            self.metrics.incr("cacheMisses")

        attempts: list[dict[str, str]] = []
        retries = 0
        for index, provider in enumerate(self.providers):
            for attempt in range(1 + self.max_retries):
                if self.log_prompts:
                    log.debug("llm prompt", extra={"task": task, "provider": provider.name, "system": system_prompt, "user": user_prompt})
                try:
                    resp = provider.generate_structured(
                        system_prompt, user_prompt, response_schema, temperature=self.temperature, max_output_tokens=max_output_tokens
                    )
                except LLMError as exc:
                    attempts.append({"provider": provider.name, "category": exc.category})
                    self.metrics.failed(provider.name, exc.category)
                    log.warning("llm provider failed", extra={"task": task, "provider": provider.name, "category": exc.category, "run_id": run_id})
                    if exc.category in TRANSIENT and attempt < self.max_retries:
                        retries += 1
                        self.metrics.incr("retries")
                        if self.retry_backoff_s:
                            time.sleep(self.retry_backoff_s)
                        continue
                    break
                except Exception as exc:  # noqa: BLE001 - an unexpected provider bug never fails a run
                    attempts.append({"provider": provider.name, "category": "unknown"})
                    self.metrics.failed(provider.name, "unknown")
                    log.warning("llm provider error", extra={"task": task, "provider": provider.name, "error": type(exc).__name__, "run_id": run_id})
                    break
                if index:
                    self.metrics.incr("fallbacks")
                self.metrics.answered(provider.name, resp.latency_ms, resp.input_tokens, resp.output_tokens)
                if self.log_responses:
                    log.debug("llm response", extra={"task": task, "provider": provider.name, "text": resp.raw_text})
                result = RouterResult(
                    resp.data,
                    task,
                    provider.name,
                    resp.model,
                    fallback_reason=attempts[0]["category"] if attempts else None,
                    retries=retries,
                    latency_ms=resp.latency_ms,
                    input_tokens=resp.input_tokens,
                    output_tokens=resp.output_tokens,
                    attempts=attempts,
                )
                if key is not None:
                    self.cache.put(key, {"data": resp.data.model_dump(mode="json"), "provider": resp.provider, "model": resp.model})  # type: ignore[union-attr]
                self._log(result, run_id)
                return result

        degraded = bool(self.providers)
        if degraded:
            self.metrics.incr("fallbacks")
            self.metrics.incr("degraded")
        self.metrics.answered("template")
        result = RouterResult(
            template(),
            task,
            "template",
            None,
            fallback_reason=(attempts[-1]["category"] if attempts else "not_configured"),
            degraded=degraded,
            retries=retries,
            attempts=attempts,
        )
        self._log(result, run_id)
        return result

    @staticmethod
    def _log(result: RouterResult, run_id: str | None) -> None:
        log.info("llm call", extra={"run_id": run_id, **result.audit()})


def build_router(settings: Settings, http_client: httpx.Client | None = None, cache: LLMCache | None = None) -> LLMRouter:
    """Providers from LLM_PRIMARY_PROVIDER / LLM_FALLBACK_PROVIDER, skipping any without an API key."""
    from .gemini_provider import GeminiProvider
    from .groq_provider import GroqProvider

    providers: list[LLMProvider] = []
    missing: list[str] = []
    order = [settings.llm_primary_provider]
    if settings.llm_enable_fallback and settings.llm_fallback_provider and settings.llm_fallback_provider != settings.llm_primary_provider:
        order.append(settings.llm_fallback_provider)
    for name in order:
        if name == "gemini":
            key = settings.gemini_api_key.get_secret_value() if settings.gemini_api_key else ""
            if not key:
                missing.append("GEMINI_API_KEY")
                continue
            providers.append(GeminiProvider(key, settings.gemini_model, timeout_s=settings.gemini_timeout_s, max_output_tokens=settings.gemini_max_output_tokens, client=http_client))
        elif name == "groq":
            key = settings.groq_api_key.get_secret_value() if settings.groq_api_key else ""
            if not key:
                missing.append("GROQ_API_KEY")
                continue
            providers.append(GroqProvider(key, settings.groq_model, timeout_s=settings.groq_timeout_s, max_output_tokens=settings.groq_max_output_tokens, client=http_client))
    return LLMRouter(
        providers,
        max_retries=settings.llm_max_retries,
        enable_fallback=settings.llm_enable_fallback,
        temperature=settings.llm_temperature,
        cache=(cache or LLMCache()) if settings.llm_enable_cache else None,
        log_prompts=settings.llm_log_prompts,
        log_responses=settings.llm_log_responses,
        missing=missing,
    )
