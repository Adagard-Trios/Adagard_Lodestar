/**
 * The demo delivery day (WP2): one over-capacity run with 100+ open orders across the three brands,
 * vehicles in the workshop, outlets already skipped yesterday, and no trips yet: planning starts here.
 *
 * - With the competition files in DATA_DIR (task2b_peak_day_scenarios.csv, task2b_peak_day_fleet.csv) the
 *   Peliyagoda orders and the workshop list come from the peak-day scenario S1. Without them a generated
 *   peak day of the same scale is used. Kandy always gets a generated order book that includes the
 *   personas' stores (OUT106, OUT108) so the four roles meet on one thread.
 * - The day is a date, not hard-coded: DEMO_DATE (YYYY-MM-DD) or, by default, today in Sri Lanka (the next
 *   operating day when today is closed). See prisma/DATA.md.
 * - Pure: no database access, deterministic for a given seed, so it is unit-tested.
 */
import { Brand, TempClass, VehicleStatus, VehicleType } from '@prisma/client';
import { CsvRecord, pick, readCsvRecords } from './csv';
import { parseBool, parseIntish, parseNumber, parseTempClass } from './normalize';
import { prng } from './synthetic';

export const PEAK_FILES = { orders: 'task2b_peak_day_scenarios.csv', fleet: 'task2b_peak_day_fleet.csv' } as const;
export const PEAK_SCENARIO = 'S1';
/** Vehicles that always run on the demo day (the driver persona's reefer van). */
export const ALWAYS_AVAILABLE = ['VEH057'];

export interface DemoOutlet { id: string; brand: Brand; depot: string; isActive?: boolean }
export interface DemoVehicle { id: string; depot: string; type: VehicleType; tempClass: TempClass; capacityM3?: number }

export interface DemoLine { name: string; qty: number; kg: number; tempClass: TempClass }
export interface DemoOrder {
  id: string;
  outletId: string;
  brand: Brand;
  tempClass: TempClass;
  units: number;
  kg: number;
  m3: number;
  deferredYesterday: boolean;
  daysSince: number;
  orderedAt: Date;
  lineItems: DemoLine[];
  source: 'csv' | 'synthetic';
}
export interface DemoDay {
  date: string;
  orders: DemoOrder[];
  workshop: { vehicleId: string; note: string }[];
  source: { peliyagoda: 'csv' | 'synthetic'; fleet: 'csv' | 'synthetic' };
  skipped: string[];
}

export interface PeakFiles { orders?: string | null; fleet?: string | null }

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
const pad = (n: number, w: number) => String(n).padStart(w, '0');

/** Today in Sri Lanka (UTC+05:30, no DST). */
export function colomboToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** The demo date: DEMO_DATE when set (validated), else today, moved to the next operating day if closed. */
export function resolveDemoDate(env: NodeJS.ProcessEnv, isOperating: (d: string) => boolean | null, now: Date = new Date()): string {
  const pinned = env.DEMO_DATE?.trim();
  if (pinned) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pinned) || Number.isNaN(Date.parse(`${pinned}T00:00:00Z`))) {
      throw new Error(`DEMO_DATE must be YYYY-MM-DD, got "${pinned}"`);
    }
    return pinned;
  }
  let d = colomboToday(now);
  for (let i = 0; i < 14 && isOperating(d) === false; i++) d = addDays(d, 1);
  return d;
}

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Deterministic order id for the demo day: ORD + yymmdd + 3 digits. */
export function demoOrderId(date: string, n: number): string {
  return `ORD${date.slice(2).replace(/-/g, '')}${pad(n, 3)}`;
}

/** The store places its order the afternoon before, before the 4:00 PM cut-off. */
function orderedAtFor(date: string, k: number): Date {
  const minutes = 9 * 60 + ((k * 37) % (6 * 60)); // 09:00–14:59 Colombo, the day before
  return new Date(Date.parse(`${addDays(date, -1)}T00:00:00Z`) + (minutes - 330) * 60_000);
}

/** Line items that add up to the order (an order is one temperature class). */
function linesFor(units: number, kg: number, tempClass: TempClass, brand: Brand, k: number): DemoLine[] {
  const names: Record<Brand, Record<TempClass, string[]>> = {
    FRESH: { CHILLED: ['Yoghurt 80 g', 'Fresh milk 1 L', 'Chicken 500 g', 'Cheese slices'], AMBIENT: ['Rice 5 kg', 'Dhal 1 kg', 'Biscuits', 'Tea 400 g'] },
    STYLE: { CHILLED: ['Chilled cosmetics'], AMBIENT: ['T-shirts', 'Sarongs', 'Footwear'] },
    TECH: { CHILLED: ['Batteries (cold store)'], AMBIENT: ['Phone accessories', 'Kettles', 'Bulbs'] },
  };
  const pool = names[brand][tempClass];
  const n = Math.min(pool.length, units >= 30 ? 3 : units >= 10 ? 2 : 1);
  const out: DemoLine[] = [];
  let leftU = units;
  let leftKg = kg;
  for (let i = 0; i < n; i++) {
    const last = i === n - 1;
    const qty = last ? leftU : Math.max(1, Math.floor(units / n));
    const lkg = last ? r1(leftKg) : r1((kg * qty) / units);
    out.push({ name: pool[(k + i) % pool.length], qty, kg: lkg, tempClass });
    leftU -= qty;
    leftKg -= lkg;
  }
  return out;
}

/** Peliyagoda orders from the peak-day scenario file (S1). Unknown outlets are skipped and reported. */
export function peakOrdersFromCsv(text: string, outlets: Map<string, DemoOutlet>): { rows: Omit<DemoOrder, 'id' | 'orderedAt' | 'lineItems'>[]; skipped: string[] } {
  const { records } = readCsvRecords(text);
  const rows: Omit<DemoOrder, 'id' | 'orderedAt' | 'lineItems'>[] = [];
  const skipped: string[] = [];
  for (const rec of records) {
    if ((pick(rec, ['scenario']) ?? '').trim() !== PEAK_SCENARIO) continue;
    const outletId = (pick(rec, ['outlet_id']) ?? '').trim();
    const outlet = outlets.get(outletId);
    const tempClass = parseTempClass(pick(rec, ['temp_requirement']));
    const units = parseIntish(pick(rec, ['order_units']));
    const kg = parseNumber(pick(rec, ['order_weight_kg']));
    const m3 = parseNumber(pick(rec, ['order_volume_m3']));
    const ref = pick(rec, ['order_ref']) ?? '?';
    if (!outlet) { skipped.push(`${ref}: outlet ${outletId || '(blank)'} not in the outlet data`); continue; }
    if (!tempClass || !units || kg === null || m3 === null) { skipped.push(`${ref}: missing temperature, units, weight or volume`); continue; }
    rows.push({
      outletId, brand: outlet.brand, tempClass, units, kg, m3,
      deferredYesterday: parseBool(pick(rec, ['deferred_yesterday'])) ?? false,
      daysSince: parseIntish(pick(rec, ['days_since_last_served'])) ?? 0,
      source: 'csv',
    });
  }
  return { rows, skipped };
}

/** Vehicles in the workshop on the peak day (fleet file S1). */
export function workshopFromCsv(text: string): string[] {
  const { records } = readCsvRecords(text);
  return records
    .filter((rec: CsvRecord) => (pick(rec, ['scenario']) ?? '').trim() === PEAK_SCENARIO && /workshop/i.test(pick(rec, ['status']) ?? ''))
    .map((rec: CsvRecord) => (pick(rec, ['vehicle_id']) ?? '').trim())
    .filter(Boolean);
}

/** A generated order for an outlet: Fresh splits into chilled and ambient, Style and Tech are ambient. */
function generatedOrders(r: () => number, outlet: DemoOutlet, chilledShare: number): Omit<DemoOrder, 'id' | 'orderedAt' | 'lineItems'>[] {
  const out: Omit<DemoOrder, 'id' | 'orderedAt' | 'lineItems'>[] = [];
  const add = (tempClass: TempClass) => {
    const units = 6 + Math.floor(r() * (tempClass === TempClass.CHILLED ? 70 : 40));
    const kgPerUnit = tempClass === TempClass.CHILLED ? 4 + r() * 3 : 2 + r() * 6;
    const kg = r1(units * kgPerUnit);
    const m3 = r2(kg / (tempClass === TempClass.CHILLED ? 190 : 230));
    out.push({ outletId: outlet.id, brand: outlet.brand, tempClass, units, kg, m3, deferredYesterday: false, daysSince: 1, source: 'synthetic' });
  };
  if (outlet.brand === Brand.FRESH) {
    if (r() < chilledShare) add(TempClass.CHILLED);
    add(TempClass.AMBIENT);
  } else {
    add(TempClass.AMBIENT);
  }
  return out;
}

export interface BuildOptions {
  date: string;
  seed: number;
  outlets: DemoOutlet[];
  vehicles: DemoVehicle[];
  peak?: PeakFiles;
}

/** The whole demo day. */
export function buildDemoDay(opts: BuildOptions): DemoDay {
  const r = prng(opts.seed ^ 0x7007);
  const active = opts.outlets.filter((o) => o.isActive !== false).sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map(active.map((o) => [o.id, o]));
  const skipped: string[] = [];

  // Peliyagoda: the peak-day scenario, else ~85 generated orders, chilled-heavy so reefer space runs out.
  let peli: Omit<DemoOrder, 'id' | 'orderedAt' | 'lineItems'>[] = [];
  let peliSource: 'csv' | 'synthetic' = 'synthetic';
  if (opts.peak?.orders) {
    const parsed = peakOrdersFromCsv(opts.peak.orders, byId);
    skipped.push(...parsed.skipped);
    if (parsed.rows.length) { peli = parsed.rows; peliSource = 'csv'; }
  }
  if (!peli.length) {
    for (const o of active.filter((x) => x.depot === 'PELIYAGODA')) {
      if (peli.length >= 85) break;
      peli.push(...generatedOrders(r, o, 0.9).slice(0, 85 - peli.length));
    }
    // ten outlets were skipped yesterday: protected today
    for (let i = 0; i < peli.length && i < 10; i++) {
      const o = peli[(i * 7) % peli.length];
      o.deferredYesterday = true;
      o.daysSince = 2;
    }
  }

  // Kandy: the personas' stores first (OUT106 chilled + ambient, OUT108), then the rest of the depot.
  const kandy: Omit<DemoOrder, 'id' | 'orderedAt' | 'lineItems'>[] = [];
  const persona = (id: string, tempClass: TempClass, units: number, kg: number, m3: number, deferredYesterday = false) => {
    const o = byId.get(id);
    if (o) kandy.push({ outletId: id, brand: o.brand, tempClass, units, kg, m3, deferredYesterday, daysSince: deferredYesterday ? 2 : 1, source: 'synthetic' });
  };
  persona('OUT106', TempClass.CHILLED, 34, 152, 0.8);
  persona('OUT106', TempClass.AMBIENT, 58, 260, 1.1);
  persona('OUT108', TempClass.CHILLED, 22, 96, 0.5, true); // skipped yesterday: protected
  for (const o of active.filter((x) => x.depot === 'KANDY' && !['OUT106', 'OUT108'].includes(x.id))) {
    if (kandy.length >= 26) break;
    kandy.push(...generatedOrders(r, o, 0.4).slice(0, 26 - kandy.length));
  }

  const all = [...kandy, ...peli];
  const orders: DemoOrder[] = all.map((o, i) => ({
    ...o,
    id: demoOrderId(opts.date, i + 1),
    orderedAt: orderedAtFor(opts.date, i),
    lineItems: linesFor(o.units, o.kg, o.tempClass, o.brand, i),
  }));

  // Workshop: the fleet file's S1 list, else a generated one (reefers first, so chilled capacity is short).
  let workshopIds: string[] = [];
  let fleetSource: 'csv' | 'synthetic' = 'synthetic';
  const fleetIds = new Set(opts.vehicles.map((v) => v.id));
  if (opts.peak?.fleet) {
    workshopIds = workshopFromCsv(opts.peak.fleet).filter((id) => fleetIds.has(id));
    if (workshopIds.length) fleetSource = 'csv';
  }
  if (!workshopIds.length) {
    const peliFleet = opts.vehicles.filter((v) => v.depot === 'PELIYAGODA').sort((a, b) => a.id.localeCompare(b.id));
    // the big reefers are in the workshop and two small ones run: the chilled orders cannot all go
    const reefers = peliFleet.filter((v) => v.tempClass === TempClass.CHILLED).sort((a, b) => (b.capacityM3 ?? 0) - (a.capacityM3 ?? 0) || a.id.localeCompare(b.id));
    const dry = peliFleet.filter((v) => v.tempClass !== TempClass.CHILLED);
    const down = reefers.slice(0, Math.max(0, reefers.length - 2));
    workshopIds = [...down, ...dry.slice(0, Math.max(0, 10 - down.length))].map((v) => v.id).slice(0, 10);
  }
  workshopIds = workshopIds.filter((id) => !ALWAYS_AVAILABLE.includes(id));
  const notes = ['Reefer compressor failure', 'Gearbox repair', 'Brake service', 'Tyre replacement', 'Electrical fault'];
  const workshop = workshopIds.map((vehicleId, i) => ({ vehicleId, note: `${notes[i % notes.length]}, back after this run` }));

  return { date: opts.date, orders, workshop, source: { peliyagoda: peliSource, fleet: fleetSource }, skipped };
}

/** Status for each vehicle on the demo day. */
export function vehicleStatusFor(day: DemoDay, vehicleId: string): { status: VehicleStatus; workshopNote: string | null } {
  const w = day.workshop.find((x) => x.vehicleId === vehicleId);
  return w ? { status: VehicleStatus.WORKSHOP, workshopNote: w.note } : { status: VehicleStatus.AVAILABLE, workshopNote: null };
}
