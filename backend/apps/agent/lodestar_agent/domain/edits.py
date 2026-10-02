"""Human (or agent-proposed) edits to a draft plan."""

from __future__ import annotations

from typing import Any

from . import heuristics as h
from .context import PlanningContext
from .deferrals import REASON_CODES
from .planner import schedule
from .rules import check_rules


class EditError(ValueError):
    """An edit that can never be applied (unknown ids, protected deferral, wrong vehicle class)."""


def validate_edit(ctx: PlanningContext, plan: dict[str, Any], edit: dict[str, Any]) -> None:
    oid = edit.get("orderId")
    if oid not in ctx.orders:
        raise EditError(f"Unknown order {oid}")
    op = edit.get("op")
    if op == "defer":
        if ctx.protected.get(oid):
            raise EditError(f"{oid} is protected and can't be deferred")
        if edit.get("reason") not in REASON_CODES:
            raise EditError(f"Deferral of {oid} needs a reason code: {', '.join(REASON_CODES)}")
        return
    if op != "move":
        raise EditError(f"Unknown edit op {op}")
    vid = edit.get("vehicleId")
    v = ctx.vehicles.get(vid or "")
    if v is None:
        raise EditError(f"Unknown vehicle {vid} for depot {ctx.depot}")
    if v.get("status", "AVAILABLE") != "AVAILABLE":
        raise EditError(f"{vid} is not available ({v.get('status')})")
    if ctx.needs_reefer(oid) and v.get("tempClass") != "CHILLED":
        raise EditError(f"{oid} is chilled and {vid} is not a reefer")
    trip_no = int(edit.get("tripNo") or 1)
    if not 1 <= trip_no <= h.MAX_TRIPS_PER_VEHICLE:
        raise EditError(f"{vid} runs at most {h.MAX_TRIPS_PER_VEHICLE} trips a day: there is no trip {trip_no}")
    target = next((t for t in plan["trips"] if t["vehicleId"] == vid and t["tripNo"] == trip_no), None)
    if target and [o for o in target["orderIds"] if o != oid]:
        if target["brand"] != ctx.brand_of(oid) or target["district"] != ctx.district_of(oid):
            raise EditError(f"{vid} trip {trip_no} is {target['brand']}/{target['district']}: one brand and one district per trip")


def _move_breaks(ctx: PlanningContext, before: dict[str, Any], after: dict[str, Any], oid: str, vid: str) -> list[str]:
    """Hard rules a move newly breaks on the order or its new vehicle (flagged with the reason, not refused)."""
    had = {(v["rule"], v["vehicleId"]) for v in check_rules(ctx, before)[1]}
    return [
        f"{v['rule']} {v['reason']}: {v['detail']}"
        for v in check_rules(ctx, after)[1]
        if (oid in v["orderIds"] or v["vehicleId"] == vid) and (oid in v["orderIds"] or (v["rule"], v["vehicleId"]) not in had)
    ]


def apply_edits(ctx: PlanningContext, plan: dict[str, Any], edits: list[dict[str, Any]]) -> tuple[dict[str, Any], list[str]]:
    trips = [{"vehicleId": t["vehicleId"], "tripNo": t["tripNo"], "orderIds": list(t["orderIds"])} for t in plan["trips"]]
    unassigned = {u["orderId"]: u["reason"] for u in plan.get("unassigned", [])}
    applied: list[str] = []
    for edit in edits:
        current = schedule(ctx, {**plan, "trips": [dict(t) for t in trips if t["orderIds"]]})
        validate_edit(ctx, current, edit)
        oid = edit["orderId"]
        for t in trips:
            if oid in t["orderIds"]:
                t["orderIds"].remove(oid)
        unassigned.pop(oid, None)
        if edit["op"] == "defer":
            unassigned[oid] = edit["reason"]
            applied.append(f"Deferred {oid} ({edit['reason']})")
            continue
        vid, trip_no = edit["vehicleId"], int(edit.get("tripNo") or 1)
        target = next((t for t in trips if t["vehicleId"] == vid and t["tripNo"] == trip_no), None)
        if target is None:
            trips.append({"vehicleId": vid, "tripNo": trip_no, "orderIds": [oid]})
        else:
            target["orderIds"].append(oid)
        after = schedule(ctx, {**plan, "trips": [dict(t) for t in trips if t["orderIds"]]})
        breaks = _move_breaks(ctx, current, after, oid, vid)
        applied.append(f"Moved {oid} to {vid} trip {trip_no}" + (f" (flagged, breaks {'; '.join(breaks)})" if breaks else ""))
    new_plan = {
        **plan,
        "version": int(plan.get("version", 1)) + 1,
        "trips": [t for t in trips if t["orderIds"]],
        "unassigned": [{"orderId": o, "reason": r} for o, r in sorted(unassigned.items())],
    }
    return schedule(ctx, new_plan), applied
