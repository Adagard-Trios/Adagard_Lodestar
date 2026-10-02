// LD-10 / LD-11 / LD-22: the load-sheet lines a loader has checked, by scan or by typed code. The checked set
// is the same per-trip set of ticks the load sheet (LD-02) keeps on the phone, so a line scanned here shows
// ticked there and counts for the release.
import { useTicks } from './dock';
import type { OrderLineItem } from './types';

const norm = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');
const digits = (v: string) => v.replace(/\D/g, '');

/**
 * The load-sheet line a scanned or typed code stands for. Lines carry no SKU or barcode field, so the code is
 * matched on the line id (as printed, or its digits), then on the item name.
 */
export function matchLine(lines: OrderLineItem[], code: string): OrderLineItem | undefined {
  const c = norm(code);
  if (!c) return undefined;
  const d = digits(code);
  return (
    lines.find(l => norm(l.id) === c) ??
    (d ? lines.find(l => digits(l.id) !== '' && digits(l.id) === d) : undefined) ??
    lines.find(l => norm(l.name) === c) ??
    (c.length >= 3 ? lines.find(l => norm(l.name).includes(c)) : undefined)
  );
}

/** The checked lines of a trip (kept on the phone) and a way to check one. */
export function useLineChecks(tripId: string | undefined) {
  const t = useTicks(tripId);
  return { isChecked: t.isTicked, check: t.tick, count: Object.keys(t.map).length };
}
