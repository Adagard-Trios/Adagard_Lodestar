// tests/e2e/clicks/inert-allowlist.json: the reviewed exceptions of the click specs, each with its reason.
//   inert          "<screen key>#<control id>"  a control that is meant to do nothing (every-control.spec.ts)
//   links          "<screen key>#<link code>"   a designed link the screen deliberately does not follow (designed-links.spec.ts)
//   ignoreConsole  [{ pattern, reason }]        console errors that are not defects (regular expressions)
//   ignoreHttp     [{ pattern, reason }]        4xx/5xx responses that are not defects ("<status> <method> <url>")
// `*` in a key matches any run of characters. Judge-walkthrough screens may not appear in `inert` or `links`
// (every-control.spec.ts checks this).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Rule = { pattern: string; reason: string };
export type AllowlistFile = {
  $comment?: string | string[];
  inert: Record<string, string>;
  links: Record<string, string>;
  ignoreConsole: Rule[];
  ignoreHttp: Rule[];
};

export const ALLOWLIST_FILE = join(__dirname, '..', '..', 'clicks', 'inert-allowlist.json');

export function loadAllowlist(): AllowlistFile {
  const raw = JSON.parse(readFileSync(ALLOWLIST_FILE, 'utf8')) as Partial<AllowlistFile>;
  return { inert: raw.inert ?? {}, links: raw.links ?? {}, ignoreConsole: raw.ignoreConsole ?? [], ignoreHttp: raw.ignoreHttp ?? [] };
}

const glob = (k: string) => new RegExp(`^${k.split('*').map(p => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);

/** The reason `screenKey#id` is exempt, if it is. */
export function exemption(map: Record<string, string>, screenKey: string, id: string): string | undefined {
  const want = `${screenKey}#${id}`;
  for (const [k, reason] of Object.entries(map)) if (k === want || (k.includes('*') && glob(k).test(want))) return reason;
  return undefined;
}

export const ignored = (rules: Rule[], text: string) => rules.find(r => new RegExp(r.pattern, 'i').test(text));
