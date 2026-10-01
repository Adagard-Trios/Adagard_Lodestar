// Clicks every wired element on every screen and checks where it lands.
//   node clicktest.js web    [base]   website   (default http://localhost:3100)
//   node clicktest.js mobile [base]   app's web preview (default http://localhost:8081)
// Back arrows are checked for the parent screen when opened directly (no history to go back to).
const path = require('path');
const puppeteer = require('./puppeteer');
const { frames } = require('./out/screens.json');
const MODE = process.argv[2] || 'web';
const BASE = process.argv[3] || (MODE === 'web' ? 'http://localhost:3100' : 'http://localhost:8081');
const byKey = Object.fromEntries(frames.map(f => [f.key, f]));
const urlOf = f => (MODE === 'web' ? `/${f.app}/${f.key}` : `/s/${f.key}`);

(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 240000 });
  const page = await b.newPage();
  const list = frames.filter(f => (MODE === 'web' ? f.plat === 'desktop' : f.plat !== 'desktop'));
  let ok = 0, notice = 0;
  const bad = [];
  for (const f of list) {
    await page.setViewport(MODE === 'web' ? { width: 1440, height: 900 } : f.plat === 'tablet' ? { width: 1004, height: 748 } : { width: 374, height: 780 });
    for (const [code, l] of Object.entries(f.links)) {
      const dest = l.to && byKey[l.to];
      if (!dest) continue;
      await page.goto(BASE + urlOf(f), { waitUntil: MODE === 'web' ? 'networkidle0' : 'networkidle2', timeout: 240000 });
      const sel = MODE === 'web' ? `[data-lk="${code}"]` : `[data-testid="lk-${code}"]`;
      const el = await page.waitForSelector(sel, { timeout: 30000 }).catch(() => null);
      if (!el) { bad.push(`${f.key} ${code} "${l.label || l.kind}": element not rendered`); continue; }
      await el.evaluate(e => e.scrollIntoView({ block: 'center' }));
      const before = page.url();
      await el.click().catch(async () => el.evaluate(e => e.click()));
      const crossDevice = (MODE === 'web') !== (dest.plat === 'desktop');
      if (crossDevice) {
        const shown = await page.waitForFunction(() => /Continues in/.test(document.body.innerText), { timeout: 5000 }).then(() => true, () => false);
        if (shown) notice++; else bad.push(`${f.key} ${code} -> ${dest.key}: no cross-device notice`);
        continue;
      }
      const want = urlOf(dest);
      const arrived = await page.waitForFunction(w => location.pathname === w, { timeout: MODE === 'web' ? 15000 : 60000 }, want).then(() => true, () => false);
      if (arrived) ok++; else bad.push(`${f.key} ${code} "${l.label || l.kind}" -> expected ${want}, at ${new URL(page.url()).pathname} (was ${new URL(before).pathname})`);
    }
    process.stdout.write('.');
  }
  console.log(`\n${MODE}: ${ok} links navigate correctly, ${notice} cross-device notices, ${bad.length} problems`);
  bad.forEach(x => console.log('  ' + x));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
