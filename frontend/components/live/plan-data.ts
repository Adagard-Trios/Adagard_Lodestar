'use client';
// Shared data for the Lodestar Plan screens: the run date and depots in view, and the exceptions list (DSP-08,
// DSP-13) built from real records: orders in EXCEPTION, stops with a high late risk, and alert notifications
// (vehicle and signal alerts, dock flags and vehicle faults, POD exceptions and failed stops, store receipt issues), and
// the run's synced offline records with a conflict note (DSP-A2). p5Link() names the P5 screen that handles an item.
import { dayFilter, fmtClock, fmtTime } from '@/lib/format';
import { useEffect, useRef } from 'react';
import { useAction, useEntity, useQuery } from '@/lib/odata/hooks';
import type { AgentRun, Notification, OfflineEvent, Order, TripStop } from '@/lib/odata/types';
import { depotFilter, useDepot, useRunDate } from '@/lib/workday';

export function usePlanScope() {
  const { runDate, loading, error, none } = useRunDate('Plans');
  const { depot, depots, active, setDepot } = useDepot();
  const and = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' and ') || undefined;
  return {
    runDate,
    loadingDate: loading,
    dateError: error,
    noPlans: none,
    depot,
    depots,
    active,
    setDepot,
    /** Orders of the run date in the depots in view. */
    ordersFilter: runDate ? and(dayFilter('runDate', runDate), depotFilter('outlet/depot', active)) : undefined,
    /** Trips of the run date in the depots in view. */
    tripsFilter: runDate ? and(dayFilter('runDate', runDate), depotFilter('depot', active)) : undefined,
    /** Plans of the run date in the depots in view. */
    plansFilter: runDate ? and(dayFilter('runDate', runDate), depotFilter('depot', active)) : undefined,
    and,
  };
}

export type ExceptionTone = 'bad' | 'warn' | 'off';

export interface ExceptionItem {
  id: string;
  tone: ExceptionTone;
  title: string;
  meta: string;
  /** Right-hand figure, e.g. "41%" late risk. */
  value?: string;
  valueLabel?: string;
  at?: string;
  outletId?: string;
  orderId?: string;
  tripId?: string;
  source: 'order' | 'stop' | 'notification' | 'sync';
  vehicleId?: string;
  notificationId?: string;
  /** The notification type, for notification items. */
  type?: string;
}

/** Late risk at or above this is an exception the dispatcher should look at. */
export const LATE_RISK_ALERT = 40;
const ALERT_TYPES = [
  'BLACKOUT_DETECTED', 'REEFER_FAIL', 'SHORTFALL_ACK', 'DEFERRAL_SUGGESTED', 'SIGNAL_LOST', 'DOCK_BLOCKED', 'LATE_RISK',
  'SHORTFALL_FLAGGED', 'POD_EXCEPTION', 'STOP_FAILED', 'RECEIPT_ISSUE', 'VEHICLE_FAULT',
];

function describeNotification(n: Notification): Pick<ExceptionItem, 'title' | 'meta' | 'tone' | 'outletId' | 'orderId' | 'vehicleId'> {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  const text = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : undefined);
  const nice = n.type.toLowerCase().replace(/_/g, ' ');
  const title = text('title') ?? text('message') ?? nice.charAt(0).toUpperCase() + nice.slice(1);
  const meta = [text('orderId'), text('vehicleId'), text('outletId'), text('location'), text('note'), fmtTime(n.sentAt)].filter(Boolean).join(' · ');
  const tone: ExceptionTone = /BLACKOUT|SIGNAL/.test(n.type) ? 'off' : /FAIL|BLOCK|ISSUE|FAULT/.test(n.type) ? 'bad' : 'warn';
  return { title, meta, tone, outletId: text('outletId'), orderId: text('orderId'), vehicleId: text('vehicleId') };
}

/** Everything that needs the dispatcher for the run date, most urgent first. */
export function useExceptions(runDate: string | undefined, ordersFilter: string | undefined, active: readonly string[]) {
  return useQuery<ExceptionItem[]>(
    runDate ? `exceptions:${runDate}:${active.join(',')}` : null,
    async c => {
      const stopsFilter = [
        dayFilter('trip/runDate', runDate!),
        `lateRiskPct ge ${LATE_RISK_ALERT}`,
        "status ne 'DELIVERED'",
        depotFilter('trip/depot', active),
      ].filter(Boolean).join(' and ');
      const syncFilter = [dayFilter('trip/runDate', runDate!), 'conflictNote ne null', depotFilter('trip/depot', active)].filter(Boolean).join(' and ');
      const [orders, stops, notes, synced] = await Promise.all([
        c.list<Order>('Orders', { filter: `${ordersFilter} and status eq 'EXCEPTION'`, expand: 'outlet($select=name,district)', top: 50 }),
        c.list<TripStop>('TripStops', { filter: stopsFilter, expand: 'trip($select=vehicleId,district),outlet($select=name,windowClose)', orderby: 'lateRiskPct desc', top: 50 }),
        c.list<Notification>('Notifications', {
          filter: `readAt eq null and type in (${ALERT_TYPES.map(t => `'${t}'`).join(',')})`,
          orderby: 'sentAt desc',
          top: 20,
        }),
        // a store or dispatcher without access to offline events still gets the rest of the list
        c.list<OfflineEvent>('OfflineEvents', { filter: syncFilter, expand: 'trip($select=vehicleId)', orderby: 'syncedAt desc', top: 50 }).catch(() => ({ value: [] as OfflineEvent[] })),
      ]);
      const byTrip = new Map<string, OfflineEvent[]>();
      for (const e of synced.value) if (e.tripId) byTrip.set(e.tripId, [...(byTrip.get(e.tripId) ?? []), e]);
      const items: ExceptionItem[] = [
        ...orders.value.map(o => ({
          id: `order:${o.id}`,
          source: 'order' as const,
          tone: 'bad' as const,
          title: `${o.outlet?.name ?? o.outletId}: order exception`,
          meta: [o.id, o.notes].filter(Boolean).join(' · '),
          orderId: o.id,
          outletId: o.outletId,
          at: o.updatedAt,
        })),
        ...stops.value.map(s => ({
          id: `stop:${s.id}`,
          source: 'stop' as const,
          tone: ((s.lateRiskPct ?? 0) >= 60 ? 'bad' : 'warn') as ExceptionTone,
          title: `${s.trip?.vehicleId ?? 'Trip'} late risk rising`,
          meta: [s.outlet?.name ?? s.outletId, `stop ${s.stopSeq}`, s.outlet?.windowClose ? `closes ${s.outlet.windowClose}` : undefined, s.etaModel ? `ETA ~${fmtClock(s.etaModel)}` : undefined]
            .filter(Boolean)
            .join(' · '),
          value: `${s.lateRiskPct}%`,
          valueLabel: 'late risk',
          outletId: s.outletId,
          orderId: s.orderId,
          tripId: s.tripId,
          at: s.updatedAt,
        })),
        ...notes.value.map(n => ({
          id: `note:${n.id}`,
          source: 'notification' as const,
          notificationId: n.id,
          type: n.type,
          tripId: n.tripId ?? undefined,
          at: n.sentAt,
          ...describeNotification(n),
        })),
        ...[...byTrip.entries()].map(([tripId, es]) => {
          const vehicleId = (es[0] as OfflineEvent & { trip?: { vehicleId?: string } }).trip?.vehicleId;
          const review = es.filter(e => !e.conflictResolved).length;
          return {
            id: `sync:${tripId}`,
            source: 'sync' as const,
            tone: (review ? 'bad' : 'warn') as ExceptionTone,
            title: `${vehicleId ?? 'A vehicle'} synced: ${es.length} conflict${es.length === 1 ? '' : 's'} to confirm`,
            meta: [es[0].conflictNote, es[0].syncedAt ? `synced ${fmtTime(es[0].syncedAt)}` : undefined].filter(Boolean).join(' · '),
            tripId,
            vehicleId,
            at: es[0].syncedAt ?? es[0].savedAt,
          };
        }),
      ];
      const rank: Record<ExceptionTone, number> = { bad: 0, warn: 1, off: 2 };
      return items.sort((a, b) => rank[a.tone] - rank[b.tone] || String(b.at ?? '').localeCompare(String(a.at ?? '')));
    },
    { refreshOn: ['notification', 'eta_update', 'signal_lost', 'signal_back', 'vehicle_fault'] },
  );
}

/** The P5 degradation screen that handles an exception, and the focus it opens on. */
export function p5Link(x: ExceptionItem): { href: string; label: string; focus?: ['trip' | 'vehicle', string] } | null {
  if (x.source === 'sync' && x.tripId) return { href: '/plan/dsp-a2-reconcile-conflict', label: 'Reconcile', focus: ['trip', x.tripId] };
  if (x.type && /BLACKOUT|SIGNAL_LOST/.test(x.type)) return { href: '/plan/dsp-a1-blackout-view', label: 'Blackout view', focus: x.tripId ? ['trip', x.tripId] : undefined };
  if (x.type && /VEHICLE_FAULT|REEFER_FAIL/.test(x.type) && x.vehicleId) return { href: '/plan/dsp-b1-re-plan-diff', label: 'Re-plan', focus: ['vehicle', x.vehicleId] };
  return null;
}

const DRAFTING = new Set(['DRAFTING', 'RUNNING', 'PENDING', 'QUEUED']);

/** One planning-agent run; polled while the agent is still drafting. */
export function useAgentRun(id: string | null | undefined) {
  const q = useEntity<AgentRun>('AgentRuns', id ?? null);
  const drafting = Boolean(q.data && DRAFTING.has(String(q.data.status).toUpperCase()));
  // Reading a run refreshes it from the agent (planning re-syncs it at most every 2 s).
  useInterval(drafting ? 2000 : null, q.refresh);
  return { ...q, drafting };
}

/** Starts a planning-agent draft for one depot and run date. The agent drafts; it never publishes. */
export function useStartAgentRun(onStarted?: (run: AgentRun) => void) {
  return useAction<{ depot: string; runDate: string }, AgentRun>(
    (c, p) => c.create<AgentRun>('AgentRuns', { depot: p.depot, runDate: `${p.runDate}T00:00:00.000Z` }),
    { onSuccess: r => onStarted?.(r) },
  );
}

function useInterval(ms: number | null, fn: () => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  useEffect(() => {
    if (ms === null) return;
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [ms]);
}
