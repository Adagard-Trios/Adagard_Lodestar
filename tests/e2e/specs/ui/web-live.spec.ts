// The desk website signed in through Keycloak, on live data (@stack): needs `docker compose up` (gateway on
// https://localhost:8443). Each test signs in on the face's sign-in screen ("Continue to sign in" → Keycloak's
// hosted form → back with code + PKCE), so tokens live in the tab's sessionStorage only.
//
//   cd tests/e2e && npm run test:stack -- --project=web-chromium specs/ui/web-live.spec.ts
//
// Seed values come from lib/env.ts (E2E_RUN_DATE, E2E_PLAN_ID, E2E_STORE_MANAGER_OUTLET, E2E_OTHER_OUTLET, …).
import type { Page } from '@playwright/test';
import { loginViaUi } from '../../lib/auth';
import { OTHER_OUTLET, PERSONAS, SEED_RUN_DATE, WEB_URL, type PersonaKey } from '../../lib/env';
import { expect, requireStack, test } from '../../lib/fixtures';

const SIGN_IN: Record<'plan' | 'store' | 'admin', string> = {
  plan: '/plan/dsp-06-sign-in',
  store: '/store/sm-26-sign-in',
  admin: '/admin/adm-01-sign-in',
};
const HOME: Record<'plan' | 'store' | 'admin', RegExp> = {
  plan: /\/plan\/dsp-08-today-overview$/,
  store: /\/store\/sm-02-deliveries$/,
  admin: /\/admin\/adm-02-overview$/,
};
/** The scenario's hero trip runs on the driver persona's vehicle. */
const HERO_VEHICLE = PERSONAS.driver.vehicleId;

async function signIn(page: Page, who: PersonaKey, face: 'plan' | 'store' | 'admin') {
  await page.goto(`${WEB_URL}${SIGN_IN[face]}?design=0`);
  await page.getByTestId('sign-in').click();
  await loginViaUi(page, who);
  // Lands on the face for the role: dispatcher → /plan, store manager → /store, admin → /admin.
  await expect(page).toHaveURL(HOME[face], { timeout: 30_000 });
  const storage = await page.evaluate(() => ({ session: Object.keys(sessionStorage), local: Object.keys(localStorage) }));
  expect(storage.session.some(k => k.startsWith('oidc.user:')), 'tokens in sessionStorage').toBe(true);
  expect(storage.local.some(k => k.startsWith('oidc.')), 'no tokens in localStorage').toBe(false);
}

async function open(page: Page, path: string) {
  await page.goto(`${WEB_URL}${path}${path.includes('?') ? '&' : '?'}design=0`);
  await expect(page.locator('.web-screen .frame')).toBeVisible({ timeout: 30_000 });
}

test.describe('Web · live screens', { tag: '@stack' }, () => {
  requireStack();
  test.describe.configure({ mode: 'serial' });

  test('an anonymous visit to an app route goes to Keycloak', async ({ page }) => {
    await page.goto(`${WEB_URL}/plan/dsp-02-plan-board?design=0`);
    await page.waitForURL(/\/realms\/.+\/protocol\/openid-connect\/auth/, { timeout: 30_000 });
    const url = new URL(page.url());
    expect(url.searchParams.get('client_id')).toBe('lodestar-web');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  test('dispatcher signs in and the plan board shows the real trips', async ({ page }) => {
    await signIn(page, 'dispatcher', 'plan');
    await open(page, `/plan/dsp-02-plan-board?runDate=${SEED_RUN_DATE}`);
    const board = page.getByTestId('board');
    await expect(board.locator('[data-vehicle]').first()).toBeVisible({ timeout: 30_000 });
    if (HERO_VEHICLE) await expect(board.locator(`[data-vehicle="${HERO_VEHICLE}"]`)).toBeVisible();
    await expect(page.locator('[data-state="error"]')).toHaveCount(0);
  });

  test('dispatcher starts a planning-agent run, it waits for approval, and a human approves it', async ({ page, as }) => {
    test.setTimeout(180_000);
    await signIn(page, 'dispatcher', 'plan');
    await open(page, `/plan/dsp-01-cutoff-queue?runDate=${SEED_RUN_DATE}`);
    await page.getByTestId('start-agent').click();

    // DSP-22 follows the run; at NEEDS_APPROVAL it opens the plan board with the draft.
    // (the run usually reaches NEEDS_APPROVAL within the POST, so DSP-22 may only show for 1.5 s)
    await page.waitForURL(/\/plan\/dsp-(22-planning-agent-drafting|02-plan-board)$/, { timeout: 60_000 });
    await expect(page).toHaveURL(/\/plan\/dsp-02-plan-board$/, { timeout: 90_000 });
    await expect(page.locator('.d-eyebrow').first()).toContainText('waiting for your approval');
    const runId = await page.evaluate(() => sessionStorage.getItem('lodestar.agentRun'));
    expect(runId).toBeTruthy();

    const dispatcher = await as('dispatcher');
    const before = await dispatcher.json<{ status: string }>(`AgentRuns('${runId}')`);
    expect(before.status).toBe('NEEDS_APPROVAL');

    // Only a human publishes: DSP-12 → Resume {decision: approve}.
    await open(page, `/plan/dsp-12-approve-and-go-live?runDate=${SEED_RUN_DATE}`);
    await expect(page.getByText('The agent cannot publish on its own.')).toBeVisible();
    await page.getByTestId('approve').click();
    await expect(page.locator('#approve-title')).toContainText(/is live|is approved/, { timeout: 60_000 });
    await expect(page.getByRole('status')).toContainText('Continues in Lodestar Dock');

    const after = await dispatcher.json<{ status: string; decision?: string; planId?: string }>(`AgentRuns('${runId}')`);
    expect(after.status).toBe('APPROVED');
    expect(after.decision).toBe('approve');
    if (after.planId) {
      const plan = await dispatcher.json<{ status: string; approvedBy?: string }>(`Plans('${after.planId}')`);
      expect(['APPROVED', 'PUBLISHED']).toContain(plan.status);
    }
  });

  test('store manager sees only the orders of their own outlet', async ({ page }) => {
    await signIn(page, 'storeManager', 'store');
    await open(page, '/store/sm-27-orders-and-history');
    const rows = page.locator('[data-testid="orders"] [data-order]');
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    const outlets = await rows.evaluateAll(els => [...new Set(els.map(e => e.getAttribute('data-outlet')))]);
    expect(outlets).toEqual([PERSONAS.storeManager.outletId]);
    await expect(page.locator(`[data-testid="orders"] [data-outlet="${OTHER_OUTLET}"]`)).toHaveCount(0);

    // Another face is not theirs: the guard sends them back to the store desk.
    await page.goto(`${WEB_URL}/plan/dsp-02-plan-board?design=0`);
    await expect(page).toHaveURL(/\/store\//, { timeout: 30_000 });
  });

  test('admin audit log shows entries and VerifyChain is valid', async ({ page }) => {
    await signIn(page, 'admin', 'admin');
    await open(page, '/admin/adm-16-audit-log');
    await expect(page.locator('[data-testid="audit-log"] [data-seq]').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('chain-hero')).toContainText('Intact', { timeout: 60_000 });

    await open(page, '/admin/adm-20-chain-check-result');
    await expect(page.getByTestId('chain-valid')).toHaveAttribute('data-valid', 'true', { timeout: 60_000 });
  });

  test('sign out ends the session at Keycloak', async ({ page }) => {
    await signIn(page, 'admin', 'admin');
    await page.locator('.d-side__foot .lv-click').click();
    await page.waitForURL(u => !u.pathname.startsWith('/admin'), { timeout: 30_000 });
    await page.goto(`${WEB_URL}/admin/adm-02-overview?design=0`);
    await page.waitForURL(/\/realms\/.+\/protocol\/openid-connect\/auth/, { timeout: 30_000 });
  });
});
