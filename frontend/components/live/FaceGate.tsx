'use client';
// Route guard for a desk face (/plan, /store, /admin). Wraps every screen of the face (app/<face>/layout.tsx):
//  - design preview: the static prototype, no sign-in;
//  - entry screens (sign in, reset access, …): always reachable;
//  - otherwise a session is required (else → Keycloak, coming back to this page afterwards; when the tab's session
//    ended because it could not be renewed, the face's "session ended" screen first, DSP-35 on Lodestar Plan),
//    and the user's role must belong to this face (else → their own face).
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { canUseFace, faceFor, isEntryPath, landingFor, SESSION_ENDED_SCREEN, type Face } from '@/lib/auth/session';
import { useDesignMode } from '@/lib/mode';
import { GateScreen } from './states';

export type GateDecision = 'pending' | 'render' | 'login' | 'expired' | 'redirect' | 'no-desk-role';

/** Pure decision, unit-tested. */
export function decideGate(input: {
  design: boolean | null;
  status: 'loading' | 'anonymous' | 'authenticated';
  roles: readonly string[];
  face: Face;
  path: string;
  /** The tab's session ended because it could not be renewed. */
  expired?: boolean;
}): GateDecision {
  if (input.design === null) return 'pending';
  if (input.design) return 'render';
  if (isEntryPath(input.path)) return 'render';
  if (input.status === 'loading') return 'pending';
  if (input.status === 'anonymous') return input.expired && SESSION_ENDED_SCREEN[input.face] ? 'expired' : 'login';
  if (canUseFace(input.roles, input.face)) return 'render';
  return faceFor(input.roles) ? 'redirect' : 'no-desk-role';
}

export default function FaceGate({ face, children }: { face: Face; children: ReactNode }) {
  const design = useDesignMode();
  const auth = useAuth();
  const path = usePathname() ?? `/${face}`;
  const router = useRouter();
  const roles = auth.session?.roles ?? [];
  const decision = decideGate({ design, status: auth.status, roles, face, path, expired: auth.expired });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (decision === 'login') {
      auth.login(window.location.pathname + window.location.search).catch((e: Error) =>
        setLoginError(e?.message || 'The sign-in service did not answer.'),
      );
    }
    if (decision === 'expired') {
      const back = window.location.pathname + window.location.search;
      router.replace(`${SESSION_ENDED_SCREEN[face]}?returnTo=${encodeURIComponent(back)}`);
    }
    if (decision === 'redirect') router.replace(landingFor(roles));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision, attempt]);

  if (decision === 'render') return <>{children}</>;
  if (decision === 'login' && loginError) {
    return (
      <GateScreen
        title="Sign-in is not available"
        text={`Lodestar could not reach the sign-in service (${loginError}). Try again in a moment.`}
        action={{ label: 'Try again', onClick: () => { setLoginError(null); setAttempt(a => a + 1); } }}
      />
    );
  }
  if (decision === 'no-desk-role') {
    return (
      <GateScreen
        title="No desk access"
        text="This account works in the Lodestar phone apps (Dock or Run), not on the desk website."
        action={{ label: 'Sign out', onClick: () => void auth.logout() }}
      />
    );
  }
  return <GateScreen busy title={decision === 'login' ? 'Taking you to sign in…' : decision === 'expired' ? 'Your session ended…' : 'Checking your session…'} />;
}
