import { ArgumentsHost, ForbiddenException, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { testModel } from '../test/fixtures';
import { generateCsdl } from './edm/csdl';
import { buildEdmModel, DmmfDatamodel, edmTypeName, etagProperty } from './edm/model';
import { ODataError } from './errors';
import { etagMatches, makeEtag } from './etag';
import { parseFilter } from './filter/parser';
import { FilterTranslator } from './filter/translator';
import { formatKey, keyText, parseKeyPredicate } from './keys';
import { ODataExceptionFilter, toODataError } from './odata-exception.filter';
import { serviceRoot } from './odata.controller';
import { coerceEntityBody, coerceParams, parseFunctionArgs } from './params';
import { parseResourcePath, unqualified } from './path';
import { ODataRegistry } from './registry';
import { callerAuthorization, currentRequest, runWithRequestContext } from './request-context';
import { projectEntity } from './serialize';
import { EntitySet, ODataEntitySet, ODataFunction } from './entity-set';
import { personas } from '../../security/test/principals';

const model = testModel();
const T = (name: string) => model.entityTypes.get(name)!;

describe('ETags', () => {
  it('derives weak ETags', () => {
    expect(makeEtag(new Date(42))).toBe('W/"42"');
    expect(makeEtag(BigInt(7))).toBe('W/"7"');
    expect(makeEtag('x')).toBe('W/"x"');
    expect(makeEtag(null)).toBeUndefined();
  });

  it('matches If-Match lists, * and weak/strong forms', () => {
    expect(etagMatches('W/"42"', 'W/"42"')).toBe(true);
    expect(etagMatches('"42"', 'W/"42"')).toBe(true);
    expect(etagMatches('W/"1", W/"42"', 'W/"42"')).toBe(true);
    expect(etagMatches('W/"1"', 'W/"42"')).toBe(false);
    expect(etagMatches('*', 'W/"42"')).toBe(true);
    expect(etagMatches('*', undefined)).toBe(false);
    expect(etagMatches('W/"1"', undefined)).toBe(false);
  });
});

describe('keys', () => {
  it('parses single, numeric, date and composite keys', () => {
    expect(parseKeyPredicate("'ORD1'", T('Order'), model)).toEqual({ id: 'ORD1' });
    expect(parseKeyPredicate('42', T('AuditEntry'), model)).toEqual({ seq: 42 });
    expect(parseKeyPredicate('2026-04-07', T('Calendar'), model)).toEqual({ date: new Date('2026-04-07T00:00:00Z') });
    expect(parseKeyPredicate("id='ORD1'", T('Order'), model)).toEqual({ id: 'ORD1' });
    expect(parseKeyPredicate("dockType='REAR_DOCK', brand='FRESH'", T('ServiceAllowance'), model)).toEqual({ brand: 'FRESH', dockType: 'REAR_DOCK' });
  });

  it('rejects bad keys', () => {
    expect(() => parseKeyPredicate('null', T('Order'), model)).toThrow(/cannot be null/);
    expect(() => parseKeyPredicate("id='a',id='b'", T('Order'), model)).toThrow(/given twice/);
    expect(() => parseKeyPredicate('a eq 1', T('Order'), model)).toThrow(/Invalid key value/);
    expect(() => parseKeyPredicate('  ', T('Order'), model)).toThrow(/Missing key/);
  });

  it('formats canonical keys', () => {
    expect(formatKey(T('Order'), { id: "O'1" })).toBe("('O''1')");
    expect(formatKey(T('AuditEntry'), { seq: 3 })).toBe('(3)');
    expect(formatKey(T('Calendar'), { date: new Date('2026-04-07T00:00:00Z') })).toBe('(2026-04-07)');
    expect(formatKey(T('Calendar'), { date: new Date('2026-04-07T05:00:00Z') })).toBe('(2026-04-07T05:00:00.000Z)');
    expect(formatKey(T('ServiceAllowance'), { brand: 'FRESH', dockType: 'STREET' })).toBe("(brand='FRESH',dockType='STREET')");
    expect(keyText(T('ServiceAllowance'), { brand: 'FRESH', dockType: 'STREET' })).toBe('brand=FRESH,dockType=STREET');
    expect(keyText(T('Calendar'), { date: new Date('2026-04-07T00:00:00Z') })).toBe('2026-04-07');
  });
});

describe('resource paths', () => {
  it('splits segments outside quotes and parentheses', () => {
    expect(parseResourcePath("/Orders('a/b')/Lodestar.Approve")).toEqual([{ name: 'Orders', args: "'a/b'" }, { name: 'Lodestar.Approve' }]);
    expect(parseResourcePath('/DistrictTravel(%27Nuwara%20Eliya%27)')).toEqual([{ name: 'DistrictTravel', args: "'Nuwara Eliya'" }]);
    expect(parseResourcePath('/Orders/Lodestar.Summary(runDate=2026-04-07)')[1]).toEqual({ name: 'Lodestar.Summary', args: 'runDate=2026-04-07' });
    expect(parseResourcePath('')).toEqual([]);
    expect(parseResourcePath('///')).toEqual([]);
  });

  it('rejects malformed paths', () => {
    expect(() => parseResourcePath('/Orders(%E0%A4%A')).toThrow(/Malformed/);
    expect(() => parseResourcePath("/Orders('a)")).toThrow(/Unbalanced/);
  });

  it('strips the namespace', () => {
    expect(unqualified('Lodestar.Approve', 'Lodestar')).toBe('Approve');
    expect(unqualified('Approve', 'Lodestar')).toBe('Approve');
  });
});

describe('parameters and bodies', () => {
  it('parses function arguments with aliases', () => {
    expect(parseFunctionArgs("a=1,b='x',c=@c,d=2026-04-07", { '@c': 'true' })).toEqual({ a: 1, b: 'x', c: true, d: '2026-04-07' });
    expect(parseFunctionArgs(undefined, {})).toEqual({});
    expect(() => parseFunctionArgs('a', {})).toThrow(/name=value/);
    expect(() => parseFunctionArgs('a=b', {})).toThrow(/must be a literal/);
  });

  it('coerces parameters by EDM type', () => {
    const specs = {
      s: 'Edm.String',
      i: 'Edm.Int32',
      d: 'Edm.Double',
      b: 'Edm.Boolean',
      day: 'Edm.Date',
      at: 'Edm.DateTimeOffset',
      depot: 'Lodestar.Depot',
      list: 'Collection(Edm.Int32)',
      any: 'Edm.Untyped',
      obj: 'Lodestar.Something',
      need: { type: 'Edm.String', required: true },
    };
    const out = coerceParams(
      { s: 'a', i: 2, d: 2.5, b: false, day: '2026-04-07', at: '2026-04-07T01:00:00Z', depot: 'kandy', list: [1, 2], any: { x: 1 }, obj: { y: 1 }, need: 'n', '@x': 1 },
      specs,
      model,
    );
    expect(out).toEqual({
      s: 'a', i: 2, d: 2.5, b: false, day: '2026-04-07', at: new Date('2026-04-07T01:00:00Z'), depot: 'KANDY', list: [1, 2], any: { x: 1 }, obj: { y: 1 }, need: 'n',
    });
  });

  it.each([
    [{ need: 'n', i: 1.5 }, /must be Edm.Int32/],
    [{ need: 'n', d: '1' }, /must be Edm.Double/],
    [{ need: 'n', b: 'true' }, /must be Edm.Boolean/],
    [{ need: 'n', day: '07/04/2026' }, /must be Edm.Date/],
    [{ need: 'n', at: 5 }, /must be Edm.DateTimeOffset/],
    [{ need: 'n', depot: 'MARS' }, /must be one of/],
    [{ need: 'n', list: 1 }, /must be Collection/],
    [{ need: 'n', list: ['a'] }, /list\[0\]/],
    [{ need: 'n', obj: 'x' }, /must be Lodestar.Something/],
    [{}, /'need' is required/],
  ])('rejects %p', (raw, msg) => {
    const specs = {
      i: 'Edm.Int32', d: 'Edm.Double', b: 'Edm.Boolean', day: 'Edm.Date', at: 'Edm.DateTimeOffset', depot: 'Lodestar.Depot',
      list: 'Collection(Edm.Int32)', obj: 'Lodestar.Something', need: { type: 'Edm.String', required: true },
    };
    expect(() => coerceParams(raw, specs, model)).toThrow(msg);
  });

  it('coerces entity bodies', () => {
    const allowed = ['id', 'units', 'kg', 'deferredYesterday', 'runDate', 'notes', 'status', 'lineItems'];
    expect(
      coerceEntityBody(
        { id: 'A', units: 1, kg: 1.5, deferredYesterday: true, runDate: '2026-04-07T01:00:00Z', notes: null, status: 'planned', lineItems: [{}], '@odata.etag': 'x' },
        T('Order'),
        allowed,
        model,
      ),
    ).toEqual({ id: 'A', units: 1, kg: 1.5, deferredYesterday: true, runDate: new Date('2026-04-07T01:00:00Z'), notes: null, status: 'PLANNED', lineItems: [{}] });
    expect(coerceEntityBody({ roles: ['a'] }, T('AuditEntry'), ['roles'], model)).toEqual({ roles: ['a'] });
    expect(() => coerceEntityBody({ roles: 'a' }, T('AuditEntry'), ['roles'], model)).toThrow(/wrong type/);
    expect(() => coerceEntityBody({ id: null }, T('Order'), ['id'], model)).toThrow(/cannot be null/);
    expect(() => coerceEntityBody({ id: 1 }, T('Order'), ['id'], model)).toThrow(/wrong type/);
    expect(() => coerceEntityBody({ kg: '1' }, T('Order'), ['kg'], model)).toThrow(/wrong type/);
    expect(() => coerceEntityBody({ deferredYesterday: 1 }, T('Order'), ['deferredYesterday'], model)).toThrow(/wrong type/);
    expect(() => coerceEntityBody({ runDate: 5 }, T('Order'), ['runDate'], model)).toThrow(/wrong type/);
    expect(() => coerceEntityBody({ nope: 1 }, T('Order'), ['nope'], model)).toThrow(/does not exist/);
    expect(() => coerceEntityBody('x', T('Order'), [], model)).toThrow(/JSON object/);
  });
});

describe('EDM model and CSDL', () => {
  it('maps Prisma types to EDM types', () => {
    const p = (type: string, kind = 'scalar', isList = false) => ({ name: 'x', kind: kind as any, type, isList, isRequired: true, isId: false, hasDefault: false, isUpdatedAt: false });
    expect(edmTypeName(p('String'))).toBe('Edm.String');
    expect(edmTypeName(p('Int'))).toBe('Edm.Int32');
    expect(edmTypeName(p('BigInt'))).toBe('Edm.Int64');
    expect(edmTypeName(p('Float'))).toBe('Edm.Double');
    expect(edmTypeName(p('Decimal'))).toBe('Edm.Decimal');
    expect(edmTypeName(p('Boolean'))).toBe('Edm.Boolean');
    expect(edmTypeName(p('DateTime'))).toBe('Edm.DateTimeOffset');
    expect(edmTypeName(p('Bytes'))).toBe('Edm.Binary');
    expect(edmTypeName(p('Json'))).toBe('Edm.Untyped');
    expect(edmTypeName(p('Depot', 'enum'))).toBe('Lodestar.Depot');
    expect(edmTypeName(p('Order', 'object', true))).toBe('Collection(Lodestar.Order)');
    expect(etagProperty(T('Order'))).toBe('updatedAt');
    expect(etagProperty(T('Outlet'))).toBeUndefined();
  });

  it('builds the model from the real Prisma DMMF with composite keys', () => {
    const real = buildEdmModel(Prisma.dmmf.datamodel as unknown as DmmfDatamodel);
    expect(real.entityTypes.get('ServiceAllowance')!.keys).toEqual(['brand', 'dockType']);
    expect(real.entityTypes.get('AuditEntry')!.keys).toEqual(['seq']);
    expect(real.enums.has('Depot')).toBe(false); // depots are rows of outlets.Depot (ADM-21), keyed by code
    expect(real.entityTypes.get('Depot')!.keys).toEqual(['code']);
    expect(etagProperty(real.entityTypes.get('Vehicle')!)).toBe('updatedAt');
  });

  it('generates bindings, escapes and nullable facets', () => {
    const xml = generateCsdl(model, {
      entitySets: [{ name: 'Orders', entityType: 'Order' }, { name: 'Outlets', entityType: 'Outlet' }],
      operations: [{ name: 'Approve', kind: 'action', binding: 'entity', bindingType: 'Order', params: { note: { type: 'Edm.String' } }, returns: 'Lodestar.Order' }],
      isHidden: (t, p) => t === 'User' && p === 'passwordHash',
    });
    expect(xml).toContain('<NavigationPropertyBinding Path="outlet" Target="Outlets"/>');
    expect(xml).toContain('<Property Name="notes" Type="Edm.String"/>');
    expect(xml).toContain('<Property Name="units" Type="Edm.Int32" Nullable="false"/>');
    expect(xml).toContain('<Parameter Name="bindingParameter" Type="Lodestar.Order" Nullable="false"/>');
    expect(xml).toContain('<Member Name="KANDY" Value="1"/>');
    expect(xml).not.toContain('passwordHash');
  });
});

describe('the agent service filters against the real schema', () => {
  // These are the exact $filter shapes backend/apps/agent sends (tools.py).
  const real = buildEdmModel(Prisma.dmmf.datamodel as unknown as DmmfDatamodel);
  const t = new FilterTranslator(real);
  const where = (type: string, f: string) => t.translate(parseFilter(f), real.entityTypes.get(type)!);

  it('Orders: date-time range and in', () => {
    expect(where('Order', "runDate ge 2026-04-07T00:00:00Z and runDate lt 2026-04-08T00:00:00Z and status in ('RECEIVED','PLANNED')")).toEqual({
      AND: [
        { runDate: { gte: new Date('2026-04-07T00:00:00Z') } },
        { runDate: { lt: new Date('2026-04-08T00:00:00Z') } },
        { status: { in: ['RECEIVED', 'PLANNED'] } },
      ],
    });
  });

  it('Outlets: enum and boolean eq true', () => {
    expect(where('Outlet', "depot eq 'KANDY' and isActive eq true")).toEqual({ AND: [{ depot: { equals: 'KANDY' } }, { isActive: { equals: true } }] });
  });

  it('Calendar: date range', () => {
    expect(where('Calendar', 'date ge 2026-04-07 and date le 2026-04-08')).toEqual({
      AND: [{ date: { gte: new Date('2026-04-07T00:00:00Z') } }, { date: { lte: new Date('2026-04-08T00:00:00Z') } }],
    });
  });

  it('Vehicles and DistrictTravel: depot', () => {
    expect(where('Vehicle', "depot eq 'PELIYAGODA'")).toEqual({ depot: { equals: 'PELIYAGODA' } });
    expect(where('DistrictTravel', "depot eq 'KANDY'")).toEqual({ depot: { equals: 'KANDY' } });
  });
});

describe('registry', () => {
  @EntitySet({ name: 'Orders', model: 'Order', read: ['admin'], abac: {}, hidden: ['meta'] })
  class A extends ODataEntitySet {
    @ODataFunction({ name: 'F', binding: 'unbound', roles: ['admin'] })
    f() {
      return 1;
    }
  }
  class NotASet extends ODataEntitySet {}
  @EntitySet({ name: 'X', model: 'Nope', read: ['admin'], abac: {} })
  class BadModel extends ODataEntitySet {}
  class BoundOutside {
    @ODataFunction({ name: 'G', binding: 'collection', roles: ['admin'] })
    g() {
      return 1;
    }
  }

  it('collects sets, hidden fields and operations', () => {
    const r = new ODataRegistry('orders', model, [new A(null)]);
    expect([...r.sets.keys()]).toEqual(['Orders']);
    expect(r.unbound.has('F')).toBe(true);
    expect(r.hiddenFields()).toEqual({ User: ['passwordHash', 'refreshToken'], PodPhoto: ['bytes'], Order: ['meta'] });
    expect(r.csdlOperations()).toEqual([{ name: 'F', kind: 'function', binding: 'unbound', bindingType: undefined, params: {}, returns: undefined }]);
  });

  it('fails fast on configuration mistakes', () => {
    expect(() => new ODataRegistry('x', model, [new NotASet(null)])).toThrow(/missing @EntitySet/);
    expect(() => new ODataRegistry('x', model, [new BadModel(null)])).toThrow(/unknown Prisma model Nope/);
    expect(() => new ODataRegistry('x', model, [], [new BoundOutside()])).toThrow(/only unbound/);
    expect(() => new ODataRegistry('x', model, [new A(null), new A(null)])).toThrow(/Duplicate unbound operation F/);
  });

  it('gives the base class a Prisma delegate by model name', async () => {
    const delegate = { findMany: jest.fn().mockResolvedValue([1]), findFirst: jest.fn().mockResolvedValue(2), count: jest.fn().mockResolvedValue(3), create: jest.fn().mockResolvedValue(4), updateMany: jest.fn().mockResolvedValue({ count: 5 }) };
    const a = new A({ order: delegate });
    expect(await a.findMany({})).toEqual([1]);
    expect(await a.findFirst({})).toBe(2);
    expect(await a.count({})).toBe(3);
    expect(await a.create({ x: 1 }, { principal: personas.admin, headers: {} })).toBe(4);
    expect(await a.updateWhere({}, {})).toBe(5);
    expect(await a.beforeCreate({ x: 1 }, { principal: personas.admin, headers: {} })).toEqual({ x: 1 });
    expect(await a.beforeUpdate({ x: 1 }, {}, { principal: personas.admin, headers: {} })).toEqual({ x: 1 });
    expect(() => new A({}).findMany({})).toThrow(/delegate for model Order not found/);
  });
});

describe('serialization', () => {
  it('projects fields, etags and nested rows; BigInt as string', () => {
    const out = projectEntity(
      { id: 'A', n: BigInt(9), updatedAt: new Date(3), outlet: { id: 'O', name: 'x' } },
      { type: T('Order'), fields: ['id', 'n', 'missing'], etagField: 'updatedAt', expand: { outlet: { type: T('Outlet'), fields: ['id'], expand: {} } } },
    );
    expect(out).toEqual({ '@odata.etag': 'W/"3"', id: 'A', n: '9', outlet: { id: 'O' } });
  });
});

describe('request context', () => {
  it('exposes the caller inside a run and extracts bearer tokens', async () => {
    expect(currentRequest()).toBeUndefined();
    await runWithRequestContext({ principal: personas.admin, headers: { authorization: 'Bearer abc' } }, async () => {
      expect(currentRequest()?.principal.sub).toBe('admin');
      expect(callerAuthorization()).toBe('Bearer abc');
    });
    expect(callerAuthorization({ authorization: ['Bearer x'] })).toBe('Bearer x');
    expect(callerAuthorization({ authorization: 'Basic abc' })).toBeUndefined();
    expect(callerAuthorization({})).toBeUndefined();
  });
});

describe('errors', () => {
  it('serialises the OData error format', () => {
    expect(ODataError.badRequest('bad', 'x').toJSON()).toEqual({ error: { code: 'BadRequest', message: 'bad', target: 'x', details: [] } });
    expect(ODataError.preconditionRequired().status).toBe(428);
    expect(ODataError.notImplemented('x').status).toBe(501);
  });

  it('maps framework, body-parser and Prisma errors', () => {
    expect(toODataError(new ForbiddenException('nope'))).toMatchObject({ status: 403, code: 'Forbidden', message: 'nope' });
    expect(toODataError(new HttpException({ message: ['a', 'b'] }, 400))).toMatchObject({ status: 400, message: 'a; b' });
    expect(toODataError(new HttpException('teapot', 418))).toMatchObject({ status: 418, code: 'BadRequest' });
    expect(toODataError({ type: 'entity.parse.failed' })).toMatchObject({ status: 400 });
    expect(toODataError({ type: 'entity.too.large' })).toMatchObject({ status: 413 });
    expect(toODataError({ code: 'P2002', meta: { target: ['id'] } })).toMatchObject({ status: 409, target: 'id' });
    expect(toODataError({ code: 'P2003', meta: { field_name: 'outletId' } })).toMatchObject({ status: 409, target: 'outletId' });
    expect(toODataError({ code: 'P2025' })).toMatchObject({ status: 404 });
    expect(toODataError({ code: 'P2000' })).toMatchObject({ status: 400 });
    expect(toODataError({ name: 'PrismaClientValidationError' })).toMatchObject({ status: 400 });
    expect(toODataError(new Error('secret detail'))).toMatchObject({ status: 500, message: 'An unexpected error occurred' });
  });

  it('writes the error response with OData headers', () => {
    const res: any = { headersSent: false, status: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
    const host = { getType: () => 'http', switchToHttp: () => ({ getResponse: () => res, getRequest: () => ({ method: 'GET', originalUrl: '/x' }) }) } as unknown as ArgumentsHost;
    new ODataExceptionFilter().catch(new HttpException('Missing bearer token', 401), host);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Bearer'));
    expect(JSON.parse(res.send.mock.calls[0][0])).toEqual({ error: { code: 'Unauthorized', message: 'Missing bearer token', target: null, details: [] } });

    const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    new ODataExceptionFilter().catch(new Error('boom'), host);
    expect(res.status).toHaveBeenLastCalledWith(500);
    quiet.mockRestore();
  });
});

describe('serviceRoot', () => {
  const r = (headers: Record<string, string>) => ({ headers, protocol: 'http' }) as any;
  afterEach(() => delete process.env.PUBLIC_BASE_URL);

  it('uses forwarded headers from the gateway', () => {
    expect(serviceRoot(r({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'localhost', 'x-forwarded-port': '8443' }))).toBe('https://localhost:8443/odata/v4');
    expect(serviceRoot(r({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'lodestar.example', 'x-forwarded-port': '443' }))).toBe('https://lodestar.example/odata/v4');
    expect(serviceRoot(r({ host: 'orders:3002' }))).toBe('http://orders:3002/odata/v4');
  });

  it('prefers PUBLIC_BASE_URL', () => {
    process.env.PUBLIC_BASE_URL = 'https://lodestar.example/';
    expect(serviceRoot(r({}))).toBe('https://lodestar.example/odata/v4');
  });
});
