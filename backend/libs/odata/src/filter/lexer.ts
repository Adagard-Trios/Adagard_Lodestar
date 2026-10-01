import { ODataError } from '../errors';

/**
 * Tokenizer for OData v4 common expressions ($filter, key predicates,
 * function parameters). Keywords (eq, and, not, null, true…) come out as
 * IDENT tokens; the parser decides what they mean from context.
 */
export type TokenType =
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'SLASH'
  | 'COLON'
  | 'EQUALS'
  | 'STRING'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'ENUM'
  | 'IDENT'
  | 'ALIAS'
  | 'EOF';

export interface Token {
  type: TokenType;
  /** Decoded value: string content without quotes, number text, identifier… */
  value: string;
  /** For ENUM tokens: the qualified enum type name (e.g. Lodestar.Depot) */
  enumType?: string;
  pos: number;
}

const PUNCTUATION: Record<string, TokenType> = {
  '(': 'LPAREN',
  ')': 'RPAREN',
  '[': 'LBRACKET',
  ']': 'RBRACKET',
  ',': 'COMMA',
  '/': 'SLASH',
  ':': 'COLON',
  '=': 'EQUALS',
};

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,12})?)?(?:Z|[+-]\d{2}:\d{2})/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(?![\dT:])/;
const NUMBER_RE = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[mMdDfFlL](?![A-Za-z0-9_]))?/;
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_]*/;
/** Qualified enum literal: Namespace.Type'VALUE' */
const ENUM_RE = /^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+)'((?:[^']|'')*)'/;
/** Qualified name without a quote (namespaced functions/actions) */
const QUALIFIED_RE = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+/;

export function tokenize(input: string, option = '$filter'): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const fail = (msg: string) => {
    throw ODataError.invalidQuery(option, `${msg} at position ${i} in '${input}'`);
  };

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }

    if (PUNCTUATION[ch]) {
      tokens.push({ type: PUNCTUATION[ch], value: ch, pos: i });
      i++;
      continue;
    }

    // String literal with '' as the escape for a single quote.
    if (ch === "'") {
      const start = i;
      let value = '';
      i++;
      for (;;) {
        if (i >= input.length) {
          i = start;
          fail('Unterminated string literal');
        }
        if (input[i] === "'") {
          if (input[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        }
        value += input[i++];
      }
      tokens.push({ type: 'STRING', value, pos: start });
      continue;
    }

    const rest = input.slice(i);

    // Dates and date-times must be tried before numbers (both start with digits).
    let m = DATETIME_RE.exec(rest);
    if (m) {
      tokens.push({ type: 'DATETIME', value: m[0], pos: i });
      i += m[0].length;
      continue;
    }
    m = DATE_RE.exec(rest);
    if (m) {
      tokens.push({ type: 'DATE', value: m[0], pos: i });
      i += m[0].length;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(input[i + 1] ?? ''))) {
      m = NUMBER_RE.exec(rest);
      if (!m) fail('Invalid number');
      tokens.push({ type: 'NUMBER', value: m[0].replace(/[mMdDfFlL]$/, ''), pos: i });
      i += m[0].length;
      continue;
    }

    // Parameter alias: @name
    if (ch === '@') {
      m = /^@[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
      if (!m) fail('Invalid parameter alias');
      tokens.push({ type: 'ALIAS', value: m[0], pos: i });
      i += m[0].length;
      continue;
    }

    m = ENUM_RE.exec(rest);
    if (m) {
      tokens.push({ type: 'ENUM', value: m[2].replace(/''/g, "'"), enumType: m[1], pos: i });
      i += m[0].length;
      continue;
    }

    m = QUALIFIED_RE.exec(rest) ?? IDENT_RE.exec(rest);
    if (m) {
      tokens.push({ type: 'IDENT', value: m[0], pos: i });
      i += m[0].length;
      continue;
    }

    fail(`Unexpected character '${ch}'`);
  }

  tokens.push({ type: 'EOF', value: '', pos: input.length });
  return tokens;
}
