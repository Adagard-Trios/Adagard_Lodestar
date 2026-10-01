import { createHash } from 'crypto';
import { ODataError } from './errors';

/**
 * Idempotent retries (Idempotency-Key)
 * ────────────────────────────────────
 * Field apps replay queued writes after a blackout and cannot tell whether a
 * request that timed out was applied. Writes declared `idempotent` honour an
 * `Idempotency-Key` header:
 *
 *   first call          executes, stores key + user + route + request hash + response
 *   retry, same body    returns the stored response with `Idempotent-Replay: true`
 *                       (nothing is executed again)
 *   same key, new body  422 IdempotencyKeyReused
 *   retry while the     409 IdempotencyRequestInProgress
 *   first is running
 *
 * Records live at least IDEMPOTENCY_TTL_HOURS (default 24) in a table of the
 * owning service's schema (orders."IdempotencyKey", trips."IdempotencyKey").
 * Failed executions are not stored, so the client may retry them.
 */

export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const IDEMPOTENT_REPLAY_HEADER = 'Idempotent-Replay';
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
/** A PENDING claim older than this was left by a crashed request and may be taken over. */
export const PENDING_TAKEOVER_MS = 2 * 60 * 1000;

export type IdempotencyStatus = 'PENDING' | 'DONE';

/** A response as replayed to a retry. */
export interface StoredResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  audit?: { action: string; entitySet?: string; entityKey?: string };
}

export interface IdempotencyRecord {
  key: string;
  userId: string;
  route: string;
  requestHash: string;
  status: IdempotencyStatus;
  response?: StoredResponse | null;
  createdAt: Date;
  expiresAt: Date;
}

/** Persistence of idempotency records (one table per owning service). */
export interface IdempotencyStore {
  find(userId: string, key: string): Promise<IdempotencyRecord | null>;
  /** Inserts a PENDING record; false when (userId, key) already exists. */
  claim(record: Omit<IdempotencyRecord, 'status' | 'response'>): Promise<boolean>;
  complete(userId: string, key: string, response: StoredResponse): Promise<void>;
  release(userId: string, key: string): Promise<void>;
  purgeExpired(now: Date): Promise<number>;
}

export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');

/** The Prisma model delegate of an idempotency table. */
export interface IdempotencyDelegate {
  findUnique(args: any): Promise<any | null>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  deleteMany(args: any): Promise<{ count: number }>;
}

/** IdempotencyStore on a Prisma model with the IdempotencyKey shape (see schema.prisma). */
export class PrismaIdempotencyStore implements IdempotencyStore {
  constructor(private readonly delegate: IdempotencyDelegate) {}

  async find(userId: string, key: string): Promise<IdempotencyRecord | null> {
    return (await this.delegate.findUnique({ where: { userId_key: { userId, key } } })) ?? null;
  }

  async claim(record: Omit<IdempotencyRecord, 'status' | 'response'>): Promise<boolean> {
    try {
      await this.delegate.create({ data: { ...record, status: 'PENDING' } });
      return true;
    } catch (err) {
      if ((err as any)?.code === 'P2002') return false; // unique (userId, key): someone else holds it
      throw err;
    }
  }

  async complete(userId: string, key: string, response: StoredResponse): Promise<void> {
    await this.delegate.update({ where: { userId_key: { userId, key } }, data: { status: 'DONE', response } });
  }

  async release(userId: string, key: string): Promise<void> {
    await this.delegate.deleteMany({ where: { userId, key } });
  }

  async purgeExpired(now: Date): Promise<number> {
    return (await this.delegate.deleteMany({ where: { expiresAt: { lt: now } } })).count;
  }
}

/** JSON with object keys sorted, so equal bodies hash equally whatever the key order. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export function requestHash(body: unknown): string {
  return createHash('sha256').update(canonicalJson(body ?? {})).digest('hex');
}

/** TTL from IDEMPOTENCY_TTL_HOURS; never below the 24 h the field app relies on. */
export function idempotencyTtlMs(env: NodeJS.ProcessEnv = process.env): number {
  const hours = Number(env.IDEMPOTENCY_TTL_HOURS);
  return Number.isFinite(hours) && hours > 24 ? hours * 60 * 60 * 1000 : DEFAULT_IDEMPOTENCY_TTL_MS;
}

export interface IdempotentCall {
  userId: string;
  key: string;
  /** METHOD + resource path, e.g. POST /Orders('ORD1')/Lodestar.ConfirmReceipt */
  route: string;
  body: unknown;
}

const PURGE_EVERY_MS = 10 * 60 * 1000;

/** Runs writes at most once per (user, Idempotency-Key). */
export class IdempotencyService {
  private lastPurge = 0;

  constructor(
    private readonly store: IdempotencyStore,
    private readonly ttlMs = DEFAULT_IDEMPOTENCY_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  /** Validates a raw header value; undefined when absent. */
  static keyFrom(raw: string | string[] | undefined): string | undefined {
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (v === undefined || v.trim() === '') return undefined;
    const key = v.trim();
    if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
      throw ODataError.badRequest('Idempotency-Key must be 1-128 letters, digits, ".", "_", ":" or "-"', 'Idempotency-Key');
    }
    return key;
  }

  async run<R extends StoredResponse>(call: IdempotentCall, exec: () => Promise<R>): Promise<R | StoredResponse> {
    const hash = requestHash(call.body);
    const now = this.now();
    this.purge(now);

    let existing = await this.store.find(call.userId, call.key);
    if (existing && this.stale(existing, now)) {
      await this.store.release(call.userId, call.key);
      existing = null;
    }

    if (!existing) {
      const claimed = await this.store.claim({
        key: call.key,
        userId: call.userId,
        route: call.route,
        requestHash: hash,
        createdAt: new Date(now),
        expiresAt: new Date(now + this.ttlMs),
      });
      if (claimed) return this.execute(call, exec);
      existing = await this.store.find(call.userId, call.key); // lost a race with a parallel retry
      if (!existing) throw ODataError.conflict('A request with this Idempotency-Key is being processed; retry shortly', 'Idempotency-Key');
    }

    if (existing.route !== call.route || existing.requestHash !== hash) {
      throw ODataError.unprocessable(
        'IdempotencyKeyReused',
        'This Idempotency-Key was already used for a different request; use a new key',
        'Idempotency-Key',
      );
    }
    if (existing.status !== 'DONE' || !existing.response) {
      throw new ODataError(409, 'IdempotencyRequestInProgress', 'A request with this Idempotency-Key is still being processed; retry shortly', 'Idempotency-Key');
    }
    return replay(existing.response);
  }

  private async execute<R extends StoredResponse>(call: IdempotentCall, exec: () => Promise<R>): Promise<R> {
    let response: R;
    try {
      response = await exec();
    } catch (err) {
      // Not applied: forget the key so the client's retry runs again.
      await this.store.release(call.userId, call.key).catch(() => undefined);
      throw err;
    }
    await this.store.complete(call.userId, call.key, {
      status: response.status,
      headers: response.headers,
      body: response.body,
      ...(response.audit ? { audit: response.audit } : {}),
    });
    return response;
  }

  private stale(r: IdempotencyRecord, now: number): boolean {
    if (new Date(r.expiresAt).getTime() <= now) return true;
    return r.status === 'PENDING' && now - new Date(r.createdAt).getTime() > PENDING_TAKEOVER_MS;
  }

  private purge(now: number) {
    if (now - this.lastPurge < PURGE_EVERY_MS) return;
    this.lastPurge = now;
    void this.store.purgeExpired(new Date(now)).catch(() => undefined);
  }
}

/** The stored response, marked as a replay. The audit entry names it as such (nothing was written). */
export function replay(stored: StoredResponse): StoredResponse {
  return {
    status: stored.status,
    headers: { ...stored.headers, [IDEMPOTENT_REPLAY_HEADER]: 'true' },
    body: stored.body,
    ...(stored.audit ? { audit: { ...stored.audit, action: `${stored.audit.action}.Replay` } } : {}),
  };
}
