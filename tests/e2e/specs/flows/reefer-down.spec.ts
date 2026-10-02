// Failure scenario B · Reefer Down at 3:45 (Designing 08, links.json flow "Reefer down": LD-B1 → DSP-B1 → LD-14 →
// SM-B1). A reefer fails its pre-departure check at the dock: the loader flags it in one tap, the planning agent
// drafts a re-plan diff, the dispatcher approves it, the dock gets the new load sheet and each store is told its
// new arrival time. Nothing is deferred that was not deferred before.
//
// Setup (through the API): the store's chilled order planned on ruwan's reefer van VEH057, not yet released.
// The loader's part is the UI at 390×844; the dispatcher's on the desk.
import { expect, requireStack, test } from '../../lib/fixtures';
import { STORE, VAN, deskPage, fieldPage, freeRunDate, onScreen, openField, placeOrder, planOntoVan, type Row } from '../../lib/flows';

test.describe('Reefer down · flag at the dock → re-plan → stores told', { tag: '@stack' }, () => {
  requireStack();

  test('a reefer that fails its pre-departure check is flagged, re-planned and the store is told', async ({ browser, as }) => {
    test.setTimeout(10 * 60_000);
    const d = await as('dispatcher');
    const store = await as('storeManager');
    const runDate = await freeRunDate(d);
    test.info().annotations.push({ type: 'runDate', description: runDate });
    const chilled = await placeOrder(store, runDate, { outletId: STORE, brand: 'FRESH', tempClass: 'CHILLED', units: 10, kg: 60, m3: 0.4, name: 'reefer down chilled case' });
    const { trip, planId } = await planOntoVan(d, runDate, [chilled.id]);
    const notesBefore = new Set((await d.json<{ value: Row[] }>(`Notifications?$orderby=sentAt desc&$top=50`)).value.map(n => n.id));

    const ld = await fieldPage(browser, 'loader', 'ld-06-sign-in', 'lk-L187', runDate, '03:45');
    try {
      await test.step('LD-B1: the loader flags the reefer that will not cool, in one tap', async () => {
        const page = ld.page;
        await expect(page).toHaveURL(/\/field\/s\/ld-01-dock-queue/, { timeout: 30_000 });
        await openField(page, 'ld-b1-vehicle-can-t-depart', { trip: trip.id });
        // designed: the screen is about this trip's vehicle and its chilled orders
        await expect.soft(page.locator('body'), 'LD-B1 shows the van being checked').toContainText(VAN, { timeout: 15_000 });
        await expect.soft(page.locator('body'), 'LD-B1 lists the store on the van').toContainText(STORE);
        await page.getByText('Not cooling', { exact: true }).locator('visible=true').last().click();
        await onScreen(page, 'lk-L31').click();
      });

      await test.step('designed: dispatch is alerted at once and the van is out of service', async () => {
        await expect.configure({ soft: true }).poll(async () => (await d.json<{ value: Row[] }>(`Notifications?$orderby=sentAt desc&$top=50`)).value
          .some(n => !notesBefore.has(n.id) && JSON.stringify(n.payload ?? {}).includes(VAN)), { timeout: 20_000, message: 'dispatcher alerted that the reefer cannot depart' })
          .toBe(true);
        const van = await d.json<Row>(`Vehicles('${VAN}')`);
        expect.soft(van.status, 'the van is marked down').not.toBe('AVAILABLE');
      });

      await test.step('designed: DSP-B1 shows the re-plan diff for this van, ready to approve', async () => {
        const dsp = await deskPage(browser, 'dispatcher', `/plan/dsp-b1-re-plan-diff?runDate=${runDate}`);
        try {
          await expect.soft(dsp.page.locator('.web-screen'), 'the re-plan diff is about the van that failed').toContainText(VAN, { timeout: 15_000 });
          await expect.soft(dsp.page.locator('.web-screen'), 'the re-plan diff moves the store\'s order').toContainText(chilled.id);
        } finally {
          await dsp.context.close();
        }
      });

      await test.step('designed: the store is told its new arrival time (SM-B1), nothing deferred', async () => {
        const notes = (await store.json<{ value: Row[] }>(`Notifications?$orderby=sentAt desc&$top=30`)).value;
        expect.soft(notes.some(n => JSON.stringify(n.payload ?? {}).includes(chilled.id) && /ETA|ARRIVAL|REPLAN/i.test(n.type)), 'store told the later arrival').toBe(true);
        expect((await d.json<Row>(`Orders('${chilled.id}')`)).status, 'the order is still planned, not deferred').toBe('PLANNED');
        expect((await d.json<Row>(`Plans('${planId}')`)).status).toBe('PUBLISHED');
      });
    } finally {
      // never leave ruwan's van out of service for the other specs
      const van = await d.json<Row>(`Vehicles('${VAN}')`);
      if (van.status !== 'AVAILABLE') await d.post(`Vehicles('${VAN}')/Lodestar.SetStatus`, { status: 'AVAILABLE' });
      await ld.context.close();
    }
  });
});
