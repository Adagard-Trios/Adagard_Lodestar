"""Gemini -> Groq -> template router against mocked HTTP (httpx.MockTransport; fake keys, no network)."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable

import httpx
import pytest

from lodestar_agent.config import Settings
from lodestar_agent.llm import RoutedChatModel, create_chat_model
from lodestar_agent.llm import tasks
from lodestar_agent.llm.cache import LLMCache
from lodestar_agent.llm.metrics import METRICS
from lodestar_agent.llm.router import LLMRouter, build_router

GEMINI_HOST = "generativelanguage.googleapis.com"
GROQ_HOST = "api.groq.com"
KEYS = {"GEMINI_API_KEY": "gemini-test-key-123", "GROQ_API_KEY": "groq-test-key-456"}


def gemini_ok(payload: dict) -> httpx.Response:
    return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": json.dumps(payload)}]}}], "usageMetadata": {"promptTokenCount": 40, "candidatesTokenCount": 8}})


def groq_ok(payload: dict | str) -> httpx.Response:
    content = payload if isinstance(payload, str) else json.dumps(payload)
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}], "usage": {"prompt_tokens": 30, "completion_tokens": 6}})


GEMINI_QUOTA = httpx.Response(429, json={"error": {"code": 429, "status": "RESOURCE_EXHAUSTED", "message": "Quota exceeded for metric generate_content_free_tier_requests, limit: GenerateRequestsPerDayPerProjectPerModel"}})
GEMINI_RATE = httpx.Response(429, json={"error": {"code": 429, "status": "RESOURCE_EXHAUSTED", "message": "Too many requests per minute"}})
SERVER_DOWN = httpx.Response(503, json={"error": {"message": "unavailable"}})


class FakeLLMs:
    """Answers Gemini and Groq calls from per-host scripts (a response, an exception, or a callable)."""

    def __init__(self, gemini: list | None = None, groq: list | None = None):
        self.scripts = {GEMINI_HOST: list(gemini or []), GROQ_HOST: list(groq or [])}
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        script = self.scripts[request.url.host]
        if not script:
            raise AssertionError(f"unexpected call to {request.url.host}")
        step = script.pop(0)
        if isinstance(step, Exception):
            raise step
        if isinstance(step, Callable) and not isinstance(step, httpx.Response):
            return step(request)
        return step

    def calls(self, host: str) -> int:
        return sum(1 for r in self.requests if r.url.host == host)

    def router(self, cache: bool = True, **env) -> LLMRouter:
        settings = Settings(AGENT_MODEL="gemini", **{**KEYS, **env})
        r = build_router(settings, http_client=httpx.Client(transport=httpx.MockTransport(self)), cache=LLMCache() if cache else None)
        r.retry_backoff_s = 0
        return r


@pytest.fixture(autouse=True)
def _metrics():
    METRICS.reset()
    yield


def intent(router: LLMRouter, request: str = "plan tomorrow for north"):
    return tasks.classify_intent(router, request, {"runDate": "2030-01-08", "orders": 7})


def test_gemini_answers_and_the_key_stays_in_the_header(caplog):
    fake = FakeLLMs(gemini=[gemini_ok({"intent": "PLAN_DAY", "confidence": 0.9})])
    with caplog.at_level(logging.DEBUG):
        result = intent(fake.router())
    assert (result.provider, result.model, result.degraded, result.fallback_reason) == ("gemini", "gemini-2.5-flash-lite", False, None)
    assert result.data.intent == "PLAN_DAY" and result.input_tokens == 40
    req = fake.requests[0]
    assert req.headers["x-goog-api-key"] == KEYS["GEMINI_API_KEY"] and KEYS["GEMINI_API_KEY"] not in str(req.url)
    body = json.loads(req.content)
    assert body["generationConfig"]["maxOutputTokens"] == 128 and body["generationConfig"]["responseMimeType"] == "application/json"
    assert KEYS["GEMINI_API_KEY"] not in caplog.text and KEYS["GROQ_API_KEY"] not in caplog.text
    assert fake.calls(GROQ_HOST) == 0
    assert METRICS.snapshot()["answersByProvider"] == {"gemini": 1}


def test_gemini_quota_goes_straight_to_groq():
    fake = FakeLLMs(gemini=[GEMINI_QUOTA], groq=[groq_ok({"intent": "REPLAN"})])
    result = intent(fake.router())
    assert (result.provider, result.fallback_reason, result.retries) == ("groq", "quota", 0)
    assert result.data.intent == "REPLAN"
    assert fake.calls(GEMINI_HOST) == 1  # a daily quota is not retried
    req = next(r for r in fake.requests if r.url.host == GROQ_HOST)
    assert req.headers["authorization"] == f"Bearer {KEYS['GROQ_API_KEY']}"
    assert json.loads(req.content)["response_format"] == {"type": "json_object"}
    snap = METRICS.snapshot()
    assert snap["fallbacks"] == 1 and snap["failures"] == {"gemini:quota": 1}


def test_rate_limit_is_retried_once_then_groq():
    fake = FakeLLMs(gemini=[GEMINI_RATE, GEMINI_RATE], groq=[groq_ok({"intent": "PLAN_DAY"})])
    result = intent(fake.router())
    assert (result.provider, result.fallback_reason, result.retries) == ("groq", "rate_limit", 1)
    assert fake.calls(GEMINI_HOST) == 2


def test_transient_error_recovers_on_the_retry():
    fake = FakeLLMs(gemini=[SERVER_DOWN, gemini_ok({"intent": "PLAN_DAY"})])
    result = intent(fake.router())
    assert (result.provider, result.retries, result.fallback_reason) == ("gemini", 1, "server")


def test_gemini_timeout_falls_back_to_groq():
    timeout = httpx.ReadTimeout("slow")
    fake = FakeLLMs(gemini=[timeout, timeout], groq=[groq_ok({"intent": "CAPACITY_RISK"})])
    result = intent(fake.router())
    assert (result.provider, result.fallback_reason) == ("groq", "timeout")


def test_both_fail_gives_the_template_and_marks_degraded():
    fake = FakeLLMs(gemini=[httpx.Response(401, json={})], groq=[SERVER_DOWN, SERVER_DOWN])
    result = intent(fake.router(), "why was O-5 deferred")
    assert (result.provider, result.degraded, result.fallback_reason) == ("template", True, "server")
    assert result.data.intent == "EXPLAIN_ONLY"  # the deterministic classifier
    assert [a["category"] for a in result.attempts] == ["auth", "server", "server"]
    assert METRICS.snapshot()["degradedCalls"] == 1


def test_invalid_schema_from_each_provider_is_never_used():
    fake = FakeLLMs(gemini=[gemini_ok({"intent": "PUBLISH_NOW"})], groq=[groq_ok("not json at all")])
    result = intent(fake.router())
    assert result.provider == "template" and result.degraded
    assert [a["category"] for a in result.attempts] == ["schema_validation", "invalid_response"]
    assert result.data.intent == "PLAN_DAY"


def test_cache_hit_and_miss():
    fake = FakeLLMs(gemini=[gemini_ok({"intent": "PLAN_DAY"}), gemini_ok({"intent": "REPLAN"})])
    router = fake.router()
    first, second = intent(router), intent(router)
    assert not first.cached and second.cached and second.data.intent == "PLAN_DAY"
    third = intent(router, "replan with mall stores first")  # different input: a miss
    assert not third.cached and third.data.intent == "REPLAN"
    assert fake.calls(GEMINI_HOST) == 2
    assert (METRICS.snapshot()["cacheHits"], METRICS.snapshot()["cacheMisses"]) == (1, 2)


def test_no_keys_means_template_and_not_degraded():
    router = build_router(Settings(AGENT_MODEL="gemini"))
    assert not router.configured and router.missing == ["GEMINI_API_KEY", "GROQ_API_KEY"]
    result = intent(router)
    assert (result.provider, result.degraded, result.fallback_reason) == ("template", False, "not_configured")


def test_only_groq_configured_is_used_alone():
    fake = FakeLLMs(groq=[groq_ok({"intent": "PLAN_DAY"})])
    settings = Settings(AGENT_MODEL="gemini", GROQ_API_KEY="groq-test-key-456")
    router = build_router(settings, http_client=httpx.Client(transport=httpx.MockTransport(fake)))
    assert router.chain == ["groq:llama-3.1-8b-instant", "template"]
    assert intent(router).provider == "groq"


def test_preferences_are_enum_only_and_unknown_district_is_dropped():
    fake = FakeLLMs(gemini=[gemini_ok({"preferences": ["PRIORITISE_MALL_WINDOWS", "PRIORITISE_DISTRICT"], "focusDistrict": "Atlantis"})])
    result = tasks.extract_preferences(fake.router(), "mall stores first, Atlantis too", ["Alpha", "Beta"], "2030-01-08")
    assert result.data.preferences == ["PRIORITISE_MALL_WINDOWS"] and result.data.focusDistrict is None


def test_phrase_that_changes_a_fact_is_rejected():
    draft = "Draft v1: 7 of 7 orders on 3 trips."
    fake = FakeLLMs(gemini=[gemini_ok({"text": "Draft v1: all 8 orders planned on 3 trips."})])
    result = tasks.phrase(fake.router(), "explain", draft)
    assert result.data.text == draft and result.fallback_reason == "fact_check" and result.provider == "template"


def test_agent_model_gemini_builds_the_routed_model():
    model = create_chat_model(Settings(AGENT_MODEL="gemini", **KEYS))
    assert isinstance(model, RoutedChatModel)
    assert model.router.chain == ["gemini:gemini-2.5-flash-lite", "groq:llama-3.1-8b-instant", "template"]
    assert KEYS["GEMINI_API_KEY"] not in repr(model.router.providers)
