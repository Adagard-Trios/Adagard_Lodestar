'use client';
// The design's sign-in screens (SM-26, DSP-06, ADM-01) become the entry point to Keycloak: the identity provider
// hosts the actual form (password, 2-step), so the screen offers "Continue to sign in". Someone already signed in
// continues straight to their face.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { landingFor, type Face } from '@/lib/auth/session';

export function useSignInEntry(face: Face) {
  const auth = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const signedIn = auth.status === 'authenticated' && auth.session;
  const label = signedIn
    ? `Continue as ${auth.session!.name}`
    : busy
      ? 'Opening sign-in…'
      : failed
        ? 'Sign-in unavailable, try again'
        : 'Continue to sign in';
  const start = () => {
    if (signedIn) {
      router.push(landingFor(auth.session!.roles));
      return;
    }
    setBusy(true);
    setFailed(false);
    auth.login(`/${face}`).catch(() => {
      setBusy(false);
      setFailed(true);
    });
  };
  return { label, start, busy, failed, signedIn: Boolean(signedIn), loading: auth.status === 'loading' };
}
