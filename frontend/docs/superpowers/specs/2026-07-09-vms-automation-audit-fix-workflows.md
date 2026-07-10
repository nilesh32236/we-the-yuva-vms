# VMS Audit, Fix & Review Automation Workflows

## Context

Migrate the autonomous audit→fix→review workflow system from qrolichealth (static marketing site) to we-the-yuva-vms (full-stack Volunteer Management System). The VMS app has auth (JWT, roles), data fetching (TanStack Query), PWA (Serwist), Sentry, rich forms (react-hook-form + Zod), and 6 user role groups — requiring completely different audit categories.

## What's Being Created

### 3 Workflow Files (`we-the-yuva-vms/.github/workflows/`)

| File | Trigger | Purpose |
|---|---|---|
| `codebase-audit.yml` | `schedule (weekly)` + `workflow_dispatch` | Weekly scan → dedup issues → create critical/important issues |
| `fix-audit-issue.yml` | `issue_comment (/fix)` | OpenCode fixes an issue → creates autofix PR |
| `review-autofix-pr.yml` | `pull_request (opened/synchronize)` | Reviews autofix PRs, applies fixes, labels for manual merge |

### 12 Audit Prompt Files (`we-the-yuva-vms/.audit-prompts/`)

1. `authentication-authorization.md` — JWT, route guards, role checks, session mgmt
2. `api-data-fetching.md` — TanStack Query, axios, error handling, pagination
3. `role-based-access.md` — Route group RBAC, component-level guards, API scoping
4. `security.md` — PII exposure, XSS (Tiptap), CSRF, input sanitization
5. `data-integrity.md` — Zod schemas, form validation, DB constraints
6. `pwa-offline.md` — Serwist SW, offline UX, push notifications, cache strategies
7. `ui-ux-accessibility.md` — Dark mode, mobile, forms, keyboard nav, ARIA
8. `code-quality-conventions.md` — Biome, AGENTS.md conventions, dead code
9. `error-handling-monitoring.md` — Sentry, error boundaries, API error handling
10. `performance.md` — Image optimization, bundles, re-renders, code splitting
11. `forms-validation.md` — react-hook-form, Zod, field errors, submission states
12. `state-management.md` — React Query cache, local vs server state, contexts

### 1 Modified File

`opencode-review.yml` — restrict PR triggers to `/oc` commands only (same pattern as qrolichealth)

## Key Differences from QrolicHealth

| Aspect | QrolicHealth (static) | WeTheYuva VMS (app) |
|---|---|---|
| Package manager | pnpm@10 | pnpm@9 |
| Biome indent | tabs | spaces (2) |
| Biome quotes | double | single |
| Biome trailing commas | JS: yes / JSON: no | es5 (both) |
| Token | `GH_PAT \|\| GITHUB_TOKEN` fallback | `GH_PAT` exists — use directly |
| Audit prompts | SEO, meta, static content | Auth, RBAC, API, PWA, Sentry, forms |
| Lint command | `biome check .` | `biome lint app components lib hooks` |

## Architecture

```
Weekly Cron ──→ codebase-audit.yml ──→ .audit-prompts/*.md ──→ Issues created
                     │
                     ▼
         /fix comment on issue ──→ fix-audit-issue.yml ──→ autofix PR
                                                              │
                                                              ▼
                                                  review-autofix-pr.yml
                                                              │
                                                              ▼
                                                Label: autofix:reviewed
                                                (manual merge by user)
```

## Verification

- `pnpm lint` passes
- `pnpm typecheck` passes
- Workflows are YAML-valid (no syntax errors)

## Non-Goals

- No auto-merge or auto-approve
- No test framework setup (Playwright exists but not configured)
- No changes to app source code or business logic
