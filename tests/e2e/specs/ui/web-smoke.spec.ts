// UI smoke of the desk website on chromium, firefox and webkit.
// The untagged tests only need the website (E2E_WEB_URL, e.g. http://localhost:3100 for `next start`);
// the @stack ones need Keycloak too.
import { loginViaUi } from '../../lib/auth';
import { CLIENT_ID, KEYCLOAK_URL, PERSONAS, REALM, REDIRECT_URI, WEB_URL } from '../../lib/env';
import { expect, requireStack, requireUrl, test } from '../../lib/fixtures';
import type { Page } from '@playwright/test';

async function hydrated(page: Page) {
  // ScreenShell gives wired elements role=button once React has hydrated; before that clicks do nothing.
  await expect(page.locator('.web-screen [data-lk][role]').first()).toBeAttached({ timeout: 30_000 });
}

test.describe('Web · desk faces', () => {
  requireUrl(WEB_URL, 'desk website');

  test('home lists the three faces and their screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Waypoint Lodestar' })).toBeVisible();
    for (const face of ['Lodestar Store', 'Lodestar Plan', 'Lodestar Admin']) {
      await expect(page.getByRole('link', { name: new RegExp(`${face}.*Open`) })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /DSP-01\s*Cutoff queue/ })).toHaveAttribute('href', '/plan/dsp-01-cutoff-queue');
  });

  test('screens hydrate without page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(`${page.url()}: ${e.message}`));
    for (const path of ['/', '/store/sm-01-place-order', '/plan/dsp-02-plan-board', '/plan/dsp-b1-re-plan-diff', '/admin/adm-02-overview']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    expect(errors).toEqual([]);
  });

  for (const [face, signIn] of [['store', '/store/sm-26-sign-in'], ['plan', '/plan/dsp-06-sign-in'], ['admin', '/admin/adm-01-sign-in']]) {
    test(`/${face} opens at its sign-in screen`, async ({ page }) => {
      await page.goto(`/${face}`);
      await expect(page).toHaveURL(new RegExp(`${signIn}$`));
      await expect(page.locator('.web-screen')).toBeVisible();
    });
  }

  test('happy path: a store order reaches the cutoff queue, then the agent draft', async ({ page }) => {
    await page.goto('/store/sm-01-place-order');
    await hydrated(page);
    await page.locator('[data-lk="L0"]').click();
    await expect(page).toHaveURL(/\/plan\/dsp-01-cutoff-queue$/);
    await hydrated(page);
    await page.locator('[data-lk="L1"]').click();
    await expect(page).toHaveURL(/\/plan\/dsp-22-planning-agent-drafting$/);
    await expect(page).toHaveURL(/\/plan\/dsp-02-plan-board$/, { timeout: 10_000 }); // auto-advance
  });

  test('keyboard: Enter on a wired element navigates', async ({ page }) => {
    await page.goto('/plan/dsp-02-plan-board');
    await hydrated(page);
    const review = page.locator('[data-lk="L3"]');
    await review.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/plan\/dsp-03-deferral-decision$/);
  });

  test('phone-only continuation shows the cross-device notice', async ({ page }) => {
    await page.goto('/plan/dsp-12-approve-and-go-live');
    await hydrated(page);
    await page.locator('[data-lk="L5"]').click();
    await expect(page.getByRole('status')).toContainText('Continues in Lodestar Dock on the phone');
    await expect(page).toHaveURL(/\/plan\/dsp-12-approve-and-go-live$/);
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('dead zone: blackout view to provisional deferral', async ({ page }) => {
    await page.goto('/plan/dsp-a1-blackout-view');
    await hydrated(page);
    await expect(page.getByText('Predicted, not live')).toBeVisible();
    await page.locator('[data-lk="L25"]').click();
    await expect(page).toHaveURL(/\/plan\/dsp-a1b-provisional-deferral$/);
  });
});

test.describe('Web · sign-in through Keycloak', { tag: '@stack' }, () => {
  requireStack();

  test('the dispatcher signs in on the hosted login page and is sent back with a code', async ({ page }) => {
    const redirect = REDIRECT_URI;
    const url = new URL(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`);
    url.search = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid', state: 'e2e' }).toString();

    // Don't let the SPA consume the code: stop at the redirect.
    let returned: URL | undefined;
    await page.route(`${redirect}**`, route => {
      returned = new URL(route.request().url());
      return route.fulfill({ status: 200, body: 'ok' });
    });
    await page.goto(url.toString());
    await loginViaUi(page, 'dispatcher');
    await expect.poll(() => returned?.searchParams.get('code') ?? null).not.toBeNull();
    expect(returned!.searchParams.get('state')).toBe('e2e');
  });

  test('a wrong password stays on the login page with an error', async ({ page }) => {
    const url = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid`;
    await page.goto(url);
    await page.locator('#username').fill(PERSONAS.dispatcher.username);
    await page.locator('#password').fill('definitely-wrong');
    await page.locator('#kc-login').click();
    await expect(page.locator('#input-error, .kc-feedback-text, [id*="error"]').first()).toBeVisible();
    await expect(page).toHaveURL(/\/realms\//);
  });
});
