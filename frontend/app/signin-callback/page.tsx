'use client';
// Keycloak redirects here with ?code=…&state=… after sign-in. The code is redeemed (PKCE) and the user lands on
// their face: dispatcher → /plan, store manager → /store, admin → /admin (or the page they were sent away from).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { GateScreen } from '@/components/live/states';

export default function SigninCallback() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    auth
      .completeLogin(window.location.href)
      .then(next => alive && router.replace(next))
      .catch((e: Error) => alive && setError(e.message || 'Sign-in could not be completed'));
    return () => {
      alive = false;
    };
    // run once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <GateScreen title="Sign-in did not finish" text={error} action={{ label: 'Sign in again', onClick: () => void auth.login() }} />;
  }
  return <GateScreen busy title="Signing you in…" />;
}
