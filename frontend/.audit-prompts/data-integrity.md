# Audit: Data Integrity

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Zod schemas live in `lib/shared/schemas/` with 14 schema files: `auth.schemas.ts`, `profile.schemas.ts`, `opportunity.schemas.ts`, `organization.schemas.ts`, `blog.schemas.ts`, `alerts.schemas.ts`, `feedback.schemas.ts`, `levels.schemas.ts`, `mentorship.schemas.ts`, `notifications.schemas.ts`, `stories.schemas.ts`, `training.schemas.ts`, `youth.schemas.ts`, `admin.schemas.ts`. These are re-exported via `lib/shared/index.ts` barrel file. Types are in `lib/shared/types/index.ts`. Forms use `react-hook-form` with `@hookform/resolvers/zod` for validation. The offline queue in `lib/offline-queue.ts` uses IndexedDB to store check-in data when offline, then syncs on reconnect. API responses are typed but not validated against Zod schemas at runtime — types are assumed to match backend.

Scan target directories recursively (`lib/shared/`, `components/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Zod Schema Completeness
- Every form submission backed by a Zod schema via `@hookform/resolvers/zod`?
- Schema `.refine()` or `.superRefine()` used for cross-field validation (e.g., password confirm, date ranges)?
- Proper error messages on each `.refine()` — user-friendly messages for field validation failures?
- Optional fields clearly marked with `.optional()` or `.nullable()`?
- Enums match backend enum values (case-sensitive)?

### Type Safety
- API response types in `lib/shared/types/index.ts` — do they match Zod schema output types?
- Any `as` type assertions used to cast API responses instead of Zod `.parse()`?
- `z.infer<typeof Schema>` used consistently for inferred types?
- Union types for different API response shapes (success vs error)?

### Form Data Constraints
- String min/max lengths enforced in Zod schemas (prevent DB constraint violations)?
- Number fields have `.min()`/`.max()` where applicable
- Email fields use `.email()` validator
- URL fields use `.url()` validator
- Date fields use `.date()` or `.datetime()` with proper format strings
- Array fields have `.min()`/`.max()` length constraints

### Data Relationships
- Foreign key references (e.g., `organizationId`, `eventId`) typed as strings but not cross-validated
- Schema for related entities nested or referenced by ID?
- Optimistic update data shapes match API response shapes (to avoid UI desync after `setQueryData`)

### Offline Data Integrity
- `lib/offline-queue.ts` — queued check-in data validated before storage?
- Conflict resolution when multiple offline check-ins are synced after reconnect
- Timestamp handling — `createdAt` uses `Date.now()` (local time) instead of server time

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing validation allows malformed data to reach API, type mismatch causes runtime crash, schema allows invalid enum values
- **important**: Missing string length constraints, optional fields not marked, insufficient error messages, offline data not validated
- **minor**: Missing `.max()` on number fields, overly permissive regex, type inferred but not exported

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
