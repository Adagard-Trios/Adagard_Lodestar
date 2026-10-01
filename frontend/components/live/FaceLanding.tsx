'use client';
// /plan, /store and /admin. In the design preview they open the face's sign-in screen (the prototype's start);
// signed in, they open the face's home screen. The face gate around them has already sent anonymous users to
// Keycloak and users of another role to their own face.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDesignMode } from '@/lib/mode';
import { GateScreen } from './states';

export default function FaceLanding({ signIn, home }: { signIn: string; home: string }) {
  const design = useDesignMode();
  const router = useRouter();
  useEffect(() => {
    if (design === null) return;
    router.replace(design ? signIn : home);
  }, [design, home, router, signIn]);
  return <GateScreen busy title="Opening Lodestar…" />;
}
