'use client';
// Shared by the store desk screens (SM-01, SM-02, SM-27, SM-28, SM-29): the realtime events the store:<outlet>
// room carries, the next run still open for orders (4:00 PM cut-off and the operating Calendar), the text of a
// notice, and the credit of an order (the store's short count or the driver's POD).
import { useEffect, useMemo, useState } from 'react';
import { addDays, fmtRunDate } from '@/lib/format';
import { useQuery } from '@/lib/odata/hooks';
import type { Notification, Order, POD } from '@/lib/odata/types';
import { colomboDay, cutoffFor } from '@/lib/workday';

/**
 * Everything the server sends a store (backend notifications gateway, trips and planning services): a notice to
 * the user, ETA changes and arrivals, a credit note, the van's signal, a trip leaving the depot, a plan in effect.
 */
export const STORE_EVENTS = ['notification', 'eta_update', 'credit_note_issued', 'signal_lost', 'signal_back', 'trip_released', 'plan_published'];

/** How far ahead the Calendar is read for closed days (the server looks as far). */
const CALENDAR_HORIZON = 14;

/** The current time, refreshed every 30 s (count-downs to the cut-off). */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

/** `day`, or the first day after it that the Calendar does not mark closed (a silent calendar runs). */
export function nextOpenDay(day: string, closed: ReadonlySet<string>): string {
  for (let i = 0; i < CALENDAR_HORIZON; i++) {
    const d = addDays(day, i);
    if (!closed.has(d)) return d;
  }
  return day;
}

/** The first run an order placed at `now` can still make: tomorrow before its cut-off, else the day after; never a closed day. */
export function nextRunFor(now: number, closed: ReadonlySet<string>): string {
  const tomorrow = addDays(colomboDay(new Date(now)), 1);
  return nextOpenDay(now < cutoffFor(tomorrow).getTime() ? tomorrow : addDays(tomorrow, 1), closed);
}

const NO_DAYS: ReadonlySet<string> = new Set();

/** The days the operating Calendar marks closed (isOperating = false) from today on, as YYYY-MM-DD. */
export function useClosedDays(): ReadonlySet<string> {
  const from = colomboDay();
  const q = useQuery<string[]>(`store-closed:${from}`, async c => {
    const rows = await c.list<{ date: string }>('Calendar', {
      filter: `isOperating eq false and date ge ${from}T00:00:00Z and date lt ${addDays(from, CALENDAR_HORIZON + 2)}T00:00:00Z`,
      select: 'date',
      top: 60,
    });
    return rows.value.map(r => String(r.date).slice(0, 10));
  });
  const days = q.data;
  return useMemo(() => (days?.length ? new Set(days) : NO_DAYS), [days]);
}

/**
 * The next run still open for orders and its cut-off, kept current as the clock passes 4:00 PM. `closed` is the
 * Calendar's closed days (a closed day is never offered: the next operating day is).
 */
export function useNextRun() {
  const now = useNow();
  const closed = useClosedDays();
  const runDate = nextRunFor(now, closed);
  const cutoff = cutoffFor(runDate).getTime();
  return { runDate, cutoff, now, msLeft: cutoff - now, closed, label: fmtRunDate(runDate) };
}

/** "3 h 12 m" until the cut-off, or '' when it has passed. */
export function leftText(msLeft: number): string {
  if (!(msLeft > 0)) return '';
  const m = Math.ceil(msLeft / 60_000);
  return `${Math.floor(m / 60)} h ${m % 60} m`;
}

const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

/** The words of a notice: its own title or message, else a line built from what it carries. */
export function noticeText(n: Pick<Notification, 'type' | 'payload'>): string {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  const own = str(p.title) || str(p.message) || str(p.description) || str(p.note);
  if (own) return own;
  const orders = Array.isArray(p.orders) ? p.orders.length : 0;
  switch (n.type) {
    case 'PLAN_PUBLISHED':
      return `Plan for ${p.runDate ? fmtRunDate(str(p.runDate)) : 'your next delivery'} is in effect${orders ? `: ${orders} of your orders planned` : ''}`;
    case 'ORDER_DEFERRED':
      return `Order ${str(p.orderId)} moved${p.rescheduledDate ? ` to ${fmtRunDate(str(p.rescheduledDate))}` : ''}${p.reason ? ` · ${str(p.reason)}` : ''}`;
    case 'CREDIT_NOTE_ISSUED':
      return `Credit note ${str(p.creditNoteId)}${p.orderId ? ` on ${str(p.orderId)}` : ''}`;
    default:
      return [str(p.orderId) && `Order ${str(p.orderId)}`, str(p.creditNoteId) && `Credit note ${str(p.creditNoteId)}`, str(p.reason)].filter(Boolean).join(' · ');
  }
}

/** Units credited on a POD: ordered minus delivered, else the units of its exceptions (driver `qty`, store `unitsShort`). */
export function podCredit(p: POD): number {
  const gap = Math.max(0, p.unitsOrdered - p.unitsDelivered);
  if (gap) return gap;
  const ex = Array.isArray(p.exceptions) ? p.exceptions : [];
  return ex.reduce<number>((n, e) => n + (typeof e === 'object' && e ? Number((e as { qty?: number; unitsShort?: number }).qty ?? (e as { unitsShort?: number }).unitsShort ?? 0) : 0), 0);
}

/** The store's own count is on the order (Orders('…')/Lodestar.ConfirmReceipt). */
export const isCounted = (o: Pick<Order, 'unitsReceived'> | null | undefined) => o?.unitsReceived !== null && o?.unitsReceived !== undefined;

/**
 * The credit of one order: the credit note on the order (raised when the store's count is short, even before the
 * driver's POD exists) or on its POD, and the units credited (the store's shortfall or the POD's, the larger).
 */
export function orderCredit(o: Order | null | undefined, p: POD | null | undefined): { creditNoteId: string | null; units: number } {
  const counted = o && isCounted(o) ? Math.max(0, (o.unitsExpected ?? o.units) - (o.unitsReceived ?? 0)) : 0;
  const driver = p ? podCredit(p) : 0;
  const creditNoteId = o?.creditNoteId ?? p?.creditNoteId ?? null;
  return { creditNoteId, units: creditNoteId || counted ? Math.max(counted, driver) : 0 };
}
