'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ContactErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertTriangle
          className="w-12 h-12 mx-auto mb-4 text-brand-muted/50"
          aria-hidden="true"
        />
        <h1 className="font-heading font-bold text-xl text-brand-text mb-2">
          Failed to load contact page
        </h1>
        <p className="text-sm text-brand-muted mb-6">
          Something went wrong. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
