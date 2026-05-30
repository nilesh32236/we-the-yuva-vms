'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { PushSubscriber } from '../components/PushSubscriber';
import { Toaster } from '../components/ui/toaster';
import { AuthProvider } from '../lib/auth-context';
import { queryClient } from '../lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <PushSubscriber />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
