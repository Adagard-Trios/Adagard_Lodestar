// Shared fixtures. Full-stack specs are tagged `@stack`; when the compose stack is not reachable they skip
// (locally) or fail (CI sets E2E_REQUIRE_STACK=1).
import { test as base, expect, request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { bearer, tokenFor } from './auth';
import { BASE_URL, KEYCLOAK_URL, ODATA, REALM, REQUIRE_STACK, type PersonaKey } from './env';
import { entityTypeOf, literal, parseCsdl, type Csdl } from './metadata';

const probes = new Map<string, Promise<boolean>>();

/** true when `url` answers at all (any HTTP status). Cached per worker. */
export function reachable(url: string): Promise<boolean> {
  if (!probes.has(url)) {
    probes.set(url, (async () => {
      const ctx = await request.newContext({ ignoreHTTPSErrors: true, timeout: 20_000 });
      try {
        await ctx.get(url, { maxRedirects: 0, failOnStatusCode: false });
        return true;
      } catch {
        return false;
      } finally {
        await ctx.dispose();
      }
    })());
  }
  return probes.get(url)!;
}

export const stackUp = async () =>
  (await reachable(`${BASE_URL}/odata/v4/`)) && (await reachable(`${KEYCLOAK_URL}/realms/${REALM}`));

/** Call at the top of a @stack describe. */
export function requireStack() {
  base.beforeAll(async () => {
    const up = await stackUp();
    if (!up && REQUIRE_STACK) throw new Error(`stack not reachable at ${BASE_URL} / ${KEYCLOAK_URL} (E2E_REQUIRE_STACK is set)`);
    base.skip(!up, `stack not reachable at ${BASE_URL}; start it with: docker compose up -d --build`);
  });
}

/** Skip (or fail in CI) when a single URL is not being served. */
export function requireUrl(url: string, what: string) {
  base.beforeAll(async () => {
    const up = await reachable(url);
    if (!up && REQUIRE_STACK) throw new Error(`${what} not reachable at ${url}`);
    base.skip(!up, `${what} not reachable at ${url}`);
  });
}

/** An OData client bound to one persona (or anonymous). */
export class OData {
  constructor(private readonly ctx: APIRequestContext, private readonly token?: string) {}

  headers(extra: Record<string, string> = {}) {
    return { Accept: 'application/json', ...(this.token ? bearer(this.token) : {}), ...extra };
  }

  url(path: string) {
    return path.startsWith('http') ? path : `${ODATA}/${path.replace(/^\//, '')}`;
  }

  get(path: string, headers?: Record<string, string>) {
    return this.ctx.get(this.url(path), { headers: this.headers(headers), failOnStatusCode: false });
  }

  post(path: string, data?: unknown, headers?: Record<string, string>) {
    return this.ctx.post(this.url(path), { headers: this.headers({ 'Content-Type': 'application/json', ...headers }), data: data ?? {}, failOnStatusCode: false });
  }

  patch(path: string, data: unknown, headers?: Record<string, string>) {
    return this.ctx.patch(this.url(path), { headers: this.headers({ 'Content-Type': 'application/json', ...headers }), data, failOnStatusCode: false });
  }

  async json<T = ODataCollection>(path: string): Promise<T> {
    const res = await this.get(path);
    await expectStatus(res, 200, path);
    return (await res.json()) as T;
  }
}

export type ODataCollection<T = Record<string, unknown>> = {
  '@odata.context': string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
};

export async function expectStatus(res: APIResponse, status: number | number[], what = res.url()) {
  const want = Array.isArray(status) ? status : [status];
  if (!want.includes(res.status())) {
    throw new Error(`${what}: expected HTTP ${want.join(' or ')}, got ${res.status()}\n${(await res.text()).slice(0, 800)}`);
  }
}

/** The OData v4 JSON error body (PLATFORM.md §3). */
export async function expectODataError(res: APIResponse, status: number) {
  await expectStatus(res, status);
  const body = await res.json();
  expect(body).toHaveProperty('error');
  expect(typeof body.error.code).toBe('string');
  expect(body.error.code.length).toBeGreaterThan(0);
  expect(typeof body.error.message).toBe('string');
  return body.error as { code: string; message: string; target?: string; details?: unknown[] };
}

let csdl: Promise<Csdl> | undefined;

/** The merged $metadata, parsed once per worker. */
export function metadata(client: OData): Promise<Csdl> {
  csdl ??= (async () => {
    const res = await client.get('$metadata', { Accept: 'application/xml' });
    await expectStatus(res, 200, '$metadata');
    return parseCsdl(await res.text());
  })();
  return csdl;
}

/** `Set('key')` (or `Set(k1=..,k2=..)`) for an entity row, from the key declared in $metadata. */
export async function entityPath(client: OData, set: string, row: Record<string, unknown>): Promise<string> {
  const t = entityTypeOf(await metadata(client), set);
  if (t.key.length === 1) {
    const k = t.key[0];
    return `${set}(${literal(t.properties[k]?.type ?? 'Edm.String', row[k])})`;
  }
  return `${set}(${t.key.map(k => `${k}=${literal(t.properties[k]?.type ?? 'Edm.String', row[k])}`).join(',')})`;
}

type Fixtures = {
  api: APIRequestContext;
  anon: OData;
  as: (who: PersonaKey) => Promise<OData>;
};

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    await use(ctx);
    await ctx.dispose();
  },
  anon: async ({ api }, use) => {
    await use(new OData(api));
  },
  as: async ({ api }, use) => {
    await use(async who => new OData(api, await tokenFor(who, api)));
  },
});

export { expect };
