# Audit: Error Handling & Monitoring

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Sentry is configured in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` with `tracesSampleRate: 0.1`. All three files are marked as Phase 2 — they warn if DSN is missing and skip initialization. Error boundaries exist at the root (`app/error.tsx`, `app/global-error.tsx`), at route group level (`(admin)/error.tsx`, `(auth)/error.tsx`, `(coordinator)/error.tsx`, `(observer)/error.tsx`, `(org-admin)/error.tsx`, `(volunteer)/error.tsx`), and at specific feature routes (`scan/error.tsx`, `notifications/error.tsx`, `(public)/contact/error.tsx`, `(public)/opportunities/error.tsx`). Loading pages (`loading.tsx`) mirror this structure. The axios response interceptor in `lib/api.ts` normalizes errors into `error.normalizedMessage` for network/timeout/API errors. The auth context logs errors with `console.error` during session fetch. React Query error states (`isError`) are available but usage depends on component-level handling. A `not-found.tsx` exists at root level.

Scan target directories recursively (`app/`, `lib/api.ts`, `lib/auth-context.tsx`, `sentry.*.config.ts`, `components/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Sentry Configuration
- DSN missing check — `console.warn` when not configured — intended for local dev but swallowed in production?
- `tracesSampleRate: 0.1` — appropriate for production or should be lower?
- `environment: process.env.NODE_ENV` — distinguishes dev/staging/prod?
- Server-side Sentry init guards against missing DSN — but no Sentry SDK calls wrapped in try/catch
- All three config files (client, server, edge) have same Phase 2 pattern

### Error Boundary Coverage
- `global-error.tsx` catches root errors (renders outside layout)
- `error.tsx` at route group levels — do they offer retry actions or just display messages?
- Error boundaries missing for feature routes like `(volunteer)/`, `(coordinator)/` feature pages
- `error.tsx` components use `'use client'` directive and receive `error` + `reset` props
- Recovery via `reset()` function — wired to a "Try Again" button?

### API Error Handling
- Axios interceptor normalizes network errors, timeouts, and API errors to `error.normalizedMessage`
- `error.response?.data` parsing — handles string, object with `.error`, object with `.message`, and fallback
- Components consuming `error.normalizedMessage` or raw error?
- Token refresh failure redirects to `/login` — preserves `sessionStorage` flag correctly
- Refresh endpoint itself failing — handled?

### React Query Error States
- `isError` state checked in query consumers — renders fallback UI?
- Mutation `onError` callbacks surface errors via toast (`components/ui/toaster.tsx`)
- `useOfflineCheckin` `onError` passes error message string — consumed by caller or lost?
- Retry logic (`retry: 1` in query client) — appropriate or should be per-query?

### Graceful Degradation
- Network failure shown via `NetworkStatusIndicator` component
- Offline check-in falls back to IndexedDB queue — user feedback on queued state
- Skeleton loaders (`components/ui/skeleton.tsx`) shown during query loading
- Fallback pages (`not-found.tsx`) user-friendly with navigation link

### Client-side Error Logging
- `console.error` in `auth-context.tsx` — logs session fetch failures without PII
- `console.error` in `PushSubscriber.tsx` and `usePushNotifications.tsx` — push subscription errors logged
- `console.warn` in Sentry config files — acceptable for missing DSN
- Any `console.log` that could leak sensitive data in production?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Unhandled promise rejection, missing error boundary on critical route, Sentry DSN in client bundle, error page crash loop
- **important**: Console.error in production, error boundary without retry, missing loading skeleton, mutation error not shown to user
- **minor**: Non-optimistic Sentry trace rate, missing not-found page on dynamic routes, verbose error logging

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
