'use client';
// Site-wide client state: the OIDC session and the API/realtime clients built on it.
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ApiProvider } from '@/lib/odata/hooks';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ApiProvider>{children}</ApiProvider>
    </AuthProvider>
  );
}
