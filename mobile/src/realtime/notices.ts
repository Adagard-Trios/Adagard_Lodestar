// Realtime notices over Socket.IO (notifications service, path /ws/). The handshake carries the same
// access token as the API; the server joins `user:<sub>` and checks every requested room against the
// token's claims (backend/apps/notifications/src/notifications.gateway.ts).
import { io, type Socket } from 'socket.io-client';
import { apiBase } from '@/lib/config';
import { Store } from '@/lib/store';
import type { Claims } from '@/auth/claims';
import { bumpRevision, getDeviceId, session } from '@/model/platform';

export type Notice = { id: string; event: string; type: string; at: string; payload: Record<string, any> };

export const notices = new Store<Notice[]>([]);
export const socketState = new Store<'off' | 'connecting' | 'live'>('off');

const EVENTS = ['notification', 'eta_update', 'signal_lost', 'signal_back', 'credit_note_issued', 'trip_released', 'plan_published', 'shortfall_ack', 'bay_update'];

/** Rooms this user may watch besides their own (the server re-checks). */
export function roomsFor(c: Claims): string[] {
  const rooms: string[] = [];
  if (c.roles.includes('driver')) rooms.push(`driver:${c.sub}`);
  if (c.roles.includes('loader')) rooms.push(...c.depots.map(d => `loader:${d}`));
  if (c.roles.includes('dispatcher')) rooms.push(...c.depots.map(d => `dispatcher:${d}`));
  if (c.roles.includes('store_manager') && c.outletId) rooms.push(`store:${c.outletId}`);
  return rooms;
}

function push(event: string, payload: any) {
  const p = payload && typeof payload === 'object' ? payload : { value: payload };
  const n: Notice = {
    id: String(p.id ?? `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    event,
    type: String(p.type ?? event).toUpperCase(),
    at: String(p.sentAt ?? new Date().toISOString()),
    payload: (p.payload && typeof p.payload === 'object' ? p.payload : p) as Record<string, any>,
  };
  notices.set(list => [n, ...list.filter(x => x.id !== n.id)].slice(0, 50));
  bumpRevision();
}

let socket: Socket | null = null;
let forSub: string | null = null;

/** Keeps one connection for the signed-in user (call on every session change). */
export function syncSocket() {
  const s = session.state.get();
  const claims = s.status === 'signed-in' ? s.claims : null;
  if (!claims) {
    socket?.disconnect();
    socket = null;
    forSub = null;
    notices.set([]);
    socketState.set('off');
    return;
  }
  if (socket && forSub === claims.sub) return;
  socket?.disconnect();
  forSub = claims.sub;
  socketState.set('connecting');
  const sock = io(apiBase(), {
    path: '/ws/',
    transports: ['websocket', 'polling'],
    query: { room: roomsFor(claims).join(',') },
    // read on every (re)connect, so a refreshed token is used
    auth: cb => {
      void Promise.all([session.accessToken(), getDeviceId()]).then(([token, deviceId]) => cb({ token: token ?? '', deviceId }));
    },
    reconnectionDelayMax: 30_000,
  });
  sock.on('connect', () => socketState.set('live'));
  sock.on('disconnect', () => socketState.set('connecting'));
  sock.on('unauthorized', () => {
    // the server refused the token: let the API path decide (refresh, or device problem)
    void session.refresh();
  });
  for (const e of EVENTS) sock.on(e, (payload: unknown) => push(e, payload));
  socket = sock;
}

export function startRealtime(): () => void {
  syncSocket();
  const unsub = session.state.subscribe(syncSocket);
  return () => {
    unsub();
    socket?.disconnect();
    socket = null;
    forSub = null;
  };
}
