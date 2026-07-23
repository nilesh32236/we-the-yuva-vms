'use client';

import {
  Award,
  BarChart,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Medal,
  Scroll,
  Search,
  Settings,
  TrendingUp,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const ICONS = {
  Award,
  BarChart,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Medal,
  Scroll,
  Search,
  Settings,
  TrendingUp,
  Trophy,
  User,
  Users,
} as const;

export type NavIconName = keyof typeof ICONS;

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  disabled?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-brand-surface border-r border-brand-border h-full flex-shrink-0">
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.icon];

          if (item.disabled) {
            return (
              <div
                key={item.href}
                tabIndex={-1}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-40 cursor-not-allowed select-none card-hover"
                aria-disabled="true"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-muted" aria-hidden="true" />
                </div>
                <span className="text-sm text-brand-muted flex-1 truncate">{item.label}</span>
                <span className="text-[9px] font-bold text-brand-muted bg-brand-bg px-1.5 py-0.5 rounded-full border border-brand-border uppercase tracking-wide">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 cursor-pointer group relative active-bounce focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none
                ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active left bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/50" />
              )}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                ${isActive ? 'bg-white/20' : 'bg-brand-bg group-hover:bg-brand-surface'}`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-primary'}`}
                  aria-hidden="true"
                />
              </div>
              <span
                className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-white' : ''}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom branding */}
      <div className="p-4 border-t border-brand-border flex-shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-heading font-bold text-xs">W</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-text leading-none">WeTheYuva VMS</p>
            <p className="text-[10px] text-brand-muted mt-0.5">v1.0 · Phase 2</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
