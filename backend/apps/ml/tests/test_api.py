from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from lodestar_ml.app import create_app
from lodestar_ml.loader import load_models
from lodestar_ml.schemas import StopIn

from .conftest import stop


@pytest.fixture()
def client(models_dir):
    with TestClient(create_app(load_models(str(models_dir)))) as c:
        yield c


def calendar(start: date, days: int, **kw) -> list[dict]:
    return [{"date": (start + timedelta(days=k)).isoformat(), "isOperating": (start + timedelta(days=k)).weekday() < 6, **kw} for k in range(days)]


# ---------------------------------------------------------------- health / missing models
def test_health_ok_when_both_models_load(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["models"] == {"task1": True, "task2a": True}
    assert body["demandHistoryEnd"] == "2026-03-23"


def test_missing_models_dir_is_degraded_and_endpoints_503(tmp_path):
    with TestClient(create_app(load_models(str(tmp_path / "nowhere")))) as c:
        h = c.get("/health")
        assert h.status_code == 200
        assert h.json()["status"] == "degraded"
        assert "dtcore" in h.json()["errors"]
        assert c.post("/predict/stops", json={"stops": [stop(0)]}).status_code == 503
        weeks = [{"depot": "KANDY", "brand": "FRESH", "isoYear": 2026, "isoWeek": 41}]
        assert c.post("/forecast/weeks", json={"weeks": weeks}).status_code == 503


def test_one_missing_pickle_degrades_only_that_model(models_dir):
    (models_dir / "task2a_model.pkl").unlink()
    with TestClient(create_app(load_models(str(models_dir)))) as c:
        body = c.get("/health").json()
        assert body["status"] == "degraded" and body["models"] == {"task1": True, "task2a": False}
        assert c.post("/predict/stops", json={"stops": [stop(0)]}).status_code == 200


def test_lifespan_loads_from_ML_MODELS_DIR(models_dir, monkeypatch):
    monkeypatch.setenv("ML_MODELS_DIR", str(models_dir))
    with TestClient(create_app()) as c:
        assert c.get("/health").json()["status"] == "ok"


# ---------------------------------------------------------------- /predict/stops
def test_predict_stops_maps_lodestar_codes_and_returns_in_request_order(client, models_dir):
    r = client.post("/predict/stops", json={"stops": [stop(1, units=20), stop(0)]})
    assert r.status_code == 200, r.text
    preds = r.json()["predictions"]
    assert [p["stopId"] for p in preds] == ["S1", "S0"]
    assert preds[0]["serviceMin"] == 25.0  # allowance 15 + 0.5 x 20 units (fake model)
    assert preds[1]["etaMin"] == 5 * 60 + 15 + 3
    assert 0 < preds[0]["lateProb"] < 1


def test_categories_are_recast_to_the_training_categories(client):
    app = client.app
    f = app.state.stops.features([StopIn(**stop(0))])
    assert f["brand"].iloc[0] == "Fresh"  # FRESH -> Fresh
    assert list(f["brand"].cat.categories) == ["Fresh", "Style", "Tech"]
    assert f["dock_type"].iloc[0] == "rear_dock"
    assert list(f["district"].cat.categories) == ["Colombo", "Kandy"]


def test_unknown_district_is_422(client):
    r = client.post("/predict/stops", json={"stops": [stop(0, district="Atlantis")]})
    assert r.status_code == 422
    assert "Atlantis" in r.json()["error"]["message"]


def test_route_with_a_gap_in_seq_is_422(client):
    r = client.post("/predict/stops", json={"stops": [stop(0), stop(2)]})
    assert r.status_code == 422


def test_bad_body_is_422(client):
    assert client.post("/predict/stops", json={"stops": []}).status_code == 422
    assert client.post("/predict/stops", json={"stops": [stop(0, windowOpen="5am")]}).status_code == 422


# ---------------------------------------------------------------- /forecast/weeks
def test_forecast_weeks_uses_request_calendar_and_history_fallback(client):
    # W41 2026 starts Mon 2026-10-05: full calendar given (6 operating days, a festival ramp); W42 not given
    cal = calendar(date(2026, 10, 5), 7, festivalRamp=0.5)
    weeks = [{"depot": "KANDY", "brand": "FRESH", "isoYear": 2026, "isoWeek": 41},
             {"depot": "KANDY", "brand": "STYLE", "isoYear": 2026, "isoWeek": 42}]
    r = client.post("/forecast/weeks", json={"weeks": weeks, "calendar": cal})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["historyEnd"] == "2026-03-23"
    w41, w42 = body["weeks"]
    assert w41["depot"] == "KANDY" and w41["weekStart"] == "2026-10-05" and w41["calendarFrom"] == "request"
    assert w41["horizon"] == 28
    assert w41["totalM3"] == 100 + 10 * 6 + 50 * 3.5
    assert w41["chilledM3"] == 20.0
    assert w42["calendarFrom"] == "history" and w42["chilledM3"] == 0.0


def test_forecast_is_cached_for_the_same_input(client):
    weeks = [{"depot": "PELIYAGODA", "brand": "FRESH", "isoYear": 2026, "isoWeek": 20}]
    client.post("/forecast/weeks", json={"weeks": weeks})
    client.post("/forecast/weeks", json={"weeks": weeks})
    assert client.app.state.demand.model.calls == 1


def test_forecast_beyond_horizon_or_unknown_series_is_422(client):
    far = [{"depot": "KANDY", "brand": "FRESH", "isoYear": 2027, "isoWeek": 40}]
    assert client.post("/forecast/weeks", json={"weeks": far}).status_code == 422
    past = [{"depot": "KANDY", "brand": "FRESH", "isoYear": 2026, "isoWeek": 10}]
    assert client.post("/forecast/weeks", json={"weeks": past}).status_code == 422
    other = [{"depot": "GALLE", "brand": "FRESH", "isoYear": 2026, "isoWeek": 20}]
    assert client.post("/forecast/weeks", json={"weeks": other}).status_code == 422


def test_slow_forecast_answers_503_then_serves_from_cache(client, monkeypatch):
    import time

    model = client.app.state.demand.model
    real = model.predict
    monkeypatch.setattr(model, "predict", lambda req, wcal: (time.sleep(0.4), real(req, wcal))[1])
    monkeypatch.setenv("ML_FORECAST_WAIT_S", "0.05")
    weeks = [{"depot": "KANDY", "brand": "FRESH", "isoYear": 2026, "isoWeek": 30}]
    first = client.post("/forecast/weeks", json={"weeks": weeks})
    assert first.status_code == 503 and first.headers["retry-after"] == "30"
    assert "being computed" in first.json()["error"]["message"]
    time.sleep(0.6)
    again = client.post("/forecast/weeks", json={"weeks": weeks})
    assert again.status_code == 200, again.text
    assert again.json()["weeks"][0]["horizon"] == 17


def test_dtcore_can_be_mounted_apart_from_the_models(models_dir, tmp_path_factory, monkeypatch):
    code_dir = tmp_path_factory.mktemp("code")
    (models_dir / "dtcore.py").rename(code_dir / "dtcore.py")
    assert "dtcore" in load_models(str(models_dir)).errors
    monkeypatch.setenv("ML_MODELS_DIR", str(models_dir))
    monkeypatch.setenv("ML_DTCORE", str(code_dir / "dtcore.py"))
    try:
        with TestClient(create_app()) as c:
            assert c.get("/health").json()["status"] == "ok"
    finally:
        import sys

        sys.modules.pop("dtcore", None)
        while str(code_dir) in sys.path:
            sys.path.remove(str(code_dir))
