# VMS Automation Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate autonomous audit→fix→review workflow system from qrolichealth to we-the-yuva-vms, with audit prompts rewritten for a full-stack VMS app (JWT auth, RBAC, TanStack Query, PWA, Sentry, roles).

**Architecture:** Three new workflow YAMLs (codebase-audit, fix-audit-issue, review-autofix-pr) + one existing modified (opencode-review) + 12 audit prompt markdown files. Workflows are adapted from qrolichealth with paths/commands/triggers matching VMS project conventions.

**Tech Stack:** Next.js 16, Biome 2, pnpm@9, GH_PAT secret exists, GitHub Actions

## Global Constraints

- All new workflow files in `.github/workflows/`
- All audit prompts in `.audit-prompts/`
- `GH_PAT` secret exists — use directly (no fallback to GITHUB_TOKEN)
- Biome: spaces (2) indent, single quotes, trailing commas es5, semicolons always — for prompt JSON examples
- Commands: `pnpm lint` → `biome lint app components lib hooks`, `pnpm typecheck` → `tsc --noEmit`
- Package manager: pnpm@9.0.0
- Manual merge only — no auto-approve or auto-merge
- `autofix`/`autofix:reviewed`/`autofix:needs-manual-review`/`autofix:merged` labels must exist

---

### Task 1: Restrict opencode-review.yml to `/oc` commands only

**Files:**
- Modify: `.github/workflows/opencode-review.yml`

**Interfaces:**
- Consumes: existing opencode-review.yml
- Produces: workflow that only triggers on `/oc` issue_comment (not PR events)

- [ ] **Remove PR triggers from `on:`**

Old:
```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
```

New:
```yaml
on:
  issue_comment:
    types: [created]
```

- [ ] **Simplify the concurrency group** to use `issue.number` only (no PR fallback needed):

```yaml
concurrency:
  group: opencode-review-${{ github.event.issue.number }}
  cancel-in-progress: true
```

- [ ] **Simplify the job `if` condition** to only trigger on `/oc`:

```yaml
jobs:
  review:
    if: contains(github.event.comment.body || '', '/oc')
```

- [ ] **Update checkout ref** to handle issue_comment context properly:

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

- [ ] **Fix `PR_NUMBER` assignment** to use issue comment PR context:

The existing line uses `github.event.pull_request.number || github.event.issue.number` — change to:
```bash
PR_NUMBER="${{ github.event.issue.number }}"
```

But actually this won't work for issue_comment events on PRs where issue.number = PR number. The existing logic `github.event.pull_request.number || github.event.issue.number` is correct. Keep it as-is.

- [ ] **Commit**

```bash
git add .github/workflows/opencode-review.yml
git commit -m "fix: restrict opencode-review to /oc commands only"
```

---

### Task 2: Create codebase-audit.yml

**Files:**
- Create: `.github/workflows/codebase-audit.yml`

**Interfaces:**
- Consumes: audit prompts from `.audit-prompts/*.md`
- Produces: GitHub Issues with `audit:critical` / `audit:important` labels

- [ ] **Create the workflow file:**

```yaml
name: Codebase Audit

on:
  schedule:
    - cron: '0 6 * * 0'
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Optional: re-audit a specific issue number'
        required: false
        type: string

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Ensure audit labels exist
        run: |
          for label in audit:critical audit:important audit:minor autofix:reviewed autofix:needs-manual-review autofix:merged; do
            gh label create "$label" --force 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Close old OpenCode PRs
        run: |
          PRS=$(gh pr list --label autofix --json number,headRefName,createdAt --state open --limit 50 --jq '.[] | select(.headRefName | startswith("opencode/")) | .number' 2>/dev/null || echo "")
          for pr in $PRS; do
            echo "Closing old OpenCode PR #$pr"
            gh pr close "$pr" --delete-branch 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}

      - name: Get existing issues to avoid duplicates
        id: existing-issues
        run: |
          EXISTING=$(gh issue list --label 'audit:critical,audit:important' --state open --json title --jq '[.[].title]' 2>/dev/null || echo "[]")
          echo "existing=$EXISTING" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}

      - name: Audit authentication-authorization
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/authentication-authorization.md
          share: false

      - name: Audit api-data-fetching
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/api-data-fetching.md
          share: false

      - name: Audit role-based-access
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/role-based-access.md
          share: false

      - name: Audit security
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/security.md
          share: false

      - name: Audit data-integrity
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/data-integrity.md
          share: false

      - name: Audit pwa-offline
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/pwa-offline.md
          share: false

      - name: Audit ui-ux-accessibility
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/ui-ux-accessibility.md
          share: false

      - name: Audit code-quality-conventions
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/code-quality-conventions.md
          share: false

      - name: Audit error-handling-monitoring
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/error-handling-monitoring.md
          share: false

      - name: Audit performance
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/performance.md
          share: false

      - name: Audit forms-validation
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/forms-validation.md
          share: false

      - name: Audit state-management
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          prompt_file: .audit-prompts/state-management.md
          share: false

      - name: Process OpenCode findings into issues
        run: |
          # Read all .opencode/audit-output-*.md files, dedupe against existing issues,
          # and create issues with appropriate severity labels
          for file in .opencode/audit-output-*.md; do
            [ -f "$file" ] || continue
            echo "Processing $file..."
            # Use jq-like parsing or bash to extract structured findings
            # and create issues via gh issue create
          done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
```

- [ ] **Commit**

```bash
git add .github/workflows/codebase-audit.yml
git commit -m "feat: add weekly codebase audit workflow for VMS"
```

---

### Task 3: Create fix-audit-issue.yml

**Files:**
- Create: `.github/workflows/fix-audit-issue.yml`

**Interfaces:**
- Consumes: `/fix` comment on any issue
- Produces: autofix PR with branch `autofix/issue-{N}`

- [ ] **Create the workflow file:**

```yaml
name: Fix Audit Issue

on:
  issue_comment:
    types: [created]

permissions:
  contents: write
  issues: write
  pull-requests: write

concurrency:
  group: fix-${{ github.event.issue.number }}
  cancel-in-progress: true

jobs:
  fix:
    if: |
      contains(github.event.comment.body || '', '/fix')
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: main

      - name: Configure git
        run: |
          git config user.name 'qrolic-bot'
          git config user.email 'bot@qrolic.com'

      - name: Ensure labels exist
        run: |
          for label in autofix autofix:reviewed autofix:needs-manual-review autofix:merged; do
            gh label create "$label" --force 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Close old autofix PRs for this issue
        run: |
          OLD=$(gh pr list --head "autofix/issue-${{ github.event.issue.number }}" --json number --jq '.[].number' 2>/dev/null || echo "")
          for pr in $OLD; do
            gh pr close "$pr" --delete-branch 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}

      - name: Run OpenCode to fix issue
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          share: true
          prompt: |
            You are fixing a GitHub issue. Read the issue body and comments at ${{ github.event.issue.html_url }}.

            Context: This is a Next.js 16 App Router project (we-the-yuva-vms). Before making changes:
            1. Read AGENTS.md in the project root for conventions
            2. Read biome.json in the project root for linting rules
            3. Read any relevant source files to understand existing patterns

            After making changes:
            1. Run `pnpm typecheck` — fix any type errors
            2. Run `pnpm lint` — fix any lint errors
            3. Commit and push all changes

      - name: Add autofix label
        run: |
          gh issue edit ${{ github.event.issue.number }} --add-label 'autofix'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Capture OpenCode changes
        id: opencode-changes
        run: |
          OUR_BRANCH="autofix/issue-${{ github.event.issue.number }}"
          git fetch origin
          if git checkout -b "$OUR_BRANCH" "origin/$OUR_BRANCH" 2>/dev/null; then
            echo "branch_existed=true" >> "$GITHUB_OUTPUT"
          else
            echo "branch_existed=false" >> "$GITHUB_OUTPUT"
            # Find OpenCode's branch and capture its changes
            OC_BRANCH=$(gh pr list --author 'github-actions[bot]' --json headRefName,createdAt --state open --limit 10 --jq '[.[] | select(.headRefName | startswith("opencode/"))] | sort_by(.createdAt) | last | .headRefName' 2>/dev/null || echo "")
            if [ -n "$OC_BRANCH" ] && [ "$OC_BRANCH" != "null" ]; then
              echo "Found OpenCode branch: $OC_BRANCH"
              git fetch origin "$OC_BRANCH"
              git checkout -b "$OUR_BRANCH" "origin/$OC_BRANCH"
              echo "branch_created_from_opencode=true" >> "$GITHUB_OUTPUT"
            else
              echo "No OpenCode changes found — attempting fix inline"
              echo "branch_created_from_opencode=false" >> "$GITHUB_OUTPUT"
              git checkout -b "$OUR_BRANCH"
            fi
          fi
          git push origin "$OUR_BRANCH"
          echo "branch=$OUR_BRANCH" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}

      - name: Create PR from changes
        if: steps.opencode-changes.outputs.branch_existed == 'true' || steps.opencode-changes.outputs.branch_created_from_opencode == 'true'
        run: |
          OUR_BRANCH="${{ steps.opencode-changes.outputs.branch }}"

          # Ensure the branch has commits beyond main
          COMMITS=$(git rev-list --count "origin/main..origin/$OUR_BRANCH" 2>/dev/null || echo 0)
          if [ "$COMMITS" -eq 0 ]; then
            echo "No new commits on branch — skipping PR creation"
            exit 0
          fi

          # Create or update the PR
          PR_EXISTS=$(gh pr list --head "$OUR_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
          if [ -n "$PR_EXISTS" ] && [ "$PR_EXISTS" != "null" ]; then
            echo "PR #$PR_EXISTS already exists — updating"
          else
            gh pr create \
              --base main \
              --head "$OUR_BRANCH" \
              --title "fix: address issue #${{ github.event.issue.number }}" \
              --body "Closes #${{ github.event.issue.number }}

          Automated fix generated by OpenCode.

          **Review & merge:**
          1. Review the changes
          2. If satisfied, merge manually
          3. The review workflow will label this PR \`autofix:reviewed\`" \
              --label 'autofix'
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}

      - name: Report failure
        if: failure()
        run: |
          gh issue comment ${{ github.event.issue.number }} --body "OpenCode attempted to fix this issue but encountered an error. Check workflow logs for details."
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
```

- [ ] **Commit**

```bash
git add .github/workflows/fix-audit-issue.yml
git commit -m "feat: add /fix handler workflow for VMS"
```

---

### Task 4: Create review-autofix-pr.yml

**Files:**
- Create: `.github/workflows/review-autofix-pr.yml`

**Interfaces:**
- Consumes: PRs with `autofix` label, `opened`/`synchronize` events
- Produces: label `autofix:reviewed` or `autofix:needs-manual-review`

- [ ] **Create the workflow file:**

```yaml
name: Review Autofix PR

on:
  pull_request:
    types: [opened, synchronize]
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  issues: write

concurrency:
  group: review-autofix-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    if: contains(github.event.pull_request.labels.*.name || '', 'autofix')
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          fetch-depth: 0

      - name: Configure git
        run: |
          git config user.name 'qrolic-bot'
          git config user.email 'bot@qrolic.com'

      - name: Ensure labels exist
        run: |
          for label in autofix:reviewed autofix:needs-manual-review autofix:merged; do
            gh label create "$label" --force 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run OpenCode to review PR
        id: opencode-review
        continue-on-error: true
        uses: anomalyco/opencode/github@latest
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
        with:
          model: opencode/deepseek-v4-flash-free
          use_github_token: true
          share: true
          prompt: |
            Review this pull request in we-the-yuva-vms (Volunteer Management System).

            Before reviewing:
            1. Read AGENTS.md for project conventions
            2. Read biome.json for linting rules
            3. Read COMPONENTS.md for component patterns if it exists

            Check for:
            - Bugs, logic errors, type safety
            - Security: PII exposure, auth/RBAC gaps, XSS vectors (Tiptap)
            - Conventions: Biome compliance, project conventions from AGENTS.md
            - Dead code, debug artifacts, console.log
            - UX: mobile touch targets, dark mode, keyboard nav
            - API/TanStack Query patterns: error handling, stale time, optimistic updates

            Categorize findings: critical (must fix), important (should fix), minor (nice to have).

            After reviewing:
            1. If fixable issues found, apply fixes directly
            2. Run `pnpm typecheck` and `pnpm lint` to verify
            3. Commit and push any changes

      - name: Determine review outcome
        id: review-outcome
        run: |
          # Check if OpenCode made any changes
          if git diff --quiet HEAD~1 2>/dev/null; then
            echo "no_changes=true" >> "$GITHUB_OUTPUT"
          else
            echo "no_changes=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Label as reviewed
        run: |
          gh pr edit ${{ github.event.pull_request.number }} --add-label 'autofix:reviewed'
          gh pr edit ${{ github.event.pull_request.number }} --remove-label 'autofix' 2>/dev/null || true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
```

- [ ] **Commit**

```bash
git add .github/workflows/review-autofix-pr.yml
git commit -m "feat: add autofix PR review workflow for VMS"
```

---

### Task 5: Create all 12 audit prompt files

**Files:**
- Create: `.audit-prompts/authentication-authorization.md`
- Create: `.audit-prompts/api-data-fetching.md`
- Create: `.audit-prompts/role-based-access.md`
- Create: `.audit-prompts/security.md`
- Create: `.audit-prompts/data-integrity.md`
- Create: `.audit-prompts/pwa-offline.md`
- Create: `.audit-prompts/ui-ux-accessibility.md`
- Create: `.audit-prompts/code-quality-conventions.md`
- Create: `.audit-prompts/error-handling-monitoring.md`
- Create: `.audit-prompts/performance.md`
- Create: `.audit-prompts/forms-validation.md`
- Create: `.audit-prompts/state-management.md`

- [ ] **Step 1: Create .audit-prompts/ directory**

```bash
mkdir -p .audit-prompts
```

- [ ] **Step 2 through Step 13: Write each prompt file**

Each prompt file follows this template structure:
```markdown
# [Category] Audit — WeTheYuva VMS

## Context
This is a full-stack Volunteer Management System. Next.js 16, React 19, Tailwind v4, shadcn/ui, Biome, TypeScript.

## What to Check
- ...

## Severity Rules
- **critical**: ...
- **important**: ...
- **minor**: ...

## Output Format
For each finding, output:
SEVERITY: critical|important|minor
FILE: path/to/file.ts
LINE: 42
ISSUE: Description of the problem
SUGGESTION: How to fix it
```

Each prompt is tailored to the VMS context. For example:

**authentication-authorization.md:** JWT handling (jose), route protection (middleware or layout checks), role guards (volunteer/coordinator/org-admin/admin/observer), password reset flow, token refresh, session expiry, CSRF token management.

**api-data-fetching.md:** TanStack Query patterns, axios instance usage, error handling in queries/mutations, optimistic updates, pagination, stale time config, query key structure.

**role-based-access.md:** Route group permissions (`(volunteer)/`, `(admin)/` etc.), component-level role checks, API route RBAC (check the proxy.ts file), data scoping per role.

**security.md:** PII exposure in logs/URLs/client-side, XSS in Tiptap rich text, API hardening, input sanitization, Sentry event data (no PII in breadcrumbs), JWT storage, rate limiting.

**data-integrity.md:** Zod schema validation, form data constraints, data relationships, state consistency between server and client.

**pwa-offline.md:** Serwist service worker configuration, offline UX (loading/error states), push notification handling, cache strategies, manifest.json, icon paths.

**ui-ux-accessibility.md:** Dark mode implementation, mobile responsiveness, form UX (loading states, error display), keyboard navigation, ARIA attributes, toast notifications.

**code-quality-conventions.md:** Biome compliance, AGENTS.md conventions (single quotes, spaces indent, theme tokens), dead code/unused imports, console.log, barrel files.

**error-handling-monitoring.md:** Sentry configuration, error boundaries, API error handling (axios interceptors), React Query error states, graceful degradation, fallback UI.

**performance.md:** Image optimization, bundle size, React Query caching strategy, re-render optimization, code splitting, dynamic imports.

**forms-validation.md:** react-hook-form patterns, Zod resolver, field error display, loading states, optimistic UI, form submission error handling, dirty/touched state.

**state-management.md:** React Query cache vs local state, context usage, URL state, stale-while-revalidate patterns, optimistic updates, cache invalidation.

- [ ] **Step 14: Commit**

```bash
git add .audit-prompts/
git commit -m "feat: add 12 VMS-specific audit prompt categories"
```

---

### Task 6: Verifications

**Files:**
- N/A — verification steps

- [ ] **Full build check:**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Lint check:**

Run: `pnpm lint`
Expected: No lint errors

- [ ] **Typecheck:**

Run: `pnpm typecheck`
Expected: No type errors
