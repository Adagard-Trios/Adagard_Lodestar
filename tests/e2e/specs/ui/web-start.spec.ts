// One URL, every role (@stack): from a fresh browser, the start page (/) offers each role; picking it and
// signing in as its persona opens that role's home. No devtools step: the field app (/field/, same origin)
// adopts the persona's seeded phone itself once the backend confirms it is an ACTIVE shared demo phone of
// that user (mobile/src/auth/enrollment.ts). Driver, loader and the store's phone app run at 390 × 844.
//
//   npx playwright test --project=web-chromium specs/ui/web-start.spec.ts
import type { Page } from '@playwright/test';
import { fieldSignIn, loginViaUi } from '../../lib/auth';
import { PERSONAS, WEB_URL, type PersonaKey } from '../../lib/env';
import { expect, requireStack, test } from '../../lib/fixtures';

/** The start page's link name for each role, and where the role lands after sign-in. */
const DESK: { who: PersonaKey; role: string; home: RegExp }[] = [
  { who: 'storeManager', role: 'Store manager', home: /\/store\/sm-02-deliveries$/ },
  { who: 'dispatcher', role: 'Dispatcher', home: /\/plan\/dsp-08-today-overview$/ },
  { who: 'admin', role: 'Admin', home: /\/admin\/adm-02-overview$/ },
];
// After the designed sign-in each phone app continues to its first-run screen (DR-08, LD-07, SM-07), as in Designing/.
const FIELD: { who: PersonaKey; role: string | RegExp; button: string; home: RegExp }[] = [
  { who: 'driver', role: 'Driver', button: 'lk-L229', home: /\/field\/s\/dr-08-permissions/ },
  { who: 'loader', role: 'Loader', button: 'lk-L187', home: /\/field\/s\/ld-07-start-shift/ },
  { who: 'storeManager', role: /Phone app/, button: 'lk-L68', home: /\/field\/s\/sm-07-onboarding-1/ },
];

async function pickRole(page: Page, role: string | RegExp) {
  await page.goto(`${WEB_URL}/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Waypoint Lodestar' })).toBeVisible();
  await page.getByRole('link', { name: typeof role === 'string' ? new RegExp(`^${role}:`) : role }).click();
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
      test(`${typeof r.role === 'string' ? r.role : 'Store phone app'} signs in as ${PERSONAS[r.who].username} with no device setup and reaches the home screen`, async ({ page }) => {
        await pickRole(page, r.role);
        await expect(page).toHaveURL(/\/field\/s\//);
        // a fresh browser: no install id was placed by hand
        expect(await page.evaluate(() => window.localStorage.getItem('lodestar.shared-device-id'))).toBeNull();
        await fieldSignIn(page, r.who);
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
