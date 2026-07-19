import Link from 'next/link';
import { Twitter, Instagram, Linkedin, Youtube, Mail, MapPin } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Browse Opportunities', href: '/opportunities' },
    { label: 'Events & Drives', href: '/volunteer/events' },
    { label: 'Training Modules', href: '/volunteer/training' },
    { label: 'Leaderboard', href: '/volunteer/leaderboard' },
    { label: 'My Dashboard', href: '/volunteer/dashboard' },
  ],
  Organisation: [
    { label: 'Register NGO / Organisation', href: '/register' },
    { label: 'Manage Coordinators', href: '/organization/coordinators' },
    { label: 'Impact Reports', href: '/organization/reports' },
    { label: 'Post Opportunities', href: '/organization/opportunities' },
  ],
  Explore: [
    { label: 'How It Works', href: '/#pathway' },
    { label: 'Opportunities', href: '/opportunities' },
    { label: 'About Us', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/wetheyuva', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/wetheyuva', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/wetheyuva', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/@wetheyuva', label: 'YouTube' },
];

export function Footer() {
  return (
    <footer className="bg-slate-950 dark:bg-slate-950 text-brand-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-5 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link
              href="/"
              className="mb-5 inline-block rounded-lg font-heading text-lg font-bold text-white tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              WeThe<span className="text-brand-primary">Yuva</span>
            </Link>

            <p className="mb-6 max-w-xs text-sm leading-relaxed text-brand-muted">
              Building India&apos;s largest youth volunteer network — empowering young citizens to
              lead, serve, and transform their communities from the ground up.
            </p>

            {/* Contact info */}
            <div className="mb-6 space-y-2.5">
              <a
                href="mailto:hello@wetheyuva.org"
                className="group flex items-center gap-2.5 text-xs text-brand-muted transition-colors duration-200 hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:rounded"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-brand-primary" />
                hello@wetheyuva.org
              </a>
              <div className="flex items-center gap-2.5 text-xs text-brand-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Pan-India &middot; Est. 2023
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-lg bg-brand-surface text-brand-muted transition-colors duration-200 hover:bg-brand-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="col-span-1">
              <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-muted transition-colors duration-200 hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-brand-border py-8 sm:flex-row pb-safe">
          <p className="text-xs text-brand-muted">
            &copy; {new Date().getFullYear()} WeTheYuva. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-brand-muted">
            <Link
              href="/privacy"
              className="transition-colors hover:text-brand-muted focus:outline-none focus-visible:text-brand-muted"
            >
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-brand-muted focus:outline-none focus-visible:text-brand-muted"
            >
              Terms of Service
            </Link>
            <span>&middot;</span>
            <span className="text-brand-muted">Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
