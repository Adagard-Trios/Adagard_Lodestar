"""Process-wide LLM / planner counters, logged per call and served read-only at GET /config (no secrets)."""

from __future__ import annotations

import threading
from collections import Counter
from typing import Any


class LLMMetrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        self.calls: Counter[str] = Counter()  # answers per provider (incl. "template")
        self.failures: Counter[str] = Counter()  # "provider:category"
        self.counts: Counter[str] = Counter()  # fallbacks, degraded, degradedRuns, cacheHits, cacheMisses, retries, repairs
        self.latency_ms_total = 0.0
        self.tokens_in = 0
        self.tokens_out = 0

    def incr(self, name: str, n: int = 1) -> None:
        with self._lock:
            self.counts[name] += n

    def answered(self, provider: str, latency_ms: float = 0.0, tokens_in: int = 0, tokens_out: int = 0) -> None:
        with self._lock:
            self.calls[provider] += 1
            self.latency_ms_total += latency_ms
            self.tokens_in += tokens_in
            self.tokens_out += tokens_out

    def failed(self, provider: str, category: str) -> None:
        with self._lock:
            self.failures[f"{provider}:{category}"] += 1

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            llm_calls = sum(v for k, v in self.calls.items() if k != "template")
            total = sum(self.calls.values())
            return {
                "answersByProvider": dict(self.calls),
                "failures": dict(self.failures),
                "fallbacks": self.counts["fallbacks"],
                "fallbackRate": round(self.counts["fallbacks"] / total, 3) if total else 0.0,
                "degradedCalls": self.counts["degraded"],
                "degradedRuns": self.counts["degradedRuns"],
                "retries": self.counts["retries"],
                "cacheHits": self.counts["cacheHits"],
                "cacheMisses": self.counts["cacheMisses"],
                "repairs": self.counts["repairs"],
                "avgLatencyMs": round(self.latency_ms_total / llm_calls, 1) if llm_calls else 0.0,
                "tokensIn": self.tokens_in,
                "tokensOut": self.tokens_out,
            }


METRICS = LLMMetrics()
