// Who is signed in, and which desk face they belong on.
//
// The browser decodes the access token only to route the user (which face, which outlet). It never trusts it for
// access: every API call is verified by the services themselves (zero trust, PLATFORM.md §2).

export type Face = 'plan' | 'store' | 'admin';
export type DeskRole = 'dispatcher' | 'store_manager' | 'admin';

export interface Session {
  sub: string;
  name: string;
  username?: string;
  email?: string;
  roles: string[];
  depots: string[];
  outletId?: string;
  /** Epoch seconds. */
  expiresAt?: number;
}

/** The desk face each role works in. */
export const FACE_ROLE: Record<Face, DeskRole> = { plan: 'dispatcher', store: 'store_manager', admin: 'admin' };
/** When a user holds several desk roles, they land on the first. */
const LANDING_ORDER: Face[] = ['plan', 'store', 'admin'];

/** Decodes a JWT payload without verifying it (routing only). */
export function decodeJwt(token: string | undefined | null): Record<string, unknown> | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const json = decodeURIComponent(
      Array.from(atob(b64), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    );
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : typeof v === 'string' ? [v] : []);

/** Keycloak puts realm roles under realm_access.roles; Entra ID uses a top-level roles array. */
export function rolesOf(claims: Record<string, unknown>): string[] {
  const realm = (claims.realm_access as { roles?: unknown } | undefined)?.roles;
  return [...new Set([...strings(realm), ...strings(claims.roles)])];
}

/** Builds the session from the access token (roles and Lodestar claims) and the ID token profile (name). */
export function sessionFrom(accessToken: string, profile: Record<string, unknown> = {}, expiresAt?: number): Session {
  const at = decodeJwt(accessToken) ?? {};
  const pick = (k: string) => (typeof profile[k] === 'string' ? (profile[k] as string) : typeof at[k] === 'string' ? (at[k] as string) : undefined);
  const depots = strings(at.depot ?? profile.depot).map(d => d.toUpperCase());
  return {
    sub: pick('sub') ?? '',
    name: pick('name') ?? pick('preferred_username') ?? 'Signed in',
    username: pick('preferred_username'),
    email: pick('email'),
    roles: rolesOf(at),
    depots,
    outletId: pick('outlet_id'),
    expiresAt: expiresAt ?? (typeof at.exp === 'number' ? at.exp : undefined),
  };
}

export function canUseFace(roles: readonly string[], face: Face): boolean {
  return roles.includes(FACE_ROLE[face]);
}

/** The face a user belongs on, or null when they have no desk role (loaders and drivers use the phone apps). */
export function faceFor(roles: readonly string[]): Face | null {
  return LANDING_ORDER.find(f => canUseFace(roles, f)) ?? null;
}

/** Where to go after sign-in: dispatcher → /plan, store_manager → /store, admin → /admin. */
export function landingFor(roles: readonly string[]): string {
  const face = faceFor(roles);
  return face ? `/${face}` : '/no-access';
}

/** The face a path belongs to, if any. */
export function faceOfPath(path: string): Face | null {
  const m = /^\/(plan|store|admin)(?:\/|$)/.exec(path);
  return m ? (m[1] as Face) : null;
}

/**
 * Where to send a user after sign-in. A deep link they were sent away from is honoured only when it is a local
 * path inside a face they may use; anything else lands on their own face.
 */
export function returnPath(returnTo: unknown, roles: readonly string[]): string {
  if (typeof returnTo === 'string' && /^\/(?!\/)[^\\\s]*$/.test(returnTo)) {
    const face = faceOfPath(returnTo);
    if (face && canUseFace(roles, face) && !isEntryPath(returnTo)) return returnTo;
  }
  return landingFor(roles);
}

/** Each face's own designed sign-in screen (no Keycloak login page on the normal sign-in path). */
export const SIGN_IN_SCREEN: Record<Face, string> = {
  plan: '/plan/dsp-06-sign-in',
  store: '/store/sm-26-sign-in',
  admin: '/admin/adm-01-sign-in',
};

/**
 * Where to sign in for `returnTo`: the sign-in screen of the face it belongs to, carrying it as ?returnTo=. A path
 * outside every face (or none) goes to the start page, which links each role to its own sign-in screen.
 */
export function signInPath(returnTo?: string | null): string {
  const face = returnTo ? faceOfPath(returnTo) : null;
  if (!face) return '/';
  const back = returnTo && !isEntryPath(returnTo) && returnTo !== `/${face}` ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  return `${SIGN_IN_SCREEN[face]}${back}`;
}

/** Sign-in and other pre-authentication screens, which stay reachable without a session. */
export const ENTRY_SCREENS: Record<Face, string[]> = {
  plan: ['dsp-06-sign-in', 'dsp-07-2-step-verification', 'dsp-34-reset-access', 'dsp-35-session-expired'],
  store: ['sm-26-sign-in', 'sm-35-reset-access', 'sm-36-service-unavailable'],
  admin: ['adm-01-sign-in'],
};

export function isEntryPath(path: string): boolean {
  const face = faceOfPath(path);
  if (!face) return false;
  const key = path.split('/')[2] ?? '';
  return ENTRY_SCREENS[face].includes(key);
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '?';
}

/** Who a session that ended (could not be renewed) belonged to, for "Your session ended" (DSP-35). */
export interface EndedSession {
  name: string | null;
  email: string | null;
  /** Epoch seconds the session started (auth_time), when known. */
  startedAt: number | null;
  /** Epoch ms it ended. */
  endedAt: number;
}

const ENDED_KEY = 'lodestar.sessionEnded';

export function rememberEndedSession(s: Omit<EndedSession, 'endedAt'>, now = Date.now()) {
  try {
    window.sessionStorage.setItem(ENDED_KEY, JSON.stringify({ ...s, endedAt: now }));
  } catch {
    // storage blocked: the screen shows the generic text
  }
}

export function readEndedSession(): EndedSession | null {
  try {
    const raw = window.sessionStorage.getItem(ENDED_KEY);
    const v = raw ? (JSON.parse(raw) as EndedSession) : null;
    return v && typeof v.endedAt === 'number' ? v : null;
  } catch {
    return null;
  }
}

export function forgetEndedSession() {
  try {
    window.sessionStorage.removeItem(ENDED_KEY);
  } catch {
    // nothing to forget
  }
}

/** The screen a face shows when its session ended, if it has one (only Lodestar Plan designs it: DSP-35). */
export const SESSION_ENDED_SCREEN: Partial<Record<Face, string>> = { plan: '/plan/dsp-35-session-expired' };

/** The field-app page for a loader or driver (their role's sign-in there), or the field app's start otherwise. */
export function fieldAppFor(roles: readonly string[]): string {
  if (roles.includes('loader')) return '/field/s/ld-06-sign-in';
  if (roles.includes('driver')) return '/field/s/dr-06-sign-in';
  return '/field/';
}
