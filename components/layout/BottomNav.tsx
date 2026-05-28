'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ICONS, type NavItem } from './Sidebar';

interface BottomNavProps {
  navItems: NavItem[];
}

export function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();
  const mobileItems = navItems.filter((item) => !item.disabled).slice(0, 4);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer min-w-[60px]
                ${isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                ${isActive ? 'bg-brand-bg' : ''}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-semibold leading-none ${isActive ? 'text-brand-primary' : ''}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
