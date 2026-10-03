"""Lodestar codes (FRESH, REAR_DOCK, PELIYAGODA, CHILLED) to the spellings the datathon models were trained on
(Fresh, rear_dock, Peliyagoda, reefer)."""

from __future__ import annotations

from collections.abc import Iterable


def _key(value: str) -> str:
    return str(value).strip().lower().replace(" ", "_").replace("-", "_")


def canon(value: str | None, known: Iterable[str] | None, default_lower: bool = True) -> str | None:
    """The training spelling of ``value`` when it matches one case-insensitively; otherwise the value itself
    (lower-cased for enum-like codes), which the models treat as an unseen category."""
    if value is None:
        return None
    if known:
        table = {_key(k): k for k in known}
        hit = table.get(_key(value))
        if hit is not None:
            return hit
    return str(value).strip().lower() if default_lower else str(value).strip()


def vehicle_temp(value: str) -> str:
    """Lodestar's vehicle tempClass CHILLED is a reefer; AMBIENT stays ambient."""
    v = _key(value)
    return "reefer" if v in ("chilled", "reefer") else "ambient"


def temp_requirement(value: str) -> str:
    return "chilled" if _key(value) in ("chilled", "reefer") else "ambient"
