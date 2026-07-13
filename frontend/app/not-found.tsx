import { CircleAlert } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-surface flex items-center justify-center mx-auto border border-brand-border">
          <CircleAlert className="w-8 h-8 text-brand-accent" aria-hidden="true" />
        </div>
        <h1 className="font-heading font-bold text-xl text-brand-text">Page not found</h1>
        <p className="text-brand-muted text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors active-bounce card-hover"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
