'use client';
// Watches the desk's connection and access (lib/desk-status) for one face and moves to the screen the design
// draws for it:
//  - Lodestar Plan: a write refused by depot ABAC (403 for a depot outside the user's own) → DSP-36 No access to
//    this depot. Losing the connection shows the DSP-24 offline banner in place (the chrome), not a new page.
//  - Lodestar Store: the server cannot be reached → SM-36 Service unavailable, which keeps the order draft and
//    retries. A single failing service (one 503 while the rest answers) stays an inline error on its screen.
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { isEntryPath, type Face } from '@/lib/auth/session';
import { useDeskStatus, type DeskStatus } from '@/lib/desk-status';
import { useDesignMode } from '@/lib/mode';

export const NO_DEPOT_ACCESS = '/plan/dsp-36-no-access-to-this-depot';
export const SERVICE_UNAVAILABLE = '/store/sm-36-service-unavailable';

/** Where the store desk goes when the server cannot be reached (pure, unit-tested). */
export function storeCutOff(s: DeskStatus): boolean {
  return !s.browserOnline || s.apiDownSince !== null || (s.serviceDownSince !== null && s.failures >= 2);
}

export default function DeskWatch({ face }: { face: Face }) {
  const design = useDesignMode();
  const { status } = useAuth();
  const s = useDeskStatus();
  const path = usePathname() ?? '';
  const router = useRouter();
  const handled = useRef<number | null>(null);
  const active = design === false && status === 'authenticated' && !isEntryPath(path);

  const denied = face === 'plan' ? s.depotDenied : null;
  useEffect(() => {
    if (!active || !denied || handled.current === denied.at || path === NO_DEPOT_ACCESS) return;
    handled.current = denied.at;
    router.push(NO_DEPOT_ACCESS);
  }, [active, denied, path, router]);

  const cutOff = face === 'store' && storeCutOff(s);
  useEffect(() => {
    if (!active || !cutOff || path === SERVICE_UNAVAILABLE) return;
    router.push(`${SERVICE_UNAVAILABLE}?from=${encodeURIComponent(path)}`);
  }, [active, cutOff, path, router]);

  return null;
}
