// A test double of src/model/platform.ts: the real Session, OfflineQueue and SyncEngine over in-memory
// storage, with an OData client whose answers come from `routes` (path prefix → value or function).
import { Store } from '@/lib/store';
import { memoryStore } from '@/auth/secure';
import { Session } from '@/auth/session';
import { memoryQueueStorage, OfflineQueue } from '@/offline/queue';
import { SyncEngine } from '@/offline/sync';
import { network } from '@/offline/network';
import { jwt } from './helpers';

type Answer = unknown | ((path: string, query?: unknown) => unknown);
export const routes = new Map<string, Answer>();

/** The depot registry (OData Depots, ADM-21) as seeded; answered unless a test routes Depots itself. */
export const DEPOTS = [
  { code: 'KANDY', name: 'Kandy Hub', district: 'Kandy', isActive: true },
  { code: 'PELIYAGODA', name: 'Peliyagoda DC', district: 'Gampaha', isActive: true },
];

function answer(path: string, query?: unknown): any {
  const hits = [...routes.keys()].filter(k => path.startsWith(k)).sort((a, b) => b.length - a.length);
  if (path === 'Depots' && !hits.some(k => k.startsWith('Depots'))) return DEPOTS;
  if (!hits.length) return [];
  const v = routes.get(hits[0]);
  return typeof v === 'function' ? (v as (p: string, q?: unknown) => unknown)(path, query) : v;
}

const keyOf = (id: string | number) => (typeof id === 'number' ? `(${id})` : `('${id}')`);

export const client = {
  list: jest.fn(async (set: string, q?: unknown) => ({ value: answer(set, q) as any[] })),
  all: jest.fn(async (set: string, q?: unknown) => answer(set, q) as any[]),
  get: jest.fn(async (set: string, id: string | number, q?: unknown) => answer(`${set}${keyOf(id)}`, q)),
  fn: jest.fn(async (path: string) => answer(path)),
  action: jest.fn(async (_path: string, _params?: unknown, _o?: unknown) => ({}) as any),
  create: jest.fn(async (_set: string, body: unknown) => body as any),
};

export const oidc = { refresh: jest.fn(), logout: jest.fn(async () => undefined) };
export const session = new Session(memoryStore, oidc);
export const revision = new Store(0);
export const bumpRevision = () => revision.set(n => n + 1);

let n = 0;
export const queue = new OfflineQueue(memoryQueueStorage(), () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`);
export const sync = new SyncEngine(queue, client as any, {
  sub: () => (session.signedIn ? (session.claims?.sub ?? null) : null),
  online: () => network.get().online,
  onSynced: () => bumpRevision(),
});
export const getDeviceId = async () => 'DEV-TEST-0001';
export const startPlatform = () => () => undefined;

/** Signs a persona in (claims only; tokens are fake). */
export async function signInAs(claims: Record<string, unknown>) {
  await session.signIn({ access_token: jwt({ exp: 4_000_000_000, ...claims }), refresh_token: 'rt', expires_in: 3600 });
}
