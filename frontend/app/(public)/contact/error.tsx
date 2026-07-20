'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4" role="alert">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-brand-muted/50" aria-hidden="true" />
        <h1 className="font-heading font-bold text-xl text-brand-text mb-2">
          Failed to load contact page
        </h1>
        <p className="text-sm text-brand-muted mb-6">Something went wrong. Please try again.</p>
        <Button onClick={reset} variant="primary" className="font-semibold px-5 py-2.5 rounded-xl">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  );
}
