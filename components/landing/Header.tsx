'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Pathway', href: '#pathway' },
  { label: 'Impact', href: '#impact' },
  { label: 'Gallery', href: '#gallery' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
              W
            </div>
            <span className="font-heading text-lg font-semibold text-brand-text">
              WeThe<span className="text-brand-primary">Yuva</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-muted hover:text-brand-primary transition-colors focus:outline-none focus-visible:text-brand-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-text hover:text-brand-primary transition-colors px-4 py-2 focus:outline-none focus-visible:text-brand-primary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-brand-primary text-white px-5 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors active-bounce focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/50"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-brand-text"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="md:hidden bg-white dark:bg-slate-900 border-t border-brand-border"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-brand-muted hover:text-brand-primary transition-colors py-2 focus:outline-none focus-visible:text-brand-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-center text-brand-text border border-brand-border px-4 py-2.5 rounded-xl hover:bg-brand-bg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-border"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-center bg-brand-primary text-white px-4 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
