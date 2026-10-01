import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { personas } from '../../../libs/security/test/principals';
import { AuditChainService } from './audit-chain.service';
import { AuditEntriesSet } from './audit-entries.set';
import { canonicalJson, ChainedEntry, ChainVerifier, computeHash, GENESIS_HASH } from './hash-chain';
import { LocalAuditSink } from './local-audit.sink';

/** Builds a valid chain of n entries. */
function chain(n: number): ChainedEntry[] {
  const out: ChainedEntry[] = [];
  let prev = GENESIS_HASH;
  for (let i = 1; i <= n; i++) {
    const fields = {
      seq: i,
      at: new Date(Date.UTC(2026, 3, 7, 0, i)),
      actor: 'nilanthi',
      actorRoles: ['dispatcher'],
      client: 'lodestar-web',
      service: 'planning',
      action: i % 2 ? 'Plans.Approve' : 'Deferrals.Confirm',
      entitySet: 'Plans',
      entityKey: `PLG-2026-04-07-v${i}`,
      outcome: 'SUCCESS',
      payload: { b: 2, a: [1, { y: 1, x: 0 }] },
    };
    const hash = computeHash(prev, fields);
    out.push({ ...fields, prevHash: prev, hash });
    prev = hash;
  }
  return out;
}

describe('canonicalJson', () => {
  it('sorts keys recursively and is whitespace-free', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { f: 1, e: 2 }], c: null } })).toBe('{"a":{"c":null,"d":[3,{"e":2,"f":1}]},"b":1}');
  });

  it('is stable across key order (as after a jsonb round trip)', () => {
    expect(canonicalJson({ x: 1, y: { p: 1, q: 2 } })).toBe(canonicalJson({ y: { q: 2, p: 1 }, x: 1 }));
  });

  it('normalises dates, bigint, undefined and non-finite numbers', () => {
    expect(canonicalJson({ at: new Date(0), n: BigInt(5), u: undefined, inf: Infinity, list: [undefined] })).toBe(
      '{"at":"1970-01-01T00:00:00.000Z","inf":null,"list":[null],"n":"5"}',
    );
    expect(canonicalJson(undefined)).toBe('null');
    expect(canonicalJson('a"b')).toBe('"a\\"b"');
  });
});

describe('computeHash', () => {
  it('is sha256(prevHash + canonical JSON of the entry)', () => {
    const [e] = chain(1);
    const expected = createHash('sha256')
      .update(
        GENESIS_HASH +
          canonicalJson({
            seq: 1, at: e.at.toISOString(), actor: e.actor, actorRoles: e.actorRoles, client: e.client, service: e.service,
            action: e.action, entitySet: e.entitySet, entityKey: e.entityKey, outcome: e.outcome, payload: e.payload,
          }),
      )
      .digest('hex');
    expect(e.hash).toBe(expected);
  });

  it('changes when anything changes', () => {
    const [e] = chain(1);
    expect(computeHash(GENESIS_HASH, { ...e, actor: 'mallory' })).not.toBe(e.hash);
    expect(computeHash('f'.repeat(64), e)).not.toBe(e.hash);
  });
});

describe('ChainVerifier', () => {
  it('accepts an intact chain across batches', () => {
    const entries = chain(5);
    const v = new ChainVerifier();
    expect(v.push(entries.slice(0, 2))).toBe(true);
    expect(v.push(entries.slice(2))).toBe(true);
    expect(v.result()).toEqual({ valid: true, checked: 5, headSeq: 5, headHash: entries[4].hash, firstInvalidSeq: null, reason: null });
  });

  it('reports an empty chain as valid', () => {
    expect(new ChainVerifier().result()).toEqual({ valid: true, checked: 0, headSeq: null, headHash: null, firstInvalidSeq: null, reason: null });
  });

  it('detects edited content', () => {
    const entries = chain(4);
    entries[2] = { ...entries[2], payload: { tampered: true } };
    const v = new ChainVerifier();
    expect(v.push(entries)).toBe(false);
    expect(v.result()).toMatchObject({ valid: false, firstInvalidSeq: 3, reason: 'Entry content does not match its hash' });
  });

  it('detects a deleted entry (sequence gap)', () => {
    const entries = chain(4);
    entries.splice(1, 1);
    const v = new ChainVerifier();
    v.push(entries);
    expect(v.result()).toMatchObject({ valid: false, firstInvalidSeq: 3, reason: 'Sequence gap after 1' });
  });

  it('detects a re-hashed forgery that breaks the link', () => {
    const entries = chain(3);
    const forged = { ...entries[1], actor: 'mallory' };
    forged.hash = computeHash(forged.prevHash, forged); // attacker recomputes this entry's hash…
    entries[1] = forged;
    const v = new ChainVerifier();
    v.push(entries);
    expect(v.result()).toMatchObject({ valid: false, firstInvalidSeq: 3, reason: 'prevHash does not match the previous entry' }); // …but the next link breaks
    expect(v.push(chain(1))).toBe(false);
  });
});

describe('AuditChainService', () => {
  interface AuditDelegate {
    findFirst(a: any): Promise<any>;
    findMany(a: any): Promise<any[]>;
    create(a: any): Promise<any>;
  }
  let audit: AuditDelegate;
  let queryRaw: jest.Mock;
  let service: AuditChainService;

  beforeEach(() => {
    audit = mock<AuditDelegate>();
    queryRaw = jest.fn().mockResolvedValue([]);
    const tx = { auditEntry: instance(audit), $executeRaw: queryRaw };
    const prisma = { ...tx, $transaction: (cb: (t: typeof tx) => Promise<unknown>) => cb(tx) };
    service = new AuditChainService(prisma as any);
    // Like the database: DbNull comes back as null.
    when(audit.create(anything())).thenCall((a) => Promise.resolve({ ...a.data, payload: a.data.payload === Prisma.DbNull ? null : a.data.payload }));
  });

  it('appends the first entry after the genesis hash, under the advisory lock', async () => {
    when(audit.findFirst(anything())).thenResolve(null);
    const e = await service.append({ at: '2026-04-07T00:01:00Z', actor: 'nilanthi', actorRoles: ['dispatcher'], action: 'Plans.Approve', outcome: 'SUCCESS' }, 'planning');
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(e).toMatchObject({ seq: 1, prevHash: GENESIS_HASH, service: 'planning', client: '', entitySet: null, payload: null });
    expect(e.hash).toBe(computeHash(GENESIS_HASH, e));
  });

  it('links each entry to the previous hash', async () => {
    when(audit.findFirst(anything())).thenResolve({ seq: 41, hash: 'a'.repeat(64) });
    const e = await service.append({ at: '2026-04-07T00:02:00Z', actor: 'x', actorRoles: [], action: 'Orders.Create', outcome: 'SUCCESS', entitySet: 'Orders', entityKey: 'ORD1' }, 'orders');
    expect(e).toMatchObject({ seq: 42, prevHash: 'a'.repeat(64), entityKey: 'ORD1' });
    const [args] = capture(audit.create).last();
    expect(args.data.hash).toBe(computeHash('a'.repeat(64), { ...args.data, payload: null }));
  });

  it('verifies the stored chain in batches', async () => {
    const entries = chain(3);
    when(audit.findMany(anything())).thenResolve(entries).thenResolve([]);
    await expect(service.verify()).resolves.toMatchObject({ valid: true, checked: 3, headSeq: 3 });

    const big = chain(1001);
    when(audit.findMany(anything())).thenResolve(big.slice(0, 1000)).thenResolve(big.slice(1000)).thenResolve([]);
    await expect(service.verify()).resolves.toMatchObject({ valid: true, checked: 1001 });
    expect(capture(audit.findMany).last()[0]).toMatchObject({ where: { seq: { gt: 1000 } }, orderBy: { seq: 'asc' } });

    const bad = chain(2);
    bad[0] = { ...bad[0], actor: 'mallory' };
    when(audit.findMany(anything())).thenResolve(bad);
    await expect(service.verify()).resolves.toMatchObject({ valid: false, firstInvalidSeq: 1 });
  });
});

describe('AuditEntriesSet', () => {
  let chainService: AuditChainService;
  let set: AuditEntriesSet;

  beforeEach(() => {
    chainService = mock(AuditChainService);
    set = new AuditEntriesSet({} as any, instance(chainService));
  });

  it('validates incoming events', async () => {
    await expect(set.beforeCreate({ actor: 'a' })).rejects.toThrow(/actor and action are required/);
    await expect(set.beforeCreate({ actor: 'a', action: 'x', outcome: 'MAYBE' })).rejects.toThrow(/outcome must be one of/);
    await expect(set.beforeCreate({ actor: 'a', action: 'x' })).resolves.toEqual({ actor: 'a', action: 'x' });
  });

  it('takes the reporting service from the token, never from the body', async () => {
    when(chainService.append(anything(), anything())).thenResolve({ seq: 1 } as any);
    const svcOrders = { ...personas.agent, clientId: 'svc-orders' };
    await set.create({ actor: 'fathima', action: 'Orders.Create', at: new Date('2026-04-07T00:00:00Z'), service: 'forged' }, { principal: svcOrders, headers: {} });
    const [event, service] = capture(chainService.append).last();
    expect(service).toBe('orders');
    expect(event).toMatchObject({ actor: 'fathima', action: 'Orders.Create', at: '2026-04-07T00:00:00.000Z', outcome: 'SUCCESS', actorRoles: [] });

    await set.create({ actor: 'x', action: 'y' }, { principal: { ...personas.admin, clientId: undefined }, headers: {} });
    expect(capture(chainService.append).last()[1]).toBe('unknown');
  });

  it('exposes VerifyChain', async () => {
    when(chainService.verify()).thenResolve({ valid: true } as any);
    await expect(set.verifyChain()).resolves.toEqual({ valid: true });
  });
});

describe('LocalAuditSink', () => {
  it('records the audit service’s own writes but not AuditEntries creation itself', async () => {
    const chainService = mock(AuditChainService);
    when(chainService.append(anything(), anything())).thenResolve({} as any);
    const sink = new LocalAuditSink(instance(chainService));
    await sink.record({ at: 'x', actor: 'svc', actorRoles: [], action: 'AuditEntries.Create', entitySet: 'AuditEntries', outcome: 'SUCCESS' });
    verify(chainService.append(anything(), anything())).never();
    await sink.record({ at: 'x', actor: 'mallory', actorRoles: [], action: 'POST /odata/v4/AuditEntries', outcome: 'DENIED' });
    verify(chainService.append(anything(), 'audit')).once();
  });

  it('never throws', async () => {
    const chainService = mock(AuditChainService);
    when(chainService.append(anything(), anything())).thenReject(new Error('db down'));
    const sink = new LocalAuditSink(instance(chainService));
    (sink as any).logger = { error: jest.fn() };
    await expect(sink.record({ at: 'x', actor: 'a', actorRoles: [], action: 'x', outcome: 'FAILED' })).resolves.toBeUndefined();
  });
});
