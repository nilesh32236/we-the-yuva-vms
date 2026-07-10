# Audit: Performance

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** The app is built with Next.js 16 (`next.config.ts`). Image loading uses `next/image` with `remotePatterns` configured for `images.unsplash.com`, `plus.unsplash.com`, `localhost`, and the API origin. The `@vercel/speed-insights` package is integrated. React Query has a global `staleTime` of 5 minutes and `retry: 1` with `refetchOnWindowFocus: false`. The query client is in `lib/query-client.ts`. Animation is CSS-only (no framer-motion — all animations via `@keyframes` in `globals.css`). `recharts` is used for charts. `next-themes` for theme switching without flash. `nprogress` top-bar loader for page transitions. Serwist handles precaching and runtime caching.

Scan target directories recursively (`components/`, `app/`, `lib/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Image Optimization
- All `<img>` tags replaced with `next/image` — or are `next/image` usages missing `width`/`height`?
- `remotePatterns` configured in `next.config.ts` covers all external image sources
- Images use `priority` on above-the-fold content (LCP elements)
- `loading="lazy"` on below-the-fold images
- Placeholder/blur placeholder used for images
- Image format — WebP/AVIF via Next.js optimization (no explicit format needed)

### Bundle Size
- Dynamic imports with `next/dynamic` for heavy components (Tiptap editor, recharts, QR scanner, HTML5 QR code)
- Large libraries (`@tiptap/react`, `recharts`, `html5-qrcode`) loaded on routes that need them, not globally
- Barrel file `lib/shared/index.ts` — unused schema imports in bundle?
- Lucide icons — imported individually (`import { User } from 'lucide-react'`) not via barrel

### React Query Caching
- `staleTime: 5 * 60 * 1000` — is this appropriate for all data types? Auth/user data should be shorter
- `gcTime` (formerly `cacheTime`) — configured per-query or defaulting to 5 minutes
- Static data (dropdowns, enums, countries) can have `staleTime: Infinity`
- Polling/refetchInterval — used for real-time data (notifications, check-in counts)?
- Query key structure enables granular cache invalidation

### Re-render Optimization
- `useMemo` and `useCallback` — used on expensive computations and callback props to child components?
- List components have proper `key` props (not array index)
- Context consumers — `AuthContext` causes re-render across all providers on user change; memoized?
- `useQuery` `select` option to prevent full-data re-renders when only a subset changes

### Layout & Rendering
- CSS animations use `transform` and `opacity` only (GPU-composited, no layout thrashing)
- `will-change` CSS property used sparingly and removed after animation
- No `<script>` tags blocking render in critical path
- Server components where no interactivity is needed (data-display pages, landing)

### Code Splitting & Route Segmentation
- Route groups naturally code-split by role — volunteer doesn't download admin code
- Feature-specific `loading.tsx` for Suspense boundaries
- NProgress configured with minimal CSS (`nprogress.css` imported in root layout)

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing `next/image` leads to huge unoptimized images, missing `priority` on LCP, large library imported globally
- **important**: Missing dynamic imports on heavy components, long staleTime on dynamic data, missing `loading=lazy`, barrel imports pulling unused code
- **minor**: Missing `key` prop on list items, unused CSS animations, missing `select` on queries, un-memoized callbacks

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
