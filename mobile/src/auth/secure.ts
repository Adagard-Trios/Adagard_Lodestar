// Credential storage. Native: expo-secure-store (Keychain / Keystore). Web: memory only, so a token
// never lands in localStorage; a reload of the browser build means signing in again.
// The device id is not a secret: on web it persists in localStorage so the install keeps one id.
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

/** Where tokens live on this platform. */
export const tokenStore: SecretStore = Platform.OS === 'web' ? memoryStore : secureStore;

/** Where the per-install device id lives (persistent everywhere). */
export const deviceStore: SecretStore = Platform.OS === 'web' ? { get: k => kv.get(k), set: (k, v) => kv.set(k, v), remove: k => kv.remove(k) } : secureStore;
