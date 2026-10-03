// Test helpers for the live layer: a real ODataClient over a fake fetch (so requests are asserted at the HTTP
// level), a fake realtime hub, and a render wrapper with a signed-in session.
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { AuthTestContext, type AuthApi } from '@/lib/auth/AuthProvider';
import type { Session } from '@/lib/auth/session';
import { ODataClient, type TokenSource } from '@/lib/odata/client';
import { ApiContext } from '@/lib/odata/hooks';
import type { RealtimeHandler, RealtimeHub } from '@/lib/realtime';

export interface FakeRequest {
  method: string;
  /** Path after /odata/v4/, decoded, without the query string. */
  path: string;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
}

export type Reply = unknown | { status: number; body?: unknown; headers?: Record<string, string> };
export type Handler = (req: FakeRequest) => Reply;

const isReply = (r: unknown): r is { status: number; body?: unknown; headers?: Record<string, string> } =>
  Boolean(r && typeof r === 'object' && 'status' in (r as object) && typeof (r as { status: unknown }).status === 'number' && !('value' in (r as object)));

export function fakeResponse(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k] ?? headers[k.toLowerCase()] ?? null },
    text: async () => text,
    json: async () => JSON.parse(text),
  } as unknown as Response;
}

/** A fetch that answers from `handler`, recording every request. */
export function fakeFetch(handler: Handler) {
  const calls: FakeRequest[] = [];
  const fn = jest.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), 'http://localhost');
    const path = decodeURIComponent(url.pathname.replace(/^\/odata\/v4\//, ''));
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (query[k] = v));
    const req: FakeRequest = {
      method: init.method ?? 'GET',
      path,
      query,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      headers: (init.headers ?? {}) as Record<string, string>,
    };
    calls.push(req);
    const reply = handler(req);
    if (isReply(reply)) return fakeResponse(reply.status, reply.body, reply.headers);
    return fakeResponse(200, reply ?? { value: [] });
  });
  return { fn, calls };
}

export function tokens(over: Partial<TokenSource> = {}): TokenSource {
  return { getAccessToken: async () => 'token-1', renew: async () => 'token-2', loginRequired: jest.fn(), ...over };
}

/** The depot registry (OData Depots, ADM-21) as the seed holds it: every screen names depots from it. */
export const DEPOTS = [
  { code: 'KANDY', name: 'Kandy Hub', district: 'Kandy', address: null, phone: null, lat: null, lng: null, isActive: true, '@odata.etag': 'W/"1"' },
  { code: 'PELIYAGODA', name: 'Peliyagoda DC', district: 'Gampaha', address: null, phone: null, lat: null, lng: null, isActive: true, '@odata.etag': 'W/"1"' },
];

/**
 * Answers GET Depots with DEPOTS unless the test's own handler answers it with depot rows, so screens show real
 * depot names without every test having to stub the registry.
 */
export function withDepots(handler: Handler): Handler {
  return req => {
    const reply = handler(req);
    if (req.method !== 'GET' || req.path !== 'Depots') return reply;
    const rows = (reply as { value?: unknown[] } | undefined)?.value;
    const own = isReply(reply) || (Array.isArray(rows) && rows.length > 0 && rows.every(r => r && typeof r === 'object' && 'code' in (r as object)));
    return own ? reply : { value: DEPOTS };
  };
}

export function mockApi(handler: Handler, tokenSource: TokenSource = tokens()) {
  const f = fakeFetch(withDepots(handler));
  const client = new ODataClient({ baseUrl: 'http://localhost/odata/v4', tokens: tokenSource, fetchImpl: f.fn as unknown as typeof fetch });
  return { client, calls: f.calls, fetch: f.fn };
}

export function fakeHub() {
  const handlers = new Map<string, Set<RealtimeHandler>>();
  const hub: RealtimeHub & { emit(event: string, payload?: unknown): void } = {
    on(event, fn) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(fn);
      return () => handlers.get(event)?.delete(fn);
    },
    onStatus: () => () => undefined,
    status: () => 'connected',
    close: () => undefined,
    emit(event, payload) {
      handlers.get(event)?.forEach(fn => fn(payload, event));
      handlers.get('*')?.forEach(fn => fn(payload, event));
    },
  };
  return hub;
}

export const SESSIONS: Record<'dispatcher' | 'store' | 'admin', Session> = {
  dispatcher: { sub: 'u-d', name: 'Dee Dispatcher', roles: ['dispatcher'], depots: ['PELIYAGODA', 'KANDY'] },
  store: { sub: 'u-s', name: 'Sam Store', roles: ['store_manager'], depots: ['KANDY'], outletId: 'OUTT01' },
  admin: { sub: 'u-a', name: 'Ada Admin', roles: ['admin'], depots: [] },
};

export function authValue(session: Session | null, over: Partial<AuthApi> = {}): AuthApi {
  return {
    status: session ? 'authenticated' : 'anonymous',
    session,
    login: jest.fn(async () => undefined),
    logout: jest.fn(async () => undefined),
    getAccessToken: async () => (session ? 'token-1' : null),
    renew: async () => null,
    completeLogin: async () => '/',
    ...over,
  };
}

/** Plans/Lodestar.PlanningRules as the planning service returns it (planning-rules.ts); measured models are empty. */
export const PLANNING_RULES = {
  cutoff: '16:00',
  timeZone: 'Asia/Colombo',
  deferral: {
    weights: { deferredYesterday: 40, perDaySince: 12, chilled: 15, freshBeforeOpening: 10, freshBeforeHour: 8, nextRunWithin24h: -10, stockCoverPerDay: -5, stockCoverCap: 20 },
    protectedScore: 91,
    candidateBelow: 30,
  },
  lateRisk: { alertPct: 30, highPct: 60, thresholdOptions: [20, 30, 40, 50] },
  load: { warnPct: 85 },
  alertDefaults: {
    vehicleFault: { push: true, sms: true },
    lateRisk: { push: true, threshold: 30, risingOnly: true },
    flags: { push: true },
    silence: { push: true, call: true, minutes: 15 },
    signalZones: { alert: false },
  },
  modelTargets: {
    serviceTime: { metric: 'MAE', comparator: '<=', value: 4, unit: 'min a stop' },
    lateness: { metric: 'AUC', comparator: '>=', value: 0.8, unit: null },
    demand: { metric: 'WAPE', comparator: '<=', value: 12, unit: '% a week' },
  },
  outlookWeeks: 10,
  models: {
    serviceTime: { target: { metric: 'MAE', comparator: '<=', value: 4, unit: 'min a stop' }, measured: { value: null, n: 0, reason: 'No stop has both a predicted and an actual service time yet' } },
    lateness: { target: { metric: 'AUC', comparator: '>=', value: 0.8, unit: null }, measured: { value: null, n: 0, reason: 'No stop with a late risk has arrived yet' } },
    demand: { target: { metric: 'WAPE', comparator: '<=', value: 12, unit: '% a week' }, measured: { value: null, n: 0, reason: 'No past forecasts are stored to score against delivered volume' } },
  },
};

/** A screen's handler, with Plans/Lodestar.PlanningRules answered from PLANNING_RULES unless `rules` overrides it. */
export function withPlanningRules(handler: Handler, rules: unknown = PLANNING_RULES): Handler {
  return req => (req.path.includes('Lodestar.PlanningRules') ? { value: rules } : handler(req));
}

export function renderLive(ui: ReactElement, opts: { handler: Handler; session?: Session | null; rules?: unknown }) {
  const api = mockApi(withPlanningRules(opts.handler, opts.rules));
  const hub = fakeHub();
  const auth = authValue(opts.session === undefined ? SESSIONS.dispatcher : opts.session);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AuthTestContext.Provider value={auth}>
      <ApiContext.Provider value={{ client: api.client, realtime: hub }}>{children}</ApiContext.Provider>
    </AuthTestContext.Provider>
  );
  const view = render(ui, { wrapper: Wrapper });
  return { ...view, ...api, hub, auth };
}

/** Collection reply. */
export const page = <T,>(value: T[], count?: number, nextLink?: string) => ({
  '@odata.context': '$metadata#X',
  ...(count !== undefined ? { '@odata.count': count } : {}),
  value,
  ...(nextLink ? { '@odata.nextLink': nextLink } : {}),
});

/** The planning agent's limits as AgentRuns/Lodestar.AgentConfig returns them (only the parts the board screens read). */
export const AGENT_CONFIG = {
  firstDeparture: '03:30',
  limits: { maxTripsPerVehicle: 2, freshMinutesBudget: 270, otherMinutesBudget: 480, protectedScore: 91, deferralCandidateBelow: 30, defaultServiceMin: 15 },
  rules: [{ rule: 'weight', label: 'Weight' }, { rule: 'volume', label: 'Volume' }],
  reasonCodes: [],
};
/** Answers the AgentConfig function call, else undefined. */
export const agentConfigReply = (req: FakeRequest) => (req.path.includes('Lodestar.AgentConfig') ? { value: AGENT_CONFIG } : undefined);
