'use client';
// Makes a design screen interactive: every element the generator marked with data-lk navigates
// exactly as in the Figma prototype. Screens that continue on a phone app show a notice instead.
import { useEffect, useRef, useState, type ReactNode, type MouseEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

type Target = { href?: string; app?: string; screen?: string; kind?: string };
export type ScreenNav = { links: Record<string, Target>; auto?: Target; whole?: Target };

export default function ScreenShell({ board, nav, children }: { board: string; nav: ScreenNav; children: ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<Target | null>(null);

  const go = (t: Target | undefined) => {
    if (!t) return;
    if (t.href) {
      if (t.kind === 'back' && window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back();
      else if (t.kind === 'nav') router.replace(t.href);
      else router.push(t.href);
    } else if (t.app) setToast(t);
  };

  // keyboard access for the clickable parts of the design
  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-lk]').forEach(el => {
      if (!nav.links[el.dataset.lk!]) return;
      el.setAttribute('role', el.getAttribute('role') || 'button');
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    });
  }, [nav]);

  // screens that advance by themselves (agent drafting, sync queue)
  useEffect(() => {
    if (!nav.auto) return;
    const t = setTimeout(() => go(nav.auto), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.auto]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

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
    <div ref={ref} className={`b-${board} web-screen${nav.whole ? ' is-tappable' : ''}`} onClick={onClick} onKeyDown={onKey}>
      {children}
      {toast && (
        <div className="web-toast" role="status">
          <span>Continues in <b>{toast.app}</b> on the phone: {toast.screen}</span>
          <button type="button" onClick={e => { e.stopPropagation(); setToast(null); }}>OK</button>
        </div>
      )}
    </div>
  );
}
