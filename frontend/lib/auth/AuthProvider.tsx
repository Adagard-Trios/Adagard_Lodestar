'use client';
// Sign-in state for the whole site. Wraps oidc-client-ts and exposes what the app needs: the session (who, which
// roles and claims), login/logout, and a fresh access token for API and WebSocket calls.
// Signing in happens on each face's own designed screen (SM-26, DSP-06/07, ADM-01), which posts to the token
// endpoint (lib/auth/direct.ts) and hands the tokens to acceptTokens(); they are stored and renewed exactly like
// the tokens of the redirect flow, which stays only behind the screens' "single sign-on" buttons (loginSso).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { User } from 'oidc-client-ts';
import { runtimeConfig } from '../config';
import { createUserManager, type UserManagerLike } from './oidc';
import type { TokenResponse } from './direct';
import { decodeJwt, forgetEndedSession, rememberEndedSession, returnPath, sessionFrom, signInPath, type Session } from './session';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthApi {
  status: AuthStatus;
  session: Session | null;
  /**
   * Sends the user to sign in: the designed sign-in screen of the face `returnTo` belongs to (it comes back there
   * afterwards). `prompt` is accepted for callers of the redirect flow and ignored (the screens always ask).
   */
  login(returnTo?: string, opts?: { prompt?: 'login' }): Promise<void>;
  /** Keycloak's redirect sign-in: only the screens' "Waypoint single sign-on" buttons use it. */
  loginSso?(returnTo?: string, opts?: { prompt?: 'login' }): Promise<void>;
  /** Stores tokens a designed sign-in screen obtained (direct grant) and returns where to go next. */
  acceptTokens?(tokens: TokenResponse, returnTo?: string | null): Promise<string>;
  logout(): Promise<void>;
  /** A valid access token (renewed first if it is about to expire), or null when signed out. */
  getAccessToken(): Promise<string | null>;
  /** Renews the session with the refresh token. Resolves to the new access token, or null if that failed. */
  renew(): Promise<string | null>;
  /** Finishes the redirect back from Keycloak and returns where to go next. */
  completeLogin(url?: string): Promise<string>;
  /**
   * True once a session this tab had could not be renewed (refresh token refused or expired): the desk then shows
   * "Your session ended" (DSP-35) instead of jumping straight to the sign-in page.
   */
  expired?: boolean;
  /** Ends the current session locally because it cannot be renewed (sets `expired`). */
  expire?(): Promise<void>;
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
  const [expired, setExpired] = useState(false);
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
    if (s) {
      setExpired(false);
      forgetEndedSession();
    }
  }, []);

  /** The tab had a session that can no longer be renewed: forget the tokens, remember who it was (DSP-35). */
  const endSession = useCallback(async (user: User | null) => {
    if (user) {
      const profile = (user.profile ?? {}) as Record<string, unknown>;
      const s = user.access_token ? sessionFrom(user.access_token, profile, user.expires_at) : null;
      rememberEndedSession({ name: s?.name ?? null, email: s?.email ?? s?.username ?? null, startedAt: typeof profile.auth_time === 'number' ? profile.auth_time : null });
      setExpired(true);
    }
    await mgr().removeUser().catch(() => undefined);
    apply(null);
  }, [apply, mgr]);

  const renew = useCallback((): Promise<string | null> => {
    renewing.current ??= (async () => {
      const before = await mgr().getUser().catch(() => null);
      try {
        const user = await mgr().signinSilent();
        if (!user || user.expired) {
          await endSession(before);
          return null;
        }
        apply(user);
        return user.access_token;
      } catch {
        await endSession(before);
        return null;
      } finally {
        renewing.current = null;
      }
    })();
    return renewing.current;
  }, [apply, endSession, mgr]);

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
    if (user.expired || left < EXPIRY_MARGIN_S) {
      if (user.refresh_token) return renew();
      await endSession(user);
      return null;
    }
    return user.access_token;
  }, [endSession, mgr, renew]);

  const expire = useCallback(async () => {
    const user = await mgr().getUser().catch(() => null);
    await endSession(user);
  }, [endSession, mgr]);

  const loginSso = useCallback(async (returnTo?: string, opts?: { prompt?: 'login' }) => {
    await mgr().signinRedirect({ state: { returnTo: returnTo ?? null }, ...(opts?.prompt ? { prompt: opts.prompt } : {}) });
  }, [mgr]);

  const login = useCallback(async (returnTo?: string) => {
    window.location.assign(signInPath(returnTo));
  }, []);

  const acceptTokens = useCallback(async (tokens: TokenResponse, returnTo?: string | null) => {
    const profile = (decodeJwt(tokens.id_token) ?? decodeJwt(tokens.access_token) ?? {}) as Record<string, unknown>;
    const user = new User({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
      token_type: tokens.token_type ?? 'Bearer',
      scope: tokens.scope,
      session_state: tokens.session_state ?? null,
      profile: profile as User['profile'],
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 300),
    });
    await mgr().storeUser(user);
    apply(user);
    const s = toSession(user);
    return returnPath(returnTo, s?.roles ?? []);
  }, [apply, mgr]);

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
    () => ({ status, session, login, loginSso, acceptTokens, logout, getAccessToken, renew, completeLogin, expired, expire }),
    [status, session, login, loginSso, acceptTokens, logout, getAccessToken, renew, completeLogin, expired, expire],
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
