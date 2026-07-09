'use client';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import * as Sentry from '@sentry/nextjs';

export default function VolunteerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    Sentry.captureException(error);
    containerRef.current?.focus();
  }, [error]);

  return (
    <div ref={containerRef} tabIndex={-1} className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="alert">
      <h2 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h2>
      <p className="text-sm text-brand-muted">{error.message}</p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
