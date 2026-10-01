// Renders each native screen in the Expo web preview next to its design frame and writes
// side-by-side PNGs (design | app) to out/cmp-mobile/, plus a pixel-difference score.
// Usage: node compare-mobile.js [filter] [base-url]   (expo start --web running, default http://localhost:8081)
const fs = require('fs');
const path = require('path');
const puppeteer = require('./puppeteer');
const FILTER = process.argv[2] || '';
const BASE = process.argv[3] || 'http://localhost:8081';
const REPO = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'cmp-mobile');
const { frames } = require('./out/screens.json');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 240000, args: ['--allow-file-access-from-files', '--hide-scrollbars'] });
  const design = await b.newPage(), app = await b.newPage(), cmp = await b.newPage();
  await design.setViewport({ width: 1600, height: 1200 });
  await cmp.setViewport({ width: 400, height: 300 });
  const res = [];
  let board = null;
  for (const f of frames.filter(x => x.plat !== 'desktop' && x.key.includes(FILTER))) {
    const file = fs.readdirSync(path.join(REPO, 'Designing', 'pages')).find(x => x.startsWith(f.board + '-'));
    await design.bringToFront();
    if (board !== file) { await design.goto('file:///' + path.join(REPO, 'Designing', 'pages', file).replace(/\\/g, '/'), { waitUntil: 'networkidle0' }); await design.evaluate(() => document.fonts.ready); board = file; }
    const el = await design.$(`.frame[data-name="${f.name.replace(/"/g, '\\"')}"]`);
    // the device supplies bezel, status bar and home indicator: compare what sits between them
    const m = await el.evaluate(e => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      const bw = parseFloat(cs.borderLeftWidth) || 0;
      const sb = e.querySelector('.statusbar'), hb = e.querySelector('.homebar');
      const top = sb && sb.offsetParent !== null ? sb.getBoundingClientRect().bottom - r.top : bw;
      const bot = hb && hb.offsetParent !== null ? r.bottom - hb.getBoundingClientRect().top : bw;
      return { w: r.width - 2 * bw, h: r.height - top - bot, top, bw };
    });
    const shot = await el.screenshot({ encoding: 'base64' });
    await app.bringToFront();
    await app.setViewport({ width: Math.round(m.w), height: Math.round(m.h) });
    await app.goto(`${BASE}/s/${f.key}`, { waitUntil: 'load', timeout: 240000 });
    await app.waitForFunction(() => document.fonts.status === 'loaded' && document.querySelectorAll('svg').length > 0, { timeout: 60000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 700));
    const a = await app.screenshot({ encoding: 'base64' });
    await cmp.bringToFront();
    const out = await cmp.evaluate(async (d, a, m) => {
      const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
      const [id, ia] = await Promise.all([load(d), load(a)]);
      const w = Math.round(m.w), h = Math.round(m.h);
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.drawImage(id, -m.bw, -m.top); const dd = x.getImageData(0, 0, w, h).data;
      x.clearRect(0, 0, w, h); x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, w, h).data;
      let n = 0; for (let i = 0; i < dd.length; i += 4) if (Math.abs(dd[i] - da[i]) + Math.abs(dd[i + 1] - da[i + 1]) + Math.abs(dd[i + 2] - da[i + 2]) > 60) n++;
      const s = document.createElement('canvas'); s.width = w * 2 + 12; s.height = h; const y = s.getContext('2d');
      y.fillStyle = '#ff00aa'; y.fillRect(0, 0, s.width, h);
      y.drawImage(id, -m.bw, -m.top); y.drawImage(ia, w + 12, 0);
      return { diff: n / (dd.length / 4), png: s.toDataURL('image/png').split(',')[1] };
    }, shot, a, m);
    fs.writeFileSync(path.join(OUT, f.key + '.png'), Buffer.from(out.png, 'base64'));
    res.push({ key: f.key, diff: out.diff });
    process.stdout.write('.');
  }
  console.log();
  res.sort((x, y) => y.diff - x.diff);
  for (const r of res) console.log((r.diff * 100).toFixed(2).padStart(6) + '%  ' + r.key);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
