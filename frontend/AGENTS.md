<!-- BEGIN:we-the-yuva-vms-rules -->
# WeTheYuva VMS — Agent Guidelines

## What This Is

Volunteer Management System (VMS) for **WeTheYuva** — connecting volunteers with purpose. Next.js 16 App Router, Tailwind v4, shadcn/ui, TypeScript, PWA (Serwist), Sentry, Biome.

## Key Conventions

- **Path alias**: `@/*` maps to project root
- **Biome**: spaces (2) indent, single quotes, trailing commas (es5), semicolons always
- **Lint**: `pnpm lint` → `biome lint app components lib hooks`
- **Typecheck**: `pnpm typecheck` → `tsc --noEmit`
- **Build**: `pnpm build` → `next build`
- **Package manager**: pnpm

## Routing Structure (Route Groups)

| Group | Purpose |
|---|---|
| `(public)/` | Landing, blog, info pages — no auth required |
| `(auth)/` | Login, signup, password reset |
| `(volunteer)/` | Volunteer dashboard, profile, opportunities |
| `(coordinator)/` | Coordinator management views |
| `(org-admin)/` | Organization admin panel |
| `(admin)/` | Super admin panel |
| `(observer)/` | Read-only observer views |

## Visual Identity

- **Fonts**: Poppins (headings via `--font-heading`), Inter (body via `--font-body`)
- **Primary**: `#047857` (emerald-700) light / `#34d399` dark
- **Secondary**: `#059669` (emerald-600)
- **Accent**: `#d97706` (amber-500)
- **Bg**: `#ecfdf5` (emerald-50) light / `#0c1222` dark
- **Border radius**: `0.75rem` base (`--radius`)
- **Dark mode**: via `.dark` class (next-themes), toggled by user
- **Theme tokens**: CSS variables (e.g., `var(--color-brand-primary)`) — always use `bg-brand-primary` etc, never raw hex
- **Safe areas**: `pb-safe`, `pt-safe`, `pb-nav-safe` utilities for PWA notch support

## Component Architecture

- `components/` → domain directories: `landing/`, `auth/`, `dashboard/`, `admin/`, `org/`, `volunteer/`, `shared/`, `ui/`, `layout/`, `blog/`, `events/`, `levels/`, `leaderboard/`, `opportunities/`, `badges/`, `charts/`, `theme/`
- `lib/shared/` → Zod schemas, types, helpers shared across routes
- Data fetching via `@tanstack/react-query` (see `lib/query-client.ts`)
- Auth via `lib/auth-context.tsx` (JWT-based, uses `jose`)
- API calls via `lib/api.ts` (axios instance)

## Built-in CSS Animations (no framer-motion)

- `animate-fade-in-up`, `animate-scale-in`, `animate-slide-up`, `animate-subtle-pulse`
- `stagger-group` + `.in-view` for staggered reveal (CSS-only, no JS)
- Custom utilities: `.card-hover`, `.active-bounce`, `.tabular-nums`
- Respect `prefers-reduced-motion: reduce` (globally enforced)

## PWA

- Serwist for service worker / offline support
- `/serwist/[path]/route.ts` handles SW routing
- Push notifications via `PushSubscriber.tsx`
- `manifest.json`, icons at `/icons/icon-{192,512}.png`

## Commands

```
pnpm dev          # next dev
pnpm build        # next build
pnpm lint         # biome lint app components lib hooks
pnpm lint:fix     # biome lint --write app components lib hooks
pnpm format       # biome format --write app components lib hooks
pnpm typecheck    # tsc --noEmit
```

## What is NOT Here

- **No framer-motion** — CSS animations/transitions replace it
- **No tests yet** — Playwright is a devDependency but not configured
- **No i18n** — English only (`en_IN` locale)
- **No CMS** — content is hardcoded in components

## Critical Rules for Agents

- Single quotes in JS/TS, double quotes in JSON
- Spaces, not tabs (2-space indent)
- Use `bg-brand-primary` / `text-brand-text` theme tokens, never raw color values
- shadcn/ui components use `cn()` from `@/lib/utils` for class merging
- SVG icons: prefer Lucide icons (already in deps), no emoji icons
- Forms: react-hook-form + zod (@hookform/resolvers)

## Middleware / Proxy (Next.js 16)

- **Use `proxy.ts` only** — Next.js 16 replaces `middleware.ts` with `proxy.ts`
- **NEVER create or keep `middleware.ts`** — having both `middleware.ts` and `proxy.ts` causes a fatal build error:
  `Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected. Please use "./proxy.ts" only.`
- The auth routing logic lives in `proxy.ts` at the project root (`frontend/proxy.ts`)
- If you need to modify auth/routing behavior, edit `proxy.ts` — do not create a new `middleware.ts`
<!-- END:we-the-yuva-vms-rules -->
