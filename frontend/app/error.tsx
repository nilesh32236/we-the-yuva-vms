'use client';

import * as Sentry from '@sentry/nextjs';
import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div role="alert" className="min-h-dvh bg-brand-bg flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-error/10 flex items-center justify-center mx-auto border border-brand-error/20">
          <TriangleAlert className="w-8 h-8 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h1>
        <p className="text-brand-muted text-sm">An unexpected error occurred. Please try again.</p>
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
      </div>
    </div>
  );
}
