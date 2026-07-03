'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf } from 'lucide-react';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Pathway', href: '#pathway' },
  { label: 'Impact', href: '#impact' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Stories', href: '#testimonials' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'px-4 pt-3'
          : 'px-0 pt-0'
      }`}
    >
      <div
        className={`mx-auto max-w-7xl transition-all duration-500 ${
          scrolled
            ? 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/8 border border-white/60 dark:border-slate-700/60 px-4'
            : 'px-4 sm:px-6 lg:px-8'
        }`}
      >
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`font-heading text-lg font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-slate-800 dark:text-white' : 'text-white'}`}>
              WeThe<span className="text-emerald-400">Yuva</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  scrolled
                    ? 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                scrolled
                  ? 'text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-emerald-700/30 hover:shadow-lg transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              scrolled ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-300' : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <nav
          className="md:hidden mx-4 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold text-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold text-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
