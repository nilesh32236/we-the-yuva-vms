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
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Profile', href: '/admin/profile', icon: 'User' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Organizations', href: '/admin/organizations', icon: 'Building2' },
  { label: 'Opportunities', href: '/admin/opportunities', icon: 'Briefcase' },
  { label: 'Events', href: '/admin/events', icon: 'Calendar' },
  { label: 'Stories', href: '/admin/stories', icon: 'BookOpen' },
  { label: 'Blog', href: '/admin/blog', icon: 'FileText' },
  { label: 'Level Requests', href: '/admin/level-requests', icon: 'TrendingUp' },
  { label: 'Badges', href: '/admin/badges', icon: 'Award' },
  { label: 'Reports', href: '/admin/reports', icon: 'BarChart' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
    if (!isLoading && user && user.role !== 'ADMIN' && user.role !== 'PLATFORM_MANAGER') {
      redirect(ROLE_ROUTES[user.role] ?? '/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user || (user.role !== 'ADMIN' && user.role !== 'PLATFORM_MANAGER')) {
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
