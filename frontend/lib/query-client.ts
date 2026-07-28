import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 60 * 1000, // 1 minute

      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
  },
});
