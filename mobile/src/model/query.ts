// Live data with an offline cache: the last good answer of each query is kept (per user) in the
// device store, shown at once on the next open, and refreshed whenever there is signal.
import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';
import { kv } from '@/lib/kv';
import type { ODataClient } from '@/lib/odata';
import { Store, useStore } from '@/lib/store';
import { network } from '@/offline/network';
import { client, revision, session } from './platform';

export type QueryState<T> = {
  data?: T;
  error?: Error;
  loading: boolean;
  /** The data came from the device cache and has not been confirmed by the server yet. */
  fromCache: boolean;
  updatedAt?: number;
};

const EMPTY = new Store<QueryState<any>>({ loading: false, fromCache: false });
const entries = new Map<string, Store<QueryState<any>>>();
const inflight = new Map<string, Promise<void>>();
const PREFIX = 'lodestar.cache.';

function entry<T>(k: string): Store<QueryState<T>> {
  let e = entries.get(k);
  if (!e) {
    e = new Store<QueryState<T>>({ loading: false, fromCache: false });
    entries.set(k, e);
  }
  return e;
}

type Fetcher<T> = (c: ODataClient) => Promise<T>;

async function load<T>(k: string, fetcher: Fetcher<T>, persist: boolean, canFetch: boolean): Promise<void> {
  const e = entry<T>(k);
  if (e.get().data === undefined && persist) {
    try {
      const raw = await kv.get(PREFIX + k);
      if (raw && e.get().data === undefined) {
        const { at, data } = JSON.parse(raw);
        e.set(s => ({ ...s, data, updatedAt: at, fromCache: true }));
      }
    } catch {
      // a damaged cache entry is ignored
    }
  }
  if (!canFetch) return;
  if (inflight.has(k)) return inflight.get(k);
  const p = (async () => {
    e.set(s => ({ ...s, loading: true }));
    try {
      const data = await fetcher(client);
      const at = Date.now();
      e.set({ data, loading: false, fromCache: false, updatedAt: at });
      if (persist) await kv.set(PREFIX + k, JSON.stringify({ at, data })).catch(() => undefined);
    } catch (err) {
      e.set(s => ({ ...s, loading: false, error: err as Error }));
    }
  })().finally(() => inflight.delete(k));
  inflight.set(k, p);
  return p;
}

/**
 * Runs `fetcher` for `key` (null = nothing to load yet). With `persist`, the answer is cached on the
 * device for offline use. Refetches when the signal comes back and after a sync.
 */
export function useQuery<T>(queryKey: string | null, fetcher: Fetcher<T>, opts: { persist?: boolean } = {}): QueryState<T> & { refresh: () => void } {
  const s = useStore(session.state);
  const online = useStore(network).online;
  const rev = useStore(revision);
  const sub = s.claims?.sub;
  const k = queryKey && sub ? `${sub}.${queryKey}` : null;
  const store = k ? entry<T>(k) : (EMPTY as Store<QueryState<T>>);
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const persist = !!opts.persist;
  const canFetch = s.status === 'signed-in' && online;

  const run = useEffectEvent(() => {
    if (k) void load(k, fetcher, persist, canFetch);
  });
  useEffect(() => {
    run();
  }, [k, rev, canFetch]);

  return { ...state, refresh: () => k && void load(k, fetcher, persist, true) };
}

/** Forget cached answers (sign-out; a revoked device). */
export async function clearCache(sub?: string) {
  for (const k of [...entries.keys()]) if (!sub || k.startsWith(`${sub}.`)) entries.delete(k);
  const keys = await kv.keys(PREFIX + (sub ? `${sub}.` : '')).catch(() => [] as string[]);
  await Promise.all(keys.map(k => kv.remove(k).catch(() => undefined)));
}

/** Read a cached answer directly (outside React). */
export function peek<T>(queryKey: string): T | undefined {
  const sub = session.claims?.sub;
  return sub ? (entries.get(`${sub}.${queryKey}`)?.get().data as T | undefined) : undefined;
}
