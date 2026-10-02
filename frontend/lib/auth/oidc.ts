// OIDC authorization code + PKCE against Keycloak (client `lodestar-web`, public), using oidc-client-ts.
//
// Zero trust in the browser:
//  - Tokens and the PKCE/state records live in sessionStorage (this tab only), never in localStorage.
//  - The access token is renewed with the refresh token before it expires (automaticSilentRenew); there is no
//    hidden iframe, which the gateway's frame-ancestors 'none' would block anyway.
//  - Session monitoring through Keycloak's check-session iframe is off for the same reason.
import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import type { RuntimeConfig } from '../config';

export const CALLBACK_PATH = '/signin-callback';

/** The slice of oidc-client-ts the app uses; tests pass a fake. */
export interface UserManagerLike {
  getUser(): Promise<User | null>;
  signinRedirect(args?: { state?: unknown; prompt?: string }): Promise<void>;
  signinRedirectCallback(url?: string): Promise<User>;
  signinSilent(): Promise<User | null>;
  signoutRedirect(args?: { id_token_hint?: string; post_logout_redirect_uri?: string }): Promise<void>;
  removeUser(): Promise<void>;
  events: {
    addUserLoaded(cb: (user: User) => void): () => void;
    addUserUnloaded(cb: () => void): () => void;
    addSilentRenewError(cb: (err: Error) => void): () => void;
  };
}

export function createUserManager(cfg: RuntimeConfig, storage: Storage = window.sessionStorage): UserManager {
  const store = new WebStorageStateStore({ store: storage, prefix: 'oidc.' });
  return new UserManager({
    authority: cfg.authority,
    client_id: cfg.clientId,
    redirect_uri: `${cfg.origin}${CALLBACK_PATH}`,
    post_logout_redirect_uri: `${cfg.origin}/`,
    response_type: 'code', // PKCE (S256) is on by default and required by the realm
    scope: 'openid profile email',
    userStore: store,
    stateStore: store,
    automaticSilentRenew: true,
    accessTokenExpiringNotificationTimeInSeconds: 45,
    monitorSession: false,
    loadUserInfo: false,
    filterProtocolClaims: true,
  });
}
