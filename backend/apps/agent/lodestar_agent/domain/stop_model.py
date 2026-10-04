"""The Task 1 model (ML service) on a scheduled draft: predicted service minutes, model ETA and late risk per stop.

``schedule`` lays the trips out with the booklet heuristics (service allowance, free-flow travel; those also drive
packing and the minutes budget); then ``apply_stop_model`` sends the draft's stops to POST /predict/stops in one
batch and, for every stop the model scored, replaces:
  * serviceMin  -> the model's predicted minutes at the stop,
  * etaModel    -> the model's simulated median arrival (route replayed with the predicted service times),
  * lateRiskPct -> the model's P(arrival after the window closes), in %.
The planned arrival (``arrive``) stays the heuristic plan, as the plan ETA does everywhere else.

Without the model (ML_URL unset, the service down, slow or refusing the input) the heuristic figures stay. A run
asks once per distinct trip (cached on the context), and stops asking after its first failure.
"""
 
from __future__ import annotations

from typing import Any

from . import heuristics as h
from .context import PlanningContext

Predictor = Any  # callable(list[dict]) -> dict[str, dict] | None

_STATE = "_stop_model_state"


def _clock(total: int) -> str:
    total = max(0, int(round(total)))
    return f"{total // 60:02d}:{total % 60:02d}"


def _state(ctx: PlanningContext) -> dict[str, Any]:
    st = ctx.__dict__.get(_STATE)
    if st is None:
        st = ctx.__dict__[_STATE] = {"off": False, "cache": {}}
    return st


def _key(ctx: PlanningContext, trip: dict[str, Any]) -> tuple:
    return (ctx.run_date, trip["vehicleId"], trip["departs"], tuple(trip["orderIds"]))


def stop_rows(ctx: PlanningContext, trip: dict[str, Any]) -> list[dict[str, Any]]:
    """The ML service's stop rows for one scheduled trip (stopId = orderId, routeId = trip id)."""
    travel = ctx.travel_for(trip["district"])
    to_dist = int(travel.get("depotToDistMin") or 0)
    inter = int(travel.get("interStopMin") or 0)
    dist_km = travel.get("distKm")
    vehicle = ctx.vehicles[trip["vehicleId"]]
    day = ctx.day(ctx.run_date)
    leave = h.to_min(trip["departs"])
    rows = []
    for i, s in enumerate(trip["stops"]):
        oid = s["orderId"]
        order, outlet = ctx.orders[oid], ctx.outlet_of(oid)
        leg_min = to_dist if i == 0 else inter
        leg_km = (float(dist_km) if dist_km is not None else to_dist * h.DEPOT_KM_PER_MIN) if i == 0 else inter * h.INTER_STOP_KM_PER_MIN
        rows.append({
            "stopId": oid, "routeId": trip["id"], "seq": i, "date": ctx.run_date,
            "orderDate": str(order.get("orderedAt") or ctx.run_date)[:10],
            "deferred": bool(order.get("deferredYesterday")) or order.get("status") == "DEFERRED",
            "outletId": outlet["id"], "brand": ctx.brand_of(oid), "district": ctx.district_of(oid), "depot": ctx.depot,
            "dockType": str(outlet.get("dockType") or ""), "parking": str(outlet.get("parking") or ""),
            "mallWindow": outlet.get("mallWindow"),
            "windowOpen": str(outlet.get("windowOpen") or "00:00"), "windowClose": str(outlet.get("windowClose") or "23:59"),
            "tempRequirement": str(order.get("tempClass") or "AMBIENT"),
            "units": float(order.get("units") or 0), "kg": float(order.get("kg") or 0), "m3": float(order.get("m3") or 0),
            "vehicleId": vehicle["id"], "vehicleType": str(vehicle.get("type") or ""), "vehicleTemp": str(vehicle.get("tempClass") or ""),
            "capacityKg": float(vehicle.get("capacityKg") or 1), "capacityM3": float(vehicle.get("capacityM3") or 1),
            "kmPerLitre": vehicle.get("kmPerLitre"), "weeklyFuelL": vehicle.get("weeklyLFuel"),
            "plannedDepart": _clock(leave), "plannedArrive": _clock(leave + leg_min), "plannedTravelMin": leg_min,
            "distanceKm": round(leg_km, 2), "roadClass": travel.get("roadClass"), "depotToDistrictKm": dist_km,
            "depotToDistrictMin": to_dist, "interStopMin": inter, "serviceAllowanceMin": ctx.service_min(oid),
            "monsoon": 1 if ctx.is_monsoon() else 0, "isPayday": bool(day.get("isPayday")),
            "festivalRamp": float(day.get("festivalRamp") or 0),
        })
        # the vehicle leaves when the allowance is over (the planned arrive already waits for the window)
        leave = h.to_min(s["arrive"]) + int(s["serviceMin"])
    return rows


def apply_stop_model(ctx: PlanningContext, trips: list[dict[str, Any]], predict: Predictor | None = None) -> None:
    """Overwrite serviceMin / etaModel / lateRiskPct with the model's figures where it answers (in place)."""
    if predict is None:
        from .. import ml_client

        if not ml_client.enabled():
            return
        predict = ml_client.predict_stops
    st = _state(ctx)
    todo = [t for t in trips if t["stops"] and _key(ctx, t) not in st["cache"]]
    if todo and not st["off"]:
        rows = [r for t in todo for r in stop_rows(ctx, t)]
        preds = predict(rows)
        if preds is None:
            st["off"] = True  # one failure per run: the rest of the run keeps the heuristic without waiting again
        else:
            for t in todo:
                st["cache"][_key(ctx, t)] = {s["orderId"]: preds.get(s["orderId"]) for s in t["stops"]}
    for t in trips:
        scored = st["cache"].get(_key(ctx, t))
        if not scored:
            continue
        for s in t["stops"]:
            p = scored.get(s["orderId"])
            if not p:
                continue
            s["serviceMin"] = max(1, int(round(float(p["serviceMin"]))))
            if p.get("etaMin") is not None:
                s["etaModel"] = h.fmt_min(int(round(float(p["etaMin"]))))
            s["lateRiskPct"] = max(0, min(100, int(round(float(p["lateProb"]) * 100))))
