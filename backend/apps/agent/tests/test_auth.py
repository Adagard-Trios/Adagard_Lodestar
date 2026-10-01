"""Zero trust: RS256 JWT with a locally generated key and a stubbed JWKS; RBAC and depot ABAC."""

from __future__ import annotations

import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from mockito import verify, when

from lodestar_agent.auth import Principal, _depots, require_depot

from . import fixtures as fx
from .conftest import bearer

START = {"depot": fx.DEPOT, "runDate": fx.RUN_DATE}


def test_valid_token_is_accepted(verifier, make_token):
    p = verifier.verify(make_token(roles=("dispatcher", "offline_access")))
    assert p.sub == "user-1" and p.username == "dispatcher.one"
    assert p.roles == {"dispatcher", "offline_access"}
    assert p.depots == {fx.DEPOT}
    verify(verifier.jwk_client, atleast=1).fetch_data()


@pytest.mark.parametrize(
    ("overrides", "detail"),
    [
        ({"exp": int(time.time()) - 10}, "token expired"),
        ({"aud": "account"}, "wrong audience"),
        ({"iss": "http://evil.test/realms/lodestar"}, "wrong issuer"),
    ],
)
def test_rejected_claims(verifier, make_token, overrides, detail):
    with pytest.raises(HTTPException) as exc:
        verifier.verify(make_token(**overrides))
    assert exc.value.status_code == 401 and exc.value.detail == detail


def test_token_signed_by_another_key_is_rejected(verifier, make_token):
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = other.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    with pytest.raises(HTTPException) as exc:
        verifier.verify(make_token(key_pem=pem))
    assert exc.value.detail == "invalid token"


def test_garbage_and_hs256_tokens_are_rejected(verifier):
    import jwt

    for token in ("not-a-jwt", jwt.encode({"sub": "x"}, "secret-secret-secret-secret-1234", algorithm="HS256", headers={"kid": "test-kid"})):
        with pytest.raises(HTTPException):
            verifier.verify(token)


def test_jwks_unreachable_is_401(verifier, make_token):
    import jwt

    when(verifier.jwk_client).fetch_data().thenRaise(jwt.PyJWKClientConnectionError("down"))
    with pytest.raises(HTTPException) as exc:
        verifier.verify(make_token())
    assert exc.value.status_code == 401


def test_depot_claim_shapes():
    assert _depots(None) == frozenset()
    assert _depots("north, south") == {"NORTH", "SOUTH"}
    assert _depots(["north", " "]) == {"NORTH"}
    assert _depots(42) == frozenset()
    p = Principal("s", None, frozenset({"dispatcher"}), frozenset({"NORTH"}))
    require_depot(p, "NORTH")
    with pytest.raises(HTTPException) as exc:
        require_depot(p, "SOUTH")
    assert exc.value.status_code == 403


# ---------------------------------------------------------------- over HTTP
def test_missing_or_malformed_header_is_401(api):
    assert api.post("/runs", json=START).status_code == 401
    r = api.post("/runs", json=START, headers={"Authorization": "Basic abc"})
    assert r.status_code == 401 and r.headers["www-authenticate"].startswith("Bearer")


def test_expired_token_over_http(api, make_token):
    r = api.post("/runs", json=START, headers=bearer(make_token(exp=int(time.time()) - 5)))
    assert r.status_code == 401


def test_wrong_audience_over_http(api, make_token):
    assert api.post("/runs", json=START, headers=bearer(make_token(aud="other-api"))).status_code == 401


def test_wrong_role_is_403(api, make_token):
    for roles in (("store_manager",), ("driver",), ("svc",), ()):
        r = api.post("/runs", json=START, headers=bearer(make_token(roles=roles)))
        assert r.status_code == 403, roles
        assert r.json()["detail"].startswith("requires role")


def test_wrong_depot_is_403(api, make_token):
    r = api.post("/runs", json=START, headers=bearer(make_token(depot=(fx.OTHER_DEPOT,))))
    assert r.status_code == 403 and "depot" in r.json()["detail"]
    r = api.post("/runs", json=START, headers=bearer(make_token(depot=None)))
    assert r.status_code == 403


def test_other_depot_cannot_see_resume_or_ask_a_run(api, make_token):
    run_id = api.post("/runs", json=START, headers=bearer(make_token())).json()["id"]
    outsider = bearer(make_token(depot=(fx.OTHER_DEPOT,)))
    assert api.get(f"/runs/{run_id}", headers=outsider).status_code == 403
    assert api.post(f"/runs/{run_id}/resume", json={"decision": "approve"}, headers=outsider).status_code == 403
    assert api.post("/ask", json={"runId": run_id, "question": "why?"}, headers=outsider).status_code == 403


def test_only_dispatcher_can_resume(api, make_token):
    run_id = api.post("/runs", json=START, headers=bearer(make_token())).json()["id"]
    admin = bearer(make_token(roles=("admin",)))
    assert api.get(f"/runs/{run_id}", headers=admin).status_code == 200  # admin may read its depot
    r = api.post(f"/runs/{run_id}/resume", json={"decision": "approve"}, headers=admin)
    assert r.status_code == 403
    assert api.get(f"/runs/{run_id}", headers=admin).json()["status"] == "NEEDS_APPROVAL"
