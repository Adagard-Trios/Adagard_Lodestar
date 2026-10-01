// Outbox storage on the phone: the `outbox` table of the app's SQLite database (expo-sqlite).
import { database } from '@/lib/kv.native';
import type { QueueItem, QueueStorage } from './queue';

export const queueStorage: QueueStorage = {
  async load() {
    const rows = await (await database()).getAllAsync<{ item: string }>('SELECT item FROM outbox ORDER BY saved_at, id');
    const out: QueueItem[] = [];
    for (const r of rows) {
      try {
        out.push(JSON.parse(r.item));
      } catch {
        // skip a damaged row
      }
    }
    return out;
  },
  async put(item) {
    await (await database()).runAsync('INSERT OR REPLACE INTO outbox (id, saved_at, item) VALUES (?, ?, ?)', item.id, item.savedAt, JSON.stringify(item));
  },
  async remove(id) {
    await (await database()).runAsync('DELETE FROM outbox WHERE id = ?', id);
  },
};
