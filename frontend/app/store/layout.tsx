// Every /store screen sits behind the face's route guard (sign-in and role check) and the desk watch (connection
// and access states, components/live/DeskWatch.tsx). Hand-written: the generator
// only writes app/store/page.tsx and the app/store/<screen>/ folders.
import type { ReactNode } from 'react';
import DeskWatch from '@/components/live/DeskWatch';
import FaceGate from '@/components/live/FaceGate';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <FaceGate face="store">
      <DeskWatch face="store" />
      {children}
    </FaceGate>
  );
}
