'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { clearQueue } from './offline-queue';
import { queryClient } from './query-client';
import { isPublicRoute } from './public-routes';
import {
  ROLE_ROUTES,
  ROLE_ROUTE_PREFIXES,
  ONBOARDING_ROUTES,
  REQUIRES_LOCATION_ROLES,
} from './shared/permissions';
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
  profileStatusError: string | null;
  refetch: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const userQuery = useQuery<AuthUser | null>({
    queryKey: ['auth-user'],
    enabled: !isPublicRoute(pathname),
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
  });

  const profileStatusQuery = useQuery<ProfileStatus | null>({
    queryKey: ['profile-status'],
    queryFn: async () => {
      try {
        const res = await api.get<ProfileStatus>('/users/me/profile-status');
        return res.data;
      } catch (err) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number } };
          // 404/401 = no profile or unauthenticated; treat as "no data", not an error
          if (axiosErr.response?.status === 404 || axiosErr.response?.status === 401) {
            return null;
          }
        }
        // Rethrow so transient failures surface as profileStatusError instead of
        // being silently swallowed (which previously hid the completion banner).
        throw err;
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
      return 'Server error. Please try logging in again.';
    }
    return null;
  })();

  useEffect(() => {
    if (
      userQuery.error &&
      typeof userQuery.error === 'object' &&
      'response' in userQuery.error &&
      (userQuery.error as { response?: { status?: number } }).response?.status &&
      (userQuery.error as { response?: { status?: number } }).response!.status! >= 500
    ) {
      toast({
        title: 'Authentication error',
        description: 'Server error. Please try again.',
        variant: 'destructive',
        role: 'alert',
      });
    }
  }, [userQuery.error]);
  const profileStatus = profileStatusQuery.data ?? null;
  const profileStatusError = profileStatusQuery.isError
    ? 'Could not load your profile status.'
    : null;

  const refetch = useCallback(async () => {
    // NOTE: do NOT use queryClient.refetchQueries() here — it silently skips
    // DISABLED queries, and on public routes (login, verify-otp) the auth-user
    // query is enabled:false. That made post-OTP refetch a no-op, so auth state
    // never populated and the redirect never happened until a hard refresh.
    // Fetching matching queries directly via query.fetch() works in all cases.
    const refetchByKey = async (queryKey: string[]) => {
      const queries = queryClient.getQueryCache().findAll({ queryKey });
      await Promise.all(
        queries.map((query) =>
          query.fetch().catch(() => {
            // Mirror refetchQueries semantics: never throw unless requested.
          })
        )
      );
    };
    await refetchByKey(['auth-user']);
    await refetchByKey(['profile-status']);
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
      } else if (user.role === 'VOLUNTEER' && !user.profile) {
        router.replace('/setup-profile');
      } else if (
        REQUIRES_LOCATION_ROLES.includes(user.role) &&
        !user.locationId
      ) {
        router.replace('/setup-profile');
      } else if (!ONBOARDING_ROUTES.some((r) => pathname.startsWith(r))) {
        const allowedPrefixes = ROLE_ROUTE_PREFIXES[user.role];
        if (allowedPrefixes && !allowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          router.replace(ROLE_ROUTES[user.role] ?? '/login');
        }
      }
    }
  }, [user, isLoading, fetchError, pathname, router]);

  const logout = useCallback(async () => {
    // Flag to prevent auto-refresh from re-authenticating after redirect
    sessionStorage.setItem('logged_out', 'true');
    try {
      // Best-effort: tell the backend this device's push endpoint is no longer
      // subscribed for the logged-out account, so it stops pushing to a
      // signed-out (possibly shared) device. Must run BEFORE /auth/logout
      // clears the auth cookie, otherwise this request 401s and is a no-op.
      // keepalive:true lets the request survive the navigation below.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          ?.getRegistration()
          .then((registration) => registration?.pushManager?.getSubscription?.())
          .then((subscription) => {
            if (subscription) {
              return fetch('/api/v1/notifications/unsubscribe', {
                method: 'POST',
                keepalive: true,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
              });
            }
          })
          .catch(() => {
            // Best-effort cleanup — failure is non-fatal.
          });
      }

      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear state regardless
    } finally {
      queryClient.clear();
      clearQueue();
      if ('serviceWorker' in navigator) {
        const controller = navigator.serviceWorker?.controller;
        if (controller) {
          controller.postMessage({ type: 'LOGOUT' });
        } else {
          navigator.serviceWorker
            ?.getRegistration()
            .then((registration) => registration?.active?.postMessage({ type: 'LOGOUT' }))
            .catch(() => {
              // Best-effort purge — the SW cleans up on its next activation.
            });
        }
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const providerValue = useMemo(
    () => ({ user, isLoading, fetchError, profileStatus, profileStatusError, refetch, logout }),
    [user, isLoading, fetchError, profileStatus, profileStatusError, refetch, logout],
  );

  // IMPORTANT-3 (audit #203): Never mount protected trees before the
  // consent/profile/locationId/role guard has settled. Otherwise children (and
  // their TanStack Query hooks) fire API calls during the pre-redirect render
  // window for a logged-in user who has not yet accepted consent or completed
  // onboarding. The redirect effect above still runs; this merely ensures the
  // protected tree does not render (and fetch) in the meantime.
  const isPublic = isPublicRoute(pathname);
  const isOnboarding = ONBOARDING_ROUTES.includes(pathname);
  const requiresRedirect =
    !isPublic &&
    !isOnboarding &&
    !!user &&
    (!user.consent ||
      (user.role === 'VOLUNTEER' && !user.profile) ||
      (REQUIRES_LOCATION_ROLES.includes(user.role) && !user.locationId) ||
      (() => {
        const allowedPrefixes = ROLE_ROUTE_PREFIXES[user.role];
        return allowedPrefixes
          ? !allowedPrefixes.some((prefix) => pathname.startsWith(prefix))
          : false;
      })());

  const renderChildren = isPublic || isOnboarding || !user || (!isLoading && !requiresRedirect);

  const resolvedChildren = renderChildren ? (
    children
  ) : (
    <div
      id="main"
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthContext.Provider value={providerValue}>
      {resolvedChildren}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
