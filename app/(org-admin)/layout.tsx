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
  return (
    <div className="h-dvh bg-brand-bg flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} />
        <main id="main" className="flex-1 overflow-y-auto p-4 md:p-6 pb-nav-safe md:pb-6" data-scroll>
          {children}
        </main>
      </div>
      <BottomNav navItems={navItems} />
    </div>
  );
}
