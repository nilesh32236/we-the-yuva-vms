# Register & Profile Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Hugging Face URL allowlist, add inline API error banner to register form, and improve setup-profile validation UX with inline errors and proper date input.

**Architecture:** Two independent frontend-only changes to existing pages (register and setup-profile) plus a config fix. No backend changes.

**Tech Stack:** Next.js 16, Tailwind v4, react-hook-form, zod

---

## File Structure

| File | Change |
|------|--------|
| `frontend/next.config.ts` | Add `huggingface.co` to CSP `img-src` and `images.remotePatterns` |
| `frontend/app/(auth)/register/page.tsx` | Add inline API error banner, refine error UX |
| `frontend/app/(auth)/setup-profile/page.tsx` | Add inline field validation errors, convert DOB to date input, add form-level error banner |

---

### Task 1: Add Hugging Face to CSP and Remote Patterns

**Files:**
- Modify: `frontend/next.config.ts:33-49` (remotePatterns), `frontend/next.config.ts:72-74` (CSP)

- [ ] **Step 1: Add huggingface.co to remotePatterns**

Edit `frontend/next.config.ts` to add the huggingface.co remote pattern to the `images.remotePatterns` array.

```typescript
// In the remotePatterns array, after the getApiRemotePattern() line, add:
{
  protocol: 'https' as const,
  hostname: 'huggingface.co',
},
```

- [ ] **Step 2: Add huggingface.co to CSP img-src**

Edit `frontend/next.config.ts` to add `https://huggingface.co` to the `img-src` directive in the Content-Security-Policy header.

Update the CSP value string from:
```
img-src 'self' data: images.unsplash.com plus.unsplash.com
```
to:
```
img-src 'self' data: images.unsplash.com plus.unsplash.com https://huggingface.co
```

- [ ] **Step 3: Verify the config builds**

Run: `cd frontend && pnpm build`
Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/next.config.ts
git commit -m "fix: add huggingface.co to CSP and remote patterns for bucket uploads

GH-35"
```

---

### Task 2: Add Inline API Error Banner to Register Form

**Files:**
- Modify: `frontend/app/(auth)/register/page.tsx`

**Interfaces:**
- Adds `formError` state (`string | null`)
- Renders error banner conditionally above the `<form>` element

- [ ] **Step 1: Add formError state and clear-on-submit logic**

In `frontend/app/(auth)/register/page.tsx`, add a `formError` state after line 21 (`const [ready, setReady] = useState(false);`):

```typescript
const [formError, setFormError] = useState<string | null>(null);
```

In the `onSubmit` function (line 65), add `setFormError(null);` at the start of the try block, before the API calls.

- [ ] **Step 2: Set formError on API errors**

Update the catch block (lines 76-96) to set `formError` instead of (or in addition to) showing a toast. Replace the entire catch block:

```typescript
    } catch (error) {
      const err = error as {
        normalizedMessage?: string;
        response?: { status?: number; data?: { error?: string } };
      };
      const status = err?.response?.status;
      if (status === 409) {
        setFormError('This email is already registered. Please log in instead.');
      } else {
        const message =
          err?.normalizedMessage ??
          err?.response?.data?.error ??
          'Something went wrong. Please try again.';
        setFormError(message);
      }
    } finally {
      setIsLoading(false);
    }
```

- [ ] **Step 3: Render the error banner**

After the closing `</div>` of the header/text block (line 120) and before the `<form>` (line 122), add the error banner:

```tsx
        {/* Inline API error banner */}
        {formError && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400" role="alert">
            <span className="mt-0.5 shrink-0">⚠</span>
            <p className="flex-1">{formError}</p>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-red-500 hover:text-red-700 cursor-pointer shrink-0"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
```

- [ ] **Step 4: Verify the build**

Run: `cd frontend && pnpm build`
Expected: Build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/\(auth\)/register/page.tsx
git commit -m "feat: add inline API error banner to register form

GH-35"
```

---

### Task 3: Improve Setup-Profile Validation UX

**Files:**
- Modify: `frontend/app/(auth)/setup-profile/page.tsx`

**Interfaces:**
- Adds `fieldErrors` state (`Record<string, string>`)
- Adds `formError` state (`string | null`)
- Converts DOB input to `type="date"`
- Adds inline error messages below each required field in all 7 steps
- Adds submit-level error banner

- [ ] **Step 1: Add formError and fieldErrors state**

After line 146 (the last `setS7` block), add error state:

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
const [formError, setFormError] = useState<string | null>(null);
```

Add `setFormError(null)` at the start of the `handleSubmit` function (line 203).

- [ ] **Step 2: Convert DOB input to type="date"**

In Step 1 (line 450), change the DOB input from:
```tsx
{commonInput('Date of Birth *', s1.dateOfBirth, (v) => setS1({ ...s1, dateOfBirth: v }), 'YYYY-MM-DD')}
```
to:
```tsx
{commonInput('Date of Birth *', s1.dateOfBirth, (v) => setS1({ ...s1, dateOfBirth: v }), '', 'date')}
```

- [ ] **Step 3: Refine validateStep to return field-level errors**

Replace the `validateStep` function (lines 157-201) to populate `fieldErrors` object instead of/alongside showing toasts:

```typescript
  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (step === 0) {
      if (!s1.fullName) errors.fullName = 'Full name is required';
      if (!s1.gender) errors.gender = 'Please select gender';
      if (!s1.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!s1.mobile) errors.mobile = 'Mobile number is required';
      if (!s1.address) errors.address = 'Address is required';
      if (!s1.city) errors.city = 'City is required';
      if (!s1.district) errors.district = 'District is required';
      if (!s1.state) errors.state = 'State is required';
      if (!s1.pincode) errors.pincode = 'PIN code is required';
    }
    if (step === 1) {
      if (!s2.highestQualification) errors.highestQualification = 'Qualification is required';
      if (!s2.fieldOfStudy) errors.fieldOfStudy = 'Field of study is required';
      if (!s2.currentStatus) errors.currentStatus = 'Current status is required';
    }
    if (step === 2) {
      if (!s3.volunteerType) errors.volunteerType = 'Select volunteer type';
      if (s3.areasOfInterest.length === 0) errors.areasOfInterest = 'Select at least one area';
      if (s3.skills.length === 0) errors.skills = 'Select at least one skill';
      if (s3.languages.length === 0) errors.languages = 'Add at least one language';
    }
    if (step === 3) {
      if (s4.daysAvailable.length === 0) errors.daysAvailable = 'Select at least one day';
      if (s4.preferredTime.length === 0) errors.preferredTime = 'Select at least one time slot';
      if (!s4.frequency) errors.frequency = 'Select frequency';
      if (!s4.maxHours) errors.maxHours = 'Select preferred hours';
      if (!s4.preferredCity) errors.preferredCity = 'Preferred city is required';
      if (!s4.maxTravelDistance) errors.maxTravelDistance = 'Select travel distance';
    }
    if (step === 4) {
      if (s5.motivations.length === 0) errors.motivations = 'Select at least one motivation';
    }
    if (step === 5) {
      if (!s6.emergencyName) errors.emergencyName = 'Contact name required';
      if (!s6.emergencyRelationship) errors.emergencyRelationship = 'Relationship required';
      if (!s6.emergencyPhone) errors.emergencyPhone = 'Phone number required';
    }
    if (step === 6) {
      if (!s7.privacyPolicyAccepted) errors.privacyPolicyAccepted = 'You must accept privacy policy';
      if (!s7.codeOfConductAccepted) errors.codeOfConductAccepted = 'You must accept code of conduct';
      if (!s7.referralSource) errors.referralSource = 'Select referral source';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Please fix the highlighted fields', variant: 'destructive' });
    }
    return Object.keys(errors).length === 0;
  };
```

Also add `setFieldErrors({})` at the start of `validateStep`.

- [ ] **Step 4: Add inline error messages to Step 1 — Personal Information**

Replace each `commonInput` call in Step 1 to conditionally show an error message below it. Add a helper that wraps commonInput with error display:

Actually, since `commonInput` is a helper function, we need to modify it or create a wrapper. The cleanest approach is to modify `commonInput` to accept an optional error prop. Let's add an `error` parameter.

Modify the `commonInput` function (lines 307-328) to accept and render an error prop:

```typescript
  const commonInput = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder = '',
    type = 'text',
    error?: string,
  ) => {
    const id = `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-brand-text">{label}</label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
            error ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'
          }`}
        />
        {error && (
          <p id={`${id}-error`} className="text-brand-error text-xs" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  };
```

Then update each call in Step 1 to pass the error. For example:
```tsx
{commonInput('Full Name *', s1.fullName, (v) => setS1({ ...s1, fullName: v }), 'Your full name', 'text', fieldErrors.fullName)}
```
Similarly for all other Step 1 commonInput calls.

For `selectInput`, add error parameter similarly (lines 330-354). Add `error?: string` parameter, apply error border style, and render error message below the select element.

Similarly, update each `commonInput` and `selectInput` call in Steps 1-7 to pass its corresponding `fieldErrors.*` value.

- [ ] **Step 5: Add inline error messages to Step 2 — Education**

Update all `commonInput` and `selectInput` calls in Step 2 to pass field errors (`fieldErrors.highestQualification`, `fieldErrors.fieldOfStudy`, `fieldErrors.currentStatus`).

- [ ] **Step 6: Add inline error messages to Step 3 — Volunteer Profile**

Update `selectInput` call for volunteerType to pass `fieldErrors.volunteerType`.
For ChipSelect areas (areas of interest, skills, languages), add conditional error display after each ChipSelect block:

```tsx
{fieldErrors.areasOfInterest && (
  <p className="text-brand-error text-xs" role="alert">{fieldErrors.areasOfInterest}</p>
)}
```

Add similar blocks for `fieldErrors.skills` and `fieldErrors.languages`.

- [ ] **Step 7: Add inline error messages to Steps 4-7**

Update `commonInput` and `selectInput` calls in Steps 4, 5, 6, and 7 to pass respective field errors.

For `chipSelect` areas (days, preferredTime, motivations, hopedGains, etc.), add conditional error paragraph below each.

For Step 7 checkboxes (privacyPolicyAccepted, codeOfConductAccepted), add inline error below the checkbox:

```tsx
{fieldErrors.privacyPolicyAccepted && (
  <p className="text-brand-error text-xs" role="alert">{fieldErrors.privacyPolicyAccepted}</p>
)}
```

- [ ] **Step 8: Add form-level error banner for submission errors**

Add a form-level error banner before the navigation buttons (before line 864), matching the register page pattern:

```tsx
        {formError && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400" role="alert">
            <p className="flex-1">{formError}</p>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-red-500 hover:text-red-700 cursor-pointer shrink-0"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
```

Update the catch block in `handleSubmit` (lines 293-299) to set `formError` as well or instead of just the toast:

```typescript
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save profile. Please try again.';
      setFormError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
```

- [ ] **Step 9: Verify the build**

Run: `cd frontend && pnpm build`
Expected: Build completes without errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/app/\(auth\)/setup-profile/page.tsx
git commit -m "feat: improve setup-profile validation UX with inline errors and date input

GH-35"
```
