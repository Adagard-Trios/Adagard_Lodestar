"""In-process LRU cache for structured LLM answers (intent, preferences, explanations only).

Key = task, prompt version, model chain, hash of the compact input, planning date and plan version, so a new
plan version or a prompt change never reuses an old answer.
"""

from __future__ import annotations

import hashlib
import json
import threading
from collections import OrderedDict
from typing import Any

CACHEABLE_TASKS = frozenset({"intent", "preferences", "summary"})


def input_hash(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()[:24]


def cache_key(task: str, prompt_version: str, model: str, payload: Any, planning_date: str = "", plan_version: Any = "") -> str:
    return "|".join((task, prompt_version, model, input_hash(payload), planning_date, str(plan_version)))


class LLMCache:
    def __init__(self, maxsize: int = 256):
        self.maxsize = maxsize
        self._data: OrderedDict[str, dict[str, Any]] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> dict[str, Any] | None:
        with self._lock:
            if key not in self._data:
                return None
            self._data.move_to_end(key)
            return self._data[key]

    def put(self, key: str, value: dict[str, Any]) -> None:
        with self._lock:
            self._data[key] = value
            self._data.move_to_end(key)
            while len(self._data) > self.maxsize:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()
