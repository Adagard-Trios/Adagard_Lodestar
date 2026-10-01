// Hooks for the live screens: the signed-in user, the day, live data (cached for offline use) with the
// phone's unsent writes laid over it, and the outbox state for the offline banners and sync screens.
import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { runDateOverride } from '@/lib/config';
import { useStore } from '@/lib/store';
import { colomboDate } from '@/lib/time';
import { network } from '@/offline/network';
import { needsAttention, summarize, type QueueItem } from '@/offline/queue';
import * as api from './api';
import { queue, session, sync } from './platform';
import { useQuery } from './query';
import type { Shortfall, Trip, TripStop } from './types';

export function useSession() {
  return useStore(session.state);
}

export function useClaims() {
  return useStore(session.state).claims;
}

export function useOnline(): boolean {
  return useStore(network).online;
}

/** The run date: today in Colombo, or EXPO_PUBLIC_RUN_DATE. */
export function today(): string {
  return runDateOverride() ?? colomboDate();
}

/** The signed-in user's outbox, with counts. */
export function useOutbox() {
  const items = useStore(queue.items);
  const sub = useClaims()?.sub;
  const syncing = useStore(sync.status).running;
  return useMemo(() => {
    const mine = sub ? items.filter(i => i.sub === sub) : items;
    return {
      items: mine,
      waiting: mine.filter(i => i.status === 'pending' || i.status === 'sending'),
      synced: mine.filter(i => i.status === 'synced'),
      attention: mine.filter(needsAttention),
      summary: summarize(mine),
      syncing,
    };
  }, [items, sub, syncing]);
}

/** A string query parameter of the current route (e.g. /s/dr-02-stop-arrival?stop=…). */
export function useParam(name: string): string | undefined {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const v = params[name];
  return Array.isArray(v) ? v[0] : v || undefined;
}

// ---------------------------------------------------------------- overlays

/** Lays the phone's unsent (or just-sent) driver writes over the server's stops. */
export function overlayStops(stops: TripStop[], items: QueueItem[]): TripStop[] {
  const live = items.filter(i => i.status === 'pending' || i.status === 'sending' || i.status === 'synced');
  if (!live.length) return stops;
  return stops.map(s => {
    let out = s;
    for (const i of live) {
      if (i.ref !== s.id) continue;
      if (i.kind === 'ARRIVAL' && !out.arrivalActual) out = { ...out, arrivalActual: i.payload.time, status: out.status === 'DELIVERED' ? out.status : 'ENROUTE' };
      if (i.kind === 'LEAVE') out = { ...out, leaveActual: out.leaveActual ?? i.payload.time };
      if (i.kind === 'POD_SAVE') {
        out = {
          ...out,
          status: 'DELIVERED',
          pod: {
            ...(out.pod ?? { id: `local-${i.id}`, tripStopId: s.id, savedAt: i.savedAt }),
            unitsDelivered: i.payload.units,
            unitsOrdered: i.payload.unitsOrdered ?? i.payload.units,
            receiverName: i.payload.receiverName ?? out.pod?.receiverName ?? null,
            savedOffline: i.status !== 'synced',
          } as TripStop['pod'],
        };
      }
    }
    return out;
  });
}

/** True while a write about `ref` is still on the phone. */
export function isUnsent(items: QueueItem[], ref?: string): boolean {
  return !!ref && items.some(i => i.ref === ref && (i.status === 'pending' || i.status === 'sending'));
}

// ---------------------------------------------------------------- driver

export type RunView = api.DriverRun & { trip: Trip | null; tripStops: TripStop[]; current: TripStop | null; next: TripStop | null; done: number };

export function shapeRun(run: api.DriverRun | undefined, items: QueueItem[]): RunView | null {
  if (!run) return null;
  const stops = overlayStops(run.stops, items);
  const open = (t: Trip) => stops.some(s => s.tripId === t.id && s.status !== 'DELIVERED');
  const trip = run.trips.find(open) ?? run.trips.at(-1) ?? null;
  const tripStops = trip ? stops.filter(s => s.tripId === trip.id) : [];
  const pending = tripStops.filter(s => s.status !== 'DELIVERED');
  return { ...run, stops, trip, tripStops, current: pending[0] ?? null, next: pending[1] ?? null, done: tripStops.length - pending.length };
}

/** The driver's run for the day (cached for the dead zone), with unsent writes applied. */
export function useRun() {
  const day = today();
  const q = useQuery(`run.${day}`, c => api.driverRun(c, day), { persist: true });
  const { items } = useOutbox();
  const view = useMemo(() => shapeRun(q.data, items), [q.data, items]);
  return { ...q, view };
}

/** A stop by id (route param `stop`), else the current one; `offset` 1 = the stop after it. */
export function useStop(offset = 0) {
  const run = useRun();
  const id = useParam('stop');
  const v = run.view;
  let stop: TripStop | null = null;
  if (v) {
    if (id) stop = v.stops.find(s => s.id === id) ?? null;
    else {
      const base = v.current ? v.tripStops.indexOf(v.current) : Math.max(0, v.tripStops.length - 1);
      stop = v.tripStops[base + offset] ?? v.tripStops.at(-1) ?? null;
    }
  }
  const trip = stop && v ? (v.trips.find(t => t.id === stop!.tripId) ?? null) : (v?.trip ?? null);
  const lines = useQuery(stop ? `lines.${stop.orderId}` : null, c => api.orderLines(c, stop ? [stop.orderId] : []), { persist: true });
  return { ...run, stop, trip, lines: lines.data ?? [] };
}

// ---------------------------------------------------------------- loader

export function useBayQueue() {
  const claims = useClaims();
  const depot = claims?.depots[0];
  const day = today();
  return useQuery(depot ? `bay.${depot}.${day}` : null, c => api.bayQueue(c, depot!, day), { persist: true });
}

/** The load sheet of `trip` (route param), else the first trip in the bay queue still loading. */
export function useLoadSheet() {
  const param = useParam('trip');
  const bay = useBayQueue();
  const fallback = bay.data?.trips.find(t => t.status === 'PLANNED' || t.status === 'LOADING') ?? bay.data?.trips[0];
  const tripId = param ?? fallback?.id;
  const q = useQuery(tripId ? `sheet.${tripId}` : null, c => api.loadSheet(c, tripId!), { persist: true });
  const { items } = useOutbox();
  const shortfalls = useMemo(() => effectiveShortfalls(tripId, q.data?.loadRecord?.shortfalls ?? [], items), [tripId, q.data, items]);
  const released = useMemo(() => items.find(i => i.kind === 'RELEASE' && i.tripId === tripId && i.status !== 'rejected' && i.status !== 'conflict'), [items, tripId]);
  return { ...q, tripId, bay, shortfalls, released };
}

/** Server shortfalls, replaced by the newest unsent SHORTFALL write for the trip (it carries the full list). */
export function effectiveShortfalls(tripId: string | undefined, server: Shortfall[], items: QueueItem[]): Shortfall[] {
  const mine = items.filter(i => i.kind === 'SHORTFALL' && i.tripId === tripId && (i.status === 'pending' || i.status === 'sending'));
  return mine.length ? (mine.at(-1)!.payload.shortfalls as Shortfall[]) : (server ?? []);
}

// ---------------------------------------------------------------- notices

export function useNotifications() {
  return useQuery('notifications', c => api.notifications(c), { persist: true });
}

// ---------------------------------------------------------------- store

export function useStoreDay() {
  const outletId = useClaims()?.outletId;
  return useQuery(outletId ? `store.${outletId}` : null, c => api.storeDay(c, outletId!), { persist: true });
}

/** An order by route param `order`, else the store's newest order. */
export function useOrder() {
  const param = useParam('order');
  const day = useStoreDay();
  const id = param ?? day.data?.orders[0]?.id;
  const q = useQuery(id ? `order.${id}` : null, c => api.orderDetail(c, id!), { persist: true });
  return { ...q, id, day };
}

export function usePods() {
  return useQuery('pods', c => api.pods(c), { persist: true });
}

// ---------------------------------------------------------------- dispatcher

export function usePlans() {
  return useQuery('plans.awaiting', c => api.plansAwaitingApproval(c));
}

export function useLiveRoutes() {
  const day = today();
  return useQuery(`routes.${day}`, c => api.liveRoutes(c, day), { persist: true });
}

export function useVehicle() {
  const param = useParam('vehicle');
  const routes = useLiveRoutes();
  const id = param ?? routes.data?.trips.find(t => t.status === 'ENROUTE')?.vehicleId ?? routes.data?.trips[0]?.vehicleId;
  const date = routes.data?.date ?? today();
  const q = useQuery(id ? `vehicle.${id}.${date}` : null, c => api.vehicleDetail(c, id!, date), { persist: true });
  return { ...q, id, routes };
}
