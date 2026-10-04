// Keycloak helpers: tokens via the OAuth2 password grant (API tests) and the hosted login page (UI tests).
import { expect, request, type APIRequestContext, type Page } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AUTH_MODE, CLIENT_ID, CLIENT_SECRET, KEYCLOAK_URL, PERSONAS, REALM, REDIRECT_URI, TOKEN_URL, type Persona, type PersonaKey } from './env';

export type TokenSet = { access_token: string; refresh_token?: string; expires_in: number; token_type: string };

const cache = new Map<string, { token: TokenSet; until: number }>();

/** Tokens signed in once by global-setup.ts (one login per persona, before the workers start). */
export const TOKEN_FILE = join(__dirname, '..', '.auth', 'tokens.json');
function sharedToken(username: string): { token: TokenSet; until: number } | undefined {
  try {
    const all = JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as Record<string, { token: TokenSet; until: number }>;
    return all[username];
  } catch {
    return undefined;
  }
}

/** Password grant for a persona. Tokens are cached per worker until 30 s before expiry. */
export async function tokenFor(who: PersonaKey | Persona, ctx?: APIRequestContext): Promise<string> {
  const p = typeof who === 'string' ? PERSONAS[who] : who;
  const hit = cache.get(p.username) ?? sharedToken(p.username);
  if (hit && hit.until > Date.now()) { cache.set(p.username, hit); return hit.token.access_token; }

  const own = !ctx;
  const api = ctx ?? (await request.newContext({ ignoreHTTPSErrors: true }));
  try {
    let token: TokenSet | undefined;
    let passwordError = '';
    if (AUTH_MODE !== 'code') {
      const r = await passwordGrant(api, p);
      if ('access_token' in r) token = r;
      else passwordError = r.error;
    }
    if (!token && AUTH_MODE !== 'password') token = await authCodeLogin(p);
    if (!token) throw new Error(`password grant for ${p.username} failed: ${passwordError}`);
    cache.set(p.username, { token, until: Date.now() + (token.expires_in - 30) * 1000 });
    return token.access_token;
  } finally {
    if (own) await api.dispose();
  }
}

async function passwordGrant(api: APIRequestContext, p: Persona): Promise<TokenSet | { error: string }> {
  const form: Record<string, string> = { grant_type: 'password', client_id: CLIENT_ID, username: p.username, password: p.password, scope: 'openid' };
  if (CLIENT_SECRET) form.client_secret = CLIENT_SECRET;
  const res = await api.post(TOKEN_URL, { form, failOnStatusCode: false });
  if (res.ok()) return (await res.json()) as TokenSet;
  return { error: `${res.status()} ${await res.text()}` };
}

/**
 * Authorization code + PKCE through Keycloak's hosted login form, over HTTP (no browser). This is what the
 * web app does, so it works with the realm as shipped (public client, direct access grants off).
 */
export async function authCodeLogin(p: Persona): Promise<TokenSet> {
  const jar = await request.newContext({ ignoreHTTPSErrors: true });
  try {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const auth = new URL(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`);
    auth.search = new URLSearchParams({
      client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code', scope: 'openid',
      state: randomBytes(8).toString('hex'), code_challenge: challenge, code_challenge_method: 'S256',
    }).toString();

    const page = await jar.get(auth.toString());
    if (!page.ok()) throw new Error(`login page: ${page.status()}`);
    const html = await page.text();
    const action = html.match(/<form[^>]+id="kc-form-login"[^>]+action="([^"]+)"/)?.[1] ?? html.match(/action="([^"]*login-actions\/authenticate[^"]*)"/)?.[1];
    if (!action) throw new Error('Keycloak login form not found');

    const submit = await jar.post(action.replace(/&amp;/g, '&'), {
      form: { username: p.username, password: p.password, credentialId: '' },
      maxRedirects: 0, failOnStatusCode: false,
    });
    const location = submit.headers()['location'];
    const code = location && new URL(location, REDIRECT_URI).searchParams.get('code');
    if (!code) throw new Error(`login for ${p.username} did not redirect with a code (HTTP ${submit.status()})`);

    const form: Record<string, string> = { grant_type: 'authorization_code', client_id: CLIENT_ID, code, redirect_uri: REDIRECT_URI, code_verifier: verifier };
    if (CLIENT_SECRET) form.client_secret = CLIENT_SECRET;
    const res = await jar.post(TOKEN_URL, { form, failOnStatusCode: false });
    if (!res.ok()) throw new Error(`code exchange for ${p.username} failed: ${res.status()} ${await res.text()}`);
    return (await res.json()) as TokenSet;
  } finally {
    await jar.dispose();
  }
}

export function decodeJwt(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const [h, p] = token.split('.');
  const dec = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
  return { header: dec(h), payload: dec(p) };
}

/** Same header and signature, payload changed: a correctly-verifying service must reject it. */
export function tamper(token: string, patch: Record<string, unknown>): string {
  const [h, p, s] = token.split('.');
  const payload = { ...JSON.parse(Buffer.from(p, 'base64url').toString('utf8')), ...patch };
  return [h, Buffer.from(JSON.stringify(payload)).toString('base64url'), s].join('.');
}

/** An unsigned token (alg "none"), the classic JWT downgrade attack. */
export function unsigned(token: string): string {
  const [, p] = token.split('.');
  const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  return `${h}.${p}.`;
}

/**
 * An expired token. Prefer a real one captured from Keycloak (E2E_EXPIRED_TOKEN): its signature is valid,
 * so only the `exp` check can reject it. Without one, back-date `exp` on a fresh token (the signature then
 * also breaks, so this proves rejection but not specifically the expiry check).
 */
export async function expiredToken(ctx?: APIRequestContext): Promise<{ token: string; genuine: boolean }> {
  const captured = process.env.E2E_EXPIRED_TOKEN;
  if (captured) return { token: captured, genuine: true };
  const fresh = await tokenFor('dispatcher', ctx);
  const past = Math.floor(Date.now() / 1000) - 3600;
  return { token: tamper(fresh, { exp: past, iat: past - 300 }), genuine: false };
}

/** The personas' mobile numbers (backend/prisma/scenario.ts; realm `phone` attributes). Override: E2E_PHONE_<USERNAME>. */
const PHONES: Record<string, string> = { fathima: '774567890', nilanthi: '771234567', kasun: '772345678', ruwan: '773456789' };
export const phoneOf = (username: string) => process.env[`E2E_PHONE_${username.toUpperCase()}`]?.trim() || PHONES[username] || '';
/** The loader's staff ID and Dock PIN (realm `staff_id`, LODESTAR_DEMO_PIN). */
export const STAFF_ID = process.env.E2E_STAFF_ID?.trim() || 'KDY-0427';
export const DOCK_PIN = process.env.E2E_DOCK_PIN?.trim() || '2468';

/**
 * Sign in on the face's designed sign-in screen (the app sends anonymous visits there): SM-26 phone + SMS code,
 * DSP-06 → DSP-07 or ADM-01 email + password + code. The code is read from the demo display (DEMO_SHOW_CODES=true).
 * On Keycloak's hosted page (the single sign-on path) the hosted form is filled instead.
 */
export async function loginViaUi(page: Page, who: PersonaKey | Persona) {
  const p = typeof who === 'string' ? PERSONAS[who] : who;
  await page.waitForURL(/sign-in|\/realms\/.+\/protocol\/openid-connect\/auth|\/login-actions\//, { timeout: 30_000 });
  if (/\/realms\//.test(page.url())) {
    await page.locator('#username').fill(p.username);
    await page.locator('#password').fill(p.password);
    await page.locator('#kc-login').click();
    await expect(page).not.toHaveURL(/\/realms\//, { timeout: 30_000 });
    return;
  }
  if (/sm-26-sign-in/.test(page.url())) {
    await page.getByTestId('phone-input').fill(phoneOf(p.username));
    await page.getByTestId('sign-in').click();
  } else {
    await page.getByTestId('email-input').fill(p.username.includes('@') ? p.username : `${p.username}@waypoint.lk`);
    await page.getByTestId('password-input').fill(p.password);
    await page.getByTestId('sign-in').click();
  }
  const code = await page.getByTestId('demo-code').getAttribute('data-code', { timeout: 30_000 });
  if (!code) throw new Error('no demo code shown: run the stack with DEMO_SHOW_CODES=true');
  await page.getByTestId('code-input').fill(code);
  await expect(page).not.toHaveURL(/sign-in|2-step-verification/, { timeout: 30_000 });
}

/** The visible keypad key (screens below in the router stack stay mounted). */
const key = (page: Page, d: string) => page.locator(`[data-testid="key-${d}"]:visible`).first().click();

/** Sign in on a field app's designed screen: Dock staff ID + PIN (LD-06), else phone + SMS code (SM-05/06, DR-06/07). */
export async function fieldSignIn(page: Page, who: PersonaKey | Persona) {
  const p = typeof who === 'string' ? PERSONAS[who] : who;
  await page.waitForURL(/\/field\/s\/(sm-05|dr-06|ld-06)/, { timeout: 30_000 });
  if (/ld-06/.test(page.url())) {
    await page.locator('[data-testid="staff-id-input"]:visible').first().fill(p.username === 'kasun' ? STAFF_ID : p.username);
    for (const d of DOCK_PIN) await key(page, d);
  } else {
    for (const d of phoneOf(p.username)) await key(page, d);
    await page.locator(`[data-testid="${/sm-05/.test(page.url()) ? 'lk-L68' : 'lk-L229'}"]:visible`).first().click();
    const demo = page.locator('[data-testid="demo-code"]:visible').first();
    await expect(demo).toContainText(/\d{6}/, { timeout: 30_000 });
    const code = /(\d{6})/.exec((await demo.textContent()) ?? '')![1];
    for (const d of code) await key(page, d);
  }
  await expect(page).not.toHaveURL(/sign-in|verify-code/, { timeout: 30_000 });
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** OAuth2 client-credentials token for a service identity (svc-agent, svc-planning, …). */
export async function serviceToken(clientId: string, clientSecret: string, ctx: APIRequestContext): Promise<string> {
  const res = await ctx.post(TOKEN_URL, { form: { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret } });
  if (!res.ok()) throw new Error(`client credentials for ${clientId} failed: ${res.status()} ${await res.text()}`);
  return ((await res.json()) as TokenSet).access_token;
}
