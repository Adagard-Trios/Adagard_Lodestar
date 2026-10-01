/**
 * Authorisation matrix on a real database: each role is refused another role's
 * actions and another scope's data (RBAC in the guard/engine, ABAC row filters
 * translated to SQL by Prisma). Every refusal also checks the data did not change.
 *
 *   store manager  own outlet only; never plans
 *   loader         own depot; reads plans but cannot approve them or place orders
 *   driver         own vehicle's trips only; no plans
 *   dispatcher     own depots only
 */
import { AppModule as OrdersApp } from '../../apps/orders/src/app.module';
import { AppModule as PlanningApp } from '../../apps/planning/src/app.module';
import { AppModule as TripsApp } from '../../apps/trips/src/app.module';
import { runDateValue } from '@lodestar/platform';
import { bootService, resetDatabase, Service, TokenSigner } from './harness';
import { CLAIMS, createOrder, DEV, OUT, seedReference, USERS, VEH } from './fixtures';

const RUN = '2027-01-12'; // far ahead of the cut-off, so store orders are otherwise allowed
const O = { k1: 'ORD9300001', k2: 'ORD9300002', p1: 'ORD9300003' };
const PLAN = { kandy: `PLK-${RUN}-v1`, peliyagoda: `PLG-${RUN}-v1` };
const TRIP = { k1: `TRP-${VEH.K1}-20270112-1`, k2: `TRP-${VEH.K2}-20270112-1`, p1: `TRP-${VEH.P1}-20270112-1` };

let orders: Service;
let planning: Service;
let trips: Service;
const tok: Record<string, string> = {};

const draftSummary = { plan: { trips: [{ vehicleId: VEH.K1, tripNo: 2, brand: 'FRESH', district: 'Kandy', orderIds: [O.k1] }] } };

const ids = (res: any) => (res.body.value as { id: string }[]).map((r) => r.id).sort();
const planStatus = async (id: string) => (await planning.prisma.plan.findUniqueOrThrow({ where: { id } })).status;
const newOrder = (outletId: string) => ({ outletId, runDate: `${RUN}T00:00:00Z`, brand: 'FRESH', tempClass: 'CHILLED', units: 5, kg: 10, m3: 0.4 });

beforeAll(async () => {
  const signer = await TokenSigner.create();
  [orders, planning, trips] = [await bootService(OrdersApp, signer), await bootService(PlanningApp, signer), await bootService(TripsApp, signer)];
  for (const [name, claims] of Object.entries(CLAIMS)) tok[name] = await signer.sign(claims);

  const db = orders.prisma;
  await resetDatabase(db);
  await seedReference(db);
  await createOrder(db, O.k1, OUT.K1, RUN);
  await createOrder(db, O.k2, OUT.K2, RUN);
  await createOrder(db, O.p1, OUT.P1, RUN);
  const trip = (id: string, vehicleId: string, depot: 'KANDY' | 'PELIYAGODA', driverId: string | null, orderId: string, outletId: string) =>
    db.trip.create({
      data: { id, vehicleId, driverId, depot, runDate: runDateValue(RUN), brand: 'FRESH', district: 'X', stops: { create: [{ orderId, outletId, stopSeq: 1 }] } },
    });
  await trip(TRIP.k1, VEH.K1, 'KANDY', USERS.driverK1, O.k1, OUT.K1);
  await trip(TRIP.k2, VEH.K2, 'KANDY', USERS.driverK2, O.k2, OUT.K2);
  await trip(TRIP.p1, VEH.P1, 'PELIYAGODA', null, O.p1, OUT.P1);
  const plan = (id: string, depot: 'KANDY' | 'PELIYAGODA') =>
    db.plan.create({ data: { id, depot, runDate: runDateValue(RUN), version: 1, status: 'NEEDS_APPROVAL', source: 'AGENT', summary: draftSummary } });
  await plan(PLAN.kandy, 'KANDY');
  await plan(PLAN.peliyagoda, 'PELIYAGODA');
});

afterAll(async () => {
  await Promise.all([orders, planning, trips].map((s) => s?.close()));
});

describe('store manager (outlet IT-OUT-K1)', () => {
  it("reads only its own outlet's orders; another outlet's order is not found", async () => {
    const list = await orders.as(tok.storeK1).get('Orders');
    expect(list.status).toBe(200);
    expect(ids(list)).toEqual([O.k1]);
    expect((await orders.as(tok.storeK1).get(`Orders('${O.k2}')`)).status).toBe(404);
  });

  it('cannot place or edit an order for another outlet', async () => {
    const create = await orders.as(tok.storeK1).post('Orders', newOrder(OUT.K2));
    expect(create.status).toBe(403);
    expect(await orders.prisma.order.count({ where: { outletId: OUT.K2 } })).toBe(1);

    const edit = await orders.as(tok.storeK1).patch(`Orders('${O.k2}')`, { units: 99 });
    expect(edit.status).toBe(404);
    expect((await orders.prisma.order.findUniqueOrThrow({ where: { id: O.k2 } })).units).toBe(10);
  });

  it('cannot read or approve plans', async () => {
    expect((await planning.as(tok.storeK1).get('Plans')).status).toBe(403);
    const approve = await planning.as(tok.storeK1).post(`Plans('${PLAN.kandy}')/Lodestar.Approve`, {});
    expect(approve.status).toBe(403);
    expect(await planStatus(PLAN.kandy)).toBe('NEEDS_APPROVAL');
  });

  it('cannot change an order status (dispatch/field action)', async () => {
    const res = await orders.as(tok.storeK1).post(`Orders('${O.k1}')/Lodestar.SetStatus`, { status: 'DELIVERED' });
    expect(res.status).toBe(403);
    expect((await orders.prisma.order.findUniqueOrThrow({ where: { id: O.k1 } })).status).toBe('RECEIVED');
  });
});

describe('loader (depot KANDY)', () => {
  it("reads its depot's plans only and cannot approve or reject one", async () => {
    const list = await planning.as(tok.loaderKandy).get('Plans');
    expect(list.status).toBe(200);
    expect(ids(list)).toEqual([PLAN.kandy]);

    expect((await planning.as(tok.loaderKandy).post(`Plans('${PLAN.kandy}')/Lodestar.Approve`, {})).status).toBe(403);
    expect((await planning.as(tok.loaderKandy).post(`Plans('${PLAN.kandy}')/Lodestar.Reject`, {})).status).toBe(403);
    expect(await planStatus(PLAN.kandy)).toBe('NEEDS_APPROVAL');
    expect(await planning.prisma.trip.count({ where: { planId: PLAN.kandy } })).toBe(0);
  });

  it('cannot place orders or create plans', async () => {
    expect((await orders.as(tok.loaderKandy).post('Orders', newOrder(OUT.K1))).status).toBe(403);
    expect((await planning.as(tok.loaderKandy).post('Plans', { depot: 'KANDY', runDate: `${RUN}T00:00:00Z` })).status).toBe(403);
    expect(await orders.prisma.order.count()).toBe(3);
    expect(await planning.prisma.plan.count()).toBe(2);
  });

  it("does not see the other depot's trips", async () => {
    const list = await trips.as(tok.loaderKandy).get('Trips');
    expect(ids(list)).toEqual([TRIP.k1, TRIP.k2]);
    expect((await trips.as(tok.loaderKandy).get(`Trips('${TRIP.p1}')`)).status).toBe(404);
  });
});

describe('driver (vehicle IT-VEH-K1, bound phone)', () => {
  const asDriver = (svc: Service) => svc.as(tok.driverK1, DEV.K1);

  it("reads only its own vehicle's trips; another driver's trip is not found", async () => {
    const list = await asDriver(trips).get('Trips');
    expect(list.status).toBe(200);
    expect(ids(list)).toEqual([TRIP.k1]);
    expect((await asDriver(trips).get(`Trips('${TRIP.k2}')`)).status).toBe(404);
    const stops = await asDriver(trips).get('TripStops');
    expect((stops.body.value as any[]).map((s) => s.tripId)).toEqual([TRIP.k1]);
  });

  it("cannot change the status of another driver's trip", async () => {
    const res = await asDriver(trips).post(`Trips('${TRIP.k2}')/Lodestar.SetStatus`, { status: 'ENROUTE' });
    expect(res.status).toBe(404);
    expect((await trips.prisma.trip.findUniqueOrThrow({ where: { id: TRIP.k2 } })).status).toBe('PLANNED');
  });

  it("reads only orders on its own trips, and cannot approve plans", async () => {
    expect(ids(await asDriver(orders).get('Orders'))).toEqual([O.k1]);
    expect((await asDriver(planning).post(`Plans('${PLAN.kandy}')/Lodestar.Approve`, {})).status).toBe(403);
    expect(await planStatus(PLAN.kandy)).toBe('NEEDS_APPROVAL');
  });
});

describe('dispatcher (depot KANDY)', () => {
  it("sees only its depot's orders, plans and trips", async () => {
    expect(ids(await orders.as(tok.dispatcherKandy).get('Orders'))).toEqual([O.k1, O.k2]);
    expect(ids(await planning.as(tok.dispatcherKandy).get('Plans'))).toEqual([PLAN.kandy]);
    expect(ids(await trips.as(tok.dispatcherKandy).get('Trips'))).toEqual([TRIP.k1, TRIP.k2]);
    expect((await trips.as(tok.dispatcherKandy).get(`Trips('${TRIP.p1}')`)).status).toBe(404);
  });

  it("cannot approve another depot's plan or auto-plan it", async () => {
    const approve = await planning.as(tok.dispatcherKandy).post(`Plans('${PLAN.peliyagoda}')/Lodestar.Approve`, {});
    expect(approve.status).toBe(404);
    expect(await planStatus(PLAN.peliyagoda)).toBe('NEEDS_APPROVAL');
    expect(await planning.prisma.trip.count({ where: { planId: PLAN.peliyagoda } })).toBe(0);

    const auto = await planning.as(tok.dispatcherKandy).post('Plans/Lodestar.AutoPlan', { depot: 'PELIYAGODA', runDate: RUN });
    expect(auto.status).toBe(403);
    expect(await planning.prisma.plan.count({ where: { depot: 'PELIYAGODA' } })).toBe(1);

    const board = await planning.as(tok.dispatcherKandy).get(`Plans/Lodestar.Board(depot='PELIYAGODA',runDate=${RUN})`);
    expect(board.status).toBe(403);
  });

  it("cannot place orders for another depot's outlet or draft a plan for it", async () => {
    expect((await orders.as(tok.dispatcherKandy).post('Orders', newOrder(OUT.P1))).status).toBe(403);
    expect((await planning.as(tok.dispatcherKandy).post('Plans', { depot: 'PELIYAGODA', runDate: `${RUN}T00:00:00Z` })).status).toBe(403);
    expect(await orders.prisma.order.count({ where: { outletId: OUT.P1 } })).toBe(1);
    expect(await planning.prisma.plan.count({ where: { depot: 'PELIYAGODA' } })).toBe(1);
  });

  it("cannot change another depot's order status", async () => {
    const res = await orders.as(tok.dispatcherKandy).post(`Orders('${O.p1}')/Lodestar.SetStatus`, { status: 'CANCELLED' });
    expect(res.status).toBe(404);
    expect((await orders.prisma.order.findUniqueOrThrow({ where: { id: O.p1 } })).status).toBe('RECEIVED');
  });
});
