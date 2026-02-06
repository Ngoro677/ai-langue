'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClientErrorBoundary>
      <SessionProvider>{children}</SessionProvider>
    </ClientErrorBoundary>
  );
}
