# Audit: State Management

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** The primary state management mechanism is `@tanstack/react-query` v5 for server state, with a shared `QueryClient` at `lib/query-client.ts`. Client state is managed via React Context (`AuthContext` in `lib/auth-context.tsx`, `ThemeProvider` in `components/theme/ThemeProvider.tsx`), `useState`/`useReducer` in components, and URL search params for filter/sort/page state. The `queryClient` is cleared on logout via `queryClient.clear()`. The `AuthProvider` wraps all providers inside `ThemeProvider` and `QueryClientProvider` in `app/providers.tsx`. Optimistic updates exist in mutation patterns (e.g., `useOfflineCheckin`). The offline queue (`lib/offline-queue.ts`) is a separate IndexedDB-based state for pending check-ins. NProgress handles navigation loading state.

Scan target directories recursively (`lib/`, `components/`, `hooks/`, `app/`). Output findings to `.audit-output.jsonl`.

## What to Check

### React Query vs Local State Boundary
- Server data (API responses) fetched via `useQuery` — never duplicated in `useState`
- Form state kept in `react-hook-form` (not in React Query or redundant state)
- UI state (modals open/closed, accordion expanded, sidebar collapsed) in `useState` or `useReducer`
- Theme state managed by `next-themes` (not React Query or localStorage directly)
- No unnecessary `useState` wrappers around query data

### Context Usage
- `AuthContext` (`lib/auth-context.tsx`) — holds `user`, `isLoading`, `refetch`, `logout`
- Context value memoized or re-created on every render?
- `ThemeProvider` (`components/theme/ThemeProvider.tsx`) — wraps `next-themes` `ThemeProvider`
- Context splitting — auth and theme are separate contexts (correct); would push notifications be a context too?
- Context consumers — `useAuth()` used across many components; dependency array correctness

### URL State
- Filter/sort/page/search params in URL `searchParams` (Next.js `useSearchParams`) — shareable/bookmarkable URLs
- Dynamic route params (`[id]`, `[slug]`) for entity pages
- Query params preserved on navigation (replace vs push)
- URL state reset when filters cleared

### Cache Invalidation Strategy
- After mutation: `queryClient.invalidateQueries({ queryKey: [...] })` with correct keys
- Granular invalidation — invalidate only affected query keys, not all queries
- `queryClient.setQueryData` for immediate cache update on mutation success
- `onMutate` optimistic update with rollback via `onError`/`onSettled`
- Cache cleared on logout (`queryClient.clear()`) — correct for security

### Stale-While-Revalidate
- Global `staleTime: 5 min` — fresh data shown immediately, refetch in background
- Auth data (`/users/me`) should use shorter staleTime (or `staleTime: 0`) for timely role/permission updates
- Static reference data (levels, badge definitions) could use `staleTime: Infinity`
- Refetch on window focus disabled globally — appropriate for this app?

### Offline & Background State
- `lib/offline-queue.ts` — IndexedDB as secondary state store for offline check-ins
- `syncQueuedCheckins` runs on reconnect — syncs sequentially, partial failures tracked
- `useOfflineCheckin` hook bridges React Query mutations with offline storage
- Network status tracked via `navigator.onLine` and `online`/`offline` events

### Component-Level State Patterns
- Pagination/load-more state in component or URL params?
- `useReducer` for complex state (multi-step forms, wizard flows) instead of multiple `useState`
- Debounced search inputs — state held locally, query triggered via `useQuery`
- No prop drilling through 3+ levels — components access `useAuth`, query data, or URL state directly

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Server state duplicated in local state leading to stale UI, auth cache not cleared on logout, stale-while-revalidate returning stale auth data
- **important**: Missing `queryKey` invalidations after mutations, overly broad invalidation, URL params not preserved, no optimistic updates where expected
- **minor**: Inefficient context re-renders, missing `useCallback` on context values, unused state variables, local state shadowing server state

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
