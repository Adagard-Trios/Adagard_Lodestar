// Failure scenario A · Dead Zone above Ramboda (Designing 08, links.json flow "Dead zone": DR-A1 → DR-A2 → DR-A3,
// DSP-A1/A2, SM-A1). The van loses data coverage mid-run: the driver keeps working, every arrival and proof of
// delivery is saved on the phone, the phone restarts while still offline, and when signal returns the records
// reconcile on the server exactly once, with nothing re-keyed.
//
// Setup (the day before the run, through the API): the store's orders on ruwan's van, planned and released.
// The driver's part is the UI, on a 390×844 phone whose clock is the run date.
import type { Page } from '@playwright/test';
import { expect, requireStack, test, type OData } from '../../lib/fixtures';
import {
  STORE, VAN, fieldPage, freeRunDate, loadAndRelease, onScreen, openField, placeOrder, planOntoVan, settleOpenReceipts, type Row,
} from '../../lib/flows';

/** What the server holds for the trip: stops, PODs and the replayed offline events. */
async function serverState(d: OData, tripId: string) {
  const stops = (await d.json<{ value: Row[] }>(`TripStops?$filter=tripId eq '${tripId}'&$expand=pod`)).value;
  const events = (await d.json<{ value: Row[] }>(`OfflineEvents?$filter=tripId eq '${tripId}'&$top=200`)).value;
  return { stops, events };
}

/** The outbox kept on the phone (localStorage on the web build), by status. */
async function outbox(page: Page): Promise<Row[]> {
  return page.evaluate(() => {
    try {
      return JSON.parse(window.localStorage.getItem('lodestar.outbox') ?? '[]');
    } catch {
      return [];
    }
  });
}

test.describe('Dead zone · offline run, restart, reconnect, reconcile', { tag: '@stack' }, () => {
  requireStack();

  test('stops recorded offline survive a restart and reconcile once when signal returns', async ({ browser, as }) => {
    test.setTimeout(15 * 60_000);
    const d = await as('dispatcher');
    const store = await as('storeManager');
    const runDate = await freeRunDate(d);
    test.info().annotations.push({ type: 'runDate', description: runDate });
    await settleOpenReceipts(store);

    const dry = await placeOrder(store, runDate, { outletId: STORE, brand: 'FRESH', tempClass: 'AMBIENT', units: 18, kg: 180, m3: 0.9, name: 'dead zone dry case' });
    const chilled = await placeOrder(store, runDate, { outletId: STORE, brand: 'FRESH', tempClass: 'CHILLED', units: 10, kg: 50, m3: 0.3, name: 'dead zone chilled case' });
    const { trip, stops } = await planOntoVan(d, runDate, [dry.id, chilled.id]);
    await loadAndRelease(await as('loader'), trip);
    expect((await d.json<Row>(`Trips('${trip.id}')`)).status).toBe('ENROUTE');

    const dr = await fieldPage(browser, 'driver', 'dr-06-sign-in', 'lk-L229', runDate, '04:30');
    const page = dr.page;
    await test.step('DR-01: the run is on the phone before the hills', async () => {
      await expect(page).toHaveURL(/\/field\/s\/dr-01-today-s-run/, { timeout: 30_000 });
      await expect(onScreen(page, 'run-day')).toContainText(VAN, { timeout: 30_000 });
      for (const s of stops) await expect(onScreen(page, `stop-${s.stopSeq}`)).toBeVisible();
      // the app itself is kept on the phone (its service worker has cached the shell)
      await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker?.getRegistration())?.active), { timeout: 60_000, message: 'app shell installed for offline use' }).toBe(true);
    });

    await dr.context.setOffline(true);
    try {
      for (const s of stops) {
        await test.step(`DR-A1 → DR-A2: no signal, stop ${s.stopSeq} arrived and delivered, saved on the phone`, async () => {
          await openField(page, 'dr-01-today-s-run');
          await onScreen(page, `stop-${s.stopSeq}`).click();
          await expect(page).toHaveURL(/dr-02-stop-arrival/);
          await onScreen(page, 'lk-L14').click();
          await expect(page).toHaveURL(/dr-03-proof-of-delivery/);
          await expect(onScreen(page, 'pod-count')).toHaveText(/^\d+of/, { timeout: 30_000 });
          await onScreen(page, 'receiver-name').fill('Dead zone receiver');
          await onScreen(page, 'lk-L15').click();
          await expect(page).toHaveURL(/dr-a2-pod-saved-offline/, { timeout: 30_000 });
          await expect(onScreen(page, 'outbox-waiting')).toHaveText(/^[1-9]\d* waiting/);
        });
      }

      await test.step('nothing reached the server while offline', async () => {
        const { stops: now } = await serverState(d, trip.id);
        expect(now.every(s => s.status !== 'DELIVERED' && !s.pod)).toBe(true);
        const waiting = (await outbox(page)).filter(i => i.status !== 'synced');
        expect(waiting.filter(i => i.kind === 'POD_SAVE').length).toBe(stops.length);
      });

      await test.step('the phone restarts with no signal: the records stay on it (DR-A2)', async () => {
        await page.reload().catch(() => undefined);
        // designed: the run and its waiting records open offline (records are only cleared after the server confirms)
        await expect.soft(onScreen(page, 'outbox-waiting'), 'the app opens offline after a restart with the waiting records').toBeVisible({ timeout: 15_000 });
        const waiting = (await outbox(page)).filter(i => i.status !== 'synced');
        expect(waiting.filter(i => i.kind === 'POD_SAVE').length, 'PODs still waiting on the phone after the restart').toBe(stops.length);
      });
    } finally {
      await dr.context.setOffline(false);
    }

    await test.step('signal returns: the session resumes without a new sign-in, the outbox is kept and sent', async () => {
      // the session survived the offline restart (sessionStorage of the tab): the phone refreshes its token silently
      // and sends what it saved, on the screen it is on
      await expect.poll(async () => (await outbox(page)).filter(i => i.status !== 'synced').length, { timeout: 90_000, message: 'outbox drained' }).toBe(0);
      await expect(page).not.toHaveURL(/sign-in|session-expired/);
      // and the app opens signed in on the next start
      await page.goto('/field/s/dr-01-today-s-run');
      await expect(onScreen(page, 'run-day')).toContainText(VAN, { timeout: 30_000 });
      await expect(page).not.toHaveURL(/sign-in|session-expired/);
    });

    let counted: Record<string, number> = {};
    await test.step('the server reconciles: every stop delivered with its POD, every record once', async () => {
      const { stops: now, events } = await serverState(d, trip.id);
      for (const s of now) {
        expect(s.status, `stop ${s.stopSeq}`).toBe('DELIVERED');
        expect(s.pod?.receiverName).toBe('Dead zone receiver');
        expect(s.pod?.savedOffline, 'tagged as recorded offline').toBe(true);
      }
      for (const s of stops) await expect.poll(async () => (await d.json<Row>(`Orders('${s.orderId}')`)).status, { timeout: 60_000 }).toBe('DELIVERED');
      counted = {};
      for (const e of events) {
        const key = `${e.eventType}:${e.payload?.stopId ?? e.payload?.orderId ?? e.payload?.stopSeq}`;
        counted[key] = (counted[key] ?? 0) + 1;
      }
      for (const s of stops) expect(counted[`POD_SAVE:${s.orderId}`], `one POD_SAVE for ${s.orderId}`).toBe(1);
      expect(Object.entries(counted).filter(([, n]) => n > 1), 'no duplicate records').toEqual([]);
      const pods = (await d.json<{ value: Row[] }>(`PODs?$filter=tripStopId in (${stops.map(s => `'${s.id}'`).join(',')})`)).value;
      expect(pods.length, 'one POD per stop').toBe(stops.length);
    });

    await test.step('a second reconnect replays nothing twice', async () => {
      await page.reload();
      await expect(page).toHaveURL(/\/field\//);
      const { events } = await serverState(d, trip.id);
      expect(events.length).toBe(Object.values(counted).reduce((a, b) => a + b, 0));
    });

    await test.step('designed: the store saw "in progress, low signal", then the recorded-offline receipt (SM-A1)', async () => {
      const notes = (await store.json<{ value: Row[] }>(`Notifications?$orderby=sentAt desc&$top=30`)).value;
      expect.soft(notes.some(n => /OFFLINE|LOW_SIGNAL|SIGNAL/i.test(n.type) && JSON.stringify(n.payload ?? {}).includes(trip.id)), 'store told the van is in a low-signal area').toBe(true);
    });

    await dr.context.close();
  });
});
