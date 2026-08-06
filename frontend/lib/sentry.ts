import * as Sentry from '@sentry/nextjs';

type ApiErrorLike = { normalizedMessage?: string; response?: { status?: number } };

export function captureApiError(
  err: unknown,
  fallbackMessage: string,
  extra?: Record<string, unknown>
) {
  const apiErr = err as ApiErrorLike;
  const message =
    apiErr?.normalizedMessage ?? (err instanceof Error ? err.message : fallbackMessage);
  Sentry.captureException(new Error(message), {
    extra: {
      ...(extra ?? {}),
      ...(apiErr?.response?.status ? { httpStatus: apiErr.response.status } : {}),
    },
  });
}
