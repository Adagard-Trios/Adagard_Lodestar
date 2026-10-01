// Runtime endpoints of the desk website.
//
// By default everything is derived from the page's own origin, because the website, the API, Keycloak and
// Socket.IO all sit behind the same gateway (PLATFORM.md §1):
//   API       <origin>/odata/v4
//   Keycloak  <origin>/auth/realms/lodestar   (issuer)
//   Socket.IO <origin>  path /ws/
// Each can be overridden at build time with NEXT_PUBLIC_* (Next inlines them into the bundle, so they must be
// referenced literally below).

export interface RuntimeConfig {
  origin: string;
  /** OData service root, without a trailing slash. */
  apiBase: string;
  /** OIDC issuer (Keycloak realm URL). */
  authority: string;
  clientId: string;
  /** Socket.IO server origin and path. */
  wsOrigin: string;
  wsPath: string;
}

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
const noSlash = (v: string) => v.replace(/\/+$/, '');

/** Build-time overrides. Empty strings count as unset (Docker build args default to ""). */
export function buildEnv() {
  return {
    api: clean(process.env.NEXT_PUBLIC_API_URL),
    authority: clean(process.env.NEXT_PUBLIC_OIDC_AUTHORITY),
    clientId: clean(process.env.NEXT_PUBLIC_OIDC_CLIENT_ID),
    ws: clean(process.env.NEXT_PUBLIC_WS_URL),
  };
}

export function resolveConfig(origin: string, env: ReturnType<typeof buildEnv> = buildEnv()): RuntimeConfig {
  const base = noSlash(origin);
  let wsOrigin = base;
  let wsPath = '/ws/';
  if (env.ws) {
    // Accept "wss://host/ws/", "https://host" or a bare path "/ws/".
    if (env.ws.startsWith('/')) wsPath = env.ws;
    else {
      const u = new URL(env.ws, base);
      const scheme = u.protocol === 'wss:' ? 'https:' : u.protocol === 'ws:' ? 'http:' : u.protocol;
      wsOrigin = `${scheme}//${u.host}`;
      if (u.pathname && u.pathname !== '/') wsPath = u.pathname;
    }
  }
  if (!wsPath.endsWith('/')) wsPath += '/';
  return {
    origin: base,
    apiBase: noSlash(env.api ?? `${base}/odata/v4`),
    authority: noSlash(env.authority ?? `${base}/auth/realms/lodestar`),
    clientId: env.clientId ?? 'lodestar-web',
    wsOrigin,
    wsPath,
  };
}

let cached: RuntimeConfig | undefined;

/** The config for this browser tab. Only call it in the browser (effects, handlers). */
export function runtimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') throw new Error('runtimeConfig() is browser-only');
  cached ??= resolveConfig(window.location.origin);
  return cached;
}
