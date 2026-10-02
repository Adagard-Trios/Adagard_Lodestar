// What the desk knows about its own connection and access, fed by every API call (lib/odata/client.ts):
//  - offline: the browser is offline, or the Lodestar API did not answer (a network error) — DSP-24 offline banner;
//  - service down: the gateway answered 502/503/504, or the API is unreachable — SM-36 service unavailable;
//  - depot denied: a write was refused with 403 for a depot outside the user's own (depot ABAC) — DSP-36.
// Any successful response clears offline/service-down. The state is per tab and lives only in memory.
import { useSyncExternalStore } from 'react';

export interface DeskStatus {
  /** navigator.onLine (true when unknown). */
  browserOnline: boolean;
  /** When the API last failed with a network error, while no call has succeeded since. */
  apiDownSince: number | null;
  /** When the gateway last answered 502/503/504, while no call has succeeded since. */
  serviceDownSince: number | null;
  /** The last successful API response. */
  lastOkAt: number | null;
  /** Failed calls (network or 5xx) since the last success. */
  failures: number;
  /** The last depot-ABAC refusal, if any. */
  depotDenied: { depot: string | null; message: string; at: number; path: string } | null;
}

const initial = (): DeskStatus => ({
  browserOnline: typeof navigator === 'undefined' || navigator.onLine !== false,
  apiDownSince: null,
  serviceDownSince: null,
  lastOkAt: null,
  failures: 0,
  depotDenied: null,
});

let state: DeskStatus = initial();
const listeners = new Set<() => void>();
const set = (patch: Partial<DeskStatus>) => {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
};

let watching = false;
function watchBrowser() {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  window.addEventListener('online', () => set({ browserOnline: true }));
  window.addEventListener('offline', () => set({ browserOnline: false }));
}

export function subscribeDeskStatus(l: () => void) {
  watchBrowser();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const deskStatus = () => state;

const GATEWAY_DOWN = new Set([502, 503, 504]);

/** The API did not answer at all (DNS, refused, dropped network). */
export function reportNetworkError(now = Date.now()) {
  set({ apiDownSince: state.apiDownSince ?? now, failures: state.failures + 1 });
}

/** The API answered with `status`. */
export function reportResponse(status: number, now = Date.now()) {
  if (GATEWAY_DOWN.has(status)) {
    set({ serviceDownSince: state.serviceDownSince ?? now, failures: state.failures + 1 });
    return;
  }
  if (state.apiDownSince !== null || state.serviceDownSince !== null || state.failures || state.lastOkAt === null || now - state.lastOkAt > 1000) {
    set({ apiDownSince: null, serviceDownSince: null, failures: 0, lastOkAt: now });
  }
}

/** A depot named in a 403 message ("You do not plan for depot KANDY", "no access to depot KANDY"). */
export function depotOf(message: string): string | null {
  const m = /depot\s+([A-Za-z_]+)/i.exec(message);
  return m ? m[1].toUpperCase() : null;
}

/** Is this a refusal by depot ABAC (as opposed to a role or outlet refusal)? */
export function isDepotRefusal(e: { status: number; target?: string | null; message: string }): boolean {
  return e.status === 403 && (e.target === 'depot' || /\bdepot\b/i.test(e.message));
}

export function reportForbidden(e: { status: number; target?: string | null; message: string }, now = Date.now()) {
  if (!isDepotRefusal(e)) return;
  const path = typeof window === 'undefined' ? '' : window.location.pathname;
  set({ depotDenied: { depot: depotOf(e.message), message: e.message, at: now, path } });
}

export function clearDepotDenied() {
  set({ depotDenied: null });
}

/** Back to the initial state (tests). */
export function resetDeskStatus() {
  state = initial();
  listeners.forEach(l => l());
}

/** Offline as the dispatcher sees it: the browser or the API connection is down. */
export const isOffline = (s: DeskStatus) => !s.browserOnline || s.apiDownSince !== null;
/** The store desk cannot reach a working Lodestar server. */
export const isServiceDown = (s: DeskStatus) => !s.browserOnline || s.apiDownSince !== null || s.serviceDownSince !== null;
/** Since when the desk has been cut off (the earliest failure). */
export const downSince = (s: DeskStatus) =>
  [s.apiDownSince, s.serviceDownSince].filter((v): v is number => v !== null).sort((a, b) => a - b)[0] ?? null;

export function useDeskStatus(): DeskStatus {
  return useSyncExternalStore(subscribeDeskStatus, deskStatus, deskStatus);
}

/**
 * Asks the API whether it answers again (any HTTP answer counts, even 401: the server is there). Resolves to true
 * when it answered with something other than a gateway error.
 */
export async function probeApi(apiBase: string, fetchImpl: typeof fetch = (i, init) => fetch(i, init)): Promise<boolean> {
  try {
    const res = await fetchImpl(`${apiBase.replace(/\/+$/, '')}/`, { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' });
    reportResponse(res.status);
    return !GATEWAY_DOWN.has(res.status);
  } catch {
    reportNetworkError();
    return false;
  }
}
