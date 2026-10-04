// Lodestar Dock on the web: phone screens below 768px, and from 768px (a bay tablet or a desk browser) the TABLET
// variant of a screen wherever the design (P3) has one: LD-01 dock queue ↔ LD-21 bay overview, LD-02 load sheet ↔
// LD-02 tablet, LD-04 release vehicle ↔ LD-22 release checklist, LD-12 ↔ LD-23 plan changed. The tablet-only
// screens (LD-20 shared sign-in, LD-27 tablet locked) fall back to their phone counterparts on a phone width.
// Native builds always show the phone screens.
import { useSyncExternalStore } from 'react';
import { Dimensions, Platform, useWindowDimensions } from 'react-native';

export const WIDE_MIN = 768;

const TO_TABLET: Record<string, string> = {
  'ld-01-dock-queue': 'ld-21-bay-overview',
  'ld-02-load-sheet': 'ld-02-load-sheet-tablet',
  'ld-04-release-vehicle': 'ld-22-release-checklist',
  'ld-12-plan-changed': 'ld-23-plan-changed',
};
const TO_PHONE: Record<string, string> = {
  ...Object.fromEntries(Object.entries(TO_TABLET).map(([phone, tablet]) => [tablet, phone])),
  'ld-20-shared-sign-in': 'ld-06-sign-in',
  'ld-27-tablet-locked': 'ld-01-dock-queue',
};

/** The Dock screen to show for `key` at this width (`wide`: web, 768px and up); other keys are unchanged. */
export function dockVariant(key: string, wide: boolean): string {
  return (wide ? TO_TABLET[key] : TO_PHONE[key]) ?? key;
}

/** True in a web window 768px and wider right now (for navigation outside React). */
export function isWideWeb(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && Dimensions.get('window').width >= WIDE_MIN;
}

const noSubscribe = () => () => {};

/**
 * True in a web window 768px and wider. False on the first pass: the web build is pre-rendered without a window,
 * so the width is read once mounted (no hydration mismatch).
 */
export function useWideWeb(): boolean {
  return useWebWidth() === 'wide';
}

/** 'wide' or 'narrow' in a mounted web window; null on native and on the web's pre-rendered first pass. */
export function useWebWidth(): 'wide' | 'narrow' | null {
  const { width } = useWindowDimensions();
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (Platform.OS !== 'web' || !mounted) return null;
  return width >= WIDE_MIN ? 'wide' : 'narrow';
}
