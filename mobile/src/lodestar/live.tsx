// Shared pieces for live screens (src/live/<key>.tsx).
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useStore } from '@/lib/store';
import { goHome } from '@/auth/use-sign-in';
import { getDeviceId, session } from '@/model/platform';
import { openScreen } from './runtime';

export { useSignIn } from '@/auth/use-sign-in';

/** Splash: signed in already → the role's first screen; otherwise on to the sign-in screen after 1.5 s. */
export function useSplash(signInKey: string) {
  const s = useStore(session.state);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (s.status === 'restoring') return;
    const t = setTimeout(() => {
      if (s.status === 'signed-in' && s.claims) goHome(s.claims, width);
      else openScreen(signInKey, undefined, 'nav');
    }, s.status === 'signed-in' ? 400 : 1500);
    return () => clearTimeout(t);
  }, [s.status, s.claims, width, signInKey]);
}

/** This install's device id (shown on sign-in and access screens so an admin can approve the phone). */
export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    getDeviceId()
      .then(v => live && setId(v))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return id;
}

/** The session problem to show on an access screen (expired, revoked, not registered), if any. */
export function useAccessProblem() {
  return useStore(session.state).problem;
}

/** Sign out, then back to the face's sign-in screen. */
export async function signOutTo(signInKey: string) {
  await session.signOut();
  openScreen(signInKey, undefined, 'nav');
  return false;
}

/** `value` or a dash (never a made-up value). */
export const orDash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : String(v));

/** "1 order" / "2 orders" */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "FRESH" → "Fresh" */
export const titleCase = (s?: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '');
