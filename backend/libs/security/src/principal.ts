import type { JWTPayload } from 'jose';
import { isRole, PRIVILEGED_ROLES, Role, Roles } from './roles';

/**
 * The verified caller of a request, derived only from a signed access token.
 * Nothing in here comes from request bodies or headers other than the token.
 */
export interface Principal {
  sub: string;
  username?: string;
  email?: string;
  name?: string;
  roles: Role[];
  /** OAuth client that obtained the token (`azp`), e.g. lodestar-web, svc-planning. */
  clientId?: string;
  /** OAuth scopes (`scope` claim), e.g. orders.read. */
  scopes: string[];
  /** ABAC claims */
  depots: string[];
  outletId?: string;
  vehicleId?: string;
  deviceId?: string;
  isService: boolean;
  claims: JWTPayload;
}

/** Keycloak puts realm roles under realm_access.roles; Entra ID uses a top-level roles array. */
function extractRoles(claims: Record<string, any>): Role[] {
  const raw: unknown[] = [
    ...(Array.isArray(claims.realm_access?.roles) ? claims.realm_access.roles : []),
    ...(Array.isArray(claims.roles) ? claims.roles : []),
  ];
  return [...new Set(raw.filter(isRole))];
}

/**
 * The depot claim may be a string, an array (multivalued Keycloak attribute),
 * or a comma/space separated list. Normalised to upper-case depot codes.
 */
export function normaliseDepots(value: unknown): string[] {
  const parts: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\s,]+/) : [];
  const codes = parts
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
    .map((p) => p.trim().toUpperCase());
  return [...new Set(codes)];
}

function single(value: unknown): string | undefined {
  if (Array.isArray(value)) value = value[0];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * Scopes: the OAuth `scope`/`scp` claim, plus app roles that look like
 * permissions ("orders.read") — Entra app-only tokens carry those in `roles`.
 */
function extractScopes(c: Record<string, any>): string[] {
  const scopes: string[] =
    typeof c.scope === 'string' ? c.scope.split(' ') : typeof c.scp === 'string' ? c.scp.split(' ') : Array.isArray(c.scp) ? c.scp : [];
  const permissionRoles = Array.isArray(c.roles) ? c.roles.filter((r: unknown) => typeof r === 'string' && r.includes('.')) : [];
  return [...new Set([...scopes, ...permissionRoles].filter(Boolean))];
}

export function principalFromClaims(claims: JWTPayload): Principal {
  const c = claims as Record<string, any>;
  const roles = extractRoles(c);
  return {
    sub: String(c.sub ?? ''),
    username: single(c.preferred_username),
    email: single(c.email),
    name: single(c.name),
    roles,
    clientId: single(c.azp) ?? single(c.client_id) ?? single(c.appid),
    scopes: extractScopes(c),
    depots: normaliseDepots(c.depot),
    outletId: single(c.outlet_id),
    vehicleId: single(c.vehicle_id),
    deviceId: single(c.device_id),
    isService: roles.includes(Roles.Service),
    claims,
  };
}

export function isPrivileged(p: Principal): boolean {
  return p.roles.some((r) => PRIVILEGED_ROLES.includes(r));
}

export function hasAnyRole(p: Principal, roles: readonly Role[]): boolean {
  return p.roles.some((r) => roles.includes(r));
}

/** Service name of a service identity: svc-planning → planning (Keycloak client ids). */
export function serviceName(p: Principal): string | undefined {
  return p.isService && p.clientId?.startsWith('svc-') ? p.clientId.slice(4) : undefined;
}
