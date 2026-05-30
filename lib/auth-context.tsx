'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from './api';
import { queryClient } from './query-client';

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  role: 'VOLUNTEER' | 'COORDINATOR' | 'ADMIN' | 'OBSERVER';
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
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
        // biome-ignore lint/suspicious/noDocumentCookie: required for Edge middleware access
        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Strict; Secure';
      }
      // Flag to prevent auto-refresh from re-authenticating after redirect
      sessionStorage.setItem('logged_out', 'true');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
