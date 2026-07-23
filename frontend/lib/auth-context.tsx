'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { clearQueue } from './offline-queue';
import { queryClient } from './query-client';
import { isPublicRoute } from './public-routes';
import { ROLE_ROUTES, ROLE_ROUTE_PREFIXES, ONBOARDING_ROUTES } from './shared/permissions';
import type { AuthUser } from './shared/types';
import { toast } from '@/hooks/use-toast';

export interface ProfileStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  fetchError: string | null;
  profileStatus: ProfileStatus | null;
  refetch: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const userQuery = useQuery<AuthUser | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      if (
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('logged_out') === 'true'
      ) {
        sessionStorage.removeItem('logged_out');
        return null;
      }
      try {
        const res = await api.get<AuthUser>('/users/me');
        return res.data;
      } catch (err) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr.response?.status === 401) {
            return null;
          }
        }
        throw err;
      }
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const profileStatusQuery = useQuery<ProfileStatus | null>({
    queryKey: ['profile-status'],
    queryFn: async () => {
      try {
        const res = await api.get<ProfileStatus>('/users/me/profile-status');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    retry: 1,
  });

  const user = userQuery.data ?? null;
  const isLoading = userQuery.isLoading;
  const fetchError = (() => {
    if (!userQuery.error) return null;
    if (
      userQuery.error &&
      typeof userQuery.error === 'object' &&
      'response' in userQuery.error &&
      (userQuery.error as { response?: { status?: number } }).response?.status &&
      (userQuery.error as { response?: { status?: number } }).response!.status! >= 500
    ) {
      const msg = 'Server error. Please try logging in again.';
      toast({ title: 'Authentication error', description: msg, variant: 'destructive' });
      return msg;
    }
    return null;
  })();
  const profileStatus = profileStatusQuery.data ?? null;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ['auth-user'] });
    await queryClient.refetchQueries({ queryKey: ['profile-status'] });
    return queryClient.getQueryData<AuthUser | null>(['auth-user']) ?? null;
  }, []);

  // pathname is in deps so redirects re-evaluate when the route changes.
  // The underlying userQuery uses a 30s staleTime, so this does NOT
  // trigger API calls on every navigation — it relies on cached query data.
  useEffect(() => {
    if (isLoading) return;

    if (!user && fetchError) {
      const isPublic = isPublicRoute(pathname);
      if (!isPublic) {
        router.replace('/login');
      }
      return;
    }

    if (!user) return;

    const isPublic = isPublicRoute(pathname);
    const isOnboarding = ONBOARDING_ROUTES.includes(pathname);

    if (!isPublic && !isOnboarding) {
      if (!user.consent) {
        router.replace('/consent');
      } else if (!ONBOARDING_ROUTES.some((r) => pathname.startsWith(r))) {
        const allowedPrefixes = ROLE_ROUTE_PREFIXES[user.role];
        if (allowedPrefixes && !allowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          router.replace(ROLE_ROUTES[user.role] ?? '/login');
        }
      }
    }
  }, [user, isLoading, fetchError, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear state regardless
    } finally {
      queryClient.clear();
      clearQueue();
      if (typeof document !== 'undefined') {
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        // biome-ignore lint/suspicious/noDocumentCookie: required for Edge middleware access
        document.cookie = `access_token=; path=/; max-age=0; SameSite=Strict${secure}`;
      }
      // Flag to prevent auto-refresh from re-authenticating after redirect
      sessionStorage.setItem('logged_out', 'true');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const providerValue = useMemo(
    () => ({ user, isLoading, fetchError, profileStatus, refetch, logout }),
    [user, isLoading, fetchError, profileStatus, refetch, logout],
  );

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
