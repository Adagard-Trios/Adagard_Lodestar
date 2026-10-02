'use client';
// React bindings for the OData client and the realtime hub: useEntitySet, useEntity, useQuery, useAction,
// useRealtime. Data loads only once a session exists; the provider wires tokens from AuthProvider.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useAuth, type AuthApi } from '../auth/AuthProvider';
import { runtimeConfig } from '../config';
import { createRealtime, roomsFor, type RealtimeHandler, type RealtimeHub, type RealtimeStatus } from '../realtime';
import { ODataClient, ODataError, type EntityKey, type QueryOptions, type WithEtag } from './client';
import { faceOfPath, SESSION_ENDED_SCREEN } from '../auth/session';

export interface Api {
  client: ODataClient;
  realtime: RealtimeHub | null;
  /** Joins extra realtime rooms (e.g. trip:<id>) while the caller is mounted; returns the leave function. */
  joinRooms?: (rooms: string[]) => () => void;
}

export const ApiContext = createContext<Api | null>(null);

/** Lets long-lived objects (the client, the socket) reach the current auth state. */
class AuthBridge {
  constructor(private auth: AuthApi) {}
  update(auth: AuthApi) {
    this.auth = auth;
  }
  get current() {
    return this.auth;
  }
}

/** The current realtime hub, as an external store React can subscribe to. */
class HubSlot {
  private hub: RealtimeHub | null = null;
  private readonly subs = new Set<() => void>();
  subscribe = (fn: () => void) => {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  };
  get = () => this.hub;
  set(hub: RealtimeHub | null) {
    this.hub = hub;
    this.subs.forEach(fn => fn());
  }
}

function createClient(bridge: AuthBridge) {
  return new ODataClient({
    // During prerender nothing is fetched; in the browser the base comes from the page's origin.
    baseUrl: typeof window === 'undefined' ? '/odata/v4' : runtimeConfig().apiBase,
    tokens: {
      getAccessToken: () => bridge.current.getAccessToken(),
      renew: () => bridge.current.renew(),
      loginRequired: () => {
        // A face with a "session ended" screen (DSP-35) ends the session here; its route guard then shows that
        // screen. Elsewhere, straight back to sign in.
        const face = faceOfPath(window.location.pathname);
        const auth = bridge.current;
        if (face && SESSION_ENDED_SCREEN[face] && auth.expire) void auth.expire();
        else void auth.login(window.location.pathname + window.location.search);
      },
    },
  });
}

/** Builds the OData client and the Socket.IO hub for the signed-in user. */
export function ApiProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [bridge] = useState(() => new AuthBridge(auth));
  useEffect(() => bridge.update(auth), [auth, bridge]);
  const [client] = useState(() => createClient(bridge));
  const [slot] = useState(() => new HubSlot());
  const realtime = useSyncExternalStore(slot.subscribe, slot.get, () => null);

  // Extra rooms screens ask for (trip:<id> on live operations), reference-counted.
  const [extra, setExtra] = useState<Record<string, number>>({});
  const joinRooms = useCallback((rooms: string[]) => {
    setExtra(e => {
      const n = { ...e };
      rooms.forEach(r => (n[r] = (n[r] ?? 0) + 1));
      return n;
    });
    return () =>
      setExtra(e => {
        const n = { ...e };
        rooms.forEach(r => {
          n[r] = (n[r] ?? 1) - 1;
          if (n[r] <= 0) delete n[r];
        });
        return n;
      });
  }, []);

  const session = auth.status === 'authenticated' ? auth.session : null;
  const rooms = session ? [...roomsFor(session), ...Object.keys(extra).sort()] : null;
  const roomKey = session ? `${session.sub}|${rooms!.join(',')}` : '';
  useEffect(() => {
    if (!roomKey) return;
    const cfg = runtimeConfig();
    const hub = createRealtime({
      origin: cfg.wsOrigin,
      path: cfg.wsPath,
      rooms: roomKey.split('|')[1] ? roomKey.split('|')[1].split(',') : [],
      getToken: () => bridge.current.getAccessToken(),
      renew: () => bridge.current.renew(),
    });
    slot.set(hub);
    return () => {
      hub.close();
      slot.set(null);
    };
    // Reconnect only when the user or their rooms change, not on every token renewal.
  }, [roomKey, bridge, slot]);

  const api = useMemo(() => ({ client, realtime, joinRooms }), [client, realtime, joinRooms]);
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi() needs <ApiProvider>');
  return api;
}

export const useODataClient = () => useApi().client;

/** Calls `handler` for each realtime event in `events` ('*' for all). */
export function useRealtime(events: string | string[] | null | undefined, handler: RealtimeHandler) {
  const { realtime } = useApi();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);
  const key = Array.isArray(events) ? events.join('|') : events ?? '';
  useEffect(() => {
    if (!realtime || !key) return;
    const offs = key.split('|').map(e => realtime.on(e, (p, ev) => ref.current(p, ev)));
    return () => offs.forEach(off => off());
  }, [realtime, key]);
}

/** Receive the realtime events of these rooms (e.g. trip:<id>) while mounted. The server checks each room. */
export function useRealtimeRooms(rooms: string[]) {
  const { joinRooms } = useApi();
  const key = [...new Set(rooms)].sort().join(',');
  useEffect(() => {
    if (!joinRooms || !key) return;
    return joinRooms(key.split(','));
  }, [joinRooms, key]);
}

const noHub = () => () => undefined;

export function useRealtimeStatus(): RealtimeStatus {
  const { realtime } = useApi();
  return useSyncExternalStore(
    realtime ? fn => { const off = realtime.onStatus(fn); return () => { off(); }; } : noHub,
    () => realtime?.status() ?? 'idle',
    () => 'idle' as RealtimeStatus,
  );
}

export interface QueryState<T> {
  data: T | undefined;
  error: ODataError | undefined;
  loading: boolean;
  /** Reloads; resolves when done. */
  refresh(): Promise<void>;
  /** Replace the data locally (optimistic updates, realtime patches). */
  setData(update: T | ((prev: T | undefined) => T)): void;
}

export interface QueryOptionsExt {
  /** Realtime events that make this query reload. */
  refreshOn?: string[];
  /** Poll every n ms while mounted (e.g. a drafting agent run). */
  pollMs?: number;
}

const asError = (e: unknown) => (e instanceof ODataError ? e : new ODataError(0, { code: 'ClientError', message: (e as Error)?.message ?? String(e) }));

/**
 * Generic query. `key` identifies the request (null = don't run yet); `fetcher` runs it. Stale responses
 * (an older key finishing after a newer one) are ignored.
 */
export function useQuery<T>(key: string | null, fetcher: (c: ODataClient) => Promise<T>, opts: QueryOptionsExt = {}): QueryState<T> {
  const client = useODataClient();
  const [state, setState] = useState<{ key: string | null; data?: T; error?: ODataError; loading: boolean }>({ key: null, loading: key !== null });
  const seq = useRef(0);
  const fetchRef = useRef(fetcher);
  useEffect(() => {
    fetchRef.current = fetcher;
  }, [fetcher]);

  const run = useCallback(async () => {
    if (key === null) return;
    const mine = ++seq.current;
    setState(s => ({ ...s, key, loading: true, error: undefined }));
    try {
      const data = await fetchRef.current(client);
      if (mine === seq.current) setState({ key, data, loading: false });
    } catch (e) {
      if (mine === seq.current) setState(s => ({ ...s, key, error: asError(e), loading: false }));
    }
  }, [client, key]);

  useEffect(() => {
    void run();
  }, [run]);

  useRealtime(opts.refreshOn, () => {
    void run();
  });

  useEffect(() => {
    if (!opts.pollMs || key === null) return;
    const t = setInterval(() => void run(), opts.pollMs);
    return () => clearInterval(t);
  }, [opts.pollMs, key, run]);

  const setData = useCallback((update: T | ((prev: T | undefined) => T)) => {
    setState(s => ({ ...s, data: typeof update === 'function' ? (update as (p: T | undefined) => T)(s.data) : update }));
  }, []);

  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: key !== null && (!current || state.loading),
    refresh: run,
    setData,
  };
}

export interface EntitySetState<T> extends QueryState<T[]> {
  count: number | undefined;
  hasMore: boolean;
  loadMore(): Promise<void>;
  loadingMore: boolean;
}

/** One page of an entity set, with "load more" through @odata.nextLink. Pass `query: null` to wait. */
export function useEntitySet<T>(set: string, query: QueryOptions | null, opts: QueryOptionsExt = {}): EntitySetState<WithEtag<T>> {
  const client = useODataClient();
  const key = query === null ? null : `${set}:${JSON.stringify(query)}`;
  const [meta, setMeta] = useState<{ key: string | null; count?: number; nextLink?: string }>({ key: null });
  const [loadingMore, setLoadingMore] = useState(false);

  const q = useQuery<WithEtag<T>[]>(
    key,
    async c => {
      const page = await c.list<T>(set, query ?? undefined);
      setMeta({ key, count: page.count, nextLink: page.nextLink });
      return page.value;
    },
    opts,
  );

  const { setData } = q;
  const nextLink = meta.key === key ? meta.nextLink : undefined;
  const loadMore = useCallback(async () => {
    if (!nextLink) return;
    setLoadingMore(true);
    try {
      const page = await client.next<T>(nextLink);
      setMeta(m => ({ ...m, nextLink: page.nextLink }));
      setData(prev => [...(prev ?? []), ...page.value]);
    } finally {
      setLoadingMore(false);
    }
  }, [client, nextLink, setData]);

  return { ...q, count: meta.key === key ? meta.count : undefined, hasMore: Boolean(nextLink), loadMore, loadingMore };
}

/** One entity by key. Pass `key: null` to wait. */
export function useEntity<T>(set: string, key: EntityKey | null | undefined, query?: Pick<QueryOptions, 'select' | 'expand'>, opts: QueryOptionsExt = {}) {
  const k = key === null || key === undefined || key === '' ? null : `${set}:${JSON.stringify(key)}:${JSON.stringify(query ?? {})}`;
  return useQuery<WithEtag<T>>(k, c => c.get<T>(set, key as EntityKey, query), opts);
}

export interface ActionState<P, R> {
  run(params: P): Promise<R | undefined>;
  pending: boolean;
  error: ODataError | undefined;
  data: R | undefined;
  reset(): void;
}

/**
 * A command (POST/PATCH or a Lodestar.* action). `run` never throws: the error is kept in `error` for the UI.
 * `onSuccess` runs after a successful call (refresh lists, navigate, …).
 */
export function useAction<P = void, R = unknown>(fn: (c: ODataClient, params: P) => Promise<R>, opts: { onSuccess?: (r: R, p: P) => void } = {}): ActionState<P, R> {
  const client = useODataClient();
  const [state, setState] = useState<{ pending: boolean; error?: ODataError; data?: R }>({ pending: false });
  const fnRef = useRef(fn);
  const okRef = useRef(opts.onSuccess);
  useEffect(() => {
    fnRef.current = fn;
    okRef.current = opts.onSuccess;
  });
  const run = useCallback(
    async (params: P) => {
      setState({ pending: true });
      try {
        const data = await fnRef.current(client, params);
        setState({ pending: false, data });
        okRef.current?.(data, params);
        return data;
      } catch (e) {
        setState({ pending: false, error: asError(e) });
        return undefined;
      }
    },
    [client],
  );
  const reset = useCallback(() => setState({ pending: false }), []);
  return { run, pending: state.pending, error: state.error, data: state.data, reset };
}
