// A plan becomes execution (WP1): approving the agent's draft creates the day's trips and stops, plans the
// served orders, records deferrals with their reason, tells each store, and announces plan_published; the
// loader's release sends the trip en route and announces trip_released.
import { expect as pwExpect } from '@playwright/test';
import { io, type Socket } from 'socket.io-client';
import { tokenFor } from '../../lib/auth';
import { BASE_URL, PERSONAS } from '../../lib/env';
import { OData, expect, expectStatus, requireStack, test } from '../../lib/fixtures';

const DEPOT = 'KANDY';

/** The next run date still open for orders (4:00 PM Colombo cut-off the day before). */
function nextOpenRun(now = new Date()): string {
  const colombo = new Date(now.getTime() + 330 * 60_000);
  const add = (n: number) => new Date(Date.UTC(colombo.getUTCFullYear(), colombo.getUTCMonth(), colombo.getUTCDate() + n)).toISOString().slice(0, 10);
  return add(colombo.getUTCHours() < 16 ? 1 : 2);
}

/** Collects realtime events as a persona's screen would receive them. */
function listen(token: string, rooms: string[]): { socket: Socket; events: { event: string; payload: any }[] } {
  const events: { event: string; payload: any }[] = [];
  const socket = io(BASE_URL, {
    path: '/ws/', transports: ['websocket'], query: { room: rooms.join(',') }, auth: { token }, rejectUnauthorized: false,
  });
  socket.onAny((event, payload) => events.push({ event, payload }));
  return { socket, events };
}

type Row = Record<string, any>;

test.describe('Plan execution · approve → trips → release', { tag: '@stack' }, () => {
  requireStack();
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  const runDate = nextOpenRun();
  let d: OData;
  let planId: string;
  const placed: string[] = [];

  test('stores and dispatch place orders for the next open run', async ({ as }) => {
    d = await as('dispatcher');
    const store = await as('storeManager');
    const outlets = (await d.json<{ value: Row[] }>(`Outlets?$filter=depot eq '${DEPOT}' and isActive eq true&$top=6&$orderby=id`)).value;
    expect(outlets.length).toBeGreaterThan(2);
    const line = (tempClass: string) => ({ name: `e2e ${tempClass.toLowerCase()} case`, qty: 4, kg: 12, tempClass });
    const order = (o: Row, tempClass: string) => ({
      outletId: o.id, runDate: `${runDate}T00:00:00Z`, brand: o.brand, tempClass, units: 4, kg: 12, m3: 0.2, lineItems: [line(tempClass)],
    });
    const mine = outlets.find(o => o.id === PERSONAS.storeManager.outletId) ?? (await d.json<Row>(`Outlets('${PERSONAS.storeManager.outletId}')`));
    const res = await store.post('Orders', order(mine, 'CHILLED'));
    await expectStatus(res, 201, 'store order');
    placed.push((await res.json()).id);
    for (const o of outlets.filter(x => x.id !== mine.id).slice(0, 3)) {
      const r = await d.post('Orders', order(o, 'AMBIENT'));
      await expectStatus(r, 201, `order for ${o.id}`);
      placed.push((await r.json()).id);
    }
  });

  test('approving the agent draft creates trips and stops, plans orders, tells the store and the screens', async ({ as }) => {
    d = await as('dispatcher');
    const store = await as('storeManager');
    const listener = listen(await tokenFor('dispatcher'), [`dispatcher:${DEPOT}`]);
    try {
      const start = await d.post('AgentRuns', { depot: DEPOT, runDate });
      await expectStatus(start, [200, 201], 'start agent run');
      const runId = (await start.json()).id;
      await pwExpect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).status, { timeout: 120_000, intervals: [1000, 2000] }).toBe('NEEDS_APPROVAL');
      await expectStatus(await d.post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'approve' }), 200, 'approve');
      planId = (await d.json<Row>(`AgentRuns('${runId}')`)).planId;
      expect(planId).toBeTruthy();

      const plan = await d.json<Row>(`Plans('${planId}')`);
      expect(plan.status).toBe('PUBLISHED');
      const trips = (await d.json<{ value: Row[] }>(`Trips?$filter=planId eq '${planId}'&$expand=stops`)).value;
      expect(trips.length).toBeGreaterThan(0);
      for (const t of trips) {
        expect(t).toMatchObject({ status: 'PLANNED', depot: DEPOT, planVersion: plan.version });
        expect(t.bay).toMatch(/^K\d$/);
        expect(t.stops.length).toBeGreaterThan(0);
        expect(t.stops.map((s: Row) => s.stopSeq)).toEqual(t.stops.map((_: Row, i: number) => i + 1).sort((a: number, b: number) => a - b));
      }
      // every order we placed is either on a stop (PLANNED) or deferred with a reason and a later run
      const stopOrders = new Set(trips.flatMap(t => t.stops.map((s: Row) => s.orderId)));
      for (const id of placed) {
        const o = await d.json<Row>(`Orders('${id}')?$expand=deferralLog`);
        if (stopOrders.has(id)) expect(o.status).toBe('PLANNED');
        else {
          expect(o.status).toBe('DEFERRED');
          expect(o.deferralLog).toMatchObject({ status: 'CONFIRMED', planId });
          expect(o.deferralLog.reason).toMatch(/^(CAP_REEFER|CAP_TIME|ACCESS|WINDOW|FUEL|VEH_DOWN)$/);
          expect(o.runDate.slice(0, 10) > runDate).toBe(true);
        }
      }
      // the store manager was told; the dispatcher's open screen got plan_published
      await pwExpect.poll(async () => (await store.json<{ value: Row[] }>(`Notifications?$filter=type in ('PLAN_PUBLISHED','ORDER_DEFERRED')&$orderby=sentAt desc&$top=20`)).value
        .some(n => n.payload?.planId === planId), { timeout: 15_000 }).toBe(true);
      await pwExpect.poll(() => listener.events.some(e => e.event === 'plan_published' && e.payload?.planId === planId), { timeout: 15_000 }).toBe(true);

      // the loader's bay queue now has the trips, not started
      const loader = await as('loader');
      const queue = await loader.json<{ value: Row[] } | Row[]>(`Trips/Lodestar.BayQueue(depot='${DEPOT}',runDate=${runDate})`);
      const rows = Array.isArray(queue) ? queue : queue.value;
      expect(rows.map(r => r.id)).toEqual(expect.arrayContaining(trips.map(t => t.id)));
    } finally {
      listener.socket.close();
    }
  });

  test('re-approving a new version replaces the unstarted trips instead of adding more', async ({ as }) => {
    d = await as('dispatcher');
    const unstarted = `Trips?$filter=depot eq '${DEPOT}' and runDate eq ${runDate}T00:00:00Z and status eq 'PLANNED'`;
    const before = (await d.json<{ value: Row[] }>(unstarted)).value.length;
    const start = await d.post('AgentRuns', { depot: DEPOT, runDate });
    const runId = (await start.json()).id;
    await pwExpect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).status, { timeout: 120_000, intervals: [1000, 2000] }).toBe('NEEDS_APPROVAL');
    await expectStatus(await d.post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'approve' }), 200, 'approve v2');
    const v2 = (await d.json<Row>(`AgentRuns('${runId}')`)).planId;
    expect(v2).not.toBe(planId);
    expect((await d.json<Row>(`Plans('${planId}')`)).status).toBe('SUPERSEDED');
    // trips that have not started are replaced; one released earlier today stays on its plan
    const trips = (await d.json<{ value: Row[] }>(unstarted)).value;
    expect(trips.length).toBe(before);
    expect(trips.every(t => t.planId === v2)).toBe(true);
    planId = v2;
  });

  test('the loader releases a trip: it and its orders go en route, the driver and screens are told', async ({ as }) => {
    const loader = await as('loader');
    const trip = (await loader.json<{ value: Row[] }>(`Trips?$filter=planId eq '${planId}'&$expand=stops&$top=1&$orderby=bay`)).value[0];
    const listener = listen(await tokenFor('loader'), [`loader:${DEPOT}`]);
    try {
      await expectStatus(await loader.post('LoadRecords', { tripId: trip.id, bay: trip.bay, shortfalls: [] }), 201, 'load record');
      await expectStatus(await loader.post(`Trips('${trip.id}')/Lodestar.Release`, { sealNumber: 'E2E-SEAL-1', reeferTempC: 3 }), 200, 'release');
      const after = await loader.json<Row>(`Trips('${trip.id}')?$expand=stops`);
      expect(after.status).toBe('ENROUTE');
      for (const s of after.stops) {
        expect(s.status).toBe('ENROUTE');
        expect((await loader.json<Row>(`Orders('${s.orderId}')`)).status).toBe('ENROUTE');
      }
      await pwExpect.poll(() => listener.events.some(e => e.event === 'trip_released' && e.payload?.tripId === trip.id), { timeout: 15_000 }).toBe(true);
    } finally {
      listener.socket.close();
    }
  });
});
