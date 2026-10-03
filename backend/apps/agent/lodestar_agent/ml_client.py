"""Client of the internal ML service (POST /predict/stops: the Task 1 model).

Never a dependency: ML_URL empty disables it, and any failure (timeout, refused, non-200) returns None so the
caller keeps its heuristic. A failure is logged once per outage (again only after a success).
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from .config import get_settings

log = logging.getLogger("lodestar_agent.ml")

_failing = False


def _fail(why: str) -> None:
    global _failing
    if not _failing:
        log.warning("ML model not used, heuristic instead: %s", why)
    _failing = True


def enabled() -> bool:
    return bool(get_settings().ml_url.strip())


def predict_stops(stops: list[dict[str, Any]]) -> dict[str, dict[str, Any]] | None:
    """Model predictions by stopId, or None (disabled or failed)."""
    global _failing
    settings = get_settings()
    url = settings.ml_url.strip().rstrip("/")
    if not url or not stops:
        return None
    try:
        r = httpx.post(f"{url}/predict/stops", json={"stops": stops}, timeout=settings.ml_timeout_s)
    except httpx.HTTPError as exc:
        _fail(f"/predict/stops: {type(exc).__name__}: {exc}")
        return None
    if r.status_code != 200:
        _fail(f"/predict/stops: HTTP {r.status_code} {r.text[:200]}")
        return None
    try:
        preds = {str(p["stopId"]): p for p in r.json()["predictions"]}
    except (ValueError, KeyError, TypeError) as exc:
        _fail(f"/predict/stops: unreadable answer ({exc})")
        return None
    if _failing:
        log.info("ML service answering again")
    _failing = False
    return preds
