// Every /admin screen sits behind the face's route guard (sign-in and role check) and the desk watch (connection
// and access states, components/live/DeskWatch.tsx); its drawers open over the page (components/live/overlay.tsx).
// Hand-written: the generator only writes app/admin/page.tsx and the app/admin/<screen>/ folders.
import type { ReactNode } from 'react';
import DeskWatch from '@/components/live/DeskWatch';
import FaceGate from '@/components/live/FaceGate';
import OverlayHost from '@/components/live/overlay';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <FaceGate face="admin">
      <DeskWatch face="admin" />
      {children}
      <OverlayHost />
    </FaceGate>
  );
}
