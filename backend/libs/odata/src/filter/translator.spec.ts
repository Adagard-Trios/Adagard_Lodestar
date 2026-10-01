import { testModel } from '../../test/fixtures';
import { EdmModel } from '../edm/model';
import { ODataError } from '../errors';
import { parseFilter } from './parser';
import { coerceLiteral, FilterTranslator, parseDateLiteral } from './translator';

describe('FilterTranslator', () => {
  let model: EdmModel;
  let t: FilterTranslator;
  const where = (f: string, type = 'Order') => t.translate(parseFilter(f), model.entityTypes.get(type)!);

  beforeEach(() => {
    model = testModel();
    t = new FilterTranslator(model);
  });

  describe('comparisons', () => {
    it('eq on strings, enums and numbers', () => {
      expect(where("id eq 'ORD1'")).toEqual({ id: { equals: 'ORD1' } });
      expect(where("status eq 'PLANNED'")).toEqual({ status: { equals: 'PLANNED' } });
      expect(where('units eq 5')).toEqual({ units: { equals: 5 } });
    });

    it('maps ordering operators', () => {
      expect(where('units gt 5')).toEqual({ units: { gt: 5 } });
      expect(where('units ge 5')).toEqual({ units: { gte: 5 } });
      expect(where('kg lt 2.5')).toEqual({ kg: { lt: 2.5 } });
      expect(where('kg le 2.5')).toEqual({ kg: { lte: 2.5 } });
    });

    it('flips literal-first comparisons', () => {
      expect(where('5 lt units')).toEqual({ units: { gt: 5 } });
      expect(where('5 ge units')).toEqual({ units: { lte: 5 } });
      expect(where("'ORD1' eq id")).toEqual({ id: { equals: 'ORD1' } });
    });

    it('ne on a required field is a plain not', () => {
      expect(where("status ne 'PLANNED'")).toEqual({ status: { not: 'PLANNED' } });
    });

    it('ne on a nullable field keeps nulls (OData semantics)', () => {
      expect(where("notes ne 'x'")).toEqual({ OR: [{ notes: { not: 'x' } }, { notes: null }] });
    });

    it('handles null comparisons', () => {
      expect(where('notes eq null')).toEqual({ notes: null });
      expect(where('notes ne null')).toEqual({ notes: { not: null } });
      expect(() => where('notes gt null')).toThrow(/null can only be compared/);
    });

    it('a required property is never null: eq null matches nothing, ne null everything', () => {
      expect(where('outletId eq null')).toEqual({ OR: [] });
      expect(where('outletId ne null')).toEqual({});
    });

    it('coerces dates and date-times to Date objects', () => {
      expect(where('runDate ge 2026-04-07')).toEqual({ runDate: { gte: new Date('2026-04-07T00:00:00.000Z') } });
      expect(where('runDate lt 2026-04-07T05:30:00+05:30')).toEqual({ runDate: { lt: new Date('2026-04-07T00:00:00.000Z') } });
      expect(where("runDate eq '2026-04-07'")).toEqual({ runDate: { equals: new Date('2026-04-07T00:00:00.000Z') } });
    });

    it('accepts qualified and case-insensitive enum literals', () => {
      expect(where("tempClass eq Lodestar.TempClass'CHILLED'")).toEqual({ tempClass: { equals: 'CHILLED' } });
      expect(where("tempClass eq 'chilled'")).toEqual({ tempClass: { equals: 'CHILLED' } });
    });

    it('booleans: bare property, eq, not', () => {
      expect(where('deferredYesterday')).toEqual({ deferredYesterday: true });
      expect(where('deferredYesterday eq false')).toEqual({ deferredYesterday: { equals: false } });
      expect(where('not deferredYesterday')).toEqual({ NOT: { deferredYesterday: true } });
    });

    it('treats true/false literals as constant predicates', () => {
      expect(where('true')).toEqual({});
      expect(where('false')).toEqual({ OR: [] });
    });
  });

  describe('logical operators', () => {
    it('flattens and/or chains', () => {
      expect(where('units gt 1 and units lt 9 and kg gt 0')).toEqual({
        AND: [{ units: { gt: 1 } }, { units: { lt: 9 } }, { kg: { gt: 0 } }],
      });
      expect(where("status eq 'A' or status eq 'B' or status eq 'C'".replace(/'A'|'B'|'C'/g, "'PLANNED'"))).toEqual({
        OR: [{ status: { equals: 'PLANNED' } }, { status: { equals: 'PLANNED' } }, { status: { equals: 'PLANNED' } }],
      });
    });

    it('keeps grouping', () => {
      expect(where("(status eq 'PLANNED' or status eq 'RECEIVED') and units gt 2")).toEqual({
        AND: [{ OR: [{ status: { equals: 'PLANNED' } }, { status: { equals: 'RECEIVED' } }] }, { units: { gt: 2 } }],
      });
    });

    it('translates not', () => {
      expect(where("not (status eq 'PLANNED')")).toEqual({ NOT: { status: { equals: 'PLANNED' } } });
    });
  });

  describe('in', () => {
    it('builds an in filter', () => {
      expect(where("status in ('PLANNED','RECEIVED')")).toEqual({ status: { in: ['PLANNED', 'RECEIVED'] } });
    });

    it('splits out null values', () => {
      expect(where("notes in ('a', null)")).toEqual({ OR: [{ notes: { in: ['a'] } }, { notes: null }] });
      expect(where('notes in (null)')).toEqual({ notes: null });
    });

    it('validates each value', () => {
      expect(() => where("status in ('PLANNED','NOPE')")).toThrow(/not a valid OrderStatus/);
    });
  });

  describe('string functions', () => {
    it('contains / startswith / endswith', () => {
      expect(where("contains(notes,'milk')")).toEqual({ notes: { contains: 'milk' } });
      expect(where("startswith(id,'ORD01')")).toEqual({ id: { startsWith: 'ORD01' } });
      expect(where("endswith(id,'17')")).toEqual({ id: { endsWith: '17' } });
    });

    it('tolower/toupper make comparisons case-insensitive', () => {
      expect(where("contains(tolower(notes),'milk')")).toEqual({ notes: { contains: 'milk', mode: 'insensitive' } });
      expect(where("tolower(id) eq 'ord1'")).toEqual({ id: { equals: 'ord1', mode: 'insensitive' } });
      expect(where("toupper(id) eq 'ORD1'")).toEqual({ id: { equals: 'ORD1', mode: 'insensitive' } });
      expect(where("tolower(notes) ne 'x'")).toEqual({ OR: [{ notes: { not: 'x', mode: 'insensitive' } }, { notes: null }] });
      expect(where("tolower(id) ne 'x'")).toEqual({ id: { not: 'x', mode: 'insensitive' } });
    });

    it('a lower-cased property never equals an upper-case literal', () => {
      expect(where("tolower(id) eq 'ORD1'")).toEqual({ OR: [] });
      expect(where("tolower(id) ne 'ORD1'")).toEqual({});
      expect(where("contains(tolower(notes),'Milk')")).toEqual({ OR: [] });
    });

    it('handles function eq true/false', () => {
      expect(where("contains(notes,'x') eq true")).toEqual({ notes: { contains: 'x' } });
      expect(where("contains(notes,'x') eq false")).toEqual({ NOT: { notes: { contains: 'x' } } });
      expect(where("true ne contains(notes,'x')")).toEqual({ NOT: { notes: { contains: 'x' } } });
      expect(() => where("contains(notes,'x') gt true")).toThrow(/not valid for booleans/);
    });

    it('validates arguments', () => {
      expect(() => where("contains(units,'1')")).toThrow(/needs a string property/);
      expect(() => where('contains(notes,1)')).toThrow(/string literal/);
      expect(() => where("contains(notes)")).toThrow(/takes 2 arguments/);
      expect(() => where("tolower(notes)")).toThrow(/not a boolean expression/);
      expect(() => where("tolower('a') eq 'a'")).toThrow(/one property argument/);
      expect(() => where("tolower(units) eq 'a'")).toThrow(/needs a string property/);
      expect(() => where("tolower(id) gt 'a'")).toThrow(ODataError);
      expect(() => where("tolower(id) in ('a')")).toThrow(ODataError);
    });

    it('reports unsupported functions as 501', () => {
      try {
        where('year(runDate) eq 2026');
        throw new Error('expected an error');
      } catch (e) {
        expect((e as ODataError).status).toBe(501);
      }
      expect(() => where("substringof('a',notes)")).toThrow(/not supported/);
    });
  });

  describe('navigation', () => {
    it('filters through to-one navigations with is', () => {
      expect(where("outlet/depot eq 'KANDY'")).toEqual({ outlet: { is: { depot: { equals: 'KANDY' } } } });
      expect(where("outlet/accessNote ne 'x'")).toEqual({
        outlet: { is: { OR: [{ accessNote: { not: 'x' } }, { accessNote: null }] } },
      });
      expect(where("contains(outlet/name,'Fresh')")).toEqual({ outlet: { is: { name: { contains: 'Fresh' } } } });
      expect(where("outlet/depot in ('KANDY')")).toEqual({ outlet: { is: { depot: { in: ['KANDY'] } } } });
    });

    it('translates any/all lambdas over collections', () => {
      expect(where('lineItems/any(l: l/qty gt 5)')).toEqual({ lineItems: { some: { qty: { gt: 5 } } } });
      expect(where("lineItems/all(l: l/name ne 'x')")).toEqual({ lineItems: { every: { name: { not: 'x' } } } });
      expect(where('lineItems/any()')).toEqual({ lineItems: { some: {} } });
      expect(where('lineItems/any(l: l/qty gt 1 and l/kg lt 5)')).toEqual({
        lineItems: { some: { AND: [{ qty: { gt: 1 } }, { kg: { lt: 5 } }] } },
      });
    });

    it('supports lambdas from another entity type', () => {
      expect(where('orders/any(o: o/units gt 3)', 'Outlet')).toEqual({ orders: { some: { units: { gt: 3 } } } });
    });

    it('rejects misuse of navigations', () => {
      expect(() => where("lineItems/name eq 'x'")).toThrow(/is a collection/);
      expect(() => where("outlet eq 'x'")).toThrow(/navigation property and cannot be compared/);
      expect(() => where('outlet/any(o: o/name eq 1)')).toThrow(/is not a collection/);
      expect(() => where("units/x eq 'x'")).toThrow(/is not a navigation property/);
      expect(() => where('lineItems/any(l: qty gt 1)')).toThrow(/must start with the lambda variable/);
      expect(() => where('lineItems/any(l: l gt 1)')).toThrow(/primitive collections/);
      expect(() => where('lineItems/any(l: l/order/lineItems/any(l: l/qty gt 1))')).toThrow(/already in use/);
    });

    it('honours the navigation policy', () => {
      const strict = new FilterTranslator(model, { canNavigate: (_from, nav) => nav === 'outlet' });
      const order = model.entityTypes.get('Order')!;
      expect(strict.translate(parseFilter("outlet/depot eq 'KANDY'"), order)).toBeDefined();
      expect(() => strict.translate(parseFilter('lineItems/any()'), order)).toThrow(/may not be used in filters/);
    });

    it('hides hidden properties', () => {
      const hiding = new FilterTranslator(model, { isHidden: (type, p) => type.name === 'User' && p === 'passwordHash' });
      expect(() => hiding.translate(parseFilter("passwordHash eq 'x'"), model.entityTypes.get('User')!)).toThrow(/does not exist/);
    });
  });

  describe('type checking', () => {
    it.each([
      ["units eq 'five'", /does not match the type/],
      ['units eq 2.5', /does not match the type/],
      ['id eq 5', /does not match the type/],
      ['deferredYesterday eq 1', /does not match the type/],
      ["runDate eq 'not a date'", /not a valid date-time/],
      ['runDate eq 2026-02-30', /not a valid date/],
      ['runDate eq true', /does not match the type/],
      ["status eq 'NOPE'", /not a valid OrderStatus/],
      ["status eq Lodestar.Depot'KANDY'", /does not match the type/],
      ['status eq 1', /does not match the type/],
      ["meta eq 'x'", /cannot be filtered/],
      ["nope eq 'x'", /does not exist on type Order/],
      ["status gt 'PLANNED'", /not supported for status/],
      ['deferredYesterday gt true', /not supported/],
      ['units eq kg', /Comparing two properties/],
      ['1 eq 1', /needs a property/],
      ["'x'", /not a boolean expression/],
      ['units', /not a boolean expression/],
    ])('rejects %p', (f, msg) => {
      expect(() => where(f)).toThrow(msg);
    });
  });
});

describe('coerceLiteral / parseDateLiteral', () => {
  const model = testModel();
  const prop = (type: string, name: string) => model.entityTypes.get(type)!.properties.get(name)!;

  it('converts BigInt and Decimal-like types', () => {
    const big = { ...prop('Order', 'units'), type: 'BigInt' };
    expect(coerceLiteral({ kind: 'literal', type: 'number', value: 7 }, big, model, 'key')).toBe(BigInt(7));
    const dec = { ...prop('Order', 'kg'), type: 'Decimal' };
    expect(coerceLiteral({ kind: 'literal', type: 'number', value: 1.5 }, dec, model, 'key')).toBe(1.5);
    expect(() => coerceLiteral({ kind: 'literal', type: 'number', value: 1.5 }, big, model, 'key')).toThrow();
    expect(() => coerceLiteral({ kind: 'literal', type: 'string', value: '1' }, dec, model, 'key')).toThrow();
  });

  it('returns null for null literals', () => {
    expect(coerceLiteral({ kind: 'literal', type: 'null', value: null }, prop('Order', 'units'), model, 'key')).toBeNull();
  });

  it('rejects impossible dates', () => {
    expect(() => parseDateLiteral('2026-13-01', '$filter')).toThrow(/not a valid date/);
    expect(parseDateLiteral('2024-02-29', '$filter').toISOString()).toBe('2024-02-29T00:00:00.000Z');
  });
});
