import { anything, capture, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { generateSynthetic } from './synthetic';
import { CHUNK, ReferenceDb, UpsertDelegate, upsertArgs, writeReference } from './writer';
import { counts, fakePrisma } from './testing/fake-prisma';

describe('upsertArgs', () => {
  it('keys each table by its unique column and keeps overlay columns create-only', () => {
    const date = new Date('2031-01-01T00:00:00.000Z');
    const cal = upsertArgs('calendar', { date, isOperating: true, note: 'synthetic' });
    expect(cal.where).toEqual({ date });
    expect(cal.create).toMatchObject({ note: 'synthetic' });
    expect(cal.update).toEqual({ isOperating: true });

    const sa = upsertArgs('serviceAllowance', { brand: 'FRESH', dockType: 'STREET', minutes: 9 });
    expect(sa.where).toEqual({ brand_dockType: { brand: 'FRESH', dockType: 'STREET' } });
    expect(sa.update).toEqual({ minutes: 9 });

    const v = upsertArgs('vehicle', { id: 'VEH1', capacityKg: 5, status: 'WORKSHOP', usedLThisWeek: 3 });
    expect(v.update).toEqual({ capacityKg: 5 });

    expect(upsertArgs('districtTravel', { district: 'D', depot: 'KANDY' }).where).toEqual({ district: 'D' });
  });
});

describe('writeReference (ts-mockito)', () => {
  it('upserts every row once, through each delegate', async () => {
    const data = generateSynthetic({ seed: 11 });
    const mocks = {
      districtTravel: mock<UpsertDelegate>(),
      serviceAllowance: mock<UpsertDelegate>(),
      calendar: mock<UpsertDelegate>(),
      outlet: mock<UpsertDelegate>(),
      vehicle: mock<UpsertDelegate>(),
    };
    for (const m of Object.values(mocks)) when(m.upsert(anything())).thenResolve({});
    const db: ReferenceDb = {
      districtTravel: instance(mocks.districtTravel),
      serviceAllowance: instance(mocks.serviceAllowance),
      calendar: instance(mocks.calendar),
      outlet: instance(mocks.outlet),
      vehicle: instance(mocks.vehicle),
    };

    const written = await writeReference(db, data);

    expect(data.calendar.length).toBeGreaterThan(CHUNK); // exercises batching
    verify(mocks.calendar.upsert(anything())).times(data.calendar.length);
    verify(mocks.outlet.upsert(anything())).times(data.outlets.length);
    verify(mocks.vehicle.upsert(anything())).times(data.vehicles.length);
    verify(mocks.serviceAllowance.upsert(anything())).times(9);
    verify(mocks.districtTravel.upsert(anything())).times(data.districts.length);
    expect(written.calendar).toBe(data.calendar.length);

    const vehicle057 = data.vehicles.find((v) => v.id === 'VEH057')!;
    verify(mocks.vehicle.upsert(deepEqual(upsertArgs('vehicle', vehicle057)))).once();
    const [firstArgs] = capture(mocks.calendar.upsert).first();
    expect(firstArgs.update).not.toHaveProperty('note');
  });
});

describe('writeReference (in-memory fake)', () => {
  it('is idempotent and preserves overlay columns on re-run', async () => {
    const db = fakePrisma();
    const data = generateSynthetic({ seed: 11 });
    await writeReference(db as any, data);
    const first = counts(db);

    // Simulate the scenario / live system editing overlay columns.
    await db.vehicle.update({ where: { id: 'VEH004' }, data: { status: 'WORKSHOP', usedLThisWeek: 99 } });
    await db.calendar.update({ where: { date: data.calendar[8].date }, data: { note: 'ours' } });

    await writeReference(db as any, generateSynthetic({ seed: 11 }));
    expect(counts(db)).toEqual(first);
    expect(await db.vehicle.findUnique({ where: { id: 'VEH004' } })).toMatchObject({ status: 'WORKSHOP', usedLThisWeek: 99 });
    expect((await db.calendar.findUnique({ where: { date: data.calendar[8].date } })).note).toBe('ours');
  });

  it('refreshes CSV-owned columns when the source changes', async () => {
    const db = fakePrisma();
    const data = generateSynthetic({ seed: 11 });
    await writeReference(db as any, data);
    const changed = { ...data, allowances: data.allowances.map((a) => ({ ...a, minutes: 1 })) };
    await writeReference(db as any, changed);
    expect(db.serviceAllowance.rows.every((r) => r.minutes === 1)).toBe(true);
  });
});
