// Outbox storage for the web build: one JSON document in localStorage (via kv), so queued writes
// survive a reload. Native builds use storage.native.ts (SQLite).
import { kv } from '@/lib/kv';
import type { QueueItem, QueueStorage } from './queue';

const KEY = 'lodestar.outbox';

async function read(): Promise<QueueItem[]> {
  try {
    const raw = await kv.get(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let chain: Promise<unknown> = Promise.resolve();
/** Serialise read-modify-write cycles. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

export const queueStorage: QueueStorage = {
  load: () => read(),
  put: item =>
    serial(async () => {
      const all = (await read()).filter(i => i.id !== item.id);
      all.push(item);
      await kv.set(KEY, JSON.stringify(all));
    }),
  remove: id =>
    serial(async () => {
      await kv.set(KEY, JSON.stringify((await read()).filter(i => i.id !== id)));
    }),
};
