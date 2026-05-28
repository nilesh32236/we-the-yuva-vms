import { BottomNav } from '../../components/layout/BottomNav';
import type { NavItem } from '../../components/layout/Sidebar';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopNav } from '../../components/layout/TopNav';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Profile', href: '/admin/profile', icon: 'User' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Opportunities', href: '/admin/opportunities', icon: 'Briefcase' },
  { label: 'Events', href: '/admin/events', icon: 'Calendar' },
  { label: 'Stories', href: '/admin/stories', icon: 'BookOpen' },
  { label: 'Reports', href: '/admin/reports', icon: 'BarChart' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
