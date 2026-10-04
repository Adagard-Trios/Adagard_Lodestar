"""Approval binding: an approval is for one exact plan, validation and simulation.

The record carries the approver, run id, plan version and SHA-256 hashes of the plan, its validation and its
simulation. Any change to the plan (an edit, a redraft) changes the hashes, so an older approval no longer matches.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any


def digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


def hashes(state: dict[str, Any]) -> dict[str, str]:
    return {
        "planHash": digest(state.get("plan") or {}),
        "validationHash": digest(state.get("validation") or {}),
        "simulationHash": digest(state.get("simulation") or {}),
    }


def bind(state: dict[str, Any], by: str | None, at: str) -> dict[str, Any]:
    return {"runId": state.get("runId"), "version": (state.get("plan") or {}).get("version"), "by": by, "at": at, **hashes(state)}


def matches(state: dict[str, Any], approval: dict[str, Any] | None) -> bool:
    if not approval:
        return False
    current = hashes(state)
    return all(approval.get(k) == v for k, v in current.items()) and approval.get("version") == (state.get("plan") or {}).get("version")
