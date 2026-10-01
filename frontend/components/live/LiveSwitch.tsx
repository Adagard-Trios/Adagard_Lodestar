'use client';
// Chooses between a screen's live version (frontend/live/<key>.tsx) and its generated design. Used by the pages
// tools/screengen/gen-web.js writes for screens that have a live file. Both render inside ScreenShell, so the
// design's data-lk navigation works either way.
import type { ReactNode } from 'react';
import { useDesignMode } from '@/lib/mode';

export default function LiveSwitch({ live, children }: { live: ReactNode; children: ReactNode }) {
  const design = useDesignMode();
  if (design === null) return null; // hydrating: the face gate shows its own placeholder until it knows
  return <>{design ? children : live}</>;
}
