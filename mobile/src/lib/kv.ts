// Small persistent key-value store (web build): localStorage, guarded because it can be missing or
// throw (private mode, blocked storage, static rendering). Native builds use kv.native.ts (SQLite).
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix: string): Promise<string[]>;
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

const memory = new Map<string, string>();

export const kv: KV = {
  async get(k) {
    try {
      const s = storage();
      return s ? s.getItem(k) : (memory.get(k) ?? null);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  async set(k, v) {
    memory.set(k, v);
    try {
      storage()?.setItem(k, v);
    } catch {
      // quota or blocked storage: the in-memory copy still serves this session
    }
  },
  async remove(k) {
    memory.delete(k);
    try {
      storage()?.removeItem(k);
    } catch {
      // ignore
    }
  },
  async keys(prefix) {
    const out = new Set([...memory.keys()].filter(k => k.startsWith(prefix)));
    try {
      const s = storage();
      if (s) for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k && k.startsWith(prefix)) out.add(k);
      }
    } catch {
      // ignore
    }
    return [...out];
  },
};
