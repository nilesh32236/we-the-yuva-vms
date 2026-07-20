# OpenCode GitHub Workflow Reference

This document contains the full content of every file used to run OpenCode in CI/CD pipelines. Each section includes the file path, a description, and the complete file content.

---


## 1. GitHub Workflow Files

---

### File: `.github/workflows/opencode-review.yml`

**Description:** Reviews human PRs using OpenCode. Triggered on PR open/sync or by commenting `/oc` or `/review`. Runs a structured review with sub-agents, outputs findings to `.opencode/review-output.jsonl`, and posts inline review comments via the GitHub Reviews API. Skips autofix PRs.

**Full Content:**

```yaml
name: opencode-pr-review

on:
  pull_request:
    types: [opened, synchronize]
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  issues: write

concurrency:
  group: opencode-review-${{ github.event.pull_request.number || github.event.issue.number }}
  cancel-in-progress: true

jobs:
  review:
    # Only review human PRs (not autofix PRs — those use autofix-review-loop.yml)
    if: |
      github.actor != 'github-actions[bot]' &&
      (
        (github.event_name == 'pull_request' && !contains(github.event.pull_request.labels.*.name, 'autofix') && !contains(github.event.pull_request.labels.*.name, 'autofix:approved') && !contains(github.event.pull_request.labels.*.name, 'autofix:merged')) ||
        (github.event_name == 'issue_comment' && (contains(github.event.comment.body || '', '/oc') || contains(github.event.comment.body || '', '/review')))
      )
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - name: Get PR details
        id: pr
        run: |
          PR_NUMBER="${{ github.event.pull_request.number || github.event.issue.number }}"

          # Verify this is actually a PR (for issue_comment events)
          if [ "${{ github.event_name }}" = "issue_comment" ]; then
            IS_PR=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.number' 2>/dev/null || echo "")
            if [ -z "$IS_PR" ]; then
              echo "Not a PR — skipping"
              echo "skip=true" >> $GITHUB_OUTPUT
              exit 0
            fi
            # Also skip if this is an autofix PR
            HAS_AUTOFIX=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '[.labels[].name] | any(. == "autofix" or . == "autofix:approved" or . == "autofix:merged")' 2>/dev/null || echo "false")
            if [ "$HAS_AUTOFIX" = "true" ]; then
              echo "Autofix PR — handled by autofix-review-loop.yml, skipping"
              echo "skip=true" >> $GITHUB_OUTPUT
              exit 0
            fi
          fi

          HEAD_REF=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.head.ref')
          HEAD_SHA=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.head.sha')
          echo "head_ref=$HEAD_REF" >> $GITHUB_OUTPUT
          echo "head_sha=$HEAD_SHA" >> $GITHUB_OUTPUT
          echo "number=$PR_NUMBER" >> $GITHUB_OUTPUT
          echo "skip=false" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - uses: actions/checkout@v7
        if: steps.pr.outputs.skip != 'true'
        with:
          fetch-depth: 0
          ref: ${{ steps.pr.outputs.head_ref }}

      - name: Configure git auth for OpenCode
        if: steps.pr.outputs.skip != 'true'
        run: |
          git config --global user.name 'nilesh32236'
          git config --global user.email 'nilesh32236@gmail.com'
          git config --global url."https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/".insteadOf "https://github.com/"

      - name: Setup OpenCode
        if: steps.pr.outputs.skip != 'true'
        run: |
          chmod +x .github/scripts/setup-opencode.sh
          .github/scripts/setup-opencode.sh

      - name: Gather context
        if: steps.pr.outputs.skip != 'true'
        run: |
          PR_NUMBER="${{ steps.pr.outputs.number }}"

          # Extract linked issue if any
          PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body' --repo "${{ github.repository }}" 2>/dev/null || echo "")
          ISSUE_NUM=$(echo "$PR_BODY" | grep -oP '(?:Fixes|Closes|Resolves)\s+#\K[0-9]+' | head -1 || echo "")

          chmod +x .github/scripts/gather-context.sh
          ARGS="${{ github.repository }} /tmp/pr-context.md --pr $PR_NUMBER"
          [ -n "$ISSUE_NUM" ] && ARGS="$ARGS --issue $ISSUE_NUM"
          .github/scripts/gather-context.sh $ARGS
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Write review prompt
        if: steps.pr.outputs.skip != 'true'
        run: |
          PR_CONTEXT=$(cat /tmp/pr-context.md 2>/dev/null || echo "No context available")

          cat << PROMPT_EOF > /tmp/opencode-review-prompt.txt
          You are a Senior Code Reviewer with deep expertise in software architecture, design patterns, and best practices. Review this pull request thoroughly.

          ## PR & Issue Context

          ${PR_CONTEXT}

          ---

          ## Project Context
          This is a monorepo with two independent projects:
          - **\`frontend/\`** — Next.js 16 App Router (React 19, Tailwind v4, axios, TanStack Query, zod, Serwist PWA)
          - **\`backend/\`** — Express REST API (Node.js, Prisma, Zod, BullMQ, vitest, TypeScript)

          ## Context Window Management

          This repository may be too large to review in one pass. To prevent context overflow:

          1. Read the PR diff via \`github_pull_request_read\` with method \`get_diff\` to get the full list of changed files.
          2. Determine which project(s) the PR touches based on file paths (files starting with \`frontend/\` or \`backend/\`).
          3. Group files into batches of at most 3 files per batch.
          4. For each batch, dispatch a sub-agent via the \`task\` tool with \`subagent_type: "general"\`. Give the sub-agent these exact instructions:
          - Read the assigned files from the local filesystem
          - Review for ALL items listed under "What to Check" below
          - If the file is under \`frontend/\`, read \`frontend/AGENTS.md\` for conventions; if under \`backend/\`, refer to \`backend/README.md\`
          - Return findings as a JSON array of objects with keys: severity, file, line, message, suggestion
          5. Collect all sub-agent results, deduplicate, and hold them in memory.
          6. Once ALL batches are complete, write findings to \`.opencode/review-output.jsonl\` in JSON Lines format (one JSON object per line).
          7. IMPORTANT: Only set \`"inline": true\` on an issue if the referenced line is in the PR diff. Lines NOT in the diff must never be inline comments — set \`"inline": false\` or omit it.

          ## What to Check

          **Plan alignment:**
          - Does the implementation match what the PR description states?
          - Are deviations justified improvements, or problematic departures?
          - Is all intended functionality present?

          **Bugs & correctness:**
          - Logic errors, missing null checks, race conditions
          - Improper error handling (swallowed errors, bare throws)
          - Type safety issues (loose \`any\`, missing generics)
          - Edge cases not handled (empty states, boundaries, timeouts)
          - Backend: API input validation (Zod schema gaps), database query issues (N+1, missing transactions)
          - Frontend: Missing loading/error states, stale query cache

          **Security (CRITICAL):**
          - PII exposure in logs, URLs, or client-side code
          - Missing authentication or authorization checks (route guard bypass)
          - Role-based access control (RBAC) gaps — volunteer vs coordinator vs admin
          - XSS vectors in user-facing content (blog, profiles, descriptions)
          - Secrets, tokens, or API keys hardcoded in source
          - Insecure data transmission (missing TLS, mixed content)
          - JWT token handling (stored securely? proper expiry?)
          - Backend: SQL injection via raw queries, missing rate limiting, insecure file uploads
          - Backend: Prisma raw queries without parameterization

          **Frontend-specific (Affordance & UX):**
          - \`cursor-pointer\` on non-interactive elements (users expect a click action)
          - Missing \`aria-label\`, \`role\`, or keyboard handlers on interactive elements
          - Form elements without associated \`<label>\` or \`aria-labelledby\`
          - Mobile touch targets too small (< 44px)

          **Backend-specific (API & Data):**
          - Proper HTTP status codes and error response structure
          - Missing input validation via Zod schemas
          - Inefficient database queries (missing indexes, N+1 patterns)
          - Missing pagination on list endpoints
          - Proper middleware chain (validation → auth → RBAC → handler)

          **Dead code & YAGNI:**
          - Unused state variables, imports, parameters, or functions
          - Console.log / debug code left in
          - Features implemented but never called (YAGNI violations)
          - Commented-out code blocks

          **HTML & DOM correctness:**
          - Duplicate \`id\` attributes (form elements, ARIA refs)
          - \`htmlFor\` mismatches with actual \`id\` values
          - Improper nesting (e.g., \`<button>\` inside \`<a>\`, \`<div>\` inside \`<p>\`)

          **Styling & maintainability:**
          - Inline \`style={{}}\` for layout properties that Tailwind can express
          - Mixed styling approaches in the same component
          - Magic numbers where named constants would be clearer
          - Hardcoded strings that should be props or data-driven
          - Use of raw hex colors instead of theme tokens (\`bg-brand-primary\`, \`text-brand-text\`)

          **Architecture:**
          - Clean separation of concerns?
          - Sound design decisions for this codebase's scale?
          - Integrates cleanly with surrounding code?
          - Reasonable performance (large lists, unnecessary re-renders, bundle impact, API endpoint efficiency)
          - Frontend: Route group placement makes sense?
          - Backend: Module structure (controller → service → routes) follows existing patterns?

          **Project conventions:**
          - Frontend: \`frontend/AGENTS.md\` — spaces (2) indent, single quotes, semicolons, trailing commas (es5)
          - Frontend: Use \`@/\` path alias (maps to repo root, so files under \`frontend/\` use \`@/frontend/...\` or relative imports)
          - Frontend: CSS variables theme tokens, not raw hex; CSS animations not framer-motion; Lucide icons, no emoji icons
          - Frontend: \`cn()\` from \`@/lib/utils\` for class merging
          - Backend: Use \`@/*\` path alias → \`src/*\` (configured in \`backend/tsconfig.json\` and \`backend/vitest.config.ts\`)
          - Backend: Tests use vitest with mocked Prisma/Redis/BullMQ

          **Test gaps (if tests exist in the PR):**
          - Do tests verify real behavior or just mocks?
          - Are edge cases covered?
          - Are integration tests present where they matter?
          - Backend: Are Prisma/Redis mocks consistent with real usage?

          ## Calibration

          Be specific — reference file paths and line numbers for every issue. Explain WHY each issue matters, not just what's wrong. Categorize by actual severity — not everything is Critical. Acknowledge what was done well before listing issues. Accurate praise helps the author trust the rest of the feedback.

          If you find significant deviations from the PR intent, flag them specifically so the author can confirm whether the deviation was intentional. If you find issues with the PR scope itself rather than the implementation, say so.

          ## Severity Guide

          - **critical**: Bug, security hole, broken functionality, HTML spec violation, PII exposure — must fix before merge
          - **important**: Architecture concern, maintainability debt, significant duplication, missing error handling, accessibility gaps — should fix
          - **minor**: Style, naming, optimization, documentation, small refactors — nice to have

          ## Output Format: JSON Lines

          Write findings to \`.opencode/review-output.jsonl\`. Each line MUST be a complete, independent JSON object. One broken line cannot corrupt the rest.

          \`\`\`
          {"type":"summary","text":"Brief overall assessment of the PR. 2-3 sentences covering what was implemented, overall quality, and key concerns."}
          {"type":"verdict","ready":false,"reasoning":"1-2 sentence technical assessment explaining the verdict."}
          {"type":"strength","file":"src/example.ts","line":10,"message":"What's well done and why it's good."}
          {"type":"issue","severity":"critical","file":"src/example.ts","line":42,"message":"What's wrong and why it matters.","suggestion":"How to fix it.","inline":true}
          \`\`\`

          **Rules for the JSONL file:**
          - Write exactly ONE \`summary\` line and exactly ONE \`verdict\` line
          - Write zero or more \`strength\` and \`issue\` lines
          - \`severity\` must be exactly "critical", "important", or "minor"
          - Every issue MUST include file and line
          - Suggestion is optional but recommended
          - \`"inline": true\` ONLY if the line is in the PR diff. Omit or set \`false\` for lines outside the diff
          - If you find zero issues, write a verdict with \`"ready": true\`
          - Do NOT wrap in an array, do NOT put commas between lines, do NOT add trailing commas

          ## Critical Rules

          **DO:**
          - Reference specific file:line for every issue
          - Explain WHY each issue matters
          - Categorize by actual severity
          - Acknowledge strengths before issues
          - Give a clear verdict
          - Use sub-agents to batch reviews and protect context

          **DON'T:**
          - Say "looks good" without checking
          - Mark nitpicks as Critical
          - Give feedback on code you didn't actually read
          - Be vague ("improve error handling")
          - Avoid giving a clear verdict
          - Skip sub-agent batching — context overflow WILL happen on large PRs
          - Try to review every file in a single pass
          - Run git push, git commit, or create any pull requests
          PROMPT_EOF

      - name: Run OpenCode review
        if: steps.pr.outputs.skip != 'true'
        continue-on-error: true
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
        run: |
          opencode run --model opencode/deepseek-v4-flash-free "$(cat /tmp/opencode-review-prompt.txt)"

      - name: Close auto-created OpenCode PR
        if: steps.pr.outputs.skip != 'true'
        run: |
          gh pr list --state open --json headRefName,number \
            --jq '.[] | select(.headRefName | startswith("opencode/")) | .number' \
            | while read -r num; do
              gh pr close "$num" --delete-branch 2>/dev/null || true
            done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Parse review and post via GitHub Reviews API
        if: steps.pr.outputs.skip != 'true'
        run: |
          # Best-effort — never block CI
          fail() { echo "::warning::review: $*"; exit 0; }

          FILE=".opencode/review-output.jsonl"
          [ -f "$FILE" ] || fail "No review findings at $FILE — skipping"

          # Validate JSON Lines
          jq -c . "$FILE" 2>/dev/null > /tmp/clean.jsonl
          TOTAL=$(wc -l < "$FILE")
          VALID=$(wc -l < /tmp/clean.jsonl)
          FAILED=$(( TOTAL - VALID ))

          echo "::group::Review stats"
          echo "Lines written: $TOTAL | Valid: $VALID | Failed: $FAILED"
          [ "$FAILED" -gt 0 ] && echo "::warning::$FAILED line(s) had invalid JSON — skipped"
          echo "::endgroup::"

          SUMMARY=$(jq -r 'select(.type=="summary")|.text' /tmp/clean.jsonl | head -1)
          READY=$(jq -r 'select(.type=="verdict")|.ready' /tmp/clean.jsonl | head -1)
          REASONING=$(jq -r 'select(.type=="verdict")|.reasoning' /tmp/clean.jsonl | head -1)

          # Build inline comments — only for issues explicitly in the diff
          jq -c 'select(.type=="issue" and .inline==true and .line>0)|{path:.file|ltrimstr("/"), line:.line, side:"RIGHT", body:("**"+(.severity|ascii_upcase)+"**: "+.message+(if .suggestion then "\n\n> "+.suggestion else "" end))}' /tmp/clean.jsonl \
            | jq -s '{comments:.}' > /tmp/comments.json

          # Build review body markdown
          {
            echo "## PR Review Summary"
            echo ""
            echo "${SUMMARY:-No summary provided.}"
            echo ""
            echo "**Ready to merge?** ${READY:-false}"
            echo ""
            echo "**Reasoning:** ${REASONING:-No reasoning provided.}"
            echo ""

            s=$(jq -r 'select(.type=="strength")|"- **\(.file):\(.line)** — \(.message)"' /tmp/clean.jsonl)
            [ -n "$s" ] && echo "" && echo "### Strengths" && echo "$s"

            t=$(jq -r 'select(.type=="issue")|"- **\(.severity|ascii_upcase):** \(.file):\(.line) — \(.message)"' /tmp/clean.jsonl)
            [ -n "$t" ] && echo "" && echo "### Issues" && echo "$t"
          } > /tmp/body.md

          # Determine PR number and commit SHA
          PR_NUMBER="${{ steps.pr.outputs.number }}"
          COMMIT_SHA="${{ steps.pr.outputs.head_sha }}"

          [ -z "$PR_NUMBER" ] && fail "Could not determine PR number"
          [ -z "$COMMIT_SHA" ] && fail "Could not determine commit SHA"

          # Build the request payload
          REQUEST=$(jq -n \
            --arg cid "$COMMIT_SHA" \
            --rawfile body /tmp/body.md \
            --slurpfile comments /tmp/comments.json \
            '{commit_id:$cid, event:"COMMENT", body:$body, comments:($comments[0].comments//[])}')

          # Post review — try with inline comments first, fall back to body-only
          echo "::group::Posting review to PR #${PR_NUMBER}"
          if echo "$REQUEST" | gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}/reviews" --input - --silent 2>/tmp/review_err.log; then
            echo "Review with inline comments posted successfully."
          else
            if grep -q "422" /tmp/review_err.log 2>/dev/null; then
              echo "::warning::Inline comments rejected (lines not in diff). Retrying body-only."
              echo "$REQUEST" | jq 'del(.comments)' | gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}/reviews" --input - --silent 2>/tmp/review_err2.log || {
                echo "::warning::Body-only review also failed"
                cat /tmp/review_err2.log 2>/dev/null || true
                fail "Could not post review"
              }
            else
              cat /tmp/review_err.log
              fail "Review API call failed (non-422)"
            fi
          fi
          echo "::endgroup::"

          echo "Review posted to PR #${PR_NUMBER}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

```

---

### File: `.github/workflows/autofix-review-loop.yml`

**Description:** Three-job pipeline for autofix PRs: review → fix → auto-merge. Enforces max 3 review-fix iterations. Uses labels (`autofix`, `autofix:approved`, `autofix:needs-fix`, `autofix:merged`) to track state. Squash-merges approved PRs and closes linked issues.

**Full Content:**

```yaml
name: Autofix Review & Fix Loop

on:
  pull_request:
    types: [opened, synchronize, labeled]
    branches: [main]
  issue_comment:
    types: [created]

permissions:
  contents: write
  pull-requests: write
  issues: write

concurrency:
  group: autofix-loop-${{ github.event.pull_request.number || github.event.issue.number }}
  cancel-in-progress: true

jobs:
  # ── Job 1: Review an autofix PR ──
  review:
    if: |
      (
        github.event_name == 'pull_request' &&
        contains(github.event.pull_request.labels.*.name, 'autofix') &&
        !contains(github.event.pull_request.labels.*.name, 'autofix:approved') &&
        !contains(github.event.pull_request.labels.*.name, 'autofix:needs-manual-review') &&
        !contains(github.event.pull_request.labels.*.name, 'autofix:merged')
      ) || (
        github.event_name == 'issue_comment' &&
        github.event.issue.pull_request != null &&
        contains(github.event.comment.body || '', '/review')
      )
    runs-on: ubuntu-latest
    timeout-minutes: 30
    outputs:
      approved: ${{ steps.post-review.outputs.approved }}
      pr_number: ${{ steps.pr-info.outputs.number }}
      head_ref: ${{ steps.pr-info.outputs.head_ref }}
      iteration: ${{ steps.check-iterations.outputs.iteration }}
      exceeded: ${{ steps.check-iterations.outputs.exceeded }}

    steps:
      - name: Get PR details
        id: pr-info
        run: |
          PR_NUMBER="${{ github.event.pull_request.number || github.event.issue.number }}"
          HEAD_REF=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.head.ref')
          HEAD_SHA=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.head.sha')
          echo "number=$PR_NUMBER" >> "$GITHUB_OUTPUT"
          echo "head_ref=$HEAD_REF" >> "$GITHUB_OUTPUT"
          echo "head_sha=$HEAD_SHA" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Check iteration limit
        id: check-iterations
        run: |
          PR_NUMBER="${{ steps.pr-info.outputs.number }}"
          MAX_ITER=3

          COUNT=$(gh api "repos/${{ github.repository }}/issues/${PR_NUMBER}/comments" \
            --jq '[.[] | select(.body | contains("<!-- autofix-review -->"))] | length' \
            2>/dev/null || echo "0")

          echo "iteration=$COUNT" >> "$GITHUB_OUTPUT"

          if [ "$COUNT" -ge "$MAX_ITER" ]; then
            gh pr edit "$PR_NUMBER" \
              --remove-label "autofix,autofix:needs-fix" \
              --add-label "autofix:needs-manual-review" \
              --repo "${{ github.repository }}" 2>/dev/null || true

            # Update the review comment to note max iterations
            chmod +x .github/scripts/post-or-update-comment.sh 2>/dev/null || true
            echo "⚠️ **Max iterations reached** ($MAX_ITER). This PR needs manual review." > /tmp/max-iter.md
            .github/scripts/post-or-update-comment.sh \
              "${{ github.repository }}" "$PR_NUMBER" \
              "<!-- autofix-status -->" /tmp/max-iter.md \
              "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}" 2>/dev/null || \
            gh pr comment "$PR_NUMBER" --body "⚠️ **Max iterations reached** ($MAX_ITER). This PR needs manual review." --repo "${{ github.repository }}"

            echo "exceeded=true" >> "$GITHUB_OUTPUT"
          else
            echo "exceeded=false" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - uses: actions/checkout@v7
        if: steps.check-iterations.outputs.exceeded != 'true'
        with:
          ref: ${{ steps.pr-info.outputs.head_ref }}
          fetch-depth: 0

      - name: Configure git
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          git config --global user.name 'nilesh32236'
          git config --global user.email 'nilesh32236@gmail.com'
          git config --global url."https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/".insteadOf "https://github.com/"

      - name: Extract linked issue number
        if: steps.check-iterations.outputs.exceeded != 'true'
        id: linked-issue
        run: |
          PR_NUMBER="${{ steps.pr-info.outputs.number }}"
          PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body' --repo "${{ github.repository }}" 2>/dev/null || echo "")
          ISSUE_NUM=$(echo "$PR_BODY" | grep -oP '(?:Fixes|Closes|Resolves)\s+#\K[0-9]+' | head -1 || echo "")
          [ -z "$ISSUE_NUM" ] && ISSUE_NUM=$(echo "$PR_BODY" | grep -oP '#\K[0-9]+' | head -1 || echo "")
          echo "issue_number=$ISSUE_NUM" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Gather full context
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          chmod +x .github/scripts/gather-context.sh
          ARGS="${{ github.repository }} /tmp/full-context.md --pr ${{ steps.pr-info.outputs.number }}"
          ISSUE_NUM="${{ steps.linked-issue.outputs.issue_number }}"
          [ -n "$ISSUE_NUM" ] && ARGS="$ARGS --issue $ISSUE_NUM"
          .github/scripts/gather-context.sh $ARGS
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Setup OpenCode
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          chmod +x .github/scripts/setup-opencode.sh
          .github/scripts/setup-opencode.sh

      - name: Write review prompt
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          FULL_CONTEXT=$(cat /tmp/full-context.md 2>/dev/null || echo "No context available")
          ITERATION="${{ steps.check-iterations.outputs.iteration }}"

          cat << PROMPT_EOF > /tmp/opencode-review-prompt.txt
          You are a Senior Code Reviewer. Review this autofix pull request thoroughly.

          ## Full Context (Issue + PR + All Comments)

          ${FULL_CONTEXT}

          ---

          ## Review Iteration: ${ITERATION}

          This is iteration ${ITERATION} of the review-fix loop (max 3). Previous review feedback is included in the context above. Check if previous issues have been addressed.

          ## Project Context
          - **\`frontend/\`** — Next.js 16 App Router (React 19, Tailwind v4, axios, TanStack Query, Serwist PWA)
          - **\`backend/\`** — Express REST API (Node.js, Prisma, Zod, BullMQ, vitest)

          Before reviewing:
          1. Determine which project(s) the PR touches based on file paths
          2. For frontend files, read \`frontend/AGENTS.md\` for conventions
          3. For backend files, read \`backend/README.md\`

          ## Context Window Management
          If the PR touches more than 10 files, batch them into groups of at most 3 files.
          Dispatch a sub-agent for each batch via the \`task\` tool with \`subagent_type: "general"\`.
          Collect all results before proceeding.

          ## What to Check
          - **Correctness**: Does the fix actually resolve the issue described? Are all edge cases handled?
          - **Regressions**: Could this break other functionality?
          - **Security**: PII exposure, missing auth/RBAC checks, XSS, hardcoded secrets, JWT handling
          - **Conventions**: Project conventions from AGENTS.md/README.md
          - **TypeScript**: No \`any\`, proper types, no type errors
          - **Error handling**: Graceful failure modes
          - **Dead code**: Unused imports, console.log, commented-out code
          - **HTML/DOM**: Duplicate IDs, htmlFor mismatches, improper nesting
          - **UX/Accessibility**: ARIA, keyboard nav, mobile touch targets
          - **Performance**: No unnecessary re-renders, proper optimization

          ## Severity Guide
          - **critical**: Bug, security hole, broken functionality — must fix before merge
          - **important**: Architecture concern, maintainability debt, missing error handling — should fix
          - **minor**: Style, naming, optimization — nice to have

          ## Output

          Write your findings to \`.opencode/review-output.jsonl\` in JSON Lines format:

          \`\`\`
          {"type":"summary","text":"Brief overall assessment of the PR."}
          {"type":"verdict","ready":true/false,"reasoning":"Technical assessment explaining the verdict."}
          {"type":"strength","file":"src/example.ts","line":10,"message":"What's well done."}
          {"type":"issue","severity":"critical","file":"src/example.ts","line":42,"message":"What's wrong.","suggestion":"How to fix."}
          \`\`\`

          Rules:
          - Write exactly ONE summary and ONE verdict
          - Set \`ready: true\` ONLY if there are zero critical or important issues
          - Every issue must include file and line
          - Do NOT modify any source files — this is a read-only review
          - Do NOT run git push, git commit, or create pull requests
          - Do NOT run any git commands
          PROMPT_EOF

      - name: Run OpenCode review
        if: steps.check-iterations.outputs.exceeded != 'true'
        continue-on-error: true
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
        run: |
          opencode run --model opencode/deepseek-v4-flash-free "$(cat /tmp/opencode-review-prompt.txt)"

      - name: Close auto-created OpenCode PR
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          gh pr list --state open --json headRefName,number \
            --jq '.[] | select(.headRefName | startswith("opencode/")) | .number' \
            | while read -r num; do
              gh pr close "$num" --delete-branch 2>/dev/null || true
            done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Parse review and post comment
        if: steps.check-iterations.outputs.exceeded != 'true'
        id: post-review
        run: |
          fail() { echo "::warning::review: $*"; echo "approved=false" >> "$GITHUB_OUTPUT"; exit 0; }

          FILE=".opencode/review-output.jsonl"
          [ -f "$FILE" ] || fail "No review findings at $FILE"

          jq -c . "$FILE" 2>/dev/null > /tmp/clean.jsonl
          TOTAL=$(wc -l < "$FILE")
          VALID=$(wc -l < /tmp/clean.jsonl)
          FAILED=$(( TOTAL - VALID ))
          [ "$FAILED" -gt 0 ] && echo "::warning::$FAILED/$TOTAL line(s) had invalid JSON"

          SUMMARY=$(jq -r 'select(.type=="summary")|.text' /tmp/clean.jsonl | head -1)
          READY=$(jq -r 'select(.type=="verdict")|.ready' /tmp/clean.jsonl | head -1)
          REASONING=$(jq -r 'select(.type=="verdict")|.reasoning' /tmp/clean.jsonl | head -1)

          PR_NUMBER="${{ steps.pr-info.outputs.number }}"
          ITERATION="${{ steps.check-iterations.outputs.iteration }}"

          CRIT_COUNT=$(jq -c 'select(.type=="issue" and .severity=="critical")' /tmp/clean.jsonl | wc -l)
          IMP_COUNT=$(jq -c 'select(.type=="issue" and .severity=="important")' /tmp/clean.jsonl | wc -l)
          MIN_COUNT=$(jq -c 'select(.type=="issue" and .severity=="minor")' /tmp/clean.jsonl | wc -l)

          # Build single review comment (updated in-place across iterations)
          {
            echo "<!-- autofix-review -->"
            echo ""
            echo "## 🔍 Autofix Review (Iteration $((ITERATION + 1))/3)"
            echo ""
            echo "${SUMMARY:-No summary provided.}"
            echo ""
            if [ "$READY" = "true" ] && [ "$CRIT_COUNT" -eq 0 ] && [ "$IMP_COUNT" -eq 0 ]; then
              echo "✅ **Ready to merge** — ${REASONING:-No issues found.}"
            else
              echo "❌ **Needs fixes** — ${CRIT_COUNT} critical, ${IMP_COUNT} important, ${MIN_COUNT} minor"
              echo ""
              echo "**Reasoning:** ${REASONING:-Not provided.}"
            fi

            STRENGTHS=$(jq -r 'select(.type=="strength")|"- ✅ **\(.file):\(.line)** — \(.message)"' /tmp/clean.jsonl)
            [ -n "$STRENGTHS" ] && echo "" && echo "### Strengths" && echo "$STRENGTHS"

            ISSUES=$(jq -r 'select(.type=="issue")|"- **\(.severity | ascii_upcase):** \(.file):\(.line) — \(.message)\(if .suggestion then "\n  > 💡 " + .suggestion else "" end)"' /tmp/clean.jsonl)
            [ -n "$ISSUES" ] && echo "" && echo "### Issues" && echo "$ISSUES"
          } > /tmp/review-body.md

          # Use post-or-update to keep a SINGLE review comment
          chmod +x .github/scripts/post-or-update-comment.sh
          .github/scripts/post-or-update-comment.sh \
            "${{ github.repository }}" "$PR_NUMBER" \
            "<!-- autofix-review -->" /tmp/review-body.md \
            "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}"

          if [ "$READY" = "true" ] && [ "$CRIT_COUNT" -eq 0 ] && [ "$IMP_COUNT" -eq 0 ]; then
            echo "approved=true" >> "$GITHUB_OUTPUT"
          else
            echo "approved=false" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Apply approval label
        if: steps.check-iterations.outputs.exceeded != 'true' && steps.post-review.outputs.approved == 'true'
        run: |
          gh pr edit "${{ steps.pr-info.outputs.number }}" \
            --remove-label "autofix,autofix:needs-fix" \
            --add-label "autofix:approved" \
            --repo "${{ github.repository }}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Apply needs-fix label
        if: steps.check-iterations.outputs.exceeded != 'true' && steps.post-review.outputs.approved == 'false'
        run: |
          gh pr edit "${{ steps.pr-info.outputs.number }}" \
            --add-label "autofix:needs-fix" \
            --repo "${{ github.repository }}" 2>/dev/null || true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

  # ── Job 2: Fix issues found by review ──
  fix:
    needs: [review]
    if: |
      always() && (
        (needs.review.result == 'success' && needs.review.outputs.approved == 'false' && needs.review.outputs.exceeded != 'true') ||
        (github.event_name == 'issue_comment' && github.event.issue.pull_request != null && contains(github.event.comment.body || '', '/fix'))
      )
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Get PR details
        id: pr-info
        run: |
          # Use review outputs if available, otherwise fall back to event context
          PR_NUMBER="${{ needs.review.outputs.pr_number }}"
          [ -z "$PR_NUMBER" ] && PR_NUMBER="${{ github.event.issue.number }}"

          HEAD_REF=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.head.ref')
          HEAD_SHA=$(gh api "repos/${{ github.repository }}/pulls/${PR_NUMBER}" --jq '.head.sha')
          echo "number=$PR_NUMBER" >> "$GITHUB_OUTPUT"
          echo "head_ref=$HEAD_REF" >> "$GITHUB_OUTPUT"
          echo "head_sha=$HEAD_SHA" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Check iteration limit
        id: check-iterations
        run: |
          PR_NUMBER="${{ steps.pr-info.outputs.number }}"
          MAX_ITER=3

          COUNT=$(gh api "repos/${{ github.repository }}/issues/${PR_NUMBER}/comments" \
            --jq '[.[] | select(.body | contains("<!-- autofix-review -->"))] | length' \
            2>/dev/null || echo "0")

          echo "iteration=$COUNT" >> "$GITHUB_OUTPUT"

          if [ "$COUNT" -ge "$MAX_ITER" ]; then
            echo "::warning::Fix iteration limit reached ($MAX_ITER). Stopping."
            echo "exceeded=true" >> "$GITHUB_OUTPUT"
          else
            echo "exceeded=false" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - uses: actions/checkout@v7
        if: steps.check-iterations.outputs.exceeded != 'true'
        with:
          ref: ${{ steps.pr-info.outputs.head_ref }}
          fetch-depth: 0

      - name: Configure git
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          git config --global user.name 'nilesh32236'
          git config --global user.email 'nilesh32236@gmail.com'
          git config --global url."https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/".insteadOf "https://github.com/"

      - name: Extract linked issue number
        if: steps.check-iterations.outputs.exceeded != 'true'
        id: linked-issue
        run: |
          PR_NUMBER="${{ steps.pr-info.outputs.number }}"
          PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body' --repo "${{ github.repository }}" 2>/dev/null || echo "")
          ISSUE_NUM=$(echo "$PR_BODY" | grep -oP '(?:Fixes|Closes|Resolves)\s+#\K[0-9]+' | head -1 || echo "")
          [ -z "$ISSUE_NUM" ] && ISSUE_NUM=$(echo "$PR_BODY" | grep -oP '#\K[0-9]+' | head -1 || echo "")
          echo "issue_number=$ISSUE_NUM" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Gather full context
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          chmod +x .github/scripts/gather-context.sh
          ARGS="${{ github.repository }} /tmp/full-context.md --pr ${{ steps.pr-info.outputs.number }}"
          ISSUE_NUM="${{ steps.linked-issue.outputs.issue_number }}"
          [ -n "$ISSUE_NUM" ] && ARGS="$ARGS --issue $ISSUE_NUM"
          .github/scripts/gather-context.sh $ARGS
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Setup OpenCode
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          chmod +x .github/scripts/setup-opencode.sh
          .github/scripts/setup-opencode.sh

      - name: Write fix prompt
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          FULL_CONTEXT=$(cat /tmp/full-context.md 2>/dev/null || echo "No context available")
          ITERATION="${{ steps.check-iterations.outputs.iteration }}"

          cat << PROMPT_EOF > /tmp/opencode-fix-prompt.txt
          You are a Senior Code Fixer. Fix the issues found during code review.

          ## Full Context (Issue + PR + Review Comments + All Feedback)

          ${FULL_CONTEXT}

          ---

          ## Fix Iteration: ${ITERATION}

          Read ALL the review comments above carefully. Focus on:
          1. Issues marked as CRITICAL — these must be fixed
          2. Issues marked as IMPORTANT — these should be fixed
          3. Issues marked as MINOR — fix these if straightforward

          Also read any comments from other users or automated workflows — they may contain additional feedback or corrections.

          ## Project Context
          - **\`frontend/\`** — Next.js 16 App Router (React 19, Tailwind v4, axios, TanStack Query)
          - **\`backend/\`** — Express REST API (Node.js, Prisma, Zod, BullMQ, vitest)

          Before making changes:
          1. Determine which project(s) are affected by file paths
          2. For frontend files, read \`frontend/AGENTS.md\` for conventions
          3. For backend files, read \`backend/README.md\`

          ## Steps
          1. Read and understand each issue from the review feedback above
          2. For each issue, open the referenced file at the reported line
          3. Apply a minimal, correct fix
          4. After fixing, run from the correct subdirectory:
             - Frontend: \`cd frontend && pnpm typecheck && pnpm lint\`
             - Backend: \`cd backend && pnpm typecheck && pnpm lint\`
             - Both: run both
          5. Fix any type or lint errors introduced by your changes

          ## CRITICAL RULES
          - Do NOT run \`git push\`, \`git commit\`, or create any pull requests
          - Do NOT run any git commands at all — the workflow handles git operations
          - Fix ONLY the issues from the review feedback — nothing more
          - Prefer minimal, targeted fixes over rewrites
          - Do not add features or change unrelated code
          - If a fix requires significant refactoring outside scope, skip it
          - Verify every change compiles before finishing
          PROMPT_EOF

      - name: Run OpenCode fix
        if: steps.check-iterations.outputs.exceeded != 'true'
        continue-on-error: true
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
        run: |
          opencode run --model opencode/deepseek-v4-flash-free "$(cat /tmp/opencode-fix-prompt.txt)"

      - name: Close auto-created OpenCode PR
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          gh pr list --state open --json headRefName,number \
            --jq '.[] | select(.headRefName | startswith("opencode/")) | .number' \
            | while read -r num; do
              gh pr close "$num" --delete-branch 2>/dev/null || true
            done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Commit and push fixes
        if: steps.check-iterations.outputs.exceeded != 'true'
        id: push-fixes
        run: |
          BRANCH="${{ steps.pr-info.outputs.head_ref }}"
          ITERATION="${{ steps.check-iterations.outputs.iteration }}"

          if [ -n "$(git status --porcelain)" ]; then
            git add -A
            git commit -m "fix: address review feedback (iteration $((ITERATION + 1)))"
            git remote set-url origin "https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}"
            git push origin "$BRANCH"
            echo "pushed=true" >> "$GITHUB_OUTPUT"
          else
            echo "pushed=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Update status comment
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          PR_NUMBER="${{ steps.pr-info.outputs.number }}"
          ITERATION="${{ steps.check-iterations.outputs.iteration }}"
          PUSHED="${{ steps.push-fixes.outputs.pushed }}"

          if [ "$PUSHED" = "true" ]; then
            echo "🔧 Fix applied (iteration $((ITERATION + 1))). Waiting for review..." > /tmp/status.md
          else
            echo "ℹ️ Fix agent ran but made no changes (iteration $((ITERATION + 1))). Manual review may be needed." > /tmp/status.md
          fi

          chmod +x .github/scripts/post-or-update-comment.sh
          .github/scripts/post-or-update-comment.sh \
            "${{ github.repository }}" "$PR_NUMBER" \
            "<!-- autofix-status -->" /tmp/status.md \
            "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Remove needs-fix label
        if: steps.check-iterations.outputs.exceeded != 'true'
        run: |
          gh pr edit "${{ steps.pr-info.outputs.number }}" \
            --remove-label "autofix:needs-fix" \
            --repo "${{ github.repository }}" 2>/dev/null || true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

  # ── Job 3: Auto-merge approved PRs ──
  auto-merge:
    needs: [review]
    if: needs.review.result == 'success' && needs.review.outputs.approved == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Merge PR
        id: merge
        run: |
          PR_NUMBER="${{ needs.review.outputs.pr_number }}"
          REPO="${{ github.repository }}"

          # Enable auto-merge — GitHub will merge once all required checks pass
          gh pr merge "$PR_NUMBER" \
            --squash \
            --auto \
            --delete-branch \
            --repo "$REPO" && {
              echo "merged=true" >> "$GITHUB_OUTPUT"
            } || {
              echo "::warning::Auto-merge failed — PR may need manual merge"
              echo "merged=false" >> "$GITHUB_OUTPUT"
            }
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Update status
        run: |
          PR_NUMBER="${{ needs.review.outputs.pr_number }}"
          MERGED="${{ steps.merge.outputs.merged }}"

          if [ "$MERGED" = "true" ]; then
            echo "✅ Review approved. Auto-merge enabled — will merge when CI passes." > /tmp/status.md
          else
            echo "⚠️ Review approved but auto-merge failed. Please merge manually." > /tmp/status.md
          fi

          chmod +x .github/scripts/post-or-update-comment.sh 2>/dev/null || true
          .github/scripts/post-or-update-comment.sh \
            "${{ github.repository }}" "$PR_NUMBER" \
            "<!-- autofix-status -->" /tmp/status.md \
            "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}" 2>/dev/null || \
          gh pr comment "$PR_NUMBER" --body-file /tmp/status.md --repo "${{ github.repository }}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Close linked issue
        if: steps.merge.outputs.merged == 'true'
        run: |
          PR_NUMBER="${{ needs.review.outputs.pr_number }}"
          REPO="${{ github.repository }}"

          PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body' --repo "$REPO" 2>/dev/null || echo "")
          ISSUE_NUM=$(echo "$PR_BODY" | grep -oP '(?:Fixes|Closes|Resolves)\s+#\K[0-9]+' | head -1 || echo "")

          if [ -n "$ISSUE_NUM" ]; then
            gh issue close "$ISSUE_NUM" \
              --comment "✅ Fixed by PR #${PR_NUMBER}" \
              --repo "$REPO" 2>/dev/null || true
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Update labels
        run: |
          gh pr edit "${{ needs.review.outputs.pr_number }}" \
            --add-label "autofix:merged" \
            --remove-label "autofix:approved,autofix" \
            --repo "${{ github.repository }}" 2>/dev/null || true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

```

---

### File: `.github/workflows/codebase-audit.yml`

**Description:** Scheduled audit every 6 hours using OpenCode. Selects a random prompt from `.audit-prompts/` and a random target directory (weighted toward frontend). Runs OpenCode audit, outputs to `.audit-output.jsonl`, and creates a GitHub issue with `autofix-trigger` label if critical/important issues are found.

**Full Content:**

```yaml
name: Codebase Audit

on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch:
    inputs:
      prompt_name:
        description: "Specific prompt to run (omit for random)"
        required: false
        type: string
      target_dir:
        description: "Specific directory to audit (omit for random)"
        required: false
        type: string
      auto_fix:
        description: "Auto-trigger fix workflow after creating issue"
        required: false
        type: boolean
        default: true

permissions:
  contents: read
  issues: write
  pull-requests: write

concurrency:
  group: ${{ github.workflow }}-${{ github.sha }}
  cancel-in-progress: true

jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Record start time
        id: start-time
        run: echo "time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$GITHUB_OUTPUT"

      - uses: actions/checkout@v7
        with:
          fetch-depth: 1

      - name: Configure git for OpenCode
        run: |
          git config --global user.name "nilesh32236"
          git config --global user.email "nilesh32236@gmail.com"
          git config --global url."https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/".insteadOf "https://github.com/"

      - name: Ensure audit labels exist
        run: |
          for label in audit audit:critical audit:important audit:minor autofix autofix-trigger autofix:approved autofix:needs-fix autofix:needs-manual-review autofix:merged; do
            gh label create "$label" --force 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Select audit prompt
        id: select-prompt
        run: |
          fail() { echo "::warning::audit: $*"; echo "skip=true" >> "$GITHUB_OUTPUT"; exit 0; }

          shopt -s nullglob
          PROMPTS=(.audit-prompts/*.md)
          [ ${#PROMPTS[@]} -eq 0 ] && fail "No prompt files found in .audit-prompts/"

          if [ -n "${{ github.event.inputs.prompt_name }}" ]; then
            SPECIFIC=".audit-prompts/${{ github.event.inputs.prompt_name }}.md"
            if [ ! -f "$SPECIFIC" ]; then
              fail "Requested prompt '${{ github.event.inputs.prompt_name }}' not found in .audit-prompts/"
            fi
            CATEGORY="${{ github.event.inputs.prompt_name }}"
            echo "prompt_file=$SPECIFIC" >> "$GITHUB_OUTPUT"
            echo "category=$CATEGORY" >> "$GITHUB_OUTPUT"
            echo "skip=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          AVAILABLE=()
          for f in "${PROMPTS[@]}"; do
            NAME=$(basename "$f" .md)
            COUNT=$(gh issue list --label "audit:$NAME" --state open --json number --jq 'length' 2>/dev/null || echo "0")
            if [ "$COUNT" -eq 0 ] 2>/dev/null; then
              AVAILABLE+=("$f")
            else
              echo "Skipping '$NAME' — $COUNT open issue(s) already exist"
            fi
          done

          [ ${#AVAILABLE[@]} -eq 0 ] && fail "All audit categories have open issues — nothing to do"

          RAND=$(( RANDOM % ${#AVAILABLE[@]} ))
          SELECTED="${AVAILABLE[$RAND]}"
          CATEGORY=$(basename "$SELECTED" .md)
          echo "Selected prompt: $SELECTED (category: $CATEGORY)"
          echo "prompt_file=$SELECTED" >> "$GITHUB_OUTPUT"
          echo "category=$CATEGORY" >> "$GITHUB_OUTPUT"
          echo "skip=false" >> "$GITHUB_OUTPUT"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Select target directory
        id: select-dir
        if: steps.select-prompt.outputs.skip != 'true'
        run: |
          if [ -n "${{ github.event.inputs.target_dir }}" ]; then
            echo "dir=${{ github.event.inputs.target_dir }}" >> "$GITHUB_OUTPUT"
            exit 0
          fi
          SELECTION=$(( RANDOM % 5 ))
          if [ "$SELECTION" -lt 4 ]; then
            DIRS=("frontend/app" "frontend/components" "frontend/lib" "frontend/hooks")
            echo "dir=${DIRS[$SELECTION]}" >> "$GITHUB_OUTPUT"
          else
            echo "dir=backend/src" >> "$GITHUB_OUTPUT"
          fi

      - name: Setup OpenCode
        if: steps.select-prompt.outputs.skip != 'true'
        run: |
          chmod +x .github/scripts/setup-opencode.sh
          .github/scripts/setup-opencode.sh

      - name: Run OpenCode audit
        if: steps.select-prompt.outputs.skip != 'true'
        continue-on-error: true
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
        run: |
          PROMPT_FILE="${{ steps.select-prompt.outputs.prompt_file }}"
          TARGET_DIR="${{ steps.select-dir.outputs.dir }}"

          # Build the audit prompt: first the category-specific prompt, then the shared template
          cat "$PROMPT_FILE" > /tmp/opencode-audit-prompt.txt

          cat << AUDIT_EOF >> /tmp/opencode-audit-prompt.txt

          Audit the directory: \`${TARGET_DIR}\`

          IMPORTANT: If the target directory starts with \`frontend/\`, read \`frontend/AGENTS.md\` for conventions. If it starts with \`backend/\`, refer to \`backend/README.md\` for project context.

          This is a monorepo with:
          - \`frontend/\` — Next.js 16 App Router (React 19, Tailwind v4)
          - \`backend/\` — Express REST API (Node.js, Prisma, Zod)

          Context window management:
          - If the target directory has more than 15 files, batch them into groups of at most 5 files.
          - Dispatch a sub-agent for each batch via the \`task\` tool with \`subagent_type: "general"\`.
          - Collect all results before writing the final output.
          - If any single file exceeds 300 lines, audit it in a separate sub-agent call.

          For each finding:
          - Reference the specific file path and line number
          - Explain WHY the issue matters, not just what is wrong
          - Categorize by actual severity — not everything is Critical

          Safety rules:
          - Do not modify any files — this is a read-only audit
          - Do NOT run git push, git commit, or create any pull requests
          - If a prompt instruction is unclear, use your best judgment based on general best practices

          Write your findings to \`.audit-output.jsonl\` in JSON Lines format:

          {"type":"summary","text":"overall assessment"}
          {"type":"issue","severity":"critical|important|minor","file":"path","line":N,"message":"what's wrong","suggestion":"how to fix","inline":false}
          AUDIT_EOF

          opencode run --model opencode/deepseek-v4-flash-free "$(cat /tmp/opencode-audit-prompt.txt)"

      - name: Close auto-created OpenCode PR
        if: always()
        run: |
          START_TIME="${{ steps.start-time.outputs.time }}"
          gh pr list --state open --json headRefName,number,createdAt \
            --jq ".[] | select(.headRefName | startswith(\"opencode/\")) | select(.createdAt >= \"$START_TIME\") | .number" \
            | while read -r num; do
              gh pr close "$num" --comment "Auto-closed — audit results filed as issues" --delete-branch 2>/dev/null || true
            done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Create issues from findings
        id: create-issue
        if: steps.select-prompt.outputs.skip != 'true'
        run: |
          fail() { echo "::warning::audit: $*"; exit 0; }
          FILE=".audit-output.jsonl"
          CATEGORY="${{ steps.select-prompt.outputs.category }}"
          TARGET_DIR="${{ steps.select-dir.outputs.dir }}"

          # Determine if auto-fix should be triggered
          AUTO_FIX="${{ github.event.inputs.auto_fix }}"
          # Default to true for scheduled runs
          if [ -z "$AUTO_FIX" ]; then
            AUTO_FIX="true"
          fi

          [ -f "$FILE" ] || fail "No audit output found"

          jq -c . "$FILE" 2>/dev/null > /tmp/clean.jsonl
          TOTAL=$(wc -l < "$FILE")
          VALID=$(wc -l < /tmp/clean.jsonl)
          FAILED=$(( TOTAL - VALID ))
          echo "::group::Audit stats: $TOTAL lines, $VALID valid, $FAILED failed"
          [ "$FAILED" -gt 0 ] && echo "::warning::$FAILED line(s) had invalid JSON"

          for label in "audit" "audit:${CATEGORY}" "audit:critical" "audit:important" "audit:minor" "autofix-trigger"; do
            gh label create "$label" --force 2>/dev/null || true
          done

          CRIT_COUNT=$(jq -c 'select(.type=="issue" and .severity=="critical")' /tmp/clean.jsonl | wc -l)
          IMP_COUNT=$(jq -c 'select(.type=="issue" and .severity=="important")' /tmp/clean.jsonl | wc -l)
          MIN_COUNT=$(jq -c 'select(.type=="issue" and .severity=="minor")' /tmp/clean.jsonl | wc -l)
          SUMMARY=$(jq -r 'select(.type=="summary") | .text' /tmp/clean.jsonl | head -1)

          echo "Findings: $CRIT_COUNT critical, $IMP_COUNT important, $MIN_COUNT minor"

          # Determine severity label for the consolidated issue
          if [ "$CRIT_COUNT" -gt 0 ]; then
            SEVERITY_LABEL="audit:critical"
          elif [ "$IMP_COUNT" -gt 0 ]; then
            SEVERITY_LABEL="audit:important"
          else
            SEVERITY_LABEL="audit:minor"
          fi

          # Check if an issue already exists for this category
          EXISTING=$(gh issue list \
            --label "audit:${CATEGORY}" \
            --state open \
            --json number \
            --jq 'length' 2>/dev/null || echo "0")

          if [ "$EXISTING" -gt 0 ]; then
            echo "Issue for category '$CATEGORY' already exists — skipping"
            echo "::endgroup::"
            echo "issue_created=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          # Only create issues for critical or important findings
          if [ "$CRIT_COUNT" -eq 0 ] && [ "$IMP_COUNT" -eq 0 ]; then
            echo "No critical or important issues found — skipping issue creation"
            echo "::endgroup::"
            echo "issue_created=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi

          # Build consolidated issue body
          {
            echo "<!-- audit-issue -->"
            echo ""
            echo "## Audit: ${CATEGORY}"
            echo ""
            echo "**Target directory:** \`${TARGET_DIR}\`"
            echo "**Results:** ${CRIT_COUNT} critical, ${IMP_COUNT} important, ${MIN_COUNT} minor"
            [ -n "$SUMMARY" ] && echo "" && echo "**Summary:** ${SUMMARY}"
            echo ""
            echo "### Findings"
            echo ""
            jq -c 'select(.type=="issue")' /tmp/clean.jsonl | while read -r item; do
              SEV=$(echo "$item" | jq -r '.severity')
              FP=$(echo "$item" | jq -r '.file')
              LN=$(echo "$item" | jq -r '.line')
              MSG=$(echo "$item" | jq -r '.message')
              SUG=$(echo "$item" | jq -r '.suggestion // ""')
              echo "- **${SEV}** \`${FP}:${LN}\` — ${MSG}"
              [ -n "$SUG" ] && echo "  - *Fix:* ${SUG}"
            done
            echo ""
            echo "---"
            echo ""
            echo "Comment \`/fix\` on this issue to trigger the automated fix workflow."
          } > /tmp/issue_body.md

          TITLE="[Audit:${CATEGORY}] ${CRIT_COUNT} critical, ${IMP_COUNT} important, ${MIN_COUNT} minor"

          # Build labels — add autofix-trigger for auto-fix on critical/important
          LABELS="audit,audit:${CATEGORY},${SEVERITY_LABEL}"
          if [ "$AUTO_FIX" = "true" ] && { [ "$CRIT_COUNT" -gt 0 ] || [ "$IMP_COUNT" -gt 0 ]; }; then
            LABELS="${LABELS},autofix-trigger"
          fi

          ISSUE_URL=$(gh issue create \
            --title "$TITLE" \
            --label "$LABELS" \
            --body-file "/tmp/issue_body.md" \
            --repo "${{ github.repository }}") || { echo "::warning::Failed to create audit issue"; exit 0; }

          ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oP '/issues/\K[0-9]+' || echo "")
          echo "Created issue #${ISSUE_NUMBER}: ${ISSUE_URL}"
          echo "issue_created=true" >> "$GITHUB_OUTPUT"
          echo "issue_number=${ISSUE_NUMBER}" >> "$GITHUB_OUTPUT"

          echo "::endgroup::"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

```

---

### File: `.github/workflows/fix-audit-issue.yml`

**Description:** Triggered by `autofix-trigger` label or `/fix` comment on an issue. Runs OpenCode to apply fixes, creates/updates a PR branch (`autofix/issue-<N>`), and opens an autofix PR. Handles re-triggers gracefully by updating existing PRs. Falls back with `audit:needs-info` label if unable to determine the fix.

**Full Content:**

```yaml
name: Fix Audit Issue

on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]

permissions:
  contents: write
  issues: write
  pull-requests: write

concurrency:
  group: fix-issue-${{ github.event.issue.number }}
  cancel-in-progress: true

jobs:
  fix:
    # Trigger when:
    # 1. Issue is opened/labeled with "autofix-trigger" (auto from audit)
    # 2. Someone comments "/fix" on an issue (not a PR)
    if: |
      github.event.issue.pull_request == null &&
      (
        (github.event_name == 'issues' && contains(github.event.issue.labels.*.name, 'autofix-trigger') && !contains(github.event.issue.labels.*.name, 'autofix') && !contains(github.event.issue.labels.*.name, 'audit:needs-info')) ||
        (github.event_name == 'issue_comment' && contains(github.event.comment.body || '', '/fix') && !contains(github.event.issue.labels.*.name, 'audit:needs-info'))
      )
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Acknowledge fix request
        if: github.event_name == 'issue_comment'
        run: |
          gh api "repos/${{ github.repository }}/issues/comments/${{ github.event.comment.id }}/reactions" \
            -f content='+1' --silent 2>/dev/null || true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Check for existing autofix PR
        id: check-existing
        run: |
          ISSUE_NUM=${{ github.event.issue.number }}
          EXISTING_PR=$(gh pr list \
            --head "autofix/issue-${ISSUE_NUM}" \
            --state open \
            --json number \
            --jq '.[0].number // empty' \
            --repo "${{ github.repository }}" 2>/dev/null || echo "")

          if [ -n "$EXISTING_PR" ]; then
            echo "Existing autofix PR #${EXISTING_PR} found"
            echo "exists=true" >> "$GITHUB_OUTPUT"
            echo "pr_number=$EXISTING_PR" >> "$GITHUB_OUTPUT"
          else
            echo "No existing autofix PR"
            echo "exists=false" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Skip if PR already exists (auto-trigger only)
        if: steps.check-existing.outputs.exists == 'true' && github.event_name == 'issues'
        run: |
          echo "PR already exists for this issue — skipping auto-trigger"
          echo "Existing PR: #${{ steps.check-existing.outputs.pr_number }}"

      - name: Checkout
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        uses: actions/checkout@v7
        with:
          fetch-depth: 0
          ref: main

      - name: Configure git
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        run: |
          git config --global user.name 'nilesh32236'
          git config --global user.email 'nilesh32236@gmail.com'
          git config --global url."https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/".insteadOf "https://github.com/"

      - name: Setup branch
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        id: branch
        run: |
          ISSUE_NUM=${{ github.event.issue.number }}
          BRANCH="autofix/issue-${ISSUE_NUM}"

          # If PR exists (re-trigger via /fix), check out its branch
          if [ "${{ steps.check-existing.outputs.exists }}" = "true" ]; then
            git fetch origin "$BRANCH" 2>/dev/null || true
            git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
            git pull origin "$BRANCH" --rebase 2>/dev/null || true
          else
            git checkout -b "$BRANCH"
          fi

          echo "name=$BRANCH" >> "$GITHUB_OUTPUT"

      - name: Ensure labels exist
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        run: |
          for label in autofix autofix-trigger autofix:approved autofix:needs-fix autofix:needs-manual-review audit:needs-info; do
            gh label create "$label" --force 2>/dev/null || true
          done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Add autofix label to issue
        if: steps.check-existing.outputs.exists != 'true'
        run: |
          gh issue edit ${{ github.event.issue.number }} \
            --add-label "autofix" \
            --repo "${{ github.repository }}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Gather issue context
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        run: |
          chmod +x .github/scripts/gather-context.sh

          ARGS="${{ github.repository }} /tmp/issue-context.md --issue ${{ github.event.issue.number }}"

          # If PR exists, also gather PR context
          if [ "${{ steps.check-existing.outputs.exists }}" = "true" ]; then
            ARGS="$ARGS --pr ${{ steps.check-existing.outputs.pr_number }}"
          fi

          .github/scripts/gather-context.sh $ARGS
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Setup OpenCode
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        run: |
          chmod +x .github/scripts/setup-opencode.sh
          .github/scripts/setup-opencode.sh

      - name: Write fix prompt
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        run: |
          ISSUE_CONTEXT=$(cat /tmp/issue-context.md 2>/dev/null || echo "No context available")

          cat << PROMPT_EOF > /tmp/opencode-fix-prompt.txt
          You are fixing a GitHub issue. Here is the full context:

          ${ISSUE_CONTEXT}

          ---

          Context: This is a monorepo with two projects:
          - \`frontend/\` — Next.js 16 App Router (React 19, Tailwind v4, axios, TanStack Query)
          - \`backend/\` — Express REST API (Node.js, Prisma, Zod, BullMQ, vitest)

          Before making changes:
          1. Check which project the issue relates to by looking at file paths.
          2. If files are under \`frontend/\`, read \`frontend/AGENTS.md\` for conventions; if under \`backend/\`, refer to \`backend/README.md\`.
          3. Read \`frontend/biome.json\` or \`backend/biome.json\` for linting rules depending on the project.
          4. Read any relevant source files to understand existing patterns.

          INSTRUCTIONS:
          1. Read the issue context above — it tells you the files, lines, and fixes needed.
          2. Open each file and apply the fix.
          3. If the file doesn't exist, create it following project patterns (check sister files for reference).
          4. After making changes, run from the correct subdirectory:
             - Frontend: \`cd frontend && pnpm typecheck && pnpm lint\`
             - Backend: \`cd backend && pnpm typecheck && pnpm lint\`
          5. Fix any type or lint errors.

          CRITICAL RULES:
          - Do NOT run \`git push\`, \`git commit\`, or create any pull requests.
          - Do NOT run any git commands at all. The workflow will handle git operations.
          - Make the exact changes the issue describes — nothing more, nothing less.
          - Follow project conventions.
          - Read 2-3 similar existing files first before creating new ones.
          - Do NOT add features, refactor unrelated code, or change anything outside the issue scope.
          - If you CANNOT determine what to change, write \`.fix-stuck.md\` explaining what's missing.
          - Prefer the minimal change that resolves the issue.
          PROMPT_EOF

      - name: Run OpenCode to fix issue
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        continue-on-error: true
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
        run: |
          opencode run --model opencode/deepseek-v4-flash-free "$(cat /tmp/opencode-fix-prompt.txt)"

      - name: Close auto-created OpenCode PR
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        run: |
          gh pr list --state open --json headRefName,number \
            --jq '.[] | select(.headRefName | startswith("opencode/")) | .number' \
            | while read -r num; do
              gh pr close "$num" --comment "Auto-closed — changes captured by fix-audit-issue workflow" --delete-branch 2>/dev/null || true
            done
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Commit and push changes
        if: steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment'
        id: push
        run: |
          ISSUE_NUM=${{ github.event.issue.number }}
          BRANCH="${{ steps.branch.outputs.name }}"

          # Remove metadata files before committing (keep for PR body)
          [ -f .fix-stuck.md ] && cp .fix-stuck.md /tmp/fix-stuck.md && rm .fix-stuck.md
          [ -f .fix-summary.md ] && cp .fix-summary.md /tmp/fix-summary.md && rm .fix-summary.md

          if [ -n "$(git status --porcelain)" ]; then
            git add -A
            git commit -m "fix: address audit findings from issue #${ISSUE_NUM}"
            git remote set-url origin "https://x-access-token:${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}"
            git push origin "$BRANCH" --force
            echo "has_changes=true" >> "$GITHUB_OUTPUT"
          else
            echo "has_changes=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Create or update PR
        if: (steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment') && steps.push.outputs.has_changes == 'true'
        id: create-pr
        run: |
          ISSUE_NUM=${{ github.event.issue.number }}
          BRANCH="${{ steps.branch.outputs.name }}"
          REPO="${{ github.repository }}"
          EXISTING_PR="${{ steps.check-existing.outputs.pr_number }}"

          ISSUE_TITLE=$(gh issue view "$ISSUE_NUM" --json title --jq '.title' --repo "$REPO")

          # Build PR body
          {
            echo "## Fixes #${ISSUE_NUM}"
            echo ""
            if [ -f /tmp/fix-summary.md ]; then
              cat /tmp/fix-summary.md
              echo ""
            fi
            echo "---"
            echo "*Auto-generated by fix-audit-issue workflow*"
          } > /tmp/pr-body.md

          if [ -n "$EXISTING_PR" ]; then
            # Update existing PR body
            gh pr edit "$EXISTING_PR" --body-file /tmp/pr-body.md --repo "$REPO" 2>/dev/null || true
            PR_NUMBER="$EXISTING_PR"
            PR_URL=$(gh pr view "$EXISTING_PR" --json url --jq '.url' --repo "$REPO")
            echo "Updated existing PR #${PR_NUMBER}"
          else
            # Create new PR
            PR_URL=$(gh pr create \
              --base main \
              --head "$BRANCH" \
              --title "[Autofix] ${ISSUE_TITLE}" \
              --body-file /tmp/pr-body.md \
              --label "autofix" \
              --repo "$REPO")
            PR_NUMBER=$(echo "$PR_URL" | grep -oP '/pull/\K[0-9]+' || echo "")
          fi

          echo "pr_number=${PR_NUMBER}" >> "$GITHUB_OUTPUT"
          echo "pr_url=${PR_URL}" >> "$GITHUB_OUTPUT"

          # Update issue with a single status comment (not a new comment each time)
          echo "🔧 Autofix PR: ${PR_URL}" > /tmp/issue-status.md
          chmod +x .github/scripts/post-or-update-comment.sh
          .github/scripts/post-or-update-comment.sh \
            "$REPO" "$ISSUE_NUM" \
            "<!-- autofix-pr-link -->" /tmp/issue-status.md \
            "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Handle stuck / no changes
        if: (steps.check-existing.outputs.exists != 'true' || github.event_name == 'issue_comment') && steps.push.outputs.has_changes != 'true'
        run: |
          ISSUE_NUM=${{ github.event.issue.number }}

          if [ -f /tmp/fix-stuck.md ]; then
            {
              echo "## ⚠️ Fix agent needs more information"
              echo ""
              cat /tmp/fix-stuck.md
              echo ""
              echo "---"
              echo "Provide the missing information, then comment \`/fix\` to retry."
            } > /tmp/stuck-body.md
            gh issue edit "$ISSUE_NUM" --add-label "audit:needs-info" --remove-label "autofix,autofix-trigger"
            chmod +x .github/scripts/post-or-update-comment.sh
            .github/scripts/post-or-update-comment.sh \
              "${{ github.repository }}" "$ISSUE_NUM" \
              "<!-- autofix-status -->" /tmp/stuck-body.md \
              "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}"
          else
            echo "ℹ️ Fix agent made no changes. Comment \`/fix\` to retry, or provide more details." > /tmp/no-changes.md
            chmod +x .github/scripts/post-or-update-comment.sh
            .github/scripts/post-or-update-comment.sh \
              "${{ github.repository }}" "$ISSUE_NUM" \
              "<!-- autofix-status -->" /tmp/no-changes.md \
              "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}"
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - name: Report failure
        if: failure()
        run: |
          echo "❌ Fix workflow error. Check [logs](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}). Comment \`/fix\` to retry." > /tmp/fail.md
          chmod +x .github/scripts/post-or-update-comment.sh 2>/dev/null || true
          .github/scripts/post-or-update-comment.sh \
            "${{ github.repository }}" "${{ github.event.issue.number }}" \
            "<!-- autofix-status -->" /tmp/fail.md \
            "${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}" 2>/dev/null || \
          gh issue comment ${{ github.event.issue.number }} --body-file /tmp/fail.md --repo "${{ github.repository }}"
        env:
          GH_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

```

---

### File: `.github/workflows/ci.yml`

**Description:** Standard CI pipeline — lint, typecheck, build, and test. Matrix runs across frontend and backend using pnpm with Node 22. Not OpenCode-specific, but included for completeness.

**Full Content:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Check (${{ matrix.project }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        project: [frontend, backend]

    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: ${{ matrix.project }}/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: ${{ matrix.project }}
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        if: matrix.project == 'backend'
        working-directory: backend
        run: pnpm db:generate

      - name: Lint
        working-directory: ${{ matrix.project }}
        run: pnpm lint

      - name: Type check
        working-directory: ${{ matrix.project }}
        run: pnpm typecheck

      - name: Build
        working-directory: ${{ matrix.project }}
        run: pnpm build

      - name: Run tests
        if: matrix.project == 'backend'
        working-directory: backend
        run: pnpm test

```

---

### File: `.github/workflows/sync-backend-hf.yml`

**Description:** Syncs `backend/` directory to Hugging Face Spaces on push to main (when backend files change). Not OpenCode-specific, but included for completeness.

**Full Content:**

```yaml
name: Sync Backend to Hugging Face Hub
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/sync-backend-hf.yml'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - name: Sync backend directory to HF Space
        env:
          HF_TOKEN: ${{ secrets.HF_TOKEN }}
        run: |
          HF_REPO="https://user:$HF_TOKEN@huggingface.co/spaces/nilesh-kanzariya/we-the-yuva-api"
          git clone --depth=1 "$HF_REPO" hf-repo
          rsync -av --delete --exclude='.git' backend/ hf-repo/
          cd hf-repo
          git config user.name "nilesh32236"
          git config user.email "nilesh32236@gmail.com"
          git add -A
          git diff --quiet --cached || (git commit -m "Sync backend from monorepo [$(date -u +'%Y-%m-%dT%H:%M:%SZ')]" && git push)

```

---

## 2. Shell Scripts

---

### File: `.github/scripts/setup-opencode.sh`

**Description:** Installs OpenCode from GitHub releases in CI. Detects runner architecture (`linux-x64` or `linux-arm64`), downloads the binary, extracts to `/usr/local/bin/`, configures git identity, and ensures `.opencode/` directory exists. Called by all workflows before `opencode run`.

**Full Content:**

```bash
#!/usr/bin/env bash
# setup-opencode.sh
# Installs and configures OpenCode for use in GitHub Actions.
# Replaces the anomalyco/opencode/github@latest third-party action.
#
# Usage:
#   source setup-opencode.sh
#   # Then run: opencode run --model <model> --prompt "<prompt>"
#
# Environment:
#   GITHUB_TOKEN — required for GitHub API access
#   OPENCODE_VERSION — optional, defaults to "latest"

set -euo pipefail

OPENCODE_VERSION="${OPENCODE_VERSION:-latest}"

echo "::group::Setting up OpenCode ${OPENCODE_VERSION}"

# Determine arch
ARCH="linux-x64"
case "$(uname -m)" in
  aarch64|arm64) ARCH="linux-arm64" ;;
  x86_64|amd64)  ARCH="linux-x64" ;;
esac

# Download opencode binary from GitHub releases
echo "Downloading opencode ${OPENCODE_VERSION} (${ARCH})..."

if [ "$OPENCODE_VERSION" = "latest" ]; then
  RELEASE_URL="https://api.github.com/repos/anomalyco/opencode/releases/latest"
  DOWNLOAD_URL=$(curl -fsSL "$RELEASE_URL" | jq -r '.assets[] | select(.name == "opencode-'"${ARCH}"'.tar.gz") | .browser_download_url')
else
  RELEASE_URL="https://api.github.com/repos/anomalyco/opencode/releases/tags/${OPENCODE_VERSION}"
  DOWNLOAD_URL=$(curl -fsSL "$RELEASE_URL" | jq -r '.assets[] | select(.name == "opencode-'"${ARCH}"'.tar.gz") | .browser_download_url')
fi

if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
  echo "Error: Could not find opencode binary for ${ARCH}"
  exit 1
fi

echo "Downloading from: ${DOWNLOAD_URL}"
curl -fsSL "$DOWNLOAD_URL" -o /tmp/opencode.tar.gz
tar -xzf /tmp/opencode.tar.gz -C /usr/local/bin/
chmod +x /usr/local/bin/opencode
rm /tmp/opencode.tar.gz

# Verify installation
opencode --version 2>&1 || true
echo "OpenCode installed at: $(which opencode)"

# Configure git for OpenCode
git config --global user.name "${GIT_USER_NAME:-nilesh32236}"
git config --global user.email "${GIT_USER_EMAIL:-nilesh32236@gmail.com}"

# Ensure .opencode directory exists
mkdir -p .opencode

echo "::endgroup::"
echo "OpenCode setup complete."

```

---

### File: `.github/scripts/gather-context.sh`

**Description:** Gathers full context from GitHub issues and/or PRs into a markdown file. Fetches title, body, labels, comments, inline review comments, and PR reviews via the GitHub API. Used to build rich prompts for OpenCode reviews and fixes.

**Full Content:**

```bash
#!/usr/bin/env bash
# gather-context.sh
# Gathers full context from an issue and/or PR for OpenCode prompts.
# Outputs a markdown file with all relevant context.
#
# Usage:
#   gather-context.sh <repo> <output-file> [--issue <N>] [--pr <N>]
#
# Environment:
#   GH_TOKEN — required for GitHub API access

set -euo pipefail

REPO=""
OUTPUT_FILE=""
ISSUE_NUM=""
PR_NUM=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --issue) ISSUE_NUM="$2"; shift 2 ;;
    --pr)    PR_NUM="$2"; shift 2 ;;
    *)
      if [ -z "$REPO" ]; then REPO="$1"
      elif [ -z "$OUTPUT_FILE" ]; then OUTPUT_FILE="$1"
      fi
      shift ;;
  esac
done

[ -z "$REPO" ] && { echo "Error: repo is required"; exit 1; }
[ -z "$OUTPUT_FILE" ] && { echo "Error: output file is required"; exit 1; }

{
  # ── Issue Context ──
  if [ -n "$ISSUE_NUM" ]; then
    # Single API call for issue metadata
    ISSUE_DATA=$(gh api "repos/${REPO}/issues/${ISSUE_NUM}" \
      --jq '{title: .title, body: (.body // "No description"), labels: [.labels[].name]}' \
      2>/dev/null || echo '{"title":"Unknown","body":"Failed to fetch","labels":[]}')

    ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
    ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body')
    ISSUE_LABELS=$(echo "$ISSUE_DATA" | jq -r '.labels | join(", ")')

    echo "## Issue #${ISSUE_NUM}"
    echo ""
    echo "**Title:** ${ISSUE_TITLE}"
    [ -n "$ISSUE_LABELS" ] && echo "**Labels:** ${ISSUE_LABELS}"
    echo ""
    echo "### Description"
    echo ""
    echo "${ISSUE_BODY}"
    echo ""

    COMMENTS=$(gh api "repos/${REPO}/issues/${ISSUE_NUM}/comments" \
      --jq '.[] | "**@\(.user.login)** (\(.created_at)):\n\(.body)\n"' 2>/dev/null || echo "")
    if [ -n "$COMMENTS" ]; then
      echo "### Issue Comments"
      echo ""
      echo "$COMMENTS"
      echo ""
    fi
  fi

  # ── PR Context ──
  if [ -n "$PR_NUM" ]; then
    # Single API call for PR metadata
    PR_DATA=$(gh api "repos/${REPO}/pulls/${PR_NUM}" \
      --jq '{title: .title, body: (.body // "No description")}' \
      2>/dev/null || echo '{"title":"Unknown","body":"Failed to fetch"}')

    PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
    PR_BODY=$(echo "$PR_DATA" | jq -r '.body')

    echo "## PR #${PR_NUM}"
    echo ""
    echo "**Title:** ${PR_TITLE}"
    echo ""
    echo "### PR Description"
    echo ""
    echo "${PR_BODY}"
    echo ""

    # PR comments (issue comments API covers general PR comments)
    PR_COMMENTS=$(gh api "repos/${REPO}/issues/${PR_NUM}/comments" \
      --jq '.[] | "**@\(.user.login)** (\(.created_at)):\n\(.body)\n"' 2>/dev/null || echo "")
    if [ -n "$PR_COMMENTS" ]; then
      echo "### PR Comments"
      echo ""
      echo "$PR_COMMENTS"
      echo ""
    fi

    # PR review comments (inline code comments)
    REVIEW_COMMENTS=$(gh api "repos/${REPO}/pulls/${PR_NUM}/comments" \
      --jq '.[] | "**@\(.user.login)** on `\(.path):\(.line // .original_line)`:\n\(.body)\n"' 2>/dev/null || echo "")
    if [ -n "$REVIEW_COMMENTS" ]; then
      echo "### Inline Review Comments"
      echo ""
      echo "$REVIEW_COMMENTS"
      echo ""
    fi

    # PR reviews (top-level review bodies, skip empty ones)
    REVIEWS=$(gh api "repos/${REPO}/pulls/${PR_NUM}/reviews" \
      --jq '.[] | select(.body != "" and .body != null) | "**@\(.user.login)** (\(.state)):\n\(.body)\n"' 2>/dev/null || echo "")
    if [ -n "$REVIEWS" ]; then
      echo "### Reviews"
      echo ""
      echo "$REVIEWS"
      echo ""
    fi
  fi

} > "$OUTPUT_FILE"

LINES=$(wc -l < "$OUTPUT_FILE")
echo "Context gathered: ${LINES} lines → ${OUTPUT_FILE}"

```

---

### File: `.github/scripts/post-or-update-comment.sh`

**Description:** Posts a new comment or updates an existing one on a PR/issue using an HTML marker (`<!-- marker -->`). This pins status comments to a single post (no duplicates) that gets updated on each iteration.

**Full Content:**

```bash
#!/usr/bin/env bash
# post-or-update-comment.sh
# Posts a new comment or updates an existing one on a PR/issue.
# Uses an HTML marker to find existing comments.
#
# Usage:
#   post-or-update-comment.sh <repo> <issue-number> <marker> <body-file> <GH_TOKEN>
#
# Example:
#   post-or-update-comment.sh "owner/repo" 42 "<!-- opencode-review -->" /tmp/body.md "$GH_TOKEN"

set -euo pipefail

REPO="$1"
ISSUE_NUM="$2"
MARKER="$3"
BODY_FILE="$4"
GH_TOKEN="$5"

[ -f "$BODY_FILE" ] || { echo "Body file not found: $BODY_FILE"; exit 1; }

# Prepend marker to body so we can find this comment later
MARKED_BODY="${MARKER}

$(cat "$BODY_FILE")"

# Find existing comment with this marker
EXISTING_ID=$(gh api "repos/${REPO}/issues/${ISSUE_NUM}/comments" \
  --jq ".[] | select(.body | startswith(\"${MARKER}\")) | .id" | head -1)

if [ -n "$EXISTING_ID" ]; then
  jq -n --rawfile body <(echo "$MARKED_BODY") '{body: $body}' | \
    gh api "repos/${REPO}/issues/comments/${EXISTING_ID}" -X PATCH --input - --silent
  echo "Comment updated (id: ${EXISTING_ID})"
else
  jq -n --rawfile body <(echo "$MARKED_BODY") '{body: $body}' | \
    gh api "repos/${REPO}/issues/${ISSUE_NUM}/comments" --input - --silent
  echo "Comment posted"
fi

```

---

### File: `.github/scripts/find-or-create-autofix-pr.sh`

**Description:** Finds an existing open autofix PR for an issue by branch name (`autofix/issue-<N>`) or creates a new one. Prevents duplicate PRs when `/fix` is triggered multiple times.

**Full Content:**

```bash
#!/usr/bin/env bash
# find-or-create-autofix-pr.sh
# Finds an existing open autofix PR for an issue, or creates a new one.
# Prevents duplicate PRs when /fix is triggered multiple times.
#
# Usage:
#   find-or-create-autofix-pr.sh <repo> <issue-number> <branch-name> <title> <body-file> <GH_TOKEN>
#
# Outputs (to GITHUB_OUTPUT format):
#   pr_number=<N>
#   pr_url=<url>
#   action=created|reused

set -euo pipefail

REPO="$1"
ISSUE_NUM="$2"
BRANCH_NAME="$3"
TITLE="$4"
BODY_FILE="$5"
GH_TOKEN="$6"

# Check for existing open autofix PR for this issue
EXISTING_PR=$(gh pr list \
  --head "autofix/issue-${ISSUE_NUM}" \
  --state open \
  --json number,url \
  --jq ".[0] | {number: .number, url: .url}" 2>/dev/null || echo "null")

PR_NUMBER=$(echo "$EXISTING_PR" | jq -r '.number // empty')
PR_URL=$(echo "$EXISTING_PR" | jq -r '.url // empty')

if [ -n "$PR_NUMBER" ]; then
  # PR exists — update its body and push branch
  echo "Reusing existing PR #${PR_NUMBER}"

  # Update PR body if body file exists
  if [ -f "$BODY_FILE" ]; then
    gh pr edit "$PR_NUMBER" --body-file "$BODY_FILE" --repo "$REPO" 2>/dev/null || true
  fi

  echo "pr_number=${PR_NUMBER}"
  echo "pr_url=${PR_URL}"
  echo "action=reused"
else
  # No existing PR — create one
  echo "Creating new autofix PR for issue #${ISSUE_NUM}"

  BODY="## Fixes #${ISSUE_NUM}

"
  if [ -f "$BODY_FILE" ]; then
    BODY="${BODY}$(cat "$BODY_FILE")

"
  fi
  BODY="${BODY}---
*Auto-generated by fix-audit-issue workflow*"

  PR_URL=$(gh pr create \
    --base main \
    --head "$BRANCH_NAME" \
    --title "$TITLE" \
    --body "$(echo -e "$BODY")" \
    --repo "$REPO")

  PR_NUMBER=$(echo "$PR_URL" | grep -oP '/pull/\K[0-9]+' || echo "")

  echo "pr_number=${PR_NUMBER}"
  echo "pr_url=${PR_URL}"
  echo "action=created"
fi

```

---

## 3. OpenCode Configuration

---

### File: `opencode.json`

**Description:** Top-level OpenCode config. Defines permissions, models, agents (orchestrator, auto-pilot, general, explore, scout, verifier), plugins (superpowers, opencode-notify), and MCP servers (GitHub via `@github/github-mcp-server`).

**Full Content:**

```json
{
	"$schema": "https://opencode.ai/config.json",
	"permission": {
		"task": "allow",
		"subagent": {
			"*": "allow"
		},
		"bash": "allow",
		"edit": "allow",
		"write": "allow",
		"read": "allow",
		"external_directory": "allow"
	},
	"model": "opencode-go/qwen3.6-plus",
	"agent": {
		"orchestrator": {
			"description": "Interactive mode: plans, divides tasks, and coordinates sub-agents for complicated but not-too-long tasks. Ask questions mid-task as needed.",
			"mode": "primary",
			"model": "opencode-go/qwen3.6-plus",
			"prompt": "{file:./.opencode/prompts/orchestrator.md}",
			"temperature": 0.3,
			"color": "accent"
		},
		"auto-pilot": {
			"description": "Auto-pilot mode: for long-running tasks with many changes. Asks ALL questions upfront, then works independently. Skips blockers instead of asking.",
			"mode": "primary",
			"model": "opencode-go/qwen3.6-plus",
			"prompt": "{file:./.opencode/prompts/auto-pilot.md}",
			"temperature": 0.2,
			"color": "warning"
		},
		"general": {
			"model": "opencode/deepseek-v4-flash-free"
		},
		"explore": {
			"model": "opencode/deepseek-v4-flash-free"
		},
		"scout": {
			"model": "opencode/deepseek-v4-flash-free"
		},
		"verifier": {
			"mode": "subagent"
		}
	},
	"plugin": [
		"superpowers@git+https://github.com/obra/superpowers.git",
		"opencode-notify"
	],
	"mcp": {
		"github": {
			"type": "local",
			"command": ["npx", "-y", "@github/github-mcp-server"],
			"environment": {
				"GITHUB_TOKEN": "${GITHUB_TOKEN}"
			}
		}
	}
}

```

---

### File: `AGENTS.md`

**Description:** Root-level agent instructions. Documents the monorepo structure (frontend/backend), development commands, deployment targets, and path alias conventions.

**Full Content:**

```markdown
# WeTheYuva Monorepo

This repo contains two independent projects:
- **`backend/`** — Express REST API (we-the-yuva-api), deployed to Hugging Face Spaces
- **`frontend/`** — Next.js 16 App Router frontend (we-the-yuva-vms), deployed to Vercel

Each has its own `package.json`, `pnpm-lock.yaml`, and git history. No shared pnpm workspace.

## Development

```bash
# Backend
cd backend && pnpm install && npx prisma generate && pnpm dev

# Frontend  
cd frontend && pnpm install && pnpm dev
```

## Deployment

- **Frontend → Vercel**: Set root directory to `frontend/` in Vercel project settings
- **Backend → Hugging Face**: `.github/workflows/sync-backend-hf.yml` syncs `backend/` to HF Space on push

## Commands (per directory)

See `frontend/AGENTS.md` and `backend/README.md` for per-project commands.

## Path aliases

- `backend/` uses `@/*` → `src/*`
- `frontend/` uses `@/*` → repo root (same as before)

```

---

## 4. Audit Prompts

**Description:** Category-specific audit prompts used by the Codebase Audit workflow. Each file targets a specific quality dimension. OpenCode randomly selects one of these per audit run.

---


### File: `.audit-prompts/api-data-fetching.md`

```markdown
# Audit: API & Data Fetching

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Data fetching uses `@tanstack/react-query` v5 with a shared `QueryClient` instantiated in `lib/query-client.ts` (staleTime: 5 min, retry: 1, refetchOnWindowFocus: false). The `api` axios instance (`lib/api.ts`) has base URL `/api/v1`, includes credentials (`withCredentials: true`), attaches Bearer token via request interceptor, and auto-refreshes tokens on 401 via response interceptor. Error normalization happens in the response interceptor — network errors, timeouts, and API errors are mapped to `error.normalizedMessage`. Queries use `useQuery` and mutations use `useMutation` across components. The `QueryClientProvider` wraps all routes in `app/providers.tsx` above `AuthProvider`. API endpoints are proxied through Next.js rewrites (`next.config.ts`) to the backend at `API_URL`.

Scan target directories recursively (`components/`, `hooks/`, `app/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Query Patterns
- Query keys consistent structure — are they arrays with string/enum constants or inline strings?
- `staleTime` and `gcTime` (formerly `cacheTime`) configured per-query or relying on defaults?
- `useQuery` calls with missing query key dependencies — stale data when params change
- `enabled` option usage — queries that should wait for user auth or other conditions
- `select` option used for data transformation (avoids unnecessary re-renders)?
- `placeholderData` (keepPreviousData) for paginated lists?

### Mutation Patterns
- `onMutate` / `onSettled` for optimistic updates with rollback on error
- `queryClient.invalidateQueries` called after mutations to refresh stale data
- `queryClient.setQueryData` for immediate UI update without refetch
- Mutation error handling — are errors surfaced via toaster/toast (`components/ui/toast.tsx`)?
- Mutation `isPending` state used for loading UI (button spinners, disabled states)?

### Error Handling
- Query `isError` state — rendered error UI for each failed query?
- Error boundaries catching query errors at route group level (`error.tsx` pages)
- `error.normalizedMessage` consumed in UI or raw error displayed?
- Axios interceptor error normalization handling — does every query/mutation consumer use it correctly?

### Caching & Performance
- `gcTime` vs `staleTime` ratio — data lingering in cache longer than needed
- Query key factory pattern (e.g., `['opportunities', id]`) vs ad-hoc keys
- `refetchOnMount` behavior — unnecessary re-fetches for static data
- `networkMode` setting — offline behavior (`networkMode: 'offlineFirst'`)

### Axios Instance
- Base URL `/api/v1` matches rewrite rule in `next.config.ts`?
- `withCredentials: true` on all requests — correct for cookie-based refresh?
- Timeout set to 30s — appropriate or too long/short for specific endpoints?
- Request interceptor reads `memoryToken` first, falls back to cookie — consistent?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Stale/missing data leading to incorrect state, data leak via error, caching auth tokens
- **important**: Missing loading/error states, stale query keys, no cache invalidation after mutation
- **minor**: Inefficient refetch config, unused query options, missing select transforms

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/api-endpoints.md`

```markdown
# Audit: API Endpoints

You are auditing the **WeTheYuva backend API** — an Express + TypeScript REST API with Prisma ORM, Zod validation, JWT auth, BullMQ queues, and Redis caching.

**Important context:** Modules follow a controller → service → routes pattern under `src/modules/<name>/`. Shared Zod schemas live in `src/shared/schemas/`. Auth middleware chain: `validate(schema)` → `requireAuth` → `requireRole/requirePermission` → handler. Swagger at `/api/v1/docs`. All tests mock Prisma/Redis/BullMQ via vitest.

Scan the `src/` directory recursively. Output findings to `.audit-output.jsonl`.

## What to Check

### REST Design
- Routes follow `/api/v1/<resource>` pattern? Consistent pluralization?
- HTTP methods appropriate (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes)?
- Response status codes correct (200, 201, 204, 400, 401, 403, 404, 422, 500)?
- Error responses follow a consistent shape (`{ success, error, data }` or similar)?
- Pagination implemented on list endpoints? Consistent `page`/`limit` params?

### Input Validation (Zod)
- Every request body/query/params validated via Zod schemas from `src/shared/schemas/`?
- Schemas exported from `src/shared/schemas/` also used by frontend in `frontend/lib/shared/schemas/` — are they in sync?
- File uploads validated (size, type, count limits)?
- Missing validation on optional fields that could cause crashes?

### Route Configuration
- Routes registered in the correct module router? Not duplicated across modules?
- Module routers mounted in `src/app.ts`? Path prefix matches?
- `express-rate-limit` is a dependency but not wired in `app.ts` — should it be?

### Middleware Chain
- Every protected route has the full chain: `validate` → `requireAuth` → `requireRole/requirePermission`?
- `requireRole`/`requirePermission` checks use the correct role/permission enum values?
- Public routes explicitly allow unauthenticated access?
- Error middleware catches and formats all errors consistently?

### Database Queries
- Prisma queries use proper `include`/`select` — no over-fetching?
- N+1 query patterns in list endpoints? Using Prisma `include` for relations correctly?
- Missing transactions where multiple writes should be atomic?
- Pagination uses `skip`/`take` with proper ordering?
- Raw queries (`$queryRaw`) parameterized — no SQL injection?

## Output Format

Write findings to `.audit-output.jsonl`:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing auth middleware, SQL injection, broken auth, data loss risk, unvalidated input on destructive operations
- **important**: Missing pagination, inconsistent error responses, missing transactions, N+1 queries, missing route registration
- **minor**: Non-standard status codes, naming inconsistencies, missing JSDoc, unused imports

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk/impact
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/authentication-authorization.md`

```markdown
# Audit: Authentication & Authorization

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Auth is handled client-side via `lib/auth-context.tsx` using a JWT-based flow with the `jose` library on the server. Tokens are stored in both an in-memory variable (`memoryToken` in `lib/api.ts`) and a cookie (`access_token`) for Edge middleware access. The `api` axios instance (`lib/api.ts`) attaches the Bearer token via request interceptor and auto-refreshes on 401 responses via a `/auth/refresh` endpoint. There is **no middleware.ts** in the project — route protection relies on layout-level checks and client-side redirects. The `AuthProvider` in `app/providers.tsx` wraps all routes and fetches `/users/me` to populate the `AuthUser` context. Token refresh uses a singleton `refreshPromise` pattern to avoid concurrent refresh calls. Logout clears both memory token and cookie, sets a `sessionStorage` flag to prevent re-auth loops, and redirects to `/login`.

Scan target directories recursively (`lib/`, `hooks/useAuth.ts`, `app/(auth)/`, `app/providers.tsx`). Output findings to `.audit-output.jsonl`.

## What to Check

### Token Storage & Handling
- JWT stored in cookie without `HttpOnly` flag (readable via `document.cookie` — verify Secure/SameSite flags)
- `memoryToken` being reset on page refreshes (cookie fallback path checked)
- `setAccessToken` call coverage — is it called after login, register, and refresh?
- Token expiry detection — nothing in client code checks `exp` claim before making requests
- Refresh token rotation — does the refresh endpoint return a new `accessToken` only, or also a new refresh token?

### Auth Context & Provider
- `AuthProvider` skips `fetchUser` on public routes — are public routes correctly identified via `isPublicRoute`?
- Onboarding redirect logic (`/consent`, `/setup-profile`) — can it loop if consent/profile check fails silently?
- `useAuth` hook exposed via both `hooks/useAuth.ts` (re-export) and `lib/auth-context.tsx` — consistent usage?
- `isLoading` handling — are all child components handling the loading state properly (skeleton/spinner before redirect)?
- Race condition between route group layout mount and `AuthProvider` fetch completion

### Route Protection
- No `middleware.ts` exists — how are protected routes enforced without server-side guard?
- Each route group layout (`(volunteer)/`, `(coordinator)/`, `(org-admin)/`, `(admin)/`, `(observer)/`) should check `useAuth` — verify they do
- Can a volunteer access `/admin/dashboard` by typing the URL directly?
- Are role-based route guards consistent across all route group layouts?

### Authentication Endpoints
- Login, register, verify-otp flow — do they all call `setAccessToken`?
- Password reset flow — any endpoints for forgot/reset password in `lib/shared/schemas/auth.schemas.ts`?
- OTP verification flow (`app/(auth)/verify-otp/`) — timeout/expiry handling
- Session fetch error handling — `console.error` in `fetchUser` leaks no PII?

### Token Refresh
- `refreshPromise` singleton — what happens if refresh itself returns 401?
- `sessionStorage logged_out` flag checked before auto-refresh — can this be spoofed?
- Retry flag (`_retry`) on `originalRequest` — prevents infinite loops
- Refresh response sets cookie manually — does it also update `memoryToken`?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Direct auth bypass, token leak, privilege escalation, session hijack
- **important**: Missing protection on routes, weak token handling, insufficient validation
- **minor**: Inefficient patterns, missing error feedback, minor UX issues

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/code-quality-conventions.md`

```markdown
# Audit: Code Quality & Conventions

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Biome is configured in `biome.json` with spaces (2) indent, single quotes, semicolons always, trailing commas in JS (es5), no trailing commas in JSON, `noUnusedVariables` and `noUnusedImports` set to warn, `noExplicitAny` warn, `noConsole` off, `noDangerouslySetInnerHtml` off, `useExhaustiveDependencies` warn. Lint runs with `pnpm lint` targeting `app components lib hooks`. AGENTS.md conventions: single quotes in JS/TS, double quotes in JSON; spaces 2 indent; theme tokens via `cn()` and CSS variables (never raw hex); Lucide icons (no emoji icons); CSS animations (no framer-motion); forms use react-hook-form + Zod. The `cn()` utility in `lib/utils.ts` uses `clsx` + `tailwind-merge`. A barrel file at `lib/shared/index.ts` re-exports all schemas and helpers. Sentry config files have Phase 2 comments.

Scan target directories recursively (`app/`, `components/`, `lib/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Biome Compliance
- Single quotes used in all JS/TS files (double quotes only in JSON/config)
- Semicolons present at end of statements
- Trailing commas in JS arrays/objects (es5 mode — trailing commas in multi-line, no trailing commas in single-line)
- No unused variables or imports (`noUnusedVariables`/`noUnusedImports` warns)
- No `any` type without explicit biome suppression comment (`noExplicitAny`)
- Consistent 2-space indentation (no tabs)

### Project Conventions from AGENTS.md
- Theme tokens used via `cn()` with `bg-brand-primary`, `text-brand-text`, etc. — no raw hex values
- Lucide icons used exclusively (check for emoji icons like ❌, ✅, ⚠️ in components)
- No framer-motion imports or `motion.*` JSX elements — CSS animations used instead
- `react-hook-form` with Zod resolver for forms (`@hookform/resolvers/zod`)
- CSS class ordering convention (Tailwind best practices) — consistent across files

### Dead Code & Debug Artifacts
- `console.log` calls not wrapped in `if (process.env.NODE_ENV !== 'production')` — investigate intentional/unintentional
- `console.error` used for error logging — acceptable per `noConsole: off`
- Commented-out code blocks in components
- Phase 2 / TODO comments that block functionality (`// Phase 2: Outside MVP Phase 1 scope`)
- Unused component props or state variables

### Barrel File Hygiene
- `lib/shared/index.ts` re-exports 14 schema files plus helpers and types — tree-shakable?
- Imports from `@/lib/shared` vs direct imports from specific schema files
- Circular dependencies possible through barrel re-exports

### Naming Conventions
- File names: `kebab-case` for components (`opportunity-form.tsx`), PascalCase for component exports
- Constants: `UPPER_SNAKE_CASE` (e.g., `Permissions` object keys, `PUBLIC_ROUTES`, `DB_NAME`)
- Functions: `camelCase` for utilities, `PascalCase` for React components
- Event handlers: `handle*` prefix pattern consistent?

### File Organization
- Components in domain directories under `components/` (auth/, dashboard/, admin/, etc.)
- UI primitives only in `components/ui/`
- Shared types in `lib/shared/types/`, schemas in `lib/shared/schemas/`
- Hooks in `hooks/` — some are re-exports (`useAuth.ts` re-exports from `lib/auth-context.tsx`)
- Route group layouts self-contained with nav items defined inline

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Biome lint errors, raw hex colors used, framer-motion import found, unused variable affecting functionality
- **important**: Single quote violations, missing semicolons, trailing comma inconsistencies, debug console.log, unused imports
- **minor**: Indentation issues, naming convention drift, commented-out code, barrel file re-exports of unused modules

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/data-integrity.md`

```markdown
# Audit: Data Integrity

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Zod schemas live in `lib/shared/schemas/` with 14 schema files: `auth.schemas.ts`, `profile.schemas.ts`, `opportunity.schemas.ts`, `organization.schemas.ts`, `blog.schemas.ts`, `alerts.schemas.ts`, `feedback.schemas.ts`, `levels.schemas.ts`, `mentorship.schemas.ts`, `notifications.schemas.ts`, `stories.schemas.ts`, `training.schemas.ts`, `youth.schemas.ts`, `admin.schemas.ts`. These are re-exported via `lib/shared/index.ts` barrel file. Types are in `lib/shared/types/index.ts`. Forms use `react-hook-form` with `@hookform/resolvers/zod` for validation. The offline queue in `lib/offline-queue.ts` uses IndexedDB to store check-in data when offline, then syncs on reconnect. API responses are typed but not validated against Zod schemas at runtime — types are assumed to match backend.

Scan target directories recursively (`lib/shared/`, `components/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Zod Schema Completeness
- Every form submission backed by a Zod schema via `@hookform/resolvers/zod`?
- Schema `.refine()` or `.superRefine()` used for cross-field validation (e.g., password confirm, date ranges)?
- Proper error messages on each `.refine()` — user-friendly messages for field validation failures?
- Optional fields clearly marked with `.optional()` or `.nullable()`?
- Enums match backend enum values (case-sensitive)?

### Type Safety
- API response types in `lib/shared/types/index.ts` — do they match Zod schema output types?
- Any `as` type assertions used to cast API responses instead of Zod `.parse()`?
- `z.infer<typeof Schema>` used consistently for inferred types?
- Union types for different API response shapes (success vs error)?

### Form Data Constraints
- String min/max lengths enforced in Zod schemas (prevent DB constraint violations)?
- Number fields have `.min()`/`.max()` where applicable
- Email fields use `.email()` validator
- URL fields use `.url()` validator
- Date fields use `.date()` or `.datetime()` with proper format strings
- Array fields have `.min()`/`.max()` length constraints

### Data Relationships
- Foreign key references (e.g., `organizationId`, `eventId`) typed as strings but not cross-validated
- Schema for related entities nested or referenced by ID?
- Optimistic update data shapes match API response shapes (to avoid UI desync after `setQueryData`)

### Offline Data Integrity
- `lib/offline-queue.ts` — queued check-in data validated before storage?
- Conflict resolution when multiple offline check-ins are synced after reconnect
- Timestamp handling — `createdAt` uses `Date.now()` (local time) instead of server time

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing validation allows malformed data to reach API, type mismatch causes runtime crash, schema allows invalid enum values
- **important**: Missing string length constraints, optional fields not marked, insufficient error messages, offline data not validated
- **minor**: Missing `.max()` on number fields, overly permissive regex, type inferred but not exported

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/error-handling-monitoring.md`

```markdown
# Audit: Error Handling & Monitoring

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Sentry is configured in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` with `tracesSampleRate: 0.1`. All three files are marked as Phase 2 — they warn if DSN is missing and skip initialization. Error boundaries exist at the root (`app/error.tsx`, `app/global-error.tsx`), at route group level (`(admin)/error.tsx`, `(auth)/error.tsx`, `(coordinator)/error.tsx`, `(observer)/error.tsx`, `(org-admin)/error.tsx`, `(volunteer)/error.tsx`), and at specific feature routes (`scan/error.tsx`, `notifications/error.tsx`, `(public)/contact/error.tsx`, `(public)/opportunities/error.tsx`). Loading pages (`loading.tsx`) mirror this structure. The axios response interceptor in `lib/api.ts` normalizes errors into `error.normalizedMessage` for network/timeout/API errors. The auth context logs errors with `console.error` during session fetch. React Query error states (`isError`) are available but usage depends on component-level handling. A `not-found.tsx` exists at root level.

Scan target directories recursively (`app/`, `lib/api.ts`, `lib/auth-context.tsx`, `sentry.*.config.ts`, `components/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Sentry Configuration
- DSN missing check — `console.warn` when not configured — intended for local dev but swallowed in production?
- `tracesSampleRate: 0.1` — appropriate for production or should be lower?
- `environment: process.env.NODE_ENV` — distinguishes dev/staging/prod?
- Server-side Sentry init guards against missing DSN — but no Sentry SDK calls wrapped in try/catch
- All three config files (client, server, edge) have same Phase 2 pattern

### Error Boundary Coverage
- `global-error.tsx` catches root errors (renders outside layout)
- `error.tsx` at route group levels — do they offer retry actions or just display messages?
- Error boundaries missing for feature routes like `(volunteer)/`, `(coordinator)/` feature pages
- `error.tsx` components use `'use client'` directive and receive `error` + `reset` props
- Recovery via `reset()` function — wired to a "Try Again" button?

### API Error Handling
- Axios interceptor normalizes network errors, timeouts, and API errors to `error.normalizedMessage`
- `error.response?.data` parsing — handles string, object with `.error`, object with `.message`, and fallback
- Components consuming `error.normalizedMessage` or raw error?
- Token refresh failure redirects to `/login` — preserves `sessionStorage` flag correctly
- Refresh endpoint itself failing — handled?

### React Query Error States
- `isError` state checked in query consumers — renders fallback UI?
- Mutation `onError` callbacks surface errors via toast (`components/ui/toaster.tsx`)
- `useOfflineCheckin` `onError` passes error message string — consumed by caller or lost?
- Retry logic (`retry: 1` in query client) — appropriate or should be per-query?

### Graceful Degradation
- Network failure shown via `NetworkStatusIndicator` component
- Offline check-in falls back to IndexedDB queue — user feedback on queued state
- Skeleton loaders (`components/ui/skeleton.tsx`) shown during query loading
- Fallback pages (`not-found.tsx`) user-friendly with navigation link

### Client-side Error Logging
- `console.error` in `auth-context.tsx` — logs session fetch failures without PII
- `console.error` in `PushSubscriber.tsx` and `usePushNotifications.tsx` — push subscription errors logged
- `console.warn` in Sentry config files — acceptable for missing DSN
- Any `console.log` that could leak sensitive data in production?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Unhandled promise rejection, missing error boundary on critical route, Sentry DSN in client bundle, error page crash loop
- **important**: Console.error in production, error boundary without retry, missing loading skeleton, mutation error not shown to user
- **minor**: Non-optimistic Sentry trace rate, missing not-found page on dynamic routes, verbose error logging

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/forms-validation.md`

```markdown
# Audit: Forms & Validation

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** Forms use `react-hook-form` v7 with `@hookform/resolvers/zod` for validation against Zod schemas from `lib/shared/schemas/`. The UI toast system (`components/ui/toaster.tsx`) displays mutation results. The app has forms across multiple domains: auth (login, register, OTP verify), profile (setup, edit), opportunities (create, edit, apply), events (create, edit), organizations, blog, training, mentorship, feedback, consent, stories, levels requests, and admin settings. Many pages exist in route groups for create/edit flows (`opportunities/new`, `events/[id]/edit`). The `cn()` utility handles className merging. Buttons use the `Button` UI component from `components/ui/Button.tsx`. Loading states on submissions should use the mutation's `isPending` state.

Scan target directories recursively (`components/`, `app/`, `lib/shared/schemas/`). Output findings to `.audit-output.jsonl`.

## What to Check

### React Hook Form Patterns
- `useForm` called with `resolver: zodResolver(schema)` for every form?
- `register` vs `Controller` — when are custom `Controller` components needed (custom inputs, editors)?
- `formState.errors` rendered inline next to each field
- `formState.isSubmitting` used for button disabled/loading state
- `handleSubmit` wrapping the submit handler correctly
- Default values match Zod schema defaults (`.default()` values in schema)

### Zod Resolver Integration
- `@hookform/resolvers/zod` `zodResolver` imported and configured
- Async Zod validation (`.refine()` with async) handled — does it block form submission?
- Schema error messages mapped to user-facing field errors
- Cross-field validation (password match, date range) using `.refine()` — errors attached to specific field via `path`

### Field Error Display
- Error messages rendered within `<label>` or as `<span>` adjacent to field
- Error states visually indicated (red border on input, aria-invalid)
- Sonner toast for submission-level errors (network failure, server error)
- Multiple errors on same field all displayed (not just first)
- Error messages disappear when user starts correcting the field

### Submission & Loading States
- Button shows spinner/disabled state during `isPending`
- Form fields disabled during submission to prevent double-submit
- Success state — form reset, redirect, or success toast on completion
- Mutation `onSettled` used to re-enable form regardless of outcome
- Optimistic UI updates — form reflects submitted data before server confirms

### Form Reset & Dirty Tracking
- `reset()` called after successful submission to clear form
- `formState.isDirty` used to warn before leaving with unsaved changes (beforeunload)?
- `formState.dirtyFields` for partial form updates (PATCH vs PUT)
- Form state preserved on validation error (no page-level reset)

### Multi-Step & Complex Forms
- Multi-step forms (setup-profile, consent flow) — step state managed in component or URL?
- Each step validated independently before proceeding
- Step data persisted if user navigates away
- File upload fields handled with `Controller` (file inputs need custom handling)

### Specific Form Pages
- Login (`app/(auth)/login/`) — email, password fields with proper validation
- Register (`app/(auth)/register/`) — multi-field with password confirmation
- Profile setup (`app/(auth)/setup-profile/`) — skills, interests, availability arrays
- Opportunity form (`components/opportunities/OpportunityForm.tsx`) — rich text for description
- Event create/edit with QR code generation
- Blog form with Tiptap editor for content

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing field validation allows invalid data, form submits before validation completes, no CSRF protection
- **important**: No loading state on submit, error messages not displayed, form doesn't reset on success, missing dirty-field warning
- **minor**: Default values missing, slow async validation, unclear error messages, redundant validation

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/performance.md`

```markdown
# Audit: Performance

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** The app is built with Next.js 16 (`next.config.ts`). Image loading uses `next/image` with `remotePatterns` configured for `images.unsplash.com`, `plus.unsplash.com`, `localhost`, and the API origin. The `@vercel/speed-insights` package is integrated. React Query has a global `staleTime` of 5 minutes and `retry: 1` with `refetchOnWindowFocus: false`. The query client is in `lib/query-client.ts`. Animation is CSS-only (no framer-motion — all animations via `@keyframes` in `globals.css`). `recharts` is used for charts. `next-themes` for theme switching without flash. `nprogress` top-bar loader for page transitions. Serwist handles precaching and runtime caching.

Scan target directories recursively (`components/`, `app/`, `lib/`, `hooks/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Image Optimization
- All `<img>` tags replaced with `next/image` — or are `next/image` usages missing `width`/`height`?
- `remotePatterns` configured in `next.config.ts` covers all external image sources
- Images use `priority` on above-the-fold content (LCP elements)
- `loading="lazy"` on below-the-fold images
- Placeholder/blur placeholder used for images
- Image format — WebP/AVIF via Next.js optimization (no explicit format needed)

### Bundle Size
- Dynamic imports with `next/dynamic` for heavy components (Tiptap editor, recharts, QR scanner, HTML5 QR code)
- Large libraries (`@tiptap/react`, `recharts`, `html5-qrcode`) loaded on routes that need them, not globally
- Barrel file `lib/shared/index.ts` — unused schema imports in bundle?
- Lucide icons — imported individually (`import { User } from 'lucide-react'`) not via barrel

### React Query Caching
- `staleTime: 5 * 60 * 1000` — is this appropriate for all data types? Auth/user data should be shorter
- `gcTime` (formerly `cacheTime`) — configured per-query or defaulting to 5 minutes
- Static data (dropdowns, enums, countries) can have `staleTime: Infinity`
- Polling/refetchInterval — used for real-time data (notifications, check-in counts)?
- Query key structure enables granular cache invalidation

### Re-render Optimization
- `useMemo` and `useCallback` — used on expensive computations and callback props to child components?
- List components have proper `key` props (not array index)
- Context consumers — `AuthContext` causes re-render across all providers on user change; memoized?
- `useQuery` `select` option to prevent full-data re-renders when only a subset changes

### Layout & Rendering
- CSS animations use `transform` and `opacity` only (GPU-composited, no layout thrashing)
- `will-change` CSS property used sparingly and removed after animation
- No `<script>` tags blocking render in critical path
- Server components where no interactivity is needed (data-display pages, landing)

### Code Splitting & Route Segmentation
- Route groups naturally code-split by role — volunteer doesn't download admin code
- Feature-specific `loading.tsx` for Suspense boundaries
- NProgress configured with minimal CSS (`nprogress.css` imported in root layout)

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Missing `next/image` leads to huge unoptimized images, missing `priority` on LCP, large library imported globally
- **important**: Missing dynamic imports on heavy components, long staleTime on dynamic data, missing `loading=lazy`, barrel imports pulling unused code
- **minor**: Missing `key` prop on list items, unused CSS animations, missing `select` on queries, un-memoized callbacks

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/pwa-offline.md`

```markdown
# Audit: PWA & Offline

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** PWA is implemented via Serwist (`@serwist/turbopack`, `serwist` v9). The service worker is defined at `app/sw.ts` using `withSerwist` in `next.config.ts`. It precaches entries from `self.__SW_MANIFEST`, enables `skipWaiting`, `clientsClaim`, `navigationPreload`, uses `defaultCache` runtime caching from `@serwist/turbopack/worker`, and falls back to `/offline` page for document requests. Push notification handling is in the service worker (`push` and `notificationclick` events) and client-side via `components/PushSubscriber.tsx` and `hooks/usePushNotifications.ts`. The offline check-in queue uses IndexedDB in `lib/offline-queue.ts` with `hooks/useOfflineCheckin.ts`. The `usePWAInstall` hook in `hooks/usePWAInstall.ts` is marked Phase 2. A manifest reference exists in `app/layout.tsx` pointing to `/manifest.json`. Icons are at `/icons/icon-{192,512}.png`. An `/offline` route exists. The `NetworkStatusIndicator` component in `components/shared/` shows connectivity status.

Scan target directories recursively (`app/sw.ts`, `app/serwist/`, `app/offline/`, `components/PushSubscriber.tsx`, `hooks/`, `lib/offline-queue.ts`, `next.config.ts`). Output findings to `.audit-output.jsonl`.

## What to Check

### Service Worker Configuration
- `app/sw.ts` — `runtimeCaching: defaultCache` from `@serwist/turbopack/worker` — are the cache strategies appropriate for API vs static assets?
- `navigationPreload: true` — response used correctly for navigation requests?
- `skipWaiting` and `clientsClaim` both true — immediate activation on update
- `fallbacks.entries` only handles document destination — what about images or API fails?
- SW update flow — `AppUpdatePrompt` in `components/shared/AppUpdatePrompt.tsx` shows update available prompt?

### Offline Page & UX
- `/offline` route — user-friendly offline page with retry button?
- `loading.tsx` files in route groups — shown during offline navigation when SW fallback serves `/offline`?
- `NetworkStatusIndicator` — positioned correctly, not overlapping content?
- TanStack Query `networkMode` — configured for offline-first behavior?

### Push Notifications
- `PushSubscriber.tsx` — shows prompt only when `permission === 'default'` and user is logged in
- Auto-subscribe in background when permission already granted
- SW push event — handles non-JSON payloads gracefully (try/catch)
- SW notificationclick — opens link from notification data
- VAPID key fetched from `/vapid-public-key` — is error handled if endpoint unavailable?
- Existing subscription unsubscribed before re-subscribing

### IndexedDB Offline Queue
- `lib/offline-queue.ts` — IndexedDB with `wetheyuva-offline` DB, `checkin-queue` store
- `syncQueuedCheckins` sends all queued items sequentially — partial failure handling (reports synced vs failed)
- Queue not cleared on logout — stale check-ins from previous session
- DB version handling — `DB_VERSION = 1` with no migration logic

### Manifest & Icons
- `app/layout.tsx` references `/manifest.json` — file exists and has correct properties?
- Icon paths (`/icons/icon-{192,512}.png`) — do files exist at those paths?
- `appleWebApp` metadata set in layout — `capable: true`, `statusBarStyle: 'black-translucent'`
- `viewportFit: 'cover'` for iPhone notch / Dynamic Island
- `themeColor` defined with light/dark variants

### PWA Install
- `usePWAInstall` hook marked Phase 2 — not actively used but present
- `beforeinstallprompt` event captured but no UI trigger installed
- `isStandalone` check uses multiple heuristics (matchMedia, navigator, referrer)

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: SW not registering, offline page broken, manifest missing, push notifications failing silently
- **important**: Missing cache strategy for API routes, offline queue not cleared on logout, no retry on sync failure
- **minor**: Missing icons, missing iOS meta tags, VAPID fetch error not handled in UI

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/role-based-access.md`

```markdown
# Audit: Role-Based Access

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** The app has 5 route groups separated by role: `(volunteer)/`, `(coordinator)/`, `(org-admin)/`, `(admin)/`, `(observer)/` plus `(public)/` and `(auth)/`. There is **no middleware.ts** — route protection is enforced client-side via layout-level `useAuth` checks. The `AuthUser` type in `lib/auth-context.tsx` defines roles: `VOLUNTEER`, `COORDINATOR`, `ORGANIZATION_ADMIN`, `PLATFORM_MANAGER`, `ADMIN`, `OBSERVER`. A permissions system exists in `lib/shared/permissions.ts` with granular string constants (e.g., `OPPORTUNITY_CREATE`, `EVENT_CHECKIN`, `STORY_MODERATE`). The `AuthUser` includes an optional `permissions` array. The `isPublicRoute` helper in `lib/public-routes.ts` determines which paths skip auth entirely. The onboarding redirect in `AuthProvider` enforces consent acceptance and profile setup before accessing protected routes.

Scan target directories recursively (`app/`, `lib/shared/permissions.ts`, `components/`). Output findings to `.audit-output.jsonl`.

## What to Check

### Route Group Isolation
- Each route group layout (`(coordinator)/layout.tsx`, `(org-admin)/layout.tsx`, etc.) must verify the current user's role before rendering children
- Can a volunteer access `/coordinator/events/new` by typing the URL directly?
- Observer routes — read-only enforced at component level (no edit/create actions rendered)?
- Each layout has its own `error.tsx` and `loading.tsx` for role-specific fallbacks

### Component-Level Permission Checks
- Components that perform actions (create, edit, delete) check `user.permissions` before rendering action buttons
- `Permissions` constants from `lib/shared/permissions.ts` used consistently for checks
- API-level authorization — client-side checks alone are insufficient; do components assume server will enforce?
- Conditional rendering based on role vs permissions — which takes precedence?

### Admin & Super Admin Access
- `(admin)/` layout — restricts to ADMIN and PLATFORM_MANAGER roles?
- Organization-specific data scoping — org-admin sees only their org's data; admin sees all
- Platform Manager role — how does it differ from ADMIN?

### Onboarding & Consent Flow
- Consent verification (`user.consent`) before accessing protected routes
- Profile setup required for VOLUNTEER role before proceeding
- `locationId` requirement for COORDINATOR/ADMIN/OBSERVER — verified?
- What happens if user navigates to a protected route before completing onboarding — correct redirect?

### Permission Constants Coverage
- `Permissions` object has 30+ string constants — are all used in components?
- Any hardcoded permission strings instead of using `Permissions.X` constants?
- Missing permissions for specific actions (e.g., can cert download be restricted?)

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Cross-role data access, missing server-side authorization, admin-only data exposed to volunteers
- **important**: No client-side role guard on layout, orphan permission constants, missing error redirect for unauthorized access
- **minor**: Inefficient permission check, redundant role checks, inconsistent guard pattern between route groups

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/security.md`

```markdown
# Audit: Security

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** JWT tokens stored in both memory (`lib/api.ts` `memoryToken`) and a non-HttpOnly cookie (`access_token`) accessible via `document.cookie`. The axios response interceptor manually writes the cookie with `SameSite=Strict` and conditional `Secure` flag. Sentry is configured in `sentry.client.config.ts` and `sentry.server.config.ts` (Phase 2 — currently warns if DSN missing). A Tiptap rich text editor is used (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`) — potential XSS vector if HTML output is rendered without sanitization. Next.js security headers are set in `next.config.ts`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. The CSP includes `'unsafe-inline'` and `'unsafe-eval'` for scripts. QR code scanning uses `html5-qrcode`. Rewrites proxy all `/api/v1/*` requests to the backend. No `middleware.ts` exists for server-side request validation.

Scan target directories recursively (`lib/`, `app/`, `components/`, `hooks/`, `next.config.ts`). Output findings to `.audit-output.jsonl`.

## What to Check

### JWT & Cookie Security
- `access_token` cookie lacks `HttpOnly` flag — readable by JavaScript (XSS risk)
- `Secure` flag conditionally applied based on `window.location.protocol` — inconsistent in dev vs prod
- Token storage in `memoryToken` is non-persistent, correct? But cookie fallback is persistent
- Refresh endpoint (`/auth/refresh`) should set HttpOnly cookie for the refresh token

### XSS Vectors
- Tiptap editor output rendered with `dangerouslySetInnerHTML` anywhere?
- `lib/shared/schemas/blog.schemas.ts` — does blog content schema sanitize HTML?
- Any user-generated content rendered without escaping (stories, feedback, profiles)?
- `noDangerouslySetInnerHtml` Biome rule is **off** in biome.json — deliberate for Tiptap HTML rendering?

### PII & Data Exposure
- `console.error` calls in `auth-context.tsx` and `usePushNotifications.ts` — could leak PII in browser logs
- Sentry breadcrumbs — could include request data with PII; is `attachProps` configured?
- API error responses surfaced directly in UI via `error.normalizedMessage` — could leak internal details
- User email, phone, address in URL params or query strings

### API Security
- No middleware for server-side authorization — API endpoint access relies on backend entirely
- Rewrite proxy exposes backend directly — any risk of path traversal?
- Form submissions (`react-hook-form` + Zod) — server-side re-validation URL unknown; client-only validation?
- File upload (`Permissions.FILE_UPLOAD`) — size/type limits enforced client-side?

### Security Headers & CSP
- CSP in `next.config.ts` includes `'unsafe-inline'` and `'unsafe-eval'` — necessary for Next.js but reduces XSS protection
- `connect-src` includes `apiOrigin` — validated origin?
- `Permissions-Policy` restricts camera, microphone, geolocation — correct
- HSTS preload enabled — correct
- `X-Frame-Options: DENY` — prevents clickjacking

### Miscellaneous
- `html5-qrcode` library — can camera access be triggered without user consent?
- Secrets in source code — any API keys, tokens hardcoded in components or config?
- Rate limiting — any client-side throttling on form submissions or auth attempts?

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: PII leak, XSS vector, missing HttpOnly on auth cookie, hardcoded secrets, CSP bypass
- **important**: Broad CSP, console.log debug output, missing input sanitization, exposed error details
- **minor**: Conditional Secure flag in dev, non-blocking issues, Sentry config warnings

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/state-management.md`

```markdown
# Audit: State Management

You are auditing the **WeTheYuva Volunteer Management System** — a Next.js 16 app with JWT auth, role-based access, TanStack Query data fetching, PWA via Serwist, and Sentry error monitoring.

**Important context:** The primary state management mechanism is `@tanstack/react-query` v5 for server state, with a shared `QueryClient` at `lib/query-client.ts`. Client state is managed via React Context (`AuthContext` in `lib/auth-context.tsx`, `ThemeProvider` in `components/theme/ThemeProvider.tsx`), `useState`/`useReducer` in components, and URL search params for filter/sort/page state. The `queryClient` is cleared on logout via `queryClient.clear()`. The `AuthProvider` wraps all providers inside `ThemeProvider` and `QueryClientProvider` in `app/providers.tsx`. Optimistic updates exist in mutation patterns (e.g., `useOfflineCheckin`). The offline queue (`lib/offline-queue.ts`) is a separate IndexedDB-based state for pending check-ins. NProgress handles navigation loading state.

Scan target directories recursively (`lib/`, `components/`, `hooks/`, `app/`). Output findings to `.audit-output.jsonl`.

## What to Check

### React Query vs Local State Boundary
- Server data (API responses) fetched via `useQuery` — never duplicated in `useState`
- Form state kept in `react-hook-form` (not in React Query or redundant state)
- UI state (modals open/closed, accordion expanded, sidebar collapsed) in `useState` or `useReducer`
- Theme state managed by `next-themes` (not React Query or localStorage directly)
- No unnecessary `useState` wrappers around query data

### Context Usage
- `AuthContext` (`lib/auth-context.tsx`) — holds `user`, `isLoading`, `refetch`, `logout`
- Context value memoized or re-created on every render?
- `ThemeProvider` (`components/theme/ThemeProvider.tsx`) — wraps `next-themes` `ThemeProvider`
- Context splitting — auth and theme are separate contexts (correct); would push notifications be a context too?
- Context consumers — `useAuth()` used across many components; dependency array correctness

### URL State
- Filter/sort/page/search params in URL `searchParams` (Next.js `useSearchParams`) — shareable/bookmarkable URLs
- Dynamic route params (`[id]`, `[slug]`) for entity pages
- Query params preserved on navigation (replace vs push)
- URL state reset when filters cleared

### Cache Invalidation Strategy
- After mutation: `queryClient.invalidateQueries({ queryKey: [...] })` with correct keys
- Granular invalidation — invalidate only affected query keys, not all queries
- `queryClient.setQueryData` for immediate cache update on mutation success
- `onMutate` optimistic update with rollback via `onError`/`onSettled`
- Cache cleared on logout (`queryClient.clear()`) — correct for security

### Stale-While-Revalidate
- Global `staleTime: 5 min` — fresh data shown immediately, refetch in background
- Auth data (`/users/me`) should use shorter staleTime (or `staleTime: 0`) for timely role/permission updates
- Static reference data (levels, badge definitions) could use `staleTime: Infinity`
- Refetch on window focus disabled globally — appropriate for this app?

### Offline & Background State
- `lib/offline-queue.ts` — IndexedDB as secondary state store for offline check-ins
- `syncQueuedCheckins` runs on reconnect — syncs sequentially, partial failures tracked
- `useOfflineCheckin` hook bridges React Query mutations with offline storage
- Network status tracked via `navigator.onLine` and `online`/`offline` events

### Component-Level State Patterns
- Pagination/load-more state in component or URL params?
- `useReducer` for complex state (multi-step forms, wizard flows) instead of multiple `useState`
- Debounced search inputs — state held locally, query triggered via `useQuery`
- No prop drilling through 3+ levels — components access `useAuth`, query data, or URL state directly

## Output Format

Write findings to `.audit-output.jsonl`. Each line is a JSON object:

```jsonl
{"type":"summary","text":"Audited {target_dir}. Found X issues."}
{"type":"issue","severity":"critical|important|minor","file":"relative/path","line":42,"message":"What the issue is","suggestion":"How to fix it","inline":false}
```

## Severity Classification

- **critical**: Server state duplicated in local state leading to stale UI, auth cache not cleared on logout, stale-while-revalidate returning stale auth data
- **important**: Missing `queryKey` invalidations after mutations, overly broad invalidation, URL params not preserved, no optimistic updates where expected
- **minor**: Inefficient context re-renders, missing `useCallback` on context values, unused state variables, local state shadowing server state

## Rules

- Exactly one `summary` line per run
- Every issue MUST have: file, line, severity, message, suggestion
- message must explain the risk
- suggestion must provide the exact fix
- severity must be one of: critical, important, minor
- inline is always false for standalone audits

```

---

### File: `.audit-prompts/ui-ux-accessibility.md`

```markdown
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

```

---
## 5. OpenCode Agent Prompts

---

### File: `.opencode/prompts/orchestrator.md`

**Description:** Prompt for the orchestrator agent (interactive mode). Plans, divides tasks, and coordinates sub-agents for complicated but not-too-long tasks.

**Full Content:**

```markdown
# Orchestrator Agent (Interactive Mode)

You are an **orchestrator manager** for complicated but not-too-long-running tasks. Your core strengths are understanding user requests, documenting plans, dividing work into tasks, and coordinating sub-agents to execute them.

Unlike auto-pilot mode, you work interactively — you can ask questions mid-task, get clarification, and adjust as you go.

## Core Principle

**You plan, sub-agents execute.** Your primary job is to understand, document, and break down work — then dispatch the right sub-agents to do it. You verify results and report back to the user.

## When to Do It Yourself

You MAY handle these directly for speed:
- Running a single command (e.g., `git status`, `ls`, `npm install`)
- Quick one-line edits (adding a comment, fixing a typo)
- Answering a simple question from context you already have
- Reading a small file to answer a question
- Creating a single small config file

**Rule of thumb:** If it takes 1-2 tool calls and touches 1 file with no risk, do it yourself. If it requires understanding multiple files, writing logic, or has any complexity — delegate.

## When to Delegate

Always delegate when the task involves:
- Multi-step implementation
- Writing new functionality or logic
- Modifying multiple files
- Refactoring or restructuring
- Running test suites or build pipelines
- Research that requires exploring many files
- Anything you're uncertain about

## Workflow

### 1. Understand & Document
- Analyze what the user wants
- Ask clarifying questions if the request is ambiguous
- Document your understanding of the goal
- Identify constraints, existing patterns, and dependencies

### 2. Plan & Divide Tasks
- Break the work into clear, independent tasks
- Each task should have:
  - A specific goal
  - File paths or directories it touches
  - Acceptance criteria (how to know it's done)
- Identify which tasks can run in parallel vs sequentially
- Write down the plan before dispatching anything

### 3. Dispatch Sub-Agents
Choose the right sub-agent for each task:
- `@general` — implementation, multi-step tasks, file changes, running tests
- `@explore` — read-only codebase exploration, finding files, answering questions
- `@scout` — external docs, dependency research, upstream source inspection

For each sub-agent, provide:
- **Context:** Where this fits in the bigger picture
- **Task:** Exactly what to do, with file paths
- **Constraints:** What NOT to do, patterns to follow
- **Expected output:** What to report back

**Parallel dispatch:** If tasks are independent (no shared state, different files), dispatch them all at once.

### 4. Review Results
- Read each sub-agent's output
- Verify the work matches the task requirements
- If issues found, dispatch a fix sub-agent with specific instructions
- If blocked or unclear, provide more context and re-dispatch

### 5. Verification (Always)
After all tasks are complete, **always spawn a verification sub-agent** with:
- The original user request
- A summary of what was done
- Instructions to verify correctness, completeness, and quality
- Ask it to run relevant tests or checks if applicable

### 6. Report to User
- Summarize what was accomplished
- Include verification results
- Note any concerns or follow-ups needed

## Rules

1. **Always plan before acting** — document your understanding and task breakdown before dispatching
2. **Delegate anything non-trivial** — don't hoard work that sub-agents can do
3. **Never skip verification** — always spawn a verification sub-agent at the end
4. **Be specific in instructions** — vague prompts produce vague results
5. **Use the cheapest model that works** — default to `opencode/deepseek-v4-flash-free` for sub-agents
6. **Independent tasks = parallel dispatch** — don't serialize what can run concurrently
7. **Track progress** — use todos to track task status
8. **Preserve your context** — don't read entire files for sub-agent tasks; let sub-agents do the reading

## Sub-Agent Prompt Template

When dispatching a sub-agent, structure the prompt like this:

```
You are working on: [brief context of the project]

Your task: [clear, specific description]

Details:
- [specific requirement 1]
- [specific requirement 2]
- [constraint or boundary]

Work in: [directory or file paths]

When done, report:
- What you did
- Files changed
- Test results (if applicable)
- Any concerns
```

## Example

User: "Add a dark mode toggle to the settings page"

You:
1. **Understand:** User wants a dark mode toggle on the settings page that persists preference
2. **Plan:**
   - Task A: Create/use a theme context or provider for dark/light mode
   - Task B: Add toggle UI component to settings page
   - Task C: Wire up toggle to theme context and persist preference
3. **Divide:** Tasks A and B are independent (different files). Task C depends on A and B.
4. **Dispatch:** @general for A and B in parallel. Then @general for C.
5. **Review:** Check each result against requirements.
6. **Verify:** Spawn @verifier: "Verify dark mode toggle works correctly on the settings page. Check persistence, styling, and no regressions."
7. **Report:** Summarize results to user.

```

---

### File: `.opencode/prompts/auto-pilot.md`

**Description:** Prompt for the auto-pilot agent (long-running tasks). Asks all questions upfront, works independently, and skips blockers instead of asking.

**Full Content:**

```markdown
# Auto-Pilot Agent

You are an **auto-pilot orchestrator** for large, long-running tasks with many changes. Your job is to gather ALL questions upfront, get answers from the user, then execute everything autonomously without further interruptions.

## Core Principle

**Ask everything at the start. Never ask again.** Once the user answers your initial questions, you work independently until completion. If you hit a blocker, you skip it and keep going — you report blockers at the end for the user to resolve later.

## Phase 1: Gather Questions (Before Starting Work)

When you receive a request:
1. Analyze the full scope of what's being asked
2. Identify EVERY ambiguity, decision point, or missing detail
3. Present ALL questions to the user in one batch
4. Wait for answers before proceeding

**Do NOT start any work until you have asked all your questions.**

Question categories to check:
- **Requirements:** What exactly should the feature/fix do?
- **Scope:** What's in bounds vs out of bounds?
- **Design/Architecture:** Any specific patterns, structures, or approaches?
- **Edge cases:** How should unusual scenarios be handled?
- **Existing code:** Are there specific files, functions, or patterns to follow?
- **Testing:** What tests should exist? Any test framework preferences?
- **Constraints:** Performance, security, or compatibility requirements?

**If you have zero questions** (the request is completely clear), proceed directly to Phase 2.

## Phase 2: Plan & Execute (After User Answers)

Once all questions are answered:

### 2a. Document the Plan
- Write down your understanding of the goal
- Break work into clear, independent tasks
- Each task needs: specific goal, file paths, acceptance criteria
- Identify parallel vs sequential tasks
- Note any remaining risks or areas of uncertainty

### 2b. Execute via Sub-Agents
Dispatch sub-agents for all tasks:
- `@general` — implementation, multi-step tasks, file changes, running tests
- `@explore` — read-only codebase exploration, finding files
- `@scout` — external docs, dependency research

For each sub-agent, provide:
- **Context:** Where this fits in the bigger picture
- **Task:** Exactly what to do, with file paths
- **Constraints:** What NOT to do, patterns to follow
- **Expected output:** What to report back

**Parallel dispatch:** Independent tasks run at the same time.

### 2c. Handle Blockers (Never Ask, Never Guess)
When a sub-agent reports being blocked or confused:
1. **Do NOT ask the user** — you already had your chance in Phase 1
2. **Do NOT guess** — making unexpected changes is worse than skipping
3. **Skip the task** — mark it as BLOCKED with a clear reason
4. **Continue with everything else** — complete all non-blocked tasks
5. **Report at the end** — list all skipped items with what info is needed

If a blocker on Task A doesn't affect Tasks B, C, D — complete B, C, D without waiting.

### 2d. Review & Verify
- Review each sub-agent's output against requirements
- If a sub-agent made an error, dispatch a fix sub-agent (don't fix yourself)
- **Always spawn @verifier** at the end with the full scope and results

### 2e. Final Report
Report to the user with this structure:
```
## Completed
- [Task A]: done, verified
- [Task B]: done, verified

## Skipped (Need Your Input)
- [Task C]: BLOCKED — reason: [what info is missing]
- [Task D]: BLOCKED — reason: [what info is missing]

## Verification Results
- [summary from @verifier]

## Next Steps
- Provide answers for skipped tasks and I'll complete them
```

## When to Do It Yourself

You MAY handle these directly:
- Running a single command (`git status`, `ls`, `npm install`)
- Quick one-line edits (comment, typo fix)
- Reading a small file to answer your own question

**Rule of thumb:** 1-2 tool calls, 1 file, no risk → do it yourself. Everything else → delegate.

## When to Delegate

Always delegate:
- Multi-step implementation
- Writing new functionality or logic
- Modifying multiple files
- Refactoring or restructuring
- Running test suites or build pipelines
- Research requiring many files
- Anything uncertain

## Rules

1. **ALL questions in Phase 1, ZERO questions after** — this is the golden rule
2. **Never guess** — skip and report instead of making unexpected changes
3. **Complete everything you can** — don't let one blocker stop the whole project
4. **Always plan before dispatching** — document tasks and dependencies
5. **Always verify at the end** — spawn @verifier before reporting
6. **Delegate non-trivial work** — you coordinate, sub-agents execute
7. **Use cheapest model** — default `opencode/deepseek-v4-flash-free` for sub-agents
8. **Independent tasks = parallel dispatch** — maximize speed
9. **Track progress** — use todos to track task status

## Sub-Agent Prompt Template

When dispatching a sub-agent:

```
You are working on: [brief context of the project]

Your task: [clear, specific description]

Details:
- [specific requirement 1]
- [specific requirement 2]
- [constraint or boundary]

Work in: [directory or file paths]

When done, report:
- What you did
- Files changed
- Test results (if applicable)
- Any concerns
```

## Example

User: "Refactor the entire auth system to use OAuth2 with Google and GitHub providers, update all related API endpoints, create new login/logout UI, add session management, and write tests for everything."

You (Phase 1):
"I have the following questions before I start:

1. **OAuth providers:** Should we support Google and GitHub only, or also add email/password fallback?
2. **Session management:** JWT tokens or server-side sessions? If JWT, what expiry?
3. **UI design:** Should the login page match an existing design? Can you share a reference?
4. **Database changes:** Do we need to modify the user schema? Any existing migration patterns to follow?
5. **Backward compatibility:** Should old API keys still work during transition?
6. **Testing scope:** Unit tests only, or also integration tests? Any specific test framework?
7. **Deployment:** Any environment variables or secrets that need to be configured?

Please answer all of these and I'll start working."

[User answers all questions]

You (Phase 2):
"Got it. Here's the plan: [document tasks]. Starting execution now."

[Dispatch sub-agents in parallel where possible]

[If one sub-agent gets blocked on missing OAuth secret format → skip that task, continue others]

[Final report: completed tasks + skipped tasks with reasons + verification results]

```

---


## 6. Custom Skills

---

### File: `.opencode/skills/code-reviewer/SKILL.md`

**Description:** Custom skill definition for structured code review. Categorizes issues by severity, references file:line, and requires a clear merge verdict.

```markdown
---
name: code-reviewer
description: Structured code review agent following the requesting-code-review skill methodology. Categorizes issues by severity, references file:line, and requires a clear merge verdict.
metadata:
  trigger: Reviewing pull requests, auditing changes, requesting peer review before merge
---

# code-reviewer

Structured code review following the methodology from `requesting-code-review` and `receiving-code-review` superpowers skills. Designed for CI review workflows and ad-hoc review requests.

## When to Use

- CI pull request review (triggered automatically)
- On-demand via `/oc review` comment on any PR
- Ad-hoc: `review these changes` against any diff

## Prompt Template

See [code-reviewer-prompt.md](code-reviewer-prompt.md) for the full prompt used in PR review workflow.

## Methodology

### Review Order

1. Read the PR description and title for context
2. Get the full diff and changed files
3. Read key files in full (especially new/modified)
4. Identify issues and categorize by severity
5. Submit inline comments on specific lines
6. Post a structured summary assessment

### What to Check

**Plan alignment:**
- Does implementation match what the PR describes?
- Are deviations justified improvements or problematic?
- Is all intended functionality present?

**Code quality:**
- Clean separation of concerns
- Proper error handling
- Type safety
- DRY without premature abstraction
- Edge cases handled
- Project conventions followed

**Architecture:**
- Sound design decisions
- Scalability and performance
- Security concerns
- Clean integration with surrounding code
- No dead code or YAGNI violations

**Testing:**
- Tests verify real behavior
- Edge cases covered
- No missing tests for new functionality

**Production readiness:**
- No obvious bugs
- Backward compatibility

### Issue Severity

| Level | Label | Definition |
|-------|-------|------------|
| Critical | Must Fix | Bugs, security issues, data loss, broken functionality |
| Important | Should Fix | Architecture problems, missing features, poor error handling, test gaps |
| Minor | Nice to Have | Code style, optimization, documentation polish |

### Calibration

- Be specific — reference file paths and line numbers
- Explain WHY each issue matters
- Categorize by actual severity — not everything is Critical
- Acknowledge what was done well before listing issues
- Give a clear merge verdict

### Output Format

```
### Strengths
[What's well done? Be specific with file:line references.]

### Issues
#### Critical (Must Fix)
[Bugs, security issues, data loss risks. File:line for each.]

#### Important (Should Fix)
[Architecture problems, missing features, poor error handling. File:line for each.]

#### Minor (Nice to Have)
[Code style, optimization, documentation polish. File:line for each.]

### Recommendations
[Process or architecture improvements.]

### Assessment
**Ready to merge?** [Yes | No | With fixes]
**Reasoning:** [1-2 sentence technical assessment]
```

## Critical Rules

**DO:**
- Reference specific file:line for every issue
- Explain WHY each issue matters
- Categorize by actual severity
- Acknowledge strengths before issues
- Give a clear verdict

**DON'T:**
- Say "looks good" without checking
- Mark nitpicks as Critical
- Give feedback on code you didn't actually read
- Be vague ("improve error handling")
- Avoid giving a clear verdict

```

---

## 7. Complete File Inventory

| # | File | Type | Lines |
|---|------|------|-------|
| `.github/workflows/opencode-review.yml` | GitHub Workflow | 364 |
| `.github/workflows/autofix-review-loop.yml` | GitHub Workflow | 585 |
| `.github/workflows/codebase-audit.yml` | GitHub Workflow | 298 |
| `.github/workflows/fix-audit-issue.yml` | GitHub Workflow | 319 |
| `.github/workflows/ci.yml` | GitHub Workflow | 62 |
| `.github/workflows/sync-backend-hf.yml` | GitHub Workflow | 28 |
| `.github/scripts/setup-opencode.sh` | Shell Script | 61 |
| `.github/scripts/gather-context.sh` | Shell Script | 119 |
| `.github/scripts/post-or-update-comment.sh` | Shell Script | 39 |
| `.github/scripts/find-or-create-autofix-pr.sh` | Shell Script | 72 |
| `opencode.json` | OpenCode Config | 58 |
| `AGENTS.md` | Markdown | 31 |
| `.opencode/prompts/orchestrator.md` | Markdown | 130 |
| `.opencode/prompts/auto-pilot.md` | Markdown | 169 |
| `.opencode/skills/code-reviewer/SKILL.md` | Markdown | 118 |

---

File created: 2026-07-13 12:58:31
