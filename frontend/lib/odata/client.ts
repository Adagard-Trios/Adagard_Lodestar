// Typed OData v4 client for the Lodestar API (PLATFORM.md §3).
//  - Same-origin base `/odata/v4` by default, JSON, bearer token on every call.
//  - Server-driven paging through @odata.nextLink (followed only on the API's own origin, so the token never
//    leaves it).
//  - PATCH sends If-Match with the entity's ETag (@odata.etag).
//  - Errors surface the OData error body {error: {code, message, target, details}}.
//  - A 401 renews the session once and retries; if that fails, the user is sent to sign in.
//  - Every answer (or the lack of one) is reported to lib/desk-status, which drives the offline banner (DSP-24),
//    service unavailable (SM-36) and no access to this depot (DSP-36).
import { reportForbidden, reportNetworkError, reportResponse } from '../desk-status';

export type Primitive = string | number | boolean | null;
export type EntityKey = string | number | Record<string, Primitive>;

export interface QueryOptions {
  filter?: string;
  select?: string | string[];
  expand?: string;
  orderby?: string;
  top?: number;
  skip?: number;
  count?: boolean;
  search?: string;
}

export interface Page<T> {
  value: T[];
  count?: number;
  nextLink?: string;
}

export interface TokenSource {
  getAccessToken(): Promise<string | null>;
  /** Called after a 401. Resolve to a new token, or null when the session cannot be renewed. */
  renew(): Promise<string | null>;
  /** Called when there is no usable session: start the sign-in. */
  loginRequired(): void;
}

export interface ODataErrorBody {
  code: string;
  message: string;
  target?: string | null;
  details?: Array<{ code?: string; message?: string; target?: string | null }>;
}

export class ODataError extends Error implements ODataErrorBody {
  readonly status: number;
  readonly code: string;
  readonly target?: string | null;
  readonly details: NonNullable<ODataErrorBody['details']>;

  constructor(status: number, body: Partial<ODataErrorBody>) {
    super(body.message || `Request failed (HTTP ${status})`);
    this.name = 'ODataError';
    this.status = status;
    this.code = body.code || (status === 0 ? 'NetworkError' : `HTTP${status}`);
    this.target = body.target ?? null;
    this.details = body.details ?? [];
  }
}

/** An OData literal for keys and function parameters: 'text' (quotes doubled), numbers, booleans, null, and
 *  unquoted dates/date-times (Edm.Date 2026-04-07, Edm.DateTimeOffset 2026-04-07T05:30:00Z). */
export function literal(v: Primitive): string {
  if (v === null) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(v)) return v;
  return `'${v.replace(/'/g, "''")}'`;
}

/** A plain string literal, always quoted (for values that merely look like dates). */
export const str = (v: string) => `'${v.replace(/'/g, "''")}'`;

export function formatKey(key: EntityKey): string {
  if (typeof key === 'string') return `(${str(key)})`;
  if (typeof key === 'number') return `(${key})`;
  return `(${Object.entries(key).map(([k, v]) => `${k}=${literal(v)}`).join(',')})`;
}

export function buildQuery(q: QueryOptions = {}): string {
  const parts: string[] = [];
  const add = (k: string, v: string | number | boolean | undefined) => {
    if (v === undefined || v === '') return;
    parts.push(`$${k}=${encodeURIComponent(String(v))}`);
  };
  add('filter', q.filter);
  add('select', Array.isArray(q.select) ? q.select.join(',') : q.select);
  add('expand', q.expand);
  add('orderby', q.orderby);
  add('top', q.top);
  add('skip', q.skip);
  if (q.count) add('count', true);
  add('search', q.search);
  return parts.length ? `?${parts.join('&')}` : '';
}

type Json = Record<string, unknown>;

export interface ODataResult<T> {
  data: T;
  status: number;
  etag?: string;
}

export interface ClientOptions {
  baseUrl: string;
  tokens: TokenSource;
  fetchImpl?: typeof fetch;
}

/** The fields every Lodestar entity carries in responses. */
export type WithEtag<T> = T & { '@odata.etag'?: string };

export class ODataClient {
  readonly baseUrl: string;
  private readonly tokens: TokenSource;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.tokens = opts.tokens;
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  /** Absolute URL for a path relative to the service root, or a nextLink. Refuses foreign origins. */
  url(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      const target = new URL(pathOrUrl);
      const own = new URL(this.baseUrl, typeof window !== 'undefined' ? window.location.href : undefined);
      if (target.origin !== own.origin) throw new ODataError(0, { code: 'ForeignLink', message: `Refusing to follow a link to ${target.origin}` });
      return target.toString();
    }
    return `${this.baseUrl}/${pathOrUrl.replace(/^\/+/, '')}`;
  }

  async request<T = Json>(method: string, path: string, init: { body?: unknown; headers?: Record<string, string> } = {}): Promise<ODataResult<T>> {
    const url = this.url(path);
    const send = async (token: string | null) => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'OData-Version': '4.0',
        'OData-MaxVersion': '4.0',
        ...init.headers,
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (init.body !== undefined) headers['Content-Type'] = 'application/json';
      try {
        const res = await this.fetchImpl(url, {
          method,
          headers,
          body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
          credentials: 'omit', // bearer tokens only; no ambient cookies
        });
        reportResponse(res.status);
        return res;
      } catch (err) {
        reportNetworkError();
        throw new ODataError(0, { code: 'NetworkError', message: `The Lodestar API is not reachable (${(err as Error).message})` });
      }
    };

    const token = await this.tokens.getAccessToken();
    if (!token) {
      this.tokens.loginRequired();
      throw new ODataError(401, { code: 'Unauthorized', message: 'Sign in to continue' });
    }
    let res = await send(token);
    if (res.status === 401) {
      const fresh = await this.tokens.renew();
      if (fresh) res = await send(fresh);
      if (!fresh || res.status === 401) {
        this.tokens.loginRequired();
        throw await toError(res);
      }
    }
    if (!res.ok) {
      const error = await toError(res);
      if (error.status === 403) reportForbidden(error);
      throw error;
    }
    const etag = res.headers.get('ETag') ?? undefined;
    if (res.status === 204) return { data: undefined as T, status: 204, etag };
    const text = await res.text();
    const data = (text ? JSON.parse(text) : undefined) as T;
    return { data, status: res.status, etag: etag ?? (data as Json | undefined)?.['@odata.etag'] as string | undefined };
  }

  /** One page of an entity set. */
  async list<T>(set: string, q?: QueryOptions): Promise<Page<WithEtag<T>>> {
    const { data } = await this.request<Json>('GET', `${set}${buildQuery(q)}`);
    return toPage<WithEtag<T>>(data);
  }

  /** The page behind an @odata.nextLink. */
  async next<T>(nextLink: string): Promise<Page<WithEtag<T>>> {
    const { data } = await this.request<Json>('GET', nextLink);
    return toPage<WithEtag<T>>(data);
  }

  /** Every row, following nextLinks (bounded, so a huge set cannot run away). */
  async all<T>(set: string, q?: QueryOptions, maxPages = 20): Promise<WithEtag<T>[]> {
    let page = await this.list<T>(set, q);
    const rows = [...page.value];
    for (let i = 1; page.nextLink && i < maxPages; i++) {
      page = await this.next<T>(page.nextLink);
      rows.push(...page.value);
    }
    return rows;
  }

  async get<T>(set: string, key: EntityKey, q?: Pick<QueryOptions, 'select' | 'expand'>): Promise<WithEtag<T>> {
    const { data, etag } = await this.request<WithEtag<T>>('GET', `${set}${formatKey(key)}${buildQuery(q)}`);
    return etag && !data['@odata.etag'] ? { ...data, '@odata.etag': etag } : data;
  }

  async create<T>(set: string, body: Json): Promise<WithEtag<T>> {
    const { data } = await this.request<WithEtag<T>>('POST', set, { body, headers: { Prefer: 'return=representation' } });
    return data;
  }

  /**
   * PATCH with If-Match. Pass the ETag you read (row['@odata.etag']) so a concurrent change is reported as a
   * 412 instead of being overwritten; without one, the current ETag is read first.
   */
  async update<T>(set: string, key: EntityKey, patch: Json, etag?: string): Promise<WithEtag<T>> {
    const tag = etag ?? (await this.get<Json>(set, key))['@odata.etag'];
    const { data } = await this.request<WithEtag<T>>('PATCH', `${set}${formatKey(key)}`, {
      body: patch,
      headers: { 'If-Match': tag ?? '*', Prefer: 'return=representation' },
    });
    return data;
  }

  /** POST Set('key')/Lodestar.Name (bound to an entity), Set/Lodestar.Name (collection) or Name (unbound). */
  async action<T = Json>(set: string | null, key: EntityKey | null, name: string, params: Json = {}): Promise<T> {
    const { data } = await this.request<T>('POST', operationPath(set, key, name), { body: params });
    return data;
  }

  /** GET Set/Lodestar.Name(a=1,b='x') — an OData function. */
  async fn<T = Json>(set: string | null, key: EntityKey | null, name: string, params: Record<string, Primitive> = {}): Promise<T> {
    const args = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(literal(v))}`).join(',');
    const { data } = await this.request<T>('GET', `${operationPath(set, key, name)}(${args})`);
    return data;
  }
}

function operationPath(set: string | null, key: EntityKey | null, name: string): string {
  const op = name.includes('.') ? name : `Lodestar.${name}`;
  if (!set) return name;
  return `${set}${key !== null && key !== undefined ? formatKey(key) : ''}/${op}`;
}

function toPage<T>(data: Json): Page<T> {
  return {
    value: (Array.isArray(data?.value) ? data.value : []) as T[],
    count: typeof data?.['@odata.count'] === 'number' ? (data['@odata.count'] as number) : undefined,
    nextLink: typeof data?.['@odata.nextLink'] === 'string' ? (data['@odata.nextLink'] as string) : undefined,
  };
}

async function toError(res: Response): Promise<ODataError> {
  let body: Partial<ODataErrorBody> = {};
  try {
    const json = (await res.json()) as { error?: Partial<ODataErrorBody> };
    if (json && typeof json.error === 'object') body = json.error;
  } catch {
    // not JSON (a proxy page): keep the status-based message
  }
  if (!body.message) body.message = STATUS_TEXT[res.status] ?? `Request failed (HTTP ${res.status})`;
  return new ODataError(res.status, body);
}

const STATUS_TEXT: Record<number, string> = {
  401: 'Your session has ended. Sign in again.',
  403: 'You do not have access to this.',
  404: 'Not found.',
  409: 'This was changed and cannot be updated now.',
  412: 'Someone else changed this first. Reload and try again.',
  429: 'Too many requests. Try again in a moment.',
  502: 'A Lodestar service did not answer.',
  503: 'A Lodestar service is unavailable.',
};

/** The `value` of an operation that returns a primitive or untyped result ({"value": …}). */
export function valueOf<T>(body: unknown): T {
  return (body && typeof body === 'object' && 'value' in (body as Json) ? (body as Json).value : body) as T;
}
