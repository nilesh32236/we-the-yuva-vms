# Hours per Week ↔ Hours per Month Bidirectional Sync — Design

**Date:** 2026-08-23
**Feature:** Volunteer `Time Commitment` sync in `setup-profile` Step 3
**Client source:** `Part I Volunteer Registration Form & Expression of Interest.md` §3 Volunteer Profile → Time Commitment (`Hours per week: _____ | Hours per month: _____` + `Preferred days & times`)
**Tech:** Next.js 16 + React 19 + React Hook Form + Zod (frontend/backend shared schemas), Express + Prisma + PostgreSQL

## 1. Client alignment & scope

**Client doc §3 says:** `Hours per week | Hours per month` side-by-side plus `Preferred days & times` free text under it. `Volunteer Type` is separate. No `Session Duration` in doc — but current code has it.

**Current code `frontend/components/setup-profile/StepAvailability.tsx` + `frontend/lib/shared/schemas/onboarding.schemas.ts:108`:**
- Grid `grid-cols-2` with `Hours per Week *` + `Session Duration (hrs) *`
- Chips for `Availability Pattern` (WEEKDAYS/WEEKENDS/BOTH/FLEXIBLE) + `Volunteer Type`
- Schema `step3: { volunteerType, availabilityPattern, hoursPerWeek 1–168, sessionDuration ≥0.5 }` — no `hoursPerMonth`.

**Scope agreed (human 2026-08-23):**
- Keep `Volunteer Type`, `Availability Pattern`, `Session Duration` (human confirmed `keep Session Duration`)
- Add `Hours per Month` alongside `Hours per Week` in `Time Commitment` (grid `grid-cols-2` → `grid-cols-3` on `md`, stacks 1 col mobile)
- Add `Preferred days & times` free-text input under that row to exactly match doc
- Conversion `×4.33` (52/12), rounding `1 decimal`, `sync on change`
- Out of scope: `/register` page, other Part I sections, calendar

## 2. Data model & validation

**Constants:**
```ts
const WEEKS_PER_MONTH = 4.33 // 52 / 12
const round1 = (n:number) => Math.round(n * 10) / 10
```

**Frontend `frontend/lib/shared/schemas/onboarding.schemas.ts` step3:**
```ts
hoursPerWeek: z.coerce.number().finite().min(1, "Min 1h").max(168, "Max 168h").optional()
hoursPerMonth: z.coerce.number().finite().min(4.3).max(727.4).optional() // 1*4.33 → 168*4.33, 1 decimal
preferredDaysTimes: z.string().max(500).optional()
sessionDuration: z.coerce.number().finite().min(0.5).optional() // keep
```
Cross-field `.superRefine`: require at least one of `hoursPerWeek`/`hoursPerMonth`; if both present check `Math.abs(hoursPerMonth - hoursPerWeek*4.33) <= 0.06` (tolerance for 1-decimal rounding both ways).

**Backend `backend/src/shared/schemas/onboarding.schemas.ts:106`:** mirror same.

**Prisma `schema.prisma` VolunteerProfile:** add
```prisma
hoursPerMonth       Float?
preferredDaysTimes  String?
```
(Migration `add_hours_per_month`). Keep `hoursPerWeek` column.

## 3. UI & sync logic (`frontend/components/setup-profile/StepAvailability.tsx`)

**Layout:**
- Row: `Hours per Week *` | `Hours per Month *` | `Session Duration (hrs) *` (unchanged third)
- Below: `Preferred days & times` `commonInput` placeholder `e.g. Mon/Wed evenings, weekends`

**Sync (bidirectional, on change):**
```ts
const lastEditedRef = useRef<'week'|'month'|null>(null)
const handleWeekChange = (e) => {
  const v = e.target.value === '' ? undefined : Number(e.target.value)
  if (v === undefined) { setValue('step3.hoursPerWeek', undefined as any, {shouldDirty:true}); setValue('step3.hoursPerMonth', undefined as any, {shouldDirty:true}); return }
  if (Number.isFinite(v)) {
    lastEditedRef.current = 'week'
    setValue('step3.hoursPerWeek', v, {shouldValidate:true, shouldDirty:true})
    setValue('step3.hoursPerMonth', round1(v * WEEKS_PER_MONTH), {shouldValidate:true, shouldDirty:true})
  }
}
const handleMonthChange = (e) => {
  const v = e.target.value === '' ? undefined : Number(e.target.value)
  if (v === undefined) { setValue('step3.hoursPerMonth', undefined as any, {shouldDirty:true}); setValue('step3.hoursPerWeek', undefined as any, {shouldDirty:true}); return }
  if (Number.isFinite(v)) {
    lastEditedRef.current = 'month'
    setValue('step3.hoursPerMonth', v, {shouldValidate:true, shouldDirty:true})
    setValue('step3.hoursPerWeek', round1(v / WEEKS_PER_MONTH), {shouldValidate:true, shouldDirty:true})
  }
}
```
- Inputs: `type="number" step="0.1" inputMode="decimal"` for both
- Avoid loop: only set the *other* field, guard with `lastEditedRef`
- Helper text live: `≈ 21.7 h/month` under week, `≈ 5.0 h/week` under month
- Errors: `errors.step3?.hoursPerWeek` / `hoursPerMonth` inline, cross-field mismatch under pair

**Default handling `frontend/app/(auth)/setup-profile/page.tsx:51,61`:** `defaultValues.step3.hoursPerWeek 0 → undefined` if empty, add `hoursPerMonth`.

## 4. Persistence & API

**`backend/src/modules/users/users.service.ts` completeOnboarding step3:**
```ts
let { hoursPerWeek, hoursPerMonth, preferredDaysTimes, sessionDuration } = step3
if (hoursPerWeek != null && hoursPerMonth == null) hoursPerMonth = round1(hoursPerWeek * 4.33)
if (hoursPerMonth != null && hoursPerWeek == null) hoursPerWeek = round1(hoursPerMonth / 4.33)
if (hoursPerWeek != null && hoursPerMonth != null && Math.abs(hoursPerMonth - hoursPerWeek*4.33) > 0.06) throw new AppError('Hours per week/month mismatch', 400)
await prisma.volunteerProfile.upsert/update with { hoursPerWeek, hoursPerMonth, preferredDaysTimes, sessionDuration }
```
No `/register` change.

## 5. Testing, risks & rollout

**Tests:**
- Schema unit: `1→4.3`, `5→21.7`, `40→173.2`, `168→727.4`, reverse `21.7→5.0`, mismatch reject, clearing, bounds
- Component: `StepAvailability.test` typing week updates month (and reverse), lastEdited prevents loop, preferredDaysTimes persists, errors
- Backend: `users.service.test` derive missing, mismatch 400, Prisma persist

**Risks:** `4.33` vs `52/12=4.333…` drift mitigated by `round1` + `0.06`; existing users with only week backfilled on next save.

**Rollout:** Migration + frontend/backend schema + UI in one PR `feat(availability): hours week-month sync`.
