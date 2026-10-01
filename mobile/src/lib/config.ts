// Where the field app finds the platform (docs/architecture/PLATFORM.md §1).
//   Native (device / simulator): https://localhost:8443 unless EXPO_PUBLIC_API_URL is set.
//   Web (mobile-web container):  the page's own origin; its NGINX proxies /odata/ and /ws/ to the gateway.
// EXPO_PUBLIC_* values are inlined at build time, so they are read with plain `process.env.X` access.
import { Platform } from 'react-native';

const trimSlash = (s: string) => s.replace(/\/+$/, '');

function webOrigin(): string | undefined {
  return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
}

export const DEFAULT_API = 'https://localhost:8443';

/** Origin of the gateway (no trailing slash). The OData root is `${apiBase()}/odata/v4`. */
export function apiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return trimSlash(fromEnv);
  if (Platform.OS === 'web') return webOrigin() ?? DEFAULT_API;
  return DEFAULT_API;
}

/** True when API calls go to the page's own origin (no CORS preflight, so extra headers are fine). */
export function sameOriginApi(): boolean {
  if (Platform.OS !== 'web') return true;
  const origin = webOrigin();
  return !!origin && apiBase() === origin;
}

export const ODATA_ROOT = '/odata/v4';

/** Keycloak realm issuer. The browser and the services all see this one issuer. */
export function issuer(): string {
  return trimSlash(process.env.EXPO_PUBLIC_OIDC_ISSUER || `${DEFAULT_API}/auth/realms/lodestar`);
}

/** The public, PKCE-only field client (backend/identity/lodestar-realm.json). */
export function clientId(): string {
  return process.env.EXPO_PUBLIC_OIDC_CLIENT_ID || 'lodestar-field';
}

export const APP_SCHEME = 'lodestar';
export const CALLBACK_PATH = 'auth/callback';

/** Optional fixed run date (YYYY-MM-DD) for demos against a seeded day. */
export function runDateOverride(): string | undefined {
  const v = process.env.EXPO_PUBLIC_RUN_DATE;
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}
