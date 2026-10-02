// Admin flow (Designing 07b): a lost phone and a new one. The admin revokes the store manager's lost phone
// (ADM-07); her new phone asks for access when she signs in (SM-32); the admin approves it (ADM-05); "Check
// again" gets her in; every step is in the hash-chained audit log (ADM-16) and the chain verifies (ADM-20).
// Desk at 1440×900, the phone at 390×844. Fathima's shared demo phone DEV-FR-01 is restored afterwards.
import { expect, expectStatus, requireStack, test } from '../../lib/fixtures';
import { deskPage, onScreen, signInFrom, type Row } from '../../lib/flows';
import { WEB_URL } from '../../lib/env';

const LOST = 'DEV-FR-01';

test.describe('Admin · lost phone → access request → approval → audit', { tag: '@stack' }, () => {
  requireStack();

  test.afterEach(async ({ as }) => {
    // put fathima back on her shared demo phone (this revokes the phone the test approved)
    const admin = await as('admin');
    if ((await admin.json<Row>(`Devices('${LOST}')`)).status !== 'ACTIVE') {
      await expectStatus(await admin.post(`Devices('${LOST}')/Lodestar.Activate`, {}), 200, `restore ${LOST}`);
    }
  });

  test('the admin revokes a lost phone, approves the new one, and the audit log keeps both', async ({ browser, as }) => {
    test.setTimeout(10 * 60_000);
    const admin = await as('admin');
    const adm = await deskPage(browser, 'admin', `/admin/adm-07-lost-phone?id=${LOST}`);
    const desk = adm.page;

    await test.step('ADM-07: the lost phone is revoked with an audit note', async () => {
      await expect(desk.getByLabel('Device')).toHaveValue(LOST, { timeout: 30_000 });
      await desk.getByLabel('Audit note').fill('Flow: phone lost on the hill road');
      await desk.getByTestId('revoke').click();
      await expect.poll(async () => (await admin.json<Row>(`Devices('${LOST}')`)).status, { timeout: 30_000 }).toBe('REVOKED');
    });

    // a new phone (fresh browser), so no shared demo phone to adopt: it must ask for access
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
    const page = await phone.newPage();
    let newId = '';
    await test.step('SM-05 → SM-32: the store manager signs in on her new phone, which asks for access', async () => {
      await page.goto(`${WEB_URL}/field/s/sm-05-sign-in`);
      await signInFrom(page, 'lk-L68', 'storeManager');
      await expect(page).toHaveURL(/sm-32-access-request-sent/, { timeout: 30_000 });
      newId = (await onScreen(page, 'device-id').innerText()).trim();
      expect(newId).toMatch(/^DEV-/);
      expect(newId).not.toBe(LOST);
      await expect(onScreen(page, 'enroll-status')).toHaveText('Sent', { timeout: 30_000 });
      expect((await admin.json<Row>(`Devices('${newId}')`)).status).toBe('PENDING');
    });

    await test.step('ADM-05: the admin approves the new phone', async () => {
      await desk.goto('/admin/adm-05-access-requests');
      const row = desk.locator(`[data-device="${newId}"]`);
      await expect(row).toBeVisible({ timeout: 30_000 });
      await row.click();
      await desk.getByTestId('approve-device').click();
      await expect.poll(async () => (await admin.json<Row>(`Devices('${newId}')`)).status, { timeout: 30_000 }).toBe('ACTIVE');
    });

    await test.step('SM-32: "Check again" (and one more sign-in) opens her store', async () => {
      await onScreen(page, 'check-again').click();
      const home = page.waitForURL(/sm-11-today-order-day/, { timeout: 30_000 }).then(() => true, () => false);
      if (!(await home)) await signInFrom(page, 'check-again', 'storeManager');
      await expect(page).toHaveURL(/sm-11-today-order-day/, { timeout: 30_000 });
    });

    await test.step('ADM-16 / ADM-20: revoke and approval are audited and the chain verifies', async () => {
      const entries = (await admin.json<{ value: Row[] }>(`AuditEntries?$filter=entityKey in ('${LOST}','${newId}')&$orderby=at desc&$top=20`)).value;
      const actions = entries.map(e => `${e.action}:${e.entityKey}`);
      expect(actions.some(a => a.startsWith('Devices.Revoke') && a.endsWith(LOST)), `revoke audited: ${actions.join(', ')}`).toBe(true);
      expect(actions.some(a => /Devices\.(Activate|BindIdentity)/.test(a) && a.endsWith(newId)), `approval audited: ${actions.join(', ')}`).toBe(true);
      expect(actions.some(a => a.startsWith('Devices.Enroll') && a.endsWith(newId)), `access request audited: ${actions.join(', ')}`).toBe(true);
      await desk.goto('/admin/adm-16-audit-log');
      await desk.getByLabel('Search the audit log').fill(newId);
      await expect(desk.getByTestId('audit-log')).toContainText(newId, { timeout: 30_000 });
      await desk.goto('/admin/adm-20-chain-check-result');
      await expect(desk.getByTestId('chain-valid')).toBeVisible({ timeout: 60_000 });
    });

    await Promise.all([phone.close(), adm.context.close()]);
  });
});
