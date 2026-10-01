import { ODataError } from './errors';
import { splitTopLevel } from './query/options';

/** One resource-path segment: `Orders`, `Orders('X')`, `Lodestar.Approve`, `Summary(runDate=2026-04-07)`. */
export interface PathSegment {
  name: string;
  /** Text inside the parentheses, if any (key predicate or function parameters) */
  args?: string;
}

/**
 * Parses the resource path after /odata/v4 into segments. The path is
 * percent-decoded first, then split on '/' outside quotes and parentheses,
 * so keys like ('Nuwara Eliya') or ('a/b') stay intact.
 */
export function parseResourcePath(path: string): PathSegment[] {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    throw ODataError.badRequest('Malformed percent-encoding in the resource path');
  }
  const trimmed = decoded.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) return [];
  return splitTopLevel(trimmed, '/').map((raw) => {
    const seg = raw.trim();
    const m = /^([^()]+?)\s*(?:\(([\s\S]*)\))?$/.exec(seg);
    if (!m) throw ODataError.badRequest(`Invalid path segment '${seg}'`);
    return m[2] === undefined ? { name: m[1] } : { name: m[1], args: m[2] };
  });
}

/** Lodestar.Approve → Approve (the namespace prefix is optional for our operations). */
export function unqualified(name: string, namespace: string): string {
  return name.startsWith(`${namespace}.`) ? name.slice(namespace.length + 1) : name;
}
