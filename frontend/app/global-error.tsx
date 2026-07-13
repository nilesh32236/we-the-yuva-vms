'use client';

import * as Sentry from '@sentry/nextjs';
import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-brand-bg">
        <div role="alert" className="min-h-dvh flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-error/10 flex items-center justify-center mx-auto border border-brand-error/20">
              <TriangleAlert className="w-8 h-8 text-destructive" aria-hidden="true" />
            </div>
            <h1 className="font-heading font-bold text-xl text-brand-text">Critical error</h1>
            <p className="text-brand-muted text-sm">
              A critical error occurred. Please reload the page.
            </p>
            <Button onClick={reset} variant="primary">
              Reload
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
