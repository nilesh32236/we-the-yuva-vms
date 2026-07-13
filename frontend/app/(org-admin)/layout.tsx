'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLE_ROUTES } from '@/lib/shared/permissions';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { BottomNav } from '../../components/layout/BottomNav';
import type { NavItem } from '../../components/layout/Sidebar';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopNav } from '../../components/layout/TopNav';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/organization/dashboard', icon: 'LayoutDashboard' },
  { label: 'Profile', href: '/organization/profile', icon: 'User' },
  { label: 'Coordinators', href: '/organization/coordinators', icon: 'Users' },
  { label: 'Opportunities', href: '/organization/opportunities', icon: 'Briefcase' },
  { label: 'Events', href: '/organization/events', icon: 'Calendar' },
  { label: 'Reports', href: '/organization/reports', icon: 'BarChart' },
];

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
    if (!isLoading && user && user.role !== 'ORGANIZATION_ADMIN') {
      redirect(ROLE_ROUTES[user.role] ?? '/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user || user.role !== 'ORGANIZATION_ADMIN') {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-brand-bg flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} />
        <main
          id="main"
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-nav-safe md:pb-6"
          data-scroll
        >
          {children}
        </main>
      </div>
      <BottomNav navItems={navItems} />
    </div>
  );
}
