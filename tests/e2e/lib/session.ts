// Signed-in browser contexts per persona that do not burn SMS codes (Keycloak sends at most 5 codes per number
// per hour). The first context of a persona signs in on the app's designed screen (lib/auth.ts loginViaUi /
// fieldSignIn) and saves its storage (.auth/session-<app>-<persona>.json). Every later context starts from that
// storage, and its token renewals go through a small broker on the context: Keycloak rotates refresh tokens
// (revokeRefreshToken, no reuse), so contexts sharing one session must not each refresh with the same token.
// The broker keeps the chain head on disk (shared by all workers, under a file lock), answers a renewal with the
// current tokens while they are fresh, and otherwise refreshes once with the head's refresh token.
// When the saved session is gone (expired, ended by a test), the persona signs in again, one worker at a time.
import { expect, type Browser, type BrowserContext, type BrowserContextOptions, type Page, type Route } from '@playwright/test';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fieldSignIn, loginViaUi } from './auth';
import { MOBILE_URL, WEB_URL, type PersonaKey } from './env';

export type App = 'desk' | 'field';
type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;
type Head = { body: Record<string, unknown>; refreshToken: string; issuedAt: number; expiresAt: number; refreshUntil: number };
type Saved = { head?: Head; state?: StorageState; sessionStorage?: Record<string, string> };

const DIR = join(__dirname, '..', '.auth');
const fileOf = (who: PersonaKey, app: App) => join(DIR, `session-${app}-${who}.json`);

/** Each desk persona's home (an anonymous visit is sent to the face's sign-in screen). */
export const DESK_HOME: Partial<Record<PersonaKey, string>> = {
  storeManager: '/store/sm-02-deliveries', dispatcher: '/plan/dsp-08-today-overview', admin: '/admin/adm-02-overview',
};
/** The field sign-in screen per persona (the dispatcher's phone face has only a fingerprint unlock: the phone + code screen signs her in). */
export const FIELD_SIGN_IN_SCREEN: Partial<Record<PersonaKey, string>> = {
  storeManager: 'sm-05-sign-in', dispatcher: 'sm-05-sign-in', loader: 'ld-06-sign-in', driver: 'dr-06-sign-in',
};

function read(who: PersonaKey, app: App): Saved {
  try { return JSON.parse(readFileSync(fileOf(who, app), 'utf8')) as Saved; } catch { return {}; }
}
function write(who: PersonaKey, app: App, patch: Partial<Saved>) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(fileOf(who, app), JSON.stringify({ ...read(who, app), ...patch }));
}
const alive = (h?: Head) => Boolean(h && Date.now() < h.refreshUntil);

function headFrom(body: Record<string, unknown>): Head {
  const now = Date.now();
  return {
    body, refreshToken: String(body.refresh_token ?? ''), issuedAt: now,
    expiresAt: now + Number(body.expires_in ?? 60) * 1000,
    // a refresh token that can still be used: SSO idle (refresh_expires_in) minus a margin
    refreshUntil: now + Math.max(0, Number(body.refresh_expires_in ?? 1800) - 120) * 1000,
  };
}

/** A cross-process lock (a file created exclusively); a lock older than `staleMs` is from a killed run. */
async function withLock<T>(name: string, fn: () => Promise<T>, staleMs = 180_000): Promise<T> {
  mkdirSync(DIR, { recursive: true });
  const lock = join(DIR, `${name}.lock`);
  for (;;) {
    try {
      closeSync(openSync(lock, 'wx'));
      break;
    } catch {
      try { if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs > staleMs) rmSync(lock, { force: true }); } catch { /* gone */ }
      await new Promise(r => setTimeout(r, 150));
    }
  }
  try { return await fn(); } finally { rmSync(lock, { force: true }); }
}

const TOKEN_PATH = /\/protocol\/openid-connect\/token$/;

/** Token requests of this context: sign-in answers become the chain head, renewals are served from it. */
async function broker(context: BrowserContext, who: PersonaKey, app: App) {
  await context.route(u => TOKEN_PATH.test(u.pathname), route => serve(route, who, app).catch(() => undefined)); // fails only once the context closed
}

async function serve(route: Route, who: PersonaKey, app: App) {
  {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    const form = new URLSearchParams(req.postData() ?? '');
    if (form.get('grant_type') === 'refresh_token') {
      const body = await withLock(`token-${app}-${who}`, async () => {
        const head = read(who, app).head;
        if (!head || !alive(head)) return null;
        if (head.expiresAt - Date.now() > 60_000) return head.body;
        form.set('refresh_token', head.refreshToken);
        const res = await route.fetch({ postData: form.toString() });
        const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!res.ok() || !json?.access_token) return null;
        write(who, app, { head: headFrom(json) });
        return json;
      });
      if (body) return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify(body) });
      return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'Session not active' }) });
    }
    // a sign-in step: through to Keycloak; tokens (the last step) start a new chain
    const res = await route.fetch();
    const text = await res.text();
    if (res.ok()) {
      try {
        const json = JSON.parse(text) as Record<string, unknown>;
        if (json.access_token) await withLock(`token-${app}-${who}`, async () => write(who, app, { head: headFrom(json) }));
      } catch { /* not JSON */ }
    }
    return route.fulfill({ response: res, body: text });
  }
}

/** Restored and signed in? Desk: the persona's home renders. Field: the start page shows the session card. */
async function signedIn(page: Page, who: PersonaKey, app: App): Promise<boolean> {
  if (app === 'desk') {
    await page.goto(`${WEB_URL}${DESK_HOME[who]}?design=0`, { waitUntil: 'commit' });
    return Promise.race([
      page.waitForURL(/sign-in|2-step-verification|session-expired/, { timeout: 30_000 }).then(() => false, () => false),
      page.locator('.web-screen .frame').first().waitFor({ timeout: 30_000 }).then(() => !/sign-in|2-step|session-expired/.test(page.url()), () => false),
    ]);
  }
  await page.goto(MOBILE_URL);
  return Promise.race([
    page.getByTestId('session-card').waitFor({ timeout: 30_000 }).then(() => true, () => false),
    page.getByText('Not signed in').waitFor({ timeout: 30_000 }).then(() => false, () => false),
  ]);
}

async function uiSignIn(page: Page, who: PersonaKey, app: App) {
  if (app === 'desk') {
    await page.goto(`${WEB_URL}${DESK_HOME[who]}?design=0`);
    await loginViaUi(page, who);
    await page.locator('.web-screen .frame').first().waitFor({ timeout: 30_000 });
  } else {
    const screen = FIELD_SIGN_IN_SCREEN[who];
    if (!screen) throw new Error(`${who} has no field sign-in`);
    await page.goto(`${MOBILE_URL}s/${screen}`);
    await fieldSignIn(page, who);
  }
}

async function save(context: BrowserContext, page: Page, who: PersonaKey, app: App) {
  const state = await context.storageState();
  const sessionStorage = app === 'desk' ? await page.evaluate(() => ({ ...window.sessionStorage }) as Record<string, string>) : undefined;
  await withLock(`token-${app}-${who}`, async () => write(who, app, { state, sessionStorage }));
}

export type SignedIn = { context: BrowserContext; page: Page; restored: boolean };

/**
 * A new context signed in as `who` on the desk or the field app. `setup` runs on the context before its first page
 * (routes, init scripts). The page is left on the desk home or the field start page (or where sign-in landed).
 */
export async function signedInContext(browser: Browser, who: PersonaKey, app: App, options: BrowserContextOptions = {}, setup?: (c: BrowserContext) => Promise<void>): Promise<SignedIn> {
  if (app === 'desk' ? !DESK_HOME[who] : !FIELD_SIGN_IN_SCREEN[who]) throw new Error(`${who} has no ${app} sign-in`);
  const open = async (saved: Saved) => {
    const restore = alive(saved.head) && saved.state;
    const context = await browser.newContext({ ignoreHTTPSErrors: true, ...options, ...(restore ? { storageState: saved.state } : {}) });
    await broker(context, who, app);
    if (restore && saved.sessionStorage && Object.keys(saved.sessionStorage).length) {
      const origin = new URL(WEB_URL).origin;
      await context.addInitScript(({ origin, items }) => {
        if (window.location.origin !== origin || window.sessionStorage.getItem('e2e.seeded')) return;
        for (const [k, v] of Object.entries(items)) window.sessionStorage.setItem(k, v);
        window.sessionStorage.setItem('e2e.seeded', '1');
      }, { origin, items: saved.sessionStorage });
    }
    if (setup) await setup(context);
    return { context, page: await context.newPage(), restore: Boolean(restore) };
  };

  const first = await open(read(who, app));
  // a slow or restarting app can miss the first look: check twice before spending a code
  const restoredOk = async (o: { page: Page; restore: boolean }) => o.restore
    && ((await signedIn(o.page, who, app).catch(() => false)) || (alive(read(who, app).head) && (await signedIn(o.page, who, app).catch(() => false))));
  if (await restoredOk(first)) return { context: first.context, page: first.page, restored: true };
  await first.context.close();

  // sign in on the designed screen, one persona at a time (desk and field of a persona share the phone number)
  return withLock(`signin-${who}`, async () => {
    const again = await open(read(who, app)); // another worker may have signed in meanwhile
    if (await restoredOk(again)) return { context: again.context, page: again.page, restored: true };
    await again.context.close();
    const fresh = await open({});
    await uiSignIn(fresh.page, who, app);
    await expect.poll(() => alive(read(who, app).head), { timeout: 15_000, message: `${who} ${app}: tokens captured` }).toBe(true);
    await save(fresh.context, fresh.page, who, app);
    return { context: fresh.context, page: fresh.page, restored: false };
  }, 300_000);
}

/**
 * Desk tab under a frozen clock (page.clock): the app cannot see its access token expire, and a 401 then ends the
 * session. Marking the stored token expired before a page load makes the app renew it on load (through the broker).
 */
export async function renewDeskOnNextLoad(page: Page) {
  await page.evaluate(() => {
    for (const k of Object.keys(window.sessionStorage)) {
      if (!k.startsWith('oidc.user:')) continue;
      try {
        const u = JSON.parse(window.sessionStorage.getItem(k) ?? '') as { expires_at?: number; refresh_token?: string };
        if (!u.refresh_token) continue;
        u.expires_at = Math.floor(Date.now() / 1000) - 1;
        window.sessionStorage.setItem(k, JSON.stringify(u));
      } catch { /* not a user record */ }
    }
  }).catch(() => undefined);
}

/**
 * Runs a sign-in that sends a code while no other worker signs `who` in (two code requests for one number within
 * 30 s are refused: "A code was just sent").
 */
export function oneSignInAtATime<T>(who: PersonaKey, fn: () => Promise<T>): Promise<T> {
  return withLock(`signin-${who}`, fn, 300_000);
}

/** Forget a persona's saved session (e.g. after a test ended it on purpose). */
export function forgetSession(who: PersonaKey, app: App) {
  rmSync(fileOf(who, app), { force: true });
}
