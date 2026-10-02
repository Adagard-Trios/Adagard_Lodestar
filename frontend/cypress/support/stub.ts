/// <reference types="cypress" />
// Stubbed live mode: the live screens without the stack (CI runs Cypress against `next start` only).
//  - signedInAs(): puts an OIDC user for the persona in sessionStorage, where oidc-client-ts keeps it
//    (oidc.user:<authority>:<client_id>), so AuthProvider starts authenticated and the face gate renders the
//    live screen. The access token is unsigned: the browser only decodes it for routing (lib/auth/session.ts);
//    nothing here reaches a real service.
//  - stubApi(): answers every /odata/v4 call from a handler (cy.intercept), and refuses the Socket.IO endpoint.
// The clock is frozen on Date only, so the screens' countdowns and "days ago" filters are fixed while timers,
// React and Cypress's retries keep running.

export type Persona = 'dispatcher' | 'store' | 'admin';

/** Mon 6 Apr 2026, 13:30 in Colombo: 2 h 30 m before the 4:00 PM order cutoff of the Tue 7 Apr run. */
export const NOW = Date.UTC(2026, 3, 6, 8, 0, 0);

const CLAIMS: Record<Persona, Record<string, unknown>> = {
  dispatcher: { sub: 'u-d', name: 'Dee Dispatcher', preferred_username: 'dee', realm_access: { roles: ['dispatcher'] }, depot: ['PELIYAGODA', 'KANDY'] },
  store: { sub: 'u-s', name: 'Sam Store', preferred_username: 'sam', realm_access: { roles: ['store_manager'] }, depot: ['KANDY'], outlet_id: 'OUTT01' },
  admin: { sub: 'u-a', name: 'Ada Admin', preferred_username: 'ada', realm_access: { roles: ['admin'] } },
};

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export interface ApiRequest {
  method: string;
  /** Path after /odata/v4/, decoded, without the query string. */
  path: string;
  query: Record<string, string>;
  body: unknown;
}
/** A JSON body (200), or an explicit status. `undefined` falls through to an empty collection. */
export type ApiReply = unknown | { statusCode: number; body?: unknown };
export type ApiHandler = (req: ApiRequest) => ApiReply;

export const page = <T>(value: T[], count?: number) => ({ '@odata.context': '$metadata#X', ...(count !== undefined ? { '@odata.count': count } : {}), value });
export const apiError = (statusCode: number, message: string, code = 'Failed') => ({ statusCode, body: { error: { code, message } } });

const isReply = (r: unknown): r is { statusCode: number; body?: unknown } =>
  Boolean(r && typeof r === 'object' && typeof (r as { statusCode?: unknown }).statusCode === 'number' && !('value' in (r as object)));

/** Every OData call answered by `handler`; the realtime socket is refused (the screens then show "Reconnecting"). */
export function stubApi(handler: ApiHandler) {
  cy.intercept({ pathname: /^\/ws\// }, { statusCode: 404, body: '' });
  cy.intercept({ pathname: /^\/odata\/v4\// }, req => {
    const url = new URL(req.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (query[k] = v));
    const r = handler({ method: req.method, path: decodeURIComponent(url.pathname.replace(/^\/odata\/v4\//, '')), query, body: req.body });
    if (isReply(r)) req.reply({ statusCode: r.statusCode, body: r.body ?? '' });
    else req.reply({ statusCode: 200, body: r ?? page([]) });
  }).as('api');
}

/** Opens a live screen signed in as the persona, with Date frozen at `now`. */
export function openAs(persona: Persona, path: string, now = NOW) {
  cy.clock(now, ['Date']);
  cy.visit(path, {
    onBeforeLoad(win) {
      const origin = win.location.origin;
      const exp = Math.floor(now / 1000) + 10 * 3600;
      const token = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ ...CLAIMS[persona], exp, iat: Math.floor(now / 1000) })}.`;
      win.sessionStorage.removeItem('lodestar.design');
      win.sessionStorage.setItem(`oidc.user:${origin}/auth/realms/lodestar:lodestar-web`, JSON.stringify({
        access_token: token,
        token_type: 'Bearer',
        scope: 'openid profile email',
        profile: { sub: CLAIMS[persona].sub, name: CLAIMS[persona].name },
        expires_at: exp,
      }));
    },
  });
  cy.get('.web-screen .frame', { timeout: 30_000 }).should('exist');
  cy.waitForHydration();
}
