/**
 * Realm roles (PLATFORM.md §2.3). Keycloak realm roles and Entra ID app roles
 * use the same names, so tokens from either issuer map onto these constants.
 */
export const Roles = {
  StoreManager: 'store_manager',
  Dispatcher: 'dispatcher',
  Loader: 'loader',
  Driver: 'driver',
  Admin: 'admin',
  Service: 'svc',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ALL_ROLES: Role[] = Object.values(Roles);

/** Human roles (everything except service identities). */
export const HUMAN_ROLES: Role[] = ALL_ROLES.filter((r) => r !== Roles.Service);

/** Roles that bypass row-level (ABAC) filters: admins and service identities. */
export const PRIVILEGED_ROLES: Role[] = [Roles.Admin, Roles.Service];

/** Which token claim scopes the rows a role may see. */
export type ScopeKind = 'depot' | 'outlet' | 'vehicle';

export const ROLE_SCOPE: Partial<Record<Role, ScopeKind>> = {
  [Roles.Dispatcher]: 'depot',
  [Roles.Loader]: 'depot',
  [Roles.StoreManager]: 'outlet',
  [Roles.Driver]: 'vehicle',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as string[]).includes(value);
}
