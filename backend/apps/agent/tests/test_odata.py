"""Outbound: client-credentials token caching and the OData reader (paging, errors)."""

from __future__ import annotations

import httpx
import pytest
from mockito import ANY, mock, verify, when

from lodestar_agent.odata import ODataClient, ODataError, ServiceAuthError, ServiceTokenProvider

TOKEN_URL = "http://identity.test/realms/lodestar/protocol/openid-connect/token"


def response(status: int, body=None, url: str = "http://x.test/") -> httpx.Response:
    return httpx.Response(status, json=body, request=httpx.Request("GET", url))


class Clock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


# ---------------------------------------------------------------- token provider
def test_client_credentials_token_is_cached_until_60s_before_expiry():
    http = mock(httpx.Client)
    clock = Clock()
    when(http).post(TOKEN_URL, data=ANY, headers=ANY).thenReturn(
        response(200, {"access_token": "tok-1", "expires_in": 300}),
        response(200, {"access_token": "tok-2", "expires_in": 300}),
    )
    tp = ServiceTokenProvider(http, TOKEN_URL, "svc-agent", "s3cret", scope="orders.read", clock=clock)

    assert tp.get_token() == "tok-1"
    clock.now += 200
    assert tp.get_token() == "tok-1"  # 100 s left: still cached
    clock.now += 45
    assert tp.get_token() == "tok-2"  # inside the 60 s margin: refreshed
    verify(http, times=2).post(
        TOKEN_URL,
        data={"grant_type": "client_credentials", "client_id": "svc-agent", "client_secret": "s3cret", "scope": "orders.read"},
        headers={"Accept": "application/json"},
    )


def test_token_errors():
    http = mock(httpx.Client)
    with pytest.raises(ServiceAuthError, match="OIDC_CLIENT_SECRET"):
        ServiceTokenProvider(http, TOKEN_URL, "svc-agent", None).get_token()

    when(http).post(...).thenReturn(response(401, {"error": "unauthorized_client"}))
    with pytest.raises(ServiceAuthError, match="401"):
        ServiceTokenProvider(http, TOKEN_URL, "svc-agent", "x").get_token()

    when(http).post(...).thenReturn(response(200, {"token_type": "Bearer"}))
    with pytest.raises(ServiceAuthError, match="no access_token"):
        ServiceTokenProvider(http, TOKEN_URL, "svc-agent", "x").get_token()

    when(http).post(...).thenRaise(httpx.ConnectError("refused"))
    with pytest.raises(ServiceAuthError, match="unreachable"):
        ServiceTokenProvider(http, TOKEN_URL, "svc-agent", "x").get_token()


# ---------------------------------------------------------------- reader
@pytest.fixture
def tokens():
    tp = mock(ServiceTokenProvider)
    when(tp).get_token().thenReturn("svc-token")
    when(tp).invalidate().thenReturn(None)
    return tp


def test_get_all_follows_next_links(tokens):
    http = mock(httpx.Client)
    base = "http://gateway.test:8443/odata/v4/Orders"
    auth = {"Authorization": "Bearer svc-token", "Accept": "application/json"}
    when(http).get(base, params={"$filter": "status eq 'RECEIVED'", "$top": 500}, headers=auth).thenReturn(
        response(200, {"@odata.context": "$metadata#Orders", "value": [{"id": "A"}, {"id": "B"}], "@odata.nextLink": f"{base}?$skiptoken=2"})
    )
    when(http).get(f"{base}?$skiptoken=2", params=None, headers=auth).thenReturn(
        response(200, {"value": [{"id": "C"}], "@odata.nextLink": "Orders?$skiptoken=3"})
    )
    when(http).get("http://gateway.test:8443/odata/v4/Orders?$skiptoken=3", params=None, headers=auth).thenReturn(
        response(200, {"value": [{"id": "D"}]})
    )
    client = ODataClient(http, tokens, "http://gateway.test:8443/")
    rows = client.get_all("Orders", {"$filter": "status eq 'RECEIVED'", "$top": 9999})
    assert [r["id"] for r in rows] == ["A", "B", "C", "D"]
    verify(http, times=3).get(...)


def test_direct_service_urls_and_single_entity(tokens):
    http = mock(httpx.Client)
    when(http).get("http://fleet:3004/odata/v4/Vehicles('V''1')", params=None, headers=ANY).thenReturn(response(200, {"id": "V'1"}))
    client = ODataClient(http, tokens, "http://gateway:8443", {"Vehicles": "http://fleet:3004"})
    assert client.entity_url("Orders") == "http://gateway:8443/odata/v4/Orders"
    assert client.get_one("Vehicles", "V'1") == {"id": "V'1"}


def test_odata_error_body_is_parsed(tokens):
    http = mock(httpx.Client)
    when(http).get(...).thenReturn(response(403, {"error": {"code": "Forbidden", "message": "scope orders.read required", "target": "Orders"}}))
    with pytest.raises(ODataError) as exc:
        ODataClient(http, tokens, "http://gw").get_all("Orders")
    assert exc.value.status == 403 and exc.value.code == "Forbidden" and exc.value.target == "Orders"

    when(http).get(...).thenReturn(httpx.Response(500, text="boom", request=httpx.Request("GET", "http://gw")))
    with pytest.raises(ODataError) as exc:
        ODataClient(http, tokens, "http://gw").get_all("Orders")
    assert exc.value.status == 500 and exc.value.message == "request failed"


def test_401_refreshes_the_service_token_once(tokens):
    http = mock(httpx.Client)
    when(http).get(...).thenReturn(response(401, {"error": {"code": "Unauthorized", "message": "expired"}}), response(200, {"value": [{"id": 1}]}))
    assert ODataClient(http, tokens, "http://gw").get_all("Orders") == [{"id": 1}]
    verify(tokens, times=1).invalidate()


def test_paging_is_bounded(tokens):
    http = mock(httpx.Client)
    when(http).get(...).thenReturn(response(200, {"value": [{"id": 1}], "@odata.nextLink": "http://gw/odata/v4/Orders?$skiptoken=x"}))
    with pytest.raises(ODataError, match="TooManyPages"):
        ODataClient(http, tokens, "http://gw", max_pages=3).get_all("Orders")
