"""Config, checkpointer selection, structured logging, app wiring."""

from __future__ import annotations

import json
import logging

import pytest
from fastapi.testclient import TestClient
from langgraph.checkpoint.memory import MemorySaver
from mockito import mock, verify, when
from psycopg.rows import dict_row

from lodestar_agent import app as app_module
from lodestar_agent import checkpoint
from lodestar_agent.config import Settings, _parse_service_urls
from lodestar_agent.logging_setup import JsonFormatter, redact


def test_settings_defaults_and_derived_urls(tmp_path):
    s = Settings()
    assert s.agent_model == "mock" and s.oidc_audience == "lodestar-api" and s.oidc_client_id == "svc-agent"
    assert s.lodestar_api_url == "http://gateway:8443"
    assert s.jwks_url.endswith("/realms/lodestar/protocol/openid-connect/certs")
    assert s.token_url.endswith("/realms/lodestar/protocol/openid-connect/token")
    assert s.client_secret() is None
    secret = tmp_path / "secret"
    secret.write_text("from-file\n", encoding="utf-8")
    assert Settings(OIDC_CLIENT_SECRET_FILE=str(secret)).client_secret() == "from-file"
    assert Settings(OIDC_CLIENT_SECRET="env").client_secret() == "env"
    assert Settings(LODESTAR_SERVICE_URLS="Orders=http://orders:3002/, Vehicles=http://fleet:3004,").service_urls == {
        "Orders": "http://orders:3002",
        "Vehicles": "http://fleet:3004",
    }
    assert _parse_service_urls(None) == {}
    with pytest.raises(ValueError):
        _parse_service_urls("Orders")


def test_memory_checkpointer_without_database_url():
    cp = checkpoint.create_checkpointing(Settings())
    assert isinstance(cp.saver, MemorySaver) and cp.kind == "memory" and cp.ready()
    cp.close()


def test_postgres_checkpointer_uses_agent_schema():
    conn = mock()
    when(conn).__enter__().thenReturn(conn)
    when(conn).__exit__(...).thenReturn(None)
    when(checkpoint.psycopg).connect("postgresql://u:p@db:5432/lodestar?sslmode=disable", autocommit=True).thenReturn(conn)
    pool = mock()
    when(checkpoint).ConnectionPool(...).thenReturn(pool)
    saver = mock()
    when(checkpoint).PostgresSaver(pool).thenReturn(saver)

    cp = checkpoint.create_checkpointing(Settings(DATABASE_URL="postgresql+psycopg://u:p@db:5432/lodestar?schema=public&sslmode=disable"))

    assert cp.kind == "postgres" and cp.saver is saver
    verify(conn).execute('CREATE SCHEMA IF NOT EXISTS "agent"')
    verify(checkpoint).ConnectionPool(
        "postgresql://u:p@db:5432/lodestar?sslmode=disable",
        min_size=1,
        max_size=10,
        open=True,
        kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row, "options": "-c search_path=agent"},
    )
    verify(saver).setup()

    pconn = mock()
    when(pconn).__enter__().thenReturn(pconn)
    when(pconn).__exit__(...).thenReturn(None)
    when(pool).connection(timeout=2).thenReturn(pconn)
    assert cp.ready()
    when(pool).connection(timeout=2).thenRaise(OSError("down"))
    assert not cp.ready()
    cp.close()
    verify(pool).close()


def test_checkpointer_rejects_bad_schema_and_normalises_urls():
    with pytest.raises(ValueError):
        checkpoint.create_checkpointing(Settings(DATABASE_URL="postgresql://x/y", AGENT_DB_SCHEMA="agent;drop"))
    assert checkpoint.normalise_conninfo("postgres://a@b/c") == "postgresql://a@b/c"


def test_json_logs_redact_secrets():
    rec = logging.makeLogRecord({"name": "t", "levelname": "INFO", "msg": "call with Bearer abc.def.ghi", "client_secret": "s", "headers": {"Authorization": "x"}})
    out = json.loads(JsonFormatter().format(rec))
    assert out["msg"] == "call with Bearer [REDACTED]" and out["client_secret"] == "[REDACTED]"
    assert out["headers"] == {"Authorization": "[REDACTED]"} and out["service"] == "agent"
    assert redact(["eyJabc.eyJdef.sig", 3]) == ["[REDACTED]", 3]
    try:
        raise RuntimeError("x")
    except RuntimeError:
        import sys

        rec = logging.makeLogRecord({"msg": "boom", "exc_info": sys.exc_info()})
    assert "RuntimeError" in json.loads(JsonFormatter().format(rec))["exc"]


def test_app_builds_real_runtime_in_lifespan(settings, verifier, monkeypatch):
    runtime, closers = app_module.build_runtime(settings)
    assert runtime.checkpointing.kind == "memory" and len(closers) == 2
    for close in closers:
        close()
    with TestClient(app_module.create_app(settings=settings, verifier=verifier)) as client:
        assert client.get("/ready").json()["status"] == "ready"
    app = app_module.create_app(settings=settings, verifier=verifier)
    assert app.state.runtime is None
    assert TestClient(app).get("/ready").status_code == 503  # not started: no runtime yet


def test_main_module_imports():
    import lodestar_agent.main as main

    assert main.app.title == "Lodestar planning agent"
