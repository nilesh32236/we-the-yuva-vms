'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

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
    <html lang="en">
      <body className="bg-brand-bg">
        <div className="min-h-dvh flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/50">
              <svg
                className="w-8 h-8 text-red-500 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-label="Error"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h1 className="font-heading font-bold text-xl text-brand-text">Critical error</h1>
            <p className="text-brand-muted text-sm">
              A critical error occurred. Please reload the page.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
