"""The Task 1 model on drafts (ML service) with fallback to the heuristics."""

from __future__ import annotations

from typing import Any

import httpx
import pytest

from lodestar_agent import ml_client
from lodestar_agent.config import get_settings
from lodestar_agent.domain import planner
from lodestar_agent.domain.context import PlanningContext
from lodestar_agent.domain.stop_model import apply_stop_model, stop_rows

from . import fixtures as fx


def ctx() -> PlanningContext:
    return PlanningContext.from_raw(fx.raw(), fx.DEPOT, fx.RUN_DATE)


class FakeModel:
    def __init__(self, answer: bool = True):
        self.calls: list[list[dict[str, Any]]] = []
        self.answer = answer

    def __call__(self, rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]] | None:
        self.calls.append(rows)
        if not self.answer:
            return None
        return {r["stopId"]: {"stopId": r["stopId"], "serviceMin": 21.6, "lateProb": 0.373, "etaMin": 400.4, "etaP90Min": 420} for r in rows}


@pytest.fixture()
def heuristic_plan():
    c = ctx()
    return c, planner.draft_plan(c, [], 1)  # ML_URL unset in tests: heuristics only


@pytest.fixture()
def ml_url(monkeypatch):
    monkeypatch.setenv("ML_URL", "http://ml:8000")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_without_ml_url_the_heuristics_stay(heuristic_plan):
    c, plan = heuristic_plan
    stop = plan["trips"][0]["stops"][0]
    assert stop["serviceMin"] == c.service_min(stop["orderId"])


def test_one_batch_per_draft_overrides_service_eta_and_late_risk(heuristic_plan):
    c, plan = heuristic_plan
    model = FakeModel()
    trips = plan["trips"]
    apply_stop_model(c, trips, model)
    assert len(model.calls) == 1
    assert len(model.calls[0]) == sum(len(t["stops"]) for t in trips)
    s = trips[0]["stops"][0]
    assert (s["serviceMin"], s["etaModel"], s["lateRiskPct"]) == (22, "06:40", 37)
    # the plan arrival stays the heuristic plan
    assert s["arrive"] == planner.draft_plan(ctx(), [], 1)["trips"][0]["stops"][0]["arrive"]


def test_rows_rebuild_the_planned_legs(heuristic_plan):
    c, plan = heuristic_plan
    trip = next(t for t in plan["trips"] if len(t["stops"]) > 1)
    rows = stop_rows(c, trip)
    travel = c.travel_for(trip["district"])
    assert [r["seq"] for r in rows] == list(range(len(rows)))
    assert rows[0]["plannedDepart"] == trip["departs"]
    assert rows[0]["plannedTravelMin"] == travel["depotToDistMin"]
    assert rows[1]["plannedTravelMin"] == travel["interStopMin"]
    first = trip["stops"][0]
    leave = int(first["arrive"][:2]) * 60 + int(first["arrive"][3:]) + first["serviceMin"]
    assert rows[1]["plannedDepart"] == f"{leave // 60:02d}:{leave % 60:02d}"
    assert all(r["routeId"] == trip["id"] and r["depot"] == fx.DEPOT and r["date"] == fx.RUN_DATE for r in rows)


def test_unchanged_trips_are_not_asked_again(heuristic_plan):
    c, plan = heuristic_plan
    model = FakeModel()
    apply_stop_model(c, plan["trips"], model)
    again = planner.schedule(c, {**plan, "trips": [dict(t) for t in plan["trips"]]})
    apply_stop_model(c, again["trips"], model)
    assert len(model.calls) == 1
    assert again["trips"][0]["stops"][0]["lateRiskPct"] == 37


def test_a_failure_keeps_the_heuristics_and_stops_asking_for_the_run(heuristic_plan):
    c, plan = heuristic_plan
    before = [dict(s) for s in plan["trips"][0]["stops"]]
    model = FakeModel(answer=False)
    apply_stop_model(c, plan["trips"], model)
    assert plan["trips"][0]["stops"] == before
    apply_stop_model(c, plan["trips"][:1] + [{**plan["trips"][0], "departs": "02:00"}], model)
    assert len(model.calls) == 1


def test_schedule_calls_the_service_when_configured(ml_url, monkeypatch):
    seen: list[dict[str, Any]] = []

    def post(url, json, timeout):  # noqa: A002 - httpx's keyword
        seen.append({"url": url, "timeout": timeout, "n": len(json["stops"])})
        preds = [{"stopId": s["stopId"], "serviceMin": 18.2, "lateProb": 0.05, "etaMin": 330.0, "etaP90Min": 345.0} for s in json["stops"]]
        return httpx.Response(200, json={"predictions": preds})

    monkeypatch.setattr(ml_client.httpx, "post", post)
    plan = planner.draft_plan(ctx(), [], 1)
    assert seen and seen[0]["url"] == "http://ml:8000/predict/stops" and seen[0]["timeout"] == 5.0
    assert len(seen) == 1  # one batch for the draft
    assert {s["serviceMin"] for t in plan["trips"] for s in t["stops"]} == {18}


@pytest.mark.parametrize("failure", ["timeout", "503", "garbage"])
def test_service_failures_fall_back(ml_url, monkeypatch, failure, caplog):
    def post(url, json, timeout):  # noqa: A002
        if failure == "timeout":
            raise httpx.ReadTimeout("timed out")
        if failure == "503":
            return httpx.Response(503, json={"error": {"code": 503, "message": "task1 model not loaded"}})
        return httpx.Response(200, text="not json")

    monkeypatch.setattr(ml_client.httpx, "post", post)
    monkeypatch.setattr(ml_client, "_failing", False)
    c = ctx()
    plan = planner.draft_plan(c, [], 1)
    s = plan["trips"][0]["stops"][0]
    assert s["serviceMin"] == c.service_min(s["orderId"])
    assert sum("heuristic instead" in r.message for r in caplog.records) == 1
