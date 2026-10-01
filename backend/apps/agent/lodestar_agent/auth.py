"""Zero-trust request authentication: RS256 JWT against the issuer JWKS, RBAC + depot ABAC."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient

log = logging.getLogger("lodestar_agent.auth")

ROLES = ("store_manager", "dispatcher", "loader", "driver", "admin", "svc")


@dataclass(frozen=True)
class Principal:
    sub: str
    username: str | None
    roles: frozenset[str]
    depots: frozenset[str]
    claims: dict[str, Any] = field(default_factory=dict, compare=False, repr=False)

    def has_any(self, *roles: str) -> bool:
        return bool(self.roles.intersection(roles))

    def can_access_depot(self, depot: str) -> bool:
        return depot in self.depots


def _depots(claim: Any) -> frozenset[str]:
    if claim is None:
        return frozenset()
    if isinstance(claim, str):
        return frozenset(p.strip().upper() for p in claim.replace(" ", ",").split(",") if p.strip())
    if isinstance(claim, (list, tuple, set)):
        return frozenset(str(p).strip().upper() for p in claim if str(p).strip())
    return frozenset()


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
        except jwt.InvalidAudienceError as exc:
            raise _unauthorized("wrong audience") from exc
        except jwt.InvalidIssuerError as exc:
            raise _unauthorized("wrong issuer") from exc
        except (jwt.PyJWKClientError, jwt.InvalidTokenError) as exc:
            raise _unauthorized("invalid token") from exc
        roles = frozenset((claims.get("realm_access") or {}).get("roles") or [])
        return Principal(
            sub=str(claims["sub"]),
            username=claims.get("preferred_username"),
            roles=roles,
            depots=_depots(claims.get("depot")),
            claims=claims,
        )


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": 'Bearer error="invalid_token"'})


def get_principal(request: Request) -> Principal:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="missing bearer token", headers={"WWW-Authenticate": "Bearer"})
    verifier: TokenVerifier = request.app.state.verifier
    principal = verifier.verify(token.strip())
    request.state.principal_sub = principal.sub
    return principal


def require_roles(*roles: str) -> Callable[[Principal], Principal]:
    def dep(principal: Principal = Depends(get_principal)) -> Principal:
        if not principal.has_any(*roles):
            log.warning("rbac denied", extra={"sub": principal.sub, "need": list(roles)})
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail=f"requires role: {' or '.join(roles)}")
        return principal

    return dep


def require_depot(principal: Principal, depot: str) -> None:
    if not principal.can_access_depot(depot):
        log.warning("abac denied", extra={"sub": principal.sub, "depot": depot})
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=f"no access to depot {depot}")
