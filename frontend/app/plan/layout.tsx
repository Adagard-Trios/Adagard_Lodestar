// Every /plan screen sits behind the face's route guard (sign-in and role check). Hand-written: the generator
// only writes app/plan/page.tsx and the app/plan/<screen>/ folders.
import type { ReactNode } from 'react';
import FaceGate from '@/components/live/FaceGate';

export default function Layout({ children }: { children: ReactNode }) {
  return <FaceGate face="plan">{children}</FaceGate>;
}
