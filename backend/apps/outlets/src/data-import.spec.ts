import { personas } from '../../../libs/security/test/principals';
import { columnOf, DataImportService, plainReason } from './data-import.service';
import { DataImportsSet } from './outlets.sets';

const OUTLETS_HEADER = 'outlet_id,brand,district,depot,dock_type,parking_constraint,window_open_time,window_close_time,mall_window';

function db(existing: string[] = []) {
  const written: any[] = [];
  const outlet = {
    count: jest.fn(async ({ where }: any) => (existing.includes(where.id) ? 1 : 0)),
    upsert: jest.fn(async (a: any) => written.push(a)),
  };
  const tx = { outlet };
  return {
    written,
    prisma: {
      districtTravel: { findMany: jest.fn(async () => [{ district: 'Nuwara Eliya', depot: 'KANDY' }, { district: 'Colombo', depot: 'PELIYAGODA' }]) },
      dataImport: { create: jest.fn(async ({ data }: any) => ({ id: 'imp-1', ...data })) },
      $transaction: jest.fn(async (fn: any) => fn(tx)),
      outlet,
    },
  };
}

describe('DataImportService (ADM-14/15)', () => {
  it('applies a clean outlets.csv with seed-style upserts and records counts, never the CSV', async () => {
    const { prisma, written } = db(['OUT106']);
    const csv = [OUTLETS_HEADER, 'OUT106,fresh,Nuwara Eliya,Kandy,rear_dock,normal,05:30,08:00,', 'OUT200,tech,Colombo,Peliyagoda,mall_bay,mall_dock,09:00,11:00,09:15-10:45'].join('\n');
    const r = await new DataImportService(prisma as any).import('outlets', csv, 'outlets.csv', personas.admin);
    expect(r).toMatchObject({ applied: true, rows: 2, passed: 2, created: 1, updated: 1, problems: [] });
    expect(written[0].update).not.toHaveProperty('accessNote');
    expect(JSON.stringify(prisma.dataImport.create.mock.calls[0][0])).not.toContain('OUT200,tech');
  });

  it('applies nothing when a row fails, and explains each rejected row in plain words', async () => {
    const { prisma } = db();
    const csv = [OUTLETS_HEADER, 'OUT088,fresh,Colombo,Peliyagoda,rear_dock,vans,05:30,08:00,', 'OUT106,fresh,Nuwara Eliya,Kandy,rear_dock,normal,05:30,05:00,'].join('\n');
    const r = await new DataImportService(prisma as any).import('outlets', csv, undefined, personas.admin);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(r.applied).toBe(false);
    expect(r.passed).toBe(0);
    expect(r.problems).toEqual([
      expect.objectContaining({ row: 2, key: 'OUT088', column: 'parking_constraint', value: 'vans' }),
      expect.objectContaining({ row: 3, key: 'OUT106', column: 'window_close_time', value: '05:00' }),
    ]);
  });

  it('flags repeated keys and missing columns', async () => {
    const { prisma } = db();
    const checked = await new DataImportService(prisma as any).check('service_allowance', 'brand,dock_type\nfresh,rear_dock\n');
    expect(checked.problems[0]).toMatchObject({ row: 1, column: 'service_allowance_min' });
    const dup = await new DataImportService(prisma as any).check('district_travel', 'district,depot,depot_to_district_freeflow_min,inter_stop_freeflow_min\nKandy,Kandy,20,8\nKandy,Kandy,21,8\n');
    expect(dup.problems).toEqual([expect.objectContaining({ row: 3, reason: expect.stringMatching(/Repeats row 2/) })]);
  });

  it('maps a mapper reason to its column and a plain sentence', () => {
    expect(columnOf('missing window_close_time', {})).toEqual({ column: 'window_close_time', value: null });
    expect(columnOf('not a time: "5h30"', { window_open_time: '5h30' })).toEqual({ column: 'window_open_time', value: '5h30' });
    expect(plainReason('unknown parking constraint: "van only"')).toMatch(/van_only/);
  });

  it('DataImportsSet.Import passes the file, text and name through for an admin', async () => {
    const imports = { import: jest.fn(async () => ({ id: 'imp-1' })) };
    const set = new DataImportsSet({} as any, imports as any);
    await set.import({ principal: personas.admin, params: { file: 'calendar', csv: 'date\n', fileName: 'cal.csv' }, headers: {} });
    expect(imports.import).toHaveBeenCalledWith('calendar', 'date\n', 'cal.csv', personas.admin);
  });
});
