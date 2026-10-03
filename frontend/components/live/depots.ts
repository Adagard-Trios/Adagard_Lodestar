'use client';
// The depot registry (ADM-21, OData Depots): every desk screen names depots from here, never from a hard-coded
// map. One request per API client, shared by every component that asks (a module-level store), refreshed after an
// admin registers, edits or deactivates a depot. While it loads (or when it cannot load, e.g. before sign-in) a
// depot shows as its code; no name is ever made up.
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { ODataClient, WithEtag } from '@/lib/odata/client';
import { useODataClient } from '@/lib/odata/hooks';
import type { DepotRow } from '@/lib/odata/types';

interface Entry {
  rows?: WithEtag<DepotRow>[];
  error?: unknown;
  promise?: Promise<void>;
  version: number;
  subs: Set<() => void>;
}

const entries = new WeakMap<ODataClient, Entry>();

function entryOf(c: ODataClient): Entry {
  let e = entries.get(c);
  if (!e) {
    e = { version: 0, subs: new Set() };
    entries.set(c, e);
  }
  return e;
}

function bump(e: Entry) {
  e.version++;
  e.subs.forEach(fn => fn());
}

function load(c: ODataClient, force = false): Promise<void> {
  const e = entryOf(c);
  if (e.promise && !force) return e.promise;
  const p = c
    .all<DepotRow>('Depots', { orderby: 'name', top: 200 })
    .then(rows => {
      e.rows = rows;
      e.error = undefined;
    })
    .catch(err => {
      e.error = err;
    })
    .finally(() => {
      if (e.promise === p) e.promise = undefined;
      bump(e);
    });
  e.promise = p;
  return p;
}

/** Reloads the registry for every screen using this client (after an admin write). */
export const refreshDepots = (c: ODataClient) => load(c, true);

/** The first word of a depot's name ("Peliyagoda DC" → "Peliyagoda"), for tight columns and chips. */
export const shortDepotName = (name: string) => name.split(' ')[0] || name;

export interface DepotsApi {
  /** Every depot the caller may read (admins also see deactivated ones), by name. */
  depots: WithEtag<DepotRow>[];
  /** Depots in service. */
  active: WithEtag<DepotRow>[];
  loading: boolean;
  error: unknown;
  /** The depot's name, or its code while the registry loads or for a code it does not know. */
  name(code: string | null | undefined): string;
  /** First word of the name ("Peliyagoda"), or the code. */
  short(code: string | null | undefined): string;
  get(code: string | null | undefined): WithEtag<DepotRow> | undefined;
  refresh(): Promise<void>;
}

export function useDepots(): DepotsApi {
  const client = useODataClient();
  const { session } = useAuth();
  const e = entryOf(client);
  const subscribe = useCallback((fn: () => void) => {
    e.subs.add(fn);
    return () => {
      e.subs.delete(fn);
    };
  }, [e]);
  useSyncExternalStore(subscribe, () => e.version, () => 0);
  const signedIn = Boolean(session);
  useEffect(() => {
    if (signedIn && !e.rows && !e.error) void load(client);
  }, [client, e, signedIn]);

  const rows = e.rows;
  const byCode = useMemo(() => new Map((rows ?? []).map(d => [d.code, d])), [rows]);
  const get = useCallback((code: string | null | undefined) => (code ? byCode.get(code) : undefined), [byCode]);
  const name = useCallback((code: string | null | undefined) => (code ? byCode.get(code)?.name ?? code : ''), [byCode]);
  const short = useCallback((code: string | null | undefined) => {
    const d = code ? byCode.get(code) : undefined;
    return d ? shortDepotName(d.name) : code ?? '';
  }, [byCode]);
  const refresh = useCallback(() => load(client, true), [client]);
  const depots = useMemo(() => rows ?? [], [rows]);
  const active = useMemo(() => depots.filter(d => d.isActive), [depots]);
  return { depots, active, loading: signedIn && !rows && !e.error, error: e.error, name, short, get, refresh };
}
