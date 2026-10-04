// Design conformance (T3): every screen frame of Designing/pages P1–P6, baselined by tools/qa/design-baselines.mjs
// into tests/visual/baselines, against the live screen that implements it.
//
//   node tools/qa/design-baselines.mjs                                    (re-baseline; needs the local Designing/)
//   cd tests/e2e && npx playwright test --project=visual                  (needs the compose stack)
//
// Per screen (one soft assertion each, inside one test per persona, because the apps keep their session in the tab):
//   not implemented  no live route, or the route renders the generated static mock (desk: page.tsx without
//                    LiveSwitch; field: key not in LIVE of mobile/src/screens/registry.ts). Reported AND failing.
//   conforms         every static key element of the design is on the live screen, its box within
//                    POSITION_TOLERANCE_PX, its token-driven styles exactly equal, and the masked screenshot differs
//                    in at most MAX_DIFF_RATIO of the pixels (a pixel differs when a channel is off by more than
//                    PIXEL_TOLERANCE of 255).
//   drifted          anything else; the report keeps the live capture and the diff image.
// Live screens open at the baseline's viewport (the frame's screen area, device chrome cropped), signed in as the
// screen's persona, with the clock frozen (page.clock.setFixedTime) at DEMO_DATE 10:00 Asia/Colombo.
// Masks (painted out of both images before the diff; never position-matched): every key element whose text has a
// digit, a weekday or a month name, i.e. times, dates, ids, counts and quantities, on either side, padded by 2px.
// Data comes from the seeded scenario (DEMO_DATE day); other suites may change it, which is why those are masked.
//
// Report: tests/visual/report/index.html + report.json (+ img/ with live captures and diffs).
// The tokens test compares the style guide's tokens (tests/visual/baselines/tokens.json) with the desk app's shipped
// CSS (computed in the live app) and the field app's colours and fonts (mobile/src) — exact equality.
import type { Browser, Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_DATE, MOBILE_URL, PERSONAS, WEB_URL, type PersonaKey } from '../../lib/env';
import { expect, requireStack, test } from '../../lib/fixtures';
import { renewDeskOnNextLoad, signedInContext } from '../../lib/session';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { collect, tokenStyle } = require('../../../visual/collector.cjs') as {
  collect: (opts: { mode: 'live'; rootSelector: string | null }) => { area: Box; elements: El[] };
  tokenStyle: (kind: string, style: Record<string, string>) => Record<string, string>;
};

export const POSITION_TOLERANCE_PX = 2;
export const PIXEL_TOLERANCE = 25; // of 255, per channel
export const MAX_DIFF_RATIO = 0.01; // 1 % of the unmasked pixels
const MASK_PAD = 2;
const trace = (msg: string) => { if (process.env.VISUAL_DEBUG || /stalled/.test(msg)) console.log(`[visual] ${msg}`); };
const FROZEN_AT = new Date(`${DEMO_DATE}T10:00:00+05:30`);

const REPO = join(__dirname, '..', '..', '..', '..');
const BASELINES = join(REPO, 'tests', 'visual', 'baselines');
const REPORT = join(REPO, 'tests', 'visual', 'report');
const RESULTS = join(REPORT, 'results');
const IMG = join(REPORT, 'img');

type Box = { x: number; y: number; w: number; h: number };
type El = { key: string; kind: 'text' | 'control'; text: string; tag: string; role: string; dynamic: boolean; box: Box; style: Record<string, string> };
type Baseline = { id: string; name: string; board: string; device: 'phone' | 'tablet' | 'desktop'; key: string; live: { app: 'desk' | 'field'; face?: string; path: string }; viewport: { width: number; height: number }; elements: El[] };
type IndexEntry = { name: string; board: string; id?: string; baseline: string | null; reason?: string };
type Status = 'conforms' | 'drifted' | 'not implemented' | 'excluded' | 'error';
type Result = {
  file: string; id: string; name: string; persona?: string; app?: string; url?: string; status: Status; reason?: string;
  checked?: number; missing?: string[]; moved?: { key: string; design: Box; live: Box }[]; styles?: { key: string; prop: string; design: string; live: string }[];
  diffRatio?: number; masks?: number; images?: { baseline: string; live?: string; diff?: string }; ranAt: string;
};

const index: IndexEntry[] = JSON.parse(readFileSync(join(BASELINES, 'index.json'), 'utf8'));
const load = (file: string): Baseline => JSON.parse(readFileSync(join(BASELINES, `${file}.json`), 'utf8'));

// ---------- which screens have a live implementation (read from the app sources) ----------
const registry = readFileSync(join(REPO, 'mobile', 'src', 'screens', 'registry.ts'), 'utf8');
const FIELD_KEYS = new Set([...registry.matchAll(/^\s+"([a-z0-9-]+)": \(\) => require/gm)].map(m => m[1]));
const FIELD_LIVE = new Set<string>(JSON.parse(registry.match(/export const LIVE: string\[\] = (\[[^\]]*\])/)![1]));

function implementation(b: Baseline): { live: boolean; reason?: string } {
  if (b.live.app === 'desk') {
    const page = join(REPO, 'frontend', 'app', b.live.face!, b.key, 'page.tsx');
    if (!existsSync(page)) return { live: false, reason: `no desk route ${b.live.path}` };
    if (!readFileSync(page, 'utf8').includes('LiveSwitch')) return { live: false, reason: `${b.live.path} renders the generated static mock (no live screen)` };
    return { live: true };
  }
  if (!FIELD_KEYS.has(b.key)) return { live: false, reason: `no field route /field/s/${b.key}` };
  if (!FIELD_LIVE.has(b.key)) return { live: false, reason: `/field/s/${b.key} renders the generated static mock (not in LIVE)` };
  return { live: true };
}

const PERSONA_OF: Record<string, PersonaKey> = { SM: 'storeManager', DSP: 'dispatcher', LD: 'loader', DR: 'driver', ADM: 'admin' };
const personaOf = (id: string) => PERSONA_OF[id.split('-')[0]];

// sign-in screens and their buttons (desk: data-testid="sign-in"; field: the design link code of "Sign in")
/** Each persona's shared demo phone (backend/prisma/scenario.ts): the field app starts as that install. */
const FIELD_PHONE: Partial<Record<PersonaKey, string>> = { storeManager: 'DEV-FR-01', dispatcher: 'DEV-NP-01', loader: 'DEV-KJ-01', driver: 'DEV-RB-01' };

const screens = index.filter(i => i.baseline).map(i => load(i.baseline!)).map(b => ({ b, file: index.find(i => i.name === b.name)!.baseline!, impl: implementation(b) }));

// ---------- report ----------
function writeResult(r: Result) {
  mkdirSync(RESULTS, { recursive: true });
  const tmp = join(RESULTS, `.${r.file}.${process.pid}.tmp`);
  writeFileSync(tmp, JSON.stringify(r, null, 1));
  try { renameSync(tmp, join(RESULTS, `${r.file}.json`)); } catch { writeFileSync(join(RESULTS, `${r.file}.json`), JSON.stringify(r, null, 1)); }
  rebuildReport();
}

function readResult(f: string): Result | undefined {
  try { return JSON.parse(readFileSync(join(RESULTS, f), 'utf8')) as Result; } catch { return undefined; } // being replaced by another worker
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function rebuildReport() {
  const results: Result[] = existsSync(RESULTS)
    ? readdirSync(RESULTS).filter(f => f.endsWith('.json')).map(readResult).filter((r): r is Result => Boolean(r))
    : [];
  const order = new Map(index.map((e, i) => [e.baseline ?? e.name, i]));
  results.sort((a, b) => (order.get(a.file) ?? 0) - (order.get(b.file) ?? 0));
  const count = (s: Status) => results.filter(r => r.status === s).length;
  const summary = { conforms: count('conforms'), drifted: count('drifted'), 'not implemented': count('not implemented'), excluded: count('excluded'), error: count('error'), total: results.length };
  const thresholds = { positionTolerancePx: POSITION_TOLERANCE_PX, pixelTolerance: PIXEL_TOLERANCE, maxDiffRatio: MAX_DIFF_RATIO, frozenAt: FROZEN_AT.toISOString() };
  const json = JSON.stringify({ generatedAt: new Date().toISOString(), thresholds, summary, screens: results }, null, 1);
  const rows = results.map(r => {
    const detail = r.status === 'drifted'
      ? `${r.missing?.length ?? 0} missing · ${r.moved?.length ?? 0} moved · ${r.styles?.length ?? 0} style · diff ${((r.diffRatio ?? 0) * 100).toFixed(2)}%`
        + (r.reason ? ` · ${esc(r.reason)}` : '')
        + `<details><summary>details</summary>${r.missing?.length ? `<p><b>missing</b> ${r.missing.slice(0, 40).map(esc).join(' · ')}</p>` : ''}`
        + `${r.moved?.length ? `<p><b>moved</b> ${r.moved.slice(0, 30).map(m => `${esc(m.key)} (${m.design.x},${m.design.y} ${m.design.w}×${m.design.h} → ${m.live.x},${m.live.y} ${m.live.w}×${m.live.h})`).join(' · ')}</p>` : ''}`
        + `${r.styles?.length ? `<p><b>styles</b> ${r.styles.slice(0, 30).map(s => `${esc(s.key)} ${esc(s.prop)}: ${esc(s.design)} → ${esc(s.live)}`).join(' · ')}</p>` : ''}</details>`
      : esc(r.reason ?? (r.status === 'conforms' ? `${r.checked} elements · diff ${((r.diffRatio ?? 0) * 100).toFixed(2)}%` : ''));
    const imgs = r.images ? ['baseline', 'live', 'diff'].filter(k => (r.images as Record<string, string | undefined>)[k])
      .map(k => `<a href="${esc((r.images as Record<string, string>)[k])}"><img loading="lazy" src="${esc((r.images as Record<string, string>)[k])}" alt="${k}"></a>`).join('') : '';
    return `<tr class="s-${r.status.replace(' ', '-')}"><td><b>${esc(r.id)}</b><br><small>${esc(r.name)}</small></td><td>${esc(r.persona ?? '')}<br><small>${esc(r.url ?? '')}</small></td><td><span class="st">${esc(r.status)}</span></td><td>${detail}</td><td class="im">${imgs}</td></tr>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design conformance</title>
<style>
:root{--bg:#F4F6F9;--fg:#0F1422;--card:#fff;--line:#D8DDE6;--ok:#047857;--warn:#B45309;--bad:#B42318;--mute:#667085}
@media (prefers-color-scheme:dark){:root{--bg:#0F1422;--fg:#E9ECF2;--card:#1D2433;--line:#344054;--mute:#8F98AA}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:14px/1.45 Inter,system-ui,sans-serif}
h1{margin:0 0 4px;font-size:24px}p.m{color:var(--mute);margin:0 0 16px}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}.sum div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.sum b{font-size:20px;display:block}table{width:100%;border-collapse:collapse;background:var(--card)}
td{border-top:1px solid var(--line);padding:8px;vertical-align:top}small{color:var(--mute)}
.st{font-weight:700;white-space:nowrap}.s-conforms .st{color:var(--ok)}.s-drifted .st{color:var(--warn)}.s-not-implemented .st{color:var(--bad)}.s-excluded .st{color:var(--mute)}.s-error .st{color:var(--bad)}
.im img{height:120px;margin-right:6px;border:1px solid var(--line);border-radius:4px}.wrap{overflow-x:auto}details p{margin:4px 0;word-break:break-word}
</style></head><body><h1>Design conformance</h1>
<p class="m">Generated ${esc(new Date().toISOString())} · positions within ${POSITION_TOLERANCE_PX}px · token styles exact · screenshot diff ≤ ${MAX_DIFF_RATIO * 100}% of unmasked pixels (pixel tolerance ${PIXEL_TOLERANCE}/255) · clock frozen at ${esc(FROZEN_AT.toISOString())} · masks: text with digits, weekdays or months (times, dates, ids, counts)</p>
<div class="sum">${Object.entries(summary).map(([k, v]) => `<div><b>${v}</b>${esc(k)}</div>`).join('')}</div>
<div class="wrap"><table><thead><tr><th>Screen</th><th>Persona · URL</th><th>Status</th><th>Detail</th><th>Baseline · live · diff</th></tr></thead><tbody>
${rows}
</tbody></table></div></body></html>`;
  for (const [name, body] of [['report.json', json], ['index.html', html]] as const) {
    const tmp = join(REPORT, `.${name}.${process.pid}.tmp`);
    writeFileSync(tmp, body);
    try { renameSync(tmp, join(REPORT, name)); } catch { writeFileSync(join(REPORT, name), body); }
  }
}

// ---------- live capture ----------
async function settle(page: Page, rootSelector: string | null) {
  const t0 = Date.now();
  if (rootSelector) await page.locator(rootSelector).first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  // live screens mark loading placeholders with data-state="loading" (frontend/components/live/states.tsx)
  await page.waitForFunction(() => !document.querySelector('[data-state="loading"]'), undefined, { timeout: 15_000 }).catch(() => undefined);
  const t1 = Date.now();
  // the layout is settled when the text layout signature stops changing (data arrives, skeletons go)
  let last = '';
  let stable = 0;
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const sig = await page.evaluate(() => {
      const t = document.body.innerText;
      const r = document.body.getBoundingClientRect();
      return `${t.length}:${t.slice(0, 400)}:${document.querySelectorAll('*').length}:${r.height}`;
    });
    stable = sig === last ? stable + 1 : 0;
    last = sig;
    if (stable >= 3) { trace(`settled: root+loading ${t1 - t0} ms, stable after ${Date.now() - t1} ms`); return; }
    await page.waitForTimeout(400);
  }
  trace(`not settled after ${Date.now() - t0} ms`);
}

const FREEZE_CSS = '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';

async function diffImages(diffPage: Page, a: Buffer, b: Buffer, masks: Box[]) {
  return diffPage.evaluate(async ({ a, b, masks, tol }) => {
    const bitmap = async (s: string) => createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
    const A = await bitmap(a);
    const B = await bitmap(b);
    const w = Math.max(A.width, B.width);
    const h = Math.max(A.height, B.height);
    const pixels = (img: ImageBitmap) => { const c = new OffscreenCanvas(w, h).getContext('2d')!; c.drawImage(img, 0, 0); return c.getImageData(0, 0, w, h).data; };
    const da = pixels(A);
    const db = pixels(B);
    const masked = new Uint8Array(w * h);
    for (const m of masks) {
      for (let y = Math.max(0, Math.floor(m.y)); y < Math.min(h, Math.ceil(m.y + m.h)); y++)
        for (let x = Math.max(0, Math.floor(m.x)); x < Math.min(w, Math.ceil(m.x + m.w)); x++) masked[y * w + x] = 1;
    }
    const out = new ImageData(w, h);
    let diff = 0;
    let total = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      if (masked[p]) { out.data[i] = 120; out.data[i + 1] = 140; out.data[i + 2] = 230; out.data[i + 3] = 255; continue; }
      total++;
      const inside = x < A.width && y < A.height && x < B.width && y < B.height;
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (!inside || d > tol) { diff++; out.data[i] = 230; out.data[i + 1] = 30; out.data[i + 2] = 40; out.data[i + 3] = 255; }
      else { const g = 255 - (255 - (da[i] * 0.3 + da[i + 1] * 0.59 + da[i + 2] * 0.11)) * 0.25; out.data[i] = out.data[i + 1] = out.data[i + 2] = g; out.data[i + 3] = 255; }
    }
    const c = new OffscreenCanvas(w, h);
    c.getContext('2d')!.putImageData(out, 0, 0);
    const blob = await c.convertToBlob({ type: 'image/png' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { diff, total, ratio: total ? diff / total : 1, png: btoa(bin) };
  }, { a: a.toString('base64'), b: b.toString('base64'), masks, tol: PIXEL_TOLERANCE });
}

function compare(design: El[], live: El[]) {
  const byKey = new Map(live.map(e => [e.key, e]));
  const missing: string[] = [];
  const moved: Result['moved'] = [];
  const styles: Result['styles'] = [];
  let checked = 0;
  for (const d of design) {
    if (d.dynamic) continue;
    checked++;
    const l = byKey.get(d.key);
    if (!l) { missing.push(d.key); continue; }
    const off = Math.max(Math.abs(d.box.x - l.box.x), Math.abs(d.box.y - l.box.y), Math.abs(d.box.w - l.box.w), Math.abs(d.box.h - l.box.h));
    if (off > POSITION_TOLERANCE_PX) moved.push({ key: d.key, design: d.box, live: l.box });
    const ds = tokenStyle(d.kind, d.style) as Record<string, string>;
    const ls = tokenStyle(l.kind, l.style) as Record<string, string>;
    for (const prop of Object.keys(ds)) if (ds[prop] !== ls[prop]) styles.push({ key: d.key, prop, design: ds[prop], live: ls[prop] });
  }
  return { checked, missing, moved, styles };
}

type Session = { desk?: Page; field?: Page };

/** In-app navigation for the field app (no reload: the app keeps its restored session and screen state). */
async function fieldGo(page: Page, key: string) {
  const path = `${new URL(MOBILE_URL).pathname}s/${key}`;
  await page.evaluate(p => { window.history.pushState(null, '', p); window.dispatchEvent(new PopStateEvent('popstate', { state: null })); }, path);
  await page.waitForURL(u => u.pathname === path, { timeout: 15_000 }).catch(() => undefined);
}

async function checkScreen(session: Session, diffPage: Page, b: Baseline, file: string, who: PersonaKey): Promise<Result> {
  const page = b.live.app === 'desk' ? session.desk! : session.field!;
  await page.setViewportSize({ width: b.viewport.width, height: b.viewport.height });
  const rootSelector = b.live.app === 'desk' ? '.web-screen > .frame' : null;
  let url: string;
  if (b.live.app === 'desk') {
    url = `${WEB_URL}${b.live.path}?design=0`;
    const g0 = Date.now();
    await renewDeskOnNextLoad(page); // the frozen clock hides token expiry from the app
    await page.goto(url);
    trace(`goto ${b.live.path} ${Date.now() - g0} ms`);
  } else {
    url = `${MOBILE_URL}${b.live.path}`;
    await fieldGo(page, b.key);
  }
  await page.addStyleTag({ content: FREEZE_CSS }).catch(() => undefined);
  await settle(page, rootSelector);
  const landed = new URL(page.url()).pathname;
  const expected = new URL(url).pathname;
  const reason = landed !== expected ? `opened ${expected} but the app showed ${landed}` : undefined;

  let live: { area: Box; elements: El[] };
  try {
    live = (await page.evaluate(collect, { mode: 'live' as const, rootSelector })) as { area: Box; elements: El[] };
  } catch (e) {
    live = { area: { x: 0, y: 0, w: b.viewport.width, h: b.viewport.height }, elements: [] };
  }
  const shot = await page.screenshot({ clip: { x: live.area.x, y: live.area.y, width: Math.min(live.area.w, b.viewport.width), height: Math.min(live.area.h, b.viewport.height) }, animations: 'disabled' });
  const baselinePng = readFileSync(join(BASELINES, `${file}.png`));
  const pad = (m: Box) => ({ x: m.x - MASK_PAD, y: m.y - MASK_PAD, w: m.w + 2 * MASK_PAD, h: m.h + 2 * MASK_PAD });
  const masks = [...b.elements, ...live.elements].filter(e => e.dynamic).map(e => pad(e.box));
  const d = await diffImages(diffPage, baselinePng, shot, masks);
  const cmp = compare(b.elements, live.elements);
  const ok = !reason && cmp.missing.length === 0 && cmp.moved!.length === 0 && cmp.styles!.length === 0 && d.ratio <= MAX_DIFF_RATIO;

  mkdirSync(IMG, { recursive: true });
  const images: Result['images'] = { baseline: `../baselines/${file}.png` };
  if (!ok) {
    writeFileSync(join(IMG, `${file}.live.png`), shot);
    writeFileSync(join(IMG, `${file}.diff.png`), Buffer.from(d.png, 'base64'));
    images.live = `img/${file}.live.png`;
    images.diff = `img/${file}.diff.png`;
  }
  return {
    file, id: b.id, name: b.name, persona: PERSONAS[who].username, app: b.live.app, url, status: ok ? 'conforms' : 'drifted', reason,
    checked: cmp.checked, missing: cmp.missing, moved: cmp.moved, styles: cmp.styles, diffRatio: Math.round(d.ratio * 10000) / 10000,
    masks: masks.length, images, ranAt: new Date().toISOString(),
  };
}

const summarize = (r: Result) => r.status === 'conforms' ? 'conforms'
  : `${r.status}${r.reason ? ` (${r.reason})` : ''}: ${r.missing?.length ?? 0} missing, ${r.moved?.length ?? 0} moved > ${POSITION_TOLERANCE_PX}px, ${r.styles?.length ?? 0} style mismatches, diff ${((r.diffRatio ?? 0) * 100).toFixed(2)}% (max ${MAX_DIFF_RATIO * 100}%)`;

// ---------- tests ----------
// the same Chromium build as tools/qa/design-baselines.mjs (the full build in headless mode)
// No traces: they would hold every screenshot and diff payload and take minutes to write. The report has the images.
test.use({ channel: process.env.E2E_BROWSER_CHANNEL || 'chromium', trace: 'off' });

test.describe('Design conformance', { tag: '@stack' }, () => {
  // deterministic comparisons: a retry would only repeat the same verdict
  test.describe.configure({ retries: 0 });

  // Frames that are not screens (component sheets) are listed in the report too.
  test('frames without a screen are listed as excluded', () => {
    for (const e of index.filter(i => !i.baseline)) {
      writeResult({ file: e.name.replace(/[^A-Za-z0-9-]+/g, '_'), id: e.id ?? '—', name: e.name, status: 'excluded', reason: e.reason, ranAt: new Date().toISOString() });
    }
  });

  // The assertions bite: a baseline against itself conforms; one moved element, one changed colour or a painted
  // band over 3 % of the screen each turn it into drift (no stack needed).
  test('the comparison accepts an identical screen and rejects perturbed ones', async ({ browser }) => {
    const file = screens.find(s => s.b.id === 'SM-11')?.file ?? screens[0].file;
    const b = load(file);
    const png = readFileSync(join(BASELINES, `${file}.png`));
    const page = await browser.newPage();
    try {
      const masks = b.elements.filter(e => e.dynamic).map(e => e.box);
      const same = compare(b.elements, b.elements);
      expect(same.checked).toBeGreaterThan(0);
      expect([same.missing.length, same.moved!.length, same.styles!.length]).toEqual([0, 0, 0]);
      expect((await diffImages(page, png, png, masks)).ratio).toBe(0);

      const target = b.elements.find(e => !e.dynamic && e.kind === 'text')!;
      const shifted = b.elements.map(e => e === target ? { ...e, box: { ...e.box, x: e.box.x + POSITION_TOLERANCE_PX + 1 } } : e);
      expect(compare(b.elements, shifted).moved!.map(m => m.key)).toEqual([target.key]);
      const nudged = b.elements.map(e => e === target ? { ...e, box: { ...e.box, x: e.box.x + POSITION_TOLERANCE_PX } } : e);
      expect(compare(b.elements, nudged).moved).toEqual([]);
      const recoloured = b.elements.map(e => e === target ? { ...e, style: { ...e.style, color: 'rgb(1, 2, 3)' } } : e);
      expect(compare(b.elements, recoloured).styles!.map(x => `${x.key} ${x.prop}`)).toEqual([`${target.key} color`]);
      const dropped = b.elements.filter(e => e !== target);
      expect(compare(b.elements, dropped).missing).toEqual([target.key]);

      const paint = async (fraction: number) => Buffer.from(await page.evaluate(async ({ src, fraction }) => {
        const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${src}`)).blob());
        const c = new OffscreenCanvas(img.width, img.height);
        const g = c.getContext('2d')!;
        g.drawImage(img, 0, 0);
        g.fillStyle = 'rgb(255, 0, 255)';
        g.fillRect(0, 0, img.width, Math.ceil(img.height * fraction)); // a full-width band at the top
        const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(bin);
      }, { src: png.toString('base64'), fraction }), 'base64');
      expect((await diffImages(page, png, await paint(0.03), [])).ratio).toBeGreaterThan(MAX_DIFF_RATIO);
    } finally {
      await page.close();
    }
  });

  for (const who of Object.keys(PERSONAS) as PersonaKey[]) {
    const mine = screens.filter(s => personaOf(s.b.id) === who);
    const missing = mine.filter(s => !s.impl.live);
    const live = mine.filter(s => s.impl.live);

    test(`${who}: ${missing.length} designed screens without a live implementation`, () => {
      for (const s of missing) {
        writeResult({ file: s.file, id: s.b.id, name: s.b.name, persona: PERSONAS[who].username, app: s.b.live.app, url: s.b.live.path, status: 'not implemented', reason: s.impl.reason, images: { baseline: `../baselines/${s.file}.png` }, ranAt: new Date().toISOString() });
        expect.soft(s.impl.live, `${s.file} (${s.b.name}): not implemented — ${s.impl.reason}`).toBe(true);
      }
    });

    test.describe(() => {
      requireStack();
      test(`${who}: ${live.length} live screens match the design`, async ({ browser }) => {
        test.setTimeout(60_000 + live.length * 25_000);
        const t0 = Date.now();
        let session: Session;
        try {
          session = await openSessions(browser, who, live.map(s => s.b));
        } catch (e) {
          // never silently missing from the report: every screen of the persona is recorded as not checked
          for (const s of live) writeResult({ file: s.file, id: s.b.id, name: s.b.name, persona: PERSONAS[who].username, app: s.b.live.app, url: s.b.live.path, status: 'error', reason: `not checked: sign-in failed (${String(e).split('\n')[0].slice(0, 160)})`, images: { baseline: `../baselines/${s.file}.png` }, ranAt: new Date().toISOString() });
          throw e;
        }
        trace(`${who}: signed in in ${Date.now() - t0} ms`);
        const diffPage = await browser.newPage();
        try {
          for (const s of live) {
            await test.step(`${s.file} · ${s.b.name}`, async () => {
              let r: Result;
              try {
                r = await checkScreen(session, diffPage, s.b, s.file, who);
              } catch (e) {
                r = { file: s.file, id: s.b.id, name: s.b.name, persona: PERSONAS[who].username, app: s.b.live.app, url: s.b.live.path, status: 'error', reason: `could not be checked: ${String(e).split('\n')[0].slice(0, 200)}`, images: { baseline: `../baselines/${s.file}.png` }, ranAt: new Date().toISOString() };
              }
              writeResult(r);
              trace(`${s.file}: ${r.status} at ${new Date().toISOString()}`);
              expect.soft(r.status, `${s.file} (${s.b.name}): ${summarize(r)}`).toBe('conforms');
            });
          }
        } finally {
          await diffPage.close();
          await session.desk?.context().close();
          await session.field?.context().close();
        }
      });
    });
  }

  test.describe(() => {
    requireStack();
    test('style-guide tokens equal the shipped CSS (desk) and the field app palette and fonts', async ({ browser }) => {
      const tokens = JSON.parse(readFileSync(join(BASELINES, 'tokens.json'), 'utf8')) as { root: Record<string, string>; modes: Record<string, Record<string, string>>; fonts: string[]; palette: string[] };
      const page = await browser.newPage({ ignoreHTTPSErrors: true });
      try {
        await page.goto(`${WEB_URL}/store/sm-26-sign-in?design=0`);
        await page.locator('body').waitFor();
        const names = [...new Set([...Object.keys(tokens.root), ...Object.values(tokens.modes).flatMap(m => Object.keys(m))])];
        // Exact equality of the resolved values: both sides go through the browser's own serialisation (the desk CSS is
        // minified: #FFFFFF ships as #fff, rgba(15,20,50,.04) as #0f14320a, quotes change), nothing else is normalised.
        const deskDiffs = await page.evaluate(({ names, design }) => {
          const canon = (v: string) => {
            const probe = document.createElement('div');
            document.body.appendChild(probe);
            try {
              for (const prop of ['color', 'box-shadow', 'background-image', 'font-family', 'width', 'border-radius']) {
                if (CSS.supports(prop, v)) { probe.style.setProperty(prop, v); return getComputedStyle(probe).getPropertyValue(prop); }
              }
              return v.replace(/\s+/g, ' ').trim();
            } finally { probe.remove(); }
          };
          const read = (el: Element) => { const cs = getComputedStyle(el); const o: Record<string, string> = {}; for (const n of names) o[n] = cs.getPropertyValue(n).trim(); return o; };
          const out: string[] = [];
          const check = (where: string, want: Record<string, string>, have: Record<string, string>) => {
            for (const [k, v] of Object.entries(want)) {
              if (!have[k]) out.push(`${where} ${k}: design ${v} · desk (missing)`);
              else if (canon(have[k]) !== canon(v)) out.push(`${where} ${k}: design ${v} · desk ${have[k]}`);
            }
          };
          check(':root', design.root, read(document.documentElement));
          for (const [m, vals] of Object.entries(design.modes)) {
            const el = document.createElement('div');
            el.className = `frame ${m}`;
            document.body.appendChild(el);
            check(`.${m}`, vals, read(el));
            el.remove();
          }
          return out;
        }, { names, design: { root: tokens.root, modes: tokens.modes } });
        expect.soft(deskDiffs, 'desk CSS custom properties equal the style guide').toEqual([]);
      } finally {
        await page.close();
      }

      // field app (react-native-web has no CSS variables): every colour literal in its Lodestar code is a design colour,
      // and the design's typefaces are the ones it loads
      const palette = new Set(tokens.palette);
      const offPalette: string[] = [];
      for (const dir of ['lodestar', 'live', 'screens']) {
        const base = join(REPO, 'mobile', 'src', dir);
        for (const f of readdirSync(base).filter(n => /\.tsx?$/.test(n))) {
          const src = readFileSync(join(base, f), 'utf8');
          for (const m of src.matchAll(/['"]#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})['"]/g)) {
            let h = m[1].toUpperCase();
            if (h.length === 3) h = [...h].map(c => c + c).join('');
            if (!palette.has(`#${h}`)) offPalette.push(`${dir}/${f}: #${h}`);
          }
        }
      }
      expect.soft([...new Set(offPalette)], 'field app colours are design palette colours').toEqual([]);
      const fonts = readFileSync(join(REPO, 'mobile', 'src', 'lodestar', 'fonts.ts'), 'utf8');
      const loaded = tokens.fonts.filter(f => fonts.includes(f.replace(/\s+/g, '')));
      expect.soft(loaded, 'field app loads the design typefaces').toEqual(tokens.fonts);
    });
  });
});

async function openSessions(browser: Browser, who: PersonaKey, list: Baseline[]): Promise<Session> {
  const session: Session = {};
  const opts = { ignoreHTTPSErrors: true, deviceScaleFactor: 1 };
  // one sign-in per app (on the designed sign-in screens), reused from the saved persona session when there is one
  if (list.some(b => b.live.app === 'desk')) {
    session.desk = (await signedInContext(browser, who, 'desk', opts)).page;
    await session.desk.clock.setFixedTime(FROZEN_AT);
  }
  if (list.some(b => b.live.app === 'field')) {
    const phone = FIELD_PHONE[who];
    const origin = new URL(MOBILE_URL).origin;
    session.field = (await signedInContext(browser, who, 'field', opts, async ctx => {
      if (phone) await ctx.addInitScript(({ origin, id }) => { if (window.location.origin === origin) window.localStorage.setItem('lodestar.device-id', id); }, { origin, id: phone });
    })).page;
    await session.field.clock.setFixedTime(FROZEN_AT);
  }
  return session;
}
