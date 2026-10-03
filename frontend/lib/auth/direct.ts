// Sign-in from Lodestar's own designed screens (SM-26, DSP-06/07, ADM-01): the form posts straight to Keycloak's
// token endpoint (direct grant on the public `lodestar-web` client). The realm binds that client's direct grant to
// the "lodestar direct grant" flow (backend/identity/extension), which answers each step:
//   phone            → 401 code_sent (a 6-digit code goes by SMS; demo stacks return it as demo_code)
//   phone + code     → tokens
//   email + password → 401 otp_required (authenticator app) or 401 code_sent (SMS to the user's phone)
//   … + totp | code  → tokens
// Wrong details get one generic message (no "unknown number" / "unknown email" answers).
import type { RuntimeConfig } from '../config';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  session_state?: string;
}

/** A step the screen must show next, or why the attempt was refused. */
export interface SignInStep {
  error: string;
  description: string;
  status: number;
  method?: 'sms' | 'voice' | 'totp';
  phoneHint?: string;
  expiresIn?: number;
  resendIn?: number;
  retryAfter?: number;
  attemptsLeft?: number;
  smsAvailable?: boolean;
  /** Demo stacks only (DEMO_SHOW_CODES): the code the SMS carries. */
  demoCode?: string;
}

export type DirectResult = { ok: true; tokens: TokenResponse } | ({ ok: false } & SignInStep);

export const SIGN_IN_SCOPE = 'openid profile email';

export function tokenEndpoint(cfg: Pick<RuntimeConfig, 'authority'>): string {
  return `${cfg.authority.replace(/\/+$/, '')}/protocol/openid-connect/token`;
}

const NETWORK: SignInStep = { error: 'network', description: 'Lodestar could not reach the sign-in service. Check the connection and try again.', status: 0 };

// A code is single use: the same code sent twice at once (auto-submit on the sixth digit plus the button) would sign
// in on the first request and read "expired" on the second. Identical code requests in flight share one answer.
const inFlight = new Map<string, Promise<DirectResult>>();

/** One direct-grant request. `params` are the screen's fields (phone, code, username, password, totp, send, channel). */
export function directGrant(
  cfg: Pick<RuntimeConfig, 'authority' | 'clientId'>,
  params: Record<string, string | undefined>,
  doFetch: typeof fetch = (i, init) => fetch(i, init),
): Promise<DirectResult> {
  if (!params.code && !params.totp) return sendGrant(cfg, params, doFetch);
  const key = JSON.stringify([cfg.clientId, params]);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const p = sendGrant(cfg, params, doFetch).finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

async function sendGrant(
  cfg: Pick<RuntimeConfig, 'authority' | 'clientId'>,
  params: Record<string, string | undefined>,
  doFetch: typeof fetch,
): Promise<DirectResult> {
  const body = new URLSearchParams({ grant_type: 'password', client_id: cfg.clientId, scope: SIGN_IN_SCOPE });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') body.set(k, v);
  let res: Response;
  try {
    res = await doFetch(tokenEndpoint(cfg), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
      credentials: 'omit',
    });
  } catch {
    return { ok: false, ...NETWORK };
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok && typeof json.access_token === 'string') return { ok: true, tokens: json as unknown as TokenResponse };
  return { ok: false, ...stepFrom(res.status, json) };
}

const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

export function stepFrom(status: number, json: Record<string, unknown>): SignInStep {
  const error = str(json.error) ?? (status >= 500 ? 'server' : 'invalid_grant');
  let description = str(json.error_description) ?? '';
  // Keycloak's own refusals (client not allowed, account not set up) carry its wording: keep it short and generic.
  if (!description || /invalid user credentials|account is not fully set up|client not allowed/i.test(description)) {
    description =
      error === 'unauthorized_client'
        ? 'This sign-in is not switched on for Lodestar yet. Ask the IT desk to run the sign-in setup.'
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
    smsAvailable: typeof json.sms_available === 'boolean' ? json.sms_available : undefined,
    demoCode: str(json.demo_code),
  };
}

/** The step that asks for a code (as opposed to a refusal). */
export function needsCode(step: SignInStep): boolean {
  return step.error === 'code_sent' || step.error === 'otp_required';
}

/** Digits only, at most `max`. */
export function digits(v: string, max = 6): string {
  return v.replace(/\D/g, '').slice(0, max);
}

/** "mm:ss" for a countdown. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Shows +94771234567 the way the design does: 77 123 4567. */
export function localNumber(v: string): string {
  const d = v.replace(/\D/g, '').replace(/^94/, '').replace(/^0/, '');
  return d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : v;
}

// ------------------------------------------------------------------ password step held between DSP-06 and DSP-07

/**
 * DSP-06 (email + password) hands over to DSP-07 (the 6-digit code). The password stays in this module's memory
 * only (never in storage) until the code step finishes or the tab is closed; a reload of DSP-07 starts again.
 */
export interface PendingPassword {
  username: string;
  password: string;
  step: SignInStep;
  at: number;
  returnTo: string | null;
}

let pending: PendingPassword | null = null;
export const pendingPassword = {
  get: (): PendingPassword | null => (pending && Date.now() - pending.at < 10 * 60_000 ? pending : null),
  set: (p: PendingPassword) => {
    pending = p;
  },
  update: (step: SignInStep) => {
    if (pending) pending = { ...pending, step, at: Date.now() };
  },
  clear: () => {
    pending = null;
  },
};
