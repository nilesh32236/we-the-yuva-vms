# Audit: Forms & Validation

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Forms use `react-hook-form` v7 with `@hookform/resolvers/zod` for validation against Zod schemas from `lib/shared/schemas/`. The UI toast system (`components/ui/toaster.tsx`) displays mutation results. The app has forms across multiple domains: auth (login, register, OTP verify), profile (setup, edit), opportunities (create, edit, apply), events (create, edit), organizations, blog, training, mentorship, feedback, consent, stories, levels requests, and admin settings. Many pages exist in route groups for create/edit flows (`opportunities/new`, `events/[id]/edit`). The `cn()` utility handles className merging. Buttons use the `Button` UI component from `components/ui/Button.tsx`. Loading states on submissions should use the mutation's `isPending` state.

Scan target directories recursively (`components/`, `app/`, `lib/shared/schemas/`). Output findings to `.audit-output.jsonl`.

## What to Check

### React Hook Form Patterns
- `useForm` called with `resolver: zodResolver(schema)` for every form?
- `register` vs `Controller` — when are custom `Controller` components needed (custom inputs, editors)?
- `formState.errors` rendered inline next to each field
- `formState.isSubmitting` used for button disabled/loading state
- `handleSubmit` wrapping the submit handler correctly
- Default values match Zod schema defaults (`.default()` values in schema)

### Zod Resolver Integration
- `@hookform/resolvers/zod` `zodResolver` imported and configured
- Async Zod validation (`.refine()` with async) handled — does it block form submission?
- Schema error messages mapped to user-facing field errors
- Cross-field validation (password match, date range) using `.refine()` — errors attached to specific field via `path`

### Field Error Display
- Error messages rendered within `<label>` or as `<span>` adjacent to field
- Error states visually indicated (red border on input, aria-invalid)
- Sonner toast for submission-level errors (network failure, server error)
- Multiple errors on same field all displayed (not just first)
- Error messages disappear when user starts correcting the field

### Submission & Loading States
- Button shows spinner/disabled state during `isPending`
- Form fields disabled during submission to prevent double-submit
- Success state — form reset, redirect, or success toast on completion
- Mutation `onSettled` used to re-enable form regardless of outcome
- Optimistic UI updates — form reflects submitted data before server confirms

### Form Reset & Dirty Tracking
- `reset()` called after successful submission to clear form
- `formState.isDirty` used to warn before leaving with unsaved changes (beforeunload)?
- `formState.dirtyFields` for partial form updates (PATCH vs PUT)
- Form state preserved on validation error (no page-level reset)

### Multi-Step & Complex Forms
- Multi-step forms (setup-profile, consent flow) — step state managed in component or URL?
- Each step validated independently before proceeding
- Step data persisted if user navigates away
- File upload fields handled with `Controller` (file inputs need custom handling)

### Specific Form Pages
- Login (`app/(auth)/login/`) — email, password fields with proper validation
- Register (`app/(auth)/register/`) — multi-field with password confirmation
- Profile setup (`app/(auth)/setup-profile/`) — skills, interests, availability arrays
- Opportunity form (`components/opportunities/OpportunityForm.tsx`) — rich text for description
- Event create/edit with QR code generation
- Blog form with Tiptap editor for content

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing field validation allows invalid data, form submits before validation completes, no CSRF protection
- **important**: No loading state on submit, error messages not displayed, form doesn't reset on success, missing dirty-field warning
- **minor**: Default values missing, slow async validation, unclear error messages, redundant validation

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
