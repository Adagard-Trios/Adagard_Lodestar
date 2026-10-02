// Store manager face (Lodestar Store): the order draft kept on the phone, the previous order as a
// template, cut-off times and small shaping helpers shared by the sm-* live screens.
import { useEffect, useMemo } from 'react';
import { kv } from '@/lib/kv';
import { lit } from '@/lib/odata';
import { Store, useStore } from '@/lib/store';
import { addDays, colomboDate, hm, isoDay } from '@/lib/time';
import type { QueueItem } from '@/offline/queue';
import type { NewOrderLine } from './api';
import { today, useClaims, useOutbox, useStoreDay } from './hooks';
import { session } from './platform';
import { useQuery } from './query';
import type { Notification, Order, OrderLineItem, POD, TempClass, Trip } from './types';

// ---------------------------------------------------------------- clock

const clock = new Store<number>(Date.now());
let ticking: ReturnType<typeof setInterval> | null = null;

/** The current time, refreshed every 30 s (count-downs to the cut-off). */
export function useNow(): number {
  useEffect(() => {
    clock.set(Date.now());
    ticking ??= setInterval(() => clock.set(Date.now()), 30_000);
  }, []);
  return useStore(clock);
}

// ---------------------------------------------------------------- cut-off

const CUTOFF_MIN = 16 * 60; // orders for a run date close 4:00 PM Colombo the day before
const OFFSET_MS = 330 * 60_000;

/** The instant of the cut-off for a run date (4:00 PM Colombo the day before). */
export function cutoffFor(runDate: string): number {
  return Date.parse(`${addDays(runDate, -1)}T00:00:00Z`) + CUTOFF_MIN * 60_000 - OFFSET_MS;
}

/** The earliest run date an order placed now can still make (tomorrow before 4:00 PM, else the day after). */
export function nextRunDate(now: number = Date.now()): string {
  const tomorrow = addDays(colomboDate(now), 1);
  return now < cutoffFor(tomorrow) ? tomorrow : addDays(tomorrow, 1);
}

/** "1 h 26 m" / "12 m" until `at`, or '' when past. */
export function left(at: number, now: number = Date.now()): string {
  const ms = at - now;
  if (!(ms > 0)) return '';
  const m = Math.ceil(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`;
}

// ---------------------------------------------------------------- draft

export type DraftLine = { name: string; qty: number; kgPerUnit: number; tempClass: TempClass; lastQty?: number };
export type Draft = { outletId: string; runDate: string; lines: DraftLine[]; notes?: string; savedAt: string; fromRunDate?: string };

const KEY = 'lodestar.store.draft.';
const LAST = 'lodestar.store.draft.last';

/** The draft of the user whose sub is `owner` (null = none). */
export const draftStore = new Store<{ owner: string | null; loaded: boolean; draft: Draft | null }>({ owner: null, loaded: false, draft: null });

let loading: Promise<void> | null = null;

/** Loads the draft of the signed-in user, or of the last user of this phone when signed out. */
async function loadDraft(sub: string | null) {
  const cur = draftStore.get();
  if (cur.loaded && (cur.owner === sub || (!sub && cur.owner))) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const owner = sub ?? (await kv.get(LAST).catch(() => null));
      const raw = owner ? await kv.get(KEY + owner).catch(() => null) : null;
      let draft: Draft | null = null;
      try {
        draft = raw ? (JSON.parse(raw) as Draft) : null;
      } catch {
        draft = null;
      }
      draftStore.set({ owner: owner ?? null, loaded: true, draft });
    } finally {
      loading = null;
    }
  })();
  return loading;
}

async function persist(owner: string, draft: Draft | null) {
  draftStore.set({ owner, loaded: true, draft });
  if (draft) {
    await kv.set(KEY + owner, JSON.stringify(draft)).catch(() => undefined);
    await kv.set(LAST, owner).catch(() => undefined);
  } else await kv.remove(KEY + owner).catch(() => undefined);
}

function owner(): string {
  const sub = session.claims?.sub;
  if (!sub) throw new Error('Sign in to save this');
  return sub;
}

/** Replace the draft (saved on the phone at once). */
export async function saveDraft(next: Omit<Draft, 'savedAt'>) {
  await persist(owner(), { ...next, savedAt: new Date().toISOString() });
}

export async function updateDraft(fn: (d: Draft) => Draft) {
  const d = draftStore.get().draft;
  if (!d) return;
  await saveDraft(fn(d));
}

export async function clearDraft() {
  await persist(owner(), null);
}

/** The phone's draft for the signed-in user (or the last user when signed out, e.g. session expired). */
export function useDraft() {
  const sub = useClaims()?.sub ?? null;
  const st = useStore(draftStore);
  useEffect(() => {
    void loadDraft(sub);
  }, [sub]);
  const mine = st.loaded && (!sub || st.owner === sub);
  return { draft: mine ? st.draft : null, loaded: mine };
}

export const lineKg = (l: Pick<DraftLine, 'qty' | 'kgPerUnit'>) => Math.round(l.qty * l.kgPerUnit * 10) / 10;

export type Totals = { lines: number; units: number; kg: number; m3: number };

export function totals(lines: DraftLine[]): Totals {
  const live = lines.filter(l => l.qty > 0);
  const kg = Math.round(live.reduce((n, l) => n + lineKg(l), 0) * 10) / 10;
  return { lines: live.length, units: live.reduce((n, l) => n + l.qty, 0), kg, m3: Math.round(kg * 0.004 * 10) / 10 };
}

export function byClass(lines: DraftLine[]) {
  return { dry: lines.filter(l => l.tempClass === 'AMBIENT'), chilled: lines.filter(l => l.tempClass === 'CHILLED') };
}

export function toOrderLines(lines: DraftLine[]): NewOrderLine[] {
  return lines.filter(l => l.qty > 0).map(l => ({ name: l.name, qty: l.qty, kg: lineKg(l), tempClass: l.tempClass }));
}

// ---------------------------------------------------------------- template (previous order)

export type Template = { runDate: string; orders: Order[]; lines: DraftLine[] };

/** The store's previous order day with its lines (every temperature class of that day). */
export function useTemplate() {
  const outletId = useClaims()?.outletId;
  return useQuery<Template>(
    outletId ? `store.template.${outletId}` : null,
    async c => {
      const res = await c.list<Order>('Orders', {
        filter: `outletId eq ${lit(outletId!)} and status ne 'CANCELLED'`,
        orderby: 'runDate desc,orderedAt desc',
        top: 6,
        expand: 'lineItems($select=id,orderId,name,qty,kg,tempClass)',
      });
      const runDate = isoDay(res.value[0]?.runDate);
      const orders = res.value.filter(o => isoDay(o.runDate) === runDate);
      const lines = orders.flatMap(o => (o.lineItems ?? []).map(fromLine));
      return { runDate, orders, lines };
    },
    { persist: true },
  );
}

function fromLine(l: OrderLineItem): DraftLine {
  return { name: l.name, qty: l.qty, kgPerUnit: l.qty > 0 ? Math.round((l.kg / l.qty) * 1000) / 1000 : l.kg, tempClass: l.tempClass, lastQty: l.qty };
}

/** The draft, created from the previous order the first time (and moved to the next open run date). */
export function useOrderDraft() {
  const claims = useClaims();
  const { draft, loaded } = useDraft();
  const tpl = useTemplate();
  const runDate = nextRunDate(useNow());
  useEffect(() => {
    if (!loaded || !claims?.outletId || !session.claims) return;
    if (!draft && tpl.data) {
      void saveDraft({ outletId: claims.outletId, runDate, lines: tpl.data.lines, fromRunDate: tpl.data.runDate || undefined });
    } else if (draft && draft.runDate < runDate) {
      void saveDraft({ ...draft, runDate });
    }
  }, [loaded, draft, tpl.data, claims?.outletId, runDate]);
  return { draft, loaded, template: tpl, runDate: draft?.runDate ?? runDate };
}

// ---------------------------------------------------------------- deliveries

/** Orders grouped by run date, newest first. */
export function groupByDay(orders: Order[]): { date: string; orders: Order[] }[] {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    const d = isoDay(o.runDate);
    map.set(d, [...(map.get(d) ?? []), o]);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([date, list]) => ({ date, orders: list }));
}

/** Today's delivery (orders for today's Colombo date), else the newest day that has orders. */
export function useDelivery() {
  const day = useStoreDay();
  const orders = useMemo(() => day.data?.orders ?? [], [day.data]);
  const groups = useMemo(() => groupByDay(orders), [orders]);
  const t = today();
  const pick = groups.find(g => g.date === t) ?? groups.find(g => g.date < t) ?? groups[0] ?? null;
  return { ...day, outlet: day.data?.outlet ?? null, orders, groups, delivery: pick, isToday: pick?.date === t };
}

/** The newest receipt write for an order on this phone. */
export function receiptFor(items: QueueItem[], orderId?: string): QueueItem | undefined {
  if (!orderId) return undefined;
  return items.filter(i => i.kind === 'RECEIPT' && i.ref === orderId && i.status !== 'rejected').at(-1);
}

export function useReceipts() {
  const { items } = useOutbox();
  return useMemo(() => items.filter(i => i.kind === 'RECEIPT' && i.status !== 'rejected'), [items]);
}

export const receiptState = (i?: QueueItem) => (!i ? '' : i.status === 'synced' ? 'Sent' : i.status === 'conflict' ? 'Needs a look' : 'Waiting to send');

/** The POD (driver's record) of an order, from the outlet's PODs. */
export function podFor(pods: POD[] | undefined, orderId?: string): POD | undefined {
  return orderId ? pods?.find(p => p.tripStop?.orderId === orderId) : undefined;
}

/** Units credited on a POD (ordered minus delivered, else the sum of exception quantities). */
export function creditedUnits(p: POD): number {
  const gap = Math.max(0, p.unitsOrdered - p.unitsDelivered);
  return gap || (p.exceptions ?? []).reduce((n, e) => n + (e.qty ?? 0), 0);
}

export const isCredit = (p: POD) => !!p.creditNoteId || !!p.exceptions?.length || p.unitsDelivered < p.unitsOrdered;

// ---------------------------------------------------------------- timeline

export const STEPS = [
  { status: 'RECEIVED', label: 'Received' },
  { status: 'PLANNED', label: 'Planned' },
  { status: 'LOADED', label: 'Loaded' },
  { status: 'ENROUTE', label: 'En route' },
  { status: 'DELIVERED', label: 'Delivered' },
] as const;

/** Index of the reached step for an order (-1 = none), and the time shown under each step. */
export function timeline(o?: Order | null): { reached: number; times: string[] } {
  if (!o) return { reached: -1, times: STEPS.map(() => '') };
  const st = o.tripStop;
  let reached = STEPS.findIndex(x => x.status === o.status);
  if (st?.leaveActual || st?.arrivalActual) reached = Math.max(reached, st.leaveActual ? 4 : 3);
  if (reached < 0) reached = o.status === 'EXCEPTION' ? 4 : 0;
  const times = [
    hm(o.orderedAt),
    '',
    '',
    '',
    st?.arrivalActual ? hm(st.arrivalActual) : st?.etaModel ? `~${hm(st.etaModel)}` : '',
  ];
  return { reached, times };
}

/** "AB" from a person's name. */
export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts.at(-1)![0] : '')).toUpperCase() : '—';
}

// ---------------------------------------------------------------- receipt issue (SM-18 → SM-03)

export type IssueKind = 'SHORT' | 'DAMAGED' | 'TEMPERATURE' | 'WRONG_ITEM';
export const ISSUE_LABEL: Record<IssueKind, string> = { SHORT: 'Short', DAMAGED: 'Damaged', TEMPERATURE: 'Temperature', WRONG_ITEM: 'Wrong item' };
/** An issue the store reported on one order while counting it (SM-18): credited when the receipt is confirmed. */
export type ReceiptIssue = { orderId: string; kind: IssueKind; units: number; note: string };

/** Issues saved on SM-18, by order id, until SM-03 confirms the receipt. */
export const receiptIssues = new Store<Record<string, ReceiptIssue>>({});

export function saveIssue(issue: ReceiptIssue) {
  receiptIssues.set(all => ({ ...all, [issue.orderId]: issue }));
}

export function clearIssues(orderIds: string[]) {
  receiptIssues.set(all => Object.fromEntries(Object.entries(all).filter(([id]) => !orderIds.includes(id))));
}

/** "Damaged · 1 unit: Tray torn" — the issue as it goes into the receipt note. */
export function issueText(i: ReceiptIssue): string {
  const note = i.note.trim();
  return `${ISSUE_LABEL[i.kind]} · ${i.units} unit${i.units === 1 ? '' : 's'}${note ? `: ${note}` : ''}`;
}

/** The receipt note of one order: the short count and the reported issue, if any. */
export function receiptNoteFor(units: number, counted: number, issue?: ReceiptIssue): string | undefined {
  const parts = [counted < units ? `${units - counted} short at receipt` : '', issue ? issueText(issue) : ''].filter(Boolean);
  return parts.join(' · ') || undefined;
}

// ---------------------------------------------------------------- degradation (P5: SM-A1 dead zone, SM-B1 reefer down)

type NoticeLike = { id: string; type: string; at: string; payload: Record<string, unknown> | null };
type PlanOrder = { orderId?: string; tripId?: string; etaModel?: string };

const planOrders = (p: Record<string, unknown> | null): PlanOrder[] => (Array.isArray(p?.orders) ? (p!.orders as PlanOrder[]) : []);

/**
 * PLAN_PUBLISHED notices that move an order which an earlier plan notice had already placed on another trip
 * (or at another time): a re-plan, e.g. after a vehicle fault at the depot (SM-B1).
 */
export function rePlanNoticeIds(list: NoticeLike[]): Set<string> {
  const plans = list.filter(m => m.type === 'PLAN_PUBLISHED').sort((a, b) => a.at.localeCompare(b.at));
  const seen = new Map<string, PlanOrder>();
  const out = new Set<string>();
  for (const m of plans) {
    for (const o of planOrders(m.payload)) {
      if (!o.orderId) continue;
      const before = seen.get(o.orderId);
      if (before && (before.tripId !== o.tripId || before.etaModel !== o.etaModel)) out.add(m.id);
      seen.set(o.orderId, o);
    }
  }
  return out;
}

export type RePlan = { noticeId: string; at: string; orderId: string; tripId?: string; etaModel?: string; previous?: PlanOrder; reason?: string };

/** The re-plan of `orderId` (or the newest re-plan) from the store's plan notices; the previous placement when known. */
export function rePlanFor(list: NoticeLike[], orderId?: string, noticeId?: string): RePlan | null {
  const ids = rePlanNoticeIds(list);
  const plans = list.filter(m => m.type === 'PLAN_PUBLISHED').sort((a, b) => a.at.localeCompare(b.at));
  const hit = [...plans].reverse().find(m => ids.has(m.id) && (!noticeId || m.id === noticeId) && (!orderId || planOrders(m.payload).some(o => o.orderId === orderId)));
  if (!hit) return null;
  const o = planOrders(hit.payload).find(x => !orderId || x.orderId === orderId);
  if (!o?.orderId) return null;
  const earlier = plans.slice(0, plans.indexOf(hit));
  const previous = earlier.flatMap(m => planOrders(m.payload)).filter(x => x.orderId === o.orderId).at(-1);
  const reason = typeof hit.payload?.reason === 'string' ? (hit.payload.reason as string) : undefined;
  return { noticeId: hit.id, at: hit.at, orderId: o.orderId, tripId: o.tripId, etaModel: o.etaModel, previous, reason };
}

export type SignalState = { lost: boolean; at: string; tripId?: string; vehicleId?: string; location?: string };

/**
 * The van's signal for the store's trips, from the live signal_lost / signal_back notices (the server sends
 * them only to stores still waiting on that trip). Keyed by trip id ('' when the notice names no trip).
 */
export function signalByTrip(list: { event: string; at: string; payload: Record<string, unknown> }[]): Map<string, SignalState> {
  const out = new Map<string, SignalState>();
  const events = list.filter(n => n.event === 'signal_lost' || n.event === 'signal_back').sort((a, b) => a.at.localeCompare(b.at));
  for (const n of events) {
    const p = n.payload ?? {};
    const tripId = typeof p.tripId === 'string' ? p.tripId : '';
    const location = [p.location, p.lastLocation, p.note].find((x): x is string => typeof x === 'string' && !!x);
    out.set(tripId, { lost: n.event === 'signal_lost', at: n.at, tripId: tripId || undefined, vehicleId: typeof p.vehicleId === 'string' ? p.vehicleId : undefined, location });
  }
  return out;
}

/** Whether the order's van is in a low-signal area now (its trip's latest notice is a loss). */
export function signalLostFor(map: Map<string, SignalState>, tripId?: string | null): SignalState | null {
  const s = (tripId ? map.get(tripId) : undefined) ?? map.get('');
  return s?.lost ? s : null;
}

// ---------------------------------------------------------------- order detail (SM-15)

/** The trip an order travels on (vehicle, bay, seal, reefer at release); store managers read their outlet's trips. */
export function useTrip(tripId?: string | null) {
  return useQuery<Trip>(tripId ? `trip.${tripId}` : null, c => c.get<Trip>('Trips', tripId!, { select: ['id', 'vehicleId', 'tripNumber', 'bay', 'depot', 'district', 'status', 'departTime', 'sealNumber', 'reeferTempC', 'runDate'] }), { persist: true });
}

export type StoreShortfall = { id: string; at: string; item: string; qtyOrdered?: number; qtyLoaded?: number; short?: number; reason?: string };

/** Shortfalls flagged at loading for an order (SHORTFALL_FLAGGED notices to the store). */
export function shortfallsFor(notes: Notification[] | undefined, orderId?: string): StoreShortfall[] {
  if (!orderId) return [];
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const seen = new Map<string, StoreShortfall>();
  for (const n of [...(notes ?? [])].sort((a, b) => a.sentAt.localeCompare(b.sentAt))) {
    const p = (n.payload ?? {}) as Record<string, unknown>;
    if (n.type !== 'SHORTFALL_FLAGGED' || p.orderId !== orderId || typeof p.item !== 'string') continue;
    const qtyOrdered = num(p.qtyOrdered);
    const qtyLoaded = num(p.qtyLoaded);
    const short = num(p.short) ?? (qtyOrdered !== undefined && qtyLoaded !== undefined ? qtyOrdered - qtyLoaded : undefined);
    seen.set(p.item, { id: n.id, at: n.sentAt, item: p.item, qtyOrdered, qtyLoaded, short, reason: typeof p.reason === 'string' ? p.reason : undefined });
  }
  return [...seen.values()];
}
