'use client';
// Shared data for the P5 degradation screens on the desk (DSP-A1 blackout view, DSP-A1b provisional deferral,
// DSP-A2 reconcile conflict, DSP-B1 re-plan diff), built from real records only:
//  - signal state of a trip: the dispatcher's BLACKOUT_DETECTED / SIGNAL_BACK notifications, the synced
//    STATUS_CHANGE offline events (SIGNAL_LOST / SIGNAL_BACK) and the live signal_lost / signal_back notices;
//  - the next operating day (Calendar), the store managers of a set of outlets (Users), and notices sent with
//    Notifications/Lodestar.Send (the driver's app and the store's messages show them).
import { useMemo, useState } from 'react';
import { addDays, isoDay } from '@/lib/format';
import { useQuery, useRealtime } from '@/lib/odata/hooks';
import type { ODataClient } from '@/lib/odata/client';
import type { Notification, OfflineEvent, Trip, TripStop, User } from '@/lib/odata/types';

export interface SignalEvent {
  tripId?: string;
  vehicleId?: string;
  lost: boolean;
  at: string;
  location?: string;
  note?: string;
}

type Payload = Record<string, unknown>;
const text = (p: Payload, k: string) => (typeof p[k] === 'string' && p[k] ? (p[k] as string) : undefined);

function fromPayload(p: Payload, lost: boolean, at: string, tripId?: string | null): SignalEvent {
  return {
    tripId: tripId ?? text(p, 'tripId'),
    vehicleId: text(p, 'vehicleId'),
    lost,
    at: text(p, 'at') ?? text(p, 'savedAt') ?? at,
    location: text(p, 'location'),
    note: text(p, 'note'),
  };
}

/** Stops of a trip still to be served, in order. */
export const openStops = (t: Trip): TripStop[] =>
  [...(t.stops ?? [])].filter(s => !['DELIVERED', 'CANCELLED'].includes(s.status)).sort((a, b) => a.stopSeq - b.stopSeq);

/** The open stop with the highest late risk (the one the dispatcher has to decide about). */
export function riskiestStop(t: Trip): TripStop | undefined {
  return openStops(t).reduce<TripStop | undefined>((best, s) => ((s.lateRiskPct ?? -1) > (best?.lateRiskPct ?? -1) ? s : best), undefined);
}

/**
 * The latest signal event of each trip in `trips` (by trip id). A trip whose latest event is a loss is out of
 * contact: the screens show it as predicted, never as on time.
 */
export function useSignal(trips: Trip[] | undefined) {
  const ids = useMemo(() => (trips ?? []).slice(0, 60).map(t => t.id).sort((a, b) => a.localeCompare(b)), [trips]);
  const [live, setLive] = useState<SignalEvent[]>([]);
  useRealtime(['signal_lost', 'signal_back'], (payload, event) => {
    setLive(l => [...l, fromPayload((payload ?? {}) as Payload, event === 'signal_lost', new Date().toISOString())]);
  });
  const stored = useQuery<SignalEvent[]>(ids.length ? `signal:${ids.join(',')}` : null, async c => {
    const [notes, events] = await Promise.all([
      c.list<Notification>('Notifications', { filter: "type in ('BLACKOUT_DETECTED','SIGNAL_LOST','SIGNAL_BACK')", orderby: 'sentAt desc', top: 50 }),
      c.all<OfflineEvent>('OfflineEvents', { filter: `eventType eq 'STATUS_CHANGE' and tripId in (${ids.map(i => `'${i}'`).join(',')})`, orderby: 'savedAt asc' }),
    ]);
    return [
      ...notes.value.map(n => fromPayload((n.payload ?? {}) as Payload, n.type !== 'SIGNAL_BACK', n.sentAt, n.tripId)),
      ...events
        .filter(e => /SIGNAL_(LOST|BACK)/.test(String(e.payload?.status ?? '')))
        .map(e => fromPayload(e.payload ?? {}, e.payload?.status === 'SIGNAL_LOST', e.savedAt, e.tripId)),
    ];
  }, { refreshOn: ['notification', 'signal_lost', 'signal_back'] });

  return useMemo(() => {
    const byTrip = new Map<string, SignalEvent>();
    const list = trips ?? [];
    const tripOf = (e: SignalEvent) =>
      (e.tripId && list.find(t => t.id === e.tripId)) ||
      (e.vehicleId && (list.find(t => t.vehicleId === e.vehicleId && t.status === 'ENROUTE') ?? list.find(t => t.vehicleId === e.vehicleId))) ||
      undefined;
    for (const e of [...(stored.data ?? []), ...live].sort((a, b) => a.at.localeCompare(b.at))) {
      const t = tripOf(e);
      if (t) byTrip.set(t.id, { ...e, tripId: t.id, vehicleId: t.vehicleId });
    }
    return { byTrip, loading: stored.loading, error: stored.error, refresh: stored.refresh };
  }, [stored.data, stored.loading, stored.error, stored.refresh, live, trips]);
}

/** Minutes since `at` (whole minutes, never negative). */
export const minutesSince = (at: string | null | undefined, now = new Date()) =>
  at ? Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 60_000)) : 0;

/** The next operating day after `runDate` (YYYY-MM-DD) from the Calendar, else the next day. */
export function useNextRunDay(runDate: string | undefined | null) {
  const day = runDate ? isoDay(runDate) : null;
  const q = useQuery<string>(day ? `next-run:${day}` : null, async c => {
    const rows = await c.list<{ date: string; isOperating: boolean }>('Calendar', {
      filter: `date gt ${day}T00:00:00Z and isOperating eq true`,
      orderby: 'date',
      top: 1,
    });
    return rows.value[0] ? isoDay(rows.value[0].date) : addDays(day!, 1);
  });
  return q.data ?? (day ? addDays(day, 1) : undefined);
}

/** Active store managers of these outlets (they receive the store notices). */
export function useStoreManagers(outletIds: string[]) {
  const ids = [...new Set(outletIds.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return useQuery<User[]>(ids.length ? `managers:${ids.join(',')}` : null, c =>
    c.all<User>('Users', { filter: `role eq 'STORE_MANAGER' and isActive eq true and outletId in (${ids.map(i => `'${i}'`).join(',')})`, select: 'id,name,outletId,phone' }),
  );
}

/** One driver (name and phone for "Call"). */
export function useDriver(driverId: string | null | undefined) {
  return useQuery<User>(driverId ? `driver:${driverId}` : null, c => c.get<User>('Users', driverId!, { select: 'id,name,phone' }));
}

/** A notice to a person: stored, pushed over the socket, and shown in the driver's or the store's app. */
export function sendNotice(c: ODataClient, n: { recipientId: string; tripId?: string; outletId?: string; payload: Payload }) {
  return c.action<Notification>('Notifications', null, 'Send', {
    recipientId: n.recipientId,
    type: 'DISPATCH_NOTICE',
    ...(n.tripId ? { tripId: n.tripId } : {}),
    ...(n.outletId ? { outletId: n.outletId } : {}),
    payload: n.payload,
  });
}

/** "Skip OUT108 if after 7:30": the latest useful arrival, 15 minutes before the window closes. */
export function skipAfter(windowClose: string | null | undefined): string | undefined {
  const m = /^(\d{1,2}):(\d{2})/.exec(windowClose ?? '');
  if (!m) return undefined;
  const mins = Number(m[1]) * 60 + Number(m[2]) - 15;
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
}

/** Trips of the run date for the depots in view, with stops, outlets and orders (for the P5 screens). */
export function useRunTrips(tripsFilter: string | undefined, extra?: string) {
  const filter = tripsFilter ? [tripsFilter, extra].filter(Boolean).join(' and ') : undefined;
  return useQuery<Trip[]>(filter ? `p5-trips:${filter}` : null, c =>
    c.all<Trip>('Trips', {
      filter,
      expand: 'stops($expand=outlet($select=id,name,windowClose),order($select=id,units,kg,m3,tempClass,deferredYesterday,deferralScore)),vehicle,driver,loadRecord($select=loadedAt,releasedAt,bay)',
      orderby: 'depot,vehicleId,tripNumber',
    }),
  { refreshOn: ['eta_update', 'signal_lost', 'signal_back', 'notification', 'plan_published'], pollMs: 30_000 });
}

