import { EdmEntityType, EdmModel } from './edm/model';
import { ODataError } from './errors';
import { LiteralNode } from './filter/ast';
import { FilterParser } from './filter/parser';
import { coerceLiteral } from './filter/translator';
import { splitTopLevel } from './query/options';

/**
 * Parses a parenthesised key predicate (without the parentheses):
 *   'ORD0104217'                        → { id: 'ORD0104217' }
 *   42                                  → { seq: 42 }
 *   2026-04-07                          → { date: Date(2026-04-07) }
 *   brand='FRESH',dockType='REAR_DOCK'  → { brand: 'FRESH', dockType: 'REAR_DOCK' }
 * Values are coerced to the key property types (400 on mismatch).
 */
export function parseKeyPredicate(text: string, type: EdmEntityType, model: EdmModel): Record<string, unknown> {
  if (!text.trim()) throw ODataError.badRequest(`Missing key for ${type.name}`);
  const parts = splitTopLevel(text, ',').map((p) => p.trim());
  const named = parts.every((p) => /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(p) && !/^\w+\s*=\s*=/.test(p));

  const values: Record<string, LiteralNode> = {};
  if (parts.length === 1 && !named) {
    if (type.keys.length !== 1) {
      throw ODataError.badRequest(`${type.name} has a composite key; use (${type.keys.map((k) => `${k}=…`).join(',')})`);
    }
    values[type.keys[0]] = literal(parts[0]);
  } else {
    for (const p of parts) {
      const eq = p.indexOf('=');
      const name = p.slice(0, eq).trim();
      if (!type.keys.includes(name)) throw ODataError.badRequest(`'${name}' is not a key property of ${type.name}`);
      if (values[name]) throw ODataError.badRequest(`Key property '${name}' is given twice`);
      values[name] = literal(p.slice(eq + 1));
    }
    const missing = type.keys.filter((k) => !values[k]);
    if (missing.length) throw ODataError.badRequest(`Missing key properties: ${missing.join(', ')}`);
  }

  const where: Record<string, unknown> = {};
  for (const [name, lit] of Object.entries(values)) {
    const prop = type.properties.get(name)!;
    const v = coerceLiteral(lit, prop, model, 'key');
    if (v === null) throw ODataError.badRequest(`Key property '${name}' cannot be null`);
    where[name] = v;
  }
  return where;
}

function literal(text: string): LiteralNode {
  const node = new FilterParser(text.trim(), 'key').parse();
  if (node.kind !== 'literal') throw ODataError.badRequest(`Invalid key value '${text.trim()}'`);
  return node;
}

function formatValue(v: unknown): string {
  if (v instanceof Date) {
    const iso = v.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Canonical key segment of an entity: ('ORD0104217'), (42) or (brand='FRESH',dockType='REAR_DOCK'). */
export function formatKey(type: EdmEntityType, entity: Record<string, unknown>): string {
  if (type.keys.length === 1) return `(${formatValue(entity[type.keys[0]])})`;
  return `(${type.keys.map((k) => `${k}=${formatValue(entity[k])}`).join(',')})`;
}

/** Plain-text key for audit entries: ORD0104217, or brand=FRESH,dockType=REAR_DOCK. */
export function keyText(type: EdmEntityType, entity: Record<string, unknown>): string {
  const raw = (v: unknown) => (v instanceof Date ? formatValue(v) : String(v));
  if (type.keys.length === 1) return raw(entity[type.keys[0]]);
  return type.keys.map((k) => `${k}=${raw(entity[k])}`).join(',');
}
