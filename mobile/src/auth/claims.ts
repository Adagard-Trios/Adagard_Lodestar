// Reads the claims of an access token for the UI (role routing, depot, outlet, vehicle).
// The app never trusts these for access: every service verifies the signed token itself.
export type Role = 'store_manager' | 'dispatcher' | 'loader' | 'driver' | 'admin';
const ROLES: Role[] = ['store_manager', 'dispatcher', 'loader', 'driver', 'admin'];

export type Claims = {
  sub: string;
  name?: string;
  username?: string;
  roles: Role[];
  depots: string[];
  outletId?: string;
  vehicleId?: string;
  deviceId?: string;
  /** seconds since epoch */
  exp?: number;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of s) {
    if (ch === '=') break;
    const v = B64.indexOf(ch);
    if (v < 0) throw new Error('bad base64');
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  // UTF-8 decode
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let cp: number;
    if (b < 0x80) cp = b;
    else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b < 0xf0) cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    out += String.fromCodePoint(cp);
  }
  return out;
}

export function decodeJwtPayload(token: string): Record<string, any> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(base64UrlDecode(part));
  } catch {
    return null;
  }
}

const single = (v: unknown): string | undefined => {
  if (Array.isArray(v)) v = v[0];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};

/** Same normalisation as backend/libs/security principal.ts. */
export function claimsFromToken(token: string): Claims | null {
  const c = decodeJwtPayload(token);
  if (!c || typeof c.sub !== 'string') return null;
  const rawRoles: unknown[] = [...(Array.isArray(c.realm_access?.roles) ? c.realm_access.roles : []), ...(Array.isArray(c.roles) ? c.roles : [])];
  const roles = [...new Set(rawRoles.filter((r): r is Role => typeof r === 'string' && (ROLES as string[]).includes(r)))];
  const depotRaw: unknown[] = Array.isArray(c.depot) ? c.depot : typeof c.depot === 'string' ? c.depot.split(/[\s,]+/) : [];
  const depots = [...new Set(depotRaw.filter((d): d is string => typeof d === 'string' && !!d.trim()).map(d => d.trim().toUpperCase()))];
  return {
    sub: c.sub,
    name: single(c.name) ?? single(c.given_name),
    username: single(c.preferred_username),
    roles,
    depots,
    outletId: single(c.outlet_id),
    vehicleId: single(c.vehicle_id),
    deviceId: single(c.device_id),
    exp: typeof c.exp === 'number' ? c.exp : undefined,
  };
}

export function firstName(c?: Claims | null): string {
  const n = c?.name ?? c?.username ?? '';
  return n.split(/\s+/)[0] ?? '';
}
