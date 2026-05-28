import { BottomNav } from '../../components/layout/BottomNav';
import type { NavItem } from '../../components/layout/Sidebar';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopNav } from '../../components/layout/TopNav';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/coordinator/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Profile', href: '/coordinator/profile', icon: 'User' },
  { label: 'Opportunities', href: '/coordinator/opportunities', icon: 'Briefcase' },
  { label: 'Events', href: '/coordinator/events', icon: 'Calendar' },
  { label: 'Volunteers', href: '/coordinator/volunteers', icon: 'Users' },
  { label: 'Reports', href: '/coordinator/reports', icon: 'BarChart' },
];

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-brand-bg flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-nav-safe md:pb-6" data-scroll>
          {children}
        </main>
      </div>
      <BottomNav navItems={navItems} />
    </div>
  );
}
