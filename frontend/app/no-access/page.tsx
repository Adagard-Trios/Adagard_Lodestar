'use client';
// Where a signed-in user without a desk role lands. Loaders and drivers work in the field app (/field/, Dock and
// Run): the page sends them straight to their sign-in there instead of leaving them at a dead end.
import { useAuth } from '@/lib/auth/AuthProvider';
import { fieldAppFor } from '@/lib/auth/session';
import { GateScreen } from '@/components/live/states';

export default function NoAccess() {
  const auth = useAuth();
  const roles = auth.session?.roles ?? [];
  return (
    <GateScreen
      title="No desk access"
      text="This account works in the Lodestar field app (Dock or Run), not on the desk website."
      link={{ label: 'Open the field app', href: fieldAppFor(roles) }}
      action={auth.status === 'authenticated' ? { label: 'Sign out', onClick: () => void auth.logout() } : undefined}
    />
  );
}
