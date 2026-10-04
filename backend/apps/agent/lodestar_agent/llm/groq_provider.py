"""Groq (OpenAI-compatible chat completions, JSON object mode). Bearer key in the header only."""

from __future__ import annotations

from typing import Any

from .base import HttpJsonProvider

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(HttpJsonProvider):
    name = "groq"

    def _request(self, system_prompt: str, user_prompt: str, model: str, temperature: float, max_tokens: int):
        body = {
            "model": model,
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        return GROQ_URL, {"Authorization": f"Bearer {self._api_key}"}, body

    def _read(self, body: dict[str, Any]) -> tuple[str, int, int]:
        text = body["choices"][0]["message"]["content"]
        usage = body.get("usage") or {}
        return str(text), int(usage.get("prompt_tokens") or 0), int(usage.get("completion_tokens") or 0)
