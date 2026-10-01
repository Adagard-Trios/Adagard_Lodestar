import { EdmEntityType, EdmModel } from './edm/model';
import { ODataError } from './errors';
import { LiteralNode } from './filter/ast';
import { FilterParser } from './filter/parser';
import { parseDateLiteral, parseDateTimeLiteral } from './filter/translator';
import { ParamSpec } from './entity-set';
import { splitTopLevel } from './query/options';

export function normaliseSpec(spec: string | ParamSpec): ParamSpec {
  return typeof spec === 'string' ? { type: spec } : spec;
}

/** Parses function parameters from the URL: Summary(runDate=2026-04-07,depot='KANDY'). */
export function parseFunctionArgs(text: string | undefined, aliases: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!text || !text.trim()) return out;
  for (const part of splitTopLevel(text, ',')) {
    const eq = part.indexOf('=');
    if (eq < 0) throw ODataError.badRequest(`Function parameter '${part.trim()}' needs name=value`);
    const name = part.slice(0, eq).trim();
    const node = new FilterParser(part.slice(eq + 1).trim(), 'parameters', aliases).parse();
    if (node.kind !== 'literal') throw ODataError.badRequest(`Parameter '${name}' must be a literal`, name);
    out[name] = literalValue(node);
  }
  return out;
}

function literalValue(n: LiteralNode): unknown {
  return n.value;
}

/**
 * Validates and coerces operation parameters against their declared EDM
 * types. Unknown parameters and missing required ones are 400s.
 */
export function coerceParams(
  raw: Record<string, unknown>,
  specs: Record<string, string | ParamSpec> = {},
  model: EdmModel,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of Object.keys(raw)) {
    if (name.startsWith('@')) continue;
    if (!(name in specs)) throw ODataError.badRequest(`Unknown parameter '${name}'`, name);
  }
  for (const [name, s] of Object.entries(specs)) {
    const spec = normaliseSpec(s);
    const v = raw[name];
    if (v === undefined || v === null) {
      if (spec.required) throw ODataError.badRequest(`Parameter '${name}' is required`, name);
      continue;
    }
    out[name] = coerceParam(name, v, spec.type, model);
  }
  return out;
}

function coerceParam(name: string, v: unknown, type: string, model: EdmModel): unknown {
  const bad = () => ODataError.badRequest(`Parameter '${name}' must be ${type}`, name);
  const coll = /^Collection\((.+)\)$/.exec(type);
  if (coll) {
    if (!Array.isArray(v)) throw bad();
    return v.map((x, i) => coerceParam(`${name}[${i}]`, x, coll[1], model));
  }
  switch (type) {
    case 'Edm.String':
      if (typeof v !== 'string') throw bad();
      return v;
    case 'Edm.Int32':
    case 'Edm.Int64':
      if (typeof v !== 'number' || !Number.isInteger(v)) throw bad();
      return v;
    case 'Edm.Double':
    case 'Edm.Decimal':
      if (typeof v !== 'number') throw bad();
      return v;
    case 'Edm.Boolean':
      if (typeof v !== 'boolean') throw bad();
      return v;
    case 'Edm.Date':
      if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw bad();
      parseDateLiteral(v, name);
      return v;
    case 'Edm.DateTimeOffset':
      if (typeof v !== 'string') throw bad();
      return parseDateTimeLiteral(v, name);
    case 'Edm.Untyped':
      return v;
  }
  const enumName = type.startsWith(`${model.namespace}.`) ? type.slice(model.namespace.length + 1) : undefined;
  const values = enumName ? model.enums.get(enumName) : undefined;
  if (values) {
    const match = typeof v === 'string' ? values.find((x) => x.toLowerCase() === v.toLowerCase()) : undefined;
    if (!match) throw ODataError.badRequest(`Parameter '${name}' must be one of ${values.join(', ')}`, name);
    return match;
  }
  // Complex/entity typed parameters are passed through as objects.
  if (typeof v !== 'object') throw bad();
  return v;
}

/**
 * Validates a POST/PATCH body against an entity type: only allowed fields,
 * JSON values coerced to Prisma values (dates, enums, integers).
 */
export function coerceEntityBody(
  body: unknown,
  type: EdmEntityType,
  allowed: string[],
  model: EdmModel,
): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw ODataError.badRequest('The request body must be a JSON object');
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (k.includes('@')) continue; // instance annotations such as @odata.etag
    if (!allowed.includes(k)) throw ODataError.badRequest(`Property '${k}' cannot be set`, k);
    const p = type.properties.get(k);
    if (!p) throw ODataError.badRequest(`Property '${k}' does not exist on type ${type.name}`, k);
    if (p.kind === 'object') {
      out[k] = v; // deep insert payloads are validated by the set's hooks
      continue;
    }
    if (v === null) {
      if (p.isRequired) throw ODataError.badRequest(`Property '${k}' cannot be null`, k);
      out[k] = null;
      continue;
    }
    const bad = () => ODataError.badRequest(`Property '${k}' has the wrong type (expected ${p.type})`, k);
    if (p.isList) {
      if (!Array.isArray(v)) throw bad();
      out[k] = v;
      continue;
    }
    if (p.kind === 'enum') {
      const values = model.enums.get(p.type) ?? [];
      const match = typeof v === 'string' ? values.find((x) => x.toLowerCase() === v.toLowerCase()) : undefined;
      if (!match) throw ODataError.badRequest(`Property '${k}' must be one of ${values.join(', ')}`, k);
      out[k] = match;
      continue;
    }
    switch (p.type) {
      case 'String':
        if (typeof v !== 'string') throw bad();
        break;
      case 'Int':
        if (typeof v !== 'number' || !Number.isInteger(v)) throw bad();
        break;
      case 'Float':
      case 'Decimal':
        if (typeof v !== 'number') throw bad();
        break;
      case 'Boolean':
        if (typeof v !== 'boolean') throw bad();
        break;
      case 'DateTime': {
        if (typeof v !== 'string') throw bad();
        out[k] = /^\d{4}-\d{2}-\d{2}$/.test(v) ? parseDateLiteral(v, k) : parseDateTimeLiteral(v, k);
        continue;
      }
    }
    out[k] = v;
  }
  return out;
}
