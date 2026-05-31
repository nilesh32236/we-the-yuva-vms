import { ThemeToggle } from '../../components/theme/ThemeToggle';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">W</span>
          </div>
          <span className="font-heading font-semibold text-brand-text text-lg">WeTheYuva</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-brand-muted text-xs">
          © 2026 WeTheYuva. Connecting volunteers with purpose.
        </p>
      </footer>
    </div>
  );
}
