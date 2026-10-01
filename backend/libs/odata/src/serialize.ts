import { makeEtag } from './etag';
import { Projection } from './query/builder';

/** JSON-safe value: BigInt becomes a string, Prisma Decimal uses its toJSON. */
function jsonValue(v: unknown): unknown {
  if (typeof v === 'bigint') return v.toString();
  return v;
}

/**
 * Shapes one fetched row for the response: requested fields only, the
 * @odata.etag annotation, and expanded navigations (recursively).
 */
export function projectEntity(row: Record<string, any>, p: Projection): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.etagField) {
    const tag = makeEtag(row[p.etagField]);
    if (tag) out['@odata.etag'] = tag;
  }
  for (const f of p.fields) if (f in row) out[f] = jsonValue(row[f]);
  for (const [nav, sub] of Object.entries(p.expand)) {
    const v = row[nav];
    out[nav] = Array.isArray(v) ? v.map((r) => projectEntity(r, sub)) : v ? projectEntity(v, sub) : null;
  }
  return out;
}

/** Context URL: <base>/$metadata#Orders or #Orders(id,status) or #Orders/$entity. */
export function contextUrl(baseUrl: string, fragment: string): string {
  return `${baseUrl}/$metadata#${fragment}`;
}

export const ODATA_JSON = 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false';
