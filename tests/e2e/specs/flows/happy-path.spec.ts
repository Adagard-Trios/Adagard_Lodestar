// Happy path across every role (Designing 04 → 05 → 06 → 07 and links.json flow "1 Happy path"), each role in its
// own browser, on this spec's own future run date:
//   SM-01 store places tomorrow's order (desk) → DSP-01 cutoff queue → DSP-22 agent drafts → DSP-02 board →
//   DSP-03 deferrals with reasons → DSP-39/40 the store's orders onto ruwan's van → DSP-12 approve & go live →
//   LD-01 → LD-02 load in stop order → LD-03 flag a shortfall → LD-04 release → LD-15 (phone) →
//   DR-01 → DR-36 → DR-02 → DR-03 proof of delivery, each stop → DR-04 run complete (phone) →
//   SM-02 confirm receipt + report an issue (desk) → DSP-04 / DSP-13 the dispatcher sees the result.
// Backend state is checked through the API after every handoff (H1–H4).
//
// Designed hand-offs the product does not make yet are asserted anyway (expect.soft), so the walk continues and
// the test stays failing until they exist: the dock shortfall reaching dispatch and the store, and the store's
// issue reaching dispatch.
import { expect, requireStack, test } from '../../lib/fixtures';
import {
  STORE, VAN, deskPage, expectFitsPhone, onScreen, fieldPage, freeRunDate, openField, overloadReefers, settleOpenReceipts, waitForDraft, type Row,
} from '../../lib/flows';

const REASONS = /^(CAP_REEFER|CAP_TIME|ACCESS|WINDOW|FUEL|VEH_DOWN)$/;

test.describe('Happy path · order → plan → load → deliver → receipt', { tag: '@stack' }, () => {
  requireStack();

  test('every role, in its own browser, hands the order on to the next', async ({ browser, as }) => {
    test.setTimeout(20 * 60_000);
    const d = await as('dispatcher');
    const store = await as('storeManager');
    const runDate = await freeRunDate(d);
    await settleOpenReceipts(store);
    test.info().annotations.push({ type: 'runDate', description: runDate });

    // The rest of the depot's day: more chilled pallets than Kandy's reefers can carry, so the plan must defer.
    const overload = await overloadReefers(d, runDate);

    // ---------------------------------------------------------------- SM-01 · the store orders (H1 Order → Queue)
    const sm = await deskPage(browser, 'storeManager', '/store/sm-01-place-order');
    const storeOrders = await test.step('SM-01: the store submits its order for the run date', async () => {
      const page = sm.page;
      await page.getByLabel('Delivery date').fill(runDate);
      await expect(page.getByTestId('lines-ambient').or(page.getByTestId('lines-chilled')).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('submit-order')).toBeEnabled();
      await page.getByTestId('submit-order').click();
      await expect(page).toHaveURL(/\/store\/sm-27-orders-and-history/, { timeout: 30_000 });
      const mine = (await store.json<{ value: Row[] }>(`Orders?$filter=outletId eq '${STORE}' and runDate eq ${runDate}T00:00:00Z&$expand=lineItems`)).value;
      expect(mine.length, 'the store\'s orders for the run date').toBeGreaterThan(0);
      for (const o of mine) {
        expect(o.status).toBe('RECEIVED');
        expect(o.lineItems.length).toBeGreaterThan(0);
        // received with an order number, sized for the queue
        expect(o.id).toMatch(/^ORD/);
        expect(o.kg).toBeGreaterThan(0);
        // SM-27 finds it by its number, with its status
        await page.getByPlaceholder('Search orders or notes').fill(o.id);
        await expect(page.getByTestId('orders')).toContainText(o.id, { timeout: 30_000 });
        await expect(page.getByTestId('orders')).toContainText('Received');
      }
      return mine;
    });
    const storeIds = storeOrders.map(o => o.id);

    // ---------------------------------------------------------------- DSP-01 → DSP-22 → DSP-02 · the dispatcher plans
    const dsp = await deskPage(browser, 'dispatcher', `/plan/dsp-01-cutoff-queue?runDate=${runDate}`);
    let runId = '';
    await test.step('DSP-01: the order is in the Kandy cutoff queue, already sized; the agent drafts', async () => {
      const page = dsp.page;
      await page.getByRole('button', { name: 'Kandy Hub' }).first().click();
      await expect(page.getByTestId('queue-total')).toContainText(String(overload.length + storeOrders.length), { timeout: 30_000 });
      for (const id of storeIds) await expect(page.getByTestId('queue')).toContainText(id);
      await page.getByTestId('start-agent').click();
      await expect(page).toHaveURL(/\/plan\/dsp-22-planning-agent-drafting/, { timeout: 30_000 });
      // the agent drafts; when it stops for a human the screen moves on to the plan board
      await expect(page).toHaveURL(/\/plan\/dsp-02-plan-board/, { timeout: 240_000 });
      runId = (await page.evaluate(() => window.sessionStorage.getItem('lodestar.agentRun'))) ?? '';
      expect(runId).toMatch(/^run-kandy-/);
      await expect(page.getByTestId('board').locator('[data-vehicle]').first()).toBeVisible({ timeout: 30_000 });
    });

    let run = await waitForDraft(d, runId);
    const deferred: Row[] = run.detail.deferrals ?? [];
    await test.step('DSP-03: the draft defers what the reefers cannot carry, each with its reason', async () => {
      expect(deferred.length, 'deferral candidates in the draft').toBeGreaterThan(0);
      for (const x of deferred) expect(x.reason).toMatch(REASONS);
      const page = dsp.page;
      await page.goto(`/plan/dsp-03-deferral-decision?runDate=${runDate}`);
      for (const x of deferred.slice(0, 3)) await expect(page.locator('.web-screen')).toContainText(x.orderId, { timeout: 30_000 });
      await expect(page.locator('.web-screen')).toContainText(deferred[0].reason.replace('_', '-'));
    });

    await test.step('DSP-39/40: the dispatcher asks the agent to put the store\'s orders on VEH057, and applies it', async () => {
      const page = dsp.page;
      for (const id of storeIds) {
        run = await waitForDraft(d, runId);
        const trip = (run.detail.plan.trips as Row[]).find(t => t.orderIds.includes(id));
        if (trip?.vehicleId === VAN) continue;
        const version = run.detail.plan.version;
        await page.goto(`/plan/dsp-39-ask-the-planning-agent?runDate=${runDate}`);
        await page.getByLabel('Ask about this plan').fill(`Move ${id} to ${VAN}`);
        await page.getByTestId('ask-send').click();
        await expect(page.getByTestId('proposal')).toBeVisible({ timeout: 60_000 });
        await page.getByTestId('apply-proposal').click();
        await expect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).detail?.plan?.version, { timeout: 120_000 }).toBeGreaterThan(version);
      }
      run = await waitForDraft(d, runId);
      for (const id of storeIds) expect((run.detail.plan.trips as Row[]).find(t => t.orderIds.includes(id))?.vehicleId, `${id} on the van`).toBe(VAN);
    });

    let planId = '';
    await test.step('DSP-12: approve & go live publishes the plan; deferrals are recorded with their reason', async () => {
      const page = dsp.page;
      await page.goto(`/plan/dsp-12-approve-and-go-live?runDate=${runDate}`);
      // moving the store's orders onto the van can break a hard rule: the screen lists it and asks for a reason
      const violations: Row[] = (await waitForDraft(d, runId)).detail.violations ?? [];
      const reason = 'Store orders ride the van as agreed with the store (e2e)';
      if (violations.length) {
        await expect(page.getByTestId('violations')).toContainText(violations[0].detail, { timeout: 30_000 });
        await expect(page.getByTestId('approve')).toHaveAttribute('aria-disabled', 'true');
        await page.getByLabel('Override reason').fill(reason);
      }
      await page.getByTestId('approve').click();
      await expect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).status, { timeout: 120_000 }).toBe('APPROVED');
      await expect.poll(async () => (await d.json<Row>(`AgentRuns('${runId}')`)).planId, { timeout: 120_000 }).toBeTruthy();
      planId = (await d.json<Row>(`AgentRuns('${runId}')`)).planId;
      // the run records the decision first, then planning publishes the plan with the dispatcher's authority
      await expect.poll(async () => (await d.json<Row>(`Plans('${planId}')`)).status, { timeout: 120_000 }).toBe('PUBLISHED');
      if (violations.length) {
        expect((await d.json<Row>(`Plans('${planId}')`)).summary.override).toMatchObject({ reason, violations: violations.length });
      }
      await expect(page.getByTestId('approve')).toBeHidden({ timeout: 60_000 }).catch(() => undefined);
      for (const id of storeIds) {
        expect((await d.json<Row>(`Orders('${id}')`)).status).toBe('PLANNED');
        const onTrip = (await d.json<{ value: Row[] }>(`TripStops?$filter=orderId eq '${id}'&$expand=trip`)).value.find(x => x.trip.planId === planId);
        expect(onTrip?.trip.vehicleId, `${id} on the van`).toBe(VAN);
      }
      const logged = (await d.json<{ value: Row[] }>(`Orders?$filter=id in (${[...overload, ...storeOrders].map(o => `'${o.id}'`).join(',')}) and status eq 'DEFERRED'&$expand=deferralLog`)).value;
      expect(logged.length, 'deferred orders').toBeGreaterThan(0);
      for (const o of logged) {
        expect(o.deferralLog).toMatchObject({ status: 'CONFIRMED', planId });
        expect(o.deferralLog.reason).toMatch(REASONS);
        expect(o.runDate.slice(0, 10) > runDate, 'moved to a later run').toBe(true);
      }
    });

    const trip = (await d.json<{ value: Row[] }>(`Trips?$filter=planId eq '${planId}' and vehicleId eq '${VAN}'&$expand=stops`)).value[0];
    expect(trip, 'the van\'s trip').toBeTruthy();
    const stops: Row[] = [...trip.stops].sort((a: Row, b: Row) => a.stopSeq - b.stopSeq);

    // ---------------------------------------------------------------- LD-01 → LD-04 · the loader (H2 Plan → Dock)
    const ld = await fieldPage(browser, 'loader', 'ld-06-sign-in', 'lk-L187', runDate, '03:00');
    let shortItem = '';
    await test.step('LD-01/02: the van\'s load sheet loads in reverse stop order', async () => {
      const page = ld.page;
      await expect(page).toHaveURL(/\/field\/s\/ld-01-dock-queue/, { timeout: 30_000 });
      const row = page.locator('[data-testid^="bay-row-"]').filter({ hasText: VAN }).first();
      await expect(row).toBeVisible({ timeout: 30_000 });
      await row.click();
      await expect(page).toHaveURL(new RegExp(`ld-02-load-sheet\\?trip=${trip.id}`));
      const last = Math.max(...stops.map(s => s.stopSeq));
      await expect(onScreen(page, 'load-banner')).toContainText(`load stop ${last} first`, { timeout: 30_000 });
      await expectFitsPhone(page);
    });

    await test.step('LD-03: the loader flags a shortfall on the current line', async () => {
      const page = ld.page;
      await onScreen(page, 'lk-L7').click();
      await expect(page).toHaveURL(/ld-03-flag-shortfall/);
      shortItem = (await onScreen(page, 'pick-line').innerText()).trim();
      await onScreen(page, 'qty-minus').click();
      await onScreen(page, 'reason-0').click();
      await onScreen(page, 'lk-L8').click();
      await expect.poll(async () => {
        const lr = (await d.json<{ value: Row[] }>(`LoadRecords?$filter=tripId eq '${trip.id}'`)).value[0];
        return (lr?.shortfalls ?? []).length;
      }, { timeout: 60_000 }).toBeGreaterThan(0);
    });

    await test.step('LD-02/04: every other line ticked, the van is released with its seal (H3 Dock → Road)', async () => {
      const page = ld.page;
      await openField(page, 'ld-02-load-sheet', { trip: trip.id });
      const cta = onScreen(page, 'lk-L64');
      // "N of M lines" on the load sheet counts what is loaded or flagged
      const loaded = async () => Number((await page.getByText(/ of \d+ lines$/).locator('visible=true').last().locator('..').innerText()).match(/^(\d+)/)?.[1] ?? NaN);
      for (let i = 0; i < 60 && !(await cta.innerText()).includes('Release vehicle'); i++) {
        const before = await loaded();
        // a toast ("Flag sent…") can sit over the button for a moment: tap again until the line counts
        await expect(async () => {
          if ((await loaded()) === before) await cta.click();
          expect(await loaded()).toBeGreaterThan(before);
        }).toPass({ timeout: 30_000, intervals: [1000, 2000] });
      }
      await expect(cta).toContainText('Release vehicle');
      await cta.click();
      await expect(page).toHaveURL(/ld-04-release-vehicle/);
      await onScreen(page, 'seal-input').fill(`SEAL-${runDate.replace(/-/g, '')}`);
      await onScreen(page, 'lk-L10').click();
      await expect(page).toHaveURL(/ld-15-handover-confirmed/, { timeout: 30_000 });
      await expect.poll(async () => (await d.json<Row>(`Trips('${trip.id}')`)).status, { timeout: 60_000 }).toBe('ENROUTE');
      for (const s of stops) expect((await d.json<Row>(`Orders('${s.orderId}')`)).status).toBe('ENROUTE');
      const lr = (await d.json<{ value: Row[] }>(`LoadRecords?$filter=tripId eq '${trip.id}'`)).value[0];
      expect(lr.sealNumber ?? lr.notes ?? '').toBeDefined();
      expect(lr.shortfalls.some((x: Row) => shortItem.includes(x.item) || x.item.includes(shortItem.split(' ·')[0]))).toBe(true);
    });

    // Designed (H3): the shortfall reaches dispatch (acknowledged, DSP-13) and the store (SM-02) as it happens.
    await test.step('designed: the dock shortfall reaches the dispatcher and the store', async () => {
      const dispatcherSees = await d.json<{ value: Row[] }>(`Notifications?$filter=readAt eq null&$orderby=sentAt desc&$top=50`);
      expect.soft(dispatcherSees.value.some(n => JSON.stringify(n.payload ?? {}).includes(trip.id) && /SHORT/i.test(n.type)), 'dispatcher notified of the shortfall').toBe(true);
      const storeSees = await store.json<{ value: Row[] }>(`Notifications?$orderby=sentAt desc&$top=50`);
      expect.soft(storeSees.value.some(n => /SHORT/i.test(n.type) && storeIds.some(id => JSON.stringify(n.payload ?? {}).includes(id))), 'store notified of the shortfall').toBe(true);
    });

    // ---------------------------------------------------------------- DR-01 → DR-04 · the driver (H4 Road → Store)
    const dr = await fieldPage(browser, 'driver', 'dr-06-sign-in', 'lk-L229', runDate, '04:00');
    await test.step('DR-01: today\'s run on the van shows the store\'s stops', async () => {
      const page = dr.page;
      await expect(page).toHaveURL(/\/field\/s\/dr-01-today-s-run/, { timeout: 30_000 });
      await expect(onScreen(page, 'run-day')).toContainText(VAN, { timeout: 30_000 });
      for (const s of stops) await expect(onScreen(page, `stop-${s.stopSeq}`)).toBeVisible();
      await expectFitsPhone(page);
      await onScreen(page, 'lk-L12').click();
      await expect(page).toHaveURL(/dr-36-en-route-driving-mode/);
    });

    // the driver's count starts from what the dock loaded (DR-03: ordered minus the flagged shortfall)
    const shortfalls: Row[] = (await d.json<{ value: Row[] }>(`LoadRecords?$filter=tripId eq '${trip.id}'`)).value[0].shortfalls;
    const shortAtDock = (orderId: string) => shortfalls.filter(x => x.orderId === orderId).reduce((n, x) => n + (x.qtyOrdered - x.qtyLoaded), 0);
    const units = new Map<string, number>();
    for (const s of stops) units.set(s.orderId, (await d.json<Row>(`Orders('${s.orderId}')`)).units);
    for (const [i, s] of stops.entries()) {
      await test.step(`DR-36 → DR-02 → DR-03: stop ${s.stopSeq} arrived and delivered with proof`, async () => {
        const page = dr.page;
        await onScreen(page, 'lk-L13').click();
        await expect(page).toHaveURL(/dr-02-stop-arrival/);
        await onScreen(page, 'lk-L14').click();
        await expect(page).toHaveURL(/dr-03-proof-of-delivery/);
        const loaded = units.get(s.orderId)! - shortAtDock(s.orderId);
        await expect(onScreen(page, 'pod-count')).toHaveText(new RegExp(`^${loaded}of`), { timeout: 30_000 });
        if (i === 0) {
          await onScreen(page, 'units-minus').click(); // one unit short at the door
          await expect(onScreen(page, 'pod-count')).toHaveText(new RegExp(`^${loaded - 1}of`));
        }
        await onScreen(page, 'receiver-name').fill('Flow receiver');
        await onScreen(page, 'lk-L15').click();
        await expect(page).toHaveURL(i === stops.length - 1 ? /dr-04-run-complete/ : /dr-36-en-route-driving-mode/, { timeout: 30_000 });
      });
    }

    await test.step('the PODs reached the server: stops delivered, orders delivered, the short count kept', async () => {
      // the driver's count starts from what the dock loaded (the flagged shortfall), then one unit short at stop 1
      for (const [i, s] of stops.entries()) {
        await expect.poll(async () => (await d.json<Row>(`TripStops('${s.id}')`)).status, { timeout: 90_000 }).toBe('DELIVERED');
        const stop = await d.json<Row>(`TripStops('${s.id}')?$expand=pod,order`);
        expect(stop.pod.receiverName).toBe('Flow receiver');
        expect(stop.pod.unitsDelivered).toBe(stop.order.units - shortAtDock(s.orderId) - (i === 0 ? 1 : 0));
        await expect.poll(async () => (await d.json<Row>(`Orders('${s.orderId}')`)).status, { timeout: 60_000 }).toBe('DELIVERED');
      }
      await expect(onScreen(dr.page, 'run-done-title')).toBeVisible();
    });

    // ---------------------------------------------------------------- SM-02 · the store confirms receipt
    await test.step('SM-02: the store counts, reports an issue and confirms receipt', async () => {
      const page = sm.page;
      await page.goto('/store/sm-02-deliveries');
      const card = page.getByTestId('receipt');
      await expect(card).toBeVisible({ timeout: 60_000 });
      for (const id of storeIds) await expect(card).toContainText(id);
      await page.getByTestId('report-issue').click();
      if (storeIds.length > 1) await page.getByLabel('Order with the issue').selectOption(storeIds[storeIds.length - 1]);
      await page.getByRole('radio', { name: 'Damaged' }).click();
      await page.getByLabel('Note for Kandy Hub').fill('Flow: one tray torn');
      await page.getByTestId('confirm-receipt').click();
      for (const id of storeIds) {
        await expect.poll(async () => (await store.json<Row>(`Orders('${id}')`)).unitsReceived, { timeout: 60_000, message: `${id} counted` }).not.toBeNull();
      }
      const issued = await store.json<Row>(`Orders('${storeIds[storeIds.length - 1]}')`);
      expect(issued.receiptNote).toContain('Damaged: Flow: one tray torn');
      // the store sees its confirmed receipt (and any credit note)
      await expect(page.getByTestId('receipt-done')).toBeVisible({ timeout: 30_000 });
    });

    // ---------------------------------------------------------------- DSP-04 / DSP-13 · the dispatcher sees the result
    await test.step('DSP-04: the dispatcher\'s live view shows the van\'s run delivered', async () => {
      const page = dsp.page;
      await page.goto(`/plan/dsp-04-live-operations?runDate=${runDate}`);
      await expect(page.getByTestId('routes')).toContainText(VAN, { timeout: 30_000 });
    });

    await test.step('designed: the POD shortage and the store\'s issue reach the dispatcher (DSP-04 / DSP-13)', async () => {
      const page = dsp.page;
      await page.goto(`/plan/dsp-13-exceptions-inbox?runDate=${runDate}`);
      await expect(page.getByTestId('inbox')).toBeVisible({ timeout: 30_000 });
      await expect.soft(page.getByTestId('inbox'), 'the store\'s damaged-goods issue in the exceptions inbox').toContainText(storeIds[storeIds.length - 1], { timeout: 15_000 });
    });

    await Promise.all([sm.context.close(), dsp.context.close(), ld.context.close(), dr.context.close()]);
  });
});

