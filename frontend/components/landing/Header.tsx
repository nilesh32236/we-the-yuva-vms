'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Leaf, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Blog', href: '/blog' },
  { label: 'How It Works', href: '/#pathway' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-colors duration-200 ${
        scrolled
          ? 'bg-brand-surface/95 shadow-sm backdrop-blur-sm dark:bg-brand-bg/95'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span
            className={`text-lg font-bold transition-colors ${
              scrolled ? 'text-brand-text dark:text-white' : 'text-white'
            }`}
          >
            WeThe<span className="text-brand-primary">Yuva</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none ${
                scrolled
                  ? 'text-brand-muted hover:text-brand-text dark:text-brand-muted dark:hover:text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className={`text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none ${
              scrolled
                ? 'text-brand-muted hover:text-brand-text dark:text-brand-muted dark:hover:text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="active-bounce rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className={`md:hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center ${
            scrolled ? 'text-brand-text dark:text-white' : 'text-white'
          }`}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileOpen ? 'block' : 'hidden'} border-b border-brand-border bg-brand-surface pb-4 md:hidden dark:border-brand-border dark:bg-brand-bg`}>
          <nav className="flex flex-col gap-3 px-6 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-brand-muted hover:text-brand-text focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none dark:text-brand-muted dark:hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 px-6">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-brand-muted hover:text-brand-text focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none dark:text-brand-muted dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="active-bounce rounded-lg bg-brand-primary px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
            >
              Get started
            </Link>
          </div>
        </div>
    </header>
  );
}
