// A stable id for this install of the field app (device posture, PLATFORM.md §2.6).
// Format matches the Devices registry: 4–64 letters, digits or dashes (DevicesSet.beforeCreate).
//
// Where the id comes from, first match wins:
//   1. EXPO_PUBLIC_DEVICE_ID (dev/test builds only): pins the id, e.g. to a seeded ACTIVE device so the
//      app acts as that persona's registered phone.
//   2. The stored id (secure store on phones; localStorage `lodestar.device-id` on web). A value placed
//      there before the app starts is respected, so browser tests can act as a seeded phone.
//   3. A new random id `DEV-<32 hex>`, stored for next time. Such a phone must ask for access
//      (POST Devices → SM-32) until an admin approves it (ADM-05).
//
// Seeded ACTIVE devices (backend/prisma/scenario.ts, realm attribute device_id):
//   ruwan (driver) DEV-RB-01 · kasun (loader) DEV-KJ-01 · fathima (store manager) DEV-FR-01 · nilanthi (dispatcher) DEV-NP-01
import type { SecretStore } from './secure';

export const DEVICE_ID_KEY = 'lodestar.device-id';
export const DEVICE_ID_RE = /^[A-Za-z0-9-]{4,64}$/;

/** The seeded phone of each demo persona (dev and e2e only). */
export const SEEDED_DEVICE_IDS = {
  ruwan: 'DEV-RB-01',
  kasun: 'DEV-KJ-01',
  fathima: 'DEV-FR-01',
  nilanthi: 'DEV-NP-01',
} as const;

export function newDeviceId(uuid: () => string): string {
  return `DEV-${uuid().replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 32)}`;
}

/** EXPO_PUBLIC_DEVICE_ID when set and well formed (inlined at build time). */
export function pinnedDeviceId(): string | null {
  const v = process.env.EXPO_PUBLIC_DEVICE_ID?.trim();
  return v && DEVICE_ID_RE.test(v) ? v : null;
}

let cached: Promise<string> | null = null;

/** The install's device id: pinned, else stored, else created on first use and kept in the store. */
export function deviceId(store: SecretStore, uuid: () => string): Promise<string> {
  cached ??= (async () => {
    const pinned = pinnedDeviceId();
    if (pinned) return pinned;
    const existing = await store.get(DEVICE_ID_KEY).catch(() => null);
    if (existing && DEVICE_ID_RE.test(existing.trim())) return existing.trim();
    const id = newDeviceId(uuid);
    await store.set(DEVICE_ID_KEY, id).catch(() => undefined);
    return id;
  })();
  return cached;
}

/** Tests only. */
export function resetDeviceIdCache() {
  cached = null;
}
