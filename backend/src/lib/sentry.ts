// Phase 2 (future): Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
import * as Sentry from '@sentry/node';
import { logger } from './logger';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry disabled — no SENTRY_DSN configured');
    return;
  }
  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSendTransaction(event) {
        if (event.request?.data) delete event.request.data;
        if (event.request?.headers) {
          const sensitive = ['authorization', 'cookie', 'x-api-key'];
          for (const header of sensitive) {
            if (event.request.headers[header]) event.request.headers[header] = '[REDACTED]';
          }
        }
        return event;
      },
    });
  } catch (err) {
    logger.warn('Sentry init failed', { error: (err as Error).message });
  }
}
