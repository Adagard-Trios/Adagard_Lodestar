// WP7 offline: the web session kept across a reload and a browser restart (localStorage of the install, bound to
// the install's device id), the service worker's registration, what it caches (and never caches), and the shell
// list written at build time.
/* eslint-disable @typescript-eslint/no-require-imports */
import { OidcError, type OidcClient, type RawTokens } from '@/auth/oidc';
import { installSessionStore } from '@/auth/secure';
import { Session } from '@/auth/session';
import { OfflineQueue } from '@/offline/queue';
import { registerServiceWorker } from '@/offline/service-worker';
import { queueStorage } from '@/offline/storage';
import { SyncEngine } from '@/offline/sync';

import { jwt } from './helpers';

// Node built-ins, untyped here (the app's tsconfig has no Node types)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { routeOf, pageKey } = require('../../scripts/sw.js');
const { precache, render, TEMPLATE } = require('../../scripts/build-sw.js');

const driver = { sub: 'u-ruwan', name: 'Ruwan Bandara', realm_access: { roles: ['driver'] }, depot: ['kandy'], vehicle_id: 'VEH-A', device_id: 'DEV-1', exp: 2_000_000_000 };
const tokens = (rt = 'rt-1'): RawTokens => ({ access_token: jwt(driver), refresh_token: rt, expires_in: 300 });
const offlineOidc = (): OidcClient => ({ refresh: jest.fn(async () => Promise.reject(new OidcError('network', 'offline'))), logout: jest.fn(async () => undefined) });
/** This install's own device id. */
const install = (id = 'DEV-1') => async () => id;
/** The app on this install (each new one is the app opened again). */
const app = (oidc: OidcClient = offlineOidc(), id = 'DEV-1') => new Session(installSessionStore, oidc, undefined, install(id), install(id));

/** The install's localStorage (survives a reload and closing the browser). */
function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe('web session across a reload and a browser restart (localStorage of the install)', () => {
  const w = globalThis as unknown as { window: { localStorage?: unknown; sessionStorage?: unknown; opener?: unknown } };
  let disk: ReturnType<typeof fakeStorage>;
  let saved: { localStorage?: unknown; sessionStorage?: unknown; opener?: unknown };
  const sessionKeys = () => [...disk.m.keys()].filter(k => k === 'lodestar.rt' || k === 'lodestar.claims' || k === 'lodestar.session.device');

  beforeEach(() => {
    saved = { localStorage: w.window.localStorage, sessionStorage: w.window.sessionStorage, opener: w.window.opener };
    disk = fakeStorage();
    w.window.localStorage = disk;
    // a closed browser loses the tab's sessionStorage: nothing may depend on it
    w.window.sessionStorage = fakeStorage();
    w.window.opener = null;
  });
  afterEach(() => {
    w.window.localStorage = saved.localStorage;
    w.window.sessionStorage = saved.sessionStorage;
    w.window.opener = saved.opener;
  });

  it('keeps the refresh token, the claims and the install id on the install, never the access token', async () => {
    await app().signIn(tokens());
    expect(disk.m.get('lodestar.rt')).toBe('rt-1');
    expect(JSON.parse(disk.m.get('lodestar.claims')!).sub).toBe('u-ruwan');
    expect(disk.m.get('lodestar.session.device')).toBe('DEV-1');
    expect([...disk.m.values()].some(v => v.includes(jwt(driver)))).toBe(false);
  });

  it('opens signed in after an offline reload, from the stored session', async () => {
    await app().signIn(tokens());
    const reloaded = app();
    await reloaded.restore();
    expect(reloaded.state.get()).toMatchObject({ status: 'signed-in', offline: true, face: 'run' });
    expect(reloaded.claims?.sub).toBe('u-ruwan');
    // no access token while offline: the outbox waits instead of sending
    expect(await reloaded.accessToken()).toBeNull();
  });

  it('relaunch: browser closed and reopened with no signal restores the signed-in run with the outbox intact', async () => {
    let t = 0;
    const uuid = () => `00000000-0000-4000-8000-${String(++t).padStart(12, '0')}`;
    await app().signIn(tokens());
    const outbox = new OfflineQueue(queueStorage, uuid);
    await outbox.ready();
    await outbox.enqueue('POD_SAVE', { sub: 'u-ruwan', tripId: 'T-1', ref: 'S-1', label: 'POD · O-1', payload: { orderId: 'O-1', units: 8, unitsOrdered: 10 }, savedAt: '2026-04-07T01:00:00.000Z' });
    await outbox.enqueue('ARRIVAL', { sub: 'u-ruwan', tripId: 'T-1', ref: 'S-2', label: 'Arrival · Lake Store', payload: { stopSeq: 2 }, savedAt: '2026-04-07T01:30:00.000Z' });

    // the browser is closed: memory and the tab's sessionStorage are gone, the install's localStorage stays
    w.window.sessionStorage = fakeStorage();
    const reopened = app();
    const queue = new OfflineQueue(queueStorage, uuid);
    await Promise.all([reopened.restore(), queue.ready()]);
    expect(reopened.state.get()).toMatchObject({ status: 'signed-in', offline: true, face: 'run' });
    expect(reopened.claims?.sub).toBe('u-ruwan');
    expect(queue.pending('u-ruwan').map(i => i.kind)).toEqual(['POD_SAVE', 'ARRIVAL']);

    // still no signal: the sync engine keeps everything on the phone
    const client = { action: jest.fn(), create: jest.fn(), list: jest.fn() };
    const sync = new SyncEngine(queue, client as never, { sub: () => reopened.claims?.sub ?? null, online: () => false });
    expect(await sync.flush()).toMatchObject({ offline: true, attempted: 0 });
    expect(client.action).not.toHaveBeenCalled();
    expect(queue.pending('u-ruwan')).toHaveLength(2);
  });

  it('refreshes silently when the reloaded app is online', async () => {
    await app().signIn(tokens());
    const oidc: OidcClient = { refresh: jest.fn(async () => tokens('rt-2')), logout: jest.fn(async () => undefined) };
    const reloaded = app(oidc);
    await reloaded.restore();
    expect(oidc.refresh).toHaveBeenCalledWith('rt-1');
    expect(reloaded.state.get()).toMatchObject({ status: 'signed-in', offline: false });
    expect(await reloaded.accessToken()).toBe(jwt(driver));
    expect(disk.m.get('lodestar.rt')).toBe('rt-2');
  });

  it('does not resume a session saved on another install, and forgets it', async () => {
    await app().signIn(tokens());
    const other = app(offlineOidc(), 'DEV-OTHER');
    await other.restore();
    expect(other.state.get().status).toBe('signed-out');
    expect(sessionKeys()).toEqual([]);
  });

  it('does not resume a stored session that is not bound to an install', async () => {
    disk.m.set('lodestar.rt', 'rt-1');
    disk.m.set('lodestar.claims', JSON.stringify({ sub: 'u-ruwan', roles: ['driver'], depots: [] }));
    const s = app();
    await s.restore();
    expect(s.state.get().status).toBe('signed-out');
    expect(sessionKeys()).toEqual([]);
  });

  it('does not resume a session whose token names another phone, and forgets it', async () => {
    await app().signIn(tokens());
    const reloaded = new Session(installSessionStore, offlineOidc(), undefined, install('DEV-OTHER'), install('DEV-1'));
    await reloaded.restore();
    expect(reloaded.state.get().status).toBe('signed-out');
    expect(sessionKeys()).toEqual([]);
  });

  it('sign-out removes the stored session, so a reopened app is signed out', async () => {
    const s = app();
    await s.signIn(tokens());
    await s.signOut();
    expect(sessionKeys()).toEqual([]);
    const reloaded = app();
    await reloaded.restore();
    expect(reloaded.state.get().status).toBe('signed-out');
  });

  it('the sign-in popup (window.opener set) neither reads nor rotates the stored session', async () => {
    await app().signIn(tokens());
    w.window.opener = {};
    expect(await installSessionStore.get('lodestar.rt')).toBeNull();
    const oidc: OidcClient = { refresh: jest.fn(async () => tokens('rt-2')), logout: jest.fn(async () => undefined) };
    const popup = app(oidc);
    await popup.restore();
    expect(oidc.refresh).not.toHaveBeenCalled();
    expect(popup.state.get().status).toBe('signed-out');
    expect(disk.m.get('lodestar.rt')).toBe('rt-1');
  });
});

describe('service worker registration', () => {
  it('registers /field/sw.js for the /field/ scope', async () => {
    const register = jest.fn(async () => ({ scope: '/field/' }) as unknown as ServiceWorkerRegistration);
    expect(await registerServiceWorker({ register }, '/field', true)).toEqual({ scope: '/field/' });
    expect(register).toHaveBeenCalledWith('/field/sw.js', { scope: '/field/' });
  });

  it('does nothing outside the web production build or without service workers', async () => {
    const register = jest.fn();
    expect(await registerServiceWorker({ register }, '/field', false)).toBeNull();
    expect(await registerServiceWorker(undefined, '/field', true)).toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it('a refused registration leaves the app working', async () => {
    const register = jest.fn(async () => Promise.reject(new Error('insecure')));
    expect(await registerServiceWorker({ register }, '/field', true)).toBeNull();
  });
});

describe('service worker routes', () => {
  const origin = 'https://localhost:8443';
  const req = (p: string, o: { method?: string; mode?: string; auth?: boolean; origin?: string } = {}) => ({
    url: `${o.origin ?? origin}${p}`,
    method: o.method ?? 'GET',
    mode: o.mode ?? 'cors',
    headers: { has: (h: string) => !!o.auth && h.toLowerCase() === 'authorization' },
  });
  const route = (p: string, o?: Parameters<typeof req>[1]) => routeOf(req(p, o), '/field/', origin);

  it('serves screens network first and the shell cache first', () => {
    expect(route('/field/s/dr-a2-pod-saved-offline?stop=1', { mode: 'navigate' })).toBe('page');
    expect(route('/field/', { mode: 'navigate' })).toBe('page');
    expect(route('/field/_expo/static/js/web/entry-1.js')).toBe('asset');
    expect(route('/field/assets/node_modules/@expo-google-fonts/inter/a.ttf')).toBe('asset');
    expect(route('/field/favicon.ico')).toBe('asset');
    expect(pageKey(`${origin}/field/s/dr-a2-pod-saved-offline?stop=1`)).toBe('/field/s/dr-a2-pod-saved-offline');
  });

  it('never touches the API, sign-in, realtime, writes or anything with a token', () => {
    expect(route('/odata/v4/Trips')).toBeNull();
    expect(route('/odata/v4/Trips', { mode: 'navigate' })).toBeNull();
    expect(route('/auth/realms/lodestar/protocol/openid-connect/token', { method: 'POST' })).toBeNull();
    expect(route('/auth/realms/lodestar/protocol/openid-connect/auth', { mode: 'navigate' })).toBeNull();
    expect(route('/ws/')).toBeNull();
    expect(route('/field/_expo/static/js/web/entry-1.js', { auth: true })).toBeNull();
    expect(route('/field/s/dr-01-today-s-run', { mode: 'navigate', method: 'POST' })).toBeNull();
    expect(route('/field/_expo/static/js/web/entry-1.js', { origin: 'https://cdn.example' })).toBeNull();
    expect(route('/field/sw.js')).toBeNull();
    expect(route('/dispatcher', { mode: 'navigate' })).toBeNull();
  });
});

describe('app shell list (build-sw)', () => {
  let dist: string;
  const write = (rel: string, body: string) => {
    fs.mkdirSync(path.dirname(path.join(dist, rel)), { recursive: true });
    fs.writeFileSync(path.join(dist, rel), body);
  };
  const page = (body = '') =>
    `<html><head><link rel="preload" href="/field/assets/fonts/Inter.ttf" as="font"/><link rel="stylesheet" href="/field/_expo/static/css/g.css"/></head><body><a href="/field/s/b">b</a><script src="/field/_expo/static/js/web/entry.js" defer></script>${body}</body></html>`;

  beforeEach(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'lodestar-sw-'));
    write('index.html', page());
    write('s/dr-a2-pod-saved-offline.html', page());
    write('s/[key].html', page());
    write('_sitemap.html', page());
    write('+not-found.html', page());
    write('_expo/static/js/web/entry.js', 'js');
    write('_expo/static/css/g.css', 'css');
    write('assets/fonts/Inter.ttf', 'font');
    write('assets/fonts/Unused.ttf', 'big font nobody loads');
    write('assets/images/icon.png', 'png');
    write('favicon.ico', 'ico');
  });
  afterEach(() => fs.rmSync(dist, { recursive: true, force: true }));

  it('lists every screen at its URL and what the screens load', () => {
    const urls = precache(dist, '/field').map(([u]: [string]) => u);
    expect(urls).toEqual(
      expect.arrayContaining([
        '/field/',
        '/field/s/dr-a2-pod-saved-offline',
        '/field/_expo/static/js/web/entry.js',
        '/field/_expo/static/css/g.css',
        '/field/assets/fonts/Inter.ttf',
        '/field/assets/images/icon.png',
        '/field/favicon.ico',
      ]),
    );
    expect(urls.some((u: string) => u.includes('[key]') || u.includes('_sitemap') || u.includes('+not-found') || u.includes('Unused'))).toBe(false);
  });

  it('versions the cache by content: a changed build is a new cache', () => {
    const template = fs.readFileSync(TEMPLATE, 'utf8');
    const a = render(template, precache(dist, '/field'), dist);
    expect(a.source).toContain(`const VERSION = '${a.version}';`);
    expect(a.source).toContain('"/field/s/dr-a2-pod-saved-offline"');
    write('_expo/static/js/web/entry.js', 'js v2');
    expect(render(template, precache(dist, '/field'), dist).version).not.toBe(a.version);
  });
});
