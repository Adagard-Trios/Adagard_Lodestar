/**
 * Boots every service's real AppModule (only Prisma is faked), signs real RS256
 * tokens against a local JWKS and drives the HTTP stack end to end with
 * supertest: zero-trust guard → OData controller → engine → error filter → audit.
 */
import { INestApplication, Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, JWTPayload, KeyLike, SignJWT } from 'jose';
import request from 'supertest';
import { PrismaService } from '@lodestar/prisma';
import { ENTITY_SET_OWNERS, ODataExceptionFilter } from '@lodestar/odata';
import { AUDIT_SINK, JwtVerifier } from '@lodestar/security';
import { AppModule as AuditApp } from './audit/src/app.module';
import { AppModule as AuthApp } from './auth/src/app.module';
import { AppModule as FleetApp } from './fleet/src/app.module';
import { AppModule as NotificationsApp } from './notifications/src/app.module';
import { AppModule as OrdersApp } from './orders/src/app.module';
import { AppModule as OutletsApp } from './outlets/src/app.module';
import { AppModule as PlanningApp } from './planning/src/app.module';
import { AppModule as SyncApp } from './sync/src/app.module';
import { AppModule as TripsApp } from './trips/src/app.module';

const ISSUER = 'https://localhost:8443/auth/realms/lodestar';

// Booting nine Nest applications takes a while on a cold cache.
jest.setTimeout(60_000);

/** A PrismaService stand-in: every model delegate answers "nothing found". */
function fakePrisma() {
  const delegates: Record<string, any> = {};
  const delegate = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    upsert: jest.fn(),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: {}, _count: {} }),
  });
  const base: Record<string, any> = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(proxy)),
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
  };
  const proxy: any = new Proxy(base, {
    get(target, key) {
      if (key in target) return target[key as string];
      if (typeof key === 'symbol' || key === 'then' || key.startsWith('on') || key === 'constructor') return undefined;
      return (delegates[key] ??= delegate());
    },
  });
  return proxy;
}

const SERVICES: { name: string; module: Type<unknown>; sets: string[] }[] = [
  { name: 'auth', module: AuthApp, sets: ['Users', 'Devices'] },
  { name: 'orders', module: OrdersApp, sets: ['Orders', 'OrderLineItems'] },
  { name: 'planning', module: PlanningApp, sets: ['Plans', 'Deferrals', 'AgentRuns'] },
  { name: 'fleet', module: FleetApp, sets: ['Vehicles'] },
  { name: 'outlets', module: OutletsApp, sets: ['Outlets', 'Calendar', 'DistrictTravel', 'ServiceAllowances', 'DataImports'] },
  { name: 'trips', module: TripsApp, sets: ['Trips', 'TripStops', 'PODs', 'LoadRecords'] },
  { name: 'sync', module: SyncApp, sets: ['OfflineEvents'] },
  { name: 'notifications', module: NotificationsApp, sets: ['Notifications'] },
  { name: 'audit', module: AuditApp, sets: ['AuditEntries'] },
];

let privateKey: KeyLike;
let jwks: ReturnType<typeof createLocalJWKSet>;

async function token(claims: JWTPayload & { roles?: string[] }) {
  const { roles = [], ...rest } = claims;
  return new SignJWT({ realm_access: { roles }, azp: 'lodestar-web', ...rest })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setSubject(String(rest.sub ?? 'user-1'))
    .setIssuer(ISSUER)
    .setAudience('lodestar-api')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

async function boot(module: Type<unknown>) {
  const prisma = fakePrisma();
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const moduleRef = await Test.createTestingModule({ imports: [module] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(AUDIT_SINK)
    .useValue(audit)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  app.useBodyParser('json', { limit: '2mb', type: ['application/json', 'application/*+json'] });
  app.useGlobalFilters(new ODataExceptionFilter());
  app.get(JwtVerifier).useKeySet(jwks);
  await app.init();
  return { app, prisma, audit };
}

beforeAll(async () => {
  process.env.OIDC_ISSUER = ISSUER;
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), kid: 'test', alg: 'RS256' }] });
});

describe.each(SERVICES)('$name service', ({ name, module, sets }) => {
  let app: INestApplication;
  let admin: string;

  beforeAll(async () => {
    ({ app } = await boot(module));
    admin = await token({ sub: 'admin', roles: ['admin'] });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves /health and /ready without a token', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', service: name });
    await request(app.getHttpServer()).get('/ready').expect(200, { status: 'ready', service: name });
  });

  it('rejects OData calls without a token in the OData error format', async () => {
    const res = await request(app.getHttpServer()).get('/odata/v4/$metadata').expect(401);
    expect(res.headers['www-authenticate']).toMatch(/^Bearer/);
    expect(res.headers['odata-version']).toBe('4.0');
    expect(res.body).toEqual({ error: { code: 'Unauthorized', message: 'Missing bearer token', target: null, details: [] } });
  });

  it('serves its service document and $metadata to a valid token', async () => {
    const doc = await request(app.getHttpServer()).get('/odata/v4/').set('Authorization', `Bearer ${admin}`).expect(200);
    // auth serves the merged document of the whole platform (no NGINX on AKS).
    const expected = name === 'auth' ? Object.keys(ENTITY_SET_OWNERS) : sets;
    expect(doc.body.value.filter((v: any) => v.kind === 'EntitySet').map((v: any) => v.name)).toEqual(expected);
    const xml = await request(app.getHttpServer()).get('/odata/v4/$metadata').set('Authorization', `Bearer ${admin}`).expect(200);
    for (const s of sets) expect(xml.text).toContain(`<EntitySet Name="${s}"`);
  });
});

describe('end-to-end behaviour (orders)', () => {
  let app: INestApplication;
  let prisma: any;
  let audit: { record: jest.Mock };

  beforeAll(async () => {
    ({ app, prisma, audit } = await boot(OrdersApp));
  });

  afterAll(async () => {
    await app?.close();
  });

  it('applies the store manager row filter from her token', async () => {
    const fathima = await token({ sub: 'fathima', roles: ['store_manager'], outlet_id: 'OUT106' });
    prisma.order.findMany.mockResolvedValueOnce([{ id: 'ORD0104217', units: 34, updatedAt: new Date(1) }]);
    const res = await request(app.getHttpServer())
      .get("/odata/v4/Orders?$select=units&$filter=runDate%20ge%202026-04-07")
      .set('Authorization', `Bearer ${fathima}`)
      .set('X-Forwarded-Proto', 'https')
      .set('X-Forwarded-Host', 'localhost')
      .set('X-Forwarded-Port', '8443')
      .expect(200);
    expect(prisma.order.findMany.mock.calls.at(-1)[0].where).toEqual({ AND: [{ runDate: { gte: new Date('2026-04-07T00:00:00Z') } }, { outletId: 'OUT106' }] });
    expect(res.body).toEqual({
      '@odata.context': 'https://localhost:8443/odata/v4/$metadata#Orders(units)',
      value: [{ '@odata.etag': 'W/"1"', id: 'ORD0104217', units: 34 }],
    });
    expect(res.headers['content-type']).toContain('odata.metadata=minimal');
  });

  it('refuses roles without access (403) and DELETE (405), and audits the denied write', async () => {
    const ruwan = await token({ sub: 'ruwan', roles: ['driver'], vehicle_id: 'VEH057' });
    const res = await request(app.getHttpServer()).post('/odata/v4/Orders').set('Authorization', `Bearer ${ruwan}`).send({ id: 'X' }).expect(403);
    expect(res.body.error.code).toBe('Forbidden');
    expect(audit.record).toHaveBeenLastCalledWith(expect.objectContaining({ actor: 'ruwan', outcome: 'DENIED' }));

    const admin = await token({ sub: 'admin', roles: ['admin'] });
    const del = await request(app.getHttpServer()).delete("/odata/v4/Orders('ORD1')").set('Authorization', `Bearer ${admin}`).expect(405);
    expect(del.body.error.message).toMatch(/never deleted/);
  });

  it('rejects non-JSON bodies (415) and malformed JSON (400)', async () => {
    const admin = await token({ sub: 'admin', roles: ['admin'] });
    await request(app.getHttpServer()).post('/odata/v4/Orders').set('Authorization', `Bearer ${admin}`).set('Content-Type', 'text/plain').send('x').expect(415);
    const bad = await request(app.getHttpServer())
      .post('/odata/v4/Orders')
      .set('Authorization', `Bearer ${admin}`)
      .set('Content-Type', 'application/json')
      .send('{bad')
      .expect(400);
    expect(bad.body.error.code).toBe('BadRequest');
  });

  it('records a successful action in the audit log before answering', async () => {
    const nilanthi = await token({ sub: 'nilanthi', roles: ['dispatcher'], depot: ['KANDY'] });
    prisma.order.findFirst.mockResolvedValueOnce({ id: 'ORD1', status: 'PLANNED', updatedAt: new Date(1) });
    prisma.order.findUnique.mockResolvedValueOnce({ id: 'ORD1', status: 'PLANNED', updatedAt: new Date(1) });
    prisma.order.update.mockResolvedValueOnce({ id: 'ORD1', status: 'LOADED', updatedAt: new Date(2) });
    const res = await request(app.getHttpServer())
      .post("/odata/v4/Orders('ORD1')/Lodestar.SetStatus")
      .set('Authorization', `Bearer ${nilanthi}`)
      .send({ status: 'LOADED' })
      .expect(200);
    expect(res.body).toMatchObject({ id: 'ORD1', status: 'LOADED', '@odata.etag': 'W/"2"' });
    expect(audit.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ actor: 'nilanthi', action: 'Orders.SetStatus', entitySet: 'Orders', entityKey: 'ORD1', outcome: 'SUCCESS' }),
    );
  });

  describe('field app (lodestar-field tokens)', () => {
    const fathimaField = () =>
      token({ sub: 'fathima', roles: ['store_manager'], outlet_id: 'OUT106', device_id: 'DEV-FR-01', azp: 'lodestar-field' } as any);
    const activeDevice = () => prisma.device.findUnique.mockResolvedValue({ id: 'DEV-FR-01', userId: 'fathima', status: 'ACTIVE' });

    afterEach(() => prisma.device.findUnique.mockResolvedValue(null));

    it('401 DeviceMismatch when X-Device-Id names another phone, 401 DeviceHeaderRequired without it', async () => {
      activeDevice();
      const tok = await fathimaField();
      const other = await request(app.getHttpServer()).get('/odata/v4/Orders').set('Authorization', `Bearer ${tok}`).set('X-Device-Id', 'DEV-1234ABCD').expect(401);
      expect(other.body.error).toMatchObject({ code: 'DeviceMismatch' });
      expect(other.headers['www-authenticate']).toMatch(/^Bearer/);
      const none = await request(app.getHttpServer()).get('/odata/v4/Orders').set('Authorization', `Bearer ${tok}`).expect(401);
      expect(none.body.error.code).toBe('DeviceHeaderRequired');
      await request(app.getHttpServer()).get('/odata/v4/Orders').set('Authorization', `Bearer ${tok}`).set('X-Device-Id', 'DEV-FR-01').expect(200);
    });

    it('ConfirmReceipt: records the count once; the retry with the same Idempotency-Key is replayed, a changed body is 422', async () => {
      activeDevice();
      const tok = await fathimaField();
      const rows = new Map<string, any>();
      const idem = prisma.ordersIdempotencyKey;
      idem.findUnique.mockImplementation(async (a: any) => rows.get(`${a.where.userId_key.userId}|${a.where.userId_key.key}`) ?? null);
      idem.create.mockImplementation(async (a: any) => void rows.set(`${a.data.userId}|${a.data.key}`, a.data));
      idem.update.mockImplementation(async (a: any) => {
        const id = `${a.where.userId_key.userId}|${a.where.userId_key.key}`;
        rows.set(id, { ...rows.get(id), ...JSON.parse(JSON.stringify(a.data)) });
      });

      const order = { id: 'ORD0104217', outletId: 'OUT106', status: 'DELIVERED', units: 34, updatedAt: new Date(1) };
      prisma.order.findFirst.mockResolvedValue(order);
      prisma.order.findUnique.mockResolvedValue({ ...order, unitsReceived: null, tripStop: { pod: { id: 'POD-ORD0104217', creditNoteId: 'CN-2604-0441', exceptions: [] } } });
      prisma.order.update.mockImplementation(async (a: any) => ({ ...order, ...a.data, updatedAt: new Date(2) }));
      prisma.pOD.update.mockResolvedValue({});
      const updatesBefore = prisma.order.update.mock.calls.length;

      const body = { unitsReceived: 31, unitsExpected: 34, note: null, savedAt: '2026-04-07T07:05:00+05:30' };
      const send = (b: object) =>
        request(app.getHttpServer())
          .post("/odata/v4/Orders('ORD0104217')/Lodestar.ConfirmReceipt")
          .set('Authorization', `Bearer ${tok}`)
          .set('X-Device-Id', 'DEV-FR-01')
          .set('Idempotency-Key', '6f1d2c3b-receipt')
          .send(b);

      const first = await send(body).expect(200);
      expect(first.headers['idempotent-replay']).toBeUndefined();
      expect(first.body).toMatchObject({ id: 'ORD0104217', status: 'DELIVERED', unitsReceived: 31, unitsExpected: 34, creditNoteId: 'CN-2604-0441', receivedBy: 'fathima' });
      expect(audit.record).toHaveBeenLastCalledWith(expect.objectContaining({ actor: 'fathima', client: 'lodestar-field', action: 'Orders.ConfirmReceipt', entityKey: 'ORD0104217' }));

      const again = await send(body).expect(200);
      expect(again.headers['idempotent-replay']).toBe('true');
      expect(again.body).toEqual(first.body);
      expect(prisma.order.update.mock.calls.length - updatesBefore).toBe(1);
      expect(audit.record).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'Orders.ConfirmReceipt.Replay' }));

      const changed = await send({ ...body, unitsReceived: 30 }).expect(422);
      expect(changed.body.error.code).toBe('IdempotencyKeyReused');
      expect(prisma.order.update.mock.calls.length - updatesBefore).toBe(1);

      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue(null);
      prisma.order.update.mockReset();
    });

    it('ConfirmReceipt is for store managers only', async () => {
      const nilanthi = await token({ sub: 'nilanthi', roles: ['dispatcher'], depot: ['KANDY'] });
      prisma.order.findFirst.mockResolvedValueOnce({ id: 'ORD1', outletId: 'OUT106', status: 'DELIVERED', updatedAt: new Date(1) });
      const res = await request(app.getHttpServer())
        .post("/odata/v4/Orders('ORD1')/Lodestar.ConfirmReceipt")
        .set('Authorization', `Bearer ${nilanthi}`)
        .send({ unitsReceived: 1, unitsExpected: 1, savedAt: '2026-04-07T07:05:00+05:30' })
        .expect(403);
      expect(res.body.error.code).toBe('Forbidden');
    });
  });

  it('rejects tokens for another audience or issuer', async () => {
    const wrongAud = await new SignJWT({ realm_access: { roles: ['admin'] } })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .setSubject('x')
      .setIssuer(ISSUER)
      .setAudience('lodestar-web')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    const res = await request(app.getHttpServer()).get('/odata/v4/Orders').set('Authorization', `Bearer ${wrongAud}`).expect(401);
    expect(res.body.error.message).toMatch(/aud/);
  });
});
