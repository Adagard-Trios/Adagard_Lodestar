/**
 * The 4:00 PM (Asia/Colombo) order cut-off on a real database: POST Orders from a
 * store manager whose phone saved the order offline. The server clock is the only
 * thing faked (Date), so the cut-off can be crossed deterministically.
 *
 * Run date 2026-10-06 → cut-off 2026-10-05 16:00 Colombo = 10:30Z.
 */
import { AppModule } from '../../apps/orders/src/app.module';
import { bootService, resetDatabase, Service, TokenSigner } from './harness';
import { CLAIMS, OUT, seedReference } from './fixtures';

const RUN = '2026-10-06';
const CUTOFF = new Date('2026-10-05T10:30:00Z');
const hours = (h: number) => new Date(CUTOFF.getTime() + h * 3_600_000);

let svc: Service;
let signer: TokenSigner;

const order = (orderedAt?: string) => ({
  outletId: OUT.K1, runDate: `${RUN}T00:00:00Z`, brand: 'FRESH', tempClass: 'CHILLED', units: 12, kg: 40, m3: 1.2,
  ...(orderedAt ? { orderedAt } : {}),
});

/** Places an order with the server clock at `now` (tokens are minted at that time too). */
async function placeAt(now: Date, body: unknown, headers: Record<string, string> = {}) {
  jest.setSystemTime(now);
  const token = await signer.sign(CLAIMS.storeK1);
  return svc.as(token).post('Orders', body, headers);
}

beforeAll(async () => {
  // Only Date is faked: timers, I/O and the Prisma engine run for real.
  jest.useFakeTimers({
    now: hours(-1),
    doNotFake: ['hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
      'cancelIdleCallback', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
  });
  process.env.ENFORCE_ORDER_CUTOFF = 'true';
  process.env.ORDER_OFFLINE_GRACE_HOURS = '6';
  signer = await TokenSigner.create();
  svc = await bootService(AppModule, signer);
});

afterAll(async () => {
  await svc?.close();
  jest.useRealTimers();
});

beforeEach(async () => {
  await resetDatabase(svc.prisma);
  await seedReference(svc.prisma);
});

describe('POST Orders and the 4:00 PM cut-off (orders service, real Postgres)', () => {
  it('an order placed online before the cut-off is accepted at the server time', async () => {
    const res = await placeAt(hours(-0.5), order());
    expect(res.status).toBe(201);
    const row = await svc.prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row).toMatchObject({ outletId: OUT.K1, status: 'RECEIVED', latePhone: false, lateReason: null });
    expect(row.orderedAt.toISOString()).toBe(hours(-0.5).toISOString());
  });

  it('an order saved offline before 16:00 and synced after it (within ORDER_OFFLINE_GRACE_HOURS) is accepted as ordered in time', async () => {
    const savedAt = '2026-10-05T10:00:00Z'; // 15:30 Colombo, on the phone
    const res = await placeAt(hours(1.5), order(savedAt), { 'Idempotency-Key': 'it-offline-order-1' });
    expect(res.status).toBe(201);

    const row = await svc.prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.orderedAt.toISOString()).toBe('2026-10-05T10:00:00.000Z');
    expect(row).toMatchObject({ latePhone: false, status: 'RECEIVED', runDate: new Date(`${RUN}T00:00:00Z`) });

    // the phone's retry of the same queued order (same Idempotency-Key) does not create a second one
    const retry = await placeAt(hours(1.6), order(savedAt), { 'Idempotency-Key': 'it-offline-order-1' });
    expect(retry.status).toBe(201);
    expect(retry.body.id).toBe(res.body.id);
    expect(await svc.prisma.order.count({ where: { outletId: OUT.K1 } })).toBe(1);
  });

  it('an order created after 16:00 is accepted into the following run, and says so', async () => {
    const savedAt = '2026-10-05T10:45:00Z'; // 16:15 Colombo, on the phone
    const res = await placeAt(hours(1), order(savedAt));
    expect(res.status).toBe(201);
    expect(res.body.runDate).toBe('2026-10-07T00:00:00.000Z');
    expect(res.body.notes).toBe('Placed after the 4:00 PM cut-off for 2026-10-06; moved to the 2026-10-07 run.');
    const row = await svc.prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row).toMatchObject({ runDate: new Date('2026-10-07T00:00:00Z'), status: 'RECEIVED', latePhone: false });
    expect(row.orderedAt.toISOString()).toBe(hours(1).toISOString());
  });

  it('a moved order skips a non-operating day on the Calendar and keeps the store note', async () => {
    await svc.prisma.calendar.create({ data: { date: new Date('2026-10-07T00:00:00Z'), isOperating: false } });
    const res = await placeAt(hours(1), { ...order(), notes: 'Extra milk' });
    expect(res.status).toBe(201);
    expect(res.body.runDate).toBe('2026-10-08T00:00:00.000Z');
    expect(res.body.notes).toBe('Extra milk Placed after the 4:00 PM cut-off for 2026-10-06; moved to the 2026-10-08 run.');
  });

  it('an order saved before 16:00 but synced after the grace window goes to the following run', async () => {
    const res = await placeAt(hours(6.5), order('2026-10-05T10:00:00Z'));
    expect(res.status).toBe(201);
    expect(res.body.runDate).toBe('2026-10-07T00:00:00.000Z');
    expect(await svc.prisma.order.count({ where: { runDate: new Date(`${RUN}T00:00:00Z`) } })).toBe(0);
  });

  it('a phone clock ahead of the server is not trusted: the order is stamped with the server time', async () => {
    // server says 15:30 Colombo; the phone claims a time that has not happened yet
    const res = await placeAt(hours(-0.5), order('2026-10-05T14:00:00Z'));
    expect(res.status).toBe(201);
    const row = await svc.prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.orderedAt.toISOString()).toBe(hours(-0.5).toISOString());

    // and after the cut-off a "future" phone time cannot pass as saved in time: the order goes to the next run
    const late = await placeAt(hours(1), order('2026-10-05T20:00:00Z'));
    expect(late.status).toBe(201);
    expect(late.body.runDate).toBe('2026-10-07T00:00:00.000Z');
  });

  it('dispatch may still log a late phone order after the cut-off, with a reason, and it is flagged', async () => {
    jest.setSystemTime(hours(1));
    const token = await signer.sign(CLAIMS.dispatcherKandy);
    const refused = await svc.as(token).post('Orders', order());
    expect(refused.status).toBe(422);
    expect(refused.body.error.code).toBe('LateReasonRequired');

    const res = await svc.as(token).post('Orders', { ...order(), lateReason: 'Store called at 16:20' });
    expect(res.status).toBe(201);
    const row = await svc.prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row).toMatchObject({ latePhone: true, lateReason: 'Store called at 16:20' });
  });
});
