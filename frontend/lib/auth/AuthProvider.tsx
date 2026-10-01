'use client';
// Sign-in state for the whole site. Wraps oidc-client-ts and exposes what the app needs: the session (who, which
// roles and claims), login/logout, and a fresh access token for API and WebSocket calls.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from 'oidc-client-ts';
import { runtimeConfig } from '../config';
import { createUserManager, type UserManagerLike } from './oidc';
import { returnPath, sessionFrom, type Session } from './session';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthApi {
  status: AuthStatus;
  session: Session | null;
  /** Starts the Keycloak login. `returnTo` is a local path to come back to after sign-in. */
  login(returnTo?: string): Promise<void>;
  logout(): Promise<void>;
  /** A valid access token (renewed first if it is about to expire), or null when signed out. */
  getAccessToken(): Promise<string | null>;
  /** Renews the session with the refresh token. Resolves to the new access token, or null if that failed. */
  renew(): Promise<string | null>;
  /** Finishes the redirect back from Keycloak and returns where to go next. */
  completeLogin(url?: string): Promise<string>;
}

const AuthContext = createContext<AuthApi | null>(null);

/** Renew a little before expiry so a request never leaves with a token that expires in flight. */
const EXPIRY_MARGIN_S = 30;

function toSession(user: User | null): Session | null {
  if (!user || user.expired || !user.access_token) return null;
  return sessionFrom(user.access_token, (user.profile ?? {}) as Record<string, unknown>, user.expires_at);
}

export function AuthProvider({ children, manager }: { children: ReactNode; manager?: UserManagerLike }) {
  const um = useRef<UserManagerLike | null>(manager ?? null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const renewing = useRef<Promise<string | null> | null>(null);
  const completing = useRef<Promise<string> | null>(null);

  const mgr = useCallback((): UserManagerLike => {
    um.current ??= createUserManager(runtimeConfig());
    return um.current;
  }, []);

  const apply = useCallback((user: User | null) => {
    const s = toSession(user);
    setSession(s);
    setStatus(s ? 'authenticated' : 'anonymous');
  }, []);

  const renew = useCallback((): Promise<string | null> => {
    renewing.current ??= (async () => {
      try {
        const user = await mgr().signinSilent();
        apply(user);
        return user && !user.expired ? user.access_token : null;
      } catch {
        await mgr().removeUser().catch(() => undefined);
        apply(null);
        return null;
      } finally {
        renewing.current = null;
      }
    })();
    return renewing.current;
  }, [apply, mgr]);

  useEffect(() => {
    let alive = true;
    const m = mgr();
    (async () => {
      const user = await m.getUser().catch(() => null);
      if (!alive) return;
      if (user && user.expired && user.refresh_token) {
        await renew();
        return;
      }
      apply(user);
    })();
    const offs = [
      m.events.addUserLoaded(u => alive && apply(u)),
      m.events.addUserUnloaded(() => alive && apply(null)),
      m.events.addSilentRenewError(() => undefined), // the next API call renews again or sends the user to sign in
    ];
    return () => {
      alive = false;
      offs.forEach(off => off());
    };
  }, [apply, mgr, renew]);

  const getAccessToken = useCallback(async () => {
    const user = await mgr().getUser().catch(() => null);
    if (!user) return null;
    const left = user.expires_at ? user.expires_at - Date.now() / 1000 : Infinity;
    if (user.expired || left < EXPIRY_MARGIN_S) return user.refresh_token ? renew() : null;
    return user.access_token;
  }, [mgr, renew]);

  const login = useCallback(async (returnTo?: string) => {
    await mgr().signinRedirect({ state: { returnTo: returnTo ?? null } });
  }, [mgr]);

  const logout = useCallback(async () => {
    const m = mgr();
    const user = await m.getUser().catch(() => null);
    try {
      await m.signoutRedirect({ id_token_hint: user?.id_token });
    } catch {
      // Identity unreachable: forget the tokens locally at least (the face gate then asks to sign in again).
      await m.removeUser().catch(() => undefined);
      apply(null);
    }
  }, [apply, mgr]);

  const completeLogin = useCallback((url?: string) => {
    // Guarded so a double effect (React strict mode) never redeems the one-time code twice.
    completing.current ??= (async () => {
      const user = await mgr().signinRedirectCallback(url);
      apply(user);
      const s = toSession(user);
      return returnPath((user.state as { returnTo?: unknown } | undefined)?.returnTo, s?.roles ?? []);
    })();
    return completing.current;
  }, [apply, mgr]);

  const api = useMemo<AuthApi>(
    () => ({ status, session, login, logout, getAccessToken, renew, completeLogin }),
    [status, session, login, logout, getAccessToken, renew, completeLogin],
  );
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() needs <AuthProvider>');
  return ctx;
}

/** For tests and stories: a fixed auth state. */
export const AuthTestContext = AuthContext;
