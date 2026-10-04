"""Google Gemini (generativelanguage REST, JSON mode). The key goes in the x-goog-api-key header, never the URL."""

from __future__ import annotations

from typing import Any

from .base import HttpJsonProvider

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiProvider(HttpJsonProvider):
    name = "gemini"

    def _request(self, system_prompt: str, user_prompt: str, model: str, temperature: float, max_tokens: int):
        body: dict[str, Any] = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens, "responseMimeType": "application/json"},
        }
        return GEMINI_URL.format(model=model), {"x-goog-api-key": self._api_key}, body

    def _read(self, body: dict[str, Any]) -> tuple[str, int, int]:
        parts = body["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
        usage = body.get("usageMetadata") or {}
        return text, int(usage.get("promptTokenCount") or 0), int(usage.get("candidatesTokenCount") or 0)
