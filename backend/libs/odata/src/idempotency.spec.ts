import { anything, capture, deepEqual, instance, mock, resetCalls, verify, when } from 'ts-mockito';
import { personas } from '../../security/test/principals';
import { testModel } from '../test/fixtures';
import { ODataEngine, ODataRequest } from './engine';
import { EntitySet, ModelDelegate, ODataAction, ODataEntitySet } from './entity-set';
import { ODataError } from './errors';
import {
  canonicalJson,
  DEFAULT_IDEMPOTENCY_TTL_MS,
  IdempotencyDelegate,
  IdempotencyRecord,
  IdempotencyService,
  IdempotencyStore,
  idempotencyTtlMs,
  PENDING_TAKEOVER_MS,
  PrismaIdempotencyStore,
  replay,
  requestHash,
  StoredResponse,
} from './idempotency';
import { ODataRegistry } from './registry';

const T0 = Date.parse('2026-04-07T03:40:00Z');
const OK: StoredResponse = { status: 200, headers: { 'OData-Version': '4.0' }, body: { id: 'T1', status: 'ENROUTE' }, audit: { action: 'Trips.Release', entitySet: 'Trips', entityKey: 'T1' } };
const call = { userId: 'kasun', key: 'k-1', route: "POST /Trips('T1')/Lodestar.Release", body: { sealNumber: 'KDY-1' } };

function record(over: Partial<IdempotencyRecord> = {}): IdempotencyRecord {
  return {
    key: call.key,
    userId: call.userId,
    route: call.route,
    requestHash: requestHash(call.body),
    status: 'DONE',
    response: OK,
    createdAt: new Date(T0),
    expiresAt: new Date(T0 + DEFAULT_IDEMPOTENCY_TTL_MS),
    ...over,
  };
}

describe('IdempotencyService', () => {
  let store: IdempotencyStore;
  let service: IdempotencyService;
  let now: number;
  let runs: number;
  const exec = async () => {
    runs++;
    return { ...OK };
  };

  beforeEach(() => {
    store = mock<IdempotencyStore>();
    now = T0;
    runs = 0;
    service = new IdempotencyService(instance(store), DEFAULT_IDEMPOTENCY_TTL_MS, () => now);
    when(store.find(anything(), anything())).thenResolve(null);
    when(store.claim(anything())).thenResolve(true);
    when(store.complete(anything(), anything(), anything())).thenResolve();
    when(store.release(anything(), anything())).thenResolve();
    when(store.purgeExpired(anything())).thenResolve(0);
  });

  it('executes a first call once and stores key, user, route, body hash and response for 24 h', async () => {
    await expect(service.run(call, exec)).resolves.toEqual(OK);
    expect(runs).toBe(1);
    const [claimed] = capture(store.claim).last();
    expect(claimed).toEqual({
      key: 'k-1',
      userId: 'kasun',
      route: call.route,
      requestHash: requestHash(call.body),
      createdAt: new Date(T0),
      expiresAt: new Date(T0 + 24 * 3600_000),
    });
    verify(store.complete('kasun', 'k-1', deepEqual(OK))).once();
  });

  it('replays the stored response with Idempotent-Replay: true and does not execute again', async () => {
    when(store.find('kasun', 'k-1')).thenResolve(record());
    const res = await service.run(call, exec);
    expect(runs).toBe(0);
    expect(res).toEqual({ ...OK, headers: { 'OData-Version': '4.0', 'Idempotent-Replay': 'true' }, audit: { ...OK.audit, action: 'Trips.Release.Replay' } });
    verify(store.claim(anything())).never();
    verify(store.complete(anything(), anything(), anything())).never();
  });

  it('treats a body with the same content in another key order as the same request', async () => {
    when(store.find('kasun', 'k-1')).thenResolve(record({ requestHash: requestHash({ a: 1, b: { c: 2, d: [1, 2] } }) }));
    await expect(service.run({ ...call, body: { b: { d: [1, 2], c: 2 }, a: 1 } }, exec)).resolves.toMatchObject({ status: 200 });
    expect(runs).toBe(0);
  });

  it('422 IdempotencyKeyReused when the same key comes with another body or route', async () => {
    when(store.find('kasun', 'k-1')).thenResolve(record());
    await expect(service.run({ ...call, body: { sealNumber: 'KDY-2' } }, exec)).rejects.toMatchObject({ status: 422, code: 'IdempotencyKeyReused', target: 'Idempotency-Key' });
    await expect(service.run({ ...call, route: "POST /Trips('T2')/Lodestar.Release" }, exec)).rejects.toMatchObject({ status: 422 });
    expect(runs).toBe(0);
  });

  it('409 while the first request with the key is still running', async () => {
    when(store.find('kasun', 'k-1')).thenResolve(record({ status: 'PENDING', response: null }));
    await expect(service.run(call, exec)).rejects.toMatchObject({ status: 409, code: 'IdempotencyRequestInProgress' });
    expect(runs).toBe(0);
  });

  it('takes over a PENDING claim left behind by a crashed request', async () => {
    when(store.find('kasun', 'k-1')).thenResolve(record({ status: 'PENDING', response: null }));
    now = T0 + PENDING_TAKEOVER_MS + 1;
    await expect(service.run(call, exec)).resolves.toEqual(OK);
    expect(runs).toBe(1);
    verify(store.release('kasun', 'k-1')).once();
  });

  it('runs again once the record expired', async () => {
    when(store.find('kasun', 'k-1')).thenResolve(record());
    now = T0 + DEFAULT_IDEMPOTENCY_TTL_MS;
    await service.run(call, exec);
    expect(runs).toBe(1);
    verify(store.release('kasun', 'k-1')).once();
  });

  it('forgets the key when the write fails, so the retry executes', async () => {
    const boom = ODataError.conflict('The trip has no load record yet');
    await expect(service.run(call, async () => Promise.reject(boom))).rejects.toBe(boom);
    verify(store.release('kasun', 'k-1')).once();
    verify(store.complete(anything(), anything(), anything())).never();
  });

  it('replays the winner of a race between two parallel retries', async () => {
    when(store.claim(anything())).thenResolve(false);
    when(store.find('kasun', 'k-1')).thenResolve(null).thenResolve(record());
    await expect(service.run(call, exec)).resolves.toMatchObject({ headers: { 'Idempotent-Replay': 'true' } });
    expect(runs).toBe(0);
  });

  it('409 when the race winner vanished in between', async () => {
    when(store.claim(anything())).thenResolve(false);
    await expect(service.run(call, exec)).rejects.toMatchObject({ status: 409 });
  });

  it('purges expired records at most every 10 minutes', async () => {
    await service.run(call, exec);
    await service.run({ ...call, key: 'k-2' }, exec);
    verify(store.purgeExpired(anything())).once();
    now = T0 + 11 * 60_000;
    await service.run({ ...call, key: 'k-3' }, exec);
    verify(store.purgeExpired(anything())).twice();
  });

  it('validates the header value', () => {
    expect(IdempotencyService.keyFrom(undefined)).toBeUndefined();
    expect(IdempotencyService.keyFrom('  ')).toBeUndefined();
    expect(IdempotencyService.keyFrom(' 0b6e-41f2:abc_1.2 ')).toBe('0b6e-41f2:abc_1.2');
    expect(IdempotencyService.keyFrom(['first', 'second'])).toBe('first');
    expect(() => IdempotencyService.keyFrom('has space')).toThrow(expect.objectContaining({ status: 400, target: 'Idempotency-Key' }));
    expect(() => IdempotencyService.keyFrom('x'.repeat(129))).toThrow(expect.objectContaining({ status: 400 }));
  });
});

describe('idempotency helpers', () => {
  it('canonicalJson sorts keys, drops undefined and keeps arrays in order', () => {
    expect(canonicalJson({ b: 1, a: [2, 1], c: undefined, d: null })).toBe('{"a":[2,1],"b":1,"d":null}');
    expect(canonicalJson(new Date(0))).toBe('"1970-01-01T00:00:00.000Z"');
    expect(canonicalJson(undefined)).toBe('null');
    expect(requestHash(undefined)).toBe(requestHash({}));
  });

  it('replay marks the response and keeps a response without audit unaudited', () => {
    expect(replay({ status: 204, headers: {} })).toEqual({ status: 204, headers: { 'Idempotent-Replay': 'true' } });
  });

  it('TTL is IDEMPOTENCY_TTL_HOURS when above 24 h, else 24 h', () => {
    expect(idempotencyTtlMs({})).toBe(DEFAULT_IDEMPOTENCY_TTL_MS);
    expect(idempotencyTtlMs({ IDEMPOTENCY_TTL_HOURS: '1' })).toBe(DEFAULT_IDEMPOTENCY_TTL_MS);
    expect(idempotencyTtlMs({ IDEMPOTENCY_TTL_HOURS: 'x' })).toBe(DEFAULT_IDEMPOTENCY_TTL_MS);
    expect(idempotencyTtlMs({ IDEMPOTENCY_TTL_HOURS: '48' })).toBe(48 * 3600_000);
  });
});

describe('PrismaIdempotencyStore', () => {
  let delegate: IdempotencyDelegate;
  let store: PrismaIdempotencyStore;

  beforeEach(() => {
    delegate = mock<IdempotencyDelegate>();
    store = new PrismaIdempotencyStore(instance(delegate));
  });

  it('finds by the (userId, key) primary key', async () => {
    when(delegate.findUnique(anything())).thenResolve(null);
    await expect(store.find('u', 'k')).resolves.toBeNull();
    expect(capture(delegate.findUnique).last()[0]).toEqual({ where: { userId_key: { userId: 'u', key: 'k' } } });
  });

  it('claims with a PENDING insert and reports a unique clash as false', async () => {
    const rec = { key: 'k', userId: 'u', route: 'POST /Orders', requestHash: 'h', createdAt: new Date(T0), expiresAt: new Date(T0 + 1) };
    when(delegate.create(anything())).thenResolve({});
    await expect(store.claim(rec)).resolves.toBe(true);
    expect(capture(delegate.create).last()[0]).toEqual({ data: { ...rec, status: 'PENDING' } });

    when(delegate.create(anything())).thenReject(Object.assign(new Error('unique'), { code: 'P2002' }));
    await expect(store.claim(rec)).resolves.toBe(false);
    when(delegate.create(anything())).thenReject(new Error('db down'));
    await expect(store.claim(rec)).rejects.toThrow('db down');
  });

  it('completes, releases and purges', async () => {
    when(delegate.update(anything())).thenResolve({});
    when(delegate.deleteMany(anything())).thenResolve({ count: 3 });
    await store.complete('u', 'k', OK);
    expect(capture(delegate.update).last()[0]).toEqual({ where: { userId_key: { userId: 'u', key: 'k' } }, data: { status: 'DONE', response: OK } });
    await store.release('u', 'k');
    expect(capture(delegate.deleteMany).last()[0]).toEqual({ where: { userId: 'u', key: 'k' } });
    await expect(store.purgeExpired(new Date(T0))).resolves.toBe(3);
    expect(capture(delegate.deleteMany).last()[0]).toEqual({ where: { expiresAt: { lt: new Date(T0) } } });
  });
});

// ── through the engine ──────────────────────────────────────

@EntitySet({
  name: 'Orders',
  model: 'Order',
  read: ['store_manager', 'admin'],
  create: ['store_manager'],
  abac: { outlet: (o) => ({ outletId: o }) },
  insertable: ['id', 'outletId', 'units'],
  idempotentCreate: true,
})
class IdemOrdersSet extends ODataEntitySet {
  calls = 0;

  async create(data: Record<string, any>) {
    this.calls++;
    return { id: data.id };
  }

  @ODataAction({ name: 'Confirm', binding: 'entity', roles: ['store_manager'], params: { units: 'Edm.Int32' }, idempotent: true })
  async confirm() {
    this.calls++;
    return undefined;
  }

  @ODataAction({ name: 'Plain', binding: 'entity', roles: ['store_manager'] })
  async plain() {
    this.calls++;
    return undefined;
  }
}

/** A tiny in-memory store: the engine tests need state across calls. */
class MemoryStore implements IdempotencyStore {
  rows = new Map<string, IdempotencyRecord>();
  private id = (u: string, k: string) => `${u}|${k}`;
  async find(u: string, k: string) {
    return this.rows.get(this.id(u, k)) ?? null;
  }
  async claim(r: Omit<IdempotencyRecord, 'status' | 'response'>) {
    if (this.rows.has(this.id(r.userId, r.key))) return false;
    this.rows.set(this.id(r.userId, r.key), { ...r, status: 'PENDING', response: null });
    return true;
  }
  async complete(u: string, k: string, response: StoredResponse) {
    this.rows.set(this.id(u, k), { ...this.rows.get(this.id(u, k))!, status: 'DONE', response: JSON.parse(JSON.stringify(response)) });
  }
  async release(u: string, k: string) {
    this.rows.delete(this.id(u, k));
  }
  async purgeExpired() {
    return 0;
  }
}

describe('ODataEngine with Idempotency-Key', () => {
  const base = 'https://localhost:8443/odata/v4';
  let orders: ModelDelegate;
  let set: IdemOrdersSet;
  let store: MemoryStore;
  let engine: ODataEngine;

  const req = (over: Partial<ODataRequest>): ODataRequest => ({
    method: 'POST',
    path: '/Orders',
    query: '',
    headers: { 'idempotency-key': 'idem-1' },
    body: { id: 'ORD9', outletId: 'OUT106', units: 3 },
    principal: personas.fathima,
    baseUrl: base,
    ...over,
  });

  beforeEach(() => {
    orders = mock<ModelDelegate>();
    when(orders.findFirst(anything())).thenResolve({ id: 'ORD9', outletId: 'OUT106', units: 3, updatedAt: new Date(1) });
    set = new IdemOrdersSet({ order: instance(orders) });
    store = new MemoryStore();
    engine = new ODataEngine(new ODataRegistry('orders', testModel(), [set]), {}, undefined, new IdempotencyService(store));
  });

  it('POST: a retry gets the original 201 with Idempotent-Replay and creates nothing', async () => {
    const first = await engine.handle(req({}));
    expect(first.status).toBe(201);
    expect(first.headers['Idempotent-Replay']).toBeUndefined();
    const again = await engine.handle(req({}));
    expect(set.calls).toBe(1);
    expect(again).toMatchObject({ status: 201, headers: { 'Idempotent-Replay': 'true', Location: `${base}/Orders('ORD9')` } });
    expect(again.body).toEqual(JSON.parse(JSON.stringify(first.body)));
    expect(again.audit).toEqual({ action: 'Orders.Create.Replay', entitySet: 'Orders', entityKey: 'ORD9' });
  });

  it('POST: same key with another body is 422; another user with the same key is independent', async () => {
    await engine.handle(req({}));
    await expect(engine.handle(req({ body: { id: 'ORD9', outletId: 'OUT106', units: 4 } }))).rejects.toMatchObject({ status: 422, code: 'IdempotencyKeyReused' });
    await engine.handle(req({ principal: { ...personas.fathima, sub: 'other-store' } }));
    expect(set.calls).toBe(2);
  });

  it('bound action: replays a 204 and keeps keys per route', async () => {
    const path = "/Orders('ORD9')/Lodestar.Confirm";
    const first = await engine.handle(req({ path, body: { units: 3 } }));
    expect(first.status).toBe(204);
    const again = await engine.handle(req({ path, body: { units: 3 } }));
    expect(again).toMatchObject({ status: 204, headers: { 'Idempotent-Replay': 'true' }, audit: { action: 'Orders.Confirm.Replay' } });
    expect(set.calls).toBe(1);
    await expect(engine.handle(req({ path: "/Orders('ORD8')/Lodestar.Confirm", body: { units: 3 } }))).rejects.toMatchObject({ status: 422 });
  });

  it('ignores the header on writes that are not declared idempotent, and runs without it', async () => {
    const path = "/Orders('ORD9')/Lodestar.Plain";
    await engine.handle(req({ path, body: {} }));
    await engine.handle(req({ path, body: {} }));
    await engine.handle(req({ headers: {} }));
    await engine.handle(req({ headers: {} }));
    expect(set.calls).toBe(4);
    expect(store.rows.size).toBe(0);
  });

  it('re-checks RBAC before replaying', async () => {
    await engine.handle(req({}));
    await expect(engine.handle(req({ principal: { ...personas.fathima, roles: ['driver'] } }))).rejects.toMatchObject({ status: 403 });
  });

  it('does not store failed writes', async () => {
    when(orders.findFirst(anything())).thenResolve(null);
    const path = "/Orders('NOPE')/Lodestar.Confirm";
    await expect(engine.handle(req({ path, body: {} }))).rejects.toMatchObject({ status: 404 });
    expect(store.rows.size).toBe(0);
    resetCalls(orders);
  });

  it('400 on a malformed key', async () => {
    await expect(engine.handle(req({ headers: { 'idempotency-key': 'bad key!' } }))).rejects.toMatchObject({ status: 400 });
    expect(set.calls).toBe(0);
  });
});
