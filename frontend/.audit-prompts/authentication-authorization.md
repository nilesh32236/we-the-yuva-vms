# Audit: Authentication & Authorization

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Auth is handled client-side via `lib/auth-context.tsx` using a JWT-based flow with the `jose` library on the server. Tokens are stored in both an in-memory variable (`memoryToken` in `lib/api.ts`) and a cookie (`access_token`) for Edge middleware access. The `api` axios instance (`lib/api.ts`) attaches the Bearer token via request interceptor and auto-refreshes on 401 responses via a `/auth/refresh` endpoint. There is **no middleware.ts** in the project — route protection relies on layout-level checks and client-side redirects. The `AuthProvider` in `app/providers.tsx` wraps all routes and fetches `/users/me` to populate the `AuthUser` context. Token refresh uses a singleton `refreshPromise` pattern to avoid concurrent refresh calls. Logout clears both memory token and cookie, sets a `sessionStorage` flag to prevent re-auth loops, and redirects to `/login`.

Scan target directories recursively (`lib/`, `hooks/useAuth.ts`, `app/(auth)/`, `app/providers.tsx`). Output findings to `.audit-output.jsonl`.

## What to Check

### Token Storage & Handling
- JWT stored in cookie without `HttpOnly` flag (readable via `document.cookie` — verify Secure/SameSite flags)
- `memoryToken` being reset on page refreshes (cookie fallback path checked)
- `setAccessToken` call coverage — is it called after login, register, and refresh?
- Token expiry detection — nothing in client code checks `exp` claim before making requests
- Refresh token rotation — does the refresh endpoint return a new `accessToken` only, or also a new refresh token?

### Auth Context & Provider
- `AuthProvider` skips `fetchUser` on public routes — are public routes correctly identified via `isPublicRoute`?
- Onboarding redirect logic (`/consent`, `/setup-profile`) — can it loop if consent/profile check fails silently?
- `useAuth` hook exposed via both `hooks/useAuth.ts` (re-export) and `lib/auth-context.tsx` — consistent usage?
- `isLoading` handling — are all child components handling the loading state properly (skeleton/spinner before redirect)?
- Race condition between route group layout mount and `AuthProvider` fetch completion

### Route Protection
- No `middleware.ts` exists — how are protected routes enforced without server-side guard?
- Each route group layout (`(volunteer)/`, `(coordinator)/`, `(org-admin)/`, `(admin)/`, `(observer)/`) should check `useAuth` — verify they do
- Can a volunteer access `/admin/dashboard` by typing the URL directly?
- Are role-based route guards consistent across all route group layouts?

### Authentication Endpoints
- Login, register, verify-otp flow — do they all call `setAccessToken`?
- Password reset flow — any endpoints for forgot/reset password in `lib/shared/schemas/auth.schemas.ts`?
- OTP verification flow (`app/(auth)/verify-otp/`) — timeout/expiry handling
- Session fetch error handling — `console.error` in `fetchUser` leaks no PII?

### Token Refresh
- `refreshPromise` singleton — what happens if refresh itself returns 401?
- `sessionStorage logged_out` flag checked before auto-refresh — can this be spoofed?
- Retry flag (`_retry`) on `originalRequest` — prevents infinite loops
- Refresh response sets cookie manually — does it also update `memoryToken`?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Direct auth bypass, token leak, privilege escalation, session hijack
- **important**: Missing protection on routes, weak token handling, insufficient validation
- **minor**: Inefficient patterns, missing error feedback, minor UX issues

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
