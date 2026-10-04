// The field app's browser build (mobile-web, served by the gateway at /field/) against the running stack:
// sign-in on the designed screens (phone + code, staff ID + PIN), live data from the OData API, the offline outbox, and device
// enrollment (a new phone asks for access, an admin approves it, the phone gets in).
//   npx playwright test --project=mobile-web specs/ui/mobile-live.spec.ts
//
// Device posture: field tokens carry a `device_id` claim and the app sends its install id as X-Device-Id;
// the two must match. The persona tests act as the persona's seeded ACTIVE phone by pre-seeding the app's
// install id (localStorage `lodestar.device-id`) before the app starts:
//   driver ruwan DEV-RB-01 · loader kasun DEV-KJ-01 · store manager fathima DEV-FR-01 · dispatcher nilanthi DEV-NP-01
// (Those four are shared demo phones, so a fresh browser adopts them after sign-in too: specs/ui/web-start.spec.ts.)
import { randomBytes } from 'node:crypto';
import { devices, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { fieldSignIn } from '../../lib/auth';
import { openField } from '../../lib/flows';
import { MOBILE_URL, PERSONAS, type PersonaKey } from '../../lib/env';
import { expect, expectStatus, requireStack, requireUrl, test } from '../../lib/fixtures';
import { oneSignInAtATime, signedInContext } from '../../lib/session';

/** The seeded ACTIVE device of each persona (backend/prisma/scenario.ts, realm attribute device_id). */
const SEEDED_PHONE: Partial<Record<PersonaKey, string>> = {
  driver: 'DEV-RB-01',
  loader: 'DEV-KJ-01',
  storeManager: 'DEV-FR-01',
  dispatcher: 'DEV-NP-01',
};

/** The app keeps its install id here on web (mobile/src/auth/device.ts) and respects a pre-seeded value. */
const DEVICE_ID_KEY = 'lodestar.device-id';

/** Makes the app on MOBILE_URL start as the phone `deviceId` (set before any app script runs). */
async function seedPhone(context: BrowserContext, deviceId: string) {
  const origin = new URL(MOBILE_URL).origin;
  await context.addInitScript(
    ({ origin, key, id }) => {
      if (window.location.origin === origin) window.localStorage.setItem(key, id);
    },
    { origin, key: DEVICE_ID_KEY, id: deviceId },
  );
}

/** Opens the role's designed sign-in screen as the persona's seeded phone and signs in there (phone + code, or staff ID + PIN). */
async function signIn(page: Page, context: BrowserContext, who: PersonaKey, signInScreen: string, phone = SEEDED_PHONE[who]) {
  if (phone) await seedPhone(context, phone);
  await oneSignInAtATime(who, async () => {
    await page.goto(`s/${signInScreen}`);
    await fieldSignIn(page, who);
  });
}

/** The persona's saved field session (lib/session.ts) on its seeded phone, at the Pixel 7 size: no new code is sent. */
async function restored(browser: Browser, who: PersonaKey) {
  const { context, page } = await signedInContext(browser, who, 'field', { ...devices['Pixel 7'], baseURL: MOBILE_URL }, c => seedPhone(c, SEEDED_PHONE[who]!));
  return { context, page };
}

test.describe('Mobile web · live field app @stack', () => {
  requireStack();
  requireUrl(MOBILE_URL, 'mobile-web');

  // Put fathima back on her seeded phone after the enrollment test, also when it timed out (a timed-out test
  // body never reaches its finally block, but afterEach still runs with the test's fixtures).
  let restoreSharedPhone = false;
  test.afterEach(async ({ as }) => {
    if (!restoreSharedPhone) return;
    restoreSharedPhone = false;
    const admin = await as('admin');
    const restore = await admin.post(`Devices('${SEEDED_PHONE.storeManager}')/Lodestar.Activate`, {});
    await expectStatus(restore, 200, 'restore DEV-FR-01');
  });

  test('driver signs in and today\'s run shows the vehicle\'s stops @stack', async ({ page, context }) => {
    await signIn(page, context, 'driver', 'dr-06-sign-in');
    // a first sign-in on this phone continues to the run's first-run screen (DR-08), then today's run
    await expect(page).toHaveURL(/\/s\/dr-08-permissions/, { timeout: 30_000 });
    await page.goto('s/dr-01-today-s-run');
    await expect(page).toHaveURL(/\/s\/dr-01-today-s-run/, { timeout: 30_000 });
    await expect(page.getByTestId('run-day')).toContainText(PERSONAS.driver.vehicleId!, { timeout: 30_000 });
    await expect(page.getByTestId('stop-1')).toBeVisible();
  });

  test('a stop completed offline is queued and synced when the signal returns @stack', async ({ browser, as }) => {
    const startedAt = new Date(Date.now() - 1000).toISOString().replace(/\.\d+Z$/, 'Z');
    const { context, page } = await restored(browser, 'driver');
    await openField(page, 'dr-01-today-s-run'); // in place, as a driver taps through (no reload)
    await expect(page.getByTestId('stop-1')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('stop-1').click();
    await expect(page).toHaveURL(/\/s\/dr-02-stop-arrival/);
    await page.getByTestId('lk-L14').click();
    await expect(page).toHaveURL(/\/s\/dr-03-proof-of-delivery/);
    await expect(page.getByTestId('pod-count')).toBeVisible();

    await context.setOffline(true);
    try {
      // the screen knows it is offline (a reply still in flight could otherwise report the network as back)
      await expect(page.getByText('Offline', { exact: true }).first()).toBeVisible();
      await page.getByTestId('receiver-name').fill('E2E receiver');
      await page.getByTestId('lk-L15').click();
      // saved on the phone: the offline POD screen and a non-empty outbox
      await expect(page).toHaveURL(/\/s\/dr-a2-pod-saved-offline/);
      await expect(page.getByTestId('outbox-waiting')).toHaveText(/[1-9]/);
    } finally {
      await context.setOffline(false);
    }

    // back online: the outbox drains through OfflineEvents/Lodestar.PushBatch
    await expect(page.getByTestId('outbox-waiting')).toHaveText(/^\D*0\b/, { timeout: 45_000 });

    const driver = await as('driver');
    await expect
      .poll(async () => {
        const res = await driver.get(`OfflineEvents?$filter=savedAt ge ${startedAt} and eventType eq 'POD_SAVE'&$top=5`);
        if (res.status() !== 200) return -1;
        return ((await res.json()).value as unknown[]).length;
      }, { timeout: 30_000 })
      .toBeGreaterThan(0);
    await context.close();
  });

  test('loader signs in and sees the bay queue @stack', async ({ page, context, as }) => {
    // today's queue for the loader's depot, as the API has it (empty until a plan is approved)
    const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
    const res = await (await as('loader')).json<{ value: { vehicleId: string }[] } | { vehicleId: string }[]>(
      `Trips/Lodestar.BayQueue(depot='KANDY',runDate=${today})`);
    const queue = Array.isArray(res) ? res : res.value;
    await signIn(page, context, 'loader', 'ld-06-sign-in');
    // a first sign-in on this phone continues to the shift start (LD-07), then the dock queue
    await expect(page).toHaveURL(/\/s\/ld-07-start-shift/, { timeout: 30_000 });
    await page.goto('s/ld-01-dock-queue');
    await expect(page.getByTestId('bay-row-0')).toBeVisible({ timeout: 30_000 });
    if (queue.length) await expect(page.getByTestId('bay-row-0')).toContainText(queue[0].vehicleId);
    // nothing planned for today yet: the dock shows its last run day and says so
    else await expect(page.getByTestId('plan-banner')).toContainText('last run day');
  });

  // A new phone (random install id) for the store manager: it asks for access (SM-32), an admin approves it
  // through the OData API (ADM-05), and "Check again" gets the phone in. Fathima's shared demo phone DEV-FR-01
  // is revoked first (else the browser would adopt it), and approving binds her token to the new phone, so
  // the test re-activates DEV-FR-01 afterwards.
  test('a new phone asks for access, an admin approves it, and Check again lets it in @stack', async ({ page, context, as }) => {
    test.setTimeout(150_000); // two sign-ins with a code on the keypad, an approval and the store opening
    const phone = `DEV-E2E-${randomBytes(8).toString('hex').toUpperCase()}`;
    const admin = await as('admin');
    let activated = false;
    const shared = `Devices('${SEEDED_PHONE.storeManager}')`;
    const revoked = await admin.post(`${shared}/Lodestar.Revoke`, { reason: 'e2e: a user without a shared demo phone' });
    restoreSharedPhone = true;
    try {
      expect([200, 409]).toContain(revoked.status()); // 409: already revoked
      await signIn(page, context, 'storeManager', 'sm-05-sign-in', phone);

      // not bound: the request is sent and the phone waits on SM-32 with its id visible
      await expect(page).toHaveURL(/\/s\/sm-32-access-request-sent/, { timeout: 30_000 });
      await expect(page.getByTestId('device-id')).toHaveText(phone);
      await expect(page.getByTestId('enroll-status')).toHaveText('Sent', { timeout: 30_000 });

      // the request is in the registry, waiting
      const path = `Devices('${phone}')`;
      const pending = await admin.get(path);
      await expectStatus(pending, 200, path);
      expect(await pending.json()).toMatchObject({ id: phone, status: 'PENDING', platform: 'web' });

      // still waiting: Check again keeps the phone here
      await page.getByTestId('check-again').click();
      await expect(page.getByTestId('enroll-status')).toHaveText('Sent', { timeout: 30_000 });
      await expect(page).toHaveURL(/\/s\/sm-32-access-request-sent/);

      // ADM-05: the admin approves the phone
      const approve = await admin.post(`${path}/Lodestar.Activate`, {});
      await expectStatus(approve, 200, `${path}/Lodestar.Activate`);
      activated = true;
      expect(await approve.json()).toMatchObject({ id: phone, status: 'ACTIVE' });

      // Check again: the token is refreshed. The approval ended fathima's sessions, so the app asks to sign in
      // once more (SM-05); the new token names this phone and the store opens at its first-run screen (SM-07).
      const opened = /\/s\/(sm-07-onboarding-1|sm-11-today-order-day)/;
      await page.getByTestId('check-again').click();
      const outcome = await Promise.race([
        page.waitForURL(opened, { timeout: 30_000 }).then(() => 'home', () => 'none'),
        expect(page.getByTestId('enroll-title')).toHaveText('Sign in again to continue', { timeout: 30_000 }).then(() => 'signin', () => 'none'),
      ]);
      if (outcome === 'signin') {
        await oneSignInAtATime('storeManager', async () => {
          await page.getByTestId('check-again').click();
          await fieldSignIn(page, 'storeManager');
        });
      }
      await expect(page).toHaveURL(opened, { timeout: 30_000 });
    } finally {
      // Drop a request that was never approved; afterEach puts fathima back on DEV-FR-01 (revoking the e2e phone).
      if (!activated) {
        const row = await admin.get(`Devices('${phone}')`);
        if (row.status() === 200 && (await row.json()).status === 'PENDING') await admin.post(`Devices('${phone}')/Lodestar.Revoke`, { reason: 'e2e cleanup' });
      }
    }
  });
});
