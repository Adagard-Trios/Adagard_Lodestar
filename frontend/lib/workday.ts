'use client';
// The working context of the desk screens: which run date and which depot(s) the user is looking at.
//  - Run date: ?runDate=YYYY-MM-DD, else the default from the user's own data (dispatch: the first run from today
//    with open orders, else the latest plan; a store: the latest order). Nothing is hard-coded.
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

/** Order statuses still on a run's books (not delivered, cancelled or moved to another run). */
export const OPEN_ORDER_STATUSES = ['RECEIVED', 'PLANNED', 'LOADED', 'ENROUTE', 'EXCEPTION'];

/**
 * The run date in view: ?runDate= or the date picked in the sidebar, else the default.
 *  - 'Plans' (dispatch): the working day, i.e. the first run from today (Colombo) that still has open orders
 *    (today's demo day while it runs, else the next queue). With no open orders from today on, the latest plan's
 *    run date (a past day stays reviewable).
 *  - 'Orders' (a store): the latest order's run date.
 */
export function useRunDate(source: 'Plans' | 'Orders' = 'Plans') {
  const pinned = useSyncExternalStore(subscribe, () => urlRunDate() ?? read(RUN_KEY), () => null);
  const today = colomboDay();
  const latest = useQuery<string | null>(pinned ? null : `latest-run:${source}:${today}`, async c => {
    if (source === 'Plans') {
      // the orders service down must not leave the desk without a date: the plans still give one
      const open = await c
        .list<{ runDate: string }>('Orders', {
          select: 'runDate',
          filter: `runDate ge ${today}T00:00:00.000Z and status in (${OPEN_ORDER_STATUSES.map(x => `'${x}'`).join(',')})`,
          orderby: 'runDate asc',
          top: 1,
        })
        .catch(() => null);
      if (open?.value[0]?.runDate) return isoDay(open.value[0].runDate);
    }
    const page = await c.list<{ runDate: string }>(source, { select: 'runDate', orderby: 'runDate desc', top: 1 });
    return page.value[0] ? isoDay(page.value[0].runDate) : null;
  }, { refreshOn: source === 'Plans' ? ['order_created', 'plan_published'] : undefined });
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

/** Orders for a run close at 4:00 PM Colombo time on the day before the run. */
export const CUTOFF_LABEL = '4:00 PM';

/** The 4:00 PM (Colombo, UTC+05:30) cutoff for a run date (YYYY-MM-DD). */
export function cutoffFor(runDate: string): Date {
  const prev = new Date(new Date(`${runDate}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10);
  return new Date(`${prev}T16:00:00+05:30`);
}

/** Today's date in Colombo (YYYY-MM-DD). */
export function colomboDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
