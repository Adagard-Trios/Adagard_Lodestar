// Builds the link manifest the click-through spec iterates over. Runs in Node (cypress.config.ts).
//
// Source of truth, in order:
//   1. tools/screengen/out/screens.json  (the generator's intermediate output; gitignored, so local only)
//   2. frontend/app/<store|plan|admin>/<screen>/page.tsx  (the `nav` table of every generated page; always present)
import fs from 'node:fs';
import path from 'node:path';
import type { ScreenLink, ScreenManifest, ScreenSpec } from '../support/types';

const FACES = ['store', 'plan', 'admin'] as const;

type Target = { href?: string; app?: string; screen?: string; kind?: string };
type Nav = { links: Record<string, Target>; auto?: Target; whole?: Target };

type Frame = {
  id: string; name: string; key: string; app: string; plat: string;
  links: Record<string, { to?: string; kind?: string; label?: string }>;
  auto: string | null; whole: string | null;
};

const APP_TITLES: Record<string, string> = {
  store: 'Lodestar Store', plan: 'Lodestar Plan', admin: 'Lodestar Admin', dock: 'Lodestar Dock', run: 'Lodestar Run',
};

function fromScreensJson(file: string): ScreenSpec[] {
  const { frames } = JSON.parse(fs.readFileSync(file, 'utf8')) as { frames: Frame[] };
  // A key can exist on several platforms; the website renders the desktop frame.
  const desktop = new Map<string, Frame>();
  const any = new Map<string, Frame>();
  for (const f of frames) {
    if (f.plat === 'desktop') desktop.set(f.key, f);
    if (!any.has(f.key)) any.set(f.key, f);
  }
  const toTarget = (key: string | null | undefined, kind?: string): Omit<ScreenLink, 'code'> | null => {
    if (!key) return null;
    const d = desktop.get(key);
    if (d) return { kind: kind ?? 'go', to: `/${d.app}/${d.key}` };
    const m = any.get(key);
    if (!m) return null; // dangling link: the generator drops it too
    return { kind: kind ?? 'go', app: APP_TITLES[m.app] ?? m.app, screen: m.name?.split(' · ')[0] ?? m.id };
  };

  return [...desktop.values()]
    .filter(f => (FACES as readonly string[]).includes(f.app))
    .map(f => {
      const links: ScreenLink[] = [];
      for (const [code, l] of Object.entries(f.links)) {
        const t = toTarget(l.to, l.kind);
        if (t) links.push({ code, label: l.label, ...t });
      }
      const auto = toTarget(f.auto) ?? undefined;
      return { key: f.key, id: f.id, app: f.app, path: `/${f.app}/${f.key}`, links, auto: auto && { ...auto, code: 'auto' } };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Pulls the `const nav = {...};` JSON literal out of a generated page.tsx. */
export function parseNav(source: string): Nav | null {
  const m = source.match(/const nav\s*=\s*(\{[\s\S]*?\});\s*\n\s*export default/);
  if (!m) return null;
  return JSON.parse(m[1]) as Nav;
}

function toLink(code: string, t: Target): ScreenLink | null {
  if (t.href) return { code, kind: t.kind ?? 'go', to: t.href };
  if (t.app) return { code, kind: t.kind ?? 'go', app: t.app, screen: t.screen };
  return null;
}

function fromPages(appDir: string): ScreenSpec[] {
  const out: ScreenSpec[] = [];
  for (const face of FACES) {
    const dir = path.join(appDir, face);
    if (!fs.existsSync(dir)) continue;
    for (const key of fs.readdirSync(dir)) {
      const page = path.join(dir, key, 'page.tsx');
      if (!fs.existsSync(page)) continue;
      const src = fs.readFileSync(page, 'utf8');
      if (!src.includes('ScreenShell')) continue; // hand-written routes are not part of the design click-through
      const nav = parseNav(src);
      if (!nav) continue;
      const links = Object.entries(nav.links)
        .map(([code, t]) => toLink(code, t))
        .filter((l): l is ScreenLink => l !== null);
      const auto = nav.auto ? toLink('auto', nav.auto) ?? undefined : undefined;
      const id = key.split('-').slice(0, 2).join('-').toUpperCase();
      out.push({ key, id, app: face, path: `/${face}/${key}`, links, auto });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function loadScreens(frontendRoot: string): ScreenManifest {
  const json = path.resolve(frontendRoot, '..', 'tools', 'screengen', 'out', 'screens.json');
  const forced = process.env.SCREENS_SOURCE; // 'json' | 'pages'
  if (forced !== 'pages' && fs.existsSync(json)) {
    return { source: 'tools/screengen/out/screens.json', screens: fromScreensJson(json) };
  }
  return { source: 'frontend/app/**/page.tsx', screens: fromPages(path.join(frontendRoot, 'app')) };
}
