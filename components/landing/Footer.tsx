import Link from 'next/link';

const footerLinks = {
  Platform: [
    { label: 'Opportunities', href: '/volunteer/opportunities' },
    { label: 'Events', href: '/volunteer/events' },
    { label: 'Training', href: '/volunteer/training' },
    { label: 'Leaderboard', href: '/volunteer/leaderboard' },
  ],
  Organization: [
    { label: 'Register', href: '/register' },
    { label: 'Coordinators', href: '/organization/coordinators' },
    { label: 'Reports', href: '/organization/reports' },
  ],
  About: [
    { label: 'Mission', href: '#about' },
    { label: 'Pathway', href: '#pathway' },
    { label: 'Impact', href: '#impact' },
    { label: 'Gallery', href: '#gallery' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-emerald-950 dark:bg-slate-950 text-emerald-100/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                W
              </div>
              <span className="font-heading text-lg font-semibold text-white">
                WeThe<span className="text-emerald-400">Yuva</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Building India&apos;s largest youth volunteer network — empowering young citizens to
              lead and serve their communities.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-emerald-300 transition-colors focus:outline-none focus-visible:text-emerald-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-emerald-900 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-emerald-100/50">
            &copy; {new Date().getFullYear()} WeTheYuva. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-emerald-100/50">Volunteer Management System</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
