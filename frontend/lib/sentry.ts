import * as Sentry from '@sentry/nextjs';

type ApiErrorLike = {
  normalizedMessage?: string;
  response?: { status?: number };
  config?: { url?: string; method?: string };
};

export function captureApiError(
  err: unknown,
  fallbackMessage: string,
  extra?: Record<string, unknown>
) {
  try {
    const apiErr = err as ApiErrorLike;
    const message =
      apiErr?.normalizedMessage ?? (err instanceof Error ? err.message : fallbackMessage);
    Sentry.captureException(err instanceof Error ? err : new Error(message), {
      extra: {
        ...(extra ?? {}),
        fallbackMessage,
        ...(apiErr?.normalizedMessage ? { normalizedMessage: apiErr.normalizedMessage } : {}),
        ...(apiErr?.response?.status != null ? { httpStatus: apiErr.response.status } : {}),
        ...(apiErr?.config?.url ? { requestUrl: apiErr.config.url } : {}),
        ...(apiErr?.config?.method ? { requestMethod: apiErr.config.method } : {}),
      },
    });
  } catch {
    // Defensive: Sentry must never break the app.
  }
}
