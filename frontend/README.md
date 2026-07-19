# WeTheYuva VMS (Frontend)

Volunteer Management System for **WeTheYuva** — connecting volunteers with purpose.

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Language**: TypeScript
- **PWA**: Serwist (service worker, offline support)
- **Linting/Formatting**: Biome
- **Package Manager**: pnpm

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run Biome linter
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format code with Biome
pnpm typecheck    # TypeScript type checking
```

## Middleware / Proxy

This project uses **`proxy.ts`** (Next.js 16) for auth and route guarding at the project root.

**Never create `middleware.ts`** — having both `middleware.ts` and `proxy.ts` causes a fatal build error. If you need to modify auth/routing behavior, edit `proxy.ts` only.

## Project Structure

See `AGENTS.md` for detailed agent guidelines, routing structure, visual identity, and component architecture.
