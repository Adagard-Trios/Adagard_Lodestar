/**
 * Loads reference tables from CSV files in DATA_DIR, table by table.
 *
 * Every file is optional: a missing file (or one with no usable rows) is
 * replaced by the synthetic generator's rows for that table. After loading,
 * gaps the scenario depends on are filled (anchors, districts, allowances)
 * and reported, so the result is always internally consistent.
 */

import * as fs from 'fs';
import * as path from 'path';
import { readCsvRecords } from './csv';
import {
  Mapped, mapAllowance, mapCalendar, mapDistrict, mapOutlet, mapVehicle,
} from './mappers';
import {
  DEFAULT_SYNTHETIC_SEED, ReferenceData, SYNTHETIC_DISTRICTS, syntheticAllowances, syntheticCalendar,
  syntheticDistricts, syntheticOutlets, syntheticVehicles, withAnchors, withDistrictsFor,
} from './synthetic';
import { OUTLET_ANCHORS, VEHICLE_ANCHORS } from '../scenario';

export const DATA_FILES = {
  districts: 'district_travel.csv',
  allowances: 'service_allowance.csv',
  calendar: 'calendar.csv',
  outlets: 'outlets.csv',
  vehicles: 'vehicles.csv',
} as const;

export type Table = keyof typeof DATA_FILES;
export type Source = 'csv' | 'synthetic';

export interface TableReport {
  source: Source;
  file?: string;
  rows: number;
  skipped: number;
  /** First few skip reasons, e.g. "line 14: unknown dock type: \"loading bay\"". */
  skipReasons: string[];
  /** Rows added to fill a gap (anchors, districts, allowance combos). */
  filled: string[];
}

export interface LoadResult {
  data: ReferenceData;
  report: Record<Table, TableReport>;
}

/** Minimal fs surface, injectable for tests. */
export interface FileSource {
  exists(p: string): boolean;
  read(p: string): string;
}

export const nodeFiles: FileSource = {
  exists: (p) => {
    try {
      return fs.statSync(p).isFile() || fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  },
  read: (p) => fs.readFileSync(p, 'utf8'),
};

const MAX_REASONS = 5;

/**
 * Parse one CSV text with a row mapper. Duplicate keys: last row wins.
 * Line numbers in reasons count the header as line 1.
 */
export function mapCsv<T>(
  text: string,
  mapper: (rec: Record<string, string>) => Mapped<T>,
  keyOf: (row: T) => string,
): { rows: T[]; skipped: number; skipReasons: string[] } {
  const { records } = readCsvRecords(text);
  const byKey = new Map<string, T>();
  const skipReasons: string[] = [];
  let skipped = 0;
  records.forEach((rec, idx) => {
    const m = mapper(rec);
    if (m.ok === true) {
      byKey.set(keyOf(m.row), m.row);
    } else {
      skipped++;
      if (skipReasons.length < MAX_REASONS) skipReasons.push(`line ${idx + 2}: ${m.reason}`);
    }
  });
  return { rows: [...byKey.values()], skipped, skipReasons };
}

export interface LoadOptions {
  seed?: number;
  files?: FileSource;
}

/** Load (or synthesise) every reference table. `dataDir` null/missing -> all synthetic. */
export function loadReference(dataDir: string | null, opts: LoadOptions = {}): LoadResult {
  const seed = opts.seed ?? DEFAULT_SYNTHETIC_SEED;
  const files = opts.files ?? nodeFiles;
  const dirOk = !!dataDir && files.exists(dataDir);

  function load<T>(
    table: Table,
    mapper: (rec: Record<string, string>) => Mapped<T>,
    keyOf: (row: T) => string,
    synth: () => T[],
  ): { rows: T[]; report: TableReport } {
    const file = dirOk ? path.join(dataDir as string, DATA_FILES[table]) : undefined;
    if (file && files.exists(file)) {
      const res = mapCsv(files.read(file), mapper, keyOf);
      if (res.rows.length > 0) {
        return {
          rows: res.rows,
          report: { source: 'csv', file, rows: res.rows.length, skipped: res.skipped, skipReasons: res.skipReasons, filled: [] },
        };
      }
      // A present but unusable file falls back to synthetic, with the reasons kept for the log.
      const rows = synth();
      return {
        rows,
        report: { source: 'synthetic', file, rows: rows.length, skipped: res.skipped, skipReasons: ['no usable rows', ...res.skipReasons], filled: [] },
      };
    }
    const rows = synth();
    return { rows, report: { source: 'synthetic', rows: rows.length, skipped: 0, skipReasons: [], filled: [] } };
  }

  const districts = load('districts', mapDistrict, (r) => r.district, () => syntheticDistricts(seed));
  const allowances = load('allowances', mapAllowance, (r) => `${r.brand}/${r.dockType}`, () => syntheticAllowances(seed));
  const calendar = load('calendar', mapCalendar, (r) => r.date.toISOString(), () => syntheticCalendar(seed));
  // Synthetic outlets go into the real districts when district_travel.csv was loaded.
  const outletDistricts =
    districts.report.source === 'csv'
      ? districts.rows.map((d) => ({ district: d.district, depot: d.depot }))
      : SYNTHETIC_DISTRICTS;
  const outlets = load('outlets', mapOutlet, (r) => r.id, () => syntheticOutlets(seed, 30, outletDistricts));
  const vehicles = load('vehicles', mapVehicle, (r) => r.id, () => syntheticVehicles(seed));

  // ── Fill gaps the scenario relies on ──────────────────────────────────
  const o = withAnchors(outlets.rows, OUTLET_ANCHORS);
  outlets.report.filled = o.added;
  const v = withAnchors(vehicles.rows, VEHICLE_ANCHORS);
  vehicles.report.filled = v.added;
  const d = withDistrictsFor(districts.rows, o.rows, seed);
  districts.report.filled = d.added;

  const haveCombo = new Set(allowances.rows.map((a) => `${a.brand}/${a.dockType}`));
  const missingCombos = syntheticAllowances(seed).filter((a) => !haveCombo.has(`${a.brand}/${a.dockType}`));
  allowances.report.filled = missingCombos.map((a) => `${a.brand}/${a.dockType}`);

  const data: ReferenceData = {
    districts: d.rows,
    allowances: [...allowances.rows, ...missingCombos],
    calendar: calendar.rows,
    outlets: o.rows,
    vehicles: v.rows,
  };
  // Row counts reflect what will be written, fills included.
  districts.report.rows = data.districts.length;
  allowances.report.rows = data.allowances.length;
  outlets.report.rows = data.outlets.length;
  vehicles.report.rows = data.vehicles.length;

  return {
    data,
    report: {
      districts: districts.report,
      allowances: allowances.report,
      calendar: calendar.report,
      outlets: outlets.report,
      vehicles: vehicles.report,
    },
  };
}
