'use client';

import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { BottomNav } from '../../components/layout/BottomNav';
import type { NavItem } from '../../components/layout/Sidebar';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopNav } from '../../components/layout/TopNav';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/volunteer/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Profile', href: '/volunteer/profile', icon: 'User' },
  { label: 'Opportunities', href: '/volunteer/opportunities', icon: 'Briefcase' },
  { label: 'My Applications', href: '/volunteer/applications', icon: 'FileText' },
  { label: 'My Events', href: '/volunteer/events', icon: 'Calendar' },
  { label: 'Training', href: '/volunteer/training', icon: 'BookOpen' },
  { label: 'Stories', href: '/volunteer/stories', icon: 'BookOpen' },
  { label: 'Levels', href: '/volunteer/levels', icon: 'TrendingUp' },
  { label: 'Leaderboard', href: '/volunteer/leaderboard', icon: 'Trophy' },
  { label: 'Badges', href: '/volunteer/badges', icon: 'Medal' },
  { label: 'Certificates', href: '/volunteer/certificates', icon: 'Scroll' },
  { label: 'Mentorship', href: '/volunteer/mentorship', icon: 'Handshake' },
  { label: 'Impact', href: '/volunteer/impact', icon: 'BarChart' },
];

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
    if (!isLoading && user && user.role !== 'VOLUNTEER') {
      redirect('/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user || user.role !== 'VOLUNTEER') {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-brand-bg flex flex-col overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-xl focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
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
