// "Update required" (SM-34, DSP-38, LD-26, DR-31): shown when the minimum app version is above this build.
// The minimum comes from EXPO_PUBLIC_MIN_VERSION, inlined when the app is built (the release pipeline sets it
// when an older build must stop being used). The gateway's /version serves only the deployed commit, so it
// cannot say which app versions it accepts; if it ever answers JSON with `minAppVersion`, that wins.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiBase } from './config';
import { Store, useStore } from './store';

/** This build's version (app.json expo.version). */
export function appVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/** -1, 0 or 1, comparing dotted numeric versions ("1.10.0" > "1.9.2"). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

export type VersionState = { current: string; minimum: string | null; required: boolean; checked: boolean };

const builtMinimum = (): string | null => {
  const v = process.env.EXPO_PUBLIC_MIN_VERSION;
  return v && /^\d+(\.\d+)*$/.test(v) ? v : null;
};

function state(minimum: string | null, checked: boolean): VersionState {
  const current = appVersion();
  return { current, minimum, required: !!minimum && compareVersions(minimum, current) > 0, checked };
}

export const versionState = new Store<VersionState>(state(builtMinimum(), false));

/** Checks the gateway once per call (no signal: the built-in minimum stands). */
export async function checkVersion(fetcher: typeof fetch = fetch): Promise<VersionState> {
  let minimum = builtMinimum();
  try {
    const res = await fetcher(`${apiBase()}/version`, { headers: { Accept: 'application/json' } });
    const text = res.ok ? await res.text() : '';
    const body = text.trim().startsWith('{') ? JSON.parse(text) : null;
    if (body && typeof body.minAppVersion === 'string' && /^\d+(\.\d+)*$/.test(body.minAppVersion)) minimum = body.minAppVersion;
  } catch {
    // offline or not JSON: keep the built-in minimum
  }
  const next = state(minimum, true);
  versionState.set(next);
  return next;
}

export function useVersion(): VersionState {
  return useStore(versionState);
}

/** The design's update-required screen per face. */
export const UPDATE_SCREEN = {
  run: 'dr-31-update-required',
  dock: 'ld-26-update-required',
  store: 'sm-34-update-required',
  plan: 'dsp-38-update-required',
} as const;

/**
 * "Update now" on the update-required screens. On the web the new build is already served, so the page
 * reloads (resolves false: nothing to navigate). On a phone there is no store link to send to: it checks
 * again and resolves true only when this build is no longer below the minimum.
 */
export async function applyUpdate(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
    return false;
  }
  const v = await checkVersion().catch(() => versionState.get());
  return !v.required;
}
