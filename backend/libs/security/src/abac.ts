import { isPrivileged, Principal } from './principal';
import { Role, ROLE_SCOPE, ScopeKind } from './roles';

/** A Prisma `where` object. Kept loose so the lib doesn't depend on generated types. */
export type Where = Record<string, any>;

/** Prisma treats an empty OR as "matches nothing". */
export const MATCH_NOTHING: Where = Object.freeze({ OR: [] }) as Where;

/**
 * Row-level (ABAC) rules of one entity set. Each rule turns a token claim into
 * a Prisma where clause. Roles map to claims via ROLE_SCOPE:
 * dispatcher/loader → depot, store_manager → outlet, driver → vehicle.
 *
 * Deny by default: a non-privileged role whose scope has no rule here, or whose
 * token lacks the claim, sees no rows.
 */
export interface AbacRules {
  depot?: (depots: string[]) => Where;
  outlet?: (outletId: string) => Where;
  vehicle?: (vehicleId: string) => Where;
  /** Extra restriction ANDed for every non-privileged caller (e.g. own notifications). */
  self?: (p: Principal) => Where;
  /** Roles that see every row (reference data). '*' means every authenticated caller. */
  open?: Role[] | '*';
}

function scopeFilter(kind: ScopeKind, p: Principal, rules: AbacRules): Where | undefined {
  switch (kind) {
    case 'depot':
      return rules.depot && p.depots.length ? rules.depot(p.depots) : undefined;
    case 'outlet':
      return rules.outlet && p.outletId ? rules.outlet(p.outletId) : undefined;
    case 'vehicle':
      return rules.vehicle && p.vehicleId ? rules.vehicle(p.vehicleId) : undefined;
  }
}

/** ANDs where clauses, dropping empty ones. Returns undefined when nothing restricts. */
export function andWhere(...parts: (Where | undefined | null)[]): Where | undefined {
  const real = parts.filter((w): w is Where => !!w && Object.keys(w).length > 0);
  if (real.length === 0) return undefined;
  if (real.length === 1) return real[0];
  return { AND: real };
}

/**
 * The row filter for this caller, to be ANDed into every query of the set.
 * `undefined` means unrestricted (admins, service identities, open sets).
 * A user holding several roles sees the union of what each role allows.
 */
export function rowFilter(p: Principal, rules?: AbacRules): Where | undefined {
  if (isPrivileged(p)) return undefined;
  if (!rules) return MATCH_NOTHING;

  const self = rules.self?.(p);
  if (rules.open === '*') return self;

  let unrestricted = false;
  const filters: Where[] = [];
  for (const role of p.roles) {
    if (Array.isArray(rules.open) && rules.open.includes(role)) {
      unrestricted = true;
      continue;
    }
    const kind = ROLE_SCOPE[role];
    if (!kind) continue;
    const f = scopeFilter(kind, p, rules);
    if (f) filters.push(f);
  }

  let base: Where | undefined;
  if (unrestricted) base = undefined;
  else if (filters.length === 0) return MATCH_NOTHING;
  else base = filters.length === 1 ? filters[0] : { OR: filters };

  return andWhere(base, self);
}

/** Write-side ABAC: may this caller act on data of `depot`? */
export function canAccessDepot(p: Principal, depot: string | null | undefined): boolean {
  return isPrivileged(p) || (!!depot && p.depots.includes(String(depot).toUpperCase()));
}

/** Write-side ABAC: may this caller act for `outletId`? Store managers only for their own outlet. */
export function canAccessOutlet(p: Principal, outletId: string | null | undefined): boolean {
  if (isPrivileged(p)) return true;
  if (p.roles.includes('store_manager') && p.outletId) return p.outletId === outletId;
  return false;
}

/**
 * For route-level @Scope: does a non-privileged caller carry the claims the
 * route needs? Returns the missing scope kinds (empty = OK).
 */
export function missingScopes(p: Principal, required: ScopeKind[]): ScopeKind[] {
  if (isPrivileged(p) || required.length === 0) return [];
  const have = new Set<ScopeKind>();
  if (p.depots.length) have.add('depot');
  if (p.outletId) have.add('outlet');
  if (p.vehicleId) have.add('vehicle');
  // A caller only needs the claims that belong to the roles it actually holds.
  const relevant = required.filter((k) => p.roles.some((r) => ROLE_SCOPE[r] === k));
  const needed = relevant.length ? relevant : required;
  return needed.filter((k) => !have.has(k));
}
