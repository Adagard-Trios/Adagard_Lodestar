/* Made-up CSV content only; no competition dataset values. */
import * as path from 'path';
import { OUTLET_ANCHORS, VEHICLE_ANCHORS } from '../scenario';
import { FileSource, loadReference, mapCsv } from './reference-loader';
import { mapOutlet } from './mappers';

/** FileSource over an in-memory map of file name -> content under /fake. */
function files(map: Record<string, string>, dirExists = true): FileSource {
  return {
    exists: (p) => (p === '/fake' ? dirExists : path.basename(p) in map && dirExists),
    read: (p) => map[path.basename(p)],
  };
}

const OUTLETS_CSV =
  'outlet_id,brand,district,depot,dock_type,parking_constraint,mall_window,window_open_time,window_close_time\n' +
  'OUT106,Fresh,Testshire,Kandy,rear_dock,,,05:00,08:00\n' +
  'OUT901,Tech,Testburg,Peliyagoda,mall_bay,mall_dock,1,10:00,12:00\n' +
  'OUT902,Fresh,Testburg,Peliyagoda,loading_ramp,,,05:00,07:00\n' + // bad dock -> skipped
  'OUT901,Tech,Testburg,Peliyagoda,mall_bay,mall_dock,1,10:30,12:30\n'; // duplicate id -> last wins

describe('mapCsv', () => {
  it('counts skipped rows with line numbers and de-duplicates keys', () => {
    const res = mapCsv(OUTLETS_CSV, mapOutlet, (r) => r.id);
    expect(res.rows.map((r) => r.id)).toEqual(['OUT106', 'OUT901']);
    expect(res.rows[1].windowOpen).toBe('10:30');
    expect(res.skipped).toBe(1);
    expect(res.skipReasons).toEqual(['line 4: unknown dock type: "loading_ramp"']);
  });
});

describe('loadReference', () => {
  it('is fully synthetic when DATA_DIR is missing', () => {
    const { report, data } = loadReference('/fake', { files: files({}, false), seed: 5 });
    for (const r of Object.values(report)) expect(r.source).toBe('synthetic');
    expect(data.outlets.length).toBeGreaterThan(30);
  });

  it('is fully synthetic when dataDir is null', () => {
    const { report } = loadReference(null, { files: files({}), seed: 5 });
    expect(report.outlets.source).toBe('synthetic');
  });

  it('mixes CSV and synthetic per table and fills gaps', () => {
    const { report, data } = loadReference('/fake', {
      files: files({
        'outlets.csv': OUTLETS_CSV,
        'service_allowance.csv': 'brand,dock_type,service_allowance_min\nFresh,rear_dock,11\n',
      }),
      seed: 5,
    });
    expect(report.outlets.source).toBe('csv');
    expect(report.outlets.skipped).toBe(1);
    expect(report.vehicles.source).toBe('synthetic');
    expect(report.calendar.source).toBe('synthetic');

    // CSV row for an anchor id is kept as-is; the other anchors are filled in.
    expect(data.outlets.find((o) => o.id === 'OUT106')?.district).toBe('Testshire');
    for (const a of OUTLET_ANCHORS) expect(data.outlets.some((o) => o.id === a.id)).toBe(true);
    expect(report.outlets.filled).not.toContain('OUT106');
    for (const a of VEHICLE_ANCHORS) expect(data.vehicles.some((v) => v.id === a.id)).toBe(true);

    // Districts used by CSV outlets get generated travel rows.
    const names = data.districts.map((d) => d.district);
    expect(names).toEqual(expect.arrayContaining(['Testshire', 'Testburg', 'Nuwara Eliya']));
    expect(report.districts.filled).toEqual(expect.arrayContaining(['Testshire', 'Testburg']));

    // The one CSV allowance is kept; the other 8 combos are filled.
    expect(data.allowances).toHaveLength(9);
    expect(data.allowances).toContainEqual({ brand: 'FRESH', dockType: 'REAR_DOCK', minutes: 11 });
    expect(report.allowances.filled).toHaveLength(8);
  });

  it('falls back to synthetic when a file has no usable rows', () => {
    const { report } = loadReference('/fake', {
      files: files({ 'vehicles.csv': 'vehicle_id,type\nVEH999,hovercraft\n' }),
    });
    expect(report.vehicles.source).toBe('synthetic');
    expect(report.vehicles.skipped).toBe(1);
    expect(report.vehicles.skipReasons[0]).toBe('no usable rows');
  });

  it('places synthetic outlets in CSV districts when district_travel.csv is loaded', () => {
    const { data } = loadReference('/fake', {
      files: files({
        'district_travel.csv': 'district,depot,road_class,depot_to_district_freeflow_min,inter_stop_freeflow_min\nAlphaville,Kandy,hill,50,10\nBetaville,Peliyagoda,urban,20,5\n',
      }),
      seed: 9,
    });
    const anchorIds = new Set(OUTLET_ANCHORS.map((a) => a.id));
    const generated = data.outlets.filter((o) => !anchorIds.has(o.id));
    expect(generated.every((o) => ['Alphaville', 'Betaville'].includes(o.district))).toBe(true);
    expect(data.districts.find((d) => d.district === 'Alphaville')?.depotToDistMin).toBe(50);
  });
});
