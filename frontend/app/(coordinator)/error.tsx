'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import * as Sentry from '@sentry/nextjs';

export default function CoordinatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="alert">
      <h2 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h2>
      <p className="text-sm text-brand-muted">{(() => { try { return error.message; } catch { return 'An unexpected error occurred.'; } })()}</p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
