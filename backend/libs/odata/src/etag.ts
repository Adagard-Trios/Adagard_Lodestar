/**
 * Weak ETags derived from `updatedAt` (PLATFORM.md §3): W/"<epoch ms>".
 * Used for @odata.etag, the ETag header and If-Match checks on PATCH.
 */
export function makeEtag(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const v = value instanceof Date ? value.getTime() : typeof value === 'bigint' ? value.toString() : String(value);
  return `W/"${v}"`;
}

function opaque(tag: string): string {
  return tag.trim().replace(/^W\//, '');
}

/**
 * Does an If-Match header value match the current ETag? Accepts `*` and
 * comma-separated lists; comparison is weak (the W/ prefix is ignored).
 */
export function etagMatches(ifMatch: string, current: string | undefined): boolean {
  const candidates = ifMatch.split(',').map((s) => s.trim()).filter(Boolean);
  if (candidates.includes('*')) return current !== undefined;
  if (!current) return false;
  return candidates.some((c) => opaque(c) === opaque(current));
}
