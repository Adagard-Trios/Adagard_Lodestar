// Sign-in from the field app's own designed screens: phone + SMS code (SM-05/06, DR-06/07, DR-29 resend / voice),
// staff ID + PIN (LD-06). The screen posts straight to Keycloak's token endpoint (direct grant on the public
// `lodestar-field` client); the realm binds it to the "lodestar direct grant" flow (backend/identity/extension):
//   phone            → 401 code_sent (6-digit code by SMS, or by voice call with channel=voice; demo stacks return it)
//   phone + code     → tokens
//   username + pin   → tokens (the Dock PIN credential)
// Wrong details get one generic message; unknown numbers get the same answers as known ones.
import { clientId } from '@/lib/config';
import { Store } from '@/lib/store';
import { discovery, type RawTokens } from './oidc';
import type { Face } from './roles';

export type SignInStep = {
  error: string;
  description: string;
  status: number;
  method?: 'sms' | 'voice' | 'totp';
  phoneHint?: string;
  expiresIn?: number;
  resendIn?: number;
  retryAfter?: number;
  attemptsLeft?: number;
  /** Demo stacks only (DEMO_SHOW_CODES): the code the SMS carries. */
  demoCode?: string;
};

export type DirectResult = { ok: true; tokens: RawTokens } | ({ ok: false } & SignInStep);

const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

export function stepFrom(status: number, json: Record<string, unknown>): SignInStep {
  const error = str(json.error) ?? (status >= 500 ? 'server' : 'invalid_grant');
  let description = str(json.error_description) ?? '';
  if (!description || /invalid user credentials|account is not fully set up|client not allowed/i.test(description)) {
    description =
      error === 'unauthorized_client'
        ? 'This sign-in is not switched on yet. Ask your depot to run the sign-in setup.'
        : status >= 500
          ? 'The sign-in service is not answering. Try again in a minute.'
          : 'Those details did not work. Check them and try again.';
  }
  const method = str(json.method);
  return {
    error,
    description,
    status,
    method: method === 'sms' || method === 'voice' || method === 'totp' ? method : undefined,
    phoneHint: str(json.phone_hint),
    expiresIn: num(json.expires_in),
    resendIn: num(json.resend_in),
    retryAfter: num(json.retry_after),
    attemptsLeft: num(json.attempts_left),
    demoCode: str(json.demo_code),
  };
}

const form = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

// A code is single use: the same code sent twice at once (auto-submit on the sixth digit plus Verify) would sign in on
// the first request and read "expired" on the second. Identical code requests in flight share one answer.
const inFlight = new Map<string, Promise<DirectResult>>();

export function directGrant(params: Record<string, string | undefined>, doFetch: typeof fetch = (i, init) => fetch(i, init), tokenEndpoint = discovery().tokenEndpoint, client = clientId()): Promise<DirectResult> {
  if (!params.code && !params.totp && !params.pin) return sendGrant(params, doFetch, tokenEndpoint, client);
  const key = JSON.stringify([tokenEndpoint, client, params]);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const p = sendGrant(params, doFetch, tokenEndpoint, client).finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

async function sendGrant(params: Record<string, string | undefined>, doFetch: typeof fetch, tokenEndpoint: string, client: string): Promise<DirectResult> {
  const body: Record<string, string> = { grant_type: 'password', client_id: client, scope: 'openid' };
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') body[k] = v;
  let res: globalThis.Response;
  try {
    res = await doFetch(tokenEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form(body) });
  } catch {
    return { ok: false, error: 'network', description: 'No connection to the sign-in service. Move to better signal and try again.', status: 0 };
  }
  const json = ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  if (res.ok && typeof json.access_token === 'string') return { ok: true, tokens: json as unknown as RawTokens };
  return { ok: false, ...stepFrom(res.status, json) };
}

export const codeSent = (s: SignInStep) => s.error === 'code_sent';

/** Digits only, at most `max`. */
export const onlyDigits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

/** "77 318 4526" from the digits typed after +94 (the design's grouping). */
export function groupLocal(d: string): string {
  const x = d.replace(/\D/g, '').replace(/^0/, '');
  return [x.slice(0, 2), x.slice(2, 5), x.slice(5, 9)].filter(Boolean).join(' ');
}

/** "+94 77 318 4526" */
export const fullNumber = (d: string) => `+94 ${groupLocal(d)}`;

export const clock = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The phone sign-in between its two screens (SM-05 → SM-06, DR-06 → DR-07, DR-29): the number typed, the last
 * answer (code sent, hint, demo code) and when a new code may be asked for. Memory only.
 */
export type PhoneSignIn = { face: Face | null; digits: string; step: SignInStep | null; sentAt: number | null; resendAt: number | null };
export const phoneSignIn = new Store<PhoneSignIn>({ face: null, digits: '', step: null, sentAt: null, resendAt: null });
