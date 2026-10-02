"""Zero-trust request authentication (same check as the agent): RS256 JWT against the Keycloak JWKS + RBAC."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import jwt
from fastapi import HTTPException, Request, status
from jwt import PyJWKClient

log = logging.getLogger("lodestar_ocr.auth")

# the people who point a phone camera at a seal, a label or a fridge display
FIELD_ROLES = ("driver", "loader", "dispatcher")


@dataclass(frozen=True)
class Principal:
    sub: str
    roles: frozenset[str]


class TokenVerifier:
    def __init__(self, issuer: str, audience: str, jwks_url: str, leeway_s: int = 30, jwk_client: PyJWKClient | None = None):
        self.issuer, self.audience, self.leeway = issuer, audience, leeway_s
        self.jwk_client = jwk_client or PyJWKClient(jwks_url, cache_keys=True, lifespan=300, timeout=5)

    def verify(self, token: str) -> Principal:
        try:
            key = self.jwk_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                key.key,
                algorithms=["RS256"],
                audience=self.audience,
                issuer=self.issuer,
                leeway=self.leeway,
                options={"require": ["exp", "iat", "iss", "sub", "aud"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise _unauthorized("token expired") from exc
        except (jwt.PyJWKClientError, jwt.InvalidTokenError) as exc:
            raise _unauthorized("invalid token") from exc
        roles = frozenset((claims.get("realm_access") or {}).get("roles") or [])
        return Principal(sub=str(claims["sub"]), roles=roles)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": 'Bearer error="invalid_token"'})


def field_user(request: Request) -> Principal:
    """FastAPI dependency: a signed-in driver, loader or dispatcher."""
    scheme, _, token = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="missing bearer token", headers={"WWW-Authenticate": "Bearer"})
    verifier: TokenVerifier = request.app.state.verifier
    principal = verifier.verify(token.strip())
    if not principal.roles.intersection(FIELD_ROLES):
        log.warning("rbac denied sub=%s", principal.sub)
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=f"requires role: {' or '.join(FIELD_ROLES)}")
    return principal
