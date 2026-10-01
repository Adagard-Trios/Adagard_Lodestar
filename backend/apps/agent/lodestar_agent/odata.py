"""Outbound calls: OAuth2 client credentials + a read-only OData v4 client.

The agent only *reads* through OData. There is deliberately no method that
POSTs actions such as ``Plans(...)/Lodestar.Approve``: the agent can never publish.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any
from urllib.parse import urljoin

import httpx

log = logging.getLogger("lodestar_agent.odata")

TOKEN_REFRESH_MARGIN_S = 60
MAX_TOP = 500


class ServiceAuthError(RuntimeError):
    pass


class ODataError(RuntimeError):
    def __init__(self, status: int, code: str, message: str, target: str | None = None):
        super().__init__(f"OData {status} {code}: {message}")
        self.status, self.code, self.message, self.target = status, code, message, target


class ServiceTokenProvider:
    """Client-credentials tokens for ``svc-agent``, cached until 60 s before expiry."""

    def __init__(
        self,
        http: httpx.Client,
        token_url: str,
        client_id: str,
        client_secret: str | None,
        scope: str | None = None,
        clock: Any = time.monotonic,
    ):
        self._http, self._url, self._id, self._secret, self._scope = http, token_url, client_id, client_secret, scope
        self._clock = clock
        self._token: str | None = None
        self._expires_at = 0.0
        self._lock = threading.Lock()

    def get_token(self) -> str:
        with self._lock:
            if self._token and self._clock() < self._expires_at - TOKEN_REFRESH_MARGIN_S:
                return self._token
            return self._fetch()

    def invalidate(self) -> None:
        with self._lock:
            self._token, self._expires_at = None, 0.0

    def _fetch(self) -> str:
        if not self._secret:
            raise ServiceAuthError("OIDC_CLIENT_SECRET (or OIDC_CLIENT_SECRET_FILE) is not set for the agent service identity")
        form = {"grant_type": "client_credentials", "client_id": self._id, "client_secret": self._secret}
        if self._scope:
            form["scope"] = self._scope
        try:
            resp = self._http.post(self._url, data=form, headers={"Accept": "application/json"})
        except httpx.HTTPError as exc:
            raise ServiceAuthError(f"token endpoint unreachable: {type(exc).__name__}") from exc
        if resp.status_code != 200:
            raise ServiceAuthError(f"token endpoint returned {resp.status_code}")
        body = resp.json()
        token = body.get("access_token")
        if not token:
            raise ServiceAuthError("token endpoint returned no access_token")
        self._token = token
        self._expires_at = self._clock() + float(body.get("expires_in", 300))
        log.info("service token acquired", extra={"client_id": self._id, "expires_in": body.get("expires_in")})
        return token


class ODataClient:
    """Minimal OData v4 reader with server-driven paging (``@odata.nextLink``)."""

    def __init__(
        self,
        http: httpx.Client,
        tokens: ServiceTokenProvider,
        base_url: str,
        service_urls: dict[str, str] | None = None,
        max_pages: int = 50,
    ):
        self._http, self._tokens = http, tokens
        self._base = base_url.rstrip("/")
        self._service_urls = service_urls or {}
        self._max_pages = max_pages

    def entity_url(self, entity_set: str) -> str:
        base = self._service_urls.get(entity_set, self._base)
        return f"{base}/odata/v4/{entity_set}"

    def _get(self, url: str, params: dict[str, Any] | None) -> dict[str, Any]:
        for attempt in (1, 2):
            headers = {"Authorization": f"Bearer {self._tokens.get_token()}", "Accept": "application/json"}
            resp = self._http.get(url, params=params, headers=headers)
            if resp.status_code == 401 and attempt == 1:
                self._tokens.invalidate()  # token revoked or rotated: fetch a fresh one once
                continue
            if resp.status_code >= 400:
                raise self._error(resp)
            return resp.json()
        raise ODataError(401, "Unauthorized", "service token rejected")  # pragma: no cover

    @staticmethod
    def _error(resp: httpx.Response) -> ODataError:
        try:
            err = resp.json().get("error", {})
        except ValueError:
            err = {}
        return ODataError(resp.status_code, str(err.get("code") or resp.reason_phrase), str(err.get("message") or "request failed"), err.get("target"))

    def get_all(self, entity_set: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """GET an entity set and follow ``@odata.nextLink`` until done."""
        query = dict(params or {})
        query["$top"] = min(int(query.get("$top", MAX_TOP)), MAX_TOP)
        url: str | None = self.entity_url(entity_set)
        rows: list[dict[str, Any]] = []
        pages = 0
        while url:
            pages += 1
            if pages > self._max_pages:
                raise ODataError(502, "TooManyPages", f"{entity_set} paging exceeded {self._max_pages} pages")
            body = self._get(url, query)
            rows.extend(body.get("value", []))
            next_link = body.get("@odata.nextLink")
            url = urljoin(url, next_link) if next_link else None
            query = None  # the nextLink already carries the query (incl. $skiptoken)
        log.info("odata read", extra={"entity_set": entity_set, "rows": len(rows), "pages": pages})
        return rows

    def get_one(self, entity_set: str, key: str) -> dict[str, Any]:
        escaped = key.replace("'", "''")
        return self._get(f"{self.entity_url(entity_set)}('{escaped}')", None)
