// Screenshots each website screen and the matching design frame at 1440x900 and reports the
// share of pixels that differ. Writes side-by-side PNGs for the worst screens to out/cmp-web/.
// Usage: node compare-web.js [base-url]   (website running, default http://localhost:3100)
const fs = require('fs');
const path = require('path');
const puppeteer = require('./puppeteer');
const BASE = process.argv[2] || 'http://localhost:3100';
const REPO = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out', 'cmp-web');
const { frames } = require('./out/screens.json');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files', '--hide-scrollbars'] });
  const design = await b.newPage(), web = await b.newPage(), cmp = await b.newPage();
  await design.setViewport({ width: 1600, height: 1000 });
  await web.setViewport({ width: 1440, height: 900 });
  await cmp.setViewport({ width: 400, height: 300 });
  const res = [];
  let board = null;
  for (const f of frames.filter(x => x.plat === 'desktop')) {
    const file = fs.readdirSync(path.join(REPO, 'Designing', 'pages')).find(x => x.startsWith(f.board + '-'));
    if (board !== file) { await design.goto('file:///' + path.join(REPO, 'Designing', 'pages', file).replace(/\\/g, '/'), { waitUntil: 'networkidle0' }); await design.evaluate(() => document.fonts.ready); board = file; }
    await design.bringToFront();
    const el = await design.$(`.frame[data-name="${f.name.replace(/"/g, '\\"')}"]`);
    await el.evaluate(e => e.scrollIntoView({ block: 'start', inline: 'start' })); await new Promise(r => setTimeout(r, 100));
    // design: skip the 1px bezel and the browser bar (the website has neither)
    const box = await el.boundingBox();
    const bb = await el.evaluate(e => { const x = e.querySelector('.browserbar'); return x ? x.getBoundingClientRect().height : 0; });
    void box; const a = await el.screenshot({ encoding: 'base64' });
    await web.bringToFront();
    await web.goto(BASE + `/${f.app}/${f.key}`, { waitUntil: 'networkidle0' });
    await web.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 150));
    const w = await web.screenshot({ encoding: 'base64' });
    await cmp.bringToFront();
    const diff = await cmp.evaluate(async (a, w, bb) => {
      const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, iw] = await Promise.all([load(a), load(w)]);
      const c = document.createElement('canvas'); c.width = 1438; c.height = 898 - bb; const x = c.getContext('2d');
      x.drawImage(ia, -1, -1 - bb); const da = x.getImageData(0, 0, c.width, c.height).data;
      x.clearRect(0, 0, c.width, c.height); x.drawImage(iw, 0, 0); const dw = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - dw[i]) + Math.abs(da[i + 1] - dw[i + 1]) + Math.abs(da[i + 2] - dw[i + 2]) > 60) n++;
      return n / (da.length / 4);
    }, a, w, bb);
    res.push({ key: f.key, diff });
    fs.writeFileSync(path.join(OUT, f.key + '.design.png'), Buffer.from(a, 'base64'));
    fs.writeFileSync(path.join(OUT, f.key + '.web.png'), Buffer.from(w, 'base64'));
  }
  res.sort((x, y) => y.diff - x.diff);
  for (const r of res) console.log((r.diff * 100).toFixed(2).padStart(6) + '%  ' + r.key);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
