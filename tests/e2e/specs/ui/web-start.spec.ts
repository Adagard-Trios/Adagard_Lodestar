// One URL, every role (@stack): from a fresh browser, the start page (/) offers each role; picking it and
// signing in as its persona opens that role's home. No devtools step: the field app (/field/, same origin)
// adopts the persona's seeded phone itself once the backend confirms it is an ACTIVE shared demo phone of
// that user (mobile/src/auth/enrollment.ts). Driver, loader and the store's phone app run at 390 × 844.
//
//   npx playwright test --project=web-chromium specs/ui/web-start.spec.ts
import type { BrowserContext, Page } from '@playwright/test';
import { loginViaUi } from '../../lib/auth';
import { PERSONAS, WEB_URL, type PersonaKey } from '../../lib/env';
import { expect, requireStack, test } from '../../lib/fixtures';

/** The start page's link name for each role, and where the role lands after sign-in. */
const DESK: { who: PersonaKey; role: string; home: RegExp }[] = [
  { who: 'storeManager', role: 'Store manager', home: /\/store\/sm-02-deliveries$/ },
  { who: 'dispatcher', role: 'Dispatcher', home: /\/plan\/dsp-08-today-overview$/ },
  { who: 'admin', role: 'Admin', home: /\/admin\/adm-02-overview$/ },
];
const FIELD: { who: PersonaKey; role: string | RegExp; button: string; home: RegExp }[] = [
  { who: 'driver', role: 'Driver', button: 'lk-L229', home: /\/field\/s\/dr-01-today-s-run/ },
  { who: 'loader', role: 'Loader', button: 'lk-L187', home: /\/field\/s\/ld-01-dock-queue/ },
  { who: 'storeManager', role: /Phone app/, button: 'lk-L68', home: /\/field\/s\/sm-11-today-order-day/ },
];

async function pickRole(page: Page, role: string | RegExp) {
  await page.goto(`${WEB_URL}/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Waypoint Lodestar' })).toBeVisible();
  await page.getByRole('link', { name: typeof role === 'string' ? new RegExp(`^${role}:`) : role }).click();
}

/** The field app signs in through a Keycloak popup that hands the code back and closes. */
async function signInInPopup(page: Page, context: BrowserContext, who: PersonaKey, button: string) {
  const cta = page.getByTestId(button);
  await expect(cta).toBeEnabled({ timeout: 30_000 });
  // the PKCE request is prepared after the screen renders: tap again if the first tap came too early
  let popup: Page | undefined;
  for (let i = 0; i < 3 && !popup; i++) {
    [popup] = await Promise.all([context.waitForEvent('page', { timeout: 10_000 }).catch(() => undefined), cta.click()]);
  }
  if (!popup) throw new Error('the sign-in window did not open');
  const p = PERSONAS[who];
  await popup.waitForURL(/\/realms\/.+\/protocol\/openid-connect\/auth|\/login-actions\//, { timeout: 30_000 });
  await popup.locator('#username').fill(p.username);
  await popup.locator('#password').fill(p.password);
  await popup.locator('#kc-login').click();
  await popup.waitForEvent('close', { timeout: 30_000 }).catch(() => undefined);
}

test.describe('Start page · every role from one URL', { tag: '@stack' }, () => {
  requireStack();

  for (const r of DESK) {
    test(`${r.role} picks the role, signs in as ${PERSONAS[r.who].username} and reaches the home screen`, async ({ page }) => {
      await pickRole(page, r.role);
      await loginViaUi(page, r.who);
      await expect(page).toHaveURL(r.home, { timeout: 30_000 });
      await expect(page.locator('.web-screen .frame')).toBeVisible();
    });
  }

  test.describe('on a phone (390 × 844)', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    for (const r of FIELD) {
      test(`${typeof r.role === 'string' ? r.role : 'Store phone app'} signs in as ${PERSONAS[r.who].username} with no device setup and reaches the home screen`, async ({ page, context }) => {
        await pickRole(page, r.role);
        await expect(page).toHaveURL(/\/field\/s\//);
        // a fresh browser: no install id was placed by hand
        expect(await page.evaluate(() => window.localStorage.getItem('lodestar.shared-device-id'))).toBeNull();
        await signInInPopup(page, context, r.who, r.button);
        await expect(page).toHaveURL(r.home, { timeout: 30_000 });
        // the persona's seeded phone was adopted after the backend confirmed it; no access request
        expect(await page.evaluate(() => window.localStorage.getItem('lodestar.shared-device-id'))).toMatch(/^DEV-[A-Z]{2}-01$/);
        await expect(page).not.toHaveURL(/sm-32-access-request-sent/);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  });
});
