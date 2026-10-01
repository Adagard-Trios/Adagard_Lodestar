// The 4:00 PM order cut-off (Asia/Colombo, the day before the run), enforced by the orders service.
import { PERSONAS } from '../../lib/env';
import { expect, expectODataError, expectStatus, requireStack, test } from '../../lib/fixtures';

const SEEDED_RUN = '2026-04-07'; // the scenario day: long closed

/** Today in Colombo (UTC+05:30, no DST), and the next run date still open for orders. */
function nextOpenRun(now = new Date()): string {
  const colombo = new Date(now.getTime() + 330 * 60_000);
  const day = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n)).toISOString().slice(0, 10);
  const beforeFour = colombo.getUTCHours() < 16;
  return day(colombo, beforeFour ? 1 : 2);
}

const order = (runDate: string, extra: Record<string, unknown> = {}) => ({
  outletId: PERSONAS.storeManager.outletId, runDate: `${runDate}T00:00:00Z`, brand: 'FRESH', tempClass: 'AMBIENT',
  units: 2, kg: 3, m3: 0.02, notes: 'e2e cut-off check', lineItems: [{ name: 'e2e line', qty: 2, kg: 3, tempClass: 'AMBIENT' }], ...extra,
});

test.describe('Orders · 4:00 PM cut-off', { tag: '@stack' }, () => {
  requireStack();

  test('a store cannot order for a run whose cut-off has passed', async ({ as }) => {
    const store = await as('storeManager');
    const res = await store.post('Orders', order(SEEDED_RUN));
    const err = await expectODataError(res, 422);
    expect(err.code).toBe('OrderCutoffPassed');
    expect(err.message).toContain(nextOpenRun());
  });

  test('a store can order for the next open run, and orderedAt in the future is not trusted', async ({ as }) => {
    const store = await as('storeManager');
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const res = await store.post('Orders', order(nextOpenRun(), { orderedAt: future }));
    await expectStatus(res, 201, 'POST Orders (open run)');
    const created = await res.json();
    expect(created.latePhone).toBe(false);
    expect(Date.parse(created.orderedAt)).toBeLessThanOrEqual(Date.now() + 60_000);
    await expectStatus(await store.post(`Orders('${created.id}')/Lodestar.Cancel`, { reason: 'e2e cleanup' }), [200, 204], 'Cancel');
  });

  test('dispatch logs a late phone order only with a reason, and it is flagged', async ({ as }) => {
    const d = await as('dispatcher');
    const refused = await expectODataError(await d.post('Orders', order(SEEDED_RUN)), 422);
    expect(refused.code).toBe('LateReasonRequired');

    const res = await d.post('Orders', order(SEEDED_RUN, { lateReason: 'Store phoned after 4 PM (e2e)' }));
    await expectStatus(res, 201, 'POST Orders (late phone)');
    const created = await res.json();
    expect(created.latePhone).toBe(true);
    expect(created.lateReason).toBe('Store phoned after 4 PM (e2e)');
    await expectStatus(await d.post(`Orders('${created.id}')/Lodestar.Cancel`, { reason: 'e2e cleanup' }), [200, 204], 'Cancel');
  });
});
