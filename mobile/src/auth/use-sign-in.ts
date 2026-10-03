// Sign-in on the field app's own designed screens (no Keycloak page): phone + SMS code (SM-05/06, DR-06/07),
// staff ID + PIN (LD-06), posted straight to the token endpoint (direct.ts, direct grant on `lodestar-field`).
// The tokens are stored and refreshed by the Session exactly as before; then the role's first screen opens.
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { session } from '@/model/platform';
import { openScreen } from '@/lodestar/runtime';
import type { Claims } from './claims';
import { enrollment } from './device-access';
import { codeSent, directGrant, phoneSignIn, type DirectResult } from './direct';
import { faceOf, homeFor, SIGN_IN, type Face } from './roles';
import { onboardingSeen } from '@/lib/settings';
import { checkVersion, UPDATE_SCREEN, versionState } from '@/lib/version';

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
  router.replace({ pathname: '/s/[key]', params: { key: await firstScreen(claims, home) } });
  return true;
}

/** First-run screens per face (the dispatcher's phone has none). */
export const ONBOARDING: Partial<Record<Face, string>> = {
  store: 'sm-07-onboarding-1',
  dock: 'ld-07-start-shift',
  run: 'dr-08-permissions',
};

/** Update required beats everything; then the first-run screens once per user on this device; else home. */
async function firstScreen(claims: Claims, home: string): Promise<string> {
  const face = faceOf(claims);
  if (!face) return home;
  const v = await checkVersion().catch(() => versionState.get());
  if (v.required) return UPDATE_SCREEN[face];
  const onboarding = ONBOARDING[face];
  if (onboarding && !(await onboardingSeen(claims.sub))) return onboarding;
  return home;
}

/**
 * "Sign in" on the help and session screens (DR-29, LD-24, SM-31, SM-33, DSP-37, …): back to the face's own
 * designed sign-in screen (the face of the screen, else the last signed-in face, else Store).
 */
export function useSignIn(face?: Face) {
  async function signIn(): Promise<false> {
    const f = face ?? session.state.get().face ?? 'store';
    openScreen(SIGN_IN[f], undefined, 'nav');
    return false;
  }
  return { ready: true, busy: false, signIn };
}

/** Posts sign-in steps; tokens → stored session → the role's first screen. */
export function useDirectSignIn(face: Face) {
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);

  async function submit(params: Record<string, string | undefined>): Promise<DirectResult> {
    setBusy(true);
    try {
      const r = await directGrant(params);
      if (r.ok) {
        const claims = await session.signIn(r.tokens);
        phoneSignIn.set({ face: null, digits: '', step: null, sentAt: null, resendAt: null });
        await enterApp(claims, width);
      }
      return r;
    } catch (e) {
      return { ok: false, error: 'failed', description: (e as Error)?.message || 'Sign-in failed', status: 0 };
    } finally {
      setBusy(false);
    }
  }

  /** Asks for a code for `digits` (the local number after +94); remembers the answer for the code screen. */
  async function sendCode(digits: string, channel?: 'voice'): Promise<DirectResult> {
    const r = await submit({ phone: `+94${digits.replace(/^0/, '')}`, channel });
    if (!r.ok && codeSent(r)) {
      const now = Date.now();
      phoneSignIn.set({ face, digits, step: r, sentAt: now, resendAt: now + (r.resendIn ?? 30) * 1000 });
    } else if (!r.ok && r.retryAfter) {
      phoneSignIn.set(p => ({ ...p, face, digits, resendAt: Date.now() + r.retryAfter! * 1000 }));
    }
    return r;
  }

  /** Checks the code sent to the number on file in phoneSignIn. */
  async function verifyCode(code: string): Promise<DirectResult> {
    const p = phoneSignIn.get();
    return submit({ phone: `+94${p.digits.replace(/^0/, '')}`, code });
  }

  return { busy, submit, sendCode, verifyCode };
}
