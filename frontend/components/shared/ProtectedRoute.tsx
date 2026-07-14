'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLE_ROUTES } from '@/lib/shared/permissions';
import type { UserRole } from '@/lib/shared/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (!allowedRoles.includes(user.role)) {
      router.replace(ROLE_ROUTES[user.role] ?? '/login');
    } else {
      setShowContent(true);
    }
  }, [user, isLoading, allowedRoles, router]);

  if (!showContent) {
    if (isLoading && !user) {
      return (
        <div className="flex items-center justify-center h-dvh">
          <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
