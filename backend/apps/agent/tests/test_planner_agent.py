"""The extended planner graph: routing, preferences, validator codes, repair loop, simulation, approval binding,
idempotent commit, LLM degradation and tool choice, with Gemini / Groq mocked over HTTP."""

from __future__ import annotations

import httpx
import pytest

from lodestar_agent.domain import approval as approval_rules
from lodestar_agent.domain.context import PlanningContext
from lodestar_agent.domain.planner import schedule
from lodestar_agent.domain.simulation import simulate_plan
from lodestar_agent.domain.validator import validate_plan
from lodestar_agent.llm import RoutedChatModel
from lodestar_agent.llm.metrics import METRICS
from lodestar_agent.runtime import RunConflict

from . import fixtures as fx
from .test_llm_router import GEMINI_HOST, GEMINI_QUOTA, SERVER_DOWN, FakeLLMs, gemini_ok, groq_ok

ROLES = ["dispatcher"]
DETERMINISTIC = ("plan", "deferrals", "needsReview", "ruleChecks", "violations", "validation", "simulation", "constraints", "redrafts")


def nodes(run):
    return [h["node"] for h in run["history"]]


def echo_phrase(request: httpx.Request) -> httpx.Response:
    """A well-behaved LLM: rewrites nothing, so every fact survives."""
    import json

    body = json.loads(request.content)
    user = body["contents"][0]["parts"][0]["text"]
    return gemini_ok({"text": user.split("\n", 1)[1] if user.startswith("DRAFT") else user.split("DRAFT", 1)[1].split("\n", 1)[1]})


def routed(fake: FakeLLMs) -> RoutedChatModel:
    return RoutedChatModel(router=fake.router())


@pytest.fixture(autouse=True)
def _metrics():
    METRICS.reset()
    yield


# ---------------------------------------------------------------- planning stays deterministic
def test_llm_run_plans_exactly_like_the_mock(make_runtime):
    mock_run = make_runtime().start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    fake = FakeLLMs(gemini=[echo_phrase])
    llm_run = make_runtime(model=routed(fake)).start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    assert {k: llm_run[k] for k in DETERMINISTIC} == {k: mock_run[k] for k in DETERMINISTIC}
    assert llm_run["llmCalls"][-1]["provider"] == "gemini" and not llm_run["llmDegraded"]
    assert fake.calls(GEMINI_HOST) == 1  # no request text: only the explanation uses the LLM


def test_request_runs_intent_and_preferences_within_the_call_budget(make_runtime):
    fake = FakeLLMs(
        gemini=[
            gemini_ok({"intent": "PLAN_DAY"}),
            gemini_ok({"preferences": ["PRIORITISE_MALL_WINDOWS"], "focusDistrict": None}),
            echo_phrase,
        ]
    )
    run = make_runtime(model=routed(fake)).start_run(fx.DEPOT, fx.RUN_DATE, "user-1", request="Plan tomorrow, mall stores first")
    assert nodes(run)[:3] == ["load_context", "classify_intent", "extract_preferences"]
    assert run["intent"] == "PLAN_DAY" and run["preferences"]["preferences"] == ["PRIORITISE_MALL_WINDOWS"]
    assert {"type": "prioritise", "orderIds": ["O-5"], "reason": "PRIORITISE_MALL_WINDOWS", "rule": "preference"} in run["constraints"]
    assert [c["task"] for c in run["llmCalls"]] == ["intent", "preferences", "summary"]
    assert fake.calls(GEMINI_HOST) <= 4
    assert run["status"] == "NEEDS_APPROVAL" and run["validation"]["valid"]


def test_capacity_question_skips_planning_and_commit(make_runtime):
    fake = FakeLLMs(gemini=[gemini_ok({"intent": "CAPACITY_RISK"}), echo_phrase])
    run = make_runtime(model=routed(fake)).start_run(fx.DEPOT, fx.RUN_DATE, "user-1", request="Do we have enough reefer space?")
    assert run["status"] == "ANSWERED" and "plan" not in run
    assert nodes(run) == ["load_context", "classify_intent", "answer_only"]
    assert "Chilled demand" in run["explanation"]["text"]


def test_both_providers_down_marks_the_run_degraded_and_tells_the_dispatcher(make_runtime):
    fake = FakeLLMs(gemini=[GEMINI_QUOTA], groq=[SERVER_DOWN, SERVER_DOWN])
    run = make_runtime(model=routed(fake)).start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    assert run["llmDegraded"] is True and run["status"] == "NEEDS_APPROVAL"
    assert run["explanation"]["text"].startswith("LLM_DEGRADED")
    assert "What it did" in run["explanation"]["text"]
    assert METRICS.snapshot()["degradedRuns"] == 1


def test_gemini_quota_mid_run_is_answered_by_groq(make_runtime):
    fake = FakeLLMs(gemini=[GEMINI_QUOTA], groq=[groq_ok({"text": "x"})])  # groq loses facts -> fact check -> template text
    run = make_runtime(model=routed(fake)).start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    assert not run["llmDegraded"] and "What it did" in run["explanation"]["text"]


# ---------------------------------------------------------------- ask: LLM picks tools, proposals re-checked
def test_ask_uses_valid_llm_tool_choice_and_drops_invented_ids(make_runtime):
    fake = FakeLLMs(gemini=[echo_phrase, gemini_ok({"calls": [{"name": "lookup_vehicle", "args": {"vehicle_id": "V-D1"}}, {"name": "lookup_vehicle", "args": {"vehicle_id": "V-ZZ"}}]}), echo_phrase])
    rt = make_runtime(model=routed(fake))
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    out = rt.ask(run["id"], "what is the dry truck doing?")
    assert out["toolCalls"] == ["lookup_vehicle"] and "V-D1" in out["answer"]


def test_ask_proposal_from_llm_is_rule_checked_and_never_applied(make_runtime):
    fake = FakeLLMs(gemini=[echo_phrase, gemini_ok({"calls": [{"name": "propose_edit", "args": {"op": "defer", "order_id": "O-6", "reason": "CAP_TIME"}}]}), echo_phrase])
    rt = make_runtime(model=routed(fake))
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    out = rt.ask(run["id"], "can we drop the style store order?")
    assert out["toolCalls"] == ["propose_edit"] and out["proposal"]["edits"][0]["orderId"] == "O-6"
    assert len(out["proposal"]["ruleChecks"]) == 8
    assert rt.get_run(run["id"])["plan"] == run["plan"]  # nothing applied


def test_ask_invalid_llm_choice_falls_back_to_deterministic_picks(make_runtime):
    fake = FakeLLMs(gemini=[echo_phrase, gemini_ok({"calls": [{"name": "propose_edit", "args": {"op": "publish", "order_id": "O-1"}}]}), echo_phrase])
    rt = make_runtime(model=routed(fake))
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    out = rt.ask(run["id"], "Where is O-2?")
    assert out["toolCalls"] == ["explain_order"]


# ---------------------------------------------------------------- validator codes, repair loop, simulation
def _ctx(data=None) -> PlanningContext:
    return PlanningContext.from_raw(data or fx.raw(), fx.DEPOT, fx.RUN_DATE)


def _plan(ctx, trips):
    return schedule(ctx, {"version": 1, "unassigned": [], "trips": trips})


def test_validator_codes_on_a_hand_built_bad_plan():
    ctx = _ctx()
    plan = _plan(ctx, [
        {"vehicleId": "V-D1", "tripNo": 1, "orderIds": ["O-4", "O-6", "O-1"]},  # brand+district mix, chilled on ambient
        {"vehicleId": "V-R1", "tripNo": 1, "orderIds": ["O-3", "O-7", "O-7"]},  # van_only on a truck, duplicate
        {"vehicleId": "V-N1", "tripNo": 1, "orderIds": ["O-1"]},  # O-1 split across vehicles
    ])
    result = validate_plan(ctx, plan, decided=set())
    codes = {e["code"] for e in result["errors"]}
    assert {"BRAND_DISTRICT_MISMATCH", "CHILLED_ORDER_ON_AMBIENT_VEHICLE", "VAN_ONLY_OUTLET_ON_TRUCK", "DUPLICATE_ORDER_ASSIGNMENT", "ORDER_SPLIT", "UNASSIGNED_ORDER_WITHOUT_DECISION"} <= codes
    assert not result["valid"] and result["violated_rule_count"] == len(codes) and len(result["checked_rules"]) == 15
    assert all(e["repair_hint"] and e["severity"] == "error" for e in result["errors"])


def test_validator_maps_booklet_rules_to_codes():
    ctx = _ctx(fx.mall_conflict_raw())
    plan = _plan(ctx, [{"vehicleId": "V-D1", "tripNo": 1, "orderIds": ["O-8", "O-9", "O-10"]}, {"vehicleId": "V-D1", "tripNo": 2, "orderIds": ["O-5"]}])
    codes = {e["code"] for e in validate_plan(ctx, plan, decided=set(ctx.orders))["errors"]}
    assert "MALL_ACCESS_CONFLICT" in codes


def test_repair_loop_is_bounded(make_runtime, monkeypatch):
    from lodestar_agent.graph import builder

    def always_bad(ctx, plan, decided=None):
        trip = plan["trips"][0]
        err = {"code": "CHILLED_ORDER_ON_AMBIENT_VEHICLE", "rule": None, "message": "x", "order_ids": trip["orderIds"][:1], "vehicle_id": trip["vehicleId"], "trip_id": trip["id"], "severity": "error", "repair_hint": "y"}
        return {"valid": False, "errors": [err], "warnings": [], "checked_rules": [], "violated_rule_count": 1}

    monkeypatch.setattr(builder, "validate_plan", always_bad)
    run = make_runtime(max_redrafts=2).start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    assert run["redrafts"] == 2 and nodes(run).count("draft_plan") == 3
    assert METRICS.snapshot()["repairs"] == 2
    assert any(c["rule"] == "CHILLED_ORDER_ON_AMBIENT_VEHICLE" for c in run["constraints"])


def test_simulation_and_deferral_explanations(make_runtime):
    run = make_runtime(fx.fuel_starved_raw()).start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    sim = run["simulation"]
    assert sim["served"] + sim["deferred"] + sim["needsReview"] == sim["openOrders"]
    assert {w["code"] for w in sim["warnings"]} >= {"PROTECTED_NEEDS_REVIEW"}
    for d in run["deferrals"]:
        assert d["reason"] == "FUEL" and d["limitingConstraint"] == "weekly fuel quota (L)"
        assert d["explanation"] and "next-day run" in d["consequence"] and d["previouslyDeferred"] is False


def test_high_late_risk_warning():
    ctx = _ctx()
    plan = _plan(ctx, [{"vehicleId": "V-R1", "tripNo": 1, "orderIds": ["O-1"]}])
    plan["trips"][0]["stops"][0]["lateRiskPct"] = 80
    sim = simulate_plan(ctx, plan)
    assert any(w["code"] == "HIGH_LATE_RISK" and w["orderIds"] == ["O-1"] for w in sim["warnings"])


# ---------------------------------------------------------------- approval binding + idempotent commit
def test_approval_is_bound_to_the_plan_and_commit_is_idempotent(make_runtime):
    rt = make_runtime()
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    plan_hash = run["hashes"]["planHash"]
    done = rt.resume(run["id"], "approve", None, "user-1", ROLES, plan_hash=plan_hash)
    assert done["status"] == "APPROVED" and done["committed"]["planHash"] == plan_hash
    assert done["approval"]["by"] == "user-1" and done["approval"]["version"] == run["version"]
    assert {"validationHash", "simulationHash"} <= set(done["approval"])
    again = rt.resume(run["id"], "approve", None, "user-1", ROLES, plan_hash=plan_hash)
    assert again["decisions"] == done["decisions"] and nodes(again).count("commit") == 1
    with pytest.raises(RunConflict):  # a different plan hash is not the same approval
        rt.resume(run["id"], "approve", None, "user-1", ROLES, plan_hash="0" * 64)


def test_a_stale_plan_hash_is_refused(make_runtime):
    rt = make_runtime()
    run = rt.start_run(fx.DEPOT, fx.RUN_DATE, "user-1")
    stale = run["hashes"]["planHash"]
    edited = rt.resume(run["id"], "edit", [{"op": "defer", "orderId": "O-6", "reason": "CAP_TIME"}], "user-1", ROLES)
    assert edited["hashes"]["planHash"] != stale and edited.get("approval") is None
    with pytest.raises(RunConflict):
        rt.resume(run["id"], "approve", None, "user-1", ROLES, plan_hash=stale)


def test_changed_plan_invalidates_an_approval():
    state = {"runId": "r", "plan": {"version": 1, "trips": []}, "validation": {"valid": True}, "simulation": {"served": 0}}
    bound = approval_rules.bind(state, "user-1", "2030-01-08T00:00:00+00:00")
    assert approval_rules.matches(state, bound)
    assert not approval_rules.matches({**state, "plan": {"version": 1, "trips": [{"id": "x"}]}}, bound)
    assert not approval_rules.matches({**state, "simulation": {"served": 1}}, bound)
    assert not approval_rules.matches(state, None)
