import { readFileSync } from 'fs';
import { Logger } from '@nestjs/common';
import { OidcConfig } from './config';

type FetchFn = typeof fetch;

interface CachedToken {
  token: string;
  /** epoch ms after which the token must not be reused (expiry minus 60 s) */
  reuseUntil: number;
}

/** Tokens are reused until 60 s before they expire (PLATFORM.md §2.2). */
export const TOKEN_EXPIRY_MARGIN_MS = 60_000;

export const JWT_BEARER_ASSERTION = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

/**
 * OAuth2 client-credentials client for service-to-service calls.
 * Each service has its own identity (svc-<name>); there are no "trusted
 * internal" calls, so every outgoing request carries this token.
 *
 * Two modes:
 *  - client secret (Keycloak, local): client_id + client_secret;
 *  - federated client assertion (Entra ID on AKS workload identity): the
 *    projected token file is re-read for every request (it rotates) and sent
 *    as client_assertion; no secret exists anywhere.
 */
export class ServiceTokenClient {
  private readonly logger = new Logger(ServiceTokenClient.name);
  private cached?: CachedToken;
  private inflight?: Promise<string>;

  constructor(
    private readonly config: OidcConfig,
    private readonly fetchImpl: FetchFn = (input, init) => fetch(input, init),
    private readonly now: () => number = Date.now,
  ) {}

  get configured(): boolean {
    return !!(this.config.tokenUrl && this.config.clientId && (this.config.clientSecret || this.config.federatedTokenFile));
  }

  /** Form body of the token request for the configured mode. */
  tokenRequestBody(): URLSearchParams {
    const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: this.config.clientId! });
    if (this.config.federatedTokenFile) {
      body.set('client_assertion_type', JWT_BEARER_ASSERTION);
      body.set('client_assertion', readFileSync(this.config.federatedTokenFile, 'utf8').trim());
    } else {
      body.set('client_secret', this.config.clientSecret!);
    }
    if (this.config.tokenScope) body.set('scope', this.config.tokenScope);
    return body;
  }

  /** Returns a cached token or fetches a new one (single flight under concurrency). */
  async getToken(): Promise<string> {
    if (this.cached && this.cached.reuseUntil > this.now()) return this.cached.token;
    if (!this.inflight) {
      this.inflight = this.requestToken().finally(() => (this.inflight = undefined));
    }
    return this.inflight;
  }

  /** Drops the cached token (e.g. after a 401 from the callee). */
  invalidate(): void {
    this.cached = undefined;
  }

  /**
   * fetch() with the service token attached. On a 401 the token is refreshed
   * once and the request retried (covers key rotation and revoked sessions).
   */
  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const send = async () => {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${await this.getToken()}`);
      return this.fetchImpl(url, { ...init, headers });
    };
    let res = await send();
    if (res.status === 401) {
      this.invalidate();
      res = await send();
    }
    return res;
  }

  private async requestToken(): Promise<string> {
    if (!this.configured) {
      throw new Error(
        'Service credentials are not configured (OIDC_TOKEN_URL + OIDC_CLIENT_ID + OIDC_CLIENT_SECRET, or AZURE_FEDERATED_TOKEN_FILE + AZURE_CLIENT_ID + AZURE_TENANT_ID)',
      );
    }
    const body = this.tokenRequestBody();
    const res = await this.fetchImpl(this.config.tokenUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      this.logger.error(`Token request for ${this.config.clientId} failed: HTTP ${res.status}`);
      throw new Error(`Token endpoint returned ${res.status}`);
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error('Token endpoint returned no access_token');
    const lifetimeMs = (json.expires_in ?? 60) * 1000;
    this.cached = { token: json.access_token, reuseUntil: this.now() + lifetimeMs - TOKEN_EXPIRY_MARGIN_MS };
    return json.access_token;
  }
}
