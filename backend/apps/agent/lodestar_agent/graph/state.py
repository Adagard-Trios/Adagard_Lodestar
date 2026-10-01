"""Typed LangGraph state for a planning run (JSON-serialisable for the Postgres checkpointer)."""

from __future__ import annotations

import operator
from typing import Annotated, Any, Literal, TypedDict

RunStatus = Literal["DRAFTING", "NEEDS_APPROVAL", "APPROVED", "REJECTED", "FAILED"]
Decision = Literal["approve", "edit", "reject"]


class RuleCheck(TypedDict):
    rule: str
    label: str
    passed: bool
    violations: int


class Violation(TypedDict):
    rule: str
    tripId: str
    vehicleId: str
    orderIds: list[str]
    reason: str
    detail: str


class Deferral(TypedDict):
    orderId: str
    outletId: str
    reason: str
    score: int
    suggested: bool
    m3: float
    rank: int


class Explanation(TypedDict):
    text: str
    did: list[str]
    checked: list[str]


class HistoryEntry(TypedDict, total=False):
    node: str
    at: str
    note: str


class AgentState(TypedDict, total=False):
    # identity of the run
    runId: str
    depot: str
    runDate: str
    requestedBy: str
    status: RunStatus
    # load_context
    raw: dict[str, list[dict[str, Any]]]
    contextSummary: dict[str, Any]
    # draft_plan / check_rules loop
    plan: dict[str, Any]
    constraints: list[dict[str, Any]]
    redrafts: int
    redraftRequested: bool
    ruleChecks: list[RuleCheck]
    violations: list[Violation]
    # rank_deferrals
    deferrals: list[Deferral]
    needsReview: list[dict[str, Any]]
    actions: list[str]
    # explain
    explanation: Explanation
    # human in the loop
    editMode: bool
    pendingEdits: list[dict[str, Any]]
    lastEdits: list[str]
    decision: dict[str, Any]
    decisions: Annotated[list[dict[str, Any]], operator.add]
    history: Annotated[list[HistoryEntry], operator.add]
