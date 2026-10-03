import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { ODataError } from '@lodestar/odata';
import type { Principal } from '@lodestar/security';
import { Prisma } from '@prisma/client';
// The seed's CSV reader, row mappers and upsert shape are the one definition of what a reference CSV means
// (prisma/DATA.md): the admin import (ADM-14) reuses them so an uploaded file is read exactly like the seed reads it.
import { CsvRecord, hasColumn, readCsvRecords } from '../../../prisma/seed/csv';
import { ALIASES, Mapped, mapAllowance, mapCalendar, mapDistrict, mapOutlet, mapVehicle } from '../../../prisma/seed/mappers';
import { upsertArgs } from '../../../prisma/seed/writer';

/** The reference files an admin can replace (ADM-14), by import name. */
export const IMPORT_FILES = {
  outlets: { csv: 'outlets.csv', table: 'outlet', aliases: ALIASES.outlet, keyField: 'id', keyColumn: 'outlet_id' },
  vehicles: { csv: 'vehicles.csv', table: 'vehicle', aliases: ALIASES.vehicle, keyField: 'id', keyColumn: 'vehicle_id' },
  calendar: { csv: 'calendar.csv', table: 'calendar', aliases: ALIASES.calendar, keyField: 'date', keyColumn: 'date' },
  district_travel: { csv: 'district_travel.csv', table: 'districtTravel', aliases: ALIASES.district, keyField: 'district', keyColumn: 'district' },
  service_allowance: { csv: 'service_allowance.csv', table: 'serviceAllowance', aliases: ALIASES.allowance, keyField: 'brand', keyColumn: 'brand' },
} as const;

export type ImportFile = keyof typeof IMPORT_FILES;
type Table = (typeof IMPORT_FILES)[ImportFile]['table'];

/** Columns each file must have (canonical name first in its alias list). */
const REQUIRED: Record<ImportFile, string[]> = {
  outlets: ['id', 'brand', 'district', 'depot', 'dockType', 'windowOpen', 'windowClose'],
  vehicles: ['id', 'type', 'tempClass', 'capacityKg', 'capacityM3', 'kmPerLitre', 'weeklyLFuel', 'depot'],
  calendar: ['date'],
  district_travel: ['district', 'depot', 'depotToDistMin', 'interStopMin'],
  service_allowance: ['brand', 'dockType', 'minutes'],
};

const MAPPERS: Record<ImportFile, (rec: CsvRecord) => Mapped<any>> = {
  outlets: mapOutlet,
  vehicles: mapVehicle,
  calendar: mapCalendar,
  district_travel: mapDistrict,
  service_allowance: mapAllowance,
};

/** One rejected row: spreadsheet row number (header is row 1), its key, the column, the value and why. */
export interface ImportProblem {
  row: number;
  key: string | null;
  column: string | null;
  value: string | null;
  reason: string;
}

export interface ImportCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export const MAX_IMPORT_ROWS = 20_000;
const MAX_PROBLEMS = 200;

const rowKey = (file: ImportFile, row: Record<string, any>): string =>
  file === 'service_allowance' ? `${row.brand}/${row.dockType}` : file === 'calendar' ? (row.date as Date).toISOString().slice(0, 10) : String(row[IMPORT_FILES[file].keyField]);

/** The column a mapper's reason is about: "missing x" names it; otherwise the column holding the quoted value. */
export function columnOf(reason: string, rec: CsvRecord): { column: string | null; value: string | null } {
  const missing = /^missing (\S+)/.exec(reason);
  if (missing) return { column: missing[1], value: null };
  const quoted = /"(.*)"/.exec(reason)?.[1];
  if (quoted === undefined) return { column: null, value: null };
  const column = Object.keys(rec).find((k) => rec[k] === quoted || rec[k]?.trim() === quoted.trim()) ?? null;
  return { column, value: quoted };
}

/** Plain-words version of a mapper reason, for the admin (ADM-15). */
export function plainReason(reason: string): string {
  if (/^missing /.test(reason)) return `This value is empty. ${reason.replace(/^missing /, '')} is required.`;
  if (/^unknown parking constraint/.test(reason)) return 'Lodestar reads only normal, van_only or mall_dock (with an underscore).';
  if (/^unknown dock type/.test(reason)) return 'Lodestar reads only rear_dock, street or mall_bay.';
  if (/^unknown depot/.test(reason)) return 'The depot must be the code or name of a registered depot (Admin, Depots).';
  if (/^unknown brand/.test(reason)) return 'The brand must be Fresh, Style or Tech.';
  if (/^unknown vehicle type/.test(reason)) return 'The type must be truck or van.';
  if (/^unknown temperature class/.test(reason)) return 'The temperature must be reefer (chilled) or dry (ambient).';
  if (/^not a time window/.test(reason)) return 'Write the mall window as HH:mm-HH:mm, for example 05:30-07:00.';
  if (/^not a time/.test(reason)) return 'Write the time as HH:mm, for example 05:30.';
  if (/^not a date/.test(reason)) return 'Write the date as YYYY-MM-DD.';
  if (/^not a number/.test(reason)) return 'This must be a number.';
  if (/^not a boolean/.test(reason)) return 'Write 1 or 0 (or true or false).';
  return reason;
}

export interface CheckedFile {
  file: ImportFile;
  rows: number;
  passed: number;
  problems: ImportProblem[];
  checks: ImportCheck[];
  mapped: Record<string, any>[];
}

/**
 * ADM-14/15: checks a whole reference CSV with the seed's mappers plus file-level checks, and writes it only when
 * every row passes (all or nothing), with the seed writer's upserts: CSV columns are refreshed, operational
 * columns (Outlet.accessNote, Vehicle.status / workshopNote / usedLThisWeek, Calendar.note) are left alone.
 * Rows are never deleted. The CSV text is not stored: only the counts, the checks and the rejected rows' reasons.
 */
@Injectable()
export class DataImportService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pure check of the file content (plus the known districts for outlets). Exported for tests through check(). */
  async check(file: ImportFile, csv: string): Promise<CheckedFile> {
    const spec = IMPORT_FILES[file];
    let parsed: { headers: string[]; records: CsvRecord[] };
    try {
      parsed = readCsvRecords(csv);
    } catch (err) {
      throw ODataError.badRequest(`The file could not be read as CSV: ${(err as Error).message}`, 'csv');
    }
    const { headers, records } = parsed;
    if (!records.length) throw ODataError.badRequest('The file has a header but no rows', 'csv');
    if (records.length > MAX_IMPORT_ROWS) throw ODataError.badRequest(`The file has more than ${MAX_IMPORT_ROWS} rows`, 'csv');

    const problems: ImportProblem[] = [];
    const checks: ImportCheck[] = [];
    const add = (p: ImportProblem) => {
      if (problems.length < MAX_PROBLEMS) problems.push(p);
    };

    const aliases = spec.aliases as Record<string, readonly string[]>;
    const missingCols = REQUIRED[file].filter((f) => !hasColumn(headers, aliases[f]));
    checks.push({
      label: `Columns ${file === 'outlets' ? 'outlet_id' : aliases[REQUIRED[file][0]][0]} and the other required columns are present`,
      passed: missingCols.length === 0,
      detail: missingCols.length ? `missing ${missingCols.map((f) => aliases[f][0]).join(', ')}` : `${headers.filter(Boolean).length} columns`,
    });
    for (const f of missingCols) add({ row: 1, key: null, column: aliases[f][0], value: null, reason: `The header has no ${aliases[f][0]} column.` });

    const mapper = MAPPERS[file];
    const mapped: Record<string, any>[] = [];
    const bad = new Set<number>();
    const seen = new Map<string, number>();
    let duplicates = 0;
    records.forEach((rec, i) => {
      const row = i + 2;
      const m = mapper(rec);
      const keyRaw = rec[aliases[spec.keyField]?.find((a) => rec[a]) ?? spec.keyColumn] ?? null;
      if (m.ok === false) {
        bad.add(row);
        const { column, value } = columnOf(m.reason, rec);
        add({ row, key: keyRaw || null, column, value, reason: plainReason(m.reason) });
        return;
      }
      const key = rowKey(file, m.row);
      const first = seen.get(key);
      if (first !== undefined) {
        duplicates++;
        bad.add(row);
        add({ row, key, column: spec.keyColumn, value: key, reason: `Repeats row ${first}. Each ${spec.keyColumn === 'brand' ? 'brand and dock type' : spec.keyColumn} may appear once.` });
        return;
      }
      seen.set(key, row);
      mapped.push({ ...m.row, __row: row });
    });
    checks.push({
      label: `Every ${file === 'service_allowance' ? 'brand and dock type' : spec.keyColumn} appears once`,
      passed: duplicates === 0,
      detail: duplicates ? `${duplicates} repeated` : `${seen.size} distinct`,
    });

    // Depots come from the registry (ADM-21): a row may name a depot by code or by name, never an unregistered one.
    const depotNames = new Map<string, string>();
    if (file === 'outlets' || file === 'vehicles' || file === 'district_travel') {
      const depots = await this.prisma.depot.findMany({ select: { code: true, name: true, isActive: true } });
      const norm = (x: string) => x.trim().toUpperCase().replace(/[\s-]+/g, '_');
      const byKey = new Map<string, (typeof depots)[number]>();
      for (const d of depots) {
        byKey.set(d.code, d);
        byKey.set(norm(d.name), d);
        depotNames.set(d.code, d.name);
      }
      let unknown = 0;
      for (const r of mapped) {
        const d = byKey.get(r.depot);
        if (d?.isActive) {
          r.depot = d.code;
          continue;
        }
        unknown++;
        bad.add(r.__row);
        add({
          row: r.__row, key: rowKey(file, r), column: 'depot', value: r.depot,
          reason: d ? `${d.name} is deactivated. Reactivate it on the Depots page, or pick another depot.` : `No depot ${r.depot} is registered. Register it on the Depots page first.`,
        });
      }
      checks.push({ label: 'Every depot is a registered, active depot', passed: unknown === 0, detail: unknown ? `${unknown} unknown` : `${new Set(mapped.map((r) => r.depot)).size} depots` });
    }

    if (file === 'outlets') {
      let windows = 0;
      for (const o of mapped) {
        if (o.windowOpen >= o.windowClose) {
          windows++;
          bad.add(o.__row);
          add({ row: o.__row, key: o.id, column: 'window_close_time', value: o.windowClose, reason: `The window closes before it opens (${o.windowOpen}). A delivery window must end after it starts.` });
        }
      }
      checks.push({ label: 'Every delivery window ends after it starts', passed: windows === 0, detail: windows ? `${windows} wrong` : `${mapped.length} of ${mapped.length}` });
      const districts = await this.prisma.districtTravel.findMany({ select: { district: true, depot: true } });
      const served = new Set(districts.map((d) => `${d.depot}|${d.district.toLowerCase()}`));
      let outside = 0;
      for (const o of mapped) {
        if (!served.has(`${o.depot}|${String(o.district).toLowerCase()}`)) {
          outside++;
          bad.add(o.__row);
          add({ row: o.__row, key: o.id, column: 'district', value: o.district, reason: `${depotNames.get(o.depot) ?? o.depot} has no travel times for ${o.district}. Import district_travel.csv first, or fix the district.` });
        }
      }
      checks.push({ label: 'Every outlet sits in a district its depot serves', passed: outside === 0, detail: outside ? `${outside} outside` : `${new Set(mapped.map((o) => o.district)).size} districts` });
      const malls = mapped.filter((o) => o.parking === 'MALL_DOCK');
      checks.push({ label: 'Mall-dock outlets have a mall_window', passed: true, detail: `${malls.filter((o) => o.mallWindow).length} of ${malls.length}` });
    }
    if (file === 'vehicles') {
      let caps = 0;
      for (const v of mapped) {
        if (!(v.capacityKg > 0) || !(v.capacityM3 > 0)) {
          caps++;
          bad.add(v.__row);
          add({ row: v.__row, key: v.id, column: v.capacityKg > 0 ? 'volume_cap_m3' : 'weight_cap_kg', value: String(v.capacityKg > 0 ? v.capacityM3 : v.capacityKg), reason: 'A vehicle needs a weight and a volume capacity above 0.' });
        }
      }
      checks.push({ label: 'Every vehicle has a weight and volume capacity', passed: caps === 0, detail: caps ? `${caps} without` : `${mapped.length} of ${mapped.length}` });
    }
    const failedRows = records.length - mapped.filter((r) => !bad.has(r.__row)).length;
    checks.push({ label: 'Every row reads with the seed rules (prisma/DATA.md)', passed: failedRows === 0, detail: `${records.length - failedRows} of ${records.length}` });

    problems.sort((a, b) => a.row - b.row);
    return { file, rows: records.length, passed: records.length - bad.size, problems, checks, mapped: mapped.map(({ __row, ...r }) => r) };
  }

  /** Checks the file; when it is clean, upserts every row in one transaction. Records the result either way. */
  async import(file: ImportFile, csv: string, fileName: string | undefined, p: Principal) {
    if (!(file in IMPORT_FILES)) throw ODataError.badRequest(`file must be one of ${Object.keys(IMPORT_FILES).join(', ')}`, 'file');
    if (typeof csv !== 'string' || !csv.trim()) throw ODataError.badRequest('csv is required (the file content as text)', 'csv');
    const checked = await this.check(file, csv);
    const clean = checked.problems.length === 0;
    let created = 0;
    let updated = 0;
    if (clean) {
      const table = IMPORT_FILES[file].table as Table;
      await this.prisma.$transaction(
        async (tx) => {
          const delegate = (tx as any)[table] as { upsert(a: unknown): Promise<unknown>; count(a: unknown): Promise<number> };
          for (const row of checked.mapped) {
            const args = upsertArgs(table, row);
            const exists = await delegate.count({ where: args.where });
            await delegate.upsert(args);
            if (exists) updated++;
            else created++;
          }
        },
        { timeout: 120_000, maxWait: 10_000 },
      );
    }
    return this.prisma.dataImport.create({
      data: {
        file,
        fileName: fileName ? String(fileName).slice(0, 200) : IMPORT_FILES[file].csv,
        rows: checked.rows,
        passed: checked.passed,
        applied: clean,
        created,
        updated,
        problems: checked.problems as unknown as Prisma.InputJsonArray,
        checks: checked.checks as unknown as Prisma.InputJsonArray,
        importedBy: p.sub,
        byName: p.name ?? null,
      },
    });
  }
}
