# Hours per Week ↔ Hours per Month Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Hours per Month` alongside `Hours per Week` in `setup-profile` Step 3 with bidirectional sync (`×4.33`, `1 decimal`, `sync on change`) + `Preferred days & times` to match `Part I §3`.

**Architecture:** Frontend `StepAvailability` handles live sync via `lastEditedRef` + `round1`; shared Zod schemas (frontend/backend) validate `1–168` / `4.3–727.4` with `0.06` tolerance; backend `users.service` derives missing value and persists `hoursPerMonth` + `preferredDaysTimes` via Prisma migration.

**Tech Stack:** Next.js 16 / React 19 / React Hook Form / Zod / Prisma / PostgreSQL / Vitest / pnpm 11

## Global Constraints

- `WEEKS_PER_MONTH = 4.33` (52/12) verbatim, `round1(n)=Math.round(n*10)/10` verbatim
- `hoursPerWeek` range `1–168`, `hoursPerMonth` range `4.3–727.4` (1*4.33 → 168*4.33) verbatim
- Cross-field tolerance `0.06` verbatim (`Math.abs(month - week*4.33) <= 0.06`)
- Sync mode `sync on change` verbatim (not on blur), clearing one clears the other
- Keep `Session Duration` (human confirmed) — do not remove
- `preferredDaysTimes` max 500 chars, optional

---

### Task 1: Shared Zod schemas — add hoursPerMonth + preferredDaysTimes

**Files:**
- Modify: `frontend/lib/shared/schemas/onboarding.schemas.ts:100-115`
- Modify: `backend/src/shared/schemas/onboarding.schemas.ts:100-115`
- Test: `frontend/lib/shared/schemas/__tests__/onboarding.schemas.test.ts` (create if missing) / `backend/src/shared/schemas/__tests__/onboarding.schemas.test.ts`

**Interfaces:**
- Consumes: existing `OnboardingSchema.step3` (volunteerType, availabilityPattern, hoursPerWeek, sessionDuration)
- Produces: `OnboardingSchema.step3` now includes `hoursPerMonth?: number`, `preferredDaysTimes?: string` with superRefine validator; `WEEKS_PER_MONTH`, `round1` exported for reuse

- [ ] **Step 1: Write failing test for frontend schema**

```ts
// frontend/lib/shared/schemas/__tests__/onboarding.schemas.test.ts
import { OnboardingSchema } from '../onboarding.schemas'
describe('step3 hours sync', () => {
  it('derives month from week 5 → 21.7', () => {
    const r = OnboardingSchema.shape.step3.safeParse({ volunteerType:'STUDENT', availabilityPattern:'WEEKDAYS', hoursPerWeek:5, hoursPerMonth:21.7, sessionDuration:2 })
    expect(r.success).toBe(true)
  })
  it('rejects mismatch 5 week + 10 month', () => {
    const r = OnboardingSchema.shape.step3.safeParse({ volunteerType:'STUDENT', availabilityPattern:'WEEKDAYS', hoursPerWeek:5, hoursPerMonth:10, sessionDuration:2 })
    expect(r.success).toBe(false)
  })
  it('allows only week (month optional)', () => {
    const r = OnboardingSchema.shape.step3.safeParse({ volunteerType:'STUDENT', availabilityPattern:'WEEKDAYS', hoursPerWeek:5, sessionDuration:2 })
    expect(r.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test frontend/lib/shared/schemas/__tests__/onboarding.schemas.test.ts -v`
Expected: FAIL — `hoursPerMonth` unknown / mismatch not validated

- [ ] **Step 3: Write minimal implementation — frontend schema**

```ts
// frontend/lib/shared/schemas/onboarding.schemas.ts
export const WEEKS_PER_MONTH = 4.33
export const round1 = (n:number) => Math.round(n*10)/10

// inside OnboardingSchema step3:
hoursPerWeek: z.coerce.number().finite().min(1).max(168).optional(),
hoursPerMonth: z.coerce.number().finite().min(4.3).max(727.4).optional(),
preferredDaysTimes: z.string().max(500).optional(),
// then .superRefine((v,ctx)=>{
//   if(v.hoursPerWeek==null && v.hoursPerMonth==null) ctx.addIssue({code:'custom', path:['hoursPerWeek'], message:'Provide hours per week or month'})
//   if(v.hoursPerWeek!=null && v.hoursPerMonth!=null && Math.abs(v.hoursPerMonth - v.hoursPerWeek*WEEKS_PER_MONTH) > 0.06) ctx.addIssue({code:'custom', path:['hoursPerMonth'], message:'Hours per week/month mismatch'})
// })
```

Apply mirror to `backend/src/shared/schemas/onboarding.schemas.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter frontend test frontend/lib/shared/schemas/__tests__/onboarding.schemas.test.ts -v` and `pnpm --filter backend test src/shared/schemas/__tests__/onboarding.schemas.test.ts -v`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git -C /home/nilesh/Documents/projects/we-the-yuva add -f frontend/lib/shared/schemas/onboarding.schemas.ts backend/src/shared/schemas/onboarding.schemas.ts frontend/lib/shared/schemas/__tests__/onboarding.schemas.test.ts backend/src/shared/schemas/__tests__/onboarding.schemas.test.ts
git -C /home/nilesh/Documents/projects/we-the-yuva commit -m "feat(schemas): add hoursPerMonth + preferredDaysTimes with 4.33/0.06 validation"
```

---

### Task 2: Prisma migration + backend derive logic

**Files:**
- Modify: `backend/prisma/schema.prisma:880-900` (VolunteerProfile)
- Create: `backend/prisma/migrations/<timestamp>_add_hours_per_month/migration.sql`
- Modify: `backend/src/modules/users/users.service.ts:410-430`
- Test: `backend/src/modules/users/__tests__/users.service.test.ts`

**Interfaces:**
- Consumes: `WEEKS_PER_MONTH`, `round1`, `hoursPerMonth` from Task 1 schemas
- Produces: `prisma.volunteerProfile` now stores `hoursPerMonth`/`preferredDaysTimes`; `users.service.completeOnboarding` derives missing value

- [ ] **Step 1: Write failing test for derive**

```ts
// backend/src/modules/users/__tests__/users.service.test.ts
it('derives hoursPerMonth from week 5 → 21.7', async () => {
  prisma.volunteerProfile.upsert.mockResolvedValue({})
  await completeOnboarding(userId, { step3: { volunteerType:'STUDENT', availabilityPattern:'WEEKDAYS', hoursPerWeek:5, sessionDuration:2 } })
  expect(prisma.volunteerProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ hoursPerMonth: 21.7 }) }))
})
it('derives week from month 21.7 → 5.0', async () => {
  await completeOnboarding(userId, { step3: { hoursPerWeek: undefined as any, hoursPerMonth:21.7, availabilityPattern:'WEEKDAYS', volunteerType:'STUDENT', sessionDuration:2 } })
  expect(prisma.volunteerProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ hoursPerWeek: 5 }) }))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter backend test src/modules/users/__tests__/users.service.test.ts -v`
Expected: FAIL — `hoursPerMonth` not set

- [ ] **Step 3: Prisma schema + migration**

```prisma
// backend/prisma/schema.prisma VolunteerProfile
  hoursPerWeek       Float?
  hoursPerMonth      Float?
  preferredDaysTimes String?
```

Create migration SQL:
```sql
ALTER TABLE "VolunteerProfile" ADD COLUMN "hoursPerMonth" DOUBLE PRECISION;
ALTER TABLE "VolunteerProfile" ADD COLUMN "preferredDaysTimes" TEXT;
```

Run: `pnpm --filter backend db:generate` and `pnpm --filter backend prisma migrate dev --name add_hours_per_month`

- [ ] **Step 4: Backend service derive**

```ts
// backend/src/modules/users/users.service.ts
import { WEEKS_PER_MONTH, round1 } from '../../shared/schemas/onboarding.schemas'
let { hoursPerWeek, hoursPerMonth, preferredDaysTimes } = step3 as any
if (hoursPerWeek != null && hoursPerMonth == null) hoursPerMonth = round1(hoursPerWeek * WEEKS_PER_MONTH)
if (hoursPerMonth != null && hoursPerWeek == null) hoursPerWeek = round1(hoursPerMonth / WEEKS_PER_MONTH)
if (hoursPerWeek != null && hoursPerMonth != null && Math.abs(hoursPerMonth - hoursPerWeek*WEEKS_PER_MONTH) > 0.06) throw new AppError('Hours per week/month mismatch', 400)
// persist both alongside existing fields
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter backend test src/modules/users/__tests__/users.service.test.ts -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git -C /home/nilesh/Documents/projects/we-the-yuva add -f backend/prisma/schema.prisma backend/prisma/migrations backend/src/modules/users/users.service.ts backend/src/modules/users/__tests__/users.service.test.ts
git -C /home/nilesh/Documents/projects/we-the-yuva commit -m "feat(backend): persist hoursPerMonth + preferredDaysTimes with derive (4.33)"
```

---

### Task 3: Frontend UI bidirectional sync

**Files:**
- Modify: `frontend/components/setup-profile/StepAvailability.tsx:30-110`
- Modify: `frontend/app/(auth)/setup-profile/page.tsx:50-65`
- Test: `frontend/components/setup-profile/__tests__/StepAvailability.test.tsx`

**Interfaces:**
- Consumes: `WEEKS_PER_MONTH`, `round1`, `hoursPerMonth` schema from Task 1
- Produces: `StepAvailability` now renders `Hours per Month` + sync handlers; `page.tsx` defaultValues includes `hoursPerMonth`

- [ ] **Step 1: Write failing component test**

```tsx
// frontend/components/setup-profile/__tests__/StepAvailability.test.tsx
import { render, fireEvent } from '@testing-library/react'
it('syncs week 5 → month 21.7 on change', async () => {
  const { getByLabelText } = render(<StepAvailability />) // with RHF wrapper
  fireEvent.change(getByLabelText(/Hours per Week/), { target: { value: '5' } })
  expect(getByLabelText(/Hours per Month/).value).toBe('21.7')
})
it('syncs month 21.7 → week 5.0 on change', async () => {
  fireEvent.change(getByLabelText(/Hours per Month/), { target: { value: '21.7' } })
  expect(getByLabelText(/Hours per Week/).value).toBe('5')
})
it('clearing week clears month', async () => {
  fireEvent.change(getByLabelText(/Hours per Week/), { target: { value: '' } })
  expect(getByLabelText(/Hours per Month/).value).toBe('')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test frontend/components/setup-profile/__tests__/StepAvailability.test.tsx -v`
Expected: FAIL — `Hours per Month` not found

- [ ] **Step 3: Implement UI**

```tsx
// frontend/components/setup-profile/StepAvailability.tsx
import { WEEKS_PER_MONTH, round1 } from '@/lib/shared/schemas/onboarding.schemas'
const lastEditedRef = useRef<'week'|'month'|null>(null)
// Add after Hours per Week commonInput:
<commonInput label="Hours per Month *" type="number" step="0.1" inputMode="decimal"
  {...register('step3.hoursPerMonth', { onChange: (e)=>{
    const v = e.target.value===''? undefined : Number(e.target.value)
    if(v===undefined){ setValue('step3.hoursPerMonth', undefined as any, {shouldDirty:true}); setValue('step3.hoursPerWeek', undefined as any, {shouldDirty:true}); return }
    lastEditedRef.current='month'; setValue('step3.hoursPerMonth', v, {shouldValidate:true, shouldDirty:true}); setValue('step3.hoursPerWeek', round1(v / WEEKS_PER_MONTH), {shouldValidate:true, shouldDirty:true})
  }})}
  error={errors.step3?.hoursPerMonth?.message}
/>
// Update Hours per Week to symmetric handleWeekChange
// Layout: change grid-cols-2 → grid-cols-3 (md:grid-cols-3) for the three fields
// Add below row:
<commonInput label="Preferred days & times" placeholder="e.g. Mon/Wed evenings, weekends" {...register('step3.preferredDaysTimes')} error={errors.step3?.preferredDaysTimes?.message} />
```

Update `frontend/app/(auth)/setup-profile/page.tsx` defaultValues `step3: { ..., hoursPerMonth: undefined, preferredDaysTimes: '' }`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter frontend test frontend/components/setup-profile/__tests__/StepAvailability.test.tsx -v` and `pnpm --filter frontend lint` + `pnpm --filter frontend typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C /home/nilesh/Documents/projects/we-the-yuva add -f frontend/components/setup-profile/StepAvailability.tsx frontend/app/\(auth\)/setup-profile/page.tsx frontend/components/setup-profile/__tests__/StepAvailability.test.tsx
git -C /home/nilesh/Documents/projects/we-the-yuva commit -m "feat(frontend): bidirectional hours week-month sync (×4.33, 1 decimal, on-change) + preferred days"
```

---

### Task 4: E2E verification + manual QA

**Files:**
- Test: `frontend/e2e/setup-profile-hours-sync.spec.ts` (optional Playwright) or manual checklist

**Interfaces:**
- Consumes: all prior tasks

- [ ] **Step 1: Run full suite**

Run: `pnpm --filter backend test` and `pnpm --filter frontend test`
Expected: 643+ new tests PASS, no lint/type errors

- [ ] **Step 2: Manual QA in setup-profile Step 3**

- Type `5` in Hours per Week → Hours per Month shows `21.7`
- Type `21.7` in Hours per Month → Hours per Week shows `5`
- Type `40` → `173.2`, clear one clears other, mismatch `5`+`10` shows error, `Preferred days & times` saves.

- [ ] **Step 3: Commit if needed (no code, doc update)**

```bash
git -C /home/nilesh/Documents/projects/we-the-yuva log --oneline -4
```

