# Design: Part II — Volunteer Onboarding & Role Selection (On Completion of 7-Day Kindness Challenge)

**Date:** 2026-08-26
**Status:** Draft — awaiting implementation
**Sources:**
- `part-2.md` (root, Part II: Volunteer Onboarding & Role Selection, 10 sections, accessible upon completion of 7-Day Kindness Challenge)
- `Part I Volunteer Registration Form & Expression of Interest.md` + `WetheYuva VMS Note(1).md` (Part I baseline, already merged as f8f77ed: 5-field register + 6-step setup-profile)
- Live main `f8f77ed` (register 5-field flow, onboarding deduplication, timeCommitment independent) + schema `backend/prisma/schema.prisma:335` VolunteerProfile + `backend/src/shared/schemas/onboarding.schemas.ts`

## Summary

Extend onboarding with **Part II** — a second multi-step form accessible only after Kindness Challenge completion (`KindnessChallenge.part2UnlockedAt != null`). Part I remains unchanged; Part II collects role alignment, life-skills, languages, commitment tier, support/resources, location prefs, prior experience, social links, emergency info, and re-consent. Data is stored in a new model `VolunteerOnboardingPart2` (one per user). Frontend: new gated route `/volunteer/part2/onboarding` (forms) + unlock placeholder already exists at `/volunteer/part2/page.tsx:12` — upgrade unlock view to launch Part II. Backend: new module `onboarding-part2` with `GET/PUT /users/me/onboarding/part2` (+ gating), shared Zod schema mirrored frontend/backend, Prisma migration, and admin export extension.

## Decisions

| Topic | Decision |
|---|---|
| Storage | New model `VolunteerOnboardingPart2` (1-1 User). Keeps Part I `VolunteerProfile.details` untouched. One atomic PUT. |
| Gating | Server enforces `part2UnlockedAt` must exist before PUT; GET returns `{ unlocked: boolean, data: Part2|null }`. Frontend route guards via `GET /kindness-challenge/me`. No client-only bypass. |
| Part I overlap | `volunteerType` (STUDENT_VOLUNTEER etc) stays. Part II adds `volunteerRoleTier` (GENERAL/LEADER/COORDINATOR/MANAGEMENT/INTERN) — distinct concept (commitment tier). `timeCommitment` stays in Part I; Part II preferredDays/Times/Specific are additive and merged on read for coordinator views (no overwrite of Part I timeCommitment). |
| Drafts | Part II supports draft save (client localStorage `part2-draft` + `isDraft` flag). Server only stores completed submission; drafts are client-only (same as Part I before submit). |
| Validation strictness | All Part II fields validated server-side; lifeSkills requires >=2, reflection word-count 50-200, languages at least 0 (optional) but prof valid if present, emergency mobile valid WhatsApp regex same as register. |
| Admin | Extend `/admin/kindness-challenge` CSV column + new `/admin/part2` table reusing same data (or extend existing export). Not a separate export for v1 — add columns to existing challenge export for audit. |
| Out of scope | No change to KindnessChallenge flow, no Business API, no data migration (dev stage). Part I not re-released. |

## 1. Data Model (Prisma)

New model + enums (add to `backend/prisma/schema.prisma`):

```prisma
enum VolunteerRoleTier {
  GENERAL_VOLUNTEER  // 2–4 h/week
  LEADER             // 6 h/week
  COORDINATOR        // 8+ h/week
  MANAGEMENT         // 24 h/week or 100 h/month
  INTERN             // 120 total hours
}

enum TravelDistance {
  WITHIN_5_KM
  WITHIN_10_KM
  ANYWHERE
}

enum ProficiencyLevel {
  BASIC
  INTERMEDIATE
  FLUENT
}

enum SupportResource {
  COUNSELING
  MENTORSHIP
  COACHING
  NEED_BASED_CAPACITY_BUILDING
}

enum LifeSkill {
  COMMUNICATION
  PROBLEM_SOLVING
  CRITICAL_THINKING
  DIGITAL_LITERACY
  SELF_CONFIDENCE
  LEADERSHIP
  TEAMWORK
  PUBLIC_SPEAKING
  OTHER
}

model VolunteerOnboardingPart2 {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // §1 Reflection
  kindnessReflection String?  // 50-200 words
  aspirations        String?  // max 1000

  // §2 Roles & skills mapping — 8 entries, each { role: String, skillsOffer: String, skillsDevelop: String }
  roleMappings       Json     // RoleMapping[]

  // §3 Life skills
  lifeSkills         String[] // LifeSkill values
  lifeSkillsOther    String?

  // §4 Languages
  languages          Json     // { language: String, proficiency: ProficiencyLevel }[]

  // §5 Commitment & Availability
  volunteerRoleTier  VolunteerRoleTier?
  preferredDays      String[] // WEEKDAYS | WEEKENDS
  preferredTimeSlots String[] // MORNING | AFTERNOON | EVENING
  specificDaysTimes  String?

  // §6 Support & Growth
  supportResources   String[]

  // §6b Location Prefs
  preferredCityArea  String?
  maxTravelDistance  TravelDistance?
  remoteAvailable    Boolean?

  // §7 Previous Experience
  hasVolunteered       Boolean?
  previousOrgName      String?
  previousRole         String?
  previousDurationNature String?
  previousTotalHours   Float?

  // §8 Social Profiles
  linkedinUrl     String?
  instagramUrl    String?
  twitterUrl      String?
  portfolioUrl    String?

  // §9 Emergency
  emergencyContactName String?
  emergencyRelationship String?
  emergencyMobile    String?
  medicalConditions  String?

  // §10 Declarations
  privacyPolicyConsent Boolean?
  codeOfConductConsent Boolean?
  mediaConsent         Boolean?
  whatsappConsent      Boolean?

  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([volunteerRoleTier])
}
```

Add relation to User:
```prisma
model User {
  // existing...
  part2 VolunteerOnboardingPart2?
}
```

Migration: `add_part2_onboarding`. No backfill.

## 2. Validation (shared Zod)

Create `backend/src/shared/schemas/part2.schemas.ts` mirrored at `frontend/lib/shared/schemas/part2.schemas.ts` (repo mirrors schemas — no shared workspace).

```ts
export const PART2_ROLES = [
  'CAPACITY_BUILDER_TRAINER',
  'COMMUNITY_OUTREACH_SURVEY',
  'GRIEVANCE_SUPPORT_FACILITATOR',
  'SOLUTION_CAMP_COORDINATOR',
  'STAKEHOLDER_LIAISON',
  'WARD_AREA_AMBASSADOR',
  'PROGRAMME_DATA_SUPPORTER',
  'VOLUNTEER_ENGAGEMENT_SUPPORTER',
] as const;

const RoleMappingSchema = z.object({
  role: z.enum(PART2_ROLES),
  skillsOffer: z.string().trim().max(500).optional().or(z.literal('')),
  skillsDevelop: z.string().trim().max(500).optional().or(z.literal('')),
});

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const Part2Schema = z.object({
  kindnessReflection: z.string().trim().min(1).refine(s => wordCount(s) >= 50 && wordCount(s) <= 200, 'Reflection must be 50–200 words'),
  aspirations: z.string().trim().min(1).max(1000),
  roleMappings: z.array(RoleMappingSchema).length(8),
  lifeSkills: z.array(z.enum(LIFE_SKILLS)).min(2, 'Select at least two life skills'),
  lifeSkillsOther: z.string().trim().max(120).optional().or(z.literal('')),
  languages: z.array(z.object({
    language: z.string().trim().min(1).max(40),
    proficiency: z.enum(['BASIC','INTERMEDIATE','FLUENT']),
  })).max(10).default([]),
  volunteerRoleTier: z.enum(['GENERAL_VOLUNTEER','LEADER','COORDINATOR','MANAGEMENT','INTERN']),
  preferredDays: z.array(z.enum(['WEEKDAYS','WEEKENDS'])).max(2).default([]),
  preferredTimeSlots: z.array(z.enum(['MORNING','AFTERNOON','EVENING'])).max(3).default([]),
  specificDaysTimes: z.string().trim().max(300).optional().or(z.literal('')),
  supportResources: z.array(z.enum(['COUNSELING','MENTORSHIP','COACHING','NEED_BASED_CAPACITY_BUILDING'])).max(4).default([]),
  preferredCityArea: z.string().trim().max(200).optional().or(z.literal('')),
  maxTravelDistance: z.enum(['WITHIN_5_KM','WITHIN_10_KM','ANYWHERE']).optional(),
  remoteAvailable: z.boolean().optional(),
  hasVolunteered: z.boolean(),
  previousOrgName: z.string().trim().max(120).optional().or(z.literal('')),
  previousRole: z.string().trim().max(120).optional().or(z.literal('')),
  previousDurationNature: z.string().trim().max(500).optional().or(z.literal('')),
  previousTotalHours: z.preprocess(emptyToUndef, z.coerce.number().finite().min(0).max(10000).optional()),
  linkedinUrl: z.union([z.string().url(), z.literal('')]).optional(),
  instagramUrl: z.union([z.string().url(), z.literal('')]).optional(),
  twitterUrl: z.union([z.string().url(), z.literal('')]).optional(),
  portfolioUrl: z.union([z.string().url(), z.literal('')]).optional(),
  emergencyContactName: requiredString.max(80),
  emergencyRelationship: requiredString.max(40),
  emergencyMobile: whatsappRegex, // same as RegisterSchema: /^\+?[0-9]{10,15}$/
  medicalConditions: z.string().trim().max(500).optional().or(z.literal('')),
  privacyPolicyConsent: z.literal(true),
  codeOfConductConsent: z.literal(true),
  mediaConsent: z.boolean(),
  whatsappConsent: z.boolean(),
}).superRefine((d, ctx) => {
  if (d.hasVolunteered && (!d.previousOrgName || !d.previousRole)) {
    ctx.addIssue({ code:'custom', path:['previousOrgName'], message:'Required when you have volunteered before' });
  }
  if (d.lifeSkills.includes('OTHER') && !d.lifeSkillsOther?.trim()) {
    ctx.addIssue({ code:'custom', path:['lifeSkillsOther'], message:'Please specify other skill' });
  }
});
```

Frontend `Part2Schema` mirrors backend exactly (copy).

## 3. Backend API

New module `backend/src/modules/onboarding-part2/` (routes/controller/service):

| Endpoint | Guard | Behavior |
|---|---|---|
| `GET /users/me/onboarding/part2` | requireAuth + VOLUNTEER role | Return `{ unlocked: boolean, data: Part2|null }`. unlocked = !!KindnessChallenge.part2UnlockedAt. If not unlocked: data null, 200 (frontend shows lock). |
| `PUT /users/me/onboarding/part2` | requireAuth + unlocked | Validate Part2Schema. Upsert VolunteerOnboardingPart2 (completedAt now). 403 if not unlocked. 403 if user not VOLUNTEER. |

No separate `isComplete` flag — existence of row means completed. Drafts stay client-only.

Add to `users` router or new router mounted at `/users/me/onboarding/part2`.

Service transaction: single upsert + update User if needed (no User fields mutated for Part II except optional audit).

## 4. Frontend

### Routes

- Keep `/volunteer/part2` placeholder but upgrade: when unlocked shows CTA `Continue to Part II` → `/volunteer/part2/onboarding`. When locked remains as is.
- New `/volunteer/part2/onboarding` page: 6-step wizard (grouping 10 sections into steps for UX):

  Step 1 (Reflection): §1 — 2 textareas (reflection + aspirations) with live word count.
  Step 2 (Roles): §2 — 8 role cards each with 2 inputs (Offer / Want to Develop).
  Step 3 (Skills & Languages): §3 + §4 — lifeSkills checkboxes (>=2) + languages table (fixed 4 rows + 3 custom Other rows, each proficiency radios).
  Step 4 (Commitment & Support): §5 + §6 — role tier radios, preferredDays checkboxes, timeSlots checkboxes, specificDaysTimes input + supportResources checkboxes.
  Step 5 (Background): §6b + §7 + §8 — location prefs + previous experience conditional + social links.
  Step 6 (Emergency & Consent): §9 + §10 — emergency fields + 4 consents.

Mobile-first, same `StepProps` pattern as Part I; reuse `FieldError`, progress bar, draft save to `localStorage` (key `part2-draft`), sessionStorage step, beforeunload warning.

Each step validates via `trigger` on Next; final submit validates all steps then PUT. On success: clear draft, toast, redirect to `/volunteer/dashboard` or `/volunteer/kindness-challenge`.

Gating: page calls `GET /kindness-challenge/me` + `GET /users/me/onboarding/part2` on mount; if not unlocked → redirect to `/volunteer/part2` locked state. If already completed → show read-only view with Edit button.

### Admin

Extend `GET /kindness-challenge/admin/export` to add Part2 columns: `part2_completed, role_tier, life_skills`. Or new `GET /users/admin/part2` with same pattern. For v1, extend CSV with `part2Completed,volunteerRoleTier`.

## 5. Testing

Backend `part2.schemas.test.ts`: word-count edges (49/50/200/201), lifeSkills min 2, hasVolunteered conditional, lifeSkillsOther required when OTHER selected, URL fields, mobile regex.

Backend `onboarding-part2.service.test.ts`: upsert creates/updates, gating (403 when locked, 200+null when unlocked before submit), VOLUNTEER-only guard, completedAt set.

Frontend: wizard step gates, draft save/restore, gating redirect when locked, submit PUT payload shape.

Manual happy path: complete Part I → start challenge → check-in daily → day7 story → part2UnlockedAt set → `/volunteer/part2/onboarding` accessible → submit Part II → row persists → admin export shows.

## 6. Risks & Rollout

- Part I `timeCommitment` vs Part II `specificDaysTimes` duplication — documented as additive; coordinator queries merge both.
- Word-count validation is client+server; trim/split on \s+ consistent both sides.
- No migration risk (dev stage, new table only).
- Follow repo conventions: pnpm, zod, prisma migrate, colocated `__tests__`, `api` client, `opencode` review.
