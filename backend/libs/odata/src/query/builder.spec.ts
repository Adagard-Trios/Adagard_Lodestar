import { testModel } from '../../test/fixtures';
import { QueryBuilder, SetQueryPolicy } from './builder';
import { parseQueryOptions } from './options';

describe('QueryBuilder', () => {
  const model = testModel();
  const order = model.entityTypes.get('Order')!;
  const policy: SetQueryPolicy = {
    navigation: ['outlet', 'lineItems'],
    search: ['id', 'notes', 'outlet/name'],
    hidden: { Order: ['meta'], User: ['passwordHash'] },
  };
  const build = (q: string, p: Partial<SetQueryPolicy> = {}) => new QueryBuilder(model, order, { ...policy, ...p }).build(parseQueryOptions(q));

  it('selects every visible scalar by default, plus keys and the ETag field', () => {
    const plan = build('');
    expect(Object.keys(plan.select)).toEqual([
      'id', 'outletId', 'runDate', 'status', 'tempClass', 'units', 'kg', 'notes', 'deferredYesterday', 'updatedAt',
    ]);
    expect(plan.select.meta).toBeUndefined(); // hidden
    expect(plan.projection.etagField).toBe('updatedAt');
    expect(plan.orderBy).toEqual([{ id: 'asc' }]);
    expect(plan.skip).toBe(0);
    expect(plan.where).toBeUndefined();
  });

  it('honours $select but always fetches keys and the ETag field', () => {
    const plan = build('$select=status');
    expect(plan.select).toEqual({ id: true, status: true, updatedAt: true });
    expect(plan.projection.fields).toEqual(['id', 'status']);
  });

  it('rejects unknown, hidden and navigation properties in $select', () => {
    expect(() => build('$select=nope')).toThrow(/does not exist/);
    expect(() => build('$select=meta')).toThrow(/does not exist/);
    expect(() => build('$select=outlet')).toThrow(/use \$expand/);
  });

  it('combines $filter and $search', () => {
    const plan = build("$filter=units gt 1&$search=milk");
    expect(plan.where).toEqual({
      AND: [
        { units: { gt: 1 } },
        { OR: [{ id: { contains: 'milk', mode: 'insensitive' } }, { notes: { contains: 'milk', mode: 'insensitive' } }, { outlet: { is: { name: { contains: 'milk', mode: 'insensitive' } } } }] },
      ],
    });
  });

  it('builds $orderby with navigation and appends the key for stable paging', () => {
    expect(build('$orderby=outlet/name desc,units').orderBy).toEqual([{ outlet: { name: 'desc' } }, { units: 'asc' }, { id: 'asc' }]);
    expect(build('$orderby=id desc').orderBy).toEqual([{ id: 'desc' }]);
  });

  it('uses the default order when $orderby is absent', () => {
    const plan = build('', { defaultOrderBy: [{ path: ['runDate'], direction: 'desc' }] });
    expect(plan.orderBy).toEqual([{ runDate: 'desc' }, { id: 'asc' }]);
  });

  it('rejects bad $orderby paths', () => {
    expect(() => build('$orderby=meta')).toThrow(/Cannot order by/);
    expect(() => build('$orderby=lineItems/qty')).toThrow(/Cannot order by/);
    expect(() => build('$orderby=outlet')).toThrow(/Cannot order by/);
    expect(() => build('$orderby=nope')).toThrow(/Cannot order by/);
  });

  it('caps $top at 500', () => {
    expect(build('$top=500').top).toBe(500);
    expect(() => build('$top=501')).toThrow(/may not exceed 500/);
  });

  it('expands a to-many navigation with nested options', () => {
    const plan = build("$expand=lineItems($select=name;$filter=qty gt 1;$orderby=qty desc;$top=3;$skip=1)");
    expect(plan.select.lineItems).toEqual({
      select: { id: true, name: true },
      where: { qty: { gt: 1 } },
      orderBy: [{ qty: 'desc' }, { id: 'asc' }],
      take: 3,
      skip: 1,
    });
    expect(plan.projection.expand.lineItems.fields).toEqual(['id', 'name']);
  });

  it('caps nested collections at 500 by default', () => {
    expect(build('$expand=lineItems').select.lineItems.take).toBe(500);
    expect(() => build('$expand=lineItems($top=900)')).toThrow(/may not exceed 500/);
  });

  it('expands a to-one navigation with $select only', () => {
    const plan = build('$expand=outlet($select=name)');
    expect(plan.select.outlet).toEqual({ select: { id: true, name: true } });
    expect(() => build("$expand=outlet($filter=name eq 'x')")).toThrow(/Only \$select is allowed/);
  });

  it('only expands allow-listed navigations', () => {
    expect(() => build('$expand=lineItems', { navigation: ['outlet'] })).toThrow(/may not be expanded/);
    expect(() => build('$expand=units')).toThrow(/not a navigation property/);
  });

  it('walks a deeper filter path only when the set declares it', () => {
    const item = model.entityTypes.get('OrderLineItem')!;
    const mk = (p: Partial<SetQueryPolicy>) => new QueryBuilder(model, item, { navigation: ['order'], search: [], hidden: {}, ...p });
    const q = parseQueryOptions("$filter=order/outlet/depot eq 'KANDY'");
    expect(() => mk({}).build(q)).toThrow(/Navigation 'outlet' may not be used in filters/);
    expect(mk({ filterPaths: ['order/outlet'] }).build(q).where).toEqual({ order: { is: { outlet: { is: { depot: { equals: 'KANDY' } } } } } });
    // the first hop must itself be allow-listed, and paths do not extend
    expect(() => mk({ navigation: [], filterPaths: ['order/outlet'] }).build(q)).toThrow(/may not be used in filters/);
    expect(() => mk({ filterPaths: ['order/outlet'] }).build(parseQueryOptions("$filter=order/outlet/orders/any(o: o/units gt 1)"))).toThrow(/may not be used in filters/);
    // never usable for $expand
    expect(() => mk({ filterPaths: ['order/outlet'] }).build(parseQueryOptions('$expand=order/outlet'))).toThrow();
  });

  it('nests $expand only along declared expand paths', () => {
    const item = model.entityTypes.get('OrderLineItem')!;
    const mk = (p: Partial<SetQueryPolicy>) => new QueryBuilder(model, item, { navigation: ['order'], search: [], hidden: { Outlet: ['accessNote'] }, ...p });
    const q = parseQueryOptions('$expand=order($select=id;$expand=outlet($select=id,name))');
    expect(() => mk({}).build(q)).toThrow(/Navigation 'order\/outlet' may not be expanded/);
    const plan = mk({ expandPaths: ['order/outlet'] }).build(q);
    expect(plan.select.order.select.outlet).toEqual({ select: { id: true, name: true } });
    expect(plan.projection.expand.order.expand.outlet.fields).toEqual(['id', 'name']);
    // hidden fields stay hidden one level down; the first hop must itself be allow-listed
    expect(() => mk({ expandPaths: ['order/outlet'] }).build(parseQueryOptions('$expand=order($expand=outlet($select=accessNote))'))).toThrow(/does not exist/);
    expect(() => mk({ navigation: [], expandPaths: ['order/outlet'] }).build(q)).toThrow(/may not be expanded/);
    expect(() => mk({ expandPaths: ['order/outlet'] }).build(parseQueryOptions('$expand=order($expand=lineItems)'))).toThrow(/may not be expanded/);
  });

  it('does not let nested filters traverse further', () => {
    expect(() => build("$expand=lineItems($filter=order/id eq 'x')")).toThrow(/may not be used in filters/);
  });

  describe('$search', () => {
    it('ANDs terms, supports phrases and NOT', () => {
      const b = new QueryBuilder(model, order, { ...policy, search: ['notes'] });
      expect(b.search('"fresh milk" NOT sour')).toEqual({
        AND: [
          { OR: [{ notes: { contains: 'fresh milk', mode: 'insensitive' } }] },
          { NOT: { OR: [{ notes: { contains: 'sour', mode: 'insensitive' } }] } },
        ],
      });
      expect(b.search('milk AND bread')).toEqual({
        AND: [{ OR: [{ notes: { contains: 'milk', mode: 'insensitive' } }] }, { OR: [{ notes: { contains: 'bread', mode: 'insensitive' } }] }],
      });
      expect(b.search('   ')).toEqual({});
    });

    it('rejects OR, a dangling NOT and sets without search fields', () => {
      const b = new QueryBuilder(model, order, { ...policy, search: ['notes'] });
      expect(() => b.search('a OR b')).toThrow(/OR in \$search/);
      expect(() => b.search('NOT')).toThrow(/NOT needs a term/);
      expect(() => build('$search=x', { search: [] })).toThrow(/not supported/);
    });
  });
});
