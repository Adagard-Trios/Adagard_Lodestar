// Browser sessions for the click specs: one signed-in context per screen test, opened as the screen's persona,
// with the clock frozen, writes intercepted, and everything observable recorded (navigations, API calls, dialogs,
// popups, file choosers, console errors, page errors, 4xx/5xx responses).
//
// Sign-in: Keycloak locks an account on near-simultaneous password logins, so specs/clicks/auth.setup.ts signs each
// persona in ONCE (one after another) and saves the browser storage state (.auth/clicks-<persona>.json): the Keycloak
// SSO cookie. Every test context starts from that state; the apps' own sign-in then completes through SSO without a
// password (desk: FaceGate → Keycloak → straight back; field: the sign-in button's popup closes by itself).
// If the SSO session has expired anyway, the helpers fill the login form (sequential within a test).
//
// Writes: POST/PUT/PATCH/DELETE to the OData API (and Keycloak's admin API) are answered with a 200 mock and counted
// as the control's effect, so the suite can run again and again on the demo data without approving plans, releasing
// trips or revoking phones. Keycloak logout/revoke are mocked too, so a "Sign out" control cannot end the persona's
// SSO session for the other tests. E2E_CLICKS_WRITES=1 lets writes through (destructive: only on a throwaway stack).
import { expect, type Browser, type BrowserContext, type ConsoleMessage, type Page, type Request, type Response } from '@playwright/test';
import { closeSync, existsSync, mkdirSync, openSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MOBILE_URL, PERSONAS, WEB_URL, type PersonaKey } from '../env';
import { ignored, type AllowlistFile } from './allowlist';
import type { ScreenEntry } from './manifest';

export const AUTH_DIR = join(__dirname, '..', '..', '.auth');
export const storageFile = (who: PersonaKey) => join(AUTH_DIR, `clicks-${who}.json`);
/** Saved SSO state younger than this is reused (Keycloak's SSO idle timeout is 30 min in the shipped realm). */
export const STORAGE_MAX_AGE_MS = Number(process.env.E2E_CLICKS_SSO_MAX_AGE_MIN ?? 20) * 60_000;
export const storageFresh = (who: PersonaKey) => existsSync(storageFile(who)) && Date.now() - statSync(storageFile(who)).mtimeMs < STORAGE_MAX_AGE_MS;

export const ALLOW_WRITES = /^(1|true|yes)$/i.test(process.env.E2E_CLICKS_WRITES ?? '');
/** How long a control gets to show an effect. */
export const EFFECT_MS = Number(process.env.E2E_CLICKS_EFFECT_MS ?? 4000);
/** E2E_CLICKS_CLOCK=2026-04-07T10:00:00+05:30 pins every page to that instant; default: the moment the page opens. */
const PINNED_CLOCK = process.env.E2E_CLICKS_CLOCK ? new Date(process.env.E2E_CLICKS_CLOCK) : null;

/** Each persona's own phone (backend/prisma/scenario.ts) and the field sign-in screen + button (design link code). */
export const FIELD_SIGN_IN: Record<PersonaKey, { key: string; button: string; phone: string } | undefined> = {
  storeManager: { key: 'sm-05-sign-in', button: 'lk-L68', phone: 'DEV-FR-01' },
  dispatcher: { key: 'dsp-26-sign-in', button: 'lk-L179', phone: 'DEV-NP-01' },
  loader: { key: 'ld-06-sign-in', button: 'lk-L187', phone: 'DEV-KJ-01' },
  driver: { key: 'dr-06-sign-in', button: 'lk-L229', phone: 'DEV-RB-01' },
  admin: undefined,
};
/** A desk route that sends an anonymous visitor to Keycloak (any persona; non-desk roles see "No desk access" after). */
export const DESK_LANDING: Record<PersonaKey, string> = {
  storeManager: '/store/sm-02-deliveries', dispatcher: '/plan/dsp-08-today-overview', admin: '/admin/adm-02-overview',
  loader: '/plan/dsp-08-today-overview', driver: '/plan/dsp-08-today-overview',
};
/** Each desk face's home: shared chrome (sidebar, top bar) is crawled there once, not on every screen. */
export const FACE_HOME = new Set(['sm-02-deliveries', 'dsp-08-today-overview', 'adm-02-overview']);

const KEYCLOAK_PAGE = /\/realms\/[^/]+\/(protocol\/openid-connect\/auth|login-actions\/)/;
const origin = new URL(WEB_URL).origin;
export const pathOf = (u: string) => { try { return new URL(u, origin).pathname.replace(/\/+$/, '') || '/'; } catch { return u; } };

// ---------------------------------------------------------------- Keycloak

const rejected = async (p: Page) => !p.isClosed() && (await p.getByText(/invalid username or password|account is (temporarily )?disabled/i).first().isVisible().catch(() => false));

/** On a Keycloak page: SSO sends the browser straight back; otherwise the login form is filled once. */
export async function completeKeycloak(page: Page, who: PersonaKey) {
  const p = PERSONAS[who];
  const outcome = await Promise.race([
    page.locator('#password').waitFor({ timeout: 30_000 }).then(() => 'form' as const, () => 'timeout' as const),
    page.waitForURL(u => !KEYCLOAK_PAGE.test(u.toString()), { timeout: 30_000, waitUntil: 'commit' }).then(() => 'sso' as const, () => 'timeout' as const),
    page.waitForEvent('close', { timeout: 30_000 }).then(() => 'sso' as const, () => 'timeout' as const),
  ]);
  if (outcome === 'sso') return;
  if (outcome === 'timeout') throw new Error(`Keycloak did not answer for ${p.username}`);
  const user = page.locator('#username');
  if ((await user.count()) && (await user.isEditable().catch(() => false))) await user.fill(p.username);
  await page.locator('#password').fill(p.password);
  await page.locator('#kc-login').click();
  await Promise.race([
    page.waitForURL(u => !KEYCLOAK_PAGE.test(u.toString()), { timeout: 30_000, waitUntil: 'commit' }),
    page.waitForEvent('close', { timeout: 30_000 }),
  ]).catch(async e => {
    if (await rejected(page)) throw new Error(`Keycloak refused ${p.username}: check E2E_PASSWORD / E2E_PASSWORD_ADMIN`);
    throw e;
  });
}

/** One password sign-in in a fresh browser, saved as the persona's SSO state (used by auth.setup.ts). */
export async function signInOnce(browser: Browser, who: PersonaKey) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    await page.goto(`${WEB_URL}${DESK_LANDING[who]}?design=0`, { waitUntil: 'commit' });
    await page.waitForURL(KEYCLOAK_PAGE, { timeout: 45_000, waitUntil: 'commit' });
    await completeKeycloak(page, who);
    // back in the app: the code exchange finished when the callback route is gone
    await page.waitForURL(u => !/signin-callback|\/realms\//.test(u.toString()), { timeout: 45_000 });
    mkdirSync(AUTH_DIR, { recursive: true });
    await context.storageState({ path: storageFile(who) });
  } finally {
    await context.close();
  }
}

/**
 * The persona's saved SSO state, signing in first if there is none (or it is stale). auth.setup.ts normally did
 * this already; the lock file makes sure parallel workers never log the same account in at the same time when it
 * did not (e.g. a --grep that filtered the setup out, or a run longer than the SSO idle timeout).
 */
export async function ensureSignedIn(browser: Browser, who: PersonaKey) {
  if (storageFresh(who)) return;
  mkdirSync(AUTH_DIR, { recursive: true });
  const lock = join(AUTH_DIR, `clicks-${who}.lock`);
  for (;;) {
    let fd: number | undefined;
    try {
      fd = openSync(lock, 'wx');
    } catch {
      // another worker is signing this persona in: wait for it (or for a stale lock to be cleared)
      await expect.poll(() => {
        if (!existsSync(lock)) return true;
        try { if (Date.now() - statSync(lock).mtimeMs > 120_000) rmSync(lock, { force: true }); } catch { /* gone */ }
        return !existsSync(lock);
      }, { timeout: 150_000, intervals: [250, 500, 1000] }).toBe(true);
      if (storageFresh(who)) return;
      continue;
    }
    try {
      if (!storageFresh(who)) await signInOnce(browser, who);
      return;
    } finally {
      closeSync(fd);
      rmSync(lock, { force: true });
    }
  }
}

// ---------------------------------------------------------------- recorder

export type Effect = { kind: 'navigation' | 'request' | 'write' | 'dialog' | 'popup' | 'filechooser' | 'download' | 'signout'; detail: string };
export type Problem = { kind: 'pageerror' | 'console' | 'http'; text: string; afterMockedWrite?: boolean };

export class Recorder {
  effects: Effect[] = [];
  problems: Problem[] = [];
  warnings: string[] = [];
  inflight = 0;
  private mocks = 0;
  private writesSinceMark = 0;

  mark() { this.writesSinceMark = 0; return { e: this.effects.length, p: this.problems.length, w: this.warnings.length }; }
  effectsSince(m: { e: number }) { return this.effects.slice(m.e); }
  problemsSince(m: { p: number }) { return this.problems.slice(m.p); }
  warningsSince(m: { w: number }) { return this.warnings.slice(m.w); }
  nextMockId() { return `E2E-MOCK-${++this.mocks}`; }
  wrote() { this.writesSinceMark++; }
  problem(p: Problem) { this.problems.push({ ...p, afterMockedWrite: this.writesSinceMark > 0 }); }
}

const isApi = (u: string) => /\/odata\/v4\//.test(u);
const isStatic = (u: string) => /\/_next\/|\/_expo\/|\.(js|css|map|png|jpe?g|svg|webp|ico|woff2?|ttf|json)(\?|$)/.test(u) && !isApi(u);

function mockBody(req: Request, id: string): { status: number; body: string } {
  let data: Record<string, unknown> = {};
  try { data = (req.postDataJSON() as Record<string, unknown>) ?? {}; } catch { /* not JSON */ }
  const url = req.url();
  if (/OfflineEvents\/Lodestar\.PushBatch/.test(url)) {
    const events = Array.isArray(data.events) ? (data.events as { id?: string }[]) : [];
    return { status: 200, body: JSON.stringify({ results: events.map(e => ({ id: e.id, status: 'ACCEPTED' })) }) };
  }
  if (req.method() === 'DELETE') return { status: 204, body: '' };
  const entitySetPost = req.method() === 'POST' && !/\/Lodestar\.[A-Za-z]+(\(|$|\?)/.test(url) && !/\)\s*$/.test(pathOf(url));
  return { status: entitySetPost ? 201 : 200, body: JSON.stringify({ ...data, id: (data.id as string) ?? id, '@e2e.mocked': true }) };
}

/** Routes, listeners and the frozen clock for a click-test context. */
export async function instrument(context: BrowserContext, rec: Recorder, who: PersonaKey, allow: AllowlistFile) {
  // writes: answered here, never reach the backend
  await context.route(u => isApi(u.toString()) || /\/auth\/admin\//.test(u.pathname), async route => {
    const req = route.request();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method()) || ALLOW_WRITES) return route.fallback();
    rec.wrote();
    rec.effects.push({ kind: 'write', detail: `${req.method()} ${pathOf(req.url())}${ALLOW_WRITES ? '' : ' (mocked)'}` });
    const m = mockBody(req, rec.nextMockId());
    return route.fulfill({ status: m.status, contentType: 'application/json', headers: { 'x-e2e-mocked': '1' }, body: m.body || undefined });
  });
  // signing out must not end the persona's SSO session (other tests run on it)
  await context.route(/\/protocol\/openid-connect\/(logout|revoke)/, async route => {
    rec.effects.push({ kind: 'signout', detail: `${route.request().method()} ${pathOf(route.request().url())} (mocked)` });
    const nav = route.request().isNavigationRequest();
    return route.fulfill({ status: 200, contentType: nav ? 'text/html' : 'application/json', body: nav ? '<!doctype html><title>Signed out</title><p>Signed out (mocked by the click test).</p>' : '{}' });
  });

  context.on('request', r => {
    const u = r.url();
    if (isApi(u)) {
      rec.inflight++;
      if (r.method() === 'GET') rec.effects.push({ kind: 'request', detail: `GET ${pathOf(u)}` });
    }
  });
  const done = (r: Request) => { if (isApi(r.url())) rec.inflight = Math.max(0, rec.inflight - 1); };
  context.on('requestfinished', done);
  context.on('requestfailed', done);
  context.on('response', (res: Response) => {
    const s = res.status();
    if (s < 400) return;
    const req = res.request();
    const text = `${s} ${req.method()} ${res.url()}`;
    if (res.headers()['x-e2e-mocked'] || /E2E-MOCK-/.test(res.url())) return; // follow-ups of a mocked write
    if (ignored(allow.ignoreHttp, text)) return;
    if (/\/auth\//.test(new URL(res.url()).pathname) || s === 401) { rec.warnings.push(`HTTP ${text}`); return; } // Keycloak's own checks; 401 → the app renews its token
    if (isStatic(res.url()) && s === 404 && /favicon/.test(res.url())) return;
    rec.problem({ kind: 'http', text: `HTTP ${text}` });
  });
  context.on('page', async p => {
    rec.effects.push({ kind: 'popup', detail: p.url() || 'new window' });
    try {
      await p.waitForLoadState('domcontentloaded', { timeout: 5_000 }).catch(() => undefined);
      if (KEYCLOAK_PAGE.test(p.url()) || (await p.waitForURL(KEYCLOAK_PAGE, { timeout: 5_000, waitUntil: 'commit' }).then(() => true, () => false))) {
        await completeKeycloak(p, who);
      } else if (!p.isClosed()) await p.close();
    } catch (e) {
      rec.warnings.push(`popup: ${String(e).split('\n')[0]}`);
    }
  });
}

export function watchPage(page: Page, rec: Recorder, allow: AllowlistFile) {
  page.on('framenavigated', f => { if (f === page.mainFrame()) rec.effects.push({ kind: 'navigation', detail: f.url() }); });
  page.on('dialog', d => { rec.effects.push({ kind: 'dialog', detail: `${d.type()}: ${d.message()}` }); void d.dismiss().catch(() => undefined); });
  page.on('filechooser', fc => { rec.effects.push({ kind: 'filechooser', detail: fc.isMultiple() ? 'multiple' : 'single' }); });
  page.on('download', d => { rec.effects.push({ kind: 'download', detail: d.suggestedFilename() }); void d.cancel().catch(() => undefined); });
  page.on('pageerror', e => { if (!ignored(allow.ignoreConsole, String(e))) rec.problem({ kind: 'pageerror', text: `${e.name}: ${e.message}`.slice(0, 400) }); });
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/^Failed to load resource/i.test(t)) return; // the response itself is checked (and allowlisted) above
    if (ignored(allow.ignoreConsole, t)) return;
    rec.problem({ kind: 'console', text: t.slice(0, 400) });
  });
}

// ---------------------------------------------------------------- sessions

export type ClickSession = { context: BrowserContext; page: Page; rec: Recorder; screen: ScreenEntry; who: PersonaKey };

export async function openSession(browser: Browser, screen: ScreenEntry, allow: AllowlistFile): Promise<ClickSession> {
  const who = screen.persona as PersonaKey;
  const field = screen.app === 'field';
  await ensureSignedIn(browser, who);
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: screen.viewport,
    ...(field && screen.device === 'phone' ? { isMobile: true, hasTouch: true } : {}),
    ...(existsSync(storageFile(who)) ? { storageState: storageFile(who) } : {}),
  });
  const phone = FIELD_SIGN_IN[who]?.phone;
  if (field && phone) {
    const o = new URL(MOBILE_URL).origin;
    await context.addInitScript(({ o, id }) => { if (window.location.origin === o) window.localStorage.setItem('lodestar.device-id', id); }, { o, id: phone });
  }
  const rec = new Recorder();
  await instrument(context, rec, who, allow);
  const page = await context.newPage();
  watchPage(page, rec, allow);
  return { context, page, rec, screen, who };
}

async function freezeClock(page: Page) {
  await page.clock.setFixedTime(PINNED_CLOCK ?? new Date());
}

/** Waits until the screen has its data: no loading placeholders and no API call in flight (polled, no sleeps). */
export async function settle(s: ClickSession, timeout = 15_000) {
  await expect.poll(async () => {
    if (s.rec.inflight > 0) return false;
    return s.page.evaluate(() => !document.querySelector('[data-state="loading"]')).catch(() => false);
  }, { timeout, intervals: [100, 200, 300, 500] }).toBe(true).catch(() => s.rec.warnings.push(`screen still loading after ${timeout} ms`));
}

const DESK_ROOT = '.web-screen';

/** Opens a desk screen as a fresh page load (the session stays in the tab's sessionStorage; SSO covers the rest). */
async function loadDesk(s: ClickSession) {
  const { page, screen, who } = s;
  await freezeClock(page);
  await page.goto(`${WEB_URL}${screen.path}?design=0`, { waitUntil: 'commit' });
  for (let i = 0; i < 2; i++) {
    const where = await Promise.race([
      page.locator(DESK_ROOT).first().waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'screen' as const, () => 'timeout' as const),
      page.waitForURL(KEYCLOAK_PAGE, { timeout: 45_000, waitUntil: 'commit' }).then(() => 'keycloak' as const, () => 'timeout' as const),
    ]);
    if (where === 'screen') break;
    if (where === 'timeout') throw new Error(`${screen.path} did not render (no ${DESK_ROOT})`);
    await completeKeycloak(page, who);
  }
  await page.locator(DESK_ROOT).first().waitFor({ state: 'visible', timeout: 45_000 });
}

const signedInField = (page: Page) => page.evaluate(() => Boolean(window.sessionStorage.getItem('lodestar.rt'))).catch(() => false);

/** Field sign-in through the role's sign-in screen; the Keycloak popup is completed by the context's popup handler. */
export async function fieldSignIn(s: ClickSession) {
  const sign = FIELD_SIGN_IN[s.who];
  if (!sign) throw new Error(`${s.who} has no field sign-in`);
  const { page } = s;
  await freezeClock(page);
  await page.goto(`${MOBILE_URL}s/${sign.key}`);
  const cta = page.getByTestId(sign.button).locator('visible=true').last();
  const away = (u: URL) => !u.pathname.endsWith(`/s/${sign.key}`);
  const first = await Promise.race([
    expect(cta).toBeEnabled({ timeout: 30_000 }).then(() => 'cta' as const, () => 'timeout' as const),
    page.waitForURL(away, { timeout: 30_000 }).then(() => 'away' as const, () => 'timeout' as const),
  ]);
  if (first === 'timeout') throw new Error(`field sign-in screen ${sign.key} did not offer ${sign.button}`);
  if (first === 'cta') {
    // the PKCE request is prepared after the screen renders: tap again only if nothing happened
    for (let i = 0; i < 3 && !away(new URL(page.url())); i++) {
      await cta.click({ timeout: 10_000 }).catch(() => undefined);
      await page.waitForURL(away, { timeout: 30_000 }).catch(() => undefined);
    }
  }
  await expect(page, `${s.who} signed in on the field app`).not.toHaveURL(new RegExp(`/s/${sign.key}$`), { timeout: 60_000 });
  await expect.poll(() => signedInField(page), { timeout: 15_000 }).toBe(true);
}

/** Opens a field screen as a fresh page load; the tab's stored session is resumed (signs in first if there is none). */
async function loadField(s: ClickSession) {
  const { page, screen } = s;
  if (!(await signedInField(page))) await fieldSignIn(s);
  await freezeClock(page);
  await page.goto(`${MOBILE_URL}s/${screen.key}`);
  await page.waitForFunction(() => (document.getElementById('root')?.innerText ?? document.body.innerText).trim().length > 0, undefined, { timeout: 45_000 });
}

/** The screen in a fresh state, data loaded. Returns the effects mark taken after loading. */
export async function load(s: ClickSession) {
  if (s.screen.app === 'desk') await loadDesk(s);
  else await loadField(s);
  await settle(s);
  return s.rec.mark();
}

/** CSS root of the screen's own content. */
export const rootOf = (s: ClickSession) => (s.screen.app === 'desk' ? DESK_ROOT : 'body');
