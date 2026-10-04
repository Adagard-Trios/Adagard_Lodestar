"""POST /predict/stops: the Task 1 model (dtcore.Task1Model) on Lodestar's planned stops.

The request rows become the frames dtcore.build_task1_features reads (task1 inputs, route legs and the reference
tables), built only from what the request carries; then:
  * every categorical column is re-cast to the categories the models were trained with (read back from the
    pickled LightGBM model), so a value means the same code it meant in training;
  * typical traffic (district x hour x monsoon) comes from the route simulator's own lookup table;
  * numeric features the request cannot know (e.g. free-flow speed) are filled with their training means (read
    back from the pickled Ridge pipeline's scaler).
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Any

import numpy as np
import pandas as pd

from .canon import canon, temp_requirement, vehicle_temp
from .schemas import StopIn

log = logging.getLogger("lodestar_ml")


class UnsupportedInput(ValueError):
    """The request is valid but outside what the model knows (answered 422; callers fall back)."""


def _scaler_means(pipeline: Any) -> dict[str, float]:
    try:
        ct = pipeline.steps[0][1]
        sc = ct.named_transformers_["remainder"]
        return {str(n): float(m) for n, m in zip(sc.feature_names_in_, sc.mean_)}
    except Exception:  # noqa: BLE001 - a model without a readable scaler just gets no fill values
        return {}


class StopPredictor:
    def __init__(self, model: Any, dtcore: Any):
        self.model, self.dt = model, dtcore
        self.gbm_cats: list[str] = list(getattr(dtcore, "GBM_CATS", []))
        self.cats: dict[str, list[str]] = {}
        try:
            booster = model.svc_models_["svc_lgbm"].booster_
            self.cats = {c: list(v) for c, v in zip(self.gbm_cats, booster.pandas_categorical)}
        except Exception:  # noqa: BLE001
            log.warning("training categories not readable from the Task 1 model; request values used as given")
        self.means: dict[str, float] = {}
        for attr, name in (("svc_models_", "svc_ridge_log"), ("late_models_", "late_logreg")):
            self.means.update(_scaler_means(getattr(model, attr, {}).get(name)))
        sim = getattr(model, "sim_", None)
        self.districts: list[str] = list(getattr(sim, "districts_", []) or [])
        self.traffic = self._traffic(sim)

    def _traffic(self, sim: Any) -> pd.DataFrame:
        speed = getattr(sim, "speed_", None)
        if speed is None or not self.districts:
            return pd.DataFrame({"district": pd.Series(dtype=str), "hour": pd.Series(dtype=int),
                                 "monsoon": pd.Series(dtype=int), "speed_index": pd.Series(dtype=float)})
        rows = [(d, h, m, float(speed[i, h, m])) for i, d in enumerate(self.districts) for h in range(24) for m in (0, 1)]
        return pd.DataFrame(rows, columns=["district", "hour", "monsoon", "speed_index"])

    def known(self, col: str) -> list[str] | None:
        if col == "district" and self.districts:
            return self.districts
        return self.cats.get(col)

    # ------------------------------------------------------------------ frames
    def frames(self, stops: list[StopIn]) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, pd.DataFrame]]:
        orders, legs, outlets, vehicles, travel, allowance, cal, road = [], [], {}, {}, {}, {}, {}, {}
        seen: set[tuple[str, int]] = set()
        for s in stops:
            if (s.routeId, s.seq) in seen:
                raise UnsupportedInput(f"route {s.routeId} has two stops with seq {s.seq}")
            seen.add((s.routeId, s.seq))
            brand = canon(s.brand, self.known("brand"))
            district = canon(s.district, self.known("district"), default_lower=False)
            if self.districts and district not in self.districts:
                raise UnsupportedInput(f"district {s.district!r} is not one the model was trained on")
            depot = canon(s.depot, self.known("depot"), default_lower=False)
            dock = canon(s.dockType, self.known("dock_type"))
            parking = canon(s.parking, self.known("parking_constraint"))
            vtype = canon(s.vehicleType, self.known("vehicle_type"))
            vtemp = vehicle_temp(s.vehicleTemp)
            day = date.fromisoformat(s.date)
            ff = s.freeFlowKmh
            if ff is None and s.depotToDistrictKm and s.depotToDistrictMin:
                ff = s.depotToDistrictKm / (s.depotToDistrictMin / 60.0)
            dist_km = s.distanceKm if s.distanceKm is not None else s.plannedTravelMin * (ff or 30.0) / 60.0
            orders.append({
                "delivery_id": s.stopId, "order_date": s.orderDate or s.date, "dispatch_date": s.date,
                "dispatch_status": "deferred" if s.deferred else "attempted", "outlet_id": s.outletId,
                "brand": brand, "district": district, "depot": depot, "temp_requirement": temp_requirement(s.tempRequirement),
                "order_units": float(s.units), "order_weight_kg": float(s.kg), "order_volume_m3": float(s.m3),
                "route_id": s.routeId, "seq_in_route": s.seq, "vehicle_id": s.vehicleId, "vehicle_type": vtype,
                "vehicle_temp": vtemp, "planned_arrival_time": s.plannedArrive, "window_open_time": s.windowOpen,
                "window_close_time": s.windowClose,
            })
            legs.append({
                "leg_id": f"{s.routeId}:{s.seq}", "date": s.date, "route_id": s.routeId, "seq": s.seq,
                "from_point": "DEPOT" if s.seq == 0 else "OUTLET", "distance_km": float(dist_km),
                "planned_depart_time": s.plannedDepart, "planned_travel_duration_min": float(s.plannedTravelMin),
                "planned_arrival_time": s.plannedArrive, "monsoon": int(s.monsoon), "dow": day.weekday(),
            })
            outlets.setdefault(s.outletId, {
                "outlet_id": s.outletId, "brand": brand, "district": district, "depot": depot, "dock_type": dock,
                "parking_constraint": parking, "mall_window": s.mallWindow or np.nan,
            })
            vehicles.setdefault(s.vehicleId, {
                "vehicle_id": s.vehicleId, "type": vtype, "temp": vtemp, "weight_cap_kg": float(s.capacityKg),
                "volume_cap_m3": float(s.capacityM3), "km_per_l": s.kmPerLitre if s.kmPerLitre is not None else np.nan,
                "weekly_fuel_quota_l": s.weeklyFuelL if s.weeklyFuelL is not None else np.nan,
            })
            travel.setdefault(district, {
                "district": district, "road_class": canon(s.roadClass or "suburban", self.known("road_class")),
                "free_flow_kmh": ff if ff is not None else np.nan,
                "depot_to_district_km": s.depotToDistrictKm if s.depotToDistrictKm is not None else np.nan,
                "depot_to_district_freeflow_min": s.depotToDistrictMin if s.depotToDistrictMin is not None else np.nan,
                "inter_stop_km": s.interStopKm if s.interStopKm is not None else np.nan,
                "inter_stop_freeflow_min": s.interStopMin if s.interStopMin is not None else np.nan,
            })
            allowance.setdefault((brand, dock), {"brand": brand, "dock_type": dock, "service_allowance_min": float(s.serviceAllowanceMin)})
            cal.setdefault(s.date, {
                "date": s.date, "is_weekend": int(day.weekday() >= 5), "is_payday": int(s.isPayday),
                "festival_ramp": float(s.festivalRamp), "is_holiday": int(s.isHoliday),
                "iso_week": day.isocalendar().week, "monsoon": int(s.monsoon),
            })
            if s.disruptionIndex is not None:
                road.setdefault((district, s.date), {"district": district, "date": s.date, "disruption_index": float(s.disruptionIndex)})
        # every route needs its stops 0..n-1 (the features count positions and the simulator replays from stop 0)
        o = pd.DataFrame(orders)
        for rid, g in o.groupby("route_id"):
            if sorted(g.seq_in_route) != list(range(len(g))):
                raise UnsupportedInput(f"route {rid}: stop seq must run 0..{len(g) - 1}")
        ref = {
            "outlets": pd.DataFrame(list(outlets.values())),
            "vehicles": pd.DataFrame(list(vehicles.values())),
            "district_travel": pd.DataFrame(list(travel.values())),
            "service_allowance": pd.DataFrame(list(allowance.values())),
            "calendar": pd.DataFrame(list(cal.values())),
            "road_conditions": pd.DataFrame(list(road.values()), columns=["district", "date", "disruption_index"]),
            "traffic_speed": self.traffic,
        }
        return o, pd.DataFrame(legs), ref

    def features(self, stops: list[StopIn]) -> pd.DataFrame:
        orders, legs, ref = self.frames(stops)
        f = self.dt.build_task1_features(orders, legs, ref)
        for c, cats in self.cats.items():
            if c in f.columns:
                f[c] = pd.Categorical(f[c].astype(object).where(f[c].notna(), None), categories=cats)
        for c, m in self.means.items():
            if c in f.columns and f[c].isna().any():
                f[c] = f[c].astype(float).fillna(m)
        return f

    def sample(self) -> list[StopIn]:
        """A one-stop route the model knows every value of: the keep-warm request (see app.keep_warm)."""
        first = lambda col, fallback: (self.known(col) or [fallback])[0]  # noqa: E731
        return [StopIn(
            stopId="warm", routeId="warm", seq=0, date="2026-01-05", outletId="WARM", brand=first("brand", "FRESH"),
            district=first("district", "Colombo"), depot=first("depot", "PELIYAGODA"), dockType=first("dock_type", "REAR_DOCK"),
            parking=first("parking_constraint", "NORMAL"), windowOpen="05:00", windowClose="08:00", units=10, kg=90, m3=0.5,
            vehicleId="WARM", vehicleType=first("vehicle_type", "TRUCK"), vehicleTemp="CHILLED", capacityKg=5000, capacityM3=25,
            plannedDepart="05:00", plannedArrive="05:20", plannedTravelMin=20, distanceKm=8, serviceAllowanceMin=15,
        )]

    def predict(self, stops: list[StopIn]) -> list[dict[str, Any]]:
        f = self.features(stops)
        out, parts = self.model.predict(f, return_parts=True)
        sim = parts.get("sim") if isinstance(parts, dict) else None
        res = []
        for i, row in enumerate(out.itertuples(index=False)):
            p50 = p90 = None
            if sim is not None and "sim_arrive_p50" in sim:
                p50 = round(float(sim["sim_arrive_p50"].iloc[i]), 1)
                p90 = round(float(sim["sim_arrive_p90"].iloc[i]), 1)
            res.append({
                "stopId": str(row.delivery_id),
                "serviceMin": round(float(row.pred_service_min), 2),
                "lateProb": round(float(row.pred_late_prob), 4),
                "etaMin": p50,
                "etaP90Min": p90,
            })
        order = {s.stopId: i for i, s in enumerate(stops)}
        res.sort(key=lambda r: order.get(r["stopId"], 0))
        return res
