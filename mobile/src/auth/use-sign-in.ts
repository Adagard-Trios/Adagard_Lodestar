// Sign-in with Keycloak: authorization code + PKCE (S256) through expo-auth-session, for the public
// `lodestar-field` client. Native: the system browser returns to lodestar://auth/callback.
// Web: a popup returns to <origin>/auth/callback, which hands the result back (src/app/auth/callback.tsx).
import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import { APP_SCHEME, CALLBACK_PATH, clientId } from '@/lib/config';
import { session } from '@/model/platform';
import type { Claims } from './claims';
import { enrollment } from './device-access';
import { discovery } from './oidc';
import { homeFor } from './roles';

const DISCOVERY = discovery();

export function redirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: APP_SCHEME, path: CALLBACK_PATH });
}

/**
 * Opens the role's first screen (or the "can't sign in" screen for a role without a field face) once the
 * token is bound to this phone. A phone that is not bound yet asks for access instead and the access
 * guard shows the access-request screen (SM-32).
 */
export function goHome(claims: Claims, width: number) {
  void enterApp(claims, width);
}

/** goHome, awaitable: true when the home screen was opened. */
export async function enterApp(claims: Claims, width: number): Promise<boolean> {
  const home = homeFor(claims, width);
  if (!home) {
    await session.end('denied');
    return false;
  }
  if (!(await enrollment.ensure(claims))) return false;
  router.replace({ pathname: '/s/[key]', params: { key: home } });
  return true;
}

export function useSignIn() {
  const { width } = useWindowDimensions();
  const redirect = useMemo(() => redirectUri(), []);
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId(),
      redirectUri: redirect,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      scopes: ['openid'],
      // shared phones and tablets: always ask who is signing in
      prompt: AuthSession.Prompt.Login,
    },
    DISCOVERY,
  );
  const [busy, setBusy] = useState(false);

  /** Opens the Keycloak login; on success stores the tokens and routes by role. Returns false to stay. */
  async function signIn(): Promise<false> {
    if (!request || busy) return false;
    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type === 'error') session.fail(result.error?.description ?? result.error?.message ?? 'Sign-in failed');
      if (result.type !== 'success' || !result.params.code) return false;
      const tokens = await AuthSession.exchangeCodeAsync(
        { clientId: clientId(), code: result.params.code, redirectUri: redirect, extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined },
        DISCOVERY,
      );
      const claims = await session.signIn({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        id_token: tokens.idToken,
        expires_in: tokens.expiresIn,
      });
      goHome(claims, width);
    } catch (e) {
      session.fail((e as Error)?.message ?? 'Sign-in failed');
    } finally {
      setBusy(false);
    }
    return false;
  }

  return { ready: !!request, busy, signIn };
}
