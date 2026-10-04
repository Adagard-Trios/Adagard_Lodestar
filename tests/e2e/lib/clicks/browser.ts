// Browser sessions for the click specs: one signed-in context per screen test, opened as the screen's persona,
// with the clock frozen, writes intercepted, and everything observable recorded (navigations, API calls, dialogs,
// popups, file choosers, console errors, page errors, 4xx/5xx responses).
//
// Sign-in: SMS codes are limited (5 per number per hour), so each persona signs in once per app on the designed
// sign-in screen and every test context restores that session (lib/session.ts: saved storage plus a token broker
// that serves the rotated tokens to all contexts). specs/clicks/auth.setup.ts does the sign-ins one after another.
//
// Writes: POST/PUT/PATCH/DELETE to the OData API (and Keycloak's admin API) are answered with a 200 mock and counted
// as the control's effect, so the suite can run again and again on the demo data without approving plans, releasing
// trips or revoking phones. Keycloak logout/revoke are mocked too, so a "Sign out" control cannot end the persona's
// shared session for the other tests. E2E_CLICKS_WRITES=1 lets writes through (destructive: only on a throwaway stack).
import { expect, type Browser, type BrowserContext, type ConsoleMessage, type Page, type Request, type Response } from '@playwright/test';
import { fieldSignIn as signInOnField, loginViaUi } from '../auth';
import { MOBILE_URL, WEB_URL, type PersonaKey } from '../env';
import { FIELD_SIGN_IN_SCREEN, signedInContext, type App } from '../session';
import { ignored, type AllowlistFile } from './allowlist';
import type { ScreenEntry } from './manifest';

export const ALLOW_WRITES = /^(1|true|yes)$/i.test(process.env.E2E_CLICKS_WRITES ?? '');
/** How long a control gets to show an effect. */
export const EFFECT_MS = Number(process.env.E2E_CLICKS_EFFECT_MS ?? 4000);
/** E2E_CLICKS_CLOCK=2026-04-07T10:00:00+05:30 pins every page to that instant; default: the moment the page opens. */
const PINNED_CLOCK = process.env.E2E_CLICKS_CLOCK ? new Date(process.env.E2E_CLICKS_CLOCK) : null;

/** Each persona's own phone (backend/prisma/scenario.ts): the field app starts as that install. */
export const FIELD_PHONE: Partial<Record<PersonaKey, string>> = {
  storeManager: 'DEV-FR-01', dispatcher: 'DEV-NP-01', loader: 'DEV-KJ-01', driver: 'DEV-RB-01',
};
/** Each desk face's home: shared chrome (sidebar, top bar) is crawled there once, not on every screen. */
export const FACE_HOME = new Set(['sm-02-deliveries', 'dsp-08-today-overview', 'adm-02-overview']);

const origin = new URL(WEB_URL).origin;
export const pathOf = (u: string) => { try { return new URL(u, origin).pathname.replace(/\/+$/, '') || '/'; } catch { return u; } };
const SIGN_IN_PATH = /sign-in|2-step-verification|verify-code/;

/** Signs the persona in once on each app the screens need (saved for the click tests' contexts; used by auth.setup.ts). */
export async function ensureSignedIn(browser: Browser, who: PersonaKey, apps: App[]) {
  for (const app of apps) {
    const { context } = await signedInContext(browser, who, app);
    await context.close();
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
  // signing out must not end the persona's shared session (other tests run on it)
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
    if (p === context.pages()[0]) return; // the test's own tab
    rec.effects.push({ kind: 'popup', detail: p.url() || 'new window' });
    try {
      await p.waitForLoadState('domcontentloaded', { timeout: 5_000 }).catch(() => undefined);
      if (!p.isClosed()) await p.close();
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
  const rec = new Recorder();
  const phone = FIELD_PHONE[who];
  const { context, page } = await signedInContext(browser, who, field ? 'field' : 'desk', {
    viewport: screen.viewport,
    ...(field && screen.device === 'phone' ? { isMobile: true, hasTouch: true } : {}),
  }, async ctx => {
    if (field && phone) {
      const o = new URL(MOBILE_URL).origin;
      await ctx.addInitScript(({ o, id }) => { if (window.location.origin === o) window.localStorage.setItem('lodestar.device-id', id); }, { o, id: phone });
    }
    await instrument(ctx, rec, who, allow);
  });
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

/** Opens a desk screen as a fresh page load (the restored session is in the tab's sessionStorage). */
async function loadDesk(s: ClickSession) {
  const { page, screen, who } = s;
  await freezeClock(page);
  for (let i = 0; i < 2; i++) {
    await page.goto(`${WEB_URL}${screen.path}?design=0`, { waitUntil: 'commit' });
    await page.locator(DESK_ROOT).first().waitFor({ state: 'visible', timeout: 45_000 });
    // the session was lost (ended elsewhere): sign in again on the face's screen, then open the screen once more
    if (i === 0 && SIGN_IN_PATH.test(pathOf(page.url())) && !SIGN_IN_PATH.test(screen.path)) await loginViaUi(page, who);
    else break;
  }
}

const signedInField = (page: Page) => page.evaluate(() => Boolean(window.localStorage.getItem('lodestar.rt'))).catch(() => false);

/** Field sign-in on the persona's designed sign-in screen (only when the restored session is gone). */
export async function fieldSignIn(s: ClickSession) {
  const key = FIELD_SIGN_IN_SCREEN[s.who];
  if (!key) throw new Error(`${s.who} has no field sign-in`);
  await freezeClock(s.page);
  await s.page.goto(`${MOBILE_URL}s/${key}`);
  await signInOnField(s.page, s.who);
  await expect.poll(() => signedInField(s.page), { timeout: 15_000 }).toBe(true);
}

/** Opens a field screen as a fresh page load; the stored session is resumed (signs in first if there is none). */
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
