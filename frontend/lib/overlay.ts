// Which drawer or dialog is open over the current page (components/live/overlay.tsx shows it). ScreenShell opens one in place
// of navigating to a route listed in OVERLAY_ROUTES; the route itself still works for a direct visit.
import { useSyncExternalStore } from 'react';

export const OVERLAY_ROUTES = [
  '/plan/dsp-09-order-detail-drawer',
  '/plan/dsp-10-log-phone-order',
  '/plan/dsp-11-trip-and-vehicle-drawer',
  '/plan/dsp-12-approve-and-go-live',
  '/plan/dsp-14-notifications-panel',
  '/plan/dsp-15-late-risk-explainer',
  '/admin/adm-04-add-or-edit-person',
  '/admin/adm-07-lost-phone',
  '/admin/adm-09-edit-outlet',
  '/admin/adm-11-vehicle-status',
  '/admin/adm-19-audit-entry-detail',
] as const;

let current: string | null = null;
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach(fn => fn());
const subscribe = (fn: () => void) => { subscribers.add(fn); return () => { subscribers.delete(fn); }; };
const path = (href: string) => href.split(/[?#]/)[0];

/** True when `href` is a drawer route that opens over the current page. */
export const isOverlayRoute = (href: string) => (OVERLAY_ROUTES as readonly string[]).includes(path(href));
export function openOverlay(href: string) { current = path(href); emit(); }
export function closeOverlay() { current = null; emit(); }
/** The drawer route open now (null when none). */
export const currentOverlay = () => current;
export function useOverlay(): string | null { return useSyncExternalStore(subscribe, () => current, () => null); }
