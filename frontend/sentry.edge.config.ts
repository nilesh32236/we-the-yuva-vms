// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) {
  console.warn('[Sentry] DSN not configured — skipping init');
} else {
  try {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  } catch (e) {
    console.error('[Sentry] Failed to initialize edge:', e);
  }
}
