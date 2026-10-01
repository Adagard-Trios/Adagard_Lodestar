import { applyScenario } from '../scenario';
import { ALWAYS_AVAILABLE, buildDemoDay, colomboToday, demoOrderId, peakOrdersFromCsv, resolveDemoDate, workshopFromCsv } from './demo-day';
import { writeDemoDay } from './demo-writer';
import { generateSynthetic } from './synthetic';
import { counts, fakePrisma } from './testing/fake-prisma';
import { writeReference } from './writer';

const quiet = () => undefined;
const ref = generateSynthetic({ seed: 1 });
const outlets = ref.outlets.map((o) => ({ id: o.id, brand: o.brand, depot: o.depot }));
const vehicles = ref.vehicles.map((v) => ({ id: v.id, depot: v.depot, type: v.type, tempClass: v.tempClass, capacityM3: v.capacityM3 }));
const DATE = '2026-10-02';

describe('demo clock', () => {
  it('uses DEMO_DATE when set and rejects a malformed one', () => {
    expect(resolveDemoDate({ DEMO_DATE: '2026-11-03' }, () => true)).toBe('2026-11-03');
    expect(() => resolveDemoDate({ DEMO_DATE: '3 Nov' }, () => true)).toThrow(/YYYY-MM-DD/);
  });

  it('defaults to today in Sri Lanka, moved past closed days', () => {
    const now = new Date('2026-10-03T20:00:00Z'); // Sun 4 Oct 01:30 in Colombo
    expect(colomboToday(now)).toBe('2026-10-04');
    expect(resolveDemoDate({}, (d) => d !== '2026-10-04', now)).toBe('2026-10-05');
    expect(resolveDemoDate({ DEMO_DATE: '  ' }, () => null, now)).toBe('2026-10-04');
  });
});

describe('buildDemoDay (no peak files: generated)', () => {
  const day = buildDemoDay({ date: DATE, seed: 1, outlets, vehicles });

  it('is an over-capacity day: 100+ orders, three brands, both depots, unique ids on the date', () => {
    expect(day.orders.length).toBeGreaterThanOrEqual(100);
    expect(new Set(day.orders.map((o) => o.brand))).toEqual(new Set(['FRESH', 'STYLE', 'TECH']));
    expect(new Set(day.orders.map((o) => o.id)).size).toBe(day.orders.length);
    expect(day.orders.every((o) => o.id.startsWith('ORD261002'))).toBe(true);
    const depotOf = new Map(outlets.map((o) => [o.id, o.depot]));
    expect(new Set(day.orders.map((o) => depotOf.get(o.outletId)))).toEqual(new Set(['KANDY', 'PELIYAGODA']));
  });

  it('includes the personas\' stores and outlets skipped yesterday', () => {
    expect(day.orders.filter((o) => o.outletId === 'OUT106').map((o) => o.tempClass).sort()).toEqual(['AMBIENT', 'CHILLED']);
    expect(day.orders.find((o) => o.outletId === 'OUT108')).toMatchObject({ deferredYesterday: true, daysSince: 2 });
    expect(day.orders.filter((o) => o.deferredYesterday).length).toBeGreaterThan(1);
  });

  it('orders were placed before the 4:00 PM cut-off the day before, with line items that add up', () => {
    for (const o of day.orders) {
      expect(o.orderedAt.getTime()).toBeLessThan(Date.parse('2026-10-01T16:00:00+05:30'));
      expect(o.lineItems.reduce((n, l) => n + l.qty, 0)).toBe(o.units);
      expect(o.lineItems.every((l) => l.tempClass === o.tempClass)).toBe(true);
    }
  });

  it('sends the big Peliyagoda reefers to the workshop, never the driver persona\'s van', () => {
    expect(day.workshop.length).toBeGreaterThan(0);
    expect(day.workshop.length).toBeLessThanOrEqual(10);
    expect(day.workshop.map((w) => w.vehicleId)).not.toContain(ALWAYS_AVAILABLE[0]);
    const v = new Map(vehicles.map((x) => [x.id, x]));
    expect(day.workshop.every((w) => v.get(w.vehicleId)!.depot === 'PELIYAGODA')).toBe(true);
    expect(day.workshop.some((w) => v.get(w.vehicleId)!.tempClass === 'CHILLED')).toBe(true);
  });

  it('is deterministic and moves with the date', () => {
    expect(buildDemoDay({ date: DATE, seed: 1, outlets, vehicles }).orders).toEqual(day.orders);
    expect(buildDemoDay({ date: '2027-01-12', seed: 1, outlets, vehicles }).orders[0].id).toBe(demoOrderId('2027-01-12', 1));
  });
});

describe('peak-day files', () => {
  // made-up rows in the competition file's shape
  const ORDERS = [
    'scenario,order_ref,outlet_id,brand,district,depot,dock_type,parking_constraint,mall_window,window_open_time,window_close_time,temp_requirement,order_units,order_weight_kg,order_volume_m3,deferred_yesterday,days_since_last_served',
    'S1,R1,OUT010,Fresh,X,Peliyagoda,rear_dock,normal,0,05:00,08:00,chilled,12,100,0.5,1,2',
    'S1,R2,OUT011,Tech,X,Peliyagoda,mall_bay,mall_dock,1,10:00,12:00,ambient,4,30,0.2,0,1',
    'S1,R3,OUT999,Fresh,X,Peliyagoda,street,normal,0,05:00,08:00,chilled,3,20,0.1,0,1',
    'S2,R4,OUT012,Fresh,X,Peliyagoda,street,normal,0,05:00,08:00,ambient,3,20,0.1,0,1',
  ].join('\n');
  const FLEET = 'scenario,vehicle_id,status\nS1,VEH001,in_workshop\nS1,VEH002,available\nS1,VEH057,in_workshop\nS2,VEH003,in_workshop\n';

  it('reads scenario S1 orders and reports outlets it does not know', () => {
    const res = peakOrdersFromCsv(ORDERS, new Map(outlets.map((o) => [o.id, o])));
    expect(res.rows.map((r) => [r.outletId, r.tempClass, r.units, r.deferredYesterday, r.daysSince])).toEqual([
      ['OUT010', 'CHILLED', 12, true, 2],
      ['OUT011', 'AMBIENT', 4, false, 1],
    ]);
    expect(res.skipped).toEqual([expect.stringContaining('OUT999')]);
  });

  it('reads the S1 workshop list and keeps the driver persona\'s van on the road', () => {
    expect(workshopFromCsv(FLEET)).toEqual(['VEH001', 'VEH057']);
    const day = buildDemoDay({ date: DATE, seed: 1, outlets, vehicles, peak: { orders: ORDERS, fleet: FLEET } });
    expect(day.source).toEqual({ peliyagoda: 'csv', fleet: 'csv' });
    expect(day.workshop.map((w) => w.vehicleId)).toEqual(['VEH001']);
  });
});

describe('writeDemoDay', () => {
  async function seeded() {
    const db = fakePrisma();
    await writeReference(db as any, ref);
    await applyScenario(db as any, quiet);
    return db;
  }

  it('writes open orders without trips, a calendar around the day, the fleet and a driver for every vehicle', async () => {
    const db = await seeded();
    const tripsBefore = db.trip.rows.length;
    const day = buildDemoDay({ date: DATE, seed: 1, outlets, vehicles });
    const s = await writeDemoDay(db as any, day, vehicles);

    expect(s.ordersCreated).toBe(day.orders.length);
    const mine = db.order.rows.filter((o) => o.id.startsWith('ORD261002'));
    expect(mine.every((o) => o.status === 'RECEIVED' && o.runDate.toISOString() === '2026-10-02T00:00:00.000Z')).toBe(true);
    expect(db.trip.rows.length).toBe(tripsBefore); // nothing started
    expect(db.deferralLog.rows.filter((d) => d.orderId.startsWith('ORD261002')).length).toBe(day.orders.filter((o) => o.deferredYesterday).length);

    expect(db.calendar.rows.find((c) => c.date.toISOString().startsWith(DATE))).toMatchObject({ isOperating: true });
    expect(db.calendar.rows.find((c) => c.date.toISOString().startsWith('2026-10-04'))).toMatchObject({ isOperating: false }); // Sunday

    expect(db.vehicle.rows.filter((v) => v.status === 'WORKSHOP').map((v) => v.id).sort()).toEqual(day.workshop.map((w) => w.vehicleId).sort());
    const drivers = db.user.rows.filter((u) => u.role === 'DRIVER');
    expect(new Set(drivers.map((u) => u.vehicleId))).toEqual(new Set(vehicles.map((v) => v.id)));
  });

  it('never overwrites a day already in progress (orders, fleet changes) on a re-run', async () => {
    const db = await seeded();
    const day = buildDemoDay({ date: DATE, seed: 1, outlets, vehicles });
    await writeDemoDay(db as any, day, vehicles);
    const first = JSON.stringify(counts(db));
    Object.assign(db.order.rows.find((o) => o.id === day.orders[0].id)!, { status: 'PLANNED' });
    Object.assign(db.vehicle.rows.find((v) => v.id === 'VEH057')!, { status: 'WORKSHOP' });

    const again = await writeDemoDay(db as any, day, vehicles);
    expect(again).toMatchObject({ ordersCreated: 0, ordersKept: day.orders.length, workshop: [] });
    expect(JSON.stringify(counts(db))).toBe(first);
    expect(db.order.rows.find((o) => o.id === day.orders[0].id)!.status).toBe('PLANNED');
    expect(db.vehicle.rows.find((v) => v.id === 'VEH057')!.status).toBe('WORKSHOP');
  });
});
