'use client';
// The store's order draft (SM-01 Place order, SM-36 Service unavailable): the dry and chilled lines being edited,
// kept in this browser tab (sessionStorage) as the store types, so nothing is lost when the server stops answering.
// SM-36 sends it the moment the server answers again. Each temperature class becomes one POST /Orders; a class
// already sent is remembered, so a retry after a partial failure never sends it twice.
import type { ODataClient } from '@/lib/odata/client';
import type { Brand, Order, TempClass } from '@/lib/odata/types';

export interface DraftLine {
  key: string;
  name: string;
  last: number;
  qty: number;
  /** kg per unit */
  unitKg: number;
}

export interface OrderDraft {
  outletId: string;
  brand: Brand;
  /** YYYY-MM-DD */
  runDate: string;
  dry: DraftLine[];
  chilled: DraftLine[];
  /** m³ per kg, from the outlet's past orders. */
  ratio: number;
  savedAt: number;
  /** Order ids already created, per temperature class. */
  sent?: Partial<Record<TempClass, string>>;
}

const PREFIX = 'lodestar.orderDraft.';
const store = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export function saveOrderDraft(d: OrderDraft) {
  try {
    store()?.setItem(PREFIX + d.outletId, JSON.stringify(d));
  } catch {
    // storage full or blocked: the draft lasts as long as the page
  }
}

export function loadOrderDraft(outletId: string | null | undefined): OrderDraft | null {
  if (!outletId) return null;
  try {
    const raw = store()?.getItem(PREFIX + outletId);
    const d = raw ? (JSON.parse(raw) as OrderDraft) : null;
    return d && Array.isArray(d.dry) && Array.isArray(d.chilled) && typeof d.runDate === 'string' ? d : null;
  } catch {
    return null;
  }
}

/** The draft of whichever outlet this tab worked for (SM-36 can open before the session is known). */
export function loadAnyOrderDraft(): OrderDraft | null {
  const s = store();
  if (!s) return null;
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(PREFIX)) return loadOrderDraft(k.slice(PREFIX.length));
  }
  return null;
}

export function clearOrderDraft(outletId: string | null | undefined) {
  if (!outletId) return;
  try {
    store()?.removeItem(PREFIX + outletId);
  } catch {
    // nothing to clear
  }
}

export const lineTotals = (lines: DraftLine[]) => ({
  units: lines.reduce((s, l) => s + l.qty, 0),
  kg: Math.round(lines.reduce((s, l) => s + l.qty * l.unitKg, 0) * 10) / 10,
  lines: lines.filter(l => l.qty > 0).length,
});

/** Does the draft still have anything to send? */
export const hasUnsent = (d: OrderDraft | null) =>
  Boolean(d && ((!d.sent?.AMBIENT && lineTotals(d.dry).units > 0) || (!d.sent?.CHILLED && lineTotals(d.chilled).units > 0)));

/**
 * Sends the draft: one POST /Orders per temperature class with a quantity, for the outlet in the token (the API
 * refuses any other). `onSent` is told after each class, so a later failure keeps what already went through.
 */
export async function sendOrderDraft(c: ODataClient, d: OrderDraft, onSent?: (tempClass: TempClass, order: Order) => void): Promise<Order[]> {
  const created: Order[] = [];
  for (const [tempClass, lines] of [['AMBIENT', d.dry], ['CHILLED', d.chilled]] as Array<[TempClass, DraftLine[]]>) {
    if (d.sent?.[tempClass]) continue;
    const items = lines.filter(l => l.qty > 0);
    if (!items.length) continue;
    const kg = Math.round(items.reduce((s, l) => s + l.qty * l.unitKg, 0) * 10) / 10;
    const order = await c.create<Order>('Orders', {
      outletId: d.outletId,
      runDate: `${d.runDate}T00:00:00.000Z`,
      brand: d.brand,
      tempClass,
      units: items.reduce((s, l) => s + l.qty, 0),
      kg,
      m3: Math.round(kg * d.ratio * 100) / 100,
      lineItems: items.map(l => ({ name: l.name, qty: l.qty, kg: Math.round(l.qty * l.unitKg * 10) / 10, tempClass })),
    });
    created.push(order);
    onSent?.(tempClass, order);
  }
  return created;
}

/** A failure that means "the server is not there" (as opposed to a refusal the store must act on). */
export const isUnreachable = (e: { status?: number; code?: string } | undefined) =>
  Boolean(e && ((e.status === 0 && e.code === 'NetworkError') || (e.status !== undefined && e.status >= 500)));
