// Shared pieces for live screens (src/live/<key>.tsx).
import { useEffect, useState } from 'react';
import { Linking, useWindowDimensions } from 'react-native';
import { useStore } from '@/lib/store';
import { biometricAvailable } from '@/auth/biometric';
import { goHome } from '@/auth/use-sign-in';
import { apiBase } from '@/lib/config';
import { getDeviceId, session } from '@/model/platform';
import { useQuery } from '@/model/query';
import { openScreen, showToast } from './runtime';

export { useDirectSignIn, useSignIn } from '@/auth/use-sign-in';

/**
 * Splash: signed in already → the role's first screen; otherwise on to the sign-in screen after 1.5 s.
 * `lock`: a stored session first stops on that unlock screen when the phone has a fingerprint enrolled (DSP-26).
 */
export function useSplash(signInKey: string, lock?: string) {
  const s = useStore(session.state);
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (s.status === 'restoring') return;
    let live = true;
    const t = setTimeout(() => {
      if (s.status === 'signed-in' && s.claims) {
        const claims = s.claims;
        if (!lock) goHome(claims, width);
        else void biometricAvailable().then(v => live && (v ? openScreen(lock, undefined, 'nav') : goHome(claims, width)));
      } else openScreen(signInKey, undefined, 'nav');
    }, s.status === 'signed-in' ? 400 : 1500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [s.status, s.claims, width, signInKey, lock]);
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

export type DispatcherContact = { depot: string | null; name: string | null; phone: string | null };

/** The dispatcher of the signed-in user's depot (Users/Lodestar.MyDispatcher), kept for offline use. */
export function useDispatcher() {
  return useQuery<DispatcherContact>('my-dispatcher', c => c.fn<DispatcherContact>('Users/Lodestar.MyDispatcher()'), { persist: true });
}

/** "Call dispatcher": opens the phone app on the depot dispatcher's number (stays on the screen). */
export async function callDispatcher(contact?: DispatcherContact | null): Promise<false> {
  const phone = contact?.phone?.trim();
  if (!phone) {
    showToast('No dispatcher phone number on file for your depot', 'error');
    return false;
  }
  const ok = await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).then(() => true, () => false);
  if (!ok) showToast(`Call ${contact?.name ?? 'the dispatcher'} on ${phone}`);
  return false;
}

/** The dispatcher desk website (served by the same gateway as the API, under /plan), optionally at one screen. */
export function desktopUrl(screen?: string): string {
  return `${apiBase()}/plan${screen ? `/${screen}` : ''}`;
}

/** "Open on desktop" / "Approve on desktop instead": opens the desk website at that screen (stays here). */
export async function openDesktop(screen?: string): Promise<false> {
  const url = desktopUrl(screen);
  const ok = await Linking.openURL(url).then(() => true, () => false);
  if (!ok) showToast(`Open ${url} on a computer`);
  return false;
}
