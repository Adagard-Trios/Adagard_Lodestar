import { ODataError } from '../errors';
import { COMPARISON_OPS, ComparisonOp, FilterNode, LiteralNode } from './ast';
import { Token, tokenize, TokenType } from './lexer';

/**
 * Recursive-descent parser for OData $filter.
 *
 *   expr       := orExpr
 *   orExpr     := andExpr ( 'or' andExpr )*
 *   andExpr    := unary ( 'and' unary )*
 *   unary      := 'not' unary | comparison
 *   comparison := primary ( compOp primary | 'in' list )?
 *   primary    := '(' expr ')' | literal | call | member
 *   call       := IDENT '(' [ expr ( ',' expr )* ] ')'
 *   member     := IDENT ( '/' IDENT )* [ '/' ('any'|'all') '(' [ IDENT ':' expr ] ')' ]
 *   list       := ( '(' | '[' ) literal ( ',' literal )* ( ')' | ']' )
 *
 * `not` applies to a whole comparison (OData ABNF: notExpr = "not" boolCommonExpr).
 * Comparisons are non-associative; `and` binds tighter than `or`.
 */
export class FilterParser {
  private pos = 0;
  private readonly tokens: Token[];

  constructor(
    private readonly input: string,
    private readonly option = '$filter',
    private readonly aliases: Record<string, string> = {},
  ) {
    this.tokens = tokenize(input, option);
  }

  parse(): FilterNode {
    if (this.peek().type === 'EOF') this.fail('Empty expression');
    const node = this.parseOr();
    this.expect('EOF', 'end of expression');
    return node;
  }

  // ── grammar ──────────────────────────────────────────────

  private parseOr(): FilterNode {
    let left = this.parseAnd();
    while (this.isKeyword('or')) {
      this.next();
      left = { kind: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): FilterNode {
    let left = this.parseUnary();
    while (this.isKeyword('and')) {
      this.next();
      left = { kind: 'and', left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): FilterNode {
    if (this.isKeyword('not')) {
      this.next();
      return { kind: 'not', operand: this.parseUnary() };
    }
    return this.parseComparison();
  }

  private parseComparison(): FilterNode {
    const left = this.parsePrimary();
    const t = this.peek();
    if (t.type === 'IDENT' && COMPARISON_OPS.has(t.value)) {
      this.next();
      const right = this.parsePrimary();
      const after = this.peek();
      if (after.type === 'IDENT' && (COMPARISON_OPS.has(after.value) || after.value === 'in')) {
        this.fail(`Comparisons cannot be chained ('${after.value}')`, after);
      }
      return { kind: 'compare', op: t.value as ComparisonOp, left, right };
    }
    if (t.type === 'IDENT' && t.value === 'in') {
      this.next();
      return { kind: 'in', left, values: this.parseList() };
    }
    return left;
  }

  private parseList(): LiteralNode[] {
    const open = this.next();
    if (open.type !== 'LPAREN' && open.type !== 'LBRACKET') this.fail("Expected '(' after 'in'", open);
    const close: TokenType = open.type === 'LPAREN' ? 'RPAREN' : 'RBRACKET';
    const values: LiteralNode[] = [];
    if (this.peek().type === close) this.fail("'in' needs at least one value");
    for (;;) {
      const v = this.parsePrimary();
      if (v.kind !== 'literal') this.fail("'in' list may only contain literals");
      values.push(v as LiteralNode);
      if (this.peek().type === 'COMMA') {
        this.next();
        continue;
      }
      this.expect(close, close === 'RPAREN' ? "')'" : "']'");
      return values;
    }
  }

  private parsePrimary(): FilterNode {
    const t = this.next();
    switch (t.type) {
      case 'LPAREN': {
        const inner = this.parseOr();
        this.expect('RPAREN', "')'");
        return inner;
      }
      case 'STRING':
        return { kind: 'literal', type: 'string', value: t.value };
      case 'NUMBER':
        return { kind: 'literal', type: 'number', value: Number(t.value) };
      case 'DATE':
        return { kind: 'literal', type: 'date', value: t.value };
      case 'DATETIME':
        return { kind: 'literal', type: 'datetime', value: t.value };
      case 'ENUM':
        return { kind: 'literal', type: 'enum', value: t.value, enumType: t.enumType };
      case 'ALIAS':
        return this.resolveAlias(t);
      case 'IDENT':
        return this.parseIdentifier(t);
      default:
        return this.fail(t.type === 'EOF' ? 'Unexpected end of expression' : `Unexpected '${t.value}'`, t);
    }
  }

  private parseIdentifier(t: Token): FilterNode {
    switch (t.value) {
      case 'null':
        return { kind: 'literal', type: 'null', value: null };
      case 'true':
        return { kind: 'literal', type: 'boolean', value: true };
      case 'false':
        return { kind: 'literal', type: 'boolean', value: false };
      case 'and':
      case 'or':
      case 'not':
      case 'in':
        return this.fail(`Unexpected keyword '${t.value}'`, t);
    }
    if (COMPARISON_OPS.has(t.value)) this.fail(`Unexpected operator '${t.value}'`, t);

    // Function call
    if (this.peek().type === 'LPAREN') {
      this.next();
      const args: FilterNode[] = [];
      if (this.peek().type !== 'RPAREN') {
        for (;;) {
          args.push(this.parseOr());
          if (this.peek().type === 'COMMA') {
            this.next();
            continue;
          }
          break;
        }
      }
      this.expect('RPAREN', "')'");
      return { kind: 'call', name: t.value.toLowerCase(), args };
    }

    // Member path, optionally ending in a lambda
    const path = [t.value];
    while (this.peek().type === 'SLASH') {
      this.next();
      const seg = this.expect('IDENT', 'property name after /');
      if ((seg.value === 'any' || seg.value === 'all') && this.peek().type === 'LPAREN') {
        return this.parseLambda(seg.value, path);
      }
      path.push(seg.value);
    }
    return { kind: 'member', path };
  }

  private parseLambda(op: 'any' | 'all', path: string[]): FilterNode {
    this.expect('LPAREN', "'('");
    if (this.peek().type === 'RPAREN') {
      this.next();
      if (op === 'all') this.fail("'all' needs a lambda expression");
      return { kind: 'lambda', op, path };
    }
    const variable = this.expect('IDENT', 'lambda variable').value;
    this.expect('COLON', "':' after lambda variable");
    const predicate = this.parseOr();
    this.expect('RPAREN', "')'");
    return { kind: 'lambda', op, path, variable, predicate };
  }

  private resolveAlias(t: Token): FilterNode {
    const raw = this.aliases[t.value];
    if (raw === undefined) this.fail(`Parameter alias ${t.value} has no value`, t);
    const node = new FilterParser(raw, this.option).parse();
    if (node.kind !== 'literal') this.fail(`Parameter alias ${t.value} must be a literal`, t);
    return node;
  }

  // ── helpers ──────────────────────────────────────────────

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const t = this.tokens[this.pos];
    if (t.type !== 'EOF') this.pos++;
    return t;
  }

  private isKeyword(word: string): boolean {
    const t = this.peek();
    return t.type === 'IDENT' && t.value === word;
  }

  private expect(type: TokenType, what: string): Token {
    const t = this.peek();
    if (t.type !== type) this.fail(`Expected ${what} but found ${t.type === 'EOF' ? 'end of expression' : `'${t.value}'`}`, t);
    return this.next();
  }

  private fail(message: string, at: Token = this.peek()): never {
    throw ODataError.invalidQuery(this.option, `${message} at position ${at?.pos ?? 0} in '${this.input}'`);
  }
}

/** Parses a $filter string into an AST. Throws ODataError (400) on syntax errors. */
export function parseFilter(input: string, aliases: Record<string, string> = {}): FilterNode {
  return new FilterParser(input, '$filter', aliases).parse();
}
