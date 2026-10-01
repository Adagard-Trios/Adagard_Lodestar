// The app's single instances: session, API client, offline queue and sync engine, wired together.
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import { apiBase, sameOriginApi } from '@/lib/config';
import { ODataClient } from '@/lib/odata';
import { Store } from '@/lib/store';
import { deviceId } from '@/auth/device';
import { oidcClient } from '@/auth/oidc';
import { deviceStore, tokenStore } from '@/auth/secure';
import { Session } from '@/auth/session';
import { network, reportReachable, startNetwork } from '@/offline/network';
import { OfflineQueue } from '@/offline/queue';
import { queueStorage } from '@/offline/storage';
import { SyncEngine } from '@/offline/sync';

export const session = new Session(tokenStore, oidcClient());

export const getDeviceId = () => deviceId(deviceStore, () => Crypto.randomUUID());

export const client = new ODataClient({
  baseUrl: apiBase,
  getToken: () => session.accessToken(),
  getDeviceId,
  extraHeaders: sameOriginApi,
  onUnauthorized: err => session.handleUnauthorized(err),
  onNetwork: reportReachable,
});

/** Bumped after a sync or a realtime notice: live queries fetch again. */
export const revision = new Store(0);
export const bumpRevision = () => revision.set(n => n + 1);

export const queue = new OfflineQueue(queueStorage, () => Crypto.randomUUID());

export const sync = new SyncEngine(queue, client, {
  sub: () => (session.signedIn ? (session.claims?.sub ?? null) : null),
  online: () => network.get().online,
  onSynced: () => bumpRevision(),
});

let started = false;

/** Called once from the root layout (client side only). */
export function startPlatform(): () => void {
  if (started) return () => undefined;
  started = true;
  const stops: (() => void)[] = [];
  stops.push(startNetwork());
  void queue.ready();
  void session.restore().then(() => sync.flush());

  // back online → send the outbox
  let wasOnline = network.get().online;
  stops.push(
    network.subscribe(() => {
      const online = network.get().online;
      if (online && !wasOnline) {
        void sync.flush();
        bumpRevision();
      }
      wasOnline = online;
    }),
  );
  // a write was queued → try to send it now
  let count = queue.list().length;
  stops.push(
    queue.items.subscribe(() => {
      const n = queue.list().length;
      if (n > count) void sync.flush();
      count = n;
    }),
  );
  // signed in → send what was saved while signed out
  stops.push(session.state.subscribe(() => session.signedIn && void sync.flush()));
  // retry pending writes every 30 s and when the app comes back to the foreground
  const timer = setInterval(() => queue.pending().length && void sync.flush(), 30_000);
  stops.push(() => clearInterval(timer));
  const app = AppState.addEventListener('change', s => s === 'active' && void sync.flush());
  stops.push(() => app.remove());
  return () => {
    stops.forEach(s => s());
    started = false;
  };
}
