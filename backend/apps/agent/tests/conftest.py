from __future__ import annotations

import json
import time
from collections.abc import Callable
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from jwt.algorithms import RSAAlgorithm
from langgraph.checkpoint.memory import MemorySaver
from mockito import mock, unstub, when

from lodestar_agent.app import create_app
from lodestar_agent.auth import TokenVerifier
from lodestar_agent.checkpoint import Checkpointing
from lodestar_agent.config import Settings
from lodestar_agent.llm import MockChatModel
from lodestar_agent.odata import ODataClient
from lodestar_agent.runtime import AgentRuntime
from lodestar_agent.tools import DATASETS

from . import fixtures as fx

ISSUER = "http://identity.test/realms/lodestar"
AUDIENCE = "lodestar-api"
KID = "test-kid"


@pytest.fixture(autouse=True)
def _unstub():
    yield
    unstub()


@pytest.fixture(scope="session")
def rsa_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def jwks(rsa_key) -> dict[str, Any]:
    jwk = json.loads(RSAAlgorithm.to_jwk(rsa_key.public_key()))
    jwk.update({"kid": KID, "use": "sig", "alg": "RS256"})
    return {"keys": [jwk]}


@pytest.fixture
def make_token(rsa_key) -> Callable[..., str]:
    pem = rsa_key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())

    def _make(roles=("dispatcher",), depot=(fx.DEPOT,), key_pem: bytes | None = None, **overrides: Any) -> str:
        now = int(time.time())
        claims: dict[str, Any] = {
            "iss": ISSUER,
            "aud": AUDIENCE,
            "sub": "user-1",
            "preferred_username": "dispatcher.one",
            "iat": now,
            "exp": now + 300,
            "realm_access": {"roles": list(roles)},
        }
        if depot is not None:
            claims["depot"] = list(depot)
        claims.update(overrides)
        return jwt.encode(claims, key_pem or pem, algorithm="RS256", headers={"kid": KID})

    return _make


@pytest.fixture
def verifier(jwks) -> TokenVerifier:
    v = TokenVerifier(ISSUER, AUDIENCE, "http://identity.test/certs", leeway_s=0)
    when(v.jwk_client).fetch_data().thenReturn(jwks)  # stubbed JWKS endpoint
    return v


def odata_mock(data: dict[str, list[dict[str, Any]]]) -> ODataClient:
    client = mock(ODataClient)
    for entity_set, key in DATASETS.values():
        when(client).get_all(entity_set, ...).thenReturn(data[key])
    return client


@pytest.fixture
def make_runtime() -> Callable[..., AgentRuntime]:
    def _make(data: dict[str, list[dict[str, Any]]] | None = None, model: Any = None, **kw: Any) -> AgentRuntime:
        client = odata_mock(data or fx.raw())
        rt = AgentRuntime(model or MockChatModel(), lambda: client, Checkpointing(MemorySaver(), "memory"), **kw)
        rt.odata = client  # type: ignore[attr-defined]  # exposed for verify()
        return rt

    return _make


@pytest.fixture
def settings() -> Settings:
    return Settings(OIDC_ISSUER=ISSUER, LOG_LEVEL="WARNING")


@pytest.fixture
def api(settings, make_runtime, verifier):
    app = create_app(settings=settings, runtime=make_runtime(), verifier=verifier)
    with TestClient(app) as client:
        yield client


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
