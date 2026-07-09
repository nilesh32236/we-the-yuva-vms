# Workflow Architecture

## Workflow Roles

| Workflow | Triggers | Purpose | Token |
|---|---|---|---|
| `codebase-audit.yml` | `workflow_dispatch`, schedule | Scans codebase for issues per category prompt, creates 1 consolidated issue | `GH_PAT \|\| GITHUB_TOKEN` |
| `fix-audit-issue.yml` | `issues: [opened, labeled]`, issue `/fix` | Auto-fixes audit issues. OpenCode reads issue → applies fix → creates PR | `GH_PAT \|\| GITHUB_TOKEN` |
| `opencode-review.yml` | `pull_request: [opened, synchronize]`, PR `/oc`, `/review`, `/fix` | Comprehensive review + auto-fix on PRs. Posts inline review, pushes fixes | `GH_PAT \|\| GITHUB_TOKEN` |
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
  └─ pull_request: [opened] → opencode-review.yml

User comments /review or /fix on PR
  └─ issue_comment → opencode-review.yml

User comments /fix on issue
  └─ issue_comment → fix-audit-issue.yml
```

## Token Rules

- `GH_PAT` (when set) → triggers downstream workflows. Required for auto-triggering.
- `GITHUB_TOKEN` (fallback) → does NOT trigger downstream workflows. Works for manual `/fix`, `/oc`, `/review` commands.
- All `env.GH_TOKEN` and `env.GITHUB_TOKEN` refs use `${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}`.

## opencode-review.yml Modes

The workflow has two modes controlled by `OPENCODE_MODE` env variable:

| Trigger | Mode | Behavior |
|---|---|---|
| `pull_request: [opened, synchronize]` | review | Review + post comments only |
| PR `/oc` | review | Review + post comments only |
| PR `/review` | review | Review + post comments only |
| PR `/fix` | fix | Review + post comments + apply fixes + push to branch |

Mode logic: `${{ (github.event_name == 'issue_comment' && contains(github.event.comment.body || '', '/fix')) && 'fix' || 'review' }}`

The agent reads `${{ env.OPENCODE_MODE }}` in the prompt and acts accordingly.

## Prompt Quality Tiers

| Tier | Prompt | Characteristics |
|---|---|---|
| **Gold** | `opencode-review.yml` | Sub-agent batching, 8+ review dimensions, severity calibration, JSONL output, safety rules, strengths/verdict |
| **Comprehensive** | `.audit-prompts/*.md`, `code-reviewer-prompt.md` | Domain-specific depth, good structure, severity calibration, JSONL output |
| **Adequate** | `review-autofix-pr.yml` | Basic review dimensions, safety rules, verification steps. No batching, no severity tier (flat) |
| **Basic** | `fix-audit-issue.yml`, `codebase-audit.yml` (delegator) | Minimal structure, relies on external files for depth |
