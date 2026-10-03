'use client';
// Makes a design screen interactive: every element the generator marked with data-lk navigates
// exactly as in the Figma prototype. Screens that continue on a phone app show a notice instead.
// Live screens (frontend/live/<key>.tsx) render inside the same shell, so their data-lk elements navigate the
// same way; they use useScreenNav() to follow a link after an action succeeds, or to show a short notice.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDesignMode } from '@/lib/mode';
import { isOverlayRoute, openOverlay } from '@/lib/overlay';

type Target = { href?: string; app?: string; screen?: string; kind?: string };
export type ScreenNav = { links: Record<string, Target>; auto?: Target; whole?: Target };

type Toast = Target & { message?: string };

export interface ScreenNavApi {
  /** Follow the design link with this data-lk code (as if it had been clicked). Returns false if it isn't wired. */
  go(code: string): boolean;
  /** Show a short notice in the design's toast style. */
  notify(message: string): void;
}

const NavContext = createContext<ScreenNavApi | null>(null);

/** Gives a drawer shown outside any shell (components/live/overlay.tsx) its own navigation. */
export const ScreenNavProvider = NavContext.Provider;

/** Inside a live screen: the shell's navigation. Outside a shell (unit tests), a no-op. */
export function useScreenNav(): ScreenNavApi {
  return useContext(NavContext) ?? { go: () => false, notify: () => undefined };
}

export default function ScreenShell({ board, nav, live = false, children }: { board: string; nav: ScreenNav; live?: boolean; children: ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const design = useDesignMode();

  const go = useCallback((t: Target | undefined) => {
    if (!t) return;
    if (t.href) {
      // a drawer opens over this page rather than on its own route (components/live/overlay.tsx)
      if (t.kind === 'go' && isOverlayRoute(t.href) && !window.location.pathname.startsWith(t.href)) openOverlay(t.href);
      else if (t.kind === 'back' && window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back();
      else if (t.kind === 'nav') router.replace(t.href);
      else router.push(t.href);
    } else if (t.app) setToast(t);
  }, [router]);

  // keyboard access for the clickable parts of the design; live screens add and remove rows as data arrives
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mark = () => root.querySelectorAll<HTMLElement>('[data-lk]').forEach(el => {
      if (!nav.links[el.dataset.lk!]) return;
      if (!el.getAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    });
    mark();
    if (typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(mark);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [nav]);

  // screens that advance by themselves (agent drafting, sync queue); a live screen advances on real events instead
  const autoOn = Boolean(nav.auto) && (!live || design === true);
  useEffect(() => {
    if (!autoOn) return;
    const t = setTimeout(() => go(nav.auto), 1500);
    return () => clearTimeout(t);
  }, [autoOn, go, nav.auto]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const api = useMemo<ScreenNavApi>(() => ({
    go: code => {
      const t = nav.links[code];
      if (!t) return false;
      go(t);
      return true;
    },
    notify: message => setToast({ message }),
  }), [go, nav]);

  const activate = (target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest<HTMLElement>('[data-lk]');
    const t = el && nav.links[el.dataset.lk!];
    if (t) { go(t); return true; }
    if (nav.whole) { go(nav.whole); return true; }
    return false;
  };
  const onClick = (e: MouseEvent) => { if (activate(e.target)) e.preventDefault(); };
  const onKey = (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).dataset?.lk) { e.preventDefault(); activate(e.target); } };

  return (
    <NavContext.Provider value={api}>
      <div ref={ref} className={`b-${board} web-screen${nav.whole ? ' is-tappable' : ''}`} onClick={onClick} onKeyDown={onKey}>
        {children}
        {toast && (
          <div className="web-toast" role="status">
            {toast.message ? <span>{toast.message}</span> : <span>Continues in <b>{toast.app}</b> on the phone: {toast.screen}</span>}
            <button type="button" onClick={e => { e.stopPropagation(); setToast(null); }}>OK</button>
          </div>
        )}
      </div>
    </NavContext.Provider>
  );
}
