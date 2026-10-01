// All endpoints and identities come from the environment, with defaults for the local docker compose stack
// described in docs/architecture/PLATFORM.md §1.

const env = (name: string, fallback: string) => process.env[name]?.trim() || fallback;

export const BASE_URL = env('E2E_BASE_URL', 'https://localhost:8443');
/** Where the desk website is served. The gateway by default; `http://localhost:3100` for a local `next start`. */
export const WEB_URL = env('E2E_WEB_URL', BASE_URL);
/** Expo web export of the field app (mobile-web container). */
export const MOBILE_URL = env('E2E_MOBILE_URL', 'http://localhost:8082');
/** OData root behind the gateway. */
export const ODATA = `${BASE_URL}/odata/v4`;

export const KEYCLOAK_URL = env('E2E_KEYCLOAK_URL', 'http://localhost:8180');
export const REALM = env('E2E_REALM', 'lodestar');
/** Public web client. Tokens come from the password grant when the client allows it, else auth code + PKCE. */
export const CLIENT_ID = env('E2E_CLIENT_ID', 'lodestar-web');
/** 'password' | 'code' | 'auto' (password first, then the login form). Default 'code': the shipped realm disables the
 * password grant, and Keycloak's brute-force protection counts each refused password grant as a failed login. */
export const AUTH_MODE = env('E2E_AUTH_MODE', 'code');
/** Must match a redirect URI registered on CLIENT_ID. */
export const REDIRECT_URI = env('E2E_REDIRECT_URI', 'https://localhost:8443/');
export const CLIENT_SECRET = process.env.E2E_CLIENT_SECRET; // only when the test client is confidential
export const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
/** Expected `iss`; differs from KEYCLOAK_URL when Keycloak runs with a fixed KC_HOSTNAME. */
export const ISSUER = env('E2E_ISSUER', `${KEYCLOAK_URL}/realms/${REALM}`);
export const AUDIENCE = 'lodestar-api';

/** true in CI: a missing stack is a failure, not a skip. */
export const REQUIRE_STACK = /^(1|true|yes)$/i.test(process.env.E2E_REQUIRE_STACK ?? '');

export type Role = 'store_manager' | 'dispatcher' | 'loader' | 'driver' | 'admin';

export type Persona = {
  username: string;
  password: string;
  role: Role;
  depot?: 'PELIYAGODA' | 'KANDY';
  outletId?: string;
  vehicleId?: string;
  label: string;
};

// Defaults match backend/identity/lodestar-realm.json (LODESTAR_DEMO_PASSWORD / LODESTAR_ADMIN_PASSWORD).
const PASSWORD = env('E2E_PASSWORD', 'lodestar-dev-only');

// The scenario people (STORY.md / backend/prisma/scenario.ts). Override usernames with E2E_USER_<KEY>.
export const PERSONAS = {
  dispatcher: {
    label: 'Nilanthi Perera (dispatcher, both depots)',
    username: env('E2E_USER_DISPATCHER', 'nilanthi'), password: env('E2E_PASSWORD_DISPATCHER', PASSWORD),
    role: 'dispatcher',
  },
  loader: {
    label: 'Kasun Jayawardena (loader lead, Kandy Hub)',
    username: env('E2E_USER_LOADER', 'kasun'), password: env('E2E_PASSWORD_LOADER', PASSWORD),
    role: 'loader', depot: 'KANDY',
  },
  driver: {
    label: 'Ruwan Bandara (driver, VEH057)',
    username: env('E2E_USER_DRIVER', 'ruwan'), password: env('E2E_PASSWORD_DRIVER', PASSWORD),
    role: 'driver', depot: 'KANDY', vehicleId: 'VEH057',
  },
  storeManager: {
    label: 'Fathima Rizwan (store manager, OUT106 Nuwara Eliya)',
    username: env('E2E_USER_STORE_MANAGER', 'fathima'), password: env('E2E_PASSWORD_STORE_MANAGER', PASSWORD),
    role: 'store_manager', depot: 'KANDY', outletId: env('E2E_STORE_MANAGER_OUTLET', 'OUT106'),
  },
  admin: {
    label: 'Admin',
    username: env('E2E_USER_ADMIN', 'admin'), password: env('E2E_PASSWORD_ADMIN', 'lodestar-admin-dev-only'),
    role: 'admin',
  },
} satisfies Record<string, Persona>;

export type PersonaKey = keyof typeof PERSONAS;

/** An outlet that is not the store manager's, used for the ABAC row-filter test. */
export const OTHER_OUTLET = env('E2E_OTHER_OUTLET', 'OUT108');
/** A plan version that exists in the seeded scenario (plan v3 for Tue 7 Apr). */
export const SEED_PLAN_ID = env('E2E_PLAN_ID', 'PLG-2026-04-07-v3');
export const SEED_DEPOT = env('E2E_DEPOT', 'PELIYAGODA');
export const SEED_RUN_DATE = env('E2E_RUN_DATE', '2026-04-07');
