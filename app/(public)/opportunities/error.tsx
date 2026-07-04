'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OpportunitiesErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-brand-muted/50" aria-hidden="true" />
        <h1 className="font-heading font-bold text-xl text-brand-text mb-2">
          Failed to load opportunities
        </h1>
        <p className="text-sm text-brand-muted mb-6">
          Something went wrong while fetching the latest opportunities. Please try again.
        </p>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  );
}
