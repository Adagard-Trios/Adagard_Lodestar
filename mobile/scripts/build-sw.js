// After `expo export --platform web`: writes <dist>/sw.js from scripts/sw.js with the app shell to cache at
// install (every pre-rendered screen, the bundles, the fonts the screens preload, icons) and a version taken from
// the content of those files, so a new build is a new cache. Usage: node scripts/build-sw.js [dist]
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'sw.js');

function walk(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(dir, r));
    else out.push(r);
  }
  return out;
}

/** The URL a pre-rendered screen is requested at (nginx serves /s/x from s/x.html). */
function pageUrl(prefix, rel) {
  if (rel === 'index.html') return `${prefix}/`;
  if (rel.endsWith('/index.html')) return `${prefix}/${rel.slice(0, -'index.html'.length)}`;
  return `${prefix}/${rel.slice(0, -'.html'.length)}`;
}

/** [url, file] pairs to precache, from an export in `dist` served under `prefix` (e.g. /field). */
function precache(dist, prefix) {
  const files = walk(dist);
  const have = new Set(files);
  const out = new Map();
  for (const rel of files) {
    const name = rel.split('/').pop();
    // dynamic route templates ([key]) and the router's own pages are not screens anyone opens
    if (!rel.endsWith('.html') || rel.includes('[') || name.startsWith('_') || name.startsWith('+')) continue;
    out.set(pageUrl(prefix, rel), rel);
    // what the screen loads: bundles, stylesheet, preloaded fonts, favicon
    const html = fs.readFileSync(path.join(dist, rel), 'utf8');
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"?#]+)"/g)) {
      if (!ref.startsWith(`${prefix}/`)) continue;
      const file = decodeURI(ref.slice(prefix.length + 1));
      if (have.has(file) && !file.endsWith('.html')) out.set(ref, file);
    }
  }
  for (const rel of files) {
    if (rel.startsWith('_expo/static/') || (rel.startsWith('assets/') && rel.endsWith('.png')) || rel === 'favicon.ico') out.set(encodeURI(`${prefix}/${rel}`), rel);
  }
  return [...out].sort(([a], [b]) => a.localeCompare(b));
}

function render(template, entries, dist) {
  const hash = crypto.createHash('sha256');
  for (const [url, file] of entries) hash.update(url).update('\0').update(fs.readFileSync(path.join(dist, file)));
  const version = hash.digest('hex').slice(0, 16);
  const urls = entries.map(([url]) => url);
  const out = template.replace("const VERSION = 'dev';", `const VERSION = '${version}';`).replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(urls)};`);
  if (!out.includes(version) || urls.length === 0) throw new Error('build-sw: template placeholders not found or nothing to cache');
  return { version, urls, source: out };
}

if (require.main === module) {
  const dist = path.resolve(process.argv[2] ?? 'dist');
  const baseUrl = require('../app.json').expo.experiments?.baseUrl ?? '';
  const prefix = baseUrl.replace(/\/+$/, '');
  const { version, urls, source } = render(fs.readFileSync(TEMPLATE, 'utf8'), precache(dist, prefix), dist);
  fs.writeFileSync(path.join(dist, 'sw.js'), source);
  console.log(`build-sw: ${urls.length} files, version ${version}`);
}

module.exports = { precache, pageUrl, render, TEMPLATE };
