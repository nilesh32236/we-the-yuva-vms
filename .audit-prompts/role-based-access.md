# Audit: Role-Based Access

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** The app has 5 route groups separated by role: `(volunteer)/`, `(coordinator)/`, `(org-admin)/`, `(admin)/`, `(observer)/` plus `(public)/` and `(auth)/`. There is **no middleware.ts** — route protection is enforced client-side via layout-level `useAuth` checks. The `AuthUser` type in `lib/auth-context.tsx` defines roles: `VOLUNTEER`, `COORDINATOR`, `ORGANIZATION_ADMIN`, `PLATFORM_MANAGER`, `ADMIN`, `OBSERVER`. A permissions system exists in `lib/shared/permissions.ts` with granular string constants (e.g., `OPPORTUNITY_CREATE`, `EVENT_CHECKIN`, `STORY_MODERATE`). The `AuthUser` includes an optional `permissions` array. The `isPublicRoute` helper in `lib/public-routes.ts` determines which paths skip auth entirely. The onboarding redirect in `AuthProvider` enforces consent acceptance and profile setup before accessing protected routes.

Scan target directories recursively (`app/`, `lib/shared/permissions.ts`, `components/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Route Group Isolation
- Each route group layout (`(coordinator)/layout.tsx`, `(org-admin)/layout.tsx`, etc.) must verify the current user's role before rendering children
- Can a volunteer access `/coordinator/events/new` by typing the URL directly?
- Observer routes — read-only enforced at component level (no edit/create actions rendered)?
- Each layout has its own `error.tsx` and `loading.tsx` for role-specific fallbacks

### Component-Level Permission Checks
- Components that perform actions (create, edit, delete) check `user.permissions` before rendering action buttons
- `Permissions` constants from `lib/shared/permissions.ts` used consistently for checks
- API-level authorization — client-side checks alone are insufficient; do components assume server will enforce?
- Conditional rendering based on role vs permissions — which takes precedence?

### Admin & Super Admin Access
- `(admin)/` layout — restricts to ADMIN and PLATFORM_MANAGER roles?
- Organization-specific data scoping — org-admin sees only their org's data; admin sees all
- Platform Manager role — how does it differ from ADMIN?

### Onboarding & Consent Flow
- Consent verification (`user.consent`) before accessing protected routes
- Profile setup required for VOLUNTEER role before proceeding
- `locationId` requirement for COORDINATOR/ADMIN/OBSERVER — verified?
- What happens if user navigates to a protected route before completing onboarding — correct redirect?

### Permission Constants Coverage
- `Permissions` object has 30+ string constants — are all used in components?
- Any hardcoded permission strings instead of using `Permissions.X` constants?
- Missing permissions for specific actions (e.g., can cert download be restricted?)

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Cross-role data access, missing server-side authorization, admin-only data exposed to volunteers
- **important**: No client-side role guard on layout, orphan permission constants, missing error redirect for unauthorized access
- **minor**: Inefficient permission check, redundant role checks, inconsistent guard pattern between route groups

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
