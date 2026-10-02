from __future__ import annotations

import base64
import io
import json
import time
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from jwt.algorithms import RSAAlgorithm
from PIL import Image, ImageDraw, ImageFont

from lodestar_ocr.app import create_app
from lodestar_ocr.auth import TokenVerifier

ISSUER = "http://identity.test/realms/lodestar"
AUDIENCE = "lodestar-api"
KID = "test-kid"


class StubJwks:
    """Stands in for PyJWKClient: the realm's one signing key, no network."""

    def __init__(self, jwks: dict[str, Any]):
        self.key = jwt.PyJWK(jwks["keys"][0])

    def get_signing_key_from_jwt(self, _token: str) -> jwt.PyJWK:
        return self.key


@pytest.fixture(scope="session")
def rsa_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def verifier(rsa_key) -> TokenVerifier:
    jwk = json.loads(RSAAlgorithm.to_jwk(rsa_key.public_key()))
    jwk.update({"kid": KID, "use": "sig", "alg": "RS256"})
    return TokenVerifier(ISSUER, AUDIENCE, "http://identity.test/certs", leeway_s=0, jwk_client=StubJwks({"keys": [jwk]}))  # type: ignore[arg-type]


@pytest.fixture(scope="session")
def make_token(rsa_key):
    pem = rsa_key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())

    def _make(roles=("driver",), **overrides: Any) -> str:
        now = int(time.time())
        claims = {"iss": ISSUER, "aud": AUDIENCE, "sub": "u1", "iat": now, "exp": now + 300, "realm_access": {"roles": list(roles)}}
        claims.update(overrides)
        return jwt.encode(claims, pem, algorithm="RS256", headers={"kid": KID})

    return _make


def text_image(lines: list[str], fmt: str = "JPEG", size: int = 64) -> str:
    """A photo-like picture of known text (dark on light), base64."""
    font = ImageFont.load_default(size=size)
    img = Image.new("RGB", (900, 120 + 110 * len(lines)), (245, 245, 240))
    draw = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        draw.text((60, 60 + 110 * i), line, fill=(20, 20, 20), font=font)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()


@pytest.fixture(scope="session")
def engine():
    from lodestar_ocr.engine import RapidEngine

    return RapidEngine()


@pytest.fixture(scope="session")
def api(verifier, engine):
    with TestClient(create_app(verifier=verifier, engine=engine)) as client:
        yield client
