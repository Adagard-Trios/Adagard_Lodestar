"""GET /config: the read-only model and guardrail view (DSP-16, ADM-17)."""

from __future__ import annotations

from lodestar_agent.agent_config import agent_config
from lodestar_agent.config import Settings

from .conftest import bearer


def test_config_for_dispatcher_and_admin(api, make_token):
    for roles in (("dispatcher",), ("admin",)):
        r = api.get("/config", headers=bearer(make_token(roles=roles)))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["humanApproval"] is True and body["canPublish"] is False
        assert body["model"]["provider"] == "mock" and body["model"]["configured"] is True
        assert [x["rule"] for x in body["rules"]][:2] == ["weight", "volume"]
        assert body["limits"]["maxTripsPerVehicle"] == 2 and body["limits"]["protectedScore"] == 91
        assert "CAP_REEFER" in body["reasonCodes"]


def test_config_denies_other_roles_and_anonymous(api, make_token):
    assert api.get("/config").status_code == 401
    assert api.get("/config", headers=bearer(make_token(roles=("driver",)))).status_code == 403


def test_azure_model_reports_missing_settings_without_secrets():
    s = Settings(AGENT_MODEL="azure-openai", AZURE_OPENAI_ENDPOINT="https://x.openai.azure.com/", AZURE_OPENAI_API_KEY="secret")
    m = agent_config(s)["model"]
    assert m["provider"] == "azure-openai" and m["configured"] is False
    assert m["endpointHost"] == "x.openai.azure.com"
    assert "AZURE_OPENAI_DEPLOYMENT" in m["missing"]
    assert "secret" not in str(agent_config(s))
