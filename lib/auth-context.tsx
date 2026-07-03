'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setAccessToken } from './api';
import { queryClient } from './query-client';
import { isPublicRoute } from './public-routes';

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  role:
    | 'VOLUNTEER'
    | 'COORDINATOR'
    | 'ORGANIZATION_ADMIN'
    | 'PLATFORM_MANAGER'
    | 'ADMIN'
    | 'OBSERVER';
  permissions?: string[];
  organizationId?: string | null;
  status: string;
  profile?: {
    skills: string[];
    interests: string[];
    availability: { days: string[]; timeSlots: string[] };
    bio?: string | null;
    avatarUrl?: string | null;
    totalHours: number;
  } | null;
  consent?: {
    privacyPolicyAccepted: boolean;
    mediaConsentAccepted: boolean;
    acceptedAt: string;
  } | null;
  locationId?: string | null;
  volunteerType?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    // Skip if user just logged out (sessionStorage flag set during logout)
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('logged_out') === 'true') {
      sessionStorage.removeItem('logged_out');
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get<AuthUser>('/users/me');
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status && axiosErr.response.status >= 500) {
          console.error('Server error during session fetch - will retry on next navigation');
        }
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isPublicRoute(window.location.pathname)) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isLoading || !user) return;

    const isPublic = isPublicRoute(pathname);
    const isOnboarding = ['/consent', '/setup-profile'].includes(pathname);

    if (!isPublic && !isOnboarding) {
      if (!user.consent) {
        router.replace('/consent');
      } else if (user.role === 'VOLUNTEER' && !user.profile) {
        router.replace('/setup-profile');
      } else if (
        ['COORDINATOR', 'ADMIN', 'OBSERVER', 'ORGANIZATION_ADMIN', 'PLATFORM_MANAGER'].includes(
          user.role
        ) &&
        !user.locationId
      ) {
        router.replace('/setup-profile');
      }
    }
  }, [user, isLoading, pathname, router]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — clear state regardless
    } finally {
      setUser(null);
      setAccessToken(null);
      queryClient.clear();
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
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
