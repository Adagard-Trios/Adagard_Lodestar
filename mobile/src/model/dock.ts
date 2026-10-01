// Lodestar Dock (loader) helpers: line ticks kept on the device per trip, the load order of a sheet,
// the day's flags (load-record shortfalls + unsent SHORTFALL writes) and their acknowledgements.
import { useEffect, useMemo } from 'react';
import { kv } from '@/lib/kv';
import type { ODataClient } from '@/lib/odata';
import { Store, useStore } from '@/lib/store';
import { colomboDate, isoDay } from '@/lib/time';
import type { QueueItem } from '@/offline/queue';
import type { LoadSheet } from './api';
import { useQuery } from './query';
import type { LoadRecord, Notification, OrderLineItem, Shortfall, Trip, TripStop } from './types';

// ---------------------------------------------------------------- line ticks (local, persisted)

/** tripId → (line id → ISO time ticked). Loaded lazily from the device store. */
const ticks = new Store<Record<string, Record<string, string>>>({});
const loading = new Set<string>();
const KEY = (tripId: string) => `lodestar.ticks.${tripId}`;

function ensure(tripId: string) {
  if (ticks.get()[tripId] || loading.has(tripId)) return;
  loading.add(tripId);
  void kv
    .get(KEY(tripId))
    .then(raw => {
      let saved: Record<string, string> = {};
      try {
        const v: unknown = raw ? JSON.parse(raw) : {};
        if (v && typeof v === 'object' && !Array.isArray(v)) saved = v as Record<string, string>;
      } catch {
        // a damaged entry starts empty
      }
      // keep ticks made before the load finished
      ticks.set(all => ({ ...all, [tripId]: { ...saved, ...(all[tripId] ?? {}) } }));
    })
    .catch(() => ticks.set(all => (all[tripId] ? all : { ...all, [tripId]: {} })))
    .finally(() => loading.delete(tripId));
}

function save(tripId: string, next: Record<string, string>) {
  ticks.set(all => ({ ...all, [tripId]: next }));
  void kv.set(KEY(tripId), JSON.stringify(next)).catch(() => undefined);
}

/** The ticked ("loaded") lines of a trip; every change is saved on the device at once. */
export function useTicks(tripId: string | undefined) {
  const all = useStore(ticks);
  useEffect(() => {
    if (tripId) ensure(tripId);
  }, [tripId]);
  const map = useMemo(() => (tripId ? (all[tripId] ?? {}) : {}), [all, tripId]);
  return useMemo(
    () => ({
      map,
      isTicked: (lineId: string) => !!map[lineId],
      toggle: (lineId: string) => {
        if (!tripId) return;
        const next = { ...map };
        if (next[lineId]) delete next[lineId];
        else next[lineId] = new Date().toISOString();
        save(tripId, next);
      },
      tick: (lineId: string) => {
        if (!tripId || map[lineId]) return;
        save(tripId, { ...map, [lineId]: new Date().toISOString() });
      },
    }),
    [map, tripId],
  );
}

/** Number of ticked lines over several trips (shift summaries). */
export function useTickCount(tripIds: string[]): number {
  const all = useStore(ticks);
  const keyList = tripIds.join(',');
  useEffect(() => {
    for (const id of keyList ? keyList.split(',') : []) ensure(id);
  }, [keyList]);
  return tripIds.reduce((n, id) => n + Object.keys(all[id] ?? {}).length, 0);
}

// ---------------------------------------------------------------- load order

/** `ticked` counts the lines accounted for (ticked, or flagged short). */
export type LoadGroup = { stop: TripStop; lines: OrderLineItem[]; ticked: number; order: number };

/** Stops in loading order (last stop goes in first), each with its order lines. */
export function loadGroups(sheet: LoadSheet | undefined, done: (line: OrderLineItem) => boolean): LoadGroup[] {
  if (!sheet) return [];
  const stops = [...sheet.stops].sort((a, b) => b.stopSeq - a.stopSeq);
  return stops.map((stop, i) => {
    const lines = sheet.lines.filter(l => l.orderId === stop.orderId);
    return { stop, lines, ticked: lines.filter(done).length, order: i + 1 };
  });
}

/** 1st, 2nd, 3rd, 4th … */
export function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export const tempLabel = (t?: string | null) => (t === 'CHILLED' ? 'Chilled' : t === 'AMBIENT' ? 'Ambient' : '');

/** The shortfall flagged for a line (by item name and, when known, order). */
export function shortfallFor(shortfalls: Shortfall[], line: Pick<OrderLineItem, 'name' | 'orderId'>): Shortfall | undefined {
  return shortfalls.find(s => s.item === line.name && (!s.orderId || s.orderId === line.orderId));
}

/** Reefer reading for a trip: the load record's, else the trip's. */
export function reeferOf(trip?: Trip | null, lr?: LoadRecord | null): number | undefined {
  const v = lr?.reeferTempC ?? trip?.reeferTempC;
  return typeof v === 'number' ? v : undefined;
}

// ---------------------------------------------------------------- flags

export type FlagRecord = LoadRecord & { trip?: Pick<Trip, 'id' | 'vehicleId' | 'district' | 'brand' | 'bay' | 'status' | 'runDate' | 'departTime'> };

/** The depot's load records (with their trip), newest first: every day, for the flags tab's history. */
export async function flagRecords(c: Pick<ODataClient, 'all'>): Promise<FlagRecord[]> {
  return c.all<FlagRecord>('LoadRecords', {
    expand: 'trip($select=id,vehicleId,district,brand,bay,status,runDate,departTime)',
    orderby: 'loadedAt desc',
    top: 200,
  });
}

export function useFlagRecords(day: string | undefined) {
  return useQuery(day ? `dock.flags.${day}` : null, c => flagRecords(c), { persist: true });
}

export type Flag = {
  key: string;
  tripId: string;
  vehicleId?: string;
  day: string;
  shortfall: Shortfall;
  loaderId?: string;
  /** still on this phone */
  unsent: boolean;
  ack?: Notification;
};

/** The SHORTFALL_ACK notice for a flag, if dispatch answered it. */
export function ackFor(notes: Notification[] | undefined, tripId: string, item: string): Notification | undefined {
  return (notes ?? []).find(n => {
    if (n.type !== 'SHORTFALL_ACK') return false;
    const p = n.payload ?? {};
    const trip = n.tripId ?? (typeof p.tripId === 'string' ? p.tripId : undefined);
    if (trip !== tripId) return false;
    return typeof p.item === 'string' ? p.item === item : true;
  });
}

/** Server shortfalls of the load records, replaced per trip by the newest unsent SHORTFALL write. */
export function collectFlags(records: FlagRecord[], items: QueueItem[], notes: Notification[] | undefined): Flag[] {
  const unsent = new Map<string, QueueItem>();
  for (const i of items) {
    if (i.kind === 'SHORTFALL' && i.tripId && (i.status === 'pending' || i.status === 'sending')) unsent.set(i.tripId, i);
  }
  const out: Flag[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    seen.add(r.tripId);
    const q = unsent.get(r.tripId);
    const list: Shortfall[] = q ? ((q.payload.shortfalls as Shortfall[]) ?? []) : (r.shortfalls ?? []);
    for (const s of list) {
      const sent = !q || (r.shortfalls ?? []).some(x => x.item === s.item && x.qtyLoaded === s.qtyLoaded);
      out.push({ key: `${r.tripId}.${s.item}`, tripId: r.tripId, vehicleId: r.vehicleId, day: isoDay(r.trip?.runDate) || isoDay(r.loadedAt), shortfall: s, loaderId: r.loaderId, unsent: !sent, ack: ackFor(notes, r.tripId, s.item) });
    }
  }
  for (const [tripId, q] of unsent) {
    if (seen.has(tripId)) continue;
    for (const s of (q.payload.shortfalls as Shortfall[]) ?? []) {
      out.push({ key: `${tripId}.${s.item}`, tripId, vehicleId: undefined, day: colomboDate(Date.parse(s.at ?? q.savedAt) || Date.now()), shortfall: s, loaderId: q.sub, unsent: true, ack: ackFor(notes, tripId, s.item) });
    }
  }
  return out.sort((a, b) => (b.shortfall.at ?? '').localeCompare(a.shortfall.at ?? ''));
}
