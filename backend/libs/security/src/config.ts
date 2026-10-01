import { readFileSync } from 'fs';

/**
 * OIDC settings shared by every service. Values come from env (or *_FILE
 * pointing at a mounted secret) and are never baked into images.
 *
 * Token verification
 *   OIDC_ISSUER        expected `iss` (comma separated list allowed), e.g. https://localhost:8443/auth/realms/lodestar
 *   OIDC_JWKS_URL      where to fetch signing keys, usually the internal URL (OIDC_JWKS_URI is accepted too;
 *                      defaults to the Keycloak certs endpoint of the first issuer)
 *   OIDC_AUDIENCE      required `aud` (default lodestar-api)
 *   FIELD_CLIENT_ID    the device-bound public client (default lodestar-field)
 *
 * Service identity (outgoing calls), two modes:
 *   Local (Keycloak)   OIDC_TOKEN_URL + OIDC_CLIENT_ID + OIDC_CLIENT_SECRET (or OIDC_CLIENT_SECRET_FILE)
 *                      (SERVICE_CLIENT_ID / SERVICE_CLIENT_SECRET[_FILE] are accepted as aliases)
 *   Azure (Entra ID)   AZURE_FEDERATED_TOKEN_FILE + AZURE_CLIENT_ID + AZURE_TENANT_ID + SVC_TOKEN_SCOPE
 *                      (AKS workload identity: a client assertion instead of a secret)
 */
export interface OidcConfig {
  issuers: string[];
  jwksUri?: string;
  tokenUrl?: string;
  audience: string;
  clientId?: string;
  clientSecret?: string;
  fieldClientId: string;
  /** Azure workload identity: file holding the federated token used as client assertion. */
  federatedTokenFile?: string;
  /** `scope` for the token request (Entra: e.g. api://lodestar-api/.default). */
  tokenScope?: string;
}

/** Reads NAME from env, or from the file named by NAME_FILE (Docker/K8s secrets). */
export function readSecret(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const file = env[`${name}_FILE`];
  if (file) {
    try {
      return readFileSync(file, 'utf8').trim();
    } catch {
      return undefined;
    }
  }
  return env[name] || undefined;
}

export function loadOidcConfig(env: NodeJS.ProcessEnv = process.env): OidcConfig {
  const issuers = (env.OIDC_ISSUER ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const first = issuers[0];
  const federatedTokenFile = env.AZURE_FEDERATED_TOKEN_FILE || undefined;

  if (federatedTokenFile) {
    return {
      issuers,
      jwksUri: env.OIDC_JWKS_URL || env.OIDC_JWKS_URI || (first ? `${first}/discovery/v2.0/keys` : undefined),
      tokenUrl: env.OIDC_TOKEN_URL || (env.AZURE_TENANT_ID ? `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token` : undefined),
      audience: env.OIDC_AUDIENCE || 'lodestar-api',
      clientId: env.AZURE_CLIENT_ID || env.OIDC_CLIENT_ID || undefined,
      fieldClientId: env.FIELD_CLIENT_ID || 'lodestar-field',
      federatedTokenFile,
      tokenScope: env.SVC_TOKEN_SCOPE || undefined,
    };
  }

  return {
    issuers,
    jwksUri: env.OIDC_JWKS_URL || env.OIDC_JWKS_URI || (first ? `${first}/protocol/openid-connect/certs` : undefined),
    tokenUrl: env.OIDC_TOKEN_URL || (first ? `${first}/protocol/openid-connect/token` : undefined),
    audience: env.OIDC_AUDIENCE || 'lodestar-api',
    clientId: env.OIDC_CLIENT_ID || env.SERVICE_CLIENT_ID || undefined,
    clientSecret: readSecret(env, 'OIDC_CLIENT_SECRET') ?? readSecret(env, 'SERVICE_CLIENT_SECRET'),
    fieldClientId: env.FIELD_CLIENT_ID || 'lodestar-field',
    tokenScope: env.SVC_TOKEN_SCOPE || undefined,
  };
}

/** DI tokens */
export const OIDC_CONFIG = Symbol('OIDC_CONFIG');
export const SERVICE_NAME = Symbol('SERVICE_NAME');
