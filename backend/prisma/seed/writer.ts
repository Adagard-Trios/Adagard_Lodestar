/**
 * Writes reference data with idempotent upserts.
 *
 * Re-running refreshes every CSV-derived column (so new CSVs replace old
 * values) but never touches operational / overlay columns that the scenario
 * or the running system owns: Calendar.note, Outlet.accessNote,
 * Vehicle.status / workshopNote / usedLThisWeek. Those are only set on create.
 */

import type { ReferenceData } from './synthetic';

/** The one delegate method the writer needs. PrismaClient satisfies it. */
export interface UpsertDelegate {
  upsert(args: { where: any; create: any; update: any }): Promise<unknown>;
}

/** Minimal PrismaClient shape for writing reference tables. */
export interface ReferenceDb {
  districtTravel: UpsertDelegate;
  serviceAllowance: UpsertDelegate;
  calendar: UpsertDelegate;
  outlet: UpsertDelegate;
  vehicle: UpsertDelegate;
}

/** Columns that belong to the scenario / live system, never refreshed from reference data. */
const CREATE_ONLY: Record<keyof ReferenceDb, readonly string[]> = {
  districtTravel: [],
  serviceAllowance: [],
  calendar: ['note'],
  outlet: ['accessNote'],
  vehicle: ['status', 'workshopNote', 'usedLThisWeek'],
};

/** Upserts per round trip; keeps the connection pool busy without flooding it. */
export const CHUNK = 50;

export function omit<T extends object>(obj: T, keys: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (!keys.includes(k)) out[k] = v;
  return out as Partial<T>;
}

/** Build the upsert argument for one row. Exported for tests. */
export function upsertArgs(table: keyof ReferenceDb, row: Record<string, any>) {
  const where =
    table === 'districtTravel' ? { district: row.district }
    : table === 'serviceAllowance' ? { brand_dockType: { brand: row.brand, dockType: row.dockType } }
    : table === 'calendar' ? { date: row.date }
    : { id: row.id };
  const keyCols = Object.keys(table === 'serviceAllowance' ? where.brand_dockType : where);
  return {
    where,
    create: row,
    update: omit(row, [...keyCols, ...CREATE_ONLY[table]]),
  };
}

async function upsertAll(delegate: UpsertDelegate, table: keyof ReferenceDb, rows: readonly object[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await Promise.all(rows.slice(i, i + CHUNK).map((row) => delegate.upsert(upsertArgs(table, row))));
  }
  return rows.length;
}

/**
 * Write all reference tables. Order matters only for readability here:
 * reference tables have no foreign keys between them.
 */
export async function writeReference(db: ReferenceDb, data: ReferenceData): Promise<Record<string, number>> {
  return {
    districts: await upsertAll(db.districtTravel, 'districtTravel', data.districts),
    allowances: await upsertAll(db.serviceAllowance, 'serviceAllowance', data.allowances),
    calendar: await upsertAll(db.calendar, 'calendar', data.calendar),
    outlets: await upsertAll(db.outlet, 'outlet', data.outlets),
    vehicles: await upsertAll(db.vehicle, 'vehicle', data.vehicles),
  };
}
