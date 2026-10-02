"""HTTP API: /runs, /runs/{id}, /runs/{id}/resume, /ask, /health, /ready."""

from __future__ import annotations

from fastapi.testclient import TestClient
from mockito import when

from lodestar_agent.app import create_app
from lodestar_agent.odata import ODataError, ServiceAuthError

from . import fixtures as fx
from .conftest import bearer

START = {"depot": fx.DEPOT.lower(), "runDate": fx.RUN_DATE}


def start(api, make_token) -> str:
    r = api.post("/runs", json=START, headers=bearer(make_token()))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "NEEDS_APPROVAL" and body["version"] == 1
    return body["id"]


def test_health_and_ready_are_open(api):
    assert api.get("/health").json() == {"status": "ok"}
    assert api.get("/ready").json() == {"status": "ready", "checkpointer": "memory"}


def test_ready_503_when_checkpoint_db_down(api):
    runtime = api.app.state.runtime
    when(runtime.checkpointing).ready().thenReturn(False)
    assert api.get("/ready").status_code == 503


def test_full_http_flow_edit_then_approve(api, make_token):
    run_id = start(api, make_token)
    h = bearer(make_token())

    run = api.get(f"/runs/{run_id}", headers=h).json()
    assert run["status"] == "NEEDS_APPROVAL" and run["canPublish"] is False
    assert "raw" not in run and len(run["ruleChecks"]) == 8
    assert run["explanation"]["text"].startswith("Draft v1 for NORTH")

    ask = api.post("/ask", json={"runId": run_id, "question": "move O-6 to V-R1"}, headers=h).json()
    assert ask["toolCalls"] == ["propose_edit"]
    assert ask["proposal"] is None  # O-6 is ambient Style; V-R1 trips are Fresh -> refused with a reason
    assert "one brand and one district per trip" in ask["answer"]

    r = api.post(f"/runs/{run_id}/resume", json={"decision": "edit", "edits": [{"op": "defer", "orderId": "O-5", "reason": "WINDOW"}]}, headers=h)
    assert r.status_code == 200 and r.json()["version"] == 2

    r = api.post(f"/runs/{run_id}/resume", json={"decision": "approve", "comment": "go"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "APPROVED"
    assert r.json()["decision"]["by"] == "user-1"

    r = api.post(f"/runs/{run_id}/resume", json={"decision": "reject"}, headers=h)
    assert r.status_code == 409 and r.json()["error"]["code"] == "Conflict"


def test_validation_errors(api, make_token):
    h = bearer(make_token())
    r = api.post("/runs", json={"depot": "NORTH", "runDate": "not-a-date"}, headers=h)
    assert r.status_code == 422 and r.json()["error"]["code"] == "ValidationError"
    assert api.post("/runs", json={**START, "extra": 1}, headers=h).status_code == 422
    run_id = start(api, make_token)
    bad = [
        {"decision": "publish"},
        {"decision": "edit", "edits": [{"op": "move", "orderId": "O-1"}]},
        {"decision": "edit", "edits": [{"op": "defer", "orderId": "O-1"}]},
    ]
    for body in bad:
        assert api.post(f"/runs/{run_id}/resume", json=body, headers=h).status_code == 422, body
    r = api.post(f"/runs/{run_id}/resume", json={"decision": "edit", "edits": [{"op": "defer", "orderId": "O-7", "reason": "FUEL"}]}, headers=h)
    assert r.status_code == 422 and r.json()["error"]["code"] == "InvalidEdit"
    r = api.post(f"/runs/{run_id}/resume", json={"decision": "edit", "edits": [{"op": "move", "orderId": "O-1", "vehicleId": "V-R2"}]}, headers=h)
    assert r.status_code == 422 and "not available" in r.json()["error"]["message"]
    assert api.post("/ask", json={"runId": run_id, "question": ""}, headers=h).status_code == 422


def test_unknown_run_is_404(api, make_token):
    h = bearer(make_token())
    assert api.get("/runs/run-missing", headers=h).status_code == 404
    assert api.post("/ask", json={"runId": "run-missing", "question": "hi"}, headers=h).status_code == 404


def test_upstream_errors_map_to_502(settings, make_runtime, verifier, make_token):
    runtime = make_runtime()
    when(runtime.odata).get_all("Orders", ...).thenRaise(ODataError(503, "Unavailable", "orders down"))
    with TestClient(create_app(settings=settings, runtime=runtime, verifier=verifier)) as api:
        r = api.post("/runs", json=START, headers=bearer(make_token()))
        assert r.status_code == 502 and "orders down" in r.json()["error"]["message"]

    when(runtime.odata).get_all("Orders", ...).thenRaise(ServiceAuthError("no secret"))
    with TestClient(create_app(settings=settings, runtime=runtime, verifier=verifier)) as api:
        r = api.post("/runs", json=START, headers=bearer(make_token()))
        assert r.status_code == 502 and r.json()["error"]["code"] == "ServiceIdentityError"


def test_non_operating_day_is_refused_with_422(settings, make_runtime, verifier, make_token):
    data = fx.raw()
    data["calendar"] = [{**c, "isOperating": c["date"] != fx.RUN_DATE} for c in data["calendar"]]
    with TestClient(create_app(settings=settings, runtime=make_runtime(data), verifier=verifier)) as api:
        r = api.post("/runs", json=START, headers=bearer(make_token()))
        assert r.status_code == 422 and r.json()["error"]["code"] == "NonOperatingDay"
        assert fx.RUN_DATE in r.json()["error"]["message"]


def test_request_id_is_echoed(api, make_token):
    r = api.get("/runs/run-x", headers={**bearer(make_token()), "x-request-id": "abc123"})
    assert r.headers["x-request-id"] == "abc123"
