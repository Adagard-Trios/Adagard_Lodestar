'use client';
// The working context of the desk screens: which run date and which depot(s) the user is looking at.
//  - Run date: ?runDate=YYYY-MM-DD, else the latest run date in the user's own data (latest plan for dispatch,
//    latest order for a store). Nothing is hard-coded.
//  - Depot: all of the user's depots by default; picking one in the sidebar narrows the screens to it.
// Both are kept per tab (sessionStorage), so moving between screens keeps the choice.
import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from './auth/AuthProvider';
import { useQuery } from './odata/hooks';
import { isoDay } from './format';
import type { Depot } from './odata/types';

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, v: string | null) {
  try {
    if (v === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, v);
  } catch {
    // storage blocked: the choice lasts until reload
  }
  emit();
}

const DEPOT_KEY = 'lodestar.depot';
const RUN_KEY = 'lodestar.runDate';

function urlRunDate(): string | null {
  const v = new URLSearchParams(window.location.search).get('runDate');
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** The depot filter: null means all of the user's depots. */
export function useDepot() {
  const auth = useAuth();
  const depots = (auth.session?.depots ?? []) as Depot[];
  const stored = useSyncExternalStore(subscribe, () => read(DEPOT_KEY), () => null) as Depot | null;
  const depot = stored && depots.includes(stored) ? stored : null;
  const setDepot = useCallback((d: Depot | null) => write(DEPOT_KEY, d), []);
  return { depot, depots, setDepot, active: depot ? [depot] : depots };
}

/** OData filter limiting `field` to the depot(s) in view (the server applies the user's own depots anyway). */
export function depotFilter(field: string, active: readonly string[]): string | undefined {
  if (!active.length) return undefined;
  if (active.length === 1) return `${field} eq '${active[0]}'`;
  return `${field} in (${active.map(d => `'${d}'`).join(',')})`;
}

/**
 * The run date in view. `source` is the entity set whose latest runDate is the default ('Plans' for dispatch,
 * 'Orders' for a store manager).
 */
export function useRunDate(source: 'Plans' | 'Orders' = 'Plans') {
  const pinned = useSyncExternalStore(subscribe, () => urlRunDate() ?? read(RUN_KEY), () => null);
  const latest = useQuery<string | null>(pinned ? null : `latest-run:${source}`, async c => {
    const page = await c.list<{ runDate: string }>(source, { select: 'runDate', orderby: 'runDate desc', top: 1 });
    return page.value[0] ? isoDay(page.value[0].runDate) : null;
  });
  const setRunDate = useCallback((d: string | null) => write(RUN_KEY, d), []);
  const runDate = pinned ?? latest.data ?? undefined;
  return { runDate, loading: !pinned && latest.loading, error: latest.error, setRunDate, none: !pinned && latest.data === null };
}

const RUN_ID_KEY = 'lodestar.agentRun';

/** The planning-agent run the dispatcher is working on (started on DSP-01/DSP-22, reviewed on DSP-02/03/12/39/40). */
export function useAgentRunId() {
  const id = useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get('run') ?? read(RUN_ID_KEY), () => null);
  const setId = useCallback((v: string | null) => write(RUN_ID_KEY, v), []);
  return [id, setId] as const;
}

/**
 * The record a detail screen shows (outlet profile, vehicle, person, device, audit entry). List screens set it
 * before following the design's link; ?id= in the URL wins, so detail screens can be linked directly.
 */
export function useFocusId(kind: 'outlet' | 'vehicle' | 'user' | 'device' | 'audit' | 'order' | 'trip') {
  const key = `lodestar.focus.${kind}`;
  const id = useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get('id') ?? read(key), () => null);
  const setId = useCallback((v: string | null) => write(key, v), [key]);
  return [id, setId] as const;
}
