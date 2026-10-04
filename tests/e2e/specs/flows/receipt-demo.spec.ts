import { expect, test, type Page } from '@playwright/test';
import { signedInContext } from '../../lib/session';
import { bearer, tokenFor } from '../../lib/auth';
import { ODATA } from '../../lib/env';
const SHOT = process.env.SHOT_DIR ?? 'test-results/receipt-demo';
const P = process.env.PFX ?? 'r';
const log: string[] = [];
function watch(page: Page, who: string) {
  page.on('console', m => { if (m.type() === 'error') log.push(`[${who} console] ${m.text().slice(0, 300)}`); });
  page.on('response', r => { if (r.status() >= 400) log.push(`[${who} ${r.status()}] ${r.request().method()} ${r.url().slice(0, 200)}`); });
  page.on('requestfailed', r => log.push(`[${who} failed] ${r.url().slice(0, 200)} ${r.failure()?.errorText}`));
}
test('receipt flow', async ({ browser, request }) => {
  test.setTimeout(600_000);
  // setup through the real action: the van's stop at OUT106 is completed with a POD (driver/dispatcher CompleteStop)
  const h = bearer(await tokenFor('dispatcher', request));
  const open = (await (await request.get(`${ODATA}/TripStops?$filter=outletId eq 'OUT106' and status ne 'DELIVERED' and trip/status eq 'ENROUTE'&$orderby=etaPlan&$top=3&$expand=order($select=units)`, { headers: h })).json()).value as any[];
  console.log('open stops', open.map(s => `${s.id} ${s.orderId} ${s.tripId}`));
  for (const st of open.filter(s => s.tripId === open[0]?.tripId)) {
    const r = await request.post(`${ODATA}/TripStops('${st.id}')/Lodestar.CompleteStop`, { headers: h, data: { unitsDelivered: st.order.units, unitsOrdered: st.order.units, receiverName: 'Fathima Rizwan', arrivalActual: new Date().toISOString(), leaveActual: new Date().toISOString() } });
    console.log('complete', st.orderId, r.status(), r.ok() ? '' : (await r.text()).slice(0, 300));
  }
  const vp = { viewport: { width: 1440, height: 900 } };
  const sm = await signedInContext(browser, 'storeManager', 'desk', vp);
  const p = sm.page; watch(p, 'sm');
  await p.goto('/store/sm-02-deliveries');
  const card = p.getByTestId('receipt');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await p.screenshot({ path: `${SHOT}/${P}1-sm02-delivery-in.png` });
  const rows = card.locator('[data-receipt]');
  const first = (await rows.first().getAttribute('data-receipt'))!;
  await p.getByTitle(`One less for ${first}`).click();
  await p.getByTitle(`One less for ${first}`).click();
  await p.screenshot({ path: `${SHOT}/${P}2-sm02-counted.png` });
  await p.getByTestId('report-issue').click();
  await p.getByRole('radio', { name: 'Damaged' }).click();
  await card.locator('textarea').fill('2 trays crushed in transit');
  await p.screenshot({ path: `${SHOT}/${P}3-sm02-issue.png` });
  await p.getByTestId('confirm-receipt').click();
  await expect(p.getByTestId('receipt-done')).toBeVisible({ timeout: 120_000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${SHOT}/${P}4-sm02-confirmed.png` });
  console.log('done text:', await p.getByTestId('receipt-done').innerText());
  const ds = await signedInContext(browser, 'dispatcher', 'desk', vp);
  const d = ds.page; watch(d, 'dsp');
  await d.goto('/plan/dsp-04-live-operations');
  await d.waitForTimeout(6000);
  await d.screenshot({ path: `${SHOT}/${P}5-dsp04.png` });
  console.log('dsp04 has order:', await d.getByText(first).count(), 'head:', await d.locator('.d-h1').first().innerText());
  await d.goto('/plan/dsp-17-deferral-log');
  await d.waitForTimeout(6000);
  await d.screenshot({ path: `${SHOT}/${P}6-dsp17.png` });
  console.log('order', first, '\n' + log.join('\n'));
});
