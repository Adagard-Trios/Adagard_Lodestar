// Service worker of the field app's web build (served at <base>/sw.js, scope <base>/, e.g. /field/).
// scripts/build-sw.js writes it into the export with VERSION and PRECACHE filled in.
//
// What it does: the app shell (every pre-rendered screen, the JS/CSS bundles, the fonts and icons the screens
// use) is cached at install in a cache named after the build, so the app opens with no signal.
//   - Screens (navigations): network first, the cached copy when the network fails.
//   - Bundles, fonts, icons (hashed file names): cache first.
//   - Everything else is left to the browser and never cached: the API (/odata/), sign-in (/auth/), realtime
//     (/ws/), the desk website, any non-GET and any request carrying an Authorization header. Tokens never pass
//     through here.
// Updates: a new build installs in the background and takes over (old caches deleted) once its shell is cached;
// the next load of the app is the new version.
const VERSION = 'dev';
const PRECACHE = [];

const PREFIX = 'lodestar-field-';
const CACHE = PREFIX + VERSION;

/** 'page' (a screen), 'asset' (bundle, font, icon) or null (not ours: the browser handles it, nothing is cached). */
function routeOf(request, base, origin) {
  if (request.method !== 'GET' || request.headers.has('Authorization')) return null;
  const url = new URL(request.url);
  if (url.origin !== origin || !url.pathname.startsWith(base)) return null;
  if (request.mode === 'navigate') return 'page';
  const rest = url.pathname.slice(base.length);
  if (rest.startsWith('_expo/') || rest.startsWith('assets/') || rest === 'favicon.ico') return 'asset';
  return null;
}

/** A screen is cached under its path (the query, e.g. ?stop=…, is read by the app, not the server). */
function pageKey(url) {
  return new URL(url).pathname;
}

async function page(request, base) {
  const key = pageKey(request.url);
  try {
    const res = await fetch(request);
    if (res.ok && !res.redirected) {
      const copy = res.clone();
      caches
        .open(CACHE)
        .then(c => c.put(key, copy))
        .catch(() => undefined);
    }
    return res;
  } catch (e) {
    // offline: this screen as cached, else the app's start page (the router opens the screen from the URL)
    const hit = (await caches.match(key)) || (await caches.match(base));
    if (hit) return hit;
    throw e;
  }
}

async function asset(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches
      .open(CACHE)
      .then(c => c.put(request, copy))
      .catch(() => undefined);
  }
  return res;
}

if (typeof self !== 'undefined' && typeof self.addEventListener === 'function' && typeof caches !== 'undefined') {
  const base = new URL('./', self.location.href).pathname;

  self.addEventListener('install', event => {
    event.waitUntil(
      caches
        .open(CACHE)
        // fresh copies, not the HTTP cache: the shell must be the one this version was built with
        .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
        .then(() => self.skipWaiting()),
    );
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      caches
        .keys()
        .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener('fetch', event => {
    const route = routeOf(event.request, base, self.location.origin);
    if (route === 'page') event.respondWith(page(event.request, base));
    else if (route === 'asset') event.respondWith(asset(event.request));
  });
}

if (typeof module === 'object' && module.exports) module.exports = { routeOf, pageKey, VERSION, PRECACHE };
