/**
 * Value normalisers for reference CSV cells.
 *
 * Each returns the normalised value, or `null` for blank input, or throws a
 * ValueError for a value it does not understand. Row mappers turn a
 * ValueError into a skipped row with a reason (see mappers.ts).
 */

import { Brand, Depot, DockType, ParkingType, TempClass, VehicleType } from '@prisma/client';

export class ValueError extends Error {}

/** Lowercase token with spaces / dashes collapsed to underscores. */
export function token(v: string): string {
  return v.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function isBlank(v: string | undefined | null): boolean {
  return v === undefined || v === null || v.trim() === '' || /^(null|n\/a|na|none|-)$/i.test(v.trim());
}

/** 1/0, true/false, yes/no, y/n, t/f. Blank -> null. */
export function parseBool(v: string | undefined): boolean | null {
  if (isBlank(v)) return null;
  const t = token(v);
  if (['1', 'true', 'yes', 'y', 't'].includes(t)) return true;
  if (['0', 'false', 'no', 'n', 'f'].includes(t)) return false;
  throw new ValueError(`not a boolean: "${v}"`);
}

export function parseNumber(v: string | undefined): number | null {
  if (isBlank(v)) return null;
  const n = Number(v.trim().replace(/,/g, ''));
  if (!Number.isFinite(n)) throw new ValueError(`not a number: "${v}"`);
  return n;
}

/** Numbers stored in Int columns are rounded (CSV minutes may carry decimals). */
export function parseIntish(v: string | undefined): number | null {
  const n = parseNumber(v);
  return n === null ? null : Math.round(n);
}

/** "5:30", "05:30", "05:30:00", "0530" -> "05:30". */
export function parseTime(v: string | undefined): string | null {
  if (isBlank(v)) return null;
  const s = v.trim();
  let m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s);
  if (!m) m = /^(\d{2})(\d{2})$/.exec(s);
  if (!m) throw new ValueError(`not a time: "${v}"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) throw new ValueError(`not a time: "${v}"`);
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** ISO "YYYY-MM-DD" (optionally with a time part) or "YYYY/MM/DD" -> UTC midnight. */
export function parseDate(v: string | undefined): Date | null {
  if (isBlank(v)) return null;
  const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(v.trim());
  if (!m) throw new ValueError(`not a date: "${v}"`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (d.getUTCMonth() !== Number(m[2]) - 1) throw new ValueError(`not a date: "${v}"`);
  return d;
}

/** Blank -> null, otherwise the trimmed string. */
export function parseText(v: string | undefined): string | null {
  return isBlank(v) ? null : v.trim();
}

// ── Enums ─────────────────────────────────────────────────────────────────

export function parseDepot(v: string | undefined): Depot | null {
  if (isBlank(v)) return null;
  const t = token(v);
  // Accept "Peliyagoda", "PELIYAGODA", "Peliyagoda DC", "Kandy Hub" ...
  if (t.includes('peliyagoda')) return Depot.PELIYAGODA;
  if (t.includes('kandy')) return Depot.KANDY;
  throw new ValueError(`unknown depot: "${v}"`);
}

export function parseBrand(v: string | undefined): Brand | null {
  if (isBlank(v)) return null;
  const t = token(v).replace(/^waypoint_/, '');
  if (t === 'fresh') return Brand.FRESH;
  if (t === 'style') return Brand.STYLE;
  if (t === 'tech') return Brand.TECH;
  throw new ValueError(`unknown brand: "${v}"`);
}

export function parseDockType(v: string | undefined): DockType | null {
  if (isBlank(v)) return null;
  const t = token(v);
  if (t === 'rear_dock' || t === 'rear') return DockType.REAR_DOCK;
  if (t === 'mall_bay' || t === 'mall') return DockType.MALL_BAY;
  if (t === 'street' || t === 'kerb' || t === 'curb') return DockType.STREET;
  throw new ValueError(`unknown dock type: "${v}"`);
}

/** Parking constraint; blank means no constraint (NORMAL). */
export function parseParking(v: string | undefined): ParkingType {
  if (isBlank(v)) return ParkingType.NORMAL;
  const t = token(v);
  if (t === 'normal' || t === 'none') return ParkingType.NORMAL;
  if (t === 'van_only') return ParkingType.VAN_ONLY;
  if (t === 'mall_dock') return ParkingType.MALL_DOCK;
  throw new ValueError(`unknown parking constraint: "${v}"`);
}

export function parseVehicleType(v: string | undefined): VehicleType | null {
  if (isBlank(v)) return null;
  const t = token(v);
  if (t === 'truck' || t === 'lorry') return VehicleType.TRUCK;
  if (t === 'van') return VehicleType.VAN;
  throw new ValueError(`unknown vehicle type: "${v}"`);
}

/** reefer / chilled -> CHILLED; dry / ambient -> AMBIENT. */
export function parseTempClass(v: string | undefined): TempClass | null {
  if (isBlank(v)) return null;
  const t = token(v);
  if (['reefer', 'chilled', 'chiller', 'cold', 'refrigerated'].includes(t)) return TempClass.CHILLED;
  if (['dry', 'ambient'].includes(t)) return TempClass.AMBIENT;
  throw new ValueError(`unknown temperature class: "${v}"`);
}
