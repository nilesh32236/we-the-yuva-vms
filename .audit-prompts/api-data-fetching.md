# Audit: API & Data Fetching

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Data fetching uses `@tanstack/react-query` v5 with a shared `QueryClient` instantiated in `lib/query-client.ts` (staleTime: 5 min, retry: 1, refetchOnWindowFocus: false). The `api` axios instance (`lib/api.ts`) has base URL `/api/v1`, includes credentials (`withCredentials: true`), attaches Bearer token via request interceptor, and auto-refreshes tokens on 401 via response interceptor. Error normalization happens in the response interceptor — network errors, timeouts, and API errors are mapped to `error.normalizedMessage`. Queries use `useQuery` and mutations use `useMutation` across components. The `QueryClientProvider` wraps all routes in `app/providers.tsx` above `AuthProvider`. API endpoints are proxied through Next.js rewrites (`next.config.ts`) to the backend at `API_URL`.

Scan target directories recursively (`components/`, `hooks/`, `app/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Query Patterns
- Query keys consistent structure — are they arrays with string/enum constants or inline strings?
- `staleTime` and `gcTime` (formerly `cacheTime`) configured per-query or relying on defaults?
- `useQuery` calls with missing query key dependencies — stale data when params change
- `enabled` option usage — queries that should wait for user auth or other conditions
- `select` option used for data transformation (avoids unnecessary re-renders)?
- `placeholderData` (keepPreviousData) for paginated lists?

### Mutation Patterns
- `onMutate` / `onSettled` for optimistic updates with rollback on error
- `queryClient.invalidateQueries` called after mutations to refresh stale data
- `queryClient.setQueryData` for immediate UI update without refetch
- Mutation error handling — are errors surfaced via toaster/toast (`components/ui/toast.tsx`)?
- Mutation `isPending` state used for loading UI (button spinners, disabled states)?

### Error Handling
- Query `isError` state — rendered error UI for each failed query?
- Error boundaries catching query errors at route group level (`error.tsx` pages)
- `error.normalizedMessage` consumed in UI or raw error displayed?
- Axios interceptor error normalization handling — does every query/mutation consumer use it correctly?

### Caching & Performance
- `gcTime` vs `staleTime` ratio — data lingering in cache longer than needed
- Query key factory pattern (e.g., `['opportunities', id]`) vs ad-hoc keys
- `refetchOnMount` behavior — unnecessary re-fetches for static data
- `networkMode` setting — offline behavior (`networkMode: 'offlineFirst'`)

### Axios Instance
- Base URL `/api/v1` matches rewrite rule in `next.config.ts`?
- `withCredentials: true` on all requests — correct for cookie-based refresh?
- Timeout set to 30s — appropriate or too long/short for specific endpoints?
- Request interceptor reads `memoryToken` first, falls back to cookie — consistent?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Stale/missing data leading to incorrect state, data leak via error, caching auth tokens
- **important**: Missing loading/error states, stale query keys, no cache invalidation after mutation
- **minor**: Inefficient refetch config, unused query options, missing select transforms

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
