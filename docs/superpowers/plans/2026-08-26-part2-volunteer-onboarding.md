# Plan: Part II — Volunteer Onboarding & Role Selection

**Date:** 2026-08-26
**Spec:** `docs/superpowers/specs/2026-08-26-part2-volunteer-onboarding-design.md`
**Source:** `part-2.md` §§1-10 (10 sections, gated on KindnessChallenge.part2UnlockedAt)
**Branch:** `feat/part2-onboarding` from `main` @ `f8f77ed`
**Stack:** Next.js 16 + RHF + Zod, Express + Prisma + PostgreSQL, pnpm

## Task Breakdown

### T13 — Backend: Prisma model + migration + shared schema + API (high)
- **Owner:** jim-mt5wuu4s (backend fixer)
- **Files:**
  - `backend/prisma/schema.prisma` — add VolunteerOnboardingPart2 + enums VolunteerRoleTier/TravelDistance/ProficiencyLevel/SupportResource/LifeSkill
  - `backend/prisma/migrations/*_add_part2_onboarding/migration.sql` — generated
  - `backend/src/shared/schemas/part2.schemas.ts` (new) — Zod Part2Schema per spec §2 (wordCount 50-200, 8 roleMappings, lifeSkills>=2, languages, tier, etc.)
  - `frontend/lib/shared/schemas/part2.schemas.ts` (mirror copy)
  - `backend/src/modules/onboarding-part2/` — routes/controller/service (`GET /users/me/onboarding/part2`, `PUT /users/me/onboarding/part2`) with gating (part2UnlockedAt), VOLUNTEER guard
  - Tests: `backend/src/shared/__tests__/part2.schemas.test.ts`, `backend/src/modules/onboarding-part2/__tests__/onboarding-part2.service.test.ts`
- **DoD:** `pnpm --filter backend prisma migrate dev` passes, `pnpm --filter backend test` 636+ new pass, lint/typecheck clean, manual curl GET unlocked=false before challenge, 403 PUT when locked, 200 PUT when unlocked creates row.

### T14 — Frontend: gated wizard + placeholder upgrade (high)
- **Owner:** jim-mt5i4lri or pam parallel after T13 schema lands (reuse same schemas)
- **Files:**
  - `frontend/app/(volunteer)/volunteer/part2/page.tsx` — upgrade unlocked CTA to "Continue to Part II" link
  - `frontend/app/(volunteer)/volunteer/part2/onboarding/page.tsx` (new) — 6-step wizard grouping 10 sections per spec §4, draft `part2-draft` localStorage, step sessionStorage, RFS+RHF+Zod resolver, live word-count, gating via `GET /kindness-challenge/me`
  - `frontend/components/onboarding-part2/` — 6 step components (Step1Reflection, Step2Roles, Step3SkillsLanguages, Step4CommitmentSupport, Step5Background, Step6EmergencyConsent) + reusing FieldError
  - `frontend/lib/kindness.ts` — already has part2UnlockedAt; extend `frontend/lib/api` if needed
  - `frontend/lib/shared/schemas/part2.schemas.ts` — already created in T13, import here
- **DoD:** Wizard renders 6 steps, per-step validation gates Next, draft persists/restores, locked redirect works, submit PUT succeeds, clears draft, toast + redirect.

### T15 — Admin + polish + E2E verification (medium)
- **Owner:** pam-mt5i68yi (reviewer) + dwight-mt5i7uyj (merge)
- **Files:**
  - `frontend/app/(admin)/admin/kindness-challenge/page.tsx` — add columns part2Completed / roleTier (or new page)
  - `backend/src/modules/kindness-challenge/kindness-challenge.controller.ts` — extend CSV export with part2 columns
  - Update `backend/src/modules/users/users.service.ts:getMe` or new admin service to include part2
  - E2E: backend + frontend test together, manual happy path doc
- **DoD:** Admin shows Part II status, export includes it, all checks green.

## Execution Order

1. T13 backend first (blocks T14). Jim starts on feat/part2-onboarding immediately vs f8f77ed.
2. T14 frontend can start reading T13 schemas as soon as first commit lands (schemas commit), or wait for T13 done — prefer wait to avoid drift.
3. T15 after T13+T14 green.

## Risks & Mitigations

- Mirror schemas drift (backend/frontend share copy) — T13 commits both copies atomically, CI enforces same validation.
- Part1 vs Part2 timeCommitment duplication — additive per spec Decisions row 3; coordinator read merges both.
- Word-count mismatch frontend/backend — same wordCount helper (trim split /\s+/) both sides.

## Verification (per task)

- `pnpm --filter backend lint && pnpm --filter backend typecheck && pnpm --filter backend test`
- `pnpm --filter frontend lint && pnpm --filter frontend build` (or typecheck)
- Curl/GH manual: challenge completion → part2UnlockedAt → GET/PUT part2 gates.
