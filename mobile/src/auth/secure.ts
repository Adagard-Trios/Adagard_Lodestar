// Credential storage. Native: expo-secure-store (Keychain / Keystore).
// Web: the tab's sessionStorage (tabSessionStore below), so a driver who reloads in a dead zone keeps working.
// Why sessionStorage and not localStorage or IndexedDB: it survives a reload of the tab and nothing else. It is
// not shared with other tabs, it is gone when the tab or browser closes (the shortest lifetime that still covers
// an offline reload), and the service worker cannot read it. Only the refresh token and the non-secret claims are
// written (session.ts); the access token stays in memory. Keycloak rotates the refresh token on each use and
// expires it with the SSO session, sign-out removes both keys, and a stored session whose device_id is not this
// install's id is dropped on start (Session.restore). The device id is not a secret: on web it persists in
// localStorage so the install keeps one id.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { kv } from '@/lib/kv';

export interface SecretStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const memory = new Map<string, string>();

export const memoryStore: SecretStore = {
  async get(k) {
    return memory.get(k) ?? null;
  },
  async set(k, v) {
    memory.set(k, v);
  },
  async remove(k) {
    memory.delete(k);
  },
};

const secureStore: SecretStore = {
  get: k => SecureStore.getItemAsync(k),
  set: (k, v) => SecureStore.setItemAsync(k, v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }),
  remove: k => SecureStore.deleteItemAsync(k),
};

function tabStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    // The Keycloak sign-in popup is the same app with a copy of the opener's sessionStorage: it must not resume
    // (and so rotate) the app window's refresh token.
    if (window.opener) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Web: sessionStorage of this tab, falling back to memory where it is blocked (private mode, static rendering). */
export const tabSessionStore: SecretStore = {
  async get(k) {
    try {
      const s = tabStorage();
      return s ? s.getItem(k) : memory.get(k) ?? null;
    } catch {
      return memory.get(k) ?? null;
    }
  },
  async set(k, v) {
    try {
      const s = tabStorage();
      if (s) return s.setItem(k, v);
    } catch {
      // quota or blocked storage: memory still serves this page
    }
    memory.set(k, v);
  },
  async remove(k) {
    memory.delete(k);
    try {
      tabStorage()?.removeItem(k);
    } catch {
      // ignore
    }
  },
};

/** Where tokens live on this platform. */
export const tokenStore: SecretStore = Platform.OS === 'web' ? tabSessionStore : secureStore;

/** Where the per-install device id lives (persistent everywhere). */
export const deviceStore: SecretStore = Platform.OS === 'web' ? { get: k => kv.get(k), set: (k, v) => kv.set(k, v), remove: k => kv.remove(k) } : secureStore;
