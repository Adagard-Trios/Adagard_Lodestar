'use client';
// Design preview: the website can show the generated design screens as a static, clickable prototype (no sign-in,
// no data), which is what the Cypress click-through and the design reviews use.
//
//   NEXT_PUBLIC_LODESTAR_MODE=design   build a design-only prototype (no sign-in at all)
//   NEXT_PUBLIC_DESIGN_PREVIEW=off     production: the preview switch below is disabled
//   ?design=1 / ?design=0              turn the preview on/off for this tab (kept in sessionStorage)
//
// The preview never weakens access to data: it only shows the design's sample markup, and the API still requires
// a valid token for every call.
import { useSyncExternalStore } from 'react';

export const DESIGN_KEY = 'lodestar.design';

export function previewAllowed(): boolean {
  return process.env.NEXT_PUBLIC_DESIGN_PREVIEW !== 'off';
}

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reads (and applies a ?design= switch in the URL to) the design-preview flag. Browser only. */
export function isDesignMode(): boolean {
  if (process.env.NEXT_PUBLIC_LODESTAR_MODE === 'design') return true;
  if (!previewAllowed()) return false;
  const s = storage();
  const flag = new URLSearchParams(window.location.search).get('design');
  if (flag !== null) {
    if (/^(1|true|on|yes)$/i.test(flag)) s?.setItem(DESIGN_KEY, '1');
    else s?.removeItem(DESIGN_KEY);
  }
  return s?.getItem(DESIGN_KEY) === '1';
}

export function setDesignMode(on: boolean) {
  const s = storage();
  if (on) s?.setItem(DESIGN_KEY, '1');
  else s?.removeItem(DESIGN_KEY);
}

const noop = () => () => undefined;

/** true/false in the browser; null while prerendering and hydrating (render a neutral placeholder then). */
export function useDesignMode(): boolean | null {
  return useSyncExternalStore<boolean | null>(noop, isDesignMode, () => null);
}
