# Audit: Code Quality & Conventions

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Biome is configured in `biome.json` with spaces (2) indent, single quotes, semicolons always, trailing commas in JS (es5), no trailing commas in JSON, `noUnusedVariables` and `noUnusedImports` set to warn, `noExplicitAny` warn, `noConsole` off, `noDangerouslySetInnerHtml` off, `useExhaustiveDependencies` warn. Lint runs with `pnpm lint` targeting `app components lib hooks`. AGENTS.md conventions: single quotes in JS/TS, double quotes in JSON; spaces 2 indent; theme tokens via `cn()` and CSS variables (never raw hex); Lucide icons (no emoji icons); CSS animations (no framer-motion); forms use react-hook-form + Zod. The `cn()` utility in `lib/utils.ts` uses `clsx` + `tailwind-merge`. A barrel file at `lib/shared/index.ts` re-exports all schemas and helpers. Sentry config files have Phase 2 comments.

Scan target directories recursively (`app/`, `components/`, `lib/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Biome Compliance
- Single quotes used in all JS/TS files (double quotes only in JSON/config)
- Semicolons present at end of statements
- Trailing commas in JS arrays/objects (es5 mode — trailing commas in multi-line, no trailing commas in single-line)
- No unused variables or imports (`noUnusedVariables`/`noUnusedImports` warns)
- No `any` type without explicit biome suppression comment (`noExplicitAny`)
- Consistent 2-space indentation (no tabs)

### Project Conventions from AGENTS.md
- Theme tokens used via `cn()` with `bg-brand-primary`, `text-brand-text`, etc. — no raw hex values
- Lucide icons used exclusively (check for emoji icons like ❌, ✅, ⚠️ in components)
- No framer-motion imports or `motion.*` JSX elements — CSS animations used instead
- `react-hook-form` with Zod resolver for forms (`@hookform/resolvers/zod`)
- CSS class ordering convention (Tailwind best practices) — consistent across files

### Dead Code & Debug Artifacts
- `console.log` calls not wrapped in `if (process.env.NODE_ENV !== 'production')` — investigate intentional/unintentional
- `console.error` used for error logging — acceptable per `noConsole: off`
- Commented-out code blocks in components
- Phase 2 / TODO comments that block functionality (`// Phase 2: Outside MVP Phase 1 scope`)
- Unused component props or state variables

### Barrel File Hygiene
- `lib/shared/index.ts` re-exports 14 schema files plus helpers and types — tree-shakable?
- Imports from `@/lib/shared` vs direct imports from specific schema files
- Circular dependencies possible through barrel re-exports

### Naming Conventions
- File names: `kebab-case` for components (`opportunity-form.tsx`), PascalCase for component exports
- Constants: `UPPER_SNAKE_CASE` (e.g., `Permissions` object keys, `PUBLIC_ROUTES`, `DB_NAME`)
- Functions: `camelCase` for utilities, `PascalCase` for React components
- Event handlers: `handle*` prefix pattern consistent?

### File Organization
- Components in domain directories under `components/` (auth/, dashboard/, admin/, etc.)
- UI primitives only in `components/ui/`
- Shared types in `lib/shared/types/`, schemas in `lib/shared/schemas/`
- Hooks in `hooks/` — some are re-exports (`useAuth.ts` re-exports from `lib/auth-context.tsx`)
- Route group layouts self-contained with nav items defined inline

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Biome lint errors, raw hex colors used, framer-motion import found, unused variable affecting functionality
- **important**: Single quote violations, missing semicolons, trailing comma inconsistencies, debug console.log, unused imports
- **minor**: Indentation issues, naming convention drift, commented-out code, barrel file re-exports of unused modules

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
