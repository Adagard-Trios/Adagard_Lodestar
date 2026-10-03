"""Fake dtcore + fake pickled models: the real ones are never in the repo. They keep the interfaces the service
relies on (build_task1_features, weekly_calendar, Task1Model.predict(frame, return_parts), DemandForecaster.predict,
panel_, the LightGBM categories and the simulator lookup)."""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path

import pytest

FAKE_DTCORE = textwrap.dedent(
    '''
    import numpy as np
    import pandas as pd

    GBM_CATS = ["brand", "district", "dock_type"]
    EXOG = ["n_operating", "ramp_sum", "sin1", "cos1"]

    def hhmm(s):
        s = s.astype("string")
        return (pd.to_numeric(s.str.slice(0, 2)) * 60 + pd.to_numeric(s.str.slice(3, 5))).astype("float64")

    def build_task1_features(orders, legs, ref):
        lg = legs[["route_id", "seq", "date", "planned_depart_time", "planned_travel_duration_min", "monsoon"]]
        f = orders.merge(lg, left_on=["route_id", "seq_in_route"], right_on=["route_id", "seq"], how="inner")
        f = f.merge(ref["outlets"][["outlet_id", "dock_type"]], on="outlet_id", how="left")
        f = f.merge(ref["service_allowance"], on=["brand", "dock_type"], how="left")
        f = f.merge(ref["district_travel"][["district", "free_flow_kmh"]], on="district", how="left")
        f["p_arrive"] = hhmm(f.planned_arrival_time)
        f["w_close"] = hhmm(f.window_close_time)
        for c in GBM_CATS:
            f[c] = pd.Categorical(f[c])
        return f

    def weekly_calendar(calendar):
        c = calendar.copy()
        c["date"] = pd.to_datetime(c.date)
        w = c.groupby(["iso_year", "iso_week"]).agg(week_start=("date", "min"), n_operating=("is_operating", "sum"),
                                                    ramp_sum=("festival_ramp", "sum")).reset_index()
        w["sin1"] = np.sin(2 * np.pi * w.iso_week / 52.18)
        w["cos1"] = np.cos(2 * np.pi * w.iso_week / 52.18)
        return w

    class _Booster:
        pandas_categorical = [["Fresh", "Style", "Tech"], ["Colombo", "Kandy"], ["rear_dock", "street"]]

    class _Lgbm:
        booster_ = _Booster()

    class _Sim:
        districts_ = ["Colombo", "Kandy"]
        speed_ = np.full((2, 24, 2), 100.0)

    class Task1Model:
        def __init__(self):
            self.svc_models_ = {"svc_lgbm": _Lgbm()}
            self.late_models_ = {}
            self.sim_ = _Sim()
            self.seen = None

        def predict(self, frame, return_parts=False):
            f = frame.sort_values(["route_id", "seq"]).reset_index(drop=True)
            self.seen = f
            svc = f.service_allowance_min.to_numpy(float) + 0.5 * f.order_units.to_numpy(float)
            late = np.clip((f.p_arrive - (f.w_close - 60)).to_numpy(float) / 120, 0.01, 0.99)
            out = pd.DataFrame({"delivery_id": f.delivery_id.to_numpy(), "pred_service_min": svc, "pred_late_prob": late})
            sim = pd.DataFrame({"sim_arrive_p50": f.p_arrive + 3, "sim_arrive_p90": f.p_arrive + 12})
            return (out, {"sim": sim}) if return_parts else out

    class DemandForecaster:
        def __init__(self):
            weeks = pd.date_range("2026-01-05", "2026-03-23", freq="7D")
            rows = []
            for d in ("Kandy", "Peliyagoda"):
                for b in ("Fresh", "Style"):
                    for ws in weeks:
                        iso = ws.isocalendar()
                        rows.append({"depot": d, "brand": b, "iso_year": iso.year, "iso_week": iso.week, "week_start": ws,
                                     "total": 100.0, "chilled": 20.0, "n_operating": 6, "ramp_sum": 0.0,
                                     "sin1": 0.0, "cos1": 1.0, "sid": f"{d}|{b}"})
            self.panel_ = pd.DataFrame(rows)
            self.calls = 0

        def predict(self, requests, wcal):
            self.calls += 1
            r = requests.merge(wcal, on=["iso_year", "iso_week"], how="left")
            r["pred_total_volume_m3"] = 100.0 + 10 * r.n_operating + 50 * r.ramp_sum
            r["pred_chilled_volume_m3"] = np.where(r.brand == "Fresh", 20.0, 0.0)
            return requests[["row_id"]].merge(r[["row_id", "pred_total_volume_m3", "pred_chilled_volume_m3"]], on="row_id")
    '''
)


@pytest.fixture()
def models_dir(tmp_path: Path):
    """A models directory with the fake dtcore.py and the two fake models pickled through it."""
    (tmp_path / "dtcore.py").write_text(FAKE_DTCORE, encoding="utf-8")
    sys.modules.pop("dtcore", None)
    sys.path.insert(0, str(tmp_path))
    try:
        import importlib

        import joblib

        dt = importlib.import_module("dtcore")
        joblib.dump(dt.Task1Model(), tmp_path / "task1_model.pkl")
        joblib.dump(dt.DemandForecaster(), tmp_path / "task2a_model.pkl")
        sys.modules.pop("dtcore", None)
        sys.path.remove(str(tmp_path))
        yield tmp_path
    finally:
        sys.modules.pop("dtcore", None)
        while str(tmp_path) in sys.path:
            sys.path.remove(str(tmp_path))


def stop(seq: int, **kw) -> dict:
    base = {
        "stopId": f"S{seq}", "routeId": "TRIP-1", "seq": seq, "date": "2026-10-05", "outletId": f"OUT00{seq + 1}",
        "brand": "FRESH", "district": "Colombo", "depot": "PELIYAGODA", "dockType": "REAR_DOCK", "parking": "NORMAL",
        "windowOpen": "05:00", "windowClose": "08:00", "tempRequirement": "CHILLED", "units": 10, "kg": 90.5, "m3": 0.5,
        "vehicleId": "VEH001", "vehicleType": "TRUCK", "vehicleTemp": "CHILLED", "capacityKg": 5000, "capacityM3": 25,
        "kmPerLitre": 5.0, "plannedDepart": "05:00" if seq == 0 else f"05:{20 * seq:02d}",
        "plannedArrive": f"05:{20 * seq + 15:02d}", "plannedTravelMin": 15, "distanceKm": 6.0, "roadClass": "urban",
        "depotToDistrictKm": 12, "depotToDistrictMin": 24, "interStopMin": 8, "serviceAllowanceMin": 15, "monsoon": 0,
    }
    base.update(kw)
    return base
