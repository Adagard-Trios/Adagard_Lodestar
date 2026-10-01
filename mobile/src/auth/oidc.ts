// Keycloak endpoints of the lodestar realm, built from the issuer (no discovery round trip, so the
// sign-in button can open the login window straight away). Refresh and logout are plain form POSTs.
import { clientId, issuer } from '@/lib/config';

export type Discovery = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
  endSessionEndpoint: string;
  userInfoEndpoint: string;
};

export function discovery(iss: string = issuer()): Discovery {
  const base = `${iss}/protocol/openid-connect`;
  return {
    authorizationEndpoint: `${base}/auth`,
    tokenEndpoint: `${base}/token`,
    revocationEndpoint: `${base}/revoke`,
    endSessionEndpoint: `${base}/logout`,
    userInfoEndpoint: `${base}/userinfo`,
  };
}

export type RawTokens = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
};

export class OidcError extends Error {
  constructor(
    readonly kind: 'network' | 'invalid_grant' | 'server',
    message: string,
  ) {
    super(message);
    this.name = 'OidcError';
  }
}

export interface OidcClient {
  refresh(refreshToken: string): Promise<RawTokens>;
  logout(refreshToken: string): Promise<void>;
}

const form = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export function oidcClient(doFetch: typeof fetch = (input, init) => fetch(input, init), d: Discovery = discovery(), client: string = clientId()): OidcClient {
  async function post(url: string, body: Record<string, string>): Promise<globalThis.Response> {
    try {
      return await doFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form(body) });
    } catch {
      throw new OidcError('network', 'Identity provider not reachable');
    }
  }
  return {
    async refresh(refreshToken) {
      const res = await post(d.tokenEndpoint, { grant_type: 'refresh_token', client_id: client, refresh_token: refreshToken });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.access_token) return json as RawTokens;
      if (res.status === 400 || res.status === 401) throw new OidcError('invalid_grant', json.error_description || json.error || 'Session ended');
      throw new OidcError('server', `Token endpoint answered ${res.status}`);
    },
    async logout(refreshToken) {
      // Ends the Keycloak SSO session too, so the next person signs in with their own account.
      await post(d.endSessionEndpoint, { client_id: client, refresh_token: refreshToken });
    },
  };
}
