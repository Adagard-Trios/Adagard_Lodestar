'use client';
// Drawers that open over the page they were opened from instead of navigating to their own route. ScreenShell sends
// a link to one of these routes here (openOverlay); OverlayHost, mounted once in the face's layout, shows the drawer
// over whatever page is on screen. The drawer's own route still works for a direct visit.
import { usePathname, useRouter } from 'next/navigation';
import { type ComponentType, type MouseEvent, useCallback, useEffect, useRef } from 'react';
import { closeOverlay, useOverlay } from '@/lib/overlay';
import { OrderDrawer } from '@/live/dsp-09-order-detail-drawer';

type Drawer = { label: string; Component: ComponentType<{ onClose?: () => void }>; links: Record<string, string> };

/** Route → the drawer shown in its place, and where its own links go (the route's design links, minus C = close). */
const DRAWERS: Record<string, Drawer> = {
  '/plan/dsp-09-order-detail-drawer': {
    label: 'Order detail',
    Component: OrderDrawer,
    links: { L153: '/plan/dsp-02-plan-board', L154: '/plan/dsp-18-outlet-profile' },
  },
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-lk], input, select, textarea';

export default function OverlayHost() {
  const route = useOverlay();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const drawer = route ? DRAWERS[route] : undefined;

  const close = useCallback(() => closeOverlay(), []);
  const pathname = usePathname();

  // another page closes the drawer (sidebar, browser back)
  useEffect(() => closeOverlay, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const before = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('.dx-close, ' + FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); before?.focus?.(); };
  }, [drawer, close]);

  if (!drawer) return null;
  const { Component, label, links } = drawer;

  // the drawer's design links: C closes it, the others close it and open their page
  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-lk]');
    const code = el?.dataset.lk;
    if (!code) return;
    e.preventDefault();
    close();
    if (links[code]) router.push(links[code]);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).dataset?.lk) onClick(e as unknown as MouseEvent);
  };

  return (
    <div ref={box} className="b-P2 mode-dispatcher pl-overlay" role="dialog" aria-modal="true" aria-label={label} onClick={onClick} onKeyDown={onKeyDown}>
      <Component onClose={close} />
    </div>
  );
}
