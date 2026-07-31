'use client';

import { Ellipsis, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { haptic } from '@/lib/haptic';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ICONS, type NavItem } from './Sidebar';

interface BottomNavProps {
  navItems: NavItem[];
}

export function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useFocusTrap(menuOpen);

  const activeItems = navItems.filter((item) => !item.disabled);
  const visibleItems = activeItems.slice(0, 4);
  const overflowItems = activeItems.slice(4);
  const moreActive = overflowItems.some((item) => isActive(item.href));

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border z-30 touch-select-none pb-safe"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {visibleItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => haptic.light()}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-150 cursor-pointer min-w-[60px] active:scale-95 active-bounce focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none
                  ${active ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
                aria-current={active ? 'page' : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                  ${active ? 'bg-brand-bg' : ''}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span
                  className={`text-xs font-semibold leading-none text-center ${active ? 'text-brand-primary' : ''}`}
                >
                  {item.label.replace(/^My\s+/i, '')}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          {overflowItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setMenuOpen(true);
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-150 cursor-pointer min-w-[60px] active:scale-95 active-bounce focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none
                ${moreActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
              aria-label="More menu items"
              aria-expanded={menuOpen}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${moreActive ? 'bg-brand-bg' : ''}`}
              >
                <Ellipsis className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold leading-none text-center">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Overlay drawer for overflow items */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            ref={drawerRef}
            className="absolute bottom-0 left-0 right-0 bg-brand-surface rounded-t-2xl border-t border-brand-border shadow-xl animate-in slide-in-from-bottom-8 duration-200 overscroll-contain pb-safe"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                More menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-brand-muted hover:bg-brand-bg hover:text-brand-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="px-3 pb-4 space-y-0.5 max-h-[60vh] overflow-y-auto">
              {overflowItems.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      haptic.light();
                      setMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150 cursor-pointer
                      ${active ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${active ? 'bg-white/20' : 'bg-brand-bg'}`}
                    >
                      <Icon
                        className={`w-4 h-4 ${active ? 'text-white' : 'text-brand-primary'}`}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
