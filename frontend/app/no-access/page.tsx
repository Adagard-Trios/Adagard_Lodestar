'use client';
// Where a signed-in user without a desk role lands (loaders and drivers work in the phone apps).
import { useAuth } from '@/lib/auth/AuthProvider';
import { GateScreen } from '@/components/live/states';

export default function NoAccess() {
  const auth = useAuth();
  return (
    <GateScreen
      title="No desk access"
      text="This account works in the Lodestar phone apps (Dock or Run), not on the desk website."
      action={auth.status === 'authenticated' ? { label: 'Sign out', onClick: () => void auth.logout() } : undefined}
    />
  );
}
