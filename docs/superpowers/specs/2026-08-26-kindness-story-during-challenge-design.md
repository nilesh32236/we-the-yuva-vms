# Design: 7-Day Kindness Challenge — Post Story & Kindness Work During Challenge (Days 1-7)

**Date:** 2026-08-26
**Status:** Draft (for human approval)
**Source:** Human request 01:58 UTC 2026-08-26: "allow volunteer to post they story and add what kindness work they do on those time"
**Base:** `KindnessChallenge` (acts/startDate/endDate/status/checkIns/storyId) + `Story` (title/content/mediaUrl, linked via `completeChallenge` at Day 7) + `KindnessCheckIn` (day), current gating `istDayNumber >=7` for `linkExistingStory`/`completeWithStory`, PR #246 Part II merged `7f22244`

## Summary

Extend challenge to allow volunteers to **post a story and describe kindness work at any time during the 7 days** (not only Day 7+ link). Day 1-6 posts are *progress logs* (visible, counted) and Day 7+ post completes the challenge and unlocks Part II. No breaking change: existing Day 7 link flow keeps working; new daily posts are additive.

## Decisions (god autonomous)

| Topic | Decision |
|---|---|
| Storage | Extend `Story` with optional `kindnessDay` (Int 1..7) + `kindnessChallengeId` (FK) + keep existing `KindnessChallenge.storyId` as *completion story* (the one that unlocks Part II). Daily logs are separate stories with `kindnessChallengeId` set, not the `storyId` that completes challenge. Alternative `KindnessDailyLog` model rejected (duplicates Story). |
| Completion invariant | `KindnessChallenge.storyId` (and `status COMPLETED` + `part2UnlockedAt`) still set only when a story is explicitly marked as *completion* (Day >=1 allowed now, not >=7). Daily logs do **not** complete. |
| Validation | `kindnessDay` derived server-side via `istDayNumber(challenge.startDate, now)` must be 1..7 and not future (day <= currentDay). `title` 5-80, `content` 20-1000 (kindness work description), `mediaUrl` optional (existing upload). |
| API | Reuse `POST /stories` — add optional `kindnessChallengeId` + `isCompletion` boolean; when `isCompletion=true`, run existing `completeChallenge` gating (now day >=1, not 7) and set `part2UnlockedAt`. Add `GET /kindness-challenge/me/posts` to list daily posts for the challenge (for progress UI). |
| Frontend | `volunteer/kindness-challenge` page: when ACTIVE, show *Post Kindness Work* CTA (title/content/media + auto day) + timeline of past posts (day badge). Day 7 still shows *Share as Completion* toggle that unlocks Part II. No wa.me change. |
| Admin | Extend `kindness-challenge/admin` export: add `daily_posts` count + last post date. |
| Out of scope | No Business API, no PII, no migration beyond additive nullable columns + index. |

## 1. Data Model

```prisma
model Story {
  // existing + new:
  kindnessChallengeId String? // FK to KindnessChallenge.userId? actually challenge id
  kindnessDay         Int?    // 1..7
  isCompletion        Boolean @default(false) // true if this story is the completion story (sets part2UnlockedAt)
  @@index([kindnessChallengeId, kindnessDay])
}

model KindnessChallenge {
  // existing storyId remains completion story (unique)
  // daily posts live as Story.kindnessChallengeId back-reference (no new model)
}
```

Migration `20260826000002_add_kindness_story_during_challenge` — additive nullable + index, no backfill, zero-downtime.

Alternative rejected: separate `KindnessDailyLog` duplicates Story fields (title/content/media) and loses reuse of upload/moderation.

## 2. Backend API

| Endpoint | Guard | Behavior |
|---|---|---|
| `POST /stories` (extend) | requireAuth | Accept optional `kindnessChallengeId`, `kindnessDay` (ignored server-computed), `isCompletion` (default false), `title/content/mediaUrl`. If `kindnessChallengeId` present: verify `challenge.userId==caller`, `challenge.status==ACTIVE`, `1<=day<=7 && day<=currentDay` else 422 `Not within challenge window`. Create Story with `kindnessChallengeId/kindnessDay`. If `isCompletion==true`: also run `completeChallenge(challenge.id, story.id)` (now day>=1, not 7) → set `COMPLETED/part2UnlockedAt`. Return story. |
| `GET /kindness-challenge/me/posts` | requireAuth | List Story where `kindnessChallengeId==myChallenge.id` orderBy `kindnessDay asc` (for timeline). |
| `GET /kindness-challenge/me` (extend) | requireAuth | Include `_count` or `posts` count for progress bar. |
| `GET /admin`/`export` | ADMIN | Extend select include `_count posts` and CSV cols `daily_posts,last_post_kindnessDay`. |

`kindness-challenge.service`: add `createKindnessPost()` + `listKindnessPosts()` + adjust `completeChallenge` gating from `>=7` to `>=1` (config `MIN_COMPLETION_DAY = 1`).

## 3. Frontend

- `volunteer/kindness-challenge/page.tsx`: when `challenge` `ACTIVE`, show section *My Kindness Work* — timeline `day 1..7` dots with post count, *Post Update* button → dialog (`title`, `content` textarea 20-1000, `FileUpload` media, `isCompletion` checkbox “Mark as completion (unlock Part II)”). Submit `POST /stories` with `kindnessChallengeId`. After post, refresh `me` + `posts` list. When `isCompletion` true and success, show `Part II unlocked` CTA (already exists).
- `useKindnessPosts()` hook for `GET /kindness-challenge/me/posts`.
- No change to `part2UnlockedAt` gating for Part II — still requires `COMPLETED` (now achievable Day 1+ if volunteer chooses completion early, but UI recommends Day 7).

## 4. Testing, risks

- Backend: schema `Story` new fields nullable, service `day <= currentDay` edge (future day 422), `isCompletion` true sets `COMPLETED` + `part2UnlockedAt` once, duplicate completion 409, non-owner 404, list order, admin include.
- Frontend: dialog renders when ACTIVE, submit posts appear in timeline, completion checkbox unlocks Part II.
- Risk: Early completion (Day 1) unlocks Part II early — acceptable per human "allow during those time"; document that early completion is allowed (volunteer may complete whenever they feel ready).
