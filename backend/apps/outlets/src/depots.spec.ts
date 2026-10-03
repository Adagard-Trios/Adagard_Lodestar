import { Prisma } from '@prisma/client';
import { buildEdmModel, DmmfDatamodel, ODataEngine, ODataRegistry, ODataRequest } from '@lodestar/odata';
import { personas, principal } from '../../../libs/security/test/principals';
import { DepotsSet } from './outlets.sets';

/** An in-memory outlets.Depot plus the counts the deactivation check reads. */
function fakeDb(rows: any[] = [], inUse = { outlets: 0, vehicles: 0 }) {
  const at = new Date(1_700_000_000_000);
  const match = (r: any, where: any = {}): boolean =>
    Object.entries(where).every(([k, v]: [string, any]) =>
      k === 'AND' ? v.every((w: any) => match(r, w)) : v && typeof v === 'object' && !(v instanceof Date) ? false : r[k] instanceof Date ? +r[k] === +v : r[k] === v);
  const depot = {
    rows,
    findMany: jest.fn(async ({ where }: any = {}) => rows.filter((r) => match(r, where))),
    findFirst: jest.fn(async ({ where }: any = {}) => rows.find((r) => match(r, where)) ?? null),
    findUnique: jest.fn(async ({ where }: any) => rows.find((r) => r.code === where.code) ?? null),
    count: jest.fn(async ({ where }: any = {}) => rows.filter((r) => match(r, where)).length),
    create: jest.fn(async ({ data }: any) => {
      const row = { address: null, lat: null, lng: null, phone: null, isActive: true, createdAt: at, updatedAt: at, ...data };
      rows.push(row);
      return row;
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const hit = rows.filter((r) => match(r, where));
      hit.forEach((r) => Object.assign(r, data, { updatedAt: new Date(+r.updatedAt + 1000) }));
      return { count: hit.length };
    }),
  };
  return {
    depot,
    outlet: { count: jest.fn(async () => inUse.outlets) },
    vehicle: { count: jest.fn(async () => inUse.vehicles) },
  };
}

const seed = () => [
  { code: 'PELIYAGODA', name: 'Peliyagoda DC', address: null, district: 'Gampaha', lat: null, lng: null, phone: null, isActive: true, createdAt: new Date(0), updatedAt: new Date(1_700_000_000_000) },
  { code: 'KANDY', name: 'Kandy Hub', address: null, district: 'Kandy', lat: null, lng: null, phone: null, isActive: true, createdAt: new Date(0), updatedAt: new Date(1_700_000_000_000) },
  { code: 'OLDTOWN', name: 'Old Town', address: null, district: 'Matale', lat: null, lng: null, phone: null, isActive: false, createdAt: new Date(0), updatedAt: new Date(1_700_000_000_000) },
];

describe('Depots (ADM-21)', () => {
  const model = buildEdmModel(Prisma.dmmf.datamodel as unknown as DmmfDatamodel);
  let db: ReturnType<typeof fakeDb>;
  let engine: ODataEngine;
  const base = 'https://localhost:8443/odata/v4';
  const req = (over: Partial<ODataRequest>): ODataRequest => ({ method: 'GET', path: '/Depots', query: '', headers: {}, principal: personas.admin, baseUrl: base, ...over });
  const galle = { code: 'galle', name: ' Galle DC ', district: 'Galle', address: 'Wakwella Rd, Galle', phone: '+94 91 222 3344', lat: 6.05, lng: 80.22 };

  const build = (inUse?: { outlets: number; vehicles: number }) => {
    db = fakeDb(seed(), inUse);
    engine = new ODataEngine(new ODataRegistry('outlets', model, [new DepotsSet(db as any)]));
  };
  beforeEach(() => build());

  describe('read', () => {
    it.each([
      ['dispatcher', personas.nilanthi],
      ['store manager', personas.fathima],
      ['loader', personas.kasun],
      ['driver', personas.ruwan],
    ])('a %s reads every active depot, whatever the token depots', async (_r, principal) => {
      const res = await engine.handle(req({ principal }));
      expect(res.status).toBe(200);
      expect((res.body as any).value.map((d: any) => d.code).sort()).toEqual(['KANDY', 'PELIYAGODA']);
    });

    it('an admin also sees deactivated depots', async () => {
      const res = await engine.handle(req({}));
      expect((res.body as any).value.map((d: any) => d.code)).toContain('OLDTOWN');
    });

    it('a service identity reads them too', async () => {
      const res = await engine.handle(req({ principal: principal({ sub: 'svc-planning', roles: ['svc'], scopes: ['outlets.read'] }) }));
      expect(res.status).toBe(200);
    });
  });

  describe('create', () => {
    it('lets an admin register a depot: code upper-cased, text trimmed, audited', async () => {
      const res = await engine.handle(req({ method: 'POST', body: galle }));
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ code: 'GALLE', name: 'Galle DC', district: 'Galle', isActive: true });
      expect(res.audit).toEqual({ action: 'Depots.Create', entitySet: 'Depots', entityKey: 'GALLE' });
    });

    it.each([['dispatcher', personas.nilanthi], ['store manager', personas.fathima], ['driver', personas.ruwan]])(
      'refuses a %s (403)',
      async (_r, principal) => {
        await expect(engine.handle(req({ method: 'POST', body: galle, principal }))).rejects.toMatchObject({ status: 403 });
        expect(db.depot.create).not.toHaveBeenCalled();
      },
    );

    it('refuses a code already registered (409)', async () => {
      await expect(engine.handle(req({ method: 'POST', body: { ...galle, code: 'kandy' } }))).rejects.toMatchObject({ status: 409, target: 'code' });
    });

    it.each([
      [{ code: '1X' }, 'code'],
      [{ code: 'GAL LE' }, 'code'],
      [{ name: '  ' }, 'name'],
      [{ district: '' }, 'district'],
      [{ lat: 91 }, 'lat'],
      [{ lng: -181 }, 'lng'],
      [{ phone: 'call me' }, 'phone'],
    ])('validates %p (400 on %s)', async (bad, target) => {
      await expect(engine.handle(req({ method: 'POST', body: { ...galle, ...bad } }))).rejects.toMatchObject({ status: 400, target });
    });
  });

  describe('update and deactivate', () => {
    const etag = 'W/"1700000000000"';
    const patch = (body: any, principal = personas.admin) =>
      engine.handle(req({ method: 'PATCH', path: "/Depots('KANDY')", body, principal, headers: { 'if-match': etag } }));

    it('lets an admin rename a depot (audited); the code never changes', async () => {
      const res = await patch({ name: 'Kandy Central Hub' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ code: 'KANDY', name: 'Kandy Central Hub' });
      expect(res.audit).toMatchObject({ action: 'Depots.Update', entityKey: 'KANDY' });
    });

    it('never changes a code', async () => {
      await expect(patch({ code: 'KANDY2' })).rejects.toMatchObject({ status: 400 });
    });

    it('refuses a dispatcher (403)', async () => {
      await expect(patch({ name: 'X' }, personas.nilanthi)).rejects.toMatchObject({ status: 403 });
    });

    it('deactivates a depot nothing depends on', async () => {
      const res = await patch({ isActive: false });
      expect(res.body).toMatchObject({ code: 'KANDY', isActive: false });
    });

    it('refuses to deactivate a depot that still has active outlets or vehicles (422)', async () => {
      build({ outlets: 3, vehicles: 1 });
      await expect(patch({ isActive: false })).rejects.toMatchObject({ status: 422, code: 'DepotInUse' });
    });
  });
});
