// The depot registry (ADM-21, OData Depots): every field screen names depots from here, never from a fixed map.
// Kept in the device cache like the run, so names show offline too. While it has never loaded (first sign-in in a
// dead zone) a depot shows as its code; no name is made up.
import { useCallback, useMemo } from 'react';
import type { ODataClient } from '@/lib/odata';
import type { DepotRow } from './types';
import { peek, useQuery } from './query';

export const DEPOTS_KEY = 'depots';

const fetchDepots = (c: ODataClient) => c.all<DepotRow>('Depots', { orderby: 'name' });

/** First word of a name ("Peliyagoda DC" → "Peliyagoda"), for tight labels. */
export const shortName = (name: string) => name.split(' ')[0] || name;

function nameIn(rows: DepotRow[] | undefined, code: string | null | undefined): string {
  if (!code) return '';
  return rows?.find(d => d.code === code)?.name ?? code;
}

/**
 * A depot's name from the cached registry, outside React (notice texts, labels built in the model).
 * Screens use useDepots(), which also loads the registry and re-renders when it arrives.
 */
export const depotName = (code: string | null | undefined) => nameIn(peek<DepotRow[]>(DEPOTS_KEY), code);

export function useDepots() {
  const q = useQuery(DEPOTS_KEY, fetchDepots, { persist: true });
  const rows = q.data;
  const depots = useMemo(() => rows ?? [], [rows]);
  const name = useCallback((code: string | null | undefined) => nameIn(rows, code), [rows]);
  const short = useCallback((code: string | null | undefined) => {
    const d = code ? rows?.find(r => r.code === code) : undefined;
    return d ? shortName(d.name) : code ?? '';
  }, [rows]);
  const active = useMemo(() => depots.filter(d => d.isActive), [depots]);
  return { depots, active, loading: q.loading && !rows, error: q.error, name, short, refresh: q.refresh };
}
