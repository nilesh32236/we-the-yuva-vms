'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLE_ROUTES } from '@/lib/shared/permissions';
import type { UserRole } from '@/lib/shared/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, fetchError, refetch } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    // A 5xx from /users/me is a transient server error — do NOT log the user
    // out. proxy.ts is the authoritative server-side guard; show a retry screen
    // instead of bouncing to /login on a transient backend failure.
    if (fetchError) {
      setShowContent(false);
      return;
    }
    if (!user) {
      router.replace('/login');
    } else if (!allowedRoles.includes(user.role as UserRole)) {
      router.replace(ROLE_ROUTES[user.role] ?? '/login');
    } else {
      setShowContent(true);
    }
  }, [user, isLoading, fetchError, allowedRoles, router]);

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-3 px-4 text-center">
        <p className="text-sm font-medium text-brand-text">We couldn&apos;t load your session.</p>
        <p className="text-xs text-brand-muted max-w-sm">{fetchError}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (!showContent) {
    if (isLoading && !user) {
      return (
        <div className="flex items-center justify-center h-dvh">
          <div
            className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"
            role="status"
            aria-label="Loading your profile"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-dvh">
        <p className="text-sm text-brand-muted">Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}