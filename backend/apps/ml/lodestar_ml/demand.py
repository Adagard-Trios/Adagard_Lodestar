"""POST /forecast/weeks: the Task 2A model (dtcore.DemandForecaster) for weekly total and chilled m3 per depot x brand.

The forecaster refits its per-series models on the history it was pickled with and forecasts the weeks right after
it (horizon h = 1, 2, ...), for every series at once. So a request for any week up to MAX_HORIZON weeks after the
history is answered by forecasting all series over every week up to the furthest one asked, then picking the weeks
asked. The weekly calendar drivers come from the request's daily calendar (dtcore.weekly_calendar); a week without
all seven days in the request takes the same ISO week of the last year in the history. Results are cached by the
input (the forecast is deterministic and takes from seconds to minutes: every series' models are refitted). A
request waits at most ML_FORECAST_WAIT_S for a forecast that is not cached; the computation carries on in the
background (once per input), so the caller falls back this time and gets the model's figures on a later ask.
"""

from __future__ import annotations

import logging
import threading
from collections import OrderedDict
from concurrent.futures import Future, ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd

from .canon import canon
from .schemas import CalendarDayIn, WeekIn
from .stops import UnsupportedInput

log = logging.getLogger("lodestar_ml")

MAX_HORIZON = 52  # the seasonal-naive and global models read the value 52 weeks before each target week
CACHE_SIZE = 16


class Computing(RuntimeError):
    """The forecast is still being computed (answered 503 with Retry-After; callers fall back meanwhile)."""


class DemandPredictor:
    def __init__(self, model: Any, dtcore: Any):
        self.model, self.dt = model, dtcore
        p = model.panel_
        self.depots = sorted(p.depot.astype(str).unique())
        self.brands = sorted(p.brand.astype(str).unique())
        self.history_end: date = pd.Timestamp(p.week_start.max()).date()
        cols = [c for c in ["iso_year", "iso_week", *getattr(dtcore, "EXOG", [])] if c in p.columns]
        h = p[cols].drop_duplicates(["iso_year", "iso_week"]).sort_values(["iso_year", "iso_week"])
        self.season = h.drop_duplicates("iso_week", keep="last").set_index("iso_week")
        self._cache: OrderedDict[tuple, pd.DataFrame] = OrderedDict()
        self._lock = threading.Lock()
        self._pending: dict[tuple, Future] = {}
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="forecast")

    # ------------------------------------------------------------------ calendar
    def _weekly(self, weeks: list[date], calendar: list[CalendarDayIn]) -> tuple[pd.DataFrame, dict[date, str]]:
        days = {c.date: c for c in calendar}
        rows = []
        for c in sorted(days.values(), key=lambda d: d.date):
            d = date.fromisoformat(c.date)
            iso = d.isocalendar()
            rows.append({
                "date": c.date, "iso_year": iso.year, "iso_week": iso.week, "is_operating": int(c.isOperating),
                "is_payday": int(c.isPayday), "is_holiday": int(c.isHoliday), "festival": c.festivalName or None,
                "festival_ramp": float(c.festivalRamp), "monsoon": int(c.monsoon), "is_weekend": int(d.weekday() >= 5),
            })
        given = self.dt.weekly_calendar(pd.DataFrame(rows)) if rows else None
        out, source = [], {}
        for ws in weeks:
            iso = ws.isocalendar()
            full = all((ws + timedelta(days=k)).isoformat() in days for k in range(7))
            if full and given is not None:
                r = given[(given.iso_year == iso.year) & (given.iso_week == iso.week)].iloc[0].to_dict()
                source[ws] = "request"
            else:
                # the same ISO week of the last year in the history (or the nearest week it has)
                key = min(self.season.index, key=lambda k: min(abs(k - iso.week), 52 - abs(k - iso.week)))
                r = self.season.loc[key].to_dict()
                for k in (1, 2, 3):  # the seasonal terms follow the ISO week itself
                    r[f"sin{k}"] = float(np.sin(2 * np.pi * k * iso.week / 52.18))
                    r[f"cos{k}"] = float(np.cos(2 * np.pi * k * iso.week / 52.18))
                source[ws] = "history"
            r.update({"iso_year": iso.year, "iso_week": iso.week, "week_start": pd.Timestamp(ws)})
            out.append(r)
        cols = ["iso_year", "iso_week", "week_start", *getattr(self.dt, "EXOG", [])]
        return pd.DataFrame(out)[cols], source

    # ------------------------------------------------------------------ forecast
    def _compute(self, key: tuple, future: list[date], wcal: pd.DataFrame) -> pd.DataFrame:
        try:
            req = pd.DataFrame([
                {"row_id": f"{d}|{b}|{ws.isoformat()}", "depot": d, "brand": b, "iso_year": ws.isocalendar().year,
                 "iso_week": ws.isocalendar().week}
                for d in self.depots for b in self.brands for ws in future
            ])
            pred = self.model.predict(req, wcal).set_index("row_id")
            with self._lock:
                self._cache[key] = pred
                while len(self._cache) > CACHE_SIZE:
                    self._cache.popitem(last=False)
            return pred
        finally:
            with self._lock:
                self._pending.pop(key, None)

    def _result(self, key: tuple, future: list[date], wcal: pd.DataFrame, wait_s: float | None) -> pd.DataFrame:
        """The cached forecast, or the one being computed (started once per input, single-flight). Waits at most
        wait_s (None = until done), then raises Computing: the forecast keeps running and the next ask is a hit."""
        with self._lock:
            pred = self._cache.get(key)
            if pred is not None:
                self._cache.move_to_end(key)
                return pred
            fut = self._pending.get(key)
            if fut is None:
                fut = self._pending[key] = self._executor.submit(self._compute, key, future, wcal)
        try:
            return fut.result(timeout=wait_s)
        except FutureTimeout as exc:
            raise Computing("the demand forecast for these weeks is being computed; ask again shortly") from exc

    def forecast(self, weeks: list[WeekIn], calendar: list[CalendarDayIn], wait_s: float | None = None) -> list[dict[str, Any]]:
        asked = []
        for w in weeks:
            depot = canon(w.depot, self.depots, default_lower=False)
            brand = canon(w.brand, self.brands, default_lower=False)
            if depot not in self.depots or brand not in self.brands:
                raise UnsupportedInput(f"no demand series for {w.depot}/{w.brand}")
            try:
                ws = date.fromisocalendar(w.isoYear, w.isoWeek, 1)
            except ValueError as exc:
                raise UnsupportedInput(f"{w.isoYear}-W{w.isoWeek} is not an ISO week") from exc
            h = (ws - self.history_end).days // 7
            if not 1 <= h <= MAX_HORIZON:
                raise UnsupportedInput(
                    f"{w.isoYear}-W{w.isoWeek:02d} is {h} weeks after the model's history (ends {self.history_end}); "
                    f"the model forecasts 1..{MAX_HORIZON}")
            asked.append((w, depot, brand, ws, h))
        horizon = max(a[4] for a in asked)
        future = [self.history_end + timedelta(weeks=k) for k in range(1, horizon + 1)]
        wcal, source = self._weekly(future, calendar)
        key = (horizon, tuple(np.round(wcal.drop(columns=["week_start"]).to_numpy(float), 6).ravel().tolist()))
        pred = self._result(key, future, wcal, wait_s)
        out = []
        for w, depot, brand, ws, h in asked:
            r = pred.loc[f"{depot}|{brand}|{ws.isoformat()}"]
            out.append({
                "depot": w.depot, "brand": w.brand, "isoYear": w.isoYear, "isoWeek": w.isoWeek,
                "weekStart": ws.isoformat(), "horizon": h,
                "totalM3": round(float(r.pred_total_volume_m3), 2),
                "chilledM3": round(float(r.pred_chilled_volume_m3), 2),
                "calendarFrom": source[ws],
            })
        return out
