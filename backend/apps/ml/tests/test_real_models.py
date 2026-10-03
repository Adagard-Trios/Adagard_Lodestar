"""Smoke test against the real Adagard models. Skipped unless ML_MODELS_DIR points at a directory holding
dtcore.py, task1_model.pkl and task2a_model.pkl (they are never in the repo). Run it with the training env:

    ML_MODELS_DIR=<dir> <datathon venv python> -m pytest tests/test_real_models.py -s
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from .conftest import stop

DIR = os.getenv("ML_MODELS_DIR", "")
pytestmark = pytest.mark.skipif(
    not DIR or not all((Path(DIR) / f).is_file() for f in ("dtcore.py", "task1_model.pkl", "task2a_model.pkl")),
    reason="ML_MODELS_DIR with dtcore.py and the two models is not available",
)


@pytest.fixture(scope="module")
def client():
    from lodestar_ml.app import create_app
    from lodestar_ml.loader import load_models

    os.environ["ML_FORECAST_WAIT_S"] = "900"  # wait for the full forecast here (the service default is 1.5 s)
    with TestClient(create_app(load_models(DIR))) as c:
        yield c


def test_real_models_load(client):
    body = client.get("/health").json()
    print("health:", body)
    assert body["status"] == "ok", body


def test_real_stop_prediction(client):
    stops = [
        stop(0, outletId="OUT001", dockType="STREET", parking="VAN_ONLY", windowOpen="05:00", windowClose="07:30",
             vehicleId="VEH037", vehicleType="VAN", vehicleTemp="AMBIENT", tempRequirement="AMBIENT", capacityKg=1200,
             capacityM3=8, units=11, kg=92.1, m3=0.501, plannedDepart="05:00", plannedArrive="05:21", plannedTravelMin=21,
             distanceKm=9.5, serviceAllowanceMin=16),
        stop(1, outletId="OUT002", dockType="STREET", parking="VAN_ONLY", windowOpen="05:30", windowClose="08:00",
             vehicleId="VEH037", vehicleType="VAN", vehicleTemp="AMBIENT", tempRequirement="AMBIENT", capacityKg=1200,
             capacityM3=8, units=12, kg=96.2, m3=0.539, plannedDepart="05:37", plannedArrive="05:47", plannedTravelMin=10,
             distanceKm=3.9, serviceAllowanceMin=16),
    ]
    r = client.post("/predict/stops", json={"stops": stops})
    print("predict/stops:", r.json())
    assert r.status_code == 200, r.text
    for p in r.json()["predictions"]:
        assert 1 <= p["serviceMin"] <= 180
        assert 0 < p["lateProb"] < 1
        assert p["etaMin"] is not None and 5 * 60 <= p["etaMin"] <= 10 * 60


def test_real_forecast(client):
    weeks = [{"depot": "PELIYAGODA", "brand": "FRESH", "isoYear": 2026, "isoWeek": 14},
             {"depot": "KANDY", "brand": "TECH", "isoYear": 2026, "isoWeek": 16}]
    r = client.post("/forecast/weeks", json={"weeks": weeks})
    print("forecast/weeks:", r.json())
    assert r.status_code == 200, r.text
    w = r.json()["weeks"]
    assert w[0]["totalM3"] > 0 and 0 <= w[0]["chilledM3"] <= w[0]["totalM3"]
    assert w[1]["chilledM3"] == 0.0
