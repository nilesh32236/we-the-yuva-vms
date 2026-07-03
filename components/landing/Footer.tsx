import Link from 'next/link';
import { Leaf, Twitter, Instagram, Linkedin, Youtube, Mail, MapPin } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Volunteer Opportunities', href: '/volunteer/opportunities' },
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
    { label: 'About Us', href: '#about' },
    { label: 'Growth Pathway', href: '#pathway' },
    { label: 'Impact Stats', href: '#impact' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Volunteer Stories', href: '#testimonials' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/wetheyuva', label: 'Follow us on Twitter/X' },
  { icon: Instagram, href: 'https://instagram.com/wetheyuva', label: 'Follow us on Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/wetheyuva', label: 'Connect on LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/@wetheyuva', label: 'Watch on YouTube' },
];

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-heading text-lg font-bold text-white tracking-tight">
                WeThe<span className="text-emerald-400">Yuva</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs text-slate-400 mb-6">
              Building India&apos;s largest youth volunteer network — empowering young citizens
              to lead, serve, and transform their communities from the ground up.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 mb-6">
              <a href="mailto:hello@wetheyuva.org" className="flex items-center gap-2.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors duration-200 group focus:outline-none focus-visible:text-emerald-400">
                <Mail className="w-3.5 h-3.5 shrink-0 group-hover:text-emerald-400 transition-colors" />
                hello@wetheyuva.org
              </a>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Pan-India · Est. 2023
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
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="col-span-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-emerald-400 transition-colors duration-200 focus:outline-none focus-visible:text-emerald-400"
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
        <div className="border-t border-slate-800 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} WeTheYuva. All rights reserved. · Volunteer Management System
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors focus:outline-none focus-visible:text-slate-400">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-400 transition-colors focus:outline-none focus-visible:text-slate-400">Terms of Service</Link>
            <span>·</span>
            <span className="text-slate-700">Made with ♥ for India&apos;s youth</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
