// Lodestar Plan phone (dispatcher): the alerts list, the plan under review, trip progress and signal state,
// built from Notifications, Plans, the day's trips and the live socket notices.
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { inList } from '@/lib/odata';
import { addDays, dayFilter, dayLabel, hm } from '@/lib/time';
import { titleCase } from '@/lodestar/live';
import { notices, type Notice } from '@/realtime/notices';
import { useClaims, useLiveRoutes, useNotifications, useParam, usePlans } from './hooks';
import { useQuery } from './query';
import type { Deferral, Notification, Order, Outlet, Plan, Trip, TripStop } from './types';

/** Late risk at or above this needs the dispatcher. */
export const LATE_RISK = 50;

/** Notification types that wake the dispatcher until they are read. */
const ALERT_TYPES = new Set(['BLACKOUT_DETECTED', 'SIGNAL_LOST', 'REEFER_FAIL', 'DEFERRAL_SUGGESTED', 'LATE_RISK', 'DOCK_BLOCKED']);

export type AlertTone = 'late' | 'signal' | 'done';

export type AlertRow = {
  id: string;
  tone: AlertTone;
  title: string;
  meta: string;
  /** An id shown in mono in the meta line (order, outlet). */
  code?: string;
  at?: string;
  needsYou: boolean;
  plan?: string;
  vehicle?: string;
};

type Payload = Record<string, unknown>;
const text = (p: Payload, k: string) => (typeof p[k] === 'string' && p[k] ? (p[k] as string) : undefined);
const num = (p: Payload, k: string) => (typeof p[k] === 'number' ? (p[k] as number) : undefined);
const nice = (type: string) => titleCase(type);

/** "Peliyagoda & Kandy" for the dispatcher's depots. */
export function depotsLabel(depots?: string[] | null): string {
  if (!depots?.length) return '';
  return depots.length > 1 ? 'both depots' : titleCase(depots[0]);
}

export function planSource(p: Pick<Plan, 'source'>): string {
  return p.source === 'AGENT' ? 'Planning agent' : p.source === 'AUTOPLAN' ? 'Auto-plan' : 'Manual plan';
}

function vehicleOf(p: Payload, tripId: string | null | undefined, trips: Trip[]): string | undefined {
  const v = text(p, 'vehicleId');
  if (v) return v;
  const t = tripId ?? text(p, 'tripId');
  return t ? trips.find(x => x.id === t)?.vehicleId : undefined;
}

function fromNotification(n: Notification, trips: Trip[]): AlertRow {
  const p = (n.payload ?? {}) as Payload;
  const vehicle = vehicleOf(p, n.tripId, trips);
  const pct = num(p, 'lateRiskPct');
  const title =
    text(p, 'title') ??
    text(p, 'message') ??
    (n.type === 'BLACKOUT_DETECTED' ? `${vehicle ?? 'A vehicle'} lost signal`
      : n.type === 'SIGNAL_BACK' ? `${vehicle ?? 'A vehicle'} has signal again`
      : n.type === 'REEFER_FAIL' ? `${vehicle ?? 'A vehicle'} reefer failed`
      : n.type === 'SHORTFALL_ACK' ? 'Shortfall acknowledged'
      : n.type === 'POD_MATCHED' ? 'Proof of delivery matched'
      : n.type === 'DEFERRAL_SUGGESTED' ? 'Deferral suggested'
      : pct !== undefined && vehicle ? `${vehicle} late risk ${pct}%`
      : nice(n.type));
  const meta = [vehicle && !title.includes(vehicle) ? vehicle : undefined, text(p, 'location'), text(p, 'note'), text(p, 'reason')].filter(Boolean).join(' · ');
  const code = text(p, 'orderId') ?? text(p, 'outletId');
  const tone: AlertTone = /BLACKOUT|SIGNAL_LOST/.test(n.type) ? 'signal' : ALERT_TYPES.has(n.type) ? 'late' : 'done';
  return {
    id: `n:${n.id}`,
    tone,
    title,
    meta: meta || (n.readAt ? `Read ${hm(n.readAt)}` : nice(n.type)),
    code,
    at: n.sentAt,
    needsYou: ALERT_TYPES.has(n.type) && !n.readAt,
    plan: text(p, 'planId'),
    vehicle,
  };
}

function fromNotice(x: Notice, trips: Trip[]): AlertRow | null {
  const p = x.payload ?? {};
  const vehicle = vehicleOf(p, undefined, trips);
  const where = [text(p, 'location'), text(p, 'note')].filter(Boolean).join(' · ');
  switch (x.event) {
    case 'signal_lost':
      return { id: `s:${x.id}`, tone: 'signal', title: `${vehicle ?? 'A vehicle'} in a signal-loss zone`, meta: where || 'Live notice', at: x.at, needsYou: true, vehicle };
    case 'signal_back':
      return { id: `s:${x.id}`, tone: 'done', title: `${vehicle ?? 'A vehicle'} has signal again`, meta: where || 'Live notice', at: x.at, needsYou: false, vehicle };
    case 'eta_update': {
      const pct = num(p, 'lateRiskPct');
      if (pct === undefined || pct < LATE_RISK) return null;
      return { id: `s:${x.id}`, tone: 'late', title: `${vehicle ?? 'A trip'} late risk ${pct}%`, meta: [text(p, 'outletId'), text(p, 'etaModel') ? `ETA ~${hm(text(p, 'etaModel'))}` : undefined].filter(Boolean).join(' · ') || 'Live notice', at: x.at, needsYou: true, vehicle };
    }
    case 'plan_published':
      return { id: `s:${x.id}`, tone: 'done', title: 'Plan published', meta: [text(p, 'depot') ? titleCase(text(p, 'depot')) : undefined, text(p, 'planId') ?? text(p, 'id')].filter(Boolean).join(' · ') || 'Live notice', at: x.at, needsYou: false, plan: text(p, 'planId') ?? text(p, 'id') };
    case 'shortfall_ack':
      return { id: `s:${x.id}`, tone: 'done', title: 'Shortfall acknowledged', meta: vehicle ?? 'Live notice', code: text(p, 'orderId'), at: x.at, needsYou: false, vehicle };
    case 'trip_released':
      return { id: `s:${x.id}`, tone: 'done', title: `${vehicle ?? 'A trip'} released from the bay`, meta: where || 'Live notice', at: x.at, needsYou: false, vehicle };
    default:
      return null;
  }
}

/** Open stops of a trip at or above the late-risk threshold. */
export function lateStops(t: Trip): TripStop[] {
  return (t.stops ?? []).filter(s => s.status !== 'DELIVERED' && (s.lateRiskPct ?? 0) >= LATE_RISK);
}

/** Vehicles whose latest signal event is a loss (socket notices and notifications), with when it was lost. */
export function useSignalLost(): Map<string, string> {
  const live = useStore(notices);
  const notes = useNotifications().data;
  const routes = useLiveRoutes().data;
  return useMemo(() => {
    const trips = routes?.trips ?? [];
    const events: { vehicle: string; lost: boolean; at: string }[] = [];
    for (const x of live) {
      if (x.event !== 'signal_lost' && x.event !== 'signal_back') continue;
      const v = vehicleOf(x.payload ?? {}, undefined, trips);
      if (v) events.push({ vehicle: v, lost: x.event === 'signal_lost', at: x.at });
    }
    for (const n of notes ?? []) {
      if (n.type !== 'BLACKOUT_DETECTED' && n.type !== 'SIGNAL_BACK') continue;
      const v = vehicleOf((n.payload ?? {}) as Payload, n.tripId, trips);
      if (v) events.push({ vehicle: v, lost: n.type === 'BLACKOUT_DETECTED', at: n.sentAt });
    }
    events.sort((a, b) => a.at.localeCompare(b.at));
    const out = new Map<string, string>();
    for (const e of events) {
      if (e.lost) out.set(e.vehicle, e.at);
      else out.delete(e.vehicle);
    }
    return out;
  }, [live, notes, routes]);
}

/** Everything for DSP-27: plans awaiting approval, late-risk stops, notifications and live notices. */
export function useAlerts() {
  const claims = useClaims();
  const notes = useNotifications();
  const plans = usePlans();
  const routes = useLiveRoutes();
  const live = useStore(notices);
  const rows = useMemo(() => {
    const trips = routes.data?.trips ?? [];
    const out: AlertRow[] = [];
    for (const p of plans.data ?? []) {
      out.push({
        id: `p:${p.id}`,
        tone: 'late',
        title: `Plan v${p.version} waits for you`,
        meta: [planSource(p), titleCase(p.depot), dayLabel(p.runDate)].filter(Boolean).join(' · '),
        at: p.createdAt,
        needsYou: true,
        plan: p.id,
      });
    }
    for (const t of trips) {
      for (const s of lateStops(t)) {
        out.push({
          id: `r:${s.id}`,
          tone: 'late',
          title: `${t.vehicleId} late risk ${s.lateRiskPct}%`,
          meta: [t.district, `stop ${s.stopSeq}`, s.etaModel ? `ETA ~${hm(s.etaModel)}` : undefined].filter(Boolean).join(' · '),
          code: s.outletId,
          at: s.etaModel ?? undefined,
          needsYou: true,
          vehicle: t.vehicleId,
        });
      }
    }
    for (const n of notes.data ?? []) out.push(fromNotification(n, trips));
    const seen = new Set((notes.data ?? []).map(n => n.id));
    for (const x of live) {
      if (x.event === 'notification' || seen.has(x.id)) continue;
      const r = fromNotice(x, trips);
      if (r) out.push(r);
    }
    const byTime = (a: AlertRow, b: AlertRow) => String(b.at ?? '').localeCompare(String(a.at ?? ''));
    return { needs: out.filter(r => r.needsYou).sort(byTime), handled: out.filter(r => !r.needsYou).sort(byTime) };
  }, [plans.data, routes.data, notes.data, live]);
  const loading = notes.loading || plans.loading || routes.loading;
  const hasData = notes.data !== undefined || plans.data !== undefined || routes.data !== undefined;
  return { ...rows, signedIn: !!claims, loading, hasData, date: routes.data?.date };
}

/** The number on the Alerts tab (0 = no badge). */
export function useAlertCount(): number {
  return useAlerts().needs.length;
}

/** The plan to review: route param `plan`, else the newest one awaiting approval. */
export function usePlan() {
  const param = useParam('plan');
  const plans = usePlans();
  const id = param ?? plans.data?.[0]?.id;
  const q = useQuery<Plan>(id ? `plan.${id}` : null, c => c.get<Plan>('Plans', id!));
  const plan = q.data ?? plans.data?.find(p => p.id === id) ?? null;
  return { ...q, id, plan, plans };
}

export type PlanChange = { title: string; meta: string; code?: string; warn?: boolean };

export type PlanView = {
  /** Orders served / total, when the plan says. */
  served?: number;
  total?: number;
  deferrals: number;
  shortM3?: number;
  trips?: number;
  rulesPassed?: number;
  rulesTotal?: number;
  explanation?: string;
  changes: PlanChange[];
  review: PlanChange[];
};

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : undefined);
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? (v.filter(x => x && typeof x === 'object') as Obj[]) : []);
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const fix1 = (v?: number) => (v === undefined ? undefined : Math.round(v * 10) / 10);

/** Reads Plan.summary / explanation (auto-plan: orders, chilled, suggestions; agent: plan, ruleChecks, deferrals, needsReview). */
export function readPlan(p: Plan | null): PlanView {
  const view: PlanView = { deferrals: 0, changes: [], review: [] };
  if (!p) return view;
  const sum = obj(p.summary) ?? {};
  // explanation: plain text, or the agent's {text, did, checked} as JSON
  let did: string[] = [];
  if (p.explanation) {
    try {
      const e = obj(JSON.parse(p.explanation));
      view.explanation = str(e?.text) ?? p.explanation;
      did = Array.isArray(e?.did) ? (e!.did as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    } catch {
      view.explanation = p.explanation;
    }
  }
  const orders = obj(sum.orders);
  if (orders) {
    view.total = n(orders.total);
    view.served = n(orders.planned);
    view.deferrals = n(orders.deferred) ?? 0;
  }
  const chilled = obj(sum.chilled);
  view.shortM3 = fix1(n(chilled?.shortM3));
  view.trips = n(sum.trips);
  const agentPlan = obj(sum.plan);
  const trips = arr(agentPlan?.trips);
  if (trips.length) {
    const assigned = trips.reduce((k, t) => k + (Array.isArray(t.orderIds) ? t.orderIds.length : 0), 0);
    const unassigned = arr(agentPlan?.unassigned).length;
    view.served = assigned;
    view.total = assigned + unassigned;
    view.trips = trips.length;
  }
  const checks = arr(sum.ruleChecks);
  if (checks.length) {
    view.rulesTotal = checks.length;
    view.rulesPassed = checks.filter(c => c.passed === true).length;
  }
  const suggestions = arr(sum.suggestions);
  const deferrals = arr(sum.deferrals).filter(d => d.suggested !== false);
  if (suggestions.length || deferrals.length) view.deferrals = Math.max(view.deferrals, suggestions.length + deferrals.length);

  // the change list: what the agent says it did, else the trips it drew, else the suggested deferrals
  if (did.length) view.changes = did.map(d => ({ title: d, meta: '' }));
  else if (trips.length)
    view.changes = trips.map(t => ({
      title: `${str(t.vehicleId) ?? 'Vehicle'} Trip ${n(t.tripNo) ?? ''}`.trim(),
      meta: [
        Array.isArray(t.orderIds) ? `${t.orderIds.length} orders` : undefined,
        n(t.m3) !== undefined ? `${fix1(n(t.m3))} m³` : undefined,
        str(t.district),
        n(t.minutes) !== undefined ? `${Math.round(n(t.minutes)!)} / 270 min` : undefined,
      ].filter(Boolean).join(' · '),
    }));
  for (const d of [...suggestions, ...deferrals]) {
    view.changes.push({
      title: `Defer ${str(d.orderId) ?? 'order'}`,
      meta: [str(d.reason) ? titleCase(str(d.reason)) : undefined, n(d.score) !== undefined ? `score ${n(d.score)}` : undefined, str(d.notes)].filter(Boolean).join(' · '),
      code: str(d.outletId),
      warn: true,
    });
  }
  view.review = arr(sum.needsReview).map(r => ({
    title: str(r.orderId) ?? 'Order',
    meta: [str(r.outletId), str(r.reason), n(r.score) !== undefined ? `score ${n(r.score)}` : undefined].filter(Boolean).join(' · ') || 'Needs your call',
  }));
  if (!view.review.length && orders && (n(orders.needsReview) ?? 0) > 0) {
    view.review = [{ title: `${n(orders.needsReview)} orders not yet planned`, meta: 'Open on desktop to place them' }];
  }
  return view;
}

/** Trip progress for the live list. */
export function tripProgress(t: Trip) {
  const stops = [...(t.stops ?? [])].sort((a, b) => a.stopSeq - b.stopSeq);
  const done = stops.filter(s => s.status === 'DELIVERED').length;
  const next = stops.find(s => s.status !== 'DELIVERED') ?? null;
  const risk = Math.max(0, ...stops.filter(s => s.status !== 'DELIVERED').map(s => s.lateRiskPct ?? 0));
  const exception = stops.some(s => s.status === 'EXCEPTION');
  return { stops, done, next, risk, exception };
}

// ---------------------------------------------------------------- DSP-32 plans (read-only on phone)

/** Depot names as the design writes them. */
export const DEPOT_NAME: Record<string, string> = { PELIYAGODA: 'Peliyagoda DC', KANDY: 'Kandy Hub' };
export const depotName = (d: string) => DEPOT_NAME[d] ?? titleCase(d);

/** CAP_REEFER → CAP-REEFER (the reason code as the design prints it). */
export const reasonCode = (r: string) => r.replace(/_/g, '-');

/** The 4:00 PM (Colombo) order cut-off for a run date: 16:00 on the day before. */
export function orderCutoff(runDate: string): number {
  return Date.parse(`${addDays(runDate, -1)}T16:00:00+05:30`);
}

export type RunningPlan = {
  depot: string;
  /** The plan in effect (newest approved / published version), if any. */
  plan: Plan | null;
  /** The first approved version of the day when a later one replaced it (a re-plan). */
  base: Plan | null;
  orders: number;
  vehicles: number;
  delivered: number;
};

export type MovedOrder = Deferral & { order?: Order; outlet?: Outlet };

/** Per depot: the plan in effect for the run day and how far its trips are. */
export function runningPlans(depots: string[], plans: Plan[], trips: Trip[]): RunningPlan[] {
  return depots.map(depot => {
    const approved = plans
      .filter(p => p.depot === depot && (p.status === 'APPROVED' || p.status === 'PUBLISHED' || (p.status === 'SUPERSEDED' && !!p.approvedAt)))
      .sort((a, b) => a.version - b.version);
    const live = approved.filter(p => p.status === 'APPROVED' || p.status === 'PUBLISHED');
    const plan = live.at(-1) ?? null;
    const first = approved[0] ?? null;
    const base = plan && first && first.version < plan.version ? first : null;
    const mine = trips.filter(t => t.depot === depot);
    const stops = mine.flatMap(t => t.stops ?? []);
    return {
      depot,
      plan,
      base,
      orders: stops.length,
      vehicles: new Set(mine.map(t => t.vehicleId)).size,
      delivered: stops.filter(s => s.status === 'DELIVERED').length,
    };
  });
}

/** Orders for a run date per depot (cancelled ones left out). */
export function queueByDepot(depots: string[], orders: Pick<Order, 'status' | 'outlet'>[]): { depot: string; orders: number }[] {
  return depots.map(depot => ({ depot, orders: orders.filter(o => o.status !== 'CANCELLED' && o.outlet?.depot === depot).length }));
}

/** Everything for DSP-32: the plans in effect on the run day, what moved off it, and the queue for the next run. */
export function usePlansBoard() {
  const claims = useClaims();
  const routes = useLiveRoutes();
  const date = routes.data?.date;
  const next = date ? addDays(date, 1) : undefined;
  const signedIn = !!claims;
  const plans = useQuery<Plan[]>(signedIn && date ? `plans.running.${date}` : null, c =>
    c.all<Plan>('Plans', { filter: `${dayFilter('runDate', date!)} and (status eq 'APPROVED' or status eq 'PUBLISHED' or status eq 'SUPERSEDED')`, orderby: 'depot,version' }), { persist: true });
  const moved = useQuery<MovedOrder[]>(signedIn && date ? `deferrals.moved.${date}` : null, async c => {
    const rows = await c.all<MovedOrder>('Deferrals', { filter: `${dayFilter('order/runDate', date!)} and (status eq 'CONFIRMED' or status eq 'SUGGESTED')`, expand: 'order', orderby: 'score' });
    const ids = [...new Set(rows.map(r => r.order?.outletId).filter((x): x is string => !!x))];
    const outlets = ids.length ? await c.all<Outlet>('Outlets', { filter: inList('id', ids), select: ['id', 'name', 'depot'] }) : [];
    const byId = new Map(outlets.map(o => [o.id, o]));
    return rows.map(r => ({ ...r, outlet: byId.get(r.order?.outletId ?? '') }));
  }, { persist: true });
  const queue = useQuery<Order[]>(signedIn && next ? `orders.queue.${next}` : null, c =>
    c.all<Order>('Orders', { filter: dayFilter('runDate', next!), select: ['id', 'outletId', 'status'], expand: 'outlet($select=id,depot)' }), { persist: true });

  const depots = useMemo(() => claims?.depots ?? [], [claims?.depots]);
  const running = useMemo(() => runningPlans(depots, plans.data ?? [], routes.data?.trips ?? []), [depots, plans.data, routes.data]);
  const nextQueue = useMemo(() => (queue.data ? queueByDepot(depots, queue.data) : null), [depots, queue.data]);
  return {
    signedIn,
    date,
    next,
    running,
    moved: moved.data ?? [],
    queue: nextQueue,
    loading: routes.loading || plans.loading,
    error: routes.error ?? plans.error,
    hasData: routes.data !== undefined,
  };
}
