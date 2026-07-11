# Register & Profile Enhancement Design

**Date**: 2026-07-10
**Scope**: Hugging Face bucket URL allowlist, register form error display, setup-profile validation improvements

---

## 1. Hugging Face Bucket URL Allowlist

**Problem**: File uploads stored on Hugging Face buckets (URL pattern `https://huggingface.co/buckets/{namespace}/{bucket}/resolve/{id}.{ext}`) are blocked by Next.js CSP and `remotePatterns`.

**Changes to `frontend/next.config.ts`**:

- Add `https://huggingface.co` to `img-src` directive in Content-Security-Policy header
- Add remotePattern entry for `huggingface.co` with `protocol: 'https'`

---

## 2. Register Form Error Display Enhancement

**Problem**: API errors (409 duplicate email, network failures, server errors) are only shown via toast notifications. No inline form feedback.

**Changes to `frontend/app/(auth)/register/page.tsx`**:

- Add a `formError` state (string | null) for inline API error display
- Render a red error banner above the form fields when `formError` is set, with dismiss button
- On submit, clear previous `formError` before API call
- On API error, set `formError` instead of (or in addition to) toast

**Error banner design**:
- `bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700`
- Flex layout with error icon + message + close button
- `role="alert"` for accessibility

---

## 3. Setup-Profile Validation Improvements

**Problem**: The 7-step volunteer profile setup uses manual `useState` with toast-based validation. No per-field inline errors. DOB field uses `type="text"`.

**Changes to `frontend/app/(auth)/setup-profile/page.tsx`**:

- Migrate each step from `useState` to `react-hook-form` with `zodResolver` using the existing `OnboardingSchema`
- Each step becomes a sub-form with its own `useForm` instance (or a single shared instance — evaluate complexity)
- Add per-field inline error messages (`text-brand-error text-xs role="alert"`) matching the register page pattern
- Convert DOB from `type="text" placeholder="YYYY-MM-DD"` to `<input type="date">`
- Add form-level error banner for submission failures (same pattern as register)
- Keep the 7-step navigation and progress bar unchanged

**Step validation strategy**:
- Simplify by keeping the current approach but adding inline error state per field
- OR use react-hook-form per step for proper validation — evaluate which is less disruptive

---

## 4. Files Changed

| File | Change |
|------|--------|
| `frontend/next.config.ts` | Add `huggingface.co` to CSP `img-src` and `remotePatterns` |
| `frontend/app/(auth)/register/page.tsx` | Add inline API error banner, refine error UX |
| `frontend/app/(auth)/setup-profile/page.tsx` | Add react-hook-form validation, inline errors, date input type |

---

## 5. Not In Scope

- Backend changes (no schema migrations, no API changes)
- New fields on the User model (DOB/phone/gender collected during existing profile setup)
- Changing the 7-step structure of setup-profile
- Staff profile form changes (kept as-is)
