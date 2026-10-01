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
//
// Shared demo phones: those four rows are marked `sharedDemo` in the registry. After sign-in, when the token
// names such a phone, the app reads that row (Devices('id'), allowed for an unbound phone) and adopts the id
// as its install id ONLY when the backend says it is ACTIVE, sharedDemo and the signed-in user's own
// (enrollment.ts). So the personas sign in from any browser; every other user and phone still enrols.
// The adopted id is kept apart from the install's own id, which comes back for anyone else.
import type { SecretStore } from './secure';

export const DEVICE_ID_KEY = 'lodestar.device-id';
export const SHARED_DEVICE_KEY = 'lodestar.shared-device-id';
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
let shared: Promise<string | null> | null = null;

/** The install's own device id: pinned, else stored, else created on first use and kept in the store. */
export function ownDeviceId(store: SecretStore, uuid: () => string): Promise<string> {
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

/** The shared demo phone this install has adopted, if any. */
export function sharedDeviceId(store: SecretStore): Promise<string | null> {
  shared ??= store
    .get(SHARED_DEVICE_KEY)
    .then(v => (v && DEVICE_ID_RE.test(v.trim()) ? v.trim() : null))
    .catch(() => null);
  return shared;
}

/** Adopts a shared demo phone's id (after the backend confirmed it), or drops the adoption (null). */
export async function setSharedDeviceId(store: SecretStore, id: string | null): Promise<void> {
  const value = id && DEVICE_ID_RE.test(id) ? id : null;
  shared = Promise.resolve(value);
  if (value) await store.set(SHARED_DEVICE_KEY, value).catch(() => undefined);
  else await store.remove(SHARED_DEVICE_KEY).catch(() => undefined);
}

/** The id this install presents (X-Device-Id): a pinned id, else an adopted shared demo phone, else its own. */
export async function deviceId(store: SecretStore, uuid: () => string): Promise<string> {
  if (pinnedDeviceId()) return ownDeviceId(store, uuid);
  return (await sharedDeviceId(store)) ?? ownDeviceId(store, uuid);
}

/** Tests only. */
export function resetDeviceIdCache() {
  cached = null;
  shared = null;
}
