/**
 * Row mappers: one normalised CSV record -> one Prisma input object, or a
 * skip with a reason. Pure functions; no I/O. Column aliases are listed in
 * normalised form (see csv.normalizeHeader) and documented in prisma/DATA.md.
 */

import { Prisma } from '@prisma/client';
import { CsvRecord, pick } from './csv';
import {
  ValueError, parseBool, parseBrand, parseDate, parseDepot, parseDockType, parseIntish,
  parseNumber, parseParking, parseTempClass, parseText, parseTime, parseVehicleType,
} from './normalize';

export type CalendarRow = Prisma.CalendarCreateManyInput & { date: Date };
export type DistrictRow = Prisma.DistrictTravelCreateManyInput;
export type AllowanceRow = Prisma.ServiceAllowanceCreateManyInput;
export type OutletRow = Prisma.OutletCreateManyInput;
export type VehicleRow = Prisma.VehicleCreateManyInput;

export type Mapped<T> = { ok: true; row: T } | { ok: false; reason: string };

/** Accepted column names per field (normalised). The first is the canonical CSV header. */
export const ALIASES = {
  calendar: {
    date: ['date', 'calendar_date', 'day'],
    isOperating: ['is_operating', 'operating'],
    isPayday: ['is_payday', 'payday'],
    festivalRamp: ['festival_ramp'],
    monsoon: ['monsoon', 'is_monsoon'],
    festivalName: ['festival', 'festival_name'],
    isWeekend: ['is_weekend'],
    isHoliday: ['is_holiday', 'holiday'],
  },
  district: {
    district: ['district', 'district_name'],
    depot: ['depot'],
    roadClass: ['road_class'],
    depotToDistMin: ['depot_to_district_freeflow_min', 'depot_to_dist_min', 'depot_to_district_min'],
    interStopMin: ['inter_stop_freeflow_min', 'inter_stop_min'],
    distKm: ['depot_to_district_km', 'dist_km', 'distance_km'],
  },
  allowance: {
    brand: ['brand'],
    dockType: ['dock_type', 'dock'],
    minutes: ['service_allowance_min', 'minutes', 'allowance_min', 'service_min'],
  },
  outlet: {
    id: ['outlet_id', 'id'],
    name: ['name', 'outlet_name'],
    brand: ['brand'],
    district: ['district'],
    depot: ['depot'],
    dockType: ['dock_type', 'dock'],
    parking: ['parking_constraint', 'parking'],
    windowOpen: ['window_open_time', 'window_open'],
    windowClose: ['window_close_time', 'window_close'],
  },
  vehicle: {
    id: ['vehicle_id', 'id'],
    type: ['type', 'vehicle_type'],
    tempClass: ['temp', 'temp_class', 'temperature'],
    capacityKg: ['weight_cap_kg', 'capacity_kg'],
    capacityM3: ['volume_cap_m3', 'capacity_m3'],
    kmPerLitre: ['km_per_l', 'km_per_litre', 'km_per_liter'],
    weeklyLFuel: ['weekly_fuel_quota_l', 'weekly_l_fuel', 'weekly_fuel_l'],
    depot: ['depot'],
  },
} as const;

/** Run a mapper body, converting ValueError / missing-field errors into a skip. */
function guard<T>(fn: () => T): Mapped<T> {
  try {
    return { ok: true, row: fn() };
  } catch (e) {
    if (e instanceof ValueError) return { ok: false, reason: e.message };
    throw e;
  }
}

/** Throw a ValueError when a required value is missing. */
function req<T>(v: T | null | undefined, field: string): T {
  if (v === null || v === undefined) throw new ValueError(`missing ${field}`);
  return v;
}

export function mapCalendar(rec: CsvRecord): Mapped<CalendarRow> {
  const a = ALIASES.calendar;
  return guard(() => {
    const date = req(parseDate(pick(rec, a.date)), 'date');
    // is_operating is authoritative; otherwise derive "not a weekend/holiday".
    let isOperating = parseBool(pick(rec, a.isOperating));
    if (isOperating === null) {
      const weekend = parseBool(pick(rec, a.isWeekend));
      const holiday = parseBool(pick(rec, a.isHoliday));
      if (weekend === null && holiday === null) throw new ValueError('missing is_operating');
      isOperating = !weekend && !holiday;
    }
    const monsoonRaw = pick(rec, a.monsoon);
    let monsoon = 0;
    if (monsoonRaw !== undefined) {
      const asBool = /^(true|false|yes|no)$/i.test(monsoonRaw.trim());
      monsoon = asBool ? (parseBool(monsoonRaw) ? 1 : 0) : (parseIntish(monsoonRaw) ?? 0);
    }
    return {
      date,
      isOperating,
      isPayday: parseBool(pick(rec, a.isPayday)) ?? false,
      festivalRamp: parseNumber(pick(rec, a.festivalRamp)) ?? 0,
      monsoon,
      festivalName: parseText(pick(rec, a.festivalName)),
      note: null,
    };
  });
}

export function mapDistrict(rec: CsvRecord): Mapped<DistrictRow> {
  const a = ALIASES.district;
  return guard(() => ({
    district: req(parseText(pick(rec, a.district)), 'district'),
    depot: req(parseDepot(pick(rec, a.depot)), 'depot'),
    roadClass: (parseText(pick(rec, a.roadClass)) ?? 'urban').toLowerCase(),
    depotToDistMin: req(parseIntish(pick(rec, a.depotToDistMin)), 'depot_to_district_freeflow_min'),
    interStopMin: req(parseIntish(pick(rec, a.interStopMin)), 'inter_stop_freeflow_min'),
    distKm: parseNumber(pick(rec, a.distKm)),
  }));
}

export function mapAllowance(rec: CsvRecord): Mapped<AllowanceRow> {
  const a = ALIASES.allowance;
  return guard(() => ({
    brand: req(parseBrand(pick(rec, a.brand)), 'brand'),
    dockType: req(parseDockType(pick(rec, a.dockType)), 'dock_type'),
    minutes: req(parseIntish(pick(rec, a.minutes)), 'service_allowance_min'),
  }));
}

const BRAND_LABEL = { FRESH: 'Fresh', STYLE: 'Style', TECH: 'Tech' } as const;

/**
 * outlets.csv has no name column: derive a neutral display label,
 * e.g. "Waypoint Fresh Gampaha 027" (brand, district, numeric id suffix).
 */
export function deriveOutletName(id: string, brand: keyof typeof BRAND_LABEL, district: string): string {
  const suffix = (/(\d+)$/.exec(id)?.[1]) ?? id;
  return `Waypoint ${BRAND_LABEL[brand]} ${district} ${suffix}`;
}

export function mapOutlet(rec: CsvRecord): Mapped<OutletRow> {
  const a = ALIASES.outlet;
  return guard(() => {
    const id = req(parseText(pick(rec, a.id)), 'outlet_id').toUpperCase();
    const brand = req(parseBrand(pick(rec, a.brand)), 'brand');
    const district = req(parseText(pick(rec, a.district)), 'district');
    return {
      id,
      name: parseText(pick(rec, a.name)) ?? deriveOutletName(id, brand, district),
      brand,
      district,
      depot: req(parseDepot(pick(rec, a.depot)), 'depot'),
      dockType: req(parseDockType(pick(rec, a.dockType)), 'dock_type'),
      parking: parseParking(pick(rec, a.parking)),
      windowOpen: req(parseTime(pick(rec, a.windowOpen)), 'window_open_time'),
      windowClose: req(parseTime(pick(rec, a.windowClose)), 'window_close_time'),
    };
  });
}

export function mapVehicle(rec: CsvRecord): Mapped<VehicleRow> {
  const a = ALIASES.vehicle;
  return guard(() => ({
    id: req(parseText(pick(rec, a.id)), 'vehicle_id').toUpperCase(),
    depot: req(parseDepot(pick(rec, a.depot)), 'depot'),
    type: req(parseVehicleType(pick(rec, a.type)), 'type'),
    tempClass: req(parseTempClass(pick(rec, a.tempClass)), 'temp'),
    capacityKg: req(parseNumber(pick(rec, a.capacityKg)), 'weight_cap_kg'),
    capacityM3: req(parseNumber(pick(rec, a.capacityM3)), 'volume_cap_m3'),
    kmPerLitre: req(parseNumber(pick(rec, a.kmPerLitre)), 'km_per_l'),
    weeklyLFuel: req(parseIntish(pick(rec, a.weeklyLFuel)), 'weekly_fuel_quota_l'),
  }));
}
