import { useAuth } from './useAuth';

export function useProfile() {
  const { user, refetch, isLoading: authLoading } = useAuth();
  return { data: user, refetch, isLoading: authLoading };
}
