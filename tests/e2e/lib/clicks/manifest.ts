// The click manifest: every designed screen of the desk website and the field app, with every designed link,
// read from the repo's generated sources (the committed copy of the design's links), never from Designing/.
//
//   desk   frontend/app/{store,plan,admin}/<key>/page.tsx   `const nav = { links: { CODE: { href | app+screen, kind } }, auto?, whole? }`
//          live when the page renders <LiveSwitch> (frontend/live/<key>.tsx); clickable elements carry data-lk="CODE"
//   field  mobile/src/screens/registry.ts (SCREENS = every /field/s/<key> route, LIVE = keys with a live screen)
//          mobile/src/screens/<key>.tsx  `const nav: ScreenNav = {"links":{CODE:{to|app+screen,kind}},auto?,whole?}` (designed)
//          mobile/src/live/<key>.tsx     its own nav (what the live screen actually wires)
//          a designed tap renders data-testid="lk-CODE" on web (mobile/src/lodestar/runtime.tsx Tap / TapText)
//
// Only node builtins and erasable TypeScript here: tools/gen-clicks-manifest.ts runs this file with plain `node`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type App = 'desk' | 'field';
export type Device = 'desktop' | 'phone' | 'tablet';
export type PersonaName = 'storeManager' | 'dispatcher' | 'loader' | 'driver' | 'admin';

export type DesignedLink = {
  /** data-lk code (desk) / testID suffix (field). 'auto' and 'whole' are the screen-level targets. */
  code: string;
  /** 'link' = an element with the code; 'auto' = the screen advances by itself; 'whole' = tap anywhere. */
  via: 'link' | 'auto' | 'whole';
  kind: string;
  /** Destination path: desk `/plan/dsp-02-plan-board`; field `/field/s/dr-03-proof-of-delivery`. */
  to?: string;
  /** Cross-device target: the app and screen named in the "Continues in …" notice. */
  app?: string;
  screen?: string;
};

export type ScreenEntry = {
  /** Screen id from the design, e.g. SM-01, DSP-A1B, LD-03. */
  id: string;
  name: string;
  key: string;
  app: App;
  /** Desk face (store | plan | admin); field: the role's app. */
  face: string;
  device: Device;
  viewport: { width: number; height: number };
  persona: PersonaName;
  /** Route relative to the site root: `/store/sm-01-place-order` or `/field/s/dr-02-stop-arrival`. */
  path: string;
  /** Renders a live screen (real data); otherwise the generated static mock. */
  live: boolean;
  /** Pre-authentication screen (sign in, reset access, …). */
  entry: boolean;
  /** Part of README.md "Judge walkthrough". */
  walkthrough: boolean;
  links: DesignedLink[];
  /** Codes the live screen's source names literally (data-lk / lk= / nav.go('…') / its own nav table). */
  liveCodes: string[];
  /** Field live screens: the live screen's own nav table, when it differs from the design's. */
  liveLinks?: Record<string, { to?: string; kind?: string; app?: string; screen?: string }>;
  /** Repo-relative source files. */
  sources: string[];
};

export type Manifest = {
  generatedFrom: string[];
  screens: ScreenEntry[];
  totals: { screens: number; desk: number; field: number; live: number; static: number; links: number; walkthrough: number };
};

const DESK_FACES = ['store', 'plan', 'admin'] as const;
const FIELD_FACE: Record<string, string> = { SM: 'store', DSP: 'plan', LD: 'dock', DR: 'run' };

const PERSONA_BY_PREFIX: Record<string, PersonaName> = { SM: 'storeManager', DSP: 'dispatcher', LD: 'loader', DR: 'driver', ADM: 'admin' };

/** Desk entry screens (frontend/lib/auth/session.ts ENTRY_SCREENS) and the field app's pre-sign-in screens. */
const DESK_ENTRY = new Set(['dsp-06-sign-in', 'dsp-34-reset-access', 'dsp-35-session-expired', 'sm-26-sign-in', 'sm-35-reset-access', 'sm-36-service-unavailable', 'adm-01-sign-in']);
const FIELD_ENTRY = /-(splash|sign-in|verify-code|can-t-sign-in|shared-sign-in|access-request-sent|session-expired(-while-offline)?|update-required|signed-out-at-shift-end)$/;

/**
 * README.md "Judge walkthrough": SM-01, SM-02, SM-27 and DSP-01/22/02/03/39/40/12/04/13/17 on the desk;
 * LD-01/02/03/04/15, DR-01/36/02/03/A1/A2/A3 and SM-03/18 on the phone.
 */
export const WALKTHROUGH: { app: App; ids: string[] }[] = [
  { app: 'desk', ids: ['SM-01', 'SM-02', 'SM-27', 'DSP-01', 'DSP-22', 'DSP-02', 'DSP-03', 'DSP-39', 'DSP-40', 'DSP-12', 'DSP-04', 'DSP-13', 'DSP-17'] },
  { app: 'field', ids: ['LD-01', 'LD-02', 'LD-03', 'LD-04', 'LD-15', 'DR-01', 'DR-36', 'DR-02', 'DR-03', 'DR-A1', 'DR-A2', 'DR-A3', 'SM-03', 'SM-18'] },
];
const isWalkthrough = (app: App, id: string) => WALKTHROUGH.some(w => w.app === app && w.ids.includes(id));

const VIEWPORT: Record<Device, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1194, height: 834 },
};

/** The `{…}` literal that follows `marker` (balanced braces, strings respected). */
function objectAfter(src: string, marker: RegExp): string | null {
  const m = marker.exec(src);
  if (!m) return null;
  let i = src.indexOf('{', m.index + m[0].length - 1);
  if (i < 0) return null;
  const start = i;
  let depth = 0;
  let str: string | null = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (str) {
      if (c === '\\') i++;
      else if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') str = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

type RawTarget = { href?: string; to?: string; app?: string; screen?: string; kind?: string; params?: Record<string, string> };
type RawNav = { links?: Record<string, RawTarget>; auto?: RawTarget; whole?: RawTarget };

function parseNav(src: string): RawNav | null {
  const lit = objectAfter(src, /const nav(?:\s*:\s*ScreenNav)?\s*=\s*\{/);
  if (!lit) return null;
  try {
    return JSON.parse(lit) as RawNav;
  } catch {
    return null;
  }
}

function toLinks(nav: RawNav, app: App): DesignedLink[] {
  const dest = (t: RawTarget): Pick<DesignedLink, 'to' | 'app' | 'screen'> =>
    t.app ? { app: t.app, screen: t.screen } : app === 'desk' ? { to: t.href } : { to: t.to ? `/field/s/${t.to}` : undefined };
  const out: DesignedLink[] = [];
  for (const [code, t] of Object.entries(nav.links ?? {})) out.push({ code, via: 'link', kind: t.kind ?? 'go', ...dest(t) });
  if (nav.auto) out.push({ code: 'auto', via: 'auto', kind: nav.auto.kind ?? 'go', ...dest(nav.auto) });
  if (nav.whole) out.push({ code: 'whole', via: 'whole', kind: nav.whole.kind ?? 'go', ...dest(nav.whole) });
  return out.filter(l => l.to || l.app);
}

/** Every link code a source names literally: data-lk="L5", 'data-lk': 'L5', lk="L5", .go('L5'), "L5": { … }. */
function codesIn(src: string): string[] {
  const out = new Set<string>();
  const res = [
    /data-lk["']?\s*[=:]\s*\{?\s*["']([A-Za-z0-9]+)["']/g,
    /\blk=\{?["']([A-Za-z0-9]+)["']/g,
    /\.go\(\s*["']([A-Za-z0-9]+)["']/g,
    /code:\s*["']([A-Za-z0-9]+)["']/g,
    /\blk:\s*["']([A-Za-z0-9]+)["']/g,
    /testID=\{?["']lk-([A-Za-z0-9]+)["']/g,
  ];
  for (const re of res) for (const m of src.matchAll(re)) out.add(m[1]);
  return [...out];
}

const read = (f: string) => readFileSync(f, 'utf8');

function deskScreens(repo: string): ScreenEntry[] {
  const out: ScreenEntry[] = [];
  const chrome = join(repo, 'frontend', 'components', 'live', 'chrome.tsx');
  const chromeCodes = existsSync(chrome) ? codesIn(read(chrome)) : [];
  for (const face of DESK_FACES) {
    const dir = join(repo, 'frontend', 'app', face);
    if (!existsSync(dir)) continue;
    for (const key of readdirSync(dir).sort()) {
      const page = join(dir, key, 'page.tsx');
      if (!existsSync(page)) continue;
      const src = read(page);
      if (!src.includes('ScreenShell')) continue; // hand-written redirects, not design screens
      const nav = parseNav(src);
      if (!nav) continue;
      const title = src.match(/title:\s*"([^"]+)"/)?.[1] ?? key;
      const [head] = title.split(' · ');
      const id = head.split(' ')[0];
      const name = head.slice(id.length).trim() || key;
      const live = src.includes('LiveSwitch');
      const liveFile = join(repo, 'frontend', 'live', `${key}.tsx`);
      const liveCodes = live && existsSync(liveFile) ? [...new Set([...codesIn(read(liveFile)), ...chromeCodes])] : [];
      out.push({
        id, name, key, app: 'desk', face, device: 'desktop', viewport: VIEWPORT.desktop,
        persona: PERSONA_BY_PREFIX[id.split('-')[0]] ?? (face === 'store' ? 'storeManager' : face === 'plan' ? 'dispatcher' : 'admin'),
        path: `/${face}/${key}`, live, entry: DESK_ENTRY.has(key), walkthrough: isWalkthrough('desk', id),
        links: toLinks(nav, 'desk'), liveCodes,
        sources: [`frontend/app/${face}/${key}/page.tsx`, ...(live ? [`frontend/live/${key}.tsx`] : [`frontend/screens/${key}.tsx`])],
      });
    }
  }
  return out;
}

function fieldScreens(repo: string): ScreenEntry[] {
  const regFile = join(repo, 'mobile', 'src', 'screens', 'registry.ts');
  if (!existsSync(regFile)) return [];
  const registry = read(regFile);
  const keys = [...registry.matchAll(/^\s+"([a-z0-9-]+)": \(\) => require/gm)].map(m => m[1]);
  const liveList = registry.match(/export const LIVE: string\[\] = (\[[^\]]*\])/);
  const LIVE = new Set<string>(liveList ? (JSON.parse(liveList[1]) as string[]) : []);
  const out: ScreenEntry[] = [];
  for (const key of keys) {
    const genFile = join(repo, 'mobile', 'src', 'screens', `${key}.tsx`);
    const liveFile = join(repo, 'mobile', 'src', 'live', `${key}.tsx`);
    const live = LIVE.has(key) && existsSync(liveFile);
    const gen = existsSync(genFile) ? read(genFile) : null;
    const liveSrc = live ? read(liveFile) : null;
    const designNav: RawNav = (gen ? parseNav(gen) : null) ?? (liveSrc ? parseNav(liveSrc) : null) ?? { links: {} };
    const header = (gen ?? liveSrc ?? '').match(/^\/\/ ([A-Z]+-[A-Z0-9]+) (.+?) \((P\d), (phone|tablet)\)\s*$/m);
    const id = header?.[1] ?? key.split('-').slice(0, 2).join('-').toUpperCase();
    const name = header?.[2] ?? key;
    const device: Device = header?.[4] === 'tablet' || /-tablet$/.test(key) ? 'tablet' : 'phone';
    const prefix = id.split('-')[0];
    const liveNav = liveSrc ? parseNav(liveSrc) : null;
    const liveLinks = liveNav && JSON.stringify(liveNav.links ?? {}) !== JSON.stringify(designNav.links ?? {}) ? liveNav.links ?? {} : undefined;
    out.push({
      id, name, key, app: 'field', face: FIELD_FACE[prefix] ?? 'field', device, viewport: VIEWPORT[device],
      persona: PERSONA_BY_PREFIX[prefix] ?? 'driver',
      path: `/field/s/${key}`, live, entry: FIELD_ENTRY.test(key), walkthrough: isWalkthrough('field', id),
      links: toLinks(designNav, 'field'),
      liveCodes: liveSrc ? [...new Set([...codesIn(liveSrc), ...Object.keys(liveNav?.links ?? {})])] : [],
      liveLinks,
      sources: [...(gen ? [`mobile/src/screens/${key}.tsx`] : []), ...(live ? [`mobile/src/live/${key}.tsx`] : [])],
    });
  }
  return out;
}

export function buildManifest(repo: string): Manifest {
  const screens = [...deskScreens(repo), ...fieldScreens(repo)];
  return {
    generatedFrom: ['frontend/app/{store,plan,admin}/*/page.tsx', 'frontend/live/*.tsx', 'mobile/src/screens/registry.ts', 'mobile/src/screens/*.tsx', 'mobile/src/live/*.tsx'],
    screens,
    totals: {
      screens: screens.length,
      desk: screens.filter(s => s.app === 'desk').length,
      field: screens.filter(s => s.app === 'field').length,
      live: screens.filter(s => s.live).length,
      static: screens.filter(s => !s.live).length,
      links: screens.reduce((n, s) => n + s.links.length, 0),
      walkthrough: screens.filter(s => s.walkthrough).length,
    },
  };
}
