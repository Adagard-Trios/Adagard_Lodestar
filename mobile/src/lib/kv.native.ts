// Persistent key-value store on the phone: one SQLite table (expo-sqlite). Used for the offline cache
// of the day's run and load sheet. Credentials never go here (they live in expo-secure-store).
import * as SQLite from 'expo-sqlite';
import type { KV } from './kv';

export type { KV } from './kv';

let db: Promise<SQLite.SQLiteDatabase> | null = null;

export function database(): Promise<SQLite.SQLiteDatabase> {
  db ??= (async () => {
    const d = await SQLite.openDatabaseAsync('lodestar.db');
    await d.execAsync(
      'PRAGMA journal_mode = WAL;' +
        'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL);' +
        'CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY NOT NULL, saved_at TEXT NOT NULL, item TEXT NOT NULL);',
    );
    return d;
  })();
  return db;
}

export const kv: KV = {
  async get(k) {
    const row = await (await database()).getFirstAsync<{ v: string }>('SELECT v FROM kv WHERE k = ?', k);
    return row?.v ?? null;
  },
  async set(k, v) {
    await (await database()).runAsync('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', k, v);
  },
  async remove(k) {
    await (await database()).runAsync('DELETE FROM kv WHERE k = ?', k);
  },
  async keys(prefix) {
    const rows = await (await database()).getAllAsync<{ k: string }>('SELECT k FROM kv WHERE substr(k, 1, ?) = ?', prefix.length, prefix);
    return rows.map(r => r.k);
  },
};
