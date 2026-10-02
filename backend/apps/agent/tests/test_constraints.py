"""Accept / reject pairs for every operating constraint, plus the over-capacity day.

Every scenario is a small synthetic world built from ``fixtures`` helpers (made-up values only).
``run_pipeline`` chains the real domain steps exactly as the graph does
(draft -> check -> redraft with constraints, at most ``max_redrafts`` times -> rank_deferrals).
"""

from __future__ import annotations

from typing import Any

import pytest

from lodestar_agent.domain import heuristics as h
from lodestar_agent.domain.context import PlanningContext
from lodestar_agent.domain.deferrals import REASON_CODES, rank_deferrals
from lodestar_agent.domain.edits import EditError, apply_edits
from lodestar_agent.domain.planner import draft_plan, planned_order_ids, schedule
from lodestar_agent.domain.rules import check_rules, constraints_for

from . import fixtures as fx

TRAVEL = [
    {"district": "Alpha", "depot": fx.DEPOT, "roadClass": "urban", "depotToDistMin": 20, "interStopMin": 10, "distKm": 15},
    {"district": "Beta", "depot": fx.DEPOT, "roadClass": "suburban", "depotToDistMin": 40, "interStopMin": 12, "distKm": 30},
    {"district": "Gamma", "depot": fx.DEPOT, "roadClass": "urban", "depotToDistMin": 30, "interStopMin": 10, "distKm": 20},
    {"district": "Remote", "depot": fx.DEPOT, "roadClass": "hill", "depotToDistMin": 150, "interStopMin": 20, "distKm": 90},
]


def world(*, outlets: list[dict[str, Any]], vehicles: list[dict[str, Any]], orders: list[dict[str, Any]], **extra: Any) -> dict[str, list[dict[str, Any]]]:
    return fx.raw(outlets=outlets, vehicles=vehicles, orders=orders, districtTravel=extra.pop("travel", TRAVEL), **extra)


def ctx_for(data: dict[str, list[dict[str, Any]]], run_date: str = fx.RUN_DATE) -> PlanningContext:
    return PlanningContext.from_raw(data, fx.DEPOT, run_date)


def run_pipeline(ctx: PlanningContext, max_redrafts: int = 3) -> dict[str, Any]:
    constraints: list[dict[str, Any]] = []
    plan = draft_plan(ctx, constraints)
    redrafts = 0
    while True:
        _, violations = check_rules(ctx, plan)
        if not violations or redrafts >= max_redrafts:
            break
        constraints = constraints_for(violations, constraints)
        redrafts += 1
        plan = draft_plan(ctx, constraints, plan["version"] + 1)
    return rank_deferrals(ctx, plan, violations)


def trip_of(plan: dict[str, Any], oid: str) -> dict[str, Any] | None:
    return next((t for t in plan["trips"] if oid in t["orderIds"]), None)


def reasons(plan: dict[str, Any]) -> dict[str, str]:
    return {u["orderId"]: u["reason"] for u in plan["unassigned"]}


def deferral_reasons(result: dict[str, Any]) -> dict[str, str]:
    return {d["orderId"]: d["reason"] for d in result["deferrals"]}


def stop_of(trip: dict[str, Any], oid: str) -> dict[str, Any]:
    return next(s for s in trip["stops"] if s["orderId"] == oid)


# Ambient Style outlets / orders are never protected (score 0 with a next-day run).
STYLE_ALPHA = fx.outlet("T-A", "STYLE", "Alpha", "REAR_DOCK", "NORMAL", "09:00", "17:00")
TRUCK = fx.vehicle("V-T1", "TRUCK", "AMBIENT", 1000, 8, 5, 500, 0)


# ---------------------------------------------------------------- weight capacity
def test_weight_accept_order_at_exact_capacity_is_planned():
    ctx = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[TRUCK], orders=[fx.order("W-1", "T-A", "STYLE", "AMBIENT", 1000, 1.0)]))
    result = run_pipeline(ctx)
    trip = trip_of(result["plan"], "W-1")
    assert trip is not None and trip["vehicleId"] == "V-T1" and trip["kg"] == 1000
    assert result["deferrals"] == [] and check_rules(ctx, result["plan"])[1] == []


def test_weight_reject_overweight_order_is_deferred_and_rule_flags_overload():
    orders = [fx.order("W-1", "T-A", "STYLE", "AMBIENT", 700, 1.0), fx.order("W-2", "T-A", "STYLE", "AMBIENT", 400, 1.0, daysSince=1)]
    ctx = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[{**TRUCK, "id": "V-T1"}], orders=orders))
    # one truck, one trip slot each district: 700 + 400 > 1000 kg -> one order must go to a second trip
    result = run_pipeline(ctx)
    for t in result["plan"]["trips"]:
        assert t["kg"] <= 1000
    assert [t["orderIds"] for t in result["plan"]["trips"]] == [["W-2"], ["W-1"]]  # never both on one trip
    # a single order heavier than every vehicle is deferred
    heavy = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[TRUCK], orders=[fx.order("W-9", "T-A", "STYLE", "AMBIENT", 1001, 1.0)]))
    assert deferral_reasons(run_pipeline(heavy)) == {"W-9": "CAP_TIME"}
    # and the rule checker rejects a hand-built overweight trip
    forced = schedule(heavy, {"version": 1, "trips": [{"vehicleId": "V-T1", "tripNo": 1, "orderIds": ["W-9"]}], "unassigned": []})
    assert [(v["rule"], v["orderIds"]) for v in check_rules(heavy, forced)[1]] == [("weight", ["W-9"])]


# ---------------------------------------------------------------- volume capacity
def test_volume_accept_order_at_exact_capacity_is_planned():
    ctx = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[TRUCK], orders=[fx.order("M-1", "T-A", "STYLE", "AMBIENT", 100, 8.0)]))
    result = run_pipeline(ctx)
    assert trip_of(result["plan"], "M-1")["vehicleId"] == "V-T1"
    assert result["deferrals"] == []


def test_volume_reject_bulky_order_is_deferred_and_rule_flags_overfill():
    ctx = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[TRUCK], orders=[fx.order("M-9", "T-A", "STYLE", "AMBIENT", 100, 8.5)]))
    result = run_pipeline(ctx)
    assert result["plan"]["trips"] == [] and deferral_reasons(result) == {"M-9": "CAP_TIME"}
    forced = schedule(ctx, {"version": 1, "trips": [{"vehicleId": "V-T1", "tripNo": 1, "orderIds": ["M-9"]}], "unassigned": []})
    assert [(v["rule"], v["orderIds"]) for v in check_rules(ctx, forced)[1]] == [("volume", ["M-9"])]


# ---------------------------------------------------------------- refrigeration
FRESH_ALPHA = fx.outlet("F-A", "FRESH", "Alpha", "REAR_DOCK", "NORMAL", "05:00", "08:00")
REEFER = fx.vehicle("V-C1", "TRUCK", "CHILLED", 800, 4, 6, 500, 0)
BIG_AMBIENT = fx.vehicle("V-A1", "TRUCK", "AMBIENT", 5000, 30, 5, 500, 0)


def test_refrigeration_accept_chilled_order_rides_the_reefer_not_the_bigger_ambient_truck():
    ctx = ctx_for(world(outlets=[FRESH_ALPHA], vehicles=[BIG_AMBIENT, REEFER], orders=[fx.order("C-1", "F-A", "FRESH", "CHILLED", 200, 1.0)]))
    result = run_pipeline(ctx)
    trip = trip_of(result["plan"], "C-1")
    assert trip["vehicleId"] == "V-C1" and trip["chilled"] is True
    assert result["deferrals"] == []


def test_refrigeration_reject_chilled_order_without_reefer_is_cap_reefer():
    ctx = ctx_for(world(outlets=[FRESH_ALPHA], vehicles=[BIG_AMBIENT], orders=[fx.order("C-1", "F-A", "FRESH", "CHILLED", 200, 1.0)]))
    result = run_pipeline(ctx)
    assert result["plan"]["trips"] == []
    assert deferral_reasons(result) == {"C-1": "CAP_REEFER"}


# ---------------------------------------------------------------- van-only outlet (parking)
VAN_OUTLET = fx.outlet("P-V", "STYLE", "Alpha", "STREET", "VAN_ONLY", "09:00", "17:00")
VAN = fx.vehicle("V-V1", "VAN", "AMBIENT", 600, 4, 10, 300, 0)


def test_van_only_accept_order_goes_on_the_van_even_with_a_bigger_truck_free():
    ctx = ctx_for(world(outlets=[VAN_OUTLET], vehicles=[BIG_AMBIENT, VAN], orders=[fx.order("P-1", "P-V", "STYLE", "AMBIENT", 100, 1.0)]))
    result = run_pipeline(ctx)
    assert trip_of(result["plan"], "P-1")["vehicleId"] == "V-V1"
    assert result["deferrals"] == []


def test_van_only_reject_without_a_van_is_access():
    ctx = ctx_for(world(outlets=[VAN_OUTLET], vehicles=[BIG_AMBIENT], orders=[fx.order("P-1", "P-V", "STYLE", "AMBIENT", 100, 1.0)]))
    result = run_pipeline(ctx)
    assert result["plan"]["trips"] == [] and deferral_reasons(result) == {"P-1": "ACCESS"}


# ---------------------------------------------------------------- home depot
def test_home_depot_accept_home_vehicle_serves_home_outlet():
    ctx = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[TRUCK], orders=[fx.order("H-1", "T-A", "STYLE", "AMBIENT", 100, 1.0)]))
    result = run_pipeline(ctx)
    assert trip_of(result["plan"], "H-1")["vehicleId"] == "V-T1"


def test_home_depot_reject_other_depot_vehicle_is_never_used():
    away = {**fx.vehicle("V-X1", "TRUCK", "AMBIENT", 9000, 50, 5, 900, 0), "depot": fx.OTHER_DEPOT}
    ctx = ctx_for(world(outlets=[STYLE_ALPHA], vehicles=[away], orders=[fx.order("H-1", "T-A", "STYLE", "AMBIENT", 100, 1.0)]))
    assert "V-X1" not in ctx.vehicles
    result = run_pipeline(ctx)
    assert result["plan"]["trips"] == []
    assert deferral_reasons(result) == {"H-1": "CAP_TIME"}


# ---------------------------------------------------------------- delivery window close (any outlet)
def _window_world(district: str) -> dict[str, list[dict[str, Any]]]:
    shop = fx.outlet("D-W", "FRESH", district, "REAR_DOCK", "NORMAL", "04:00", "05:00")
    return world(outlets=[shop], vehicles=[REEFER], orders=[fx.order("D-1", "D-W", "FRESH", "AMBIENT", 100, 1.0)])


def test_window_close_accept_arrival_before_close_is_planned():
    ctx = ctx_for(_window_world("Alpha"))  # 20 min out: 03:40 -> waits for 04:00 open
    result = run_pipeline(ctx)
    stop = stop_of(trip_of(result["plan"], "D-1"), "D-1")
    assert stop["arrive"] == "04:00" and h.to_min(stop["arrive"]) <= h.to_min("05:00")
    assert result["deferrals"] == []


def test_window_close_reject_arrival_after_close_is_deferred_with_window():
    """KNOWN GAP: check_rules only checks the close time for mall stops."""
    ctx = ctx_for(_window_world("Remote"))  # 150 min out: 03:30 + 150 = 06:00, window closed at 05:00
    plan = draft_plan(ctx)
    assert stop_of(trip_of(plan, "D-1"), "D-1")["arrive"] == "06:00"  # the late arrival is real
    flagged = [v for v in check_rules(ctx, plan)[1] if "D-1" in v["orderIds"]]
    assert flagged and flagged[0]["reason"] == "WINDOW"
    result = run_pipeline(ctx)
    assert trip_of(result["plan"], "D-1") is None
    assert deferral_reasons(result) == {"D-1": "WINDOW"}


# ---------------------------------------------------------------- mall window
def _mall_world(long_service: int, mall_close: str = "10:30", **mall_extra: Any) -> dict[str, list[dict[str, Any]]]:
    mall = fx.outlet("L-M", "STYLE", "Gamma", "MALL_BAY", "MALL_DOCK", "10:00", mall_close, **mall_extra)
    shop = fx.outlet("L-S", "STYLE", "Gamma", "REAR_DOCK", "NORMAL", "09:00", "17:00")
    data = world(
        outlets=[mall, shop],
        vehicles=[TRUCK],
        orders=[fx.order("L-1", "L-M", "STYLE", "AMBIENT", 100, 1.0), fx.order("L-2", "L-S", "STYLE", "AMBIENT", 100, 1.0)],
        serviceAllowances=[
            {"brand": "STYLE", "dockType": "MALL_BAY", "minutes": 30},
            {"brand": "STYLE", "dockType": "REAR_DOCK", "minutes": long_service},
        ],
    )
    return data


def test_mall_accept_mall_stop_inside_mall_window():
    ctx = ctx_for(_mall_world(long_service=20))  # 09:00 + 20 + 10 -> 09:30, waits until the mall opens at 10:00
    result = run_pipeline(ctx)
    trip = trip_of(result["plan"], "L-1")
    assert trip["vehicleId"] == "V-T1" and trip["orderIds"] == ["L-2", "L-1"]
    assert stop_of(trip, "L-1")["arrive"] == "10:00"
    assert result["deferrals"] == [] and check_rules(ctx, result["plan"])[1] == []


def test_mall_reject_mall_stop_after_close_is_deferred_with_window():
    ctx = ctx_for(_mall_world(long_service=100))  # 09:00 + 100 + 10 -> 10:50, mall closed at 10:30
    first = draft_plan(ctx)
    assert [(v["rule"], v["orderIds"], v["reason"]) for v in check_rules(ctx, first)[1]] == [("mall", ["L-1"], "WINDOW")]
    result = run_pipeline(ctx)
    assert trip_of(result["plan"], "L-2")["vehicleId"] == "V-T1"
    assert trip_of(result["plan"], "L-1") is None
    assert deferral_reasons(result) == {"L-1": "WINDOW"}


def test_mall_reject_uses_the_mall_delivery_window_not_the_store_hours():
    """KNOWN GAP: the mall delivery window (``mallWindow`` on the outlet, from the outlet master) is ignored.

    Store hours run to 17:00 but the mall only accepts deliveries 10:00-10:30.
    """
    ctx = ctx_for(_mall_world(long_service=100, mall_close="17:00", mallWindow="10:00-10:30"))
    plan = draft_plan(ctx)
    assert stop_of(trip_of(plan, "L-1"), "L-1")["arrive"] == "10:50"
    assert [(v["rule"], v["orderIds"], v["reason"]) for v in check_rules(ctx, plan)[1]] == [("mall", ["L-1"], "WINDOW")]
    assert deferral_reasons(run_pipeline(ctx)) == {"L-1": "WINDOW"}


# ---------------------------------------------------------------- weekly fuel quota
def _fuel_world(used: int) -> dict[str, list[dict[str, Any]]]:
    # Alpha round trip = 30 km / 5 km/L = 6 L against a 100 L weekly quota
    return world(outlets=[STYLE_ALPHA], vehicles=[fx.vehicle("V-T1", "TRUCK", "AMBIENT", 1000, 8, 5, 100, used)], orders=[fx.order("U-1", "T-A", "STYLE", "AMBIENT", 100, 1.0)])


def test_fuel_accept_trip_within_remaining_quota():
    ctx = ctx_for(_fuel_world(used=94))  # 94 + 6 = 100: exactly at quota is allowed
    result = run_pipeline(ctx)
    trip = trip_of(result["plan"], "U-1")
    assert trip["vehicleId"] == "V-T1" and trip["litres"] == 6.0
    assert result["deferrals"] == [] and check_rules(ctx, result["plan"])[1] == []


def test_fuel_reject_trip_over_quota_is_deferred_with_fuel():
    ctx = ctx_for(_fuel_world(used=95))  # 95 + 6 = 101 > 100
    assert [(v["rule"], v["reason"]) for v in check_rules(ctx, draft_plan(ctx))[1]] == [("fuel", "FUEL")]
    result = run_pipeline(ctx)
    assert result["plan"]["trips"] == []
    assert deferral_reasons(result) == {"U-1": "FUEL"}


# ---------------------------------------------------------------- max two trips per vehicle per day
def _trips_world(districts: list[tuple[str, str]]) -> dict[str, list[dict[str, Any]]]:
    outlets = [fx.outlet(f"R-{d}", "STYLE", d, "REAR_DOCK", "NORMAL", opens, "17:00") for d, opens in districts]
    orders = [fx.order(f"R-{d}-1", f"R-{d}", "STYLE", "AMBIENT", 100, 1.0) for d, _ in districts]
    return world(outlets=outlets, vehicles=[TRUCK], orders=orders)


def test_two_trips_accept_one_vehicle_runs_two_trips():
    ctx = ctx_for(_trips_world([("Alpha", "09:00"), ("Beta", "10:00")]))
    result = run_pipeline(ctx)
    trips = result["plan"]["trips"]
    assert [(t["vehicleId"], t["tripNo"], t["orderIds"]) for t in trips] == [("V-T1", 1, ["R-Alpha-1"]), ("V-T1", 2, ["R-Beta-1"])]
    assert h.to_min(trips[1]["departs"]) >= h.to_min(trips[0]["returns"])
    assert result["deferrals"] == []


def test_two_trips_reject_third_trip_is_deferred():
    ctx = ctx_for(_trips_world([("Alpha", "09:00"), ("Beta", "10:00"), ("Gamma", "11:00")]))
    result = run_pipeline(ctx)
    assert [t["tripNo"] for t in result["plan"]["trips"]] == [1, 2]
    assert planned_order_ids(result["plan"]) == {"R-Alpha-1", "R-Beta-1"}
    assert deferral_reasons(result) == {"R-Gamma-1": "CAP_TIME"}


# ---------------------------------------------------------------- non-operating day
def _calendar_world(operating: bool) -> dict[str, list[dict[str, Any]]]:
    return world(
        outlets=[STYLE_ALPHA],
        vehicles=[TRUCK],
        orders=[fx.order("N-1", "T-A", "STYLE", "AMBIENT", 100, 1.0)],
        calendar=[{"date": fx.RUN_DATE, "isOperating": operating, "monsoon": 0}, {"date": fx.NEXT_DATE, "isOperating": True, "monsoon": 0}],
    )


def test_operating_day_accept_plans_normally():
    ctx = ctx_for(_calendar_world(True))
    assert ctx.is_operating() and ctx.summary()["operating"] is True
    assert trip_of(draft_plan(ctx), "N-1")["vehicleId"] == "V-T1"


def test_non_operating_day_reject_planning_is_refused():
    """KNOWN GAP: nothing checks ctx.is_operating() before drafting."""
    ctx = ctx_for(_calendar_world(False))
    assert not ctx.is_operating()
    with pytest.raises(ValueError):
        draft_plan(ctx)


# ---------------------------------------------------------------- the over-capacity day
def _over_capacity_world() -> dict[str, list[dict[str, Any]]]:
    outlets = [
        fx.outlet("X-F", "FRESH", "Alpha", "REAR_DOCK", "NORMAL", "05:00", "08:00"),
        fx.outlet("X-V", "STYLE", "Alpha", "STREET", "VAN_ONLY", "09:00", "17:00"),
        fx.outlet("X-G", "STYLE", "Gamma", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
        fx.outlet("X-M", "STYLE", "Beta", "MALL_BAY", "MALL_DOCK", "10:00", "10:30"),
        fx.outlet("X-B", "STYLE", "Beta", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
    ]
    vehicles = [
        fx.vehicle("V-C1", "TRUCK", "CHILLED", 800, 2.0, 6, 500, 0),  # reefer: 2 trips x 2 m3
        fx.vehicle("V-A1", "TRUCK", "AMBIENT", 3000, 20, 5, 500, 0),
        fx.vehicle("V-A2", "TRUCK", "AMBIENT", 3000, 20, 5, 100, 100),  # already at its weekly fuel quota
        fx.vehicle("V-V1", "VAN", "AMBIENT", 500, 3, 10, 300, 0, status="WORKSHOP"),
    ]
    orders = [fx.order(f"X-C{i}", "X-F", "FRESH", "CHILLED", 100, 1.0) for i in range(1, 6)] + [
        fx.order("X-V1", "X-V", "STYLE", "AMBIENT", 100, 1.0),
        fx.order("X-G1", "X-G", "STYLE", "AMBIENT", 100, 1.0),
        fx.order("X-M1", "X-M", "STYLE", "AMBIENT", 100, 1.0),
        fx.order("X-B1", "X-B", "STYLE", "AMBIENT", 100, 1.0),
    ]
    return world(
        outlets=outlets,
        vehicles=vehicles,
        orders=orders,
        serviceAllowances=[
            {"brand": "FRESH", "dockType": "REAR_DOCK", "minutes": 15},
            {"brand": "STYLE", "dockType": "MALL_BAY", "minutes": 30},
            {"brand": "STYLE", "dockType": "REAR_DOCK", "minutes": 100},
            {"brand": "STYLE", "dockType": "STREET", "minutes": 20},
        ],
    )


def test_over_capacity_day_every_deferral_has_a_valid_reason_code():
    ctx = ctx_for(_over_capacity_world())
    result = run_pipeline(ctx)
    got = deferral_reasons(result)
    assert got and all(r in REASON_CODES for r in got.values())
    assert got["X-V1"] == "VEH_DOWN"  # van_only outlet, the only van is in the workshop
    chilled = {o for o in got if ctx.needs_reefer(o)}
    assert chilled and all(got[o] == "CAP_REEFER" for o in chilled)  # 5 chilled m3 vs 4 m3 of reefer trips
    assert all(got[o] in ("WINDOW", "FUEL", "CAP_TIME") for o in got if o not in chilled | {"X-V1"})
    # every open order is either on a trip or deferred, none vanish, nothing is double-booked
    assert planned_order_ids(result["plan"]) | set(got) == set(ctx.orders)
    assert not planned_order_ids(result["plan"]) & set(got)
    assert not any(t["vehicleId"] == "V-A2" for t in result["plan"]["trips"])  # fuel-starved truck stays home
    assert check_rules(ctx, result["plan"])[1] == []


def test_over_capacity_day_reefer_capacity_goes_to_chilled_orders_inside_their_window():
    """Found while writing these tests: the redraft's ``prioritise`` constraint for the late mall stop sorts
    that ambient group ahead of the chilled ones, the mall order takes a reefer trip, and two chilled
    Fresh orders are deferred while the rest arrive at 11:30 for an 08:00 close (never flagged)."""
    ctx = ctx_for(_over_capacity_world())
    result = run_pipeline(ctx)
    got = deferral_reasons(result)
    assert {o for o in got if ctx.needs_reefer(o)} == {"X-C5"}  # the reefer's 2 x 2 m3 carry four of the five
    for t in result["plan"]["trips"]:
        for s in t["stops"]:
            assert h.to_min(s["arrive"]) <= h.to_min(ctx.outlets[s["outletId"]]["windowClose"]), (t["id"], s)


@pytest.mark.parametrize(
    "skipped",
    [{"deferredYesterday": True, "daysSince": 1}, {"daysSince": 3}],
    ids=["deferred_yesterday", "days_since"],
)
def test_over_capacity_day_previously_skipped_outlet_is_prioritised(skipped):
    # two outlets, room for one order; the alphabetically-first one was served on time, the other was skipped
    outlets = [
        fx.outlet("K-1", "STYLE", "Alpha", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
        fx.outlet("K-2", "STYLE", "Alpha", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
    ]
    orders = [fx.order("K-A", "K-1", "STYLE", "AMBIENT", 600, 1.0), fx.order("K-B", "K-2", "STYLE", "AMBIENT", 600, 1.0, **skipped)]
    ctx = ctx_for(world(outlets=outlets, vehicles=[TRUCK], orders=orders))
    assert ctx.scores["K-B"] > ctx.scores["K-A"]
    # skipped yesterday is protected outright (never two days running); overdue alone only raises the score
    assert ctx.protected["K-B"] is bool(skipped.get("deferredYesterday"))
    # one 700 kg truck carries one 600 kg order per trip, and a trip takes 20 + 250 = 270 min: two would break 480
    ctx.vehicles["V-T1"] = {**ctx.vehicles["V-T1"], "capacityKg": 700}
    ctx.allowances[("STYLE", "REAR_DOCK")] = 250
    result = run_pipeline(ctx)
    assert planned_order_ids(result["plan"]) == {"K-B"}
    assert deferral_reasons(result) == {"K-A": "CAP_TIME"}


def test_over_capacity_day_protected_order_that_cannot_be_placed_needs_review():
    outlets = [
        fx.outlet("Q-P", "FRESH", "Alpha", "REAR_DOCK", "NORMAL", "05:00", "08:00", protected=True),
        fx.outlet("Q-N", "STYLE", "Alpha", "REAR_DOCK", "NORMAL", "09:00", "17:00"),
    ]
    orders = [fx.order("Q-1", "Q-P", "FRESH", "CHILLED", 100, 1.0), fx.order("Q-2", "Q-N", "STYLE", "AMBIENT", 100, 1.0)]
    ctx = ctx_for(world(outlets=outlets, vehicles=[TRUCK], orders=orders))  # no reefer at all
    assert ctx.protected["Q-1"]
    result = run_pipeline(ctx)
    assert trip_of(result["plan"], "Q-1") is None
    assert [(r["orderId"], r["reason"]) for r in result["needsReview"]] == [("Q-1", "PROTECTED_UNPLACED")]
    assert "CAP_REEFER" in result["needsReview"][0]["detail"]
    assert "Q-1" not in deferral_reasons(result)  # surfaced for the dispatcher, never silently deferred
    assert trip_of(result["plan"], "Q-2")["vehicleId"] == "V-T1"


def test_over_capacity_day_outlet_skipped_yesterday_is_never_deferred_again_even_with_a_low_score():
    # an ambient Style order skipped yesterday scores below the protected threshold, yet must not be deferred
    # a second day running: when it cannot be placed, the dispatcher is asked to place it (needsReview)
    outlets = [fx.outlet("Y-1", "STYLE", "Alpha", "REAR_DOCK", "NORMAL", "09:00", "17:00")]
    orders = [fx.order("Y-A", "Y-1", "STYLE", "AMBIENT", 900, 1.0, deferredYesterday=True, daysSince=2)]
    ctx = ctx_for(world(outlets=outlets, vehicles=[TRUCK], orders=orders))
    assert not h.is_protected(ctx.scores["Y-A"])  # the score alone would not protect it
    ctx.vehicles["V-T1"] = {**ctx.vehicles["V-T1"], "capacityKg": 700}  # it cannot fit
    result = run_pipeline(ctx)
    assert "Y-A" not in deferral_reasons(result)
    assert [(r["orderId"], r["reason"]) for r in result["needsReview"]] == [("Y-A", "PROTECTED_UNPLACED")]


# ---------------------------------------------------------------- manual moves (dispatcher edits)
def test_manual_move_is_checked_against_every_constraint():
    remote = fx.outlet("D-R", "STYLE", "Remote", "REAR_DOCK", "NORMAL", "04:00", "05:00")
    low_fuel = fx.vehicle("V-T2", "TRUCK", "AMBIENT", 1000, 8, 5, 100, 95)  # an Alpha round trip needs 6 L
    orders = [
        fx.order("E-1", "T-A", "STYLE", "AMBIENT", 400, 1.0),
        fx.order("E-2", "P-V", "STYLE", "AMBIENT", 100, 1.0),
        fx.order("E-3", "D-R", "STYLE", "AMBIENT", 100, 1.0),
        fx.order("E-4", "T-A", "STYLE", "AMBIENT", 700, 1.0),
    ]
    ctx = ctx_for(world(outlets=[STYLE_ALPHA, VAN_OUTLET, remote], vehicles=[TRUCK, VAN, low_fuel], orders=orders))
    plan = schedule(ctx, {"version": 1, "trips": [{"vehicleId": "V-T1", "tripNo": 1, "orderIds": ["E-1"]}], "unassigned": []})

    def move(oid: str, vid: str, trip_no: int = 1) -> str:
        return apply_edits(ctx, plan, [{"op": "move", "orderId": oid, "vehicleId": vid, "tripNo": trip_no}])[1][0]

    assert move("E-4", "V-T1", 2) == "Moved E-4 to V-T1 trip 2"  # inside every rule: no flag
    assert "flagged, breaks weight CAP_TIME" in move("E-4", "V-T1")  # 400 + 700 kg on a 1000 kg truck
    assert "flagged, breaks van_only ACCESS" in move("E-2", "V-T1", 2)
    assert "flagged, breaks window WINDOW" in move("E-3", "V-T1", 2)  # 150 min out: arrives after 05:00
    assert "flagged, breaks fuel FUEL" in move("E-4", "V-T2")
    with pytest.raises(EditError, match="at most 2 trips"):
        move("E-4", "V-T1", 3)
    with pytest.raises(EditError, match="Unknown vehicle"):  # another depot's vehicle is never in scope
        move("E-4", "V-X9")
