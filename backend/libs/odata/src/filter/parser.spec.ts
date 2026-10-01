import { ODataError } from '../errors';
import { tokenize } from './lexer';
import { parseFilter } from './parser';

describe('tokenize', () => {
  const types = (s: string) => tokenize(s).map((t) => t.type);

  it('recognises punctuation, identifiers and literals', () => {
    expect(types("status eq 'PLANNED'")).toEqual(['IDENT', 'IDENT', 'STRING', 'EOF']);
    expect(types('(a,b)/c:d=e')).toEqual(['LPAREN', 'IDENT', 'COMMA', 'IDENT', 'RPAREN', 'SLASH', 'IDENT', 'COLON', 'IDENT', 'EQUALS', 'IDENT', 'EOF']);
    expect(types('[1]')).toEqual(['LBRACKET', 'NUMBER', 'RBRACKET', 'EOF']);
  });

  it("unescapes '' inside strings", () => {
    const [t] = tokenize("'O''Brien''s'");
    expect(t).toMatchObject({ type: 'STRING', value: "O'Brien's" });
  });

  it('keeps an empty string literal', () => {
    expect(tokenize("''")[0]).toMatchObject({ type: 'STRING', value: '' });
  });

  it('distinguishes dates, date-times and numbers', () => {
    const [d, dt, dt2, n, neg, dec, exp] = tokenize('2026-04-07 2026-04-07T05:30:00Z 2026-04-07T05:30+05:30 42 -7 3.25 1e3');
    expect(d).toMatchObject({ type: 'DATE', value: '2026-04-07' });
    expect(dt).toMatchObject({ type: 'DATETIME', value: '2026-04-07T05:30:00Z' });
    expect(dt2).toMatchObject({ type: 'DATETIME', value: '2026-04-07T05:30+05:30' });
    expect(n).toMatchObject({ type: 'NUMBER', value: '42' });
    expect(neg).toMatchObject({ type: 'NUMBER', value: '-7' });
    expect(dec).toMatchObject({ type: 'NUMBER', value: '3.25' });
    expect(exp).toMatchObject({ type: 'NUMBER', value: '1e3' });
  });

  it('strips numeric type suffixes', () => {
    expect(tokenize('2.5m')[0]).toMatchObject({ type: 'NUMBER', value: '2.5' });
  });

  it('reads fractional seconds in date-times', () => {
    expect(tokenize('2026-04-07T05:30:00.123Z')[0].value).toBe('2026-04-07T05:30:00.123Z');
  });

  it('reads qualified enum literals', () => {
    expect(tokenize("Lodestar.Depot'KANDY'")[0]).toMatchObject({ type: 'ENUM', value: 'KANDY', enumType: 'Lodestar.Depot' });
  });

  it('reads qualified names and aliases', () => {
    expect(tokenize('Lodestar.Approve')[0]).toMatchObject({ type: 'IDENT', value: 'Lodestar.Approve' });
    expect(tokenize('@p1')[0]).toMatchObject({ type: 'ALIAS', value: '@p1' });
  });

  it('rejects unterminated strings and stray characters', () => {
    expect(() => tokenize("name eq 'abc")).toThrow(/Unterminated string/);
    expect(() => tokenize('a # b')).toThrow(/Unexpected character '#'/);
    expect(() => tokenize('@')).toThrow(/Invalid parameter alias/);
  });

  it('raises OData 400 errors naming the option', () => {
    try {
      tokenize('a ; b', '$filter');
      throw new Error('expected an error');
    } catch (e) {
      expect(e).toBeInstanceOf(ODataError);
      expect((e as ODataError).status).toBe(400);
      expect((e as ODataError).target).toBe('$filter');
    }
  });
});

describe('parseFilter', () => {
  it('parses a comparison', () => {
    expect(parseFilter("status eq 'PLANNED'")).toEqual({
      kind: 'compare',
      op: 'eq',
      left: { kind: 'member', path: ['status'] },
      right: { kind: 'literal', type: 'string', value: 'PLANNED' },
    });
  });

  it.each(['eq', 'ne', 'gt', 'ge', 'lt', 'le'])('parses the %s operator', (op) => {
    expect(parseFilter(`units ${op} 5`)).toMatchObject({ kind: 'compare', op });
  });

  it('gives and precedence over or', () => {
    const ast = parseFilter('a eq 1 or b eq 2 and c eq 3');
    expect(ast.kind).toBe('or');
    expect((ast as any).right.kind).toBe('and');
  });

  it('is left-associative for and/or chains', () => {
    const ast: any = parseFilter('a eq 1 and b eq 2 and c eq 3');
    expect(ast.kind).toBe('and');
    expect(ast.left.kind).toBe('and');
  });

  it('respects parentheses', () => {
    const ast: any = parseFilter('(a eq 1 or b eq 2) and c eq 3');
    expect(ast.kind).toBe('and');
    expect(ast.left.kind).toBe('or');
  });

  it('applies not to the whole comparison', () => {
    const ast: any = parseFilter("not status eq 'PLANNED'");
    expect(ast).toMatchObject({ kind: 'not', operand: { kind: 'compare', op: 'eq' } });
  });

  it('parses nested not', () => {
    expect(parseFilter('not not isActive')).toMatchObject({ kind: 'not', operand: { kind: 'not', operand: { kind: 'member' } } });
  });

  it('parses in lists with parentheses or brackets', () => {
    expect(parseFilter("status in ('A','B')")).toMatchObject({ kind: 'in', values: [{ value: 'A' }, { value: 'B' }] });
    expect(parseFilter('units in [1, 2, 3]')).toMatchObject({ kind: 'in', values: [{ value: 1 }, { value: 2 }, { value: 3 }] });
    expect(parseFilter("x in ('A')")).toMatchObject({ kind: 'in', values: [{ value: 'A' }] });
  });

  it('parses literals: null, booleans, dates, enums', () => {
    expect((parseFilter('notes eq null') as any).right).toEqual({ kind: 'literal', type: 'null', value: null });
    expect((parseFilter('a eq true') as any).right).toEqual({ kind: 'literal', type: 'boolean', value: true });
    expect((parseFilter('a eq false') as any).right.value).toBe(false);
    expect((parseFilter('runDate ge 2026-04-07') as any).right).toEqual({ kind: 'literal', type: 'date', value: '2026-04-07' });
    expect((parseFilter("depot eq Lodestar.Depot'KANDY'") as any).right).toMatchObject({ type: 'enum', value: 'KANDY' });
  });

  it('parses function calls with nested calls', () => {
    expect(parseFilter("contains(tolower(name),'fresh')")).toEqual({
      kind: 'call',
      name: 'contains',
      args: [
        { kind: 'call', name: 'tolower', args: [{ kind: 'member', path: ['name'] }] },
        { kind: 'literal', type: 'string', value: 'fresh' },
      ],
    });
  });

  it('lower-cases function names', () => {
    expect(parseFilter("StartsWith(name,'W')")).toMatchObject({ kind: 'call', name: 'startswith' });
  });

  it('parses a function call compared with a boolean', () => {
    expect(parseFilter("contains(name,'x') eq false")).toMatchObject({ kind: 'compare', left: { kind: 'call' }, right: { value: false } });
  });

  it('parses navigation paths', () => {
    expect(parseFilter("outlet/depot eq 'KANDY'")).toMatchObject({ left: { kind: 'member', path: ['outlet', 'depot'] } });
  });

  it('parses any/all lambdas', () => {
    expect(parseFilter('lineItems/any(l: l/qty gt 5)')).toEqual({
      kind: 'lambda',
      op: 'any',
      path: ['lineItems'],
      variable: 'l',
      predicate: {
        kind: 'compare',
        op: 'gt',
        left: { kind: 'member', path: ['l', 'qty'] },
        right: { kind: 'literal', type: 'number', value: 5 },
      },
    });
    expect(parseFilter('lineItems/any()')).toEqual({ kind: 'lambda', op: 'any', path: ['lineItems'] });
    expect(parseFilter("lineItems/all(x: x/name ne 'y')")).toMatchObject({ kind: 'lambda', op: 'all' });
  });

  it('resolves parameter aliases', () => {
    expect((parseFilter('units gt @min', { '@min': '10' }) as any).right).toMatchObject({ type: 'number', value: 10 });
  });

  it.each([
    ['', 'Empty expression'],
    ['status eq', 'Unexpected end'],
    ['status eq eq 1', "Unexpected operator 'eq'"],
    ['(a eq 1', "Expected ')'"],
    ['a eq 1)', 'Expected end of expression'],
    ['a eq 1 eq 2', 'cannot be chained'],
    ['a in ()', 'at least one value'],
    ['a in (b)', 'only contain literals'],
    ['a in 1', "Expected '(' after 'in'"],
    ['and eq 1', "Unexpected keyword 'and'"],
    ['lineItems/all()', 'needs a lambda expression'],
    ['lineItems/any(l l/qty gt 1)', "Expected ':'"],
    ['a eq @missing', 'has no value'],
    ["contains(name,'a'", "Expected ')'"],
    ['a/', 'Expected property name'],
  ])('rejects %p (%s)', (input, message) => {
    expect(() => parseFilter(input)).toThrow(message);
  });

  it('rejects aliases that are not literals', () => {
    expect(() => parseFilter('a eq @x', { '@x': 'b' })).toThrow(/must be a literal/);
  });
});
