# Audit: API Endpoints

You are auditing the **WeTheYuva backend API** — an Express + TypeScript REST API with Prisma ORM, Zod validation, JWT auth, BullMQ queues, and Redis caching.

**Important context:** Modules follow a controller → service → routes pattern under `src/modules/<name>/`. Shared Zod schemas live in `src/shared/schemas/`. Auth middleware chain: `validate(schema)` → `requireAuth` → `requireRole/requirePermission` → handler. Swagger at `/api/v1/docs`. All tests mock Prisma/Redis/BullMQ via vitest.

Scan the `src/` directory recursively. Output findings to `.audit-output.jsonl`.

## What to Check

### REST Design
- Routes follow `/api/v1/<resource>` pattern? Consistent pluralization?
- HTTP methods appropriate (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes)?
- Response status codes correct (200, 201, 204, 400, 401, 403, 404, 422, 500)?
- Error responses follow a consistent shape (`{ success, error, data }` or similar)?
- Pagination implemented on list endpoints? Consistent `page`/`limit` params?

### Input Validation (Zod)
- Every request body/query/params validated via Zod schemas from `src/shared/schemas/`?
- Schemas exported from `src/shared/schemas/` also used by frontend in `frontend/lib/shared/schemas/` — are they in sync?
- File uploads validated (size, type, count limits)?
- Missing validation on optional fields that could cause crashes?

### Route Configuration
- Routes registered in the correct module router? Not duplicated across modules?
- Module routers mounted in `src/app.ts`? Path prefix matches?
- `express-rate-limit` is a dependency but not wired in `app.ts` — should it be?

### Middleware Chain
- Every protected route has the full chain: `validate` → `requireAuth` → `requireRole/requirePermission`?
- `requireRole`/`requirePermission` checks use the correct role/permission enum values?
- Public routes explicitly allow unauthenticated access?
- Error middleware catches and formats all errors consistently?

### Database Queries
- Prisma queries use proper `include`/`select` — no over-fetching?
- N+1 query patterns in list endpoints? Using Prisma `include` for relations correctly?
- Missing transactions where multiple writes should be atomic?
- Pagination uses `skip`/`take` with proper ordering?
- Raw queries (`$queryRaw`) parameterized — no SQL injection?

## Output Format

Write findings to `.audit-output.jsonl`:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing auth middleware, SQL injection, broken auth, data loss risk, unvalidated input on destructive operations
- **important**: Missing pagination, inconsistent error responses, missing transactions, N+1 queries, missing route registration
- **minor**: Non-standard status codes, naming inconsistencies, missing JSDoc, unused imports

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk/impact
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
