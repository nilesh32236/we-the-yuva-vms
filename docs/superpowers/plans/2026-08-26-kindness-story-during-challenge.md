# Plan: 7-Day Kindness — Story & Kindness Work During Challenge

**Date:** 2026-08-26
**Spec:** `docs/superpowers/specs/2026-08-26-kindness-story-during-challenge-design.md`
**Branch:** `feat/kindness-story-during-challenge` from `main 7f22244`
**Stack:** Prisma + Express + Next.js 16 + RHF + Zod

## Tasks

### T23 — Backend: Story extension + API (medium)
- **Owner:** jim-mt5i4lri (backend) on `feat/kindness-story-during-challenge`
- **Files:** `prisma/schema.prisma` (Story add `kindnessChallengeId/kindnessDay/isCompletion` + index) + migration `20260826000002_add_kindness_story_during_challenge`, `modules/stories/stories.service.ts` (extend create), `modules/kindness-challenge/kindness-challenge.service.ts` (createKindnessPost, listPosts, lower MIN_COMPLETION_DAY 7→1), `stories.routes.ts`, `kindness-challenge.routes.ts` (GET /me/posts), `stories.schemas.ts` (extend)
- **Tests:** `stories.service.test`, `kindness-challenge.service.test` (day <= currentDay 422, isCompletion 1→7, duplicate 409)
- **DoD:** `prisma generate` ok, `lint/typecheck/test` green, manual: Day 3 post succeeds, Day 8 post 422, isCompletion Day 3 unlocks Part II.

### T24 — Frontend: Post UI + timeline (medium)
- **Owner:** jim-mt5i4lri (after T23) or pam | branch same `feat/kindness-story-during-challenge`
- **Files:** `app/(volunteer)/volunteer/kindness-challenge/page.tsx` (Post Update dialog + timeline), `lib/kindness.ts` (`useKindnessPosts`), `components/shared/FileUpload` reuse
- **DoD:** Dialog when ACTIVE, posts appear timeline, completion checkbox unlocks Part II CTA.

### T25 — Admin + verification (low)
- **Owner:** pam → god merge
- **Files:** `kindness-challenge.service.ts` `listChallengesForAdmin` include `_count posts`, controller CSV, admin page columns `daily_posts`.
- **DoD:** Admin export shows daily counts, no N+1.

## Order: T23 → T24 → T25 → PR #247+? (god creates PR, Pam review, Jim fix, god merge like T16)
## Risks: Early completion (Day 1) allowed — document; nullable migration zero-downtime.
