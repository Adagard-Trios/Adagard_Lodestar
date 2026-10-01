import { parseQueryOptions, parseQueryString, splitTopLevel } from './options';

describe('splitTopLevel', () => {
  it('splits outside quotes and parentheses', () => {
    expect(splitTopLevel("a(b,c),'x,y',d", ',')).toEqual(['a(b,c)', "'x,y'", 'd']);
    expect(splitTopLevel("$select=a;$filter=b eq 'x;y'", ';')).toEqual(['$select=a', "$filter=b eq 'x;y'"]);
    expect(splitTopLevel("'it''s',b", ',')).toEqual(["'it''s'", 'b']);
  });

  it('rejects unbalanced input', () => {
    expect(() => splitTopLevel('a(b', ',')).toThrow(/Unbalanced/);
    expect(() => splitTopLevel("'a", ',')).toThrow(/Unbalanced/);
  });
});

describe('parseQueryString', () => {
  it('decodes values and keeps an unencoded + in a date-time offset', () => {
    const q = parseQueryString('$filter=runDate%20gt%202026-04-07T00:00:00+05:30&x=1');
    expect(q.get('$filter')).toBe('runDate gt 2026-04-07T00:00:00+05:30');
    expect(q.get('x')).toBe('1');
  });

  it('reads + as a space, the way httpx, requests and URLSearchParams encode queries', () => {
    expect(parseQueryString("$filter=depot+eq+'KANDY'+and+isActive+eq+true").get('$filter'))
      .toBe("depot eq 'KANDY' and isActive eq true");
    expect(parseQueryString('$filter=runDate+ge+2026-04-07T06:35:00+05:30').get('$filter'))
      .toBe('runDate ge 2026-04-07T06:35:00+05:30');
    expect(parseQueryString("$filter=name+eq+'A%2BB'").get('$filter')).toBe("name eq 'A+B'");
  });

  it('decodes an encoded $ in the option name', () => {
    expect(parseQueryString('%24top=5').get('$top')).toBe('5');
  });

  it('rejects duplicated system options and bad encoding', () => {
    expect(() => parseQueryString('$top=1&$top=2')).toThrow(/more than once/);
    expect(() => parseQueryString('$filter=%E0%A4%A')).toThrow(/Malformed/);
  });

  it('handles empty strings and valueless keys', () => {
    expect(parseQueryString('').size).toBe(0);
    expect(parseQueryString('flag&&').get('flag')).toBe('');
  });
});

describe('parseQueryOptions', () => {
  it('parses every supported option', () => {
    const o = parseQueryOptions(
      "$filter=status eq 'PLANNED'&$select=id,status&$orderby=runDate desc,outlet/name&$top=10&$skip=20&$count=true&$search=milk&$format=json&@p=1&custom=ignored",
    );
    expect(o).toEqual({
      filter: "status eq 'PLANNED'",
      select: ['id', 'status'],
      orderby: [
        { path: ['runDate'], direction: 'desc' },
        { path: ['outlet', 'name'], direction: 'asc' },
      ],
      top: 10,
      skip: 20,
      count: true,
      search: 'milk',
      aliases: { '@p': '1' },
    });
  });

  it('parses $expand with nested options', () => {
    const o = parseQueryOptions("$expand=lineItems($select=name,qty;$filter=qty gt 1;$orderby=qty desc;$top=5;$skip=1),outlet($select=name)");
    expect(o.expand).toEqual([
      {
        navigation: 'lineItems',
        options: { select: ['name', 'qty'], filter: 'qty gt 1', orderby: [{ path: ['qty'], direction: 'desc' }], top: 5, skip: 1 },
      },
      { navigation: 'outlet', options: { select: ['name'] } },
    ]);
  });

  it('accepts $count=false, $select=* and $skiptoken', () => {
    expect(parseQueryOptions('$count=false').count).toBe(false);
    expect(parseQueryOptions('$select=*').select).toEqual(['*']);
    expect(parseQueryOptions('$skiptoken=500').skip).toBe(500);
  });

  it.each([
    ['$top=-1', /non-negative integer/],
    ['$top=abc', /non-negative integer/],
    ['$skip=1.5', /non-negative integer/],
    ['$count=yes', /true or false/],
    ['$filter=', /empty/],
    ['$select=a b', /Invalid \$select item/],
    ['$orderby=a sideways', /Invalid sort direction/],
    ['$orderby=a b c', /Invalid \$orderby item/],
    ['$orderby=a/1', /Invalid property path/],
    ['$expand=*', /not supported/],
    ['$expand=a/b', /one level/],
    ['$expand=a($expand=b)', /one level/],
    ['$expand=a($count=true)', /not supported inside \$expand/],
    ['$expand=a(', /Unbalanced/],
    ['$expand=1a', /Invalid navigation/],
    ['$format=xml', /Only JSON/],
    ['$apply=groupby((a))', /not supported/],
    ['$bogus=1', /Unknown system query option/],
  ])('rejects %p', (q, msg) => {
    expect(() => parseQueryOptions(q)).toThrow(msg);
  });

  it('uses 406 for unsupported formats and 501 for unsupported options', () => {
    expect(() => parseQueryOptions('$format=atom')).toThrow(expect.objectContaining({ status: 406 }));
    expect(() => parseQueryOptions('$compute=a')).toThrow(expect.objectContaining({ status: 501 }));
  });
});
