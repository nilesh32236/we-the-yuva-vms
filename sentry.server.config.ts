import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.warn('[Sentry] DSN not configured — skipping init');
} else {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
