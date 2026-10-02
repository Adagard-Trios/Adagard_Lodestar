// Settings of this install (device store, src/lib/kv): app language (also the read-aloud language),
// read aloud on/off, the driver's night/day screen, and the loader's gloves mode (bigger tap areas) and loud
// alerts (vibrate and read plan changes aloud) from LD-07. Plus the per-user "onboarding seen" flag.
// Nothing here is secret; nothing here is sent to the server.
import { kv } from './kv';
import { Store, useStore } from './store';

export type AppLanguage = 'en' | 'si' | 'ta';
/** Night or day screen (DR-24): auto follows sunrise in Colombo. */
export type ScreenTheme = 'auto' | 'night' | 'day';

export type Settings = { language: AppLanguage; readAloud: boolean; theme: ScreenTheme; glovesMode: boolean; loudAlerts: boolean };

const KEY = 'lodestar.settings';
const DEFAULTS: Settings = { language: 'en', readAloud: true, theme: 'auto', glovesMode: false, loudAlerts: false };

export const settings = new Store<Settings>(DEFAULTS);
let loaded: Promise<void> | null = null;

/** Loads the saved settings (once). */
export function loadSettings(): Promise<void> {
  loaded ??= (async () => {
    try {
      const raw = await kv.get(KEY);
      if (raw) settings.set({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // damaged or blocked storage: defaults
    }
  })();
  return loaded;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await loadSettings();
  settings.set(s => ({ ...s, ...patch }));
  await kv.set(KEY, JSON.stringify(settings.get())).catch(() => undefined);
}

export function useSettings(): Settings {
  void loadSettings();
  return useStore(settings);
}

export const LANGUAGE_NAMES: Record<AppLanguage, string> = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };

// ---------------------------------------------------------------- night / day screen

/** Day between 06:00 and 18:30 Colombo time (Colombo sunrise/sunset barely move over the year). */
export function isDaytime(now: number = Date.now()): boolean {
  const m = Math.floor(((now + 330 * 60_000) % 86_400_000) / 60_000);
  return m >= 6 * 60 && m < 18 * 60 + 30;
}

export function isDaylight(theme: ScreenTheme, now: number = Date.now()): boolean {
  return theme === 'day' || (theme === 'auto' && isDaytime(now));
}

/** Driver screens with a designed daylight variant. */
export const DAYLIGHT_VARIANTS: Record<string, string> = {
  'dr-01-today-s-run': 'dr-01-today-s-run-daylight',
  'dr-15-route-overview': 'dr-15-route-overview-daylight',
  'dr-28-end-of-shift-summary': 'dr-28-end-of-shift-summary-daylight',
};
const NIGHT_VARIANTS = Object.fromEntries(Object.entries(DAYLIGHT_VARIANTS).map(([n, d]) => [d, n]));

/** The screen to render for `key` under the current night/day setting. */
export function themedKey(key: string, theme: ScreenTheme, now: number = Date.now()): string {
  if (isDaylight(theme, now)) return DAYLIGHT_VARIANTS[key] ?? key;
  // night (or auto at night): a daylight key opened by a link shows the night screen only when forced
  return theme === 'night' ? (NIGHT_VARIANTS[key] ?? key) : key;
}

// ---------------------------------------------------------------- onboarding

const seenKey = (sub: string) => `lodestar.onboarded.${sub}`;

/** True once this user finished (or skipped) the first-run screens on this device. */
export async function onboardingSeen(sub: string): Promise<boolean> {
  try {
    return (await kv.get(seenKey(sub))) === '1';
  } catch {
    return true; // storage blocked: never trap a user in onboarding
  }
}

export async function markOnboardingSeen(sub: string | undefined): Promise<void> {
  if (sub) await kv.set(seenKey(sub), '1').catch(() => undefined);
}
