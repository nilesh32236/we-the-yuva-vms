'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { PushSubscriber } from '@/components/PushSubscriber';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { NetworkStatusIndicator } from '@/components/shared/NetworkStatusIndicator';
import { AuthProvider } from '@/lib/auth-context';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <PushSubscriber />
          <NetworkStatusIndicator />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
