'use client';
// Drawers and dialogs that open over the page they were opened from instead of navigating to their own route.
// ScreenShell sends a link to one of these routes here (openOverlay); OverlayHost, mounted once in each face's
// layout, shows it over whatever page is on screen, inside its own board's classes. The route itself still works
// for a direct visit. A drawer's own links (useScreenNav().go or a click on its data-lk elements) close it and,
// when the link leads to another page, open that page; a drawer that saved something has the page behind it read
// its data again when it closes (refreshQueries).
import { usePathname, useRouter } from 'next/navigation';
import { type ComponentType, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScreenNavProvider, type ScreenNavApi } from '@/components/ScreenShell';
import { refreshQueries } from '@/lib/odata/hooks';
import { closeOverlay, useOverlay } from '@/lib/overlay';
import { OrderDrawer } from '@/live/dsp-09-order-detail-drawer';
import { PhoneOrderDialog } from '@/live/dsp-10-log-phone-order';
import { TripDrawer } from '@/live/dsp-11-trip-and-vehicle-drawer';
import { ApproveDialog } from '@/live/dsp-12-approve-and-go-live';
import { NotificationsDrawer } from '@/live/dsp-14-notifications-panel';
import { LateRiskDrawer } from '@/live/dsp-15-late-risk-explainer';
import { PersonDrawer } from '@/live/adm-04-add-or-edit-person';
import { LostPhoneDrawer } from '@/live/adm-07-lost-phone';
import { OutletDrawer } from '@/live/adm-09-edit-outlet';
import { VehicleStatusDrawer } from '@/live/adm-11-vehicle-status';
import { AuditEntryDrawer } from '@/live/adm-19-audit-entry-detail';

/** A page (href), or a screen that continues in a phone app. */
type Target = string | { app: string; screen: string };
type Drawer = {
  label: string;
  /** The design board whose classes style it (b-P2 plan desk, b-P6 admin). */
  board: 'P2' | 'P6';
  Component: ComponentType<{ onClose?: () => void }>;
  /** Its design links (from its route's page.tsx nav map); C, and any code not listed, closes it. */
  links: Record<string, Target>;
};

/** Route → the drawer or dialog shown in its place. */
export const DRAWERS: Record<string, Drawer> = {
  '/plan/dsp-09-order-detail-drawer': {
    label: 'Order detail', board: 'P2', Component: OrderDrawer,
    links: { L153: '/plan/dsp-02-plan-board', L154: '/plan/dsp-18-outlet-profile' },
  },
  '/plan/dsp-10-log-phone-order': {
    label: 'Log phone order', board: 'P2', Component: PhoneOrderDialog,
    links: { L54: '/plan/dsp-01-cutoff-queue' },
  },
  '/plan/dsp-11-trip-and-vehicle-drawer': {
    label: 'Trip and vehicle', board: 'P2', Component: TripDrawer,
    links: { L157: '/plan/dsp-02-plan-board' },
  },
  '/plan/dsp-12-approve-and-go-live': {
    label: 'Approve and go live', board: 'P2', Component: ApproveDialog,
    links: { L5: { app: 'Lodestar Dock', screen: 'LD-01 Dock queue' }, L161: '/plan/dsp-08-today-overview' },
  },
  '/plan/dsp-14-notifications-panel': {
    label: 'Notifications', board: 'P2', Component: NotificationsDrawer,
    links: { L56: '/plan/dsp-13-exceptions-inbox', L57: '/plan/dsp-20-settings' },
  },
  '/plan/dsp-15-late-risk-explainer': {
    label: 'Late-risk explainer', board: 'P2', Component: LateRiskDrawer,
    links: { L58: '/plan/dsp-a1b-provisional-deferral', L59: '/plan/dsp-16-models-and-fallbacks' },
  },
  '/admin/adm-04-add-or-edit-person': {
    label: 'Add or edit person', board: 'P6', Component: PersonDrawer,
    links: { L290: '/admin/adm-03-people-and-roles' },
  },
  '/admin/adm-07-lost-phone': {
    label: 'Lost phone', board: 'P6', Component: LostPhoneDrawer,
    links: { L293: '/admin/adm-06-devices' },
  },
  '/admin/adm-09-edit-outlet': {
    label: 'Edit outlet', board: 'P6', Component: OutletDrawer,
    links: { L296: '/admin/adm-08-outlets' },
  },
  '/admin/adm-11-vehicle-status': {
    label: 'Vehicle status', board: 'P6', Component: VehicleStatusDrawer,
    links: { L298: '/admin/adm-10-vehicles' },
  },
  // its close button (L305, the audit log on the route) just closes it over the page it was opened from
  '/admin/adm-19-audit-entry-detail': {
    label: 'Audit entry', board: 'P6', Component: AuditEntryDrawer,
    links: {},
  },
};

type Toast = { message?: string; app?: string; screen?: string };

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-lk], input, select, textarea';
const pathOf = (href: string) => href.split(/[?#]/)[0];

export default function OverlayHost() {
  const route = useOverlay();
  const router = useRouter();
  const pathname = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const changed = useRef(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const drawer = route ? DRAWERS[route] : undefined;

  // a drawer that saved something has the page behind it read its data again
  const close = useCallback(() => {
    closeOverlay();
    if (changed.current) refreshQueries();
    changed.current = false;
  }, []);

  // another page closes the drawer (sidebar, browser back)
  useEffect(() => () => { closeOverlay(); changed.current = false; }, [pathname]);

  const follow = useCallback((code: string) => {
    const t = drawer?.links[code];
    if (t && typeof t !== 'string') { setToast(t); return true; }
    close();
    if (t && pathOf(t) !== pathname) router.push(t);
    return true;
  }, [drawer, close, pathname, router]);

  // the drawer's own navigation: links it follows after an action count as a change to the page behind
  const nav = useMemo<ScreenNavApi>(() => ({
    go: code => { changed.current = true; return follow(code); },
    notify: message => { changed.current = true; setToast({ message }); },
  }), [follow]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!drawer) return;
    const before = document.activeElement as HTMLElement | null;
    const root = box.current;
    // keyboard access for its design links, as ScreenShell gives a page's; rows arrive with their data
    const mark = () => root?.querySelectorAll<HTMLElement>('[data-lk]').forEach(el => {
      if (!el.getAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    });
    mark();
    const mo = root && typeof MutationObserver !== 'undefined' ? new MutationObserver(mark) : null;
    if (root) mo?.observe(root, { childList: true, subtree: true });
    root?.querySelector<HTMLElement>('.dx-close, ' + FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => { mo?.disconnect(); document.removeEventListener('keydown', onKey); before?.focus?.(); };
  }, [drawer, close]);

  const toastEl = toast && (
    <div className="web-toast" role="status">
      {toast.message ? <span>{toast.message}</span> : <span>Continues in <b>{toast.app}</b> on the phone: {toast.screen}</span>}
      <button type="button" onClick={() => setToast(null)}>OK</button>
    </div>
  );
  if (!drawer) return toastEl;
  const { Component, label, board } = drawer;

  const onClick = (e: MouseEvent) => {
    const code = (e.target as HTMLElement).closest<HTMLElement>('[data-lk]')?.dataset.lk;
    if (!code) return;
    e.preventDefault();
    follow(code);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).dataset?.lk) onClick(e as unknown as MouseEvent);
  };

  return (
    <>
      <ScreenNavProvider value={nav}>
        <div ref={box} className={`b-${board} mode-dispatcher pl-overlay`} role="dialog" aria-modal="true" aria-label={label} onClick={onClick} onKeyDown={onKeyDown}>
          <Component onClose={close} />
        </div>
      </ScreenNavProvider>
      {toastEl}
    </>
  );
}
