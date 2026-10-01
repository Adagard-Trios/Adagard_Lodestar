/**
 * Synthetic reference data, used when a competition CSV is not available.
 *
 * Everything here is GENERATED from a seeded PRNG (never Math.random), so the
 * same seed always yields the same rows. Rows are tagged so nobody mistakes
 * them for the real dataset: outlet names start with "Synthetic", outlet
 * address and calendar note are "synthetic". (District, allowance and vehicle
 * rows have no free-text column; the seed summary reports their source.)
 *
 * District names are real Sri Lankan places (geography is not dataset data);
 * all minutes, distances, windows, capacities and calendar flags are made up.
 */

import { Brand, Depot, DockType, ParkingType, TempClass, VehicleType } from '@prisma/client';
import type { AllowanceRow, CalendarRow, DistrictRow, OutletRow, VehicleRow } from './mappers';
import { OUTLET_ANCHORS, VEHICLE_ANCHORS } from '../scenario';

export const SYNTHETIC_TAG = 'synthetic';
export const DEFAULT_SYNTHETIC_SEED = 20260407;
export const SYNTHETIC_CALENDAR_FROM = '2026-03-30';
export const SYNTHETIC_CALENDAR_TO = '2026-06-30';

/** mulberry32: tiny deterministic PRNG returning floats in [0, 1). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const round1 = (n: number) => Math.round(n * 10) / 10;
const choose = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const hhmm = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/** Districts served by each depot in synthetic mode (place names only). */
export const SYNTHETIC_DISTRICTS: ReadonlyArray<{ district: string; depot: Depot }> = [
  { district: 'Colombo', depot: Depot.PELIYAGODA },
  { district: 'Gampaha', depot: Depot.PELIYAGODA },
  { district: 'Kalutara', depot: Depot.PELIYAGODA },
  { district: 'Galle', depot: Depot.PELIYAGODA },
  { district: 'Kurunegala', depot: Depot.PELIYAGODA },
  { district: 'Puttalam', depot: Depot.PELIYAGODA },
  { district: 'Kandy', depot: Depot.KANDY },
  { district: 'Matale', depot: Depot.KANDY },
  { district: 'Nuwara Eliya', depot: Depot.KANDY },
  { district: 'Badulla', depot: Depot.KANDY },
  { district: 'Kegalle', depot: Depot.KANDY },
  { district: 'Ratnapura', depot: Depot.KANDY },
];

const ROAD_CLASSES = ['urban', 'suburban', 'highway', 'hill'] as const;

/** One generated DistrictTravel row (also used to fill gaps in CSV mode). */
export function syntheticDistrict(r: Rng, district: string, depot: Depot): DistrictRow {
  const roadClass = choose(r, ROAD_CLASSES);
  const distKm = int(r, 8, 160);
  // Generated free-flow speed per road class; minutes follow from distance.
  const kmh = { urban: 25, suburban: 35, highway: 55, hill: 28 }[roadClass] + int(r, -4, 4);
  return {
    district,
    depot,
    roadClass,
    distKm,
    depotToDistMin: Math.max(10, Math.round((distKm / kmh) * 60)),
    interStopMin: int(r, 6, 22),
  };
}

export interface SyntheticOptions {
  seed?: number;
  outletCount?: number;
  vehicleCount?: number;
  /** Districts to place synthetic outlets in (defaults to SYNTHETIC_DISTRICTS). */
  districts?: ReadonlyArray<{ district: string; depot: Depot }>;
}

export interface ReferenceData {
  districts: DistrictRow[];
  allowances: AllowanceRow[];
  calendar: CalendarRow[];
  outlets: OutletRow[];
  vehicles: VehicleRow[];
}

export function syntheticDistricts(seed: number): DistrictRow[] {
  const r = prng(seed ^ 0x1001);
  return SYNTHETIC_DISTRICTS.map((d) => syntheticDistrict(r, d.district, d.depot));
}

export function syntheticAllowances(seed: number): AllowanceRow[] {
  const r = prng(seed ^ 0x2002);
  const rows: AllowanceRow[] = [];
  for (const brand of Object.values(Brand)) {
    for (const dockType of Object.values(DockType)) {
      const base = dockType === DockType.MALL_BAY ? 25 : dockType === DockType.STREET ? 15 : 12;
      rows.push({ brand, dockType, minutes: base + int(r, 0, 15) });
    }
  }
  return rows;
}

/** Calendar with Sundays closed, a generated payday, festival ramp and monsoon band. */
export function syntheticCalendar(
  seed: number,
  from = SYNTHETIC_CALENDAR_FROM,
  to = SYNTHETIC_CALENDAR_TO,
): CalendarRow[] {
  const r = prng(seed ^ 0x3003);
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const festivalDay = int(r, 10, days - 10); // index of the generated festival
  const monsoonFrom = int(r, 0, Math.floor(days / 3));
  const monsoonTo = monsoonFrom + int(r, 21, 42);
  const paydayDom = int(r, 24, 28);

  const rows: CalendarRow[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86400000);
    const toFestival = festivalDay - i;
    // Ramp climbs over the week before the festival and fades two days after.
    const festivalRamp =
      toFestival >= 0 && toFestival <= 7 ? round1(1 - toFestival / 8)
      : toFestival < 0 && toFestival >= -2 ? round1(0.3 / -toFestival)
      : 0;
    rows.push({
      date,
      isOperating: date.getUTCDay() !== 0 && toFestival !== 0,
      isPayday: date.getUTCDate() === paydayDom,
      festivalRamp,
      monsoon: i >= monsoonFrom && i <= monsoonTo ? 1 : 0,
      festivalName: toFestival === 0 ? 'Synthetic festival' : null,
      note: SYNTHETIC_TAG,
    });
  }
  return rows;
}

const BRAND_LABEL: Record<Brand, string> = { FRESH: 'Fresh', STYLE: 'Style', TECH: 'Tech' };

export function syntheticOutlets(
  seed: number,
  count = 30,
  districts: ReadonlyArray<{ district: string; depot: Depot }> = SYNTHETIC_DISTRICTS,
): OutletRow[] {
  const r = prng(seed ^ 0x4004);
  const reserved = new Set(OUTLET_ANCHORS.map((o) => o.id));
  const rows: OutletRow[] = [];
  let n = 0;
  while (rows.length < count) {
    n++;
    const id = `OUT${String(n).padStart(3, '0')}`;
    if (reserved.has(id)) continue; // scenario anchors are added separately
    const brand = choose(r, [Brand.FRESH, Brand.FRESH, Brand.FRESH, Brand.STYLE, Brand.TECH]);
    const d = choose(r, districts);
    const dockType =
      brand === Brand.FRESH ? choose(r, [DockType.REAR_DOCK, DockType.REAR_DOCK, DockType.STREET])
      : choose(r, [DockType.MALL_BAY, DockType.STREET]);
    const parking =
      dockType === DockType.MALL_BAY ? ParkingType.MALL_DOCK
      : choose(r, [ParkingType.NORMAL, ParkingType.NORMAL, ParkingType.NORMAL, ParkingType.VAN_ONLY]);
    const open = int(r, 6, 14) * 30; // 03:00 .. 07:00
    const close = open + int(r, 5, 8) * 30; // +2.5 h .. +4 h
    rows.push({
      id,
      name: `Synthetic ${BRAND_LABEL[brand]} ${String(n).padStart(2, '0')}`,
      brand,
      district: d.district,
      depot: d.depot,
      dockType,
      parking,
      windowOpen: hhmm(open),
      windowClose: hhmm(close),
      address: SYNTHETIC_TAG,
    });
  }
  return rows;
}

export function syntheticVehicles(seed: number, count = 16): VehicleRow[] {
  const r = prng(seed ^ 0x5005);
  const reserved = new Set(VEHICLE_ANCHORS.map((v) => v.id));
  const rows: VehicleRow[] = [];
  let n = 0;
  while (rows.length < count) {
    n++;
    const id = `VEH${String(n).padStart(3, '0')}`;
    if (reserved.has(id)) continue;
    const type = r() < 0.55 ? VehicleType.TRUCK : VehicleType.VAN;
    const truck = type === VehicleType.TRUCK;
    rows.push({
      id,
      depot: rows.length % 3 === 2 ? Depot.KANDY : Depot.PELIYAGODA,
      type,
      tempClass: r() < 0.45 ? TempClass.CHILLED : TempClass.AMBIENT,
      capacityKg: truck ? int(r, 35, 70) * 100 : int(r, 9, 13) * 100,
      capacityM3: truck ? int(r, 20, 35) : round1(6 + r() * 3),
      kmPerLitre: truck ? round1(4 + r() * 3) : round1(9 + r() * 3),
      weeklyLFuel: int(r, 30, 55) * 10,
    });
  }
  return rows;
}

/** Add scenario anchors whose id is not already present (never overwrites). */
export function withAnchors<T extends { id: string }>(rows: T[], anchors: readonly T[]): { rows: T[]; added: string[] } {
  const have = new Set(rows.map((x) => x.id));
  const added = anchors.filter((a) => !have.has(a.id));
  return { rows: [...rows, ...added.map((a) => ({ ...a }))], added: added.map((a) => a.id) };
}

/** Make sure every district an outlet uses has a travel row (generated if missing). */
export function withDistrictsFor(
  districts: DistrictRow[],
  outlets: readonly OutletRow[],
  seed: number,
): { rows: DistrictRow[]; added: string[] } {
  const r = prng(seed ^ 0x6006);
  const have = new Set(districts.map((d) => d.district));
  const out = [...districts];
  const added: string[] = [];
  for (const o of outlets) {
    if (have.has(o.district)) continue;
    have.add(o.district);
    added.push(o.district);
    out.push(syntheticDistrict(r, o.district, o.depot));
  }
  return { rows: out, added };
}

/** The complete synthetic dataset, scenario anchors included. */
export function generateSynthetic(opts: SyntheticOptions = {}): ReferenceData {
  const seed = opts.seed ?? DEFAULT_SYNTHETIC_SEED;
  const outlets = withAnchors(
    syntheticOutlets(seed, opts.outletCount ?? 30, opts.districts ?? SYNTHETIC_DISTRICTS),
    OUTLET_ANCHORS,
  ).rows;
  const vehicles = withAnchors(syntheticVehicles(seed, opts.vehicleCount ?? 16), VEHICLE_ANCHORS).rows;
  const districts = withDistrictsFor(syntheticDistricts(seed), outlets, seed).rows;
  return {
    districts,
    allowances: syntheticAllowances(seed),
    calendar: syntheticCalendar(seed),
    outlets,
    vehicles,
  };
}
