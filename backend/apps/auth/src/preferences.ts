import { ODataError } from '@lodestar/odata';

/**
 * Per-user preferences (DSP-20 dispatcher settings, DSP-33 alert rules, SM-30 store settings).
 *
 * Stored as JSON on the user's own directory row (User.preferences, hidden from the Users set) and only ever
 * read or written by the signed-in user through MyPreferences() / SaveMyPreferences. The shape is open inside
 * each section so the faces can grow, but bounded: known top-level sections only, plain JSON values, limited
 * depth, length and size.
 */
export const PREFERENCE_SECTIONS = [
  'alerts', // DSP-20 / DSP-33: what wakes me (vehicle can't depart, late risk ≥ N %, flags, silence) and channels
  'onCall', // DSP-33: on-call hours
  'notifications', // SM-30: per-topic app / SMS toggles
  'receiving', // SM-30: receiving staff and "staff at the door from"
  'language', // SM-30: en | si | ta
  'board', // desk conveniences (default depot view, …)
] as const;

export type PreferenceSection = (typeof PREFERENCE_SECTIONS)[number];
export type Preferences = Partial<Record<PreferenceSection, unknown>>;

const MAX_BYTES = 16_384;
const MAX_DEPTH = 5;
const MAX_STRING = 500;
const MAX_ARRAY = 50;
const MAX_KEYS = 50;

function check(value: unknown, path: string, depth: number): void {
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw ODataError.badRequest(`${path} must be a finite number`, 'preferences');
    return;
  }
  if (typeof value === 'string') {
    if (value.length > MAX_STRING) throw ODataError.badRequest(`${path} is longer than ${MAX_STRING} characters`, 'preferences');
    return;
  }
  if (depth >= MAX_DEPTH) throw ODataError.badRequest(`${path} is nested too deeply`, 'preferences');
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) throw ODataError.badRequest(`${path} has more than ${MAX_ARRAY} items`, 'preferences');
    value.forEach((v, i) => check(v, `${path}[${i}]`, depth + 1));
    return;
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_KEYS) throw ODataError.badRequest(`${path} has more than ${MAX_KEYS} fields`, 'preferences');
    for (const [k, v] of entries) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(k)) throw ODataError.badRequest(`${path}.${k}: field names are letters, digits and _`, 'preferences');
      check(v, `${path}.${k}`, depth + 1);
    }
    return;
  }
  throw ODataError.badRequest(`${path} must be plain JSON`, 'preferences');
}

/** Validates a SaveMyPreferences body: an object whose keys are known sections. Returns it typed. */
export function validatePreferences(input: unknown): Preferences {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw ODataError.badRequest('preferences must be an object', 'preferences');
  }
  const out: Preferences = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!(PREFERENCE_SECTIONS as readonly string[]).includes(k)) {
      throw ODataError.badRequest(`Unknown preference section '${k}' (expected ${PREFERENCE_SECTIONS.join(', ')})`, 'preferences');
    }
    check(v, k, 1);
    out[k as PreferenceSection] = v;
  }
  return out;
}

/** The stored preferences with `patch` applied section by section (a null section removes it). */
export function mergePreferences(current: unknown, patch: Preferences): Preferences {
  const base: Preferences = current && typeof current === 'object' && !Array.isArray(current) ? { ...(current as Preferences) } : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete base[k as PreferenceSection];
    else base[k as PreferenceSection] = v;
  }
  if (Buffer.byteLength(JSON.stringify(base), 'utf8') > MAX_BYTES) {
    throw ODataError.badRequest(`Preferences are limited to ${MAX_BYTES / 1024} KB`, 'preferences');
  }
  return base;
}
