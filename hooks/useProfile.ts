import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AuthUser } from '../lib/auth-context';

export function useProfile() {
  return useQuery<AuthUser>({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get<AuthUser>('/users/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
