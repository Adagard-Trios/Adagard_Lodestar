// Driver (Lodestar Run) helpers for the live screens: network/sync state, outbox labels, the run
// summary, and dispatch notices (stored Notifications + live socket notices, newest first).
import { useEffect, useMemo } from 'react';
import { kv } from '@/lib/kv';
import { inList } from '@/lib/odata';
import { Store, useStore } from '@/lib/store';
import { hm } from '@/lib/time';
import { network } from '@/offline/network';
import type { QueueItem } from '@/offline/queue';
import { notices, type Notice } from '@/realtime/notices';
import * as api from './api';
import { useNotifications, type RunView } from './hooks';
import { bumpRevision, client, sync } from './platform';
import { useQuery } from './query';
import type { Trip, TripStop } from './types';

/** Online flag plus the time it last changed ("no signal since …"). */
export function useNet() {
  return useStore(network);
}

/** The sync engine's state (running, last run, last result). */
export function useSyncStatus() {
  return useStore(sync.status);
}

/** Sends the outbox now; tells the caller what happened. */
export async function sendNow(): Promise<string> {
  const r = await sync.flush();
  if (r.offline) return 'No signal · records stay on this phone';
  if (!r.attempted) return 'Nothing waiting to send';
  return `${r.synced} of ${r.attempted} sent${r.conflicts ? ` · ${r.conflicts} to check` : ''}${r.rejected ? ` · ${r.rejected} refused` : ''}`;
}

// ---------------------------------------------------------------- outbox items

/** "POD · ORD0001" → ["POD · ", "ORD0001"] (the design sets the code in mono). */
export function labelParts(label: string): [string, string] {
  const i = label.indexOf(' · ');
  return i < 0 ? [label, ''] : [label.slice(0, i + 3), label.slice(i + 3)];
}

/** What the record says, in a few words. */
export function itemDetail(i: QueueItem): string {
  const p = i.payload ?? {};
  switch (i.kind) {
    case 'ARRIVAL':
      return `at the store ${hm(p.time) || hm(i.savedAt)}`;
    case 'LEAVE':
      return `left ${hm(p.time) || hm(i.savedAt)}`;
    case 'POD_SAVE':
      return `${p.units ?? 0}/${p.unitsOrdered ?? p.units ?? 0}${p.receiverName ? ` · ${p.receiverName}` : ''}`;
    default:
      return `saved ${hm(i.savedAt)}`;
  }
}

/** Short status word for a row. */
export function itemState(i: QueueItem): string {
  switch (i.status) {
    case 'pending':
      return 'waiting';
    case 'sending':
      return 'sending';
    case 'synced':
      return i.conflict ? 'heads-up' : hm(i.syncedAt) || 'sent';
    case 'conflict':
      return 'conflict';
    default:
      return 'refused';
  }
}

export const newestFirst = <T extends { savedAt: string }>(list: T[]) => [...list].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

/** "2 arrivals · 3 PODs" for a set of records. */
export function itemMix(items: QueueItem[]): string {
  const n = (k: QueueItem['kind']) => items.filter(i => i.kind === k).length;
  const parts = [
    [n('ARRIVAL'), 'arrival', 'arrivals'],
    [n('POD_SAVE'), 'POD', 'PODs'],
    [n('LEAVE'), 'departure', 'departures'],
    [items.length - n('ARRIVAL') - n('POD_SAVE') - n('LEAVE'), 'other', 'others'],
  ] as const;
  return parts.filter(([c]) => c > 0).map(([c, one, many]) => `${c} ${c === 1 ? one : many}`).join(' · ');
}

// ---------------------------------------------------------------- run summary

export type TripSummary = {
  trip: Trip | null;
  stops: TripStop[];
  delivered: TripStop[];
  unitsDelivered: number;
  unitsOrdered: number;
  short: TripStop[];
  exceptions: number;
  startedAt?: string | null;
  endedAt?: string | null;
  nextTrip: Trip | null;
};

/** The finished trip (else the current one) with delivered/ordered units from the PODs. */
export function tripSummary(view: RunView | null): TripSummary {
  const empty: TripSummary = { trip: null, stops: [], delivered: [], unitsDelivered: 0, unitsOrdered: 0, short: [], exceptions: 0, nextTrip: null };
  if (!view) return empty;
  const stopsOf = (t: Trip) => view.stops.filter(s => s.tripId === t.id);
  const done = view.trips.filter(t => {
    const st = stopsOf(t);
    return st.length > 0 && st.every(s => s.status === 'DELIVERED');
  });
  const trip = done.at(-1) ?? view.trip;
  if (!trip) return empty;
  const stops = stopsOf(trip);
  const delivered = stops.filter(s => s.status === 'DELIVERED');
  const pods = stops.map(s => s.pod).filter((p): p is NonNullable<TripStop['pod']> => !!p);
  const leaves = stops.map(s => s.leaveActual).filter((x): x is string => !!x).sort();
  const arrivals = stops.map(s => s.arrivalActual).filter((x): x is string => !!x).sort();
  return {
    trip,
    stops,
    delivered,
    unitsDelivered: pods.reduce((n, p) => n + (p.unitsDelivered ?? 0), 0),
    unitsOrdered: pods.reduce((n, p) => n + (p.unitsOrdered ?? 0), 0),
    short: stops.filter(s => s.pod && s.pod.unitsDelivered < s.pod.unitsOrdered),
    exceptions: pods.reduce((n, p) => n + (p.exceptions?.length ?? 0), 0),
    startedAt: trip.departTime ?? arrivals[0] ?? null,
    endedAt: leaves.at(-1) ?? null,
    nextTrip: view.trips.find(t => t.tripNumber > trip.tripNumber && stopsOf(t).some(s => s.status !== 'DELIVERED')) ?? null,
  };
}

// ---------------------------------------------------------------- dispatch notices

export type DispatchNotice = { id: string; type: string; title: string; body: string; at: string; read: boolean; stored: boolean };

const TITLES: Record<string, string> = {
  SHORTFALL_ACK: 'Shortfall acknowledged',
  POD_MATCHED: 'Delivery record matched',
  DEFERRAL_SUGGESTED: 'Order may move',
  ETA_UPDATE: 'ETA updated',
  PLAN_PUBLISHED: 'Plan published',
  TRIP_RELEASED: 'Trip released',
  SIGNAL_LOST: 'Signal lost',
  SIGNAL_BACK: 'Signal back',
  BLACKOUT_DETECTED: 'No signal on the route',
  REEFER_FAIL: 'Reefer alert',
  CREDIT_NOTE_ISSUED: 'Credit note issued',
  BAY_UPDATE: 'Bay update',
  NOTIFICATION: 'Notice from dispatch',
};

export function noticeTitle(type: string): string {
  const t = type.toUpperCase();
  return TITLES[t] ?? t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** A readable line from a free-form payload. */
export function noticeBody(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return '';
  for (const k of ['message', 'text', 'note', 'reason', 'summary', 'explanation']) {
    const v = payload[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return Object.entries(payload)
    .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
    .slice(0, 3)
    .map(([k, v]) => `${k} ${v}`)
    .join(' · ');
}

/** Stored notifications plus live socket notices not stored yet, newest first. */
export function useDispatchNotices() {
  const q = useNotifications();
  const live = useStore(notices);
  const list = useMemo(() => {
    const stored: DispatchNotice[] = (q.data ?? []).map(n => ({
      id: n.id,
      type: n.type,
      title: noticeTitle(n.type),
      body: noticeBody(n.payload),
      at: n.sentAt,
      read: !!n.readAt,
      stored: true,
    }));
    const ids = new Set(stored.map(n => n.id));
    const fresh: DispatchNotice[] = live
      .filter(n => !ids.has(n.id))
      .map(n => ({ id: n.id, type: n.type, title: noticeTitle(n.type), body: noticeBody(n.payload), at: n.at, read: false, stored: false }));
    return [...stored, ...fresh].sort((a, b) => b.at.localeCompare(a.at));
  }, [q.data, live]);
  return { ...q, list };
}

/** Notifications MarkRead (online only); refetches after. */
export async function markNoticeRead(n: DispatchNotice, online: boolean): Promise<void> {
  if (!online || !n.stored || n.read) return;
  await api.markRead(client, n.id);
  bumpRevision();
}

/** Whole minutes from now until `iso` (NaN without a time). */
export function minutesUntil(iso?: string | null, now: number = Date.now()): number {
  return iso ? Math.round((Date.parse(iso) - now) / 60_000) : NaN;
}

// ---------------------------------------------------------------- handover, offline save, new phone (DR-11/13/14/32)

const RUN_KEY = (what: 'accepted' | 'saved', tripId: string) => `lodestar.run.${what}.${tripId}`;

/** Per trip: when this phone accepted the load (DR-11) and when the run was saved for offline (DR-13), from the device store. */
export const runMarks = new Store<Record<string, string | null>>({});

async function loadMark(k: string) {
  if (k in runMarks.get()) return;
  const v = await kv.get(k).catch(() => null);
  runMarks.set(m => (k in m ? m : { ...m, [k]: v }));
}

export async function setRunMark(what: 'accepted' | 'saved', tripId: string, at: string = new Date().toISOString()) {
  const k = RUN_KEY(what, tripId);
  runMarks.set(m => ({ ...m, [k]: at }));
  await kv.set(k, at).catch(() => undefined);
}

/** The marks of a trip (`loaded` once read from the device store; null when none). */
export function useRunMarks(tripId?: string | null): { loaded: boolean; accepted: string | null; saved: string | null } {
  const all = useStore(runMarks);
  useEffect(() => {
    if (!tripId) return;
    void loadMark(RUN_KEY('accepted', tripId));
    void loadMark(RUN_KEY('saved', tripId));
  }, [tripId]);
  if (!tripId) return { loaded: false, accepted: null, saved: null };
  const a = RUN_KEY('accepted', tripId);
  const s = RUN_KEY('saved', tripId);
  return { loaded: a in all && s in all, accepted: all[a] ?? null, saved: all[s] ?? null };
}

/** A trip_released notice for one of the driver's trips that arrived after `since` (DR-11 opens on it). */
export function useReleasedNotice(tripIds: string[], since: string): Notice | undefined {
  const live = useStore(notices);
  const ids = tripIds.join(',');
  return useMemo(() => live.find(n => n.event === 'trip_released' && n.at >= since && ids.split(',').includes(String(n.payload.tripId ?? n.payload.id ?? ''))), [live, ids, since]);
}

export type ServerEvent = { id: string; tripId?: string | null; eventType: string; savedAt: string; syncedAt?: string | null };

/** The day's offline events the server holds for the driver's trips (the vehicle scope comes from the token). */
export function useServerEvents(tripIds: string[]) {
  const ids = [...tripIds].sort().join(',');
  return useQuery<ServerEvent[]>(ids ? `run.events.${ids}` : null, c => c.all<ServerEvent>('OfflineEvents', { filter: inList('tripId', ids.split(',')), select: ['id', 'tripId', 'eventType', 'savedAt', 'syncedAt'], orderby: 'syncedAt desc' }));
}

/**
 * Run moved to a new phone (DR-32): the server holds records for today's trip that this phone never saved, and
 * this phone has not saved the run for offline yet. The outbox keeps each record's id (the server's event id).
 */
export function movedRun(events: ServerEvent[] | undefined, mine: QueueItem[], saved: string | null): { moved: boolean; lastSynced?: string } {
  if (!events?.length || saved) return { moved: false };
  const own = new Set(mine.map(i => i.id));
  const others = events.filter(e => !own.has(e.id));
  if (!others.length) return { moved: false };
  const lastSynced = others.map(e => e.syncedAt ?? e.savedAt).filter(Boolean).sort().at(-1);
  return { moved: true, lastSynced };
}
