# Audit: PWA & Offline

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** PWA is implemented via Serwist (`@serwist/turbopack`, `serwist` v9). The service worker is defined at `app/sw.ts` using `withSerwist` in `next.config.ts`. It precaches entries from `self.__SW_MANIFEST`, enables `skipWaiting`, `clientsClaim`, `navigationPreload`, uses `defaultCache` runtime caching from `@serwist/turbopack/worker`, and falls back to `/offline` page for document requests. Push notification handling is in the service worker (`push` and `notificationclick` events) and client-side via `components/PushSubscriber.tsx` and `hooks/usePushNotifications.ts`. The offline check-in queue uses IndexedDB in `lib/offline-queue.ts` with `hooks/useOfflineCheckin.ts`. The `usePWAInstall` hook in `hooks/usePWAInstall.ts` is marked Phase 2. A manifest reference exists in `app/layout.tsx` pointing to `/manifest.json`. Icons are at `/icons/icon-{192,512}.png`. An `/offline` route exists. The `NetworkStatusIndicator` component in `components/shared/` shows connectivity status.

Scan target directories recursively (`app/sw.ts`, `app/serwist/`, `app/offline/`, `components/PushSubscriber.tsx`, `hooks/`, `lib/offline-queue.ts`, `next.config.ts`). Output findings to `.audit-output.jsonl`.

## What to Check

### Service Worker Configuration
- `app/sw.ts` — `runtimeCaching: defaultCache` from `@serwist/turbopack/worker` — are the cache strategies appropriate for API vs static assets?
- `navigationPreload: true` — response used correctly for navigation requests?
- `skipWaiting` and `clientsClaim` both true — immediate activation on update
- `fallbacks.entries` only handles document destination — what about images or API fails?
- SW update flow — `AppUpdatePrompt` in `components/shared/AppUpdatePrompt.tsx` shows update available prompt?

### Offline Page & UX
- `/offline` route — user-friendly offline page with retry button?
- `loading.tsx` files in route groups — shown during offline navigation when SW fallback serves `/offline`?
- `NetworkStatusIndicator` — positioned correctly, not overlapping content?
- TanStack Query `networkMode` — configured for offline-first behavior?

### Push Notifications
- `PushSubscriber.tsx` — shows prompt only when `permission === 'default'` and user is logged in
- Auto-subscribe in background when permission already granted
- SW push event — handles non-JSON payloads gracefully (try/catch)
- SW notificationclick — opens link from notification data
- VAPID key fetched from `/vapid-public-key` — is error handled if endpoint unavailable?
- Existing subscription unsubscribed before re-subscribing

### IndexedDB Offline Queue
- `lib/offline-queue.ts` — IndexedDB with `wetheyuva-offline` DB, `checkin-queue` store
- `syncQueuedCheckins` sends all queued items sequentially — partial failure handling (reports synced vs failed)
- Queue not cleared on logout — stale check-ins from previous session
- DB version handling — `DB_VERSION = 1` with no migration logic

### Manifest & Icons
- `app/layout.tsx` references `/manifest.json` — file exists and has correct properties?
- Icon paths (`/icons/icon-{192,512}.png`) — do files exist at those paths?
- `appleWebApp` metadata set in layout — `capable: true`, `statusBarStyle: 'black-translucent'`
- `viewportFit: 'cover'` for iPhone notch / Dynamic Island
- `themeColor` defined with light/dark variants

### PWA Install
- `usePWAInstall` hook marked Phase 2 — not actively used but present
- `beforeinstallprompt` event captured but no UI trigger installed
- `isStandalone` check uses multiple heuristics (matchMedia, navigator, referrer)

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: SW not registering, offline page broken, manifest missing, push notifications failing silently
- **important**: Missing cache strategy for API routes, offline queue not cleared on logout, no retry on sync failure
- **minor**: Missing icons, missing iOS meta tags, VAPID fetch error not handled in UI

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
