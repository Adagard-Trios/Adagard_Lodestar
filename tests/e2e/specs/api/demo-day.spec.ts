// A fresh install has a realistic day to plan (WP2): 100+ open orders across three brands on the demo date,
// vehicles in the workshop, outlets skipped yesterday, no trips yet, and a Peliyagoda plan that cannot fit
// everything, so the agent defers orders with reason codes. The draft is not approved: the day stays for the demo.
import { expect as pwExpect } from '@playwright/test';
import { DEMO_DATE } from '../../lib/env';
import { expect, expectStatus, requireStack, test } from '../../lib/fixtures';

type Row = Record<string, any>;

test.describe('Demo day · over capacity, ready to plan', { tag: '@stack' }, () => {
  requireStack();
  test.describe.configure({ timeout: 240_000 });

  test('the seeded day has 100+ open orders, three brands, protected outlets, workshop vehicles and no trips', async ({ as }) => {
    const d = await as('dispatcher');
    const day = `runDate eq ${DEMO_DATE}T00:00:00Z`;
    const orders = (await d.json<{ value: Row[] }>(`Orders?$filter=${day} and startswith(id,'ORD${DEMO_DATE.slice(2).replace(/-/g, '')}')&$top=500`)).value;
    expect(orders.length).toBeGreaterThanOrEqual(100);
    expect(new Set(orders.map(o => o.brand))).toEqual(new Set(['FRESH', 'STYLE', 'TECH']));
    expect(orders.some(o => o.deferredYesterday)).toBe(true);
    const workshop = (await d.json<{ value: Row[] }>(`Vehicles?$filter=status eq 'WORKSHOP'&$top=100`)).value;
    expect(workshop.length).toBeGreaterThan(0);
    const started = (await d.json<{ value: Row[] }>(`Trips?$filter=${day} and status ne 'PLANNED'&$top=1`)).value;
    expect(started).toHaveLength(0);
  });

  test('the agent cannot fit the Peliyagoda day and defers orders with reason codes, protecting yesterday\'s', async ({ as }) => {
    const d = await as('dispatcher');
    const start = await d.post('AgentRuns', { depot: 'PELIYAGODA', runDate: DEMO_DATE });
    await expectStatus(start, [200, 201], 'start agent run');
    const runId = (await start.json()).id;
    await pwExpect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).status, { timeout: 180_000, intervals: [2000] }).toBe('NEEDS_APPROVAL');
    // the stored run refreshes from the agent on read; wait for the full draft
    let draft: Row = {};
    await pwExpect.poll(async () => (draft = (await d.json<Row>(`AgentRuns('${runId}')`)).detail ?? {}).plan !== undefined, { timeout: 30_000, intervals: [2500] }).toBe(true);
    const deferrals: Row[] = draft.deferrals ?? [];
    expect(draft.plan?.trips?.length).toBeGreaterThan(0);
    expect(deferrals.length).toBeGreaterThan(0);
    for (const x of deferrals) expect(x.reason).toMatch(/^(CAP_REEFER|CAP_TIME|ACCESS|WINDOW|FUEL|VEH_DOWN)$/);
    const protectedIds = new Set((await d.json<{ value: Row[] }>(`Orders?$filter=runDate eq ${DEMO_DATE}T00:00:00Z and deferredYesterday eq true&$top=100`)).value.map(o => o.id));
    expect(deferrals.filter(x => protectedIds.has(x.orderId))).toEqual([]);
    // leave the day unplanned for the demo
    await d.post(`AgentRuns('${runId}')/Lodestar.Resume`, { decision: 'reject' });
  });
});
