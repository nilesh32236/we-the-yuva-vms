# Workflow Architecture

## Workflow Roles

| Workflow | Triggers | Purpose | Token |
|---|---|---|---|
| `codebase-audit.yml` | `workflow_dispatch`, schedule | Scans codebase for issues per category prompt, creates 1 consolidated issue | `GH_PAT \|\| GITHUB_TOKEN` |
| `fix-audit-issue.yml` | `issues: [opened, labeled]`, issue `/fix` | Auto-fixes audit issues. OpenCode reads issue → applies fix → creates PR | `GH_PAT \|\| GITHUB_TOKEN` |
| `opencode-review.yml` | `pull_request: [opened, synchronize]`, PR `/oc`, `/review` | Comprehensive review. Posts inline review + Fix Ticket comment (checklist of issues) | `GH_PAT \|\| GITHUB_TOKEN` |
| `opencode-fix.yml` | PR `/fix` | Reads Fix Ticket comment, fixes each issue, updates ticket with ✅/❌, pushes to PR branch | `GH_PAT \|\| GITHUB_TOKEN` |
| `review-autofix-pr.yml` | `pull_request: [opened, synchronize, labeled]` | Lightweight review of autofix PRs. Labels `autofix:reviewed` or `autofix:needs-manual-review` | `GH_PAT \|\| GITHUB_TOKEN` |

## Event Chain

```
codebase-audit.yml
  └─ gh issue create (GH_PAT) ──→ issues: [opened]
       └─ fix-audit-issue.yml
            └─ OpenCode fixes, creates PR with autofix label
                 └─ pull_request: [labeled] → review-autofix-pr.yml
                 └─ pull_request: [opened]   → opencode-review.yml (comprehensive)

User creates PR manually
  └─ pull_request: [opened] → opencode-review.yml (review)
       └─ Posts Fix Ticket comment with issue checklist

User comments /review or /oc on PR
  └─ issue_comment → opencode-review.yml (review)
       └─ Posts Fix Ticket comment with issue checklist

User comments /fix on PR
  └─ issue_comment → opencode-fix.yml
       └─ Reads Fix Ticket → fixes each issue → updates ticket with ✅/❌
       └─ Pushes fixes to PR branch
       └─ Posts fix review

User comments /fix on issue
  └─ issue_comment → fix-audit-issue.yml
```

## Token Rules

- `GH_PAT` (when set) → triggers downstream workflows. Required for auto-triggering.
- `GITHUB_TOKEN` (fallback) → does NOT trigger downstream workflows. Works for manual `/fix`, `/oc`, `/review` commands.
- All `env.GH_TOKEN` and `env.GITHUB_TOKEN` refs use `${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}`.

## Fix Ticket Flow

The "Fix Ticket" bridges review and fix workflows:

1. **Review** (`opencode-review.yml`): After posting the PR review, also posts a **Fix Ticket** comment — a checklist of all issues found
2. **Fix** (`opencode-fix.yml`): When `/fix` is triggered, reads the Fix Ticket, parses each issue, applies fixes, updates the ticket with ✅ (fixed) or ❌ (could not fix)

The ticket comment is a regular PR comment (not a review), so it can be **edited** by the fix workflow to update checkbox states. This gives clear visibility into what was fixed.

## Prompt Quality Tiers

| Tier | Prompt | Characteristics |
|---|---|---|
| **Gold** | `opencode-review.yml` | Sub-agent batching, 8+ review dimensions, severity calibration, JSONL output, safety rules, strengths/verdict |
| **Comprehensive** | `.audit-prompts/*.md`, `code-reviewer-prompt.md` | Domain-specific depth, good structure, severity calibration, JSONL output |
| **Adequate** | `review-autofix-pr.yml` | Basic review dimensions, safety rules, verification steps. No batching, no severity tier (flat) |
| **Basic** | `fix-audit-issue.yml`, `codebase-audit.yml` (delegator) | Minimal structure, relies on external files for depth |
