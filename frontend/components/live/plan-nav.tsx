'use client';
// Lodestar Plan and Lodestar Admin sidebar on a narrow window (< 1024 px): a compact top bar with a menu button opens the sidebar as an
// off-canvas drawer (backdrop, Escape and the backdrop close it, Tab stays inside while it is open). Wider windows
// hide the bar and show the sidebar in place (icon rail from 1024 to 1279 px); see
// app/styles/plan-desk.css.
import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

const PLAN_BRAND = (
  <>
    <svg viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="8" fill="#3B4CCA" /><g transform="translate(7.36 7.36) scale(0.72)" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></g></svg>
    Lodestar Plan
  </>
);

/**
 * The drawer's state and its top bar; the sidebar it opens is the element with id `navId` (default `plan-nav`).
 * `brand` is the logo and name shown in the bar (default Lodestar Plan's).
 */
export function usePlanDrawer({ navId = 'plan-nav', brand = PLAN_BRAND }: { navId?: string; brand?: ReactNode } = {}): { open: boolean; bar: ReactNode } {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  // a navigation closes the drawer (the sidebar items navigate in place)
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const aside = document.getElementById(navId);
    aside?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !aside) return;
      const els = Array.from(aside.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || !aside.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !aside.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    // the drawer only exists below 1024 px: widening the window closes it
    const mq = window.matchMedia('(min-width: 1024px)');
    const onWide = () => { if (mq.matches) close(false); };
    mq.addEventListener('change', onWide);
    return () => { document.removeEventListener('keydown', onKey); mq.removeEventListener('change', onWide); };
  }, [open, close, navId]);

  const bar = (
    <>
      <div className="pl-top">
        <button
          ref={btnRef}
          type="button"
          className="pl-burger"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls={navId}
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="pl-top__brand">{brand}</span>
      </div>
      {open && <div className="pl-backdrop" aria-hidden onClick={e => { e.stopPropagation(); close(); }} />}
    </>
  );
  return { open, bar };
}
