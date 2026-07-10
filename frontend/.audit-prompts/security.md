# Audit: Security

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** JWT tokens stored in both memory (`lib/api.ts` `memoryToken`) and a non-HttpOnly cookie (`access_token`) accessible via `document.cookie`. The axios response interceptor manually writes the cookie with `SameSite=Strict` and conditional `Secure` flag. Sentry is configured in `sentry.client.config.ts` and `sentry.server.config.ts` (Phase 2 — currently warns if DSN missing). A Tiptap rich text editor is used (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`) — potential XSS vector if HTML output is rendered without sanitization. Next.js security headers are set in `next.config.ts`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. The CSP includes `'unsafe-inline'` and `'unsafe-eval'` for scripts. QR code scanning uses `html5-qrcode`. Rewrites proxy all `/api/v1/*` requests to the backend. No `middleware.ts` exists for server-side request validation.

Scan target directories recursively (`lib/`, `app/`, `components/`, `hooks/`, `next.config.ts`). Output findings to `.audit-output.jsonl`.

## What to Check

### JWT & Cookie Security
- `access_token` cookie lacks `HttpOnly` flag — readable by JavaScript (XSS risk)
- `Secure` flag conditionally applied based on `window.location.protocol` — inconsistent in dev vs prod
- Token storage in `memoryToken` is non-persistent, correct? But cookie fallback is persistent
- Refresh endpoint (`/auth/refresh`) should set HttpOnly cookie for the refresh token

### XSS Vectors
- Tiptap editor output rendered with `dangerouslySetInnerHTML` anywhere?
- `lib/shared/schemas/blog.schemas.ts` — does blog content schema sanitize HTML?
- Any user-generated content rendered without escaping (stories, feedback, profiles)?
- `noDangerouslySetInnerHtml` Biome rule is **off** in biome.json — deliberate for Tiptap HTML rendering?

### PII & Data Exposure
- `console.error` calls in `auth-context.tsx` and `usePushNotifications.ts` — could leak PII in browser logs
- Sentry breadcrumbs — could include request data with PII; is `attachProps` configured?
- API error responses surfaced directly in UI via `error.normalizedMessage` — could leak internal details
- User email, phone, address in URL params or query strings

### API Security
- No middleware for server-side authorization — API endpoint access relies on backend entirely
- Rewrite proxy exposes backend directly — any risk of path traversal?
- Form submissions (`react-hook-form` + Zod) — server-side re-validation URL unknown; client-only validation?
- File upload (`Permissions.FILE_UPLOAD`) — size/type limits enforced client-side?

### Security Headers & CSP
- CSP in `next.config.ts` includes `'unsafe-inline'` and `'unsafe-eval'` — necessary for Next.js but reduces XSS protection
- `connect-src` includes `apiOrigin` — validated origin?
- `Permissions-Policy` restricts camera, microphone, geolocation — correct
- HSTS preload enabled — correct
- `X-Frame-Options: DENY` — prevents clickjacking

### Miscellaneous
- `html5-qrcode` library — can camera access be triggered without user consent?
- Secrets in source code — any API keys, tokens hardcoded in components or config?
- Rate limiting — any client-side throttling on form submissions or auth attempts?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: PII leak, XSS vector, missing HttpOnly on auth cookie, hardcoded secrets, CSP bypass
- **important**: Broad CSP, console.log debug output, missing input sanitization, exposed error details
- **minor**: Conditional Secure flag in dev, non-blocking issues, Sentry config warnings

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
