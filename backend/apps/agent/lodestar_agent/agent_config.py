"""Read-only view of how the agent is set up: model, fallback and the guardrails it enforces (DSP-16, ADM-17).

Built from the same constants and settings the graph runs with, so the screens never describe a rule the agent
does not apply. Never includes secrets (endpoint host only, no keys).
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from .config import Settings
from .domain import heuristics as h
from .domain.deferrals import REASON_CODES
from .domain.rules import RULES
from .llm import AZURE_VARS
from .tools import DATASETS

ASK_TOOLS = (
    "plan_summary",
    "rule_checks",
    "capacity",
    "list_deferrals",
    "explain_order",
    "lookup_vehicle",
    "lookup_outlet",
    "propose_edit",
)


def _model(settings: Settings) -> dict[str, Any]:
    choice = settings.agent_model
    if choice == "mock":
        return {
            "setting": "mock",
            "provider": "mock",
            "label": "Deterministic built-in model",
            "configured": True,
            "deployment": None,
            "endpointHost": None,
            "missing": [],
        }
    if choice in ("azure-openai", "azure_openai", "azure"):
        values = (
            settings.azure_openai_endpoint,
            settings.azure_openai_api_key,
            settings.azure_openai_deployment,
            settings.azure_openai_api_version,
        )
        missing = [name for name, val in zip(AZURE_VARS, values, strict=True) if not val]
        return {
            "setting": choice,
            "provider": "azure-openai",
            "label": "Azure OpenAI",
            "configured": not missing,
            "deployment": settings.azure_openai_deployment,
            "endpointHost": urlparse(settings.azure_openai_endpoint).hostname if settings.azure_openai_endpoint else None,
            "missing": missing,
        }
    return {"setting": choice, "provider": "unknown", "label": choice, "configured": False, "deployment": None, "endpointHost": None, "missing": []}


def agent_config(settings: Settings) -> dict[str, Any]:
    """The JSON served at GET /config."""
    return {
        "model": _model(settings),
        "fallback": "Manual plan board with the same rule checks (planning service), from the last approved plan",
        "humanApproval": True,
        "canPublish": False,
        "maxRedrafts": settings.max_redrafts,
        "firstDeparture": settings.first_departure,
        "limits": {
            "maxTripsPerVehicle": h.MAX_TRIPS_PER_VEHICLE,
            "freshMinutesBudget": h.FRESH_MINUTES_BUDGET,
            "otherMinutesBudget": h.OTHER_MINUTES_BUDGET,
            "protectedScore": h.PROTECTED_SCORE,
            "deferralCandidateBelow": h.DEFERRAL_CANDIDATE_BELOW,
            "defaultServiceMin": h.DEFAULT_SERVICE_MIN,
        },
        "rules": [{"rule": rule, "label": label} for rule, label in RULES],
        "reasonCodes": list(REASON_CODES),
        "reads": sorted(entity_set for entity_set, _ in DATASETS.values()),
        "askTools": list(ASK_TOOLS),
        "decisions": ["approve", "edit", "reject"],
        "decidedBy": "dispatcher",
    }
