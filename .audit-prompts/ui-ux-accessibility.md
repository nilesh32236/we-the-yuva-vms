# Audit: UI/UX & Accessibility

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Styling uses Tailwind v4 with CSS variables for theme tokens (`bg-brand-primary`, `text-brand-text`, etc. — never raw hex). Dark mode is class-based (`.dark`) via `next-themes` with `ThemeProvider` at `components/theme/ThemeProvider.tsx` and `ThemeToggle` for switching. Fonts: Poppins (`--font-heading`) and Inter (`--font-body`). Animations are CSS-only (no framer-motion): `animate-fade-in-up`, `animate-scale-in`, `animate-slide-up`, `animate-subtle-pulse`, plus `stagger-group`/`.in-view` for staggered reveals — all respect `prefers-reduced-motion`. UI primitives: `Button`, `skeleton`, `toast`/`toaster` (from Radix). Icons use `lucide-react`. Shell components: `TopNav`, `Sidebar`, `BottomNav`, `NetworkStatusIndicator`, `AppUpdatePrompt`. Safe area utilities: `pb-safe`, `pt-safe`, `pb-nav-safe`. Forms use `react-hook-form` + Zod. The root layout includes a skip-to-main link for keyboard users.

Scan target directories recursively (`components/`, `app/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Dark Mode
- `ThemeProvider` wraps all routes — does `ThemeToggle` allow switching without page flicker?
- `.dark` class CSS variables defined for all brand and shadcn colors in `globals.css`
- Color contrast ratios meet WCAG AA (4.5:1 for text) in both themes
- Images with transparent backgrounds visible in dark mode (need dark-mode-specific assets)
- `next-themes` `suppressHydrationWarning` on `<html>` element

### Mobile Responsiveness
- Layout adapts across breakpoints — Sidebar hidden on mobile, BottomNav visible
- `pb-nav-safe` on main content prevents BottomNav overlap
- Touch targets at least 44x44px (WCAG 2.5.8) — verify all buttons, links, icons
- Horizontal overflow on small screens — cards, tables, data grids scrollable
- Font size legible at 16px minimum on mobile (prevents iOS zoom)

### Keyboard Navigation & Focus
- Skip-to-main link present in root layout (`app/layout.tsx`)
- Focus indicators visible for all interactive elements (not `outline: none` without replacement)
- Tab order follows visual order — Sidebar items, navigation, form fields
- Modals/dialogs trap focus (if any exist)
- Custom focus ring color using `ring` CSS variable

### ARIA & Semantics
- Buttons with icon-only have `aria-label` (e.g., ThemeToggle, notification actions)
- Navigation landmarks (`<nav>`) on TopNav, Sidebar, BottomNav
- Main content wrapped in `<main id="main">`
- Form inputs associated with labels via `htmlFor`/`id` or `aria-label`
- Dynamic content updates announced via `aria-live` regions (toast notifications)
- Loading states on skeleton screens have `aria-busy`

### Form UX
- Loading states during form submission (button spinner, disabled state)
- Field-level error messages displayed inline, not just in toast
- Successful actions shown via toast (`components/ui/toaster.tsx`) with `aria-live="polite"`
- Form retains user input on validation error (no page-wide reset)
- Multi-step forms (if any) preserve state between steps

### Reduced Motion
- All CSS animations respect `prefers-reduced-motion: reduce` (global enforcement via CSS)
- No simultaneous animations causing vestibular issues
- `motion-safe` and `motion-reduce` Tailwind variants used where appropriate

### Touch & Mobile UX
- `viewportFit: 'cover'` for safe area insets on modern phones
- Haptic feedback via `lib/haptic.ts` — used in buttons that trigger side effects
- Pull-to-refresh disabled to prevent conflict with scrollable content

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Keyboard trap, missing focus indicator, color contrast below 3:1, no form error feedback
- **important**: Small touch targets, missing aria-labels, missing dark mode colors, no loading state on form submit
- **minor**: Suboptimal contrast (3:1–4.5:1), redundant ARIA, inconsistent spacing, missing reduced-motion on one-off animations

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits
