#!/usr/bin/env node
// Design-conformance baselines (T3): renders every screen frame of Designing/pages/P1–P6 with the Playwright
// Chromium that tests/e2e uses and writes, per screen,
//   tests/visual/baselines/<NAME>.png   the screen area of the frame (device chrome cropped, see below)
//   tests/visual/baselines/<NAME>.json  viewport, live mapping and the key elements (box relative to the screen
//                                       area + computed styles), from tests/visual/collector.cjs
// plus tests/visual/baselines/index.json (every frame, including the ones without a screen id) and
// tests/visual/baselines/tokens.json (the CSS custom properties of Designing/assets as the style guide resolves
// them, per role mode, and the design palette).
//
// <NAME> is the screen id (SM-02); ids drawn more than once (phone + desktop, day + daylight, two states) get a
// variant suffix: SM-02--order-status-and-eta-phone, SM-02--deliveries-desktop.
// Device chrome drawn in a frame (phone status bar + home indicator, desktop browser bar) is cropped: the apps
// run full-window under the real OS / browser chrome. Frame corners are squared for the capture.
//
//   node tools/qa/design-baselines.mjs            (Designing/ is local only; the outputs are ours to commit)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DESIGN = join(ROOT, 'Designing');
const OUT = join(ROOT, 'tests', 'visual', 'baselines');
const require = createRequire(join(ROOT, 'tests', 'e2e', 'package.json'));
const { chromium } = require('@playwright/test');
const { collect } = createRequire(import.meta.url)(join(ROOT, 'tests', 'visual', 'collector.cjs'));

const PAGES = [
  ['P1', 'P1-screens-store.html'],
  ['P2', 'P2-screens-dispatcher.html'],
  ['P3', 'P3-screens-loader.html'],
  ['P4', 'P4-screens-driver.html'],
  ['P5', 'P5-screens-degradation.html'],
  ['P6', 'P6-screens-admin.html'],
];
const DESK_FACE = { P1: 'store', P2: 'plan', P5: 'plan', P6: 'admin' };

const FREEZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  .frame { border-radius: 0 !important; box-shadow: none !important; }`;

const slug = s => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** tools/screengen's key for a frame: the name without the "phone" / "desktop" device words. */
const screenKey = name => slug(name.split('·').map(p => p.trim()).filter(p => !/^(phone|Phone|desktop|tablet)$/.test(p)).join(' ')); // as tools/screengen names them (LD-02 · Tablet keeps its suffix)
const screenId = name => name.match(/^([A-Z]{2,4}-[A-Za-z0-9]+)\b/)?.[1] ?? null;

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  // The same browser build as the visual project (tests/e2e: channel 'chromium' unless E2E_BROWSER_CHANNEL is set).
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || 'chromium' });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const frames = [];

  for (const [board, file] of PAGES) {
    await page.goto(pathToFileURL(join(DESIGN, 'pages', file)).href, { waitUntil: 'load' });
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.evaluate(() => document.fonts.ready);
    const fontsOk = await page.evaluate(() => document.fonts.check('600 16px Inter') && document.fonts.check('800 22px "Plus Jakarta Sans"'));
    if (!fontsOk) console.warn(`${file}: web fonts did not load (Inter / Plus Jakarta Sans); baselines need network access to Google Fonts`);
    const found = await page.$$eval('.frame[data-name]', els => els.map(e => ({ name: e.getAttribute('data-name'), cls: e.className })));
    for (const f of found) {
      const device = /frame--desktop/.test(f.cls) ? 'desktop' : /frame--tablet/.test(f.cls) ? 'tablet' : /frame--phone/.test(f.cls) ? 'phone' : 'component';
      frames.push({ board, file, name: f.name, device, tall: /frame--tall/.test(f.cls), id: screenId(f.name), key: screenKey(f.name) });
    }
  }

  // file names
  const byId = new Map();
  for (const f of frames) if (f.id) byId.set(f.id, (byId.get(f.id) ?? 0) + 1);
  for (const f of frames) {
    if (!f.id) continue;
    f.file_name = byId.get(f.id) === 1 ? f.id : `${f.id}--${slug(f.name.replace(f.id, '').replace(/·/g, ' ')) || f.device}`;
  }

  const index = [];
  let current = '';
  for (const f of frames) {
    if (!f.id || f.device === 'component') {
      index.push({ name: f.name, board: f.board, baseline: null, reason: !f.id ? 'no screen id (component state)' : 'component sheet, not a screen' });
      continue;
    }
    if (current !== f.file) {
      await page.goto(pathToFileURL(join(DESIGN, 'pages', f.file)).href, { waitUntil: 'load' });
      await page.addStyleTag({ content: FREEZE_CSS });
      await page.evaluate(() => document.fonts.ready);
      current = f.file;
    }
    const frame = page.locator(`.frame[data-name="${f.name.replace(/"/g, '\\"')}"]`);
    await frame.scrollIntoViewIfNeeded();
    const data = await page.evaluate(collect, { mode: 'design', frameName: f.name });
    // capture exactly the screen area: a transparent probe placed over it, screenshotted as an element
    await page.evaluate(a => {
      const p = document.createElement('div');
      p.id = '__probe';
      Object.assign(p.style, { position: 'absolute', left: `${a.x + scrollX}px`, top: `${a.y + scrollY}px`, width: `${a.w}px`, height: `${a.h}px`, pointerEvents: 'none', zIndex: '-1' });
      document.body.appendChild(p);
    }, data.area);
    await page.locator('#__probe').screenshot({ path: join(OUT, `${f.file_name}.png`), animations: 'disabled' });
    await page.evaluate(() => document.getElementById('__probe')?.remove());

    const live = f.device === 'desktop'
      ? { app: 'desk', face: DESK_FACE[f.board], path: `/${DESK_FACE[f.board]}/${f.key}` }
      : { app: 'field', path: `s/${f.key}` };
    const baseline = {
      id: f.id, name: f.name, board: f.board, device: f.device, key: f.key, live,
      viewport: { width: data.area.w, height: data.area.h },
      elements: data.elements,
    };
    writeFileSync(join(OUT, `${f.file_name}.json`), JSON.stringify(baseline, null, 1));
    index.push({ name: f.name, board: f.board, id: f.id, baseline: f.file_name, device: f.device, key: f.key, viewport: baseline.viewport, elements: data.elements.length });
    console.log(`${f.file_name.padEnd(48)} ${f.device.padEnd(8)} ${data.area.w}x${data.area.h}  ${data.elements.length} elements`);
  }
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 1));

  // tokens: every custom property declared in Designing/assets, resolved by the style guide page per context
  const css = readdirSync(join(DESIGN, 'assets')).filter(n => n.endsWith('.css')).map(n => readFileSync(join(DESIGN, 'assets', n), 'utf8')).join('\n');
  const names = [...new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(m => m[1]))].sort();
  const modes = [...new Set([...css.matchAll(/\.(mode-[a-z0-9-]+)\s*[{,]/gi)].map(m => m[1]))].sort();
  await page.goto(pathToFileURL(join(DESIGN, 'pages', '10-style-guide.html')).href, { waitUntil: 'load' });
  const tokens = await page.evaluate(({ names, modes }) => {
    const read = el => { const cs = getComputedStyle(el); const o = {}; for (const n of names) { const v = cs.getPropertyValue(n).trim(); if (v) o[n] = v; } return o; };
    const root = read(document.documentElement);
    const byMode = {};
    for (const m of modes) {
      const el = document.createElement('div');
      el.className = `frame ${m}`;
      document.body.appendChild(el);
      const all = read(el);
      byMode[m] = Object.fromEntries(Object.entries(all).filter(([k, v]) => root[k] !== v));
      el.remove();
    }
    return { root, modes: byMode };
  }, { names, modes });
  const hexes = new Set();
  const addHex = text => { for (const m of text.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) { let h = m[1].toUpperCase(); if (h.length === 3) h = [...h].map(c => c + c).join(''); hexes.add('#' + h); } };
  addHex(css);
  for (const [, file] of PAGES) addHex(readFileSync(join(DESIGN, 'pages', file), 'utf8'));
  writeFileSync(join(OUT, 'tokens.json'), JSON.stringify({
    source: 'Designing/assets/*.css as resolved by Designing/pages/10-style-guide.html',
    root: tokens.root,
    modes: tokens.modes,
    fonts: ['Inter', 'JetBrains Mono', 'Plus Jakarta Sans'],
    palette: [...hexes].sort(),
  }, null, 1));
  console.log(`\n${index.filter(i => i.baseline).length} baselines, ${index.filter(i => !i.baseline).length} frames without a screen id; ${Object.keys(tokens.root).length} root tokens, ${modes.length} modes, ${hexes.size} palette colours → ${OUT}`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
