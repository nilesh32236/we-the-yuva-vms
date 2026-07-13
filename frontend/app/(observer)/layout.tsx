'use client';

import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { BottomNav } from '../../components/layout/BottomNav';
import type { NavItem } from '../../components/layout/Sidebar';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopNav } from '../../components/layout/TopNav';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/observer/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Profile', href: '/observer/profile', icon: 'User' },
  { label: 'Opportunities', href: '/observer/opportunities', icon: 'Briefcase' },
  { label: 'Events', href: '/observer/events', icon: 'Calendar' },
  { label: 'Reports', href: '/observer/reports', icon: 'BarChart' },
  { label: 'Stories', href: '/observer/stories', icon: 'BookOpen' },
];

export default function ObserverLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
    if (!isLoading && user && user.role !== 'OBSERVER') {
      redirect('/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user || user.role !== 'OBSERVER') {
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
