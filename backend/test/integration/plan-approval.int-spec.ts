/**
 * Plan approval on a real database: POST Plans('…')/Lodestar.Approve as a Kandy
 * dispatcher puts the plan into effect (trips, stops, order statuses, deferral
 * logs) and a later version supersedes it without leaving duplicate trips.
 */
import { AppModule } from '../../apps/planning/src/app.module';
import { bootService, resetDatabase, Service, TokenSigner } from './harness';
import { CLAIMS, createOrder, OUT, seedReference, USERS, VEH } from './fixtures';

const RUN = '2026-10-06';
const NEXT_OPERATING = '2026-10-08'; // 2026-10-07 is closed in the calendar below
const O = { a: 'ORD9100001', b: 'ORD9100002', c: 'ORD9100003' };

let svc: Service;
let signer: TokenSigner;
let dispatcher: string;

/** A dispatcher drafts a plan version over OData (summary carries the agent-style draft). */
async function draft(summary: unknown): Promise<string> {
  const res = await svc.as(dispatcher).post('Plans', { depot: 'KANDY', runDate: `${RUN}T00:00:00Z`, summary });
  expect(res.status).toBe(201);
  return res.body.id;
}

const approve = (id: string, note = 'ok') => svc.as(dispatcher).post(`Plans('${id}')/Lodestar.Approve`, { note });

const tripsOfDay = () =>
  svc.prisma.trip.findMany({
    where: { depot: 'KANDY', runDate: new Date(`${RUN}T00:00:00Z`) },
    include: { stops: { orderBy: { stopSeq: 'asc' } } },
    orderBy: { id: 'asc' },
  });

const V1 = {
  plan: {
    trips: [
      {
        vehicleId: VEH.K1, tripNo: 1, brand: 'FRESH', district: 'Kandy', orderIds: [O.a, O.b], departs: '04:30', returns: '09:15', minutes: 285,
        stops: [
          { seq: 1, orderId: O.a, outletId: OUT.K1, arrive: '05:40', etaModel: '05:45', lateRiskPct: 12 },
          { seq: 2, orderId: O.b, outletId: OUT.K2, arrive: '06:20' },
        ],
      },
    ],
  },
  deferrals: [{ orderId: O.c, reason: 'CAP_REEFER', score: 17.4 }],
};

const V2 = {
  plan: {
    trips: [
      { vehicleId: VEH.K1, tripNo: 1, brand: 'FRESH', district: 'Kandy', orderIds: [O.a], departs: '04:30' },
      { vehicleId: VEH.K2, tripNo: 1, brand: 'FRESH', district: 'Kandy', orderIds: [O.b, O.c], departs: '04:45' },
    ],
  },
  deferrals: [],
};

beforeAll(async () => {
  signer = await TokenSigner.create();
  svc = await bootService(AppModule, signer);
  dispatcher = await signer.sign(CLAIMS.dispatcherKandy);
});

afterAll(() => svc?.close());

beforeEach(async () => {
  await resetDatabase(svc.prisma);
  await seedReference(svc.prisma);
  await svc.prisma.calendar.createMany({
    data: [
      { date: new Date('2026-10-07T00:00:00Z'), isOperating: false },
      { date: new Date(`${NEXT_OPERATING}T00:00:00Z`), isOperating: true },
    ],
  });
  await createOrder(svc.prisma, O.a, OUT.K1, RUN);
  await createOrder(svc.prisma, O.b, OUT.K2, RUN);
  await createOrder(svc.prisma, O.c, OUT.K1, RUN, { daysSince: 2 });
  svc.notify.notices.length = 0;
  svc.notify.publishes.length = 0;
});

describe('Plans approval (planning service, real Postgres)', () => {
  it('approving a plan creates its trips and stops, plans the served orders and logs the deferral', async () => {
    const v1 = await draft(V1);
    expect(v1).toBe(`PLK-${RUN}-v1`);

    const res = await approve(v1, 'first cut');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: v1, status: 'PUBLISHED', approvedBy: USERS.dispatcherKandy, notes: 'first cut' });

    const plan = await svc.prisma.plan.findUniqueOrThrow({ where: { id: v1 } });
    expect(plan.status).toBe('PUBLISHED');
    expect(plan.approvedAt).not.toBeNull();

    const trips = await tripsOfDay();
    expect(trips).toHaveLength(1);
    const [trip] = trips;
    expect(trip).toMatchObject({
      id: `TRP-${VEH.K1}-20261006-1`, vehicleId: VEH.K1, driverId: USERS.driverK1, planId: v1, planVersion: 1,
      status: 'PLANNED', bay: 'K1', tripNumber: 1, planMinutes: 285,
    });
    // 04:30 and 09:15 in Colombo (UTC+05:30) on the run day
    expect(trip.departTime?.toISOString()).toBe('2026-10-05T23:00:00.000Z');
    expect(trip.returnTime?.toISOString()).toBe('2026-10-06T03:45:00.000Z');
    expect(trip.stops.map((s) => [s.stopSeq, s.orderId, s.outletId, s.status])).toEqual([
      [1, O.a, OUT.K1, 'PLANNED'],
      [2, O.b, OUT.K2, 'PLANNED'],
    ]);
    expect(trip.stops[0].etaPlan?.toISOString()).toBe('2026-10-06T00:10:00.000Z');
    expect(trip.stops[0].etaModel?.toISOString()).toBe('2026-10-06T00:15:00.000Z');
    expect(trip.stops[0].lateRiskPct).toBe(12);

    const orders = await svc.prisma.order.findMany({ orderBy: { id: 'asc' } });
    expect(orders.map((o) => [o.id, o.status])).toEqual([
      [O.a, 'PLANNED'],
      [O.b, 'PLANNED'],
      [O.c, 'DEFERRED'],
    ]);
    const deferred = orders[2];
    expect(deferred.runDate.toISOString()).toBe(`${NEXT_OPERATING}T00:00:00.000Z`);
    expect(deferred.deferredYesterday).toBe(true);
    expect(deferred.daysSince).toBe(3);

    const log = await svc.prisma.deferralLog.findUniqueOrThrow({ where: { orderId: O.c } });
    expect(log).toMatchObject({ status: 'CONFIRMED', reason: 'CAP_REEFER', score: 17, planId: v1 });
    expect(log.rescheduledDate?.toISOString()).toBe(`${NEXT_OPERATING}T00:00:00.000Z`);

    // the stores, the dock and the driver are told after the commit
    expect(svc.notify.notices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ recipientId: USERS.storeK1, type: 'PLAN_PUBLISHED', outletId: OUT.K1 }),
        expect.objectContaining({ recipientId: USERS.storeK2, type: 'PLAN_PUBLISHED', outletId: OUT.K2 }),
        expect.objectContaining({ recipientId: USERS.storeK1, type: 'ORDER_DEFERRED', payload: expect.objectContaining({ orderId: O.c, rescheduledDate: NEXT_OPERATING }) }),
      ]),
    );
    expect(svc.notify.publishes).toHaveLength(1);
    expect(svc.notify.publishes[0].rooms).toEqual(expect.arrayContaining(['dispatcher:KANDY', 'loader:KANDY', `driver:${USERS.driverK1}`]));
  });

  it('a second approval supersedes the first: one set of trips, the deferred order is brought back', async () => {
    const v1 = await draft(V1);
    expect((await approve(v1)).status).toBe(200);
    const v2 = await draft(V2);
    expect(v2).toBe(`PLK-${RUN}-v2`);

    const res = await approve(v2);
    expect(res.status).toBe(200);

    const plans = await svc.prisma.plan.findMany({ orderBy: { version: 'asc' } });
    expect(plans.map((p) => [p.id, p.status])).toEqual([
      [v1, 'SUPERSEDED'],
      [v2, 'PUBLISHED'],
    ]);

    const trips = await tripsOfDay();
    expect(trips.map((t) => [t.id, t.planId, t.planVersion, t.stops.map((s) => s.orderId)])).toEqual([
      [`TRP-${VEH.K1}-20261006-1`, v2, 2, [O.a]],
      [`TRP-${VEH.K2}-20261006-1`, v2, 2, [O.b, O.c]],
    ]);
    // no trips or stops of v1 are left behind
    expect(await svc.prisma.trip.count({ where: { planId: v1 } })).toBe(0);
    expect(await svc.prisma.tripStop.count()).toBe(3);

    const c = await svc.prisma.order.findUniqueOrThrow({ where: { id: O.c }, include: { deferralLog: true } });
    expect(c.status).toBe('PLANNED');
    expect(c.runDate.toISOString()).toBe(`${RUN}T00:00:00.000Z`);
    expect(c.deferredYesterday).toBe(false);
    expect(c.daysSince).toBe(2);
    expect(c.deferralLog).toMatchObject({ status: 'REVERSED', notes: `Placed by ${v2}` });
    expect(svc.notify.publishes.at(-1)?.payload).toMatchObject({ planId: v2, trips: 2, planned: 3, deferred: 0, supersededTrips: 1 });
  });

  it('a published or superseded plan cannot be approved again (no extra trips)', async () => {
    const v1 = await draft(V1);
    expect((await approve(v1)).status).toBe(200);
    const again = await approve(v1);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('Conflict');

    const v2 = await draft(V2);
    expect((await approve(v2)).status).toBe(200);
    const stale = await approve(v1);
    expect(stale.status).toBe(409);

    expect(await svc.prisma.trip.count()).toBe(2);
    expect((await svc.prisma.plan.findUniqueOrThrow({ where: { id: v1 } })).status).toBe('SUPERSEDED');
  });

  it('a trip that has started loading is kept, and its orders stay on it, when a new version is approved', async () => {
    const v1 = await draft(V1);
    expect((await approve(v1)).status).toBe(200);
    const loadingId = `TRP-${VEH.K1}-20261006-1`;
    await svc.prisma.trip.update({ where: { id: loadingId }, data: { status: 'LOADING' } });

    // v3 would move both of the started trip's orders onto another vehicle
    const v2 = await draft({
      plan: { trips: [{ vehicleId: VEH.K2, tripNo: 1, brand: 'FRESH', district: 'Kandy', orderIds: [O.a, O.b, O.c], departs: '05:00' }] },
      deferrals: [],
    });
    expect((await approve(v2)).status).toBe(200);

    const trips = await tripsOfDay();
    expect(trips.map((t) => [t.id, t.status, t.planId, t.stops.map((s) => s.orderId)])).toEqual([
      [loadingId, 'LOADING', v1, [O.a, O.b]],
      [`TRP-${VEH.K2}-20261006-1`, 'PLANNED', v2, [O.c]],
    ]);
  });

  it('a plan without a drafted trip list is refused and changes nothing', async () => {
    const id = await draft({ note: 'capacity picture only' });
    const res = await approve(id);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PlanNotExecutable');
    expect((await svc.prisma.plan.findUniqueOrThrow({ where: { id } })).status).toBe('DRAFT');
    expect(await svc.prisma.trip.count()).toBe(0);
    expect((await svc.prisma.order.findMany()).every((o) => o.status === 'RECEIVED')).toBe(true);
  });
});
