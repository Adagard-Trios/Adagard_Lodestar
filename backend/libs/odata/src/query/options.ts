import { ODataError } from '../errors';

/** Parsed system query options of one request (or of one $expand item). */
export interface QueryOptions {
  filter?: string;
  select?: string[]; // undefined = all; ['*'] = all
  orderby?: OrderByItem[];
  top?: number;
  skip?: number;
  count?: boolean;
  expand?: ExpandItem[];
  search?: string;
  /** Parameter aliases (@name=value) for filters and function parameters */
  aliases: Record<string, string>;
}

export interface OrderByItem {
  path: string[];
  direction: 'asc' | 'desc';
}

export interface ExpandItem {
  navigation: string;
  /** `expand` holds the nested level (at most MAX_EXPAND_DEPTH levels in all). */
  options: Omit<QueryOptions, 'aliases' | 'count' | 'search'>;
}

/** Levels of $expand a request may nest: Trips?$expand=stops($expand=outlet) is two. */
export const MAX_EXPAND_DEPTH = 2;

const TOP_LEVEL = new Set(['$filter', '$select', '$orderby', '$top', '$skip', '$count', '$expand', '$search', '$format', '$skiptoken']);
const UNSUPPORTED = new Set(['$apply', '$compute', '$levels', '$index', '$schemaversion', '$deltatoken', '$id']);
const EXPAND_ALLOWED = new Set(['$select', '$filter', '$orderby', '$top', '$skip', '$expand']);
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Splits on a separator outside quotes and parentheses:
 * "a(b,c),d" → ["a(b,c)", "d"]; "'x,y',z" → ["'x,y'", "z"].
 */
export function splitTopLevel(input: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'") {
      // '' inside a string is an escaped quote; toggling twice keeps the state right.
      quoted = !quoted;
    } else if (!quoted) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === sep && depth === 0) {
        parts.push(cur);
        cur = '';
        continue;
      }
    }
    cur += ch;
  }
  if (depth !== 0 || quoted) throw ODataError.badRequest(`Unbalanced parentheses or quotes in '${input}'`);
  parts.push(cur);
  return parts;
}

// '+' between a time and an offset, e.g. 06:35:00+05:30, is a sign, not an encoded space
const TIME_BEFORE = /\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
const OFFSET_AFTER = /^\d{2}:\d{2}/;

function decode(s: string): string {
  // Most HTTP clients (httpx, requests, URLSearchParams) send spaces as '+' and a real '+' as %2B.
  const spaced = s.replace(/\+/g, (_m, at: number) =>
    TIME_BEFORE.test(s.slice(0, at)) && OFFSET_AFTER.test(s.slice(at + 1)) ? '+' : ' ');
  try {
    return decodeURIComponent(spaced);
  } catch {
    throw ODataError.badRequest(`Malformed percent-encoding in '${s}'`);
  }
}

/**
 * Parses a raw query string (without '?'). Spaces may arrive as %20 or as '+'
 * (form encoding); an unencoded '+' in a date-time offset such as +05:30 is kept.
 */
export function parseQueryString(raw: string): Map<string, string> {
  const params = new Map<string, string>();
  if (!raw) return params;
  for (const pair of raw.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const key = decode(eq < 0 ? pair : pair.slice(0, eq)).trim();
    const value = eq < 0 ? '' : decode(pair.slice(eq + 1));
    if (key.startsWith('$') || key.startsWith('@')) {
      if (params.has(key)) throw ODataError.badRequest(`Query option ${key} is given more than once`, key);
    }
    params.set(key, value);
  }
  return params;
}

function parseNonNegativeInt(option: string, value: string): number {
  if (!/^\d+$/.test(value.trim())) throw ODataError.invalidQuery(option, `${option} must be a non-negative integer`);
  return Number(value.trim());
}

function parseSelect(value: string, option = '$select'): string[] {
  const items = value.split(',').map((s) => s.trim());
  for (const item of items) {
    if (item !== '*' && !IDENT.test(item)) throw ODataError.invalidQuery(option, `Invalid $select item '${item}'`);
  }
  return items;
}

function parseOrderBy(value: string): OrderByItem[] {
  return splitTopLevel(value, ',').map((raw) => {
    const parts = raw.trim().split(/\s+/);
    if (parts.length > 2 || !parts[0]) throw ODataError.invalidQuery('$orderby', `Invalid $orderby item '${raw.trim()}'`);
    const dir = (parts[1] ?? 'asc').toLowerCase();
    if (dir !== 'asc' && dir !== 'desc') throw ODataError.invalidQuery('$orderby', `Invalid sort direction '${parts[1]}'`);
    const path = parts[0].split('/');
    if (!path.every((p) => IDENT.test(p))) throw ODataError.invalidQuery('$orderby', `Invalid property path '${parts[0]}'`);
    return { path, direction: dir };
  });
}

function parseExpand(value: string, depth = 1): ExpandItem[] {
  return splitTopLevel(value, ',').map((raw) => {
    const item = raw.trim();
    const open = item.indexOf('(');
    const navigation = open < 0 ? item : item.slice(0, open).trim();
    if (navigation === '*') throw ODataError.notImplemented('$expand=* is not supported; name the navigation properties', '$expand');
    if (navigation.includes('/')) throw ODataError.notImplemented('Expand paths are not supported; nest $expand inside the navigation', '$expand');
    if (!IDENT.test(navigation)) throw ODataError.invalidQuery('$expand', `Invalid navigation '${navigation}'`);

    const options: ExpandItem['options'] = {};
    if (open >= 0) {
      if (!item.endsWith(')')) throw ODataError.invalidQuery('$expand', `Unbalanced parentheses in '${item}'`);
      const inner = item.slice(open + 1, -1);
      for (const part of splitTopLevel(inner, ';')) {
        const p = part.trim();
        if (!p) continue;
        const eq = p.indexOf('=');
        const key = (eq < 0 ? p : p.slice(0, eq)).trim();
        const v = eq < 0 ? '' : p.slice(eq + 1);
        if (key === '$expand' && depth >= MAX_EXPAND_DEPTH) {
          throw ODataError.notImplemented(`At most ${MAX_EXPAND_DEPTH} levels of $expand are supported`, '$expand');
        }
        if (!EXPAND_ALLOWED.has(key)) throw ODataError.invalidQuery('$expand', `Option ${key} is not supported inside $expand`);
        switch (key) {
          case '$select': options.select = parseSelect(v); break;
          case '$filter': options.filter = v; break;
          case '$orderby': options.orderby = parseOrderBy(v); break;
          case '$top': options.top = parseNonNegativeInt('$top', v); break;
          case '$skip': options.skip = parseNonNegativeInt('$skip', v); break;
          case '$expand': options.expand = parseExpand(v, depth + 1); break;
        }
      }
    }
    return { navigation, options };
  });
}

/** Parses the system query options of a request. Unknown $-options are rejected (400). */
export function parseQueryOptions(raw: string): QueryOptions {
  const params = parseQueryString(raw);
  const opts: QueryOptions = { aliases: {} };
  for (const [key, value] of params) {
    if (key.startsWith('@')) {
      opts.aliases[key] = value;
      continue;
    }
    if (!key.startsWith('$')) continue; // custom query options are ignored
    if (UNSUPPORTED.has(key)) throw ODataError.notImplemented(`${key} is not supported`, key);
    if (!TOP_LEVEL.has(key)) throw ODataError.invalidQuery(key, `Unknown system query option ${key}`);
    switch (key) {
      case '$filter':
        if (!value.trim()) throw ODataError.invalidQuery('$filter', '$filter is empty');
        opts.filter = value;
        break;
      case '$select': opts.select = parseSelect(value); break;
      case '$orderby': opts.orderby = parseOrderBy(value); break;
      case '$top': opts.top = parseNonNegativeInt('$top', value); break;
      case '$skip': opts.skip = parseNonNegativeInt('$skip', value); break;
      case '$count': {
        const v = value.trim().toLowerCase();
        if (v !== 'true' && v !== 'false') throw ODataError.invalidQuery('$count', '$count must be true or false');
        opts.count = v === 'true';
        break;
      }
      case '$expand': opts.expand = parseExpand(value); break;
      case '$search': opts.search = value; break;
      case '$format': {
        const v = value.trim().toLowerCase();
        if (v !== 'json' && !v.startsWith('application/json')) {
          throw new ODataError(406, 'NotAcceptable', 'Only JSON is supported', '$format');
        }
        break;
      }
      case '$skiptoken': opts.skip = parseNonNegativeInt('$skiptoken', value); break;
    }
  }
  return opts;
}
