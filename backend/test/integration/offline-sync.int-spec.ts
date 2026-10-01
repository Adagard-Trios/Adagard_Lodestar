/**
 * Offline sync on a real database: POST OfflineEvents/Lodestar.PushBatch from a
 * driver's bound phone (field token + X-Device-Id, device ACTIVE in the registry).
 * Replays are idempotent, events are applied in saved order whatever the batch
 * order, and the "field evidence wins" conflict rule reverses a provisional deferral.
 */
import { AppModule } from '../../apps/sync/src/app.module';
import { LEAVE_WITHOUT_POD } from '../../apps/sync/src/sync.service';
import { runDateValue } from '@lodestar/platform';
import { bootService, resetDatabase, Service, TokenSigner } from './harness';
import { CLAIMS, createOrder, DEV, OUT, seedReference, USERS, VEH } from './fixtures';

const RUN = '2026-10-06';
const TRIP = `TRP-${VEH.K1}-20261006-1`;
const O = { a: 'ORD9200001', b: 'ORD9200002' };

let svc: Service;
let driver: string;
let otherDriver: string;

const push = (events: unknown[], token = driver, device: string = DEV.K1) =>
  svc.as(token, device).post('OfflineEvents/Lodestar.PushBatch', { events });

const stop = (seq: number) => svc.prisma.tripStop.findFirstOrThrow({ where: { tripId: TRIP, stopSeq: seq }, include: { pod: true } });

/** The day's queue as the phone saved it (two stops; the second one's order was provisionally deferred). */
const QUEUE = [
  { id: 'evt-it-arrival-1', tripId: TRIP, eventType: 'ARRIVAL', savedAt: '2026-10-06T00:05:00Z', payload: { stopSeq: 1 } },
  { id: 'evt-it-pod-1', tripId: TRIP, eventType: 'POD_SAVE', savedAt: '2026-10-06T00:20:00Z', payload: { orderId: O.a, units: 10, unitsOrdered: 10, receiverName: 'Store lead' } },
  { id: 'evt-it-leave-1', tripId: TRIP, eventType: 'LEAVE', savedAt: '2026-10-06T00:25:00Z', payload: { stopSeq: 1 } },
  { id: 'evt-it-arrival-2', tripId: TRIP, eventType: 'ARRIVAL', savedAt: '2026-10-06T01:00:00Z', payload: { stopSeq: 2 } },
  { id: 'evt-it-pod-2', tripId: TRIP, eventType: 'POD_SAVE', savedAt: '2026-10-06T01:15:00Z', payload: { orderId: O.b, units: 8, unitsOrdered: 9, exceptions: ['SHORT:one case damaged'] } },
];

beforeAll(async () => {
  const signer = await TokenSigner.create();
  svc = await bootService(AppModule, signer);
  driver = await signer.sign(CLAIMS.driverK1);
  otherDriver = await signer.sign(CLAIMS.driverK2);
});

afterAll(() => svc?.close());

beforeEach(async () => {
  await resetDatabase(svc.prisma);
  await seedReference(svc.prisma);
  await createOrder(svc.prisma, O.a, OUT.K1, RUN, { status: 'ENROUTE' });
  await createOrder(svc.prisma, O.b, OUT.K2, RUN, { status: 'ENROUTE' });
  await svc.prisma.trip.create({
    data: {
      id: TRIP, vehicleId: VEH.K1, driverId: USERS.driverK1, depot: 'KANDY', runDate: runDateValue(RUN), brand: 'FRESH', district: 'Kandy', status: 'ENROUTE',
      stops: { create: [{ orderId: O.a, outletId: OUT.K1, stopSeq: 1, status: 'ENROUTE' }, { orderId: O.b, outletId: OUT.K2, stopSeq: 2, status: 'ENROUTE' }] },
    },
  });
  // During the blackout dispatch provisionally deferred the second order.
  await svc.prisma.deferralLog.create({ data: { orderId: O.b, reason: 'CAP_TIME', score: 20, status: 'CONFIRMED', isProvisional: true } });
});

describe('OfflineEvents/Lodestar.PushBatch (sync service, real Postgres)', () => {
  it('applies a queued day, delivers both stops and reverses the provisional deferral (field evidence wins)', async () => {
    const res = await push(QUEUE);
    expect(res.status).toBe(200);
    expect(res.body.value).toMatchObject({ synced: 5, duplicates: 0, rejected: 0, conflicts: 1, needsReview: 0 });

    const s1 = await stop(1);
    expect(s1.status).toBe('DELIVERED');
    expect(s1.arrivalActual?.toISOString()).toBe('2026-10-06T00:05:00.000Z');
    expect(s1.leaveActual?.toISOString()).toBe('2026-10-06T00:25:00.000Z');
    expect(s1.pod).toMatchObject({ unitsDelivered: 10, unitsOrdered: 10, receiverName: 'Store lead', savedOffline: true });

    const s2 = await stop(2);
    expect(s2.status).toBe('DELIVERED');
    expect(s2.pod).toMatchObject({ unitsDelivered: 8, unitsOrdered: 9, exceptions: [{ type: 'SHORT', description: 'one case damaged', photoUrl: null }] });

    const orders = await svc.prisma.order.findMany({ orderBy: { id: 'asc' } });
    expect(orders.map((o) => o.status)).toEqual(['DELIVERED', 'DELIVERED']);

    const deferral = await svc.prisma.deferralLog.findUniqueOrThrow({ where: { orderId: O.b } });
    expect(deferral.status).toBe('REVERSED');

    const events = await svc.prisma.offlineEvent.findMany({ orderBy: { savedAt: 'asc' } });
    expect(events.map((e) => e.id)).toEqual(QUEUE.map((e) => e.id));
    expect(events.every((e) => e.driverId === USERS.driverK1 && e.syncedAt)).toBe(true);
    const conflict = events.find((e) => e.id === 'evt-it-pod-2')!;
    expect(conflict.conflictResolved).toBe(true);
    expect(conflict.conflictNote).toMatch(/field evidence wins/);
  });

  it('replaying the same batch is idempotent: everything is a duplicate and nothing changes', async () => {
    expect((await push(QUEUE)).status).toBe(200);
    const before = await stop(1);

    const replay = await push(QUEUE);
    expect(replay.status).toBe(200);
    expect(replay.body.value).toMatchObject({ synced: 0, duplicates: 5, rejected: 0, conflicts: 0 });
    expect(replay.body.value.results.every((r: any) => r.status === 'DUPLICATE')).toBe(true);

    expect(await svc.prisma.offlineEvent.count()).toBe(5);
    expect(await svc.prisma.pOD.count()).toBe(2);
    const after = await stop(1);
    expect(after.leaveActual?.toISOString()).toBe(before.leaveActual?.toISOString());
    expect(after.pod?.syncedAt?.toISOString()).toBe(before.pod?.syncedAt?.toISOString());

    // a retry that carries one new event applies only that one
    const extra = { id: 'evt-it-status-1', tripId: TRIP, eventType: 'STATUS_CHANGE', savedAt: '2026-10-06T02:00:00Z', payload: { note: 'back at depot' } };
    const partial = await push([QUEUE[0], extra]);
    expect(partial.body.value).toMatchObject({ synced: 1, duplicates: 1 });
    expect(await svc.prisma.offlineEvent.count()).toBe(6);
  });

  it('applies events in saved order whatever the batch order: a LEAVE sent before its POD still delivers the stop', async () => {
    const shuffled = [QUEUE[2], QUEUE[4], QUEUE[0], QUEUE[3], QUEUE[1]];
    const res = await push(shuffled);
    expect(res.body.value).toMatchObject({ synced: 5, needsReview: 0 });
    // results come back in saved order
    expect(res.body.value.results.map((r: any) => r.id)).toEqual(QUEUE.map((e) => e.id));

    const s1 = await stop(1);
    expect(s1.status).toBe('DELIVERED');
    expect(s1.leaveActual?.toISOString()).toBe('2026-10-06T00:25:00.000Z');
  });

  it('a LEAVE whose POD was saved earlier (clock skew) but sent in the same batch is not flagged', async () => {
    const leaveFirst = { ...QUEUE[2], savedAt: '2026-10-06T00:10:00Z' }; // phone clock says it left before the POD
    const res = await push([QUEUE[1], leaveFirst]);
    expect(res.body.value).toMatchObject({ synced: 2, needsReview: 0, conflicts: 0 });
    const s1 = await stop(1);
    expect(s1.status).toBe('DELIVERED');
    expect(s1.pod?.unitsDelivered).toBe(10);
  });

  it('a LEAVE without any proof of delivery puts the stop in front of a dispatcher; a later POD delivers it', async () => {
    const res = await push([QUEUE[0], QUEUE[2]]);
    expect(res.body.value).toMatchObject({ synced: 2, conflicts: 1, needsReview: 1 });
    expect(res.body.value.results[1]).toMatchObject({ id: 'evt-it-leave-1', conflict: LEAVE_WITHOUT_POD, needsReview: true });

    expect((await stop(1)).status).toBe('EXCEPTION');
    const flagged = await svc.prisma.offlineEvent.findUniqueOrThrow({ where: { id: 'evt-it-leave-1' } });
    expect(flagged).toMatchObject({ conflictResolved: false, conflictNote: LEAVE_WITHOUT_POD });

    const status = await svc.as(driver, DEV.K1).get(`OfflineEvents/Lodestar.SyncStatus(tripId='${TRIP}')`);
    expect(status.status).toBe(200);
    expect(status.body.value).toMatchObject({ total: 2, synced: 2, needsReview: 1 });

    await push([QUEUE[1]]);
    expect((await stop(1)).status).toBe('DELIVERED');
  });

  it("another vehicle's driver is refused per event and nothing is stored or changed", async () => {
    const res = await push(QUEUE, otherDriver, DEV.K2);
    expect(res.status).toBe(200);
    expect(res.body.value).toMatchObject({ synced: 0, rejected: 5 });
    expect(res.body.value.results[0]).toMatchObject({ status: 'REJECTED', reason: 'Trip is not assigned to your vehicle' });
    expect(await svc.prisma.offlineEvent.count()).toBe(0);
    expect(await svc.prisma.pOD.count()).toBe(0);
    expect((await stop(1)).status).toBe('ENROUTE');
    expect((await svc.prisma.deferralLog.findUniqueOrThrow({ where: { orderId: O.b } })).status).toBe('CONFIRMED');
  });

  it("a driver's token presented from another phone is refused before anything is applied", async () => {
    const res = await push(QUEUE, driver, DEV.K2);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('DeviceMismatch');
    expect(await svc.prisma.offlineEvent.count()).toBe(0);
  });
});
