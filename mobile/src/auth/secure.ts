// Credential storage. Native: expo-secure-store (Keychain / Keystore).
// Web: localStorage of the install (installSessionStore below), so a driver who closes the browser and opens the app
// again in a dead zone is still signed in to the run, with the outbox intact (brief item 10).
// What is written: only the refresh token, the non-secret claims and the install's device id the session is bound
// to (session.ts); the access token stays in memory. The stored session is dropped when the device id it was saved
// with is not this install's (Session.restore), on sign-out, and when Keycloak refuses the refresh token (it rotates
// on each use and expires with the SSO session). The sign-in popup (window.opener set) never reads or writes it, so
// it cannot rotate the app window's token. The device id is not a secret: on web it persists in localStorage so the
// install keeps one id.
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

function installStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    // The Keycloak sign-in popup is the same app on the same origin: it must not read (and so rotate by a
    // refresh) the app window's refresh token, nor overwrite it.
    if (window.opener) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Web: localStorage of this install (it survives closing the browser, so a driver who reopens the app in a dead
 * zone is still signed in with the outbox intact), falling back to memory where it is blocked (private mode,
 * static rendering) or in the sign-in popup.
 */
export const installSessionStore: SecretStore = {
  async get(k) {
    try {
      const s = installStorage();
      return s ? s.getItem(k) : (memory.get(k) ?? null);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  async set(k, v) {
    try {
      const s = installStorage();
      if (s) return s.setItem(k, v);
    } catch {
      // quota or blocked storage: memory still serves this page
    }
    memory.set(k, v);
  },
  async remove(k) {
    memory.delete(k);
    try {
      installStorage()?.removeItem(k);
    } catch {
      // ignore
    }
  },
};

/** Where tokens live on this platform. */
export const tokenStore: SecretStore = Platform.OS === 'web' ? installSessionStore : secureStore;

/** Where the per-install device id lives (persistent everywhere). */
export const deviceStore: SecretStore = Platform.OS === 'web' ? { get: k => kv.get(k), set: (k, v) => kv.set(k, v), remove: k => kv.remove(k) } : secureStore;
