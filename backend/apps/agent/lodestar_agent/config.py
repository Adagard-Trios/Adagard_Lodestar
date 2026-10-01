"""Service configuration from environment variables (and secret files)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_service_urls(raw: str | None) -> dict[str, str]:
    """Parse ``Orders=http://orders:3002,Vehicles=http://fleet:3004``."""
    urls: dict[str, str] = {}
    if not raw:
        return urls
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if "=" not in part:
            raise ValueError(f"LODESTAR_SERVICE_URLS entry '{part}' must look like EntitySet=url")
        name, url = part.split("=", 1)
        urls[name.strip()] = url.strip().rstrip("/")
    return urls


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore", case_sensitive=False)

    # Model
    agent_model: str = Field(default="mock", alias="AGENT_MODEL")
    azure_openai_endpoint: str | None = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: SecretStr | None = Field(default=None, alias="AZURE_OPENAI_API_KEY")
    azure_openai_deployment: str | None = Field(default=None, alias="AZURE_OPENAI_DEPLOYMENT")
    azure_openai_api_version: str | None = Field(default=None, alias="AZURE_OPENAI_API_VERSION")

    # Persistence
    database_url: SecretStr | None = Field(default=None, alias="DATABASE_URL")
    checkpoint_schema: str = Field(default="agent", alias="AGENT_DB_SCHEMA")

    # Identity (inbound verification)
    oidc_issuer: str = Field(default="http://identity:8080/realms/lodestar", alias="OIDC_ISSUER")
    oidc_jwks_url: str | None = Field(default=None, alias="OIDC_JWKS_URL")
    oidc_audience: str = Field(default="lodestar-api", alias="OIDC_AUDIENCE")
    jwt_leeway_s: int = Field(default=30, alias="JWT_LEEWAY_S")

    # Identity (outbound, client credentials)
    oidc_token_url: str | None = Field(default=None, alias="OIDC_TOKEN_URL")
    oidc_client_id: str = Field(default="svc-agent", alias="OIDC_CLIENT_ID")
    oidc_client_secret: SecretStr | None = Field(default=None, alias="OIDC_CLIENT_SECRET")
    oidc_client_secret_file: str | None = Field(default=None, alias="OIDC_CLIENT_SECRET_FILE")
    oidc_scope: str | None = Field(default=None, alias="OIDC_SCOPE")

    # OData API
    lodestar_api_url: str = Field(default="http://gateway:8443", alias="LODESTAR_API_URL")
    lodestar_service_urls_raw: str | None = Field(default=None, alias="LODESTAR_SERVICE_URLS")
    odata_ca_bundle: str | None = Field(default=None, alias="ODATA_CA_BUNDLE")
    http_timeout_s: float = Field(default=10.0, alias="HTTP_TIMEOUT_S")
    odata_max_pages: int = Field(default=50, alias="ODATA_MAX_PAGES")

    # Planning
    max_redrafts: int = Field(default=3, alias="AGENT_MAX_REDRAFTS")
    first_departure: str = Field(default="03:30", alias="AGENT_FIRST_DEPARTURE")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @field_validator("agent_model")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.strip().lower()

    @property
    def jwks_url(self) -> str:
        return self.oidc_jwks_url or f"{self.oidc_issuer.rstrip('/')}/protocol/openid-connect/certs"

    @property
    def token_url(self) -> str:
        return self.oidc_token_url or f"{self.oidc_issuer.rstrip('/')}/protocol/openid-connect/token"

    @property
    def service_urls(self) -> dict[str, str]:
        return _parse_service_urls(self.lodestar_service_urls_raw)

    def client_secret(self) -> str | None:
        if self.oidc_client_secret is not None:
            return self.oidc_client_secret.get_secret_value()
        if self.oidc_client_secret_file:
            return Path(self.oidc_client_secret_file).read_text(encoding="utf-8").strip()
        return None


@lru_cache
def get_settings() -> Settings:
    return Settings()
