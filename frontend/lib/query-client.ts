import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes — keep >= staleTime so fresh data isn't GC'd too early
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
  },
});
