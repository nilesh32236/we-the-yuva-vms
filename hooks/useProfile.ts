import { useAuth } from './useAuth';

export function useProfile() {
  const { user, refetch } = useAuth();
  return { data: user, refetch, isLoading: !user };
}
