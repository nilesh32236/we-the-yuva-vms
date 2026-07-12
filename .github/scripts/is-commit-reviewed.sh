#!/usr/bin/env bash
# is-commit-reviewed.sh
# Checks if a commit SHA has already been reviewed.
# Uses a simple file-based tracking mechanism.
#
# Usage:
#   is-commit-reviewed.sh <commit-sha> <tracking-file>
#
# Returns:
#   exit 0 if already reviewed (prints "reviewed")
#   exit 1 if not reviewed (prints "not-reviewed")
#
# To mark a commit as reviewed after review completes:
#   mark-commit-reviewed.sh <commit-sha> <tracking-file>

set -euo pipefail

COMMIT_SHA="$1"
TRACKING_FILE="${2:-.opencode/reviewed-commits.txt}"

mkdir -p "$(dirname "$TRACKING_FILE")"
touch "$TRACKING_FILE"

if grep -q "^${COMMIT_SHA}$" "$TRACKING_FILE" 2>/dev/null; then
  echo "reviewed"
  exit 0
else
  echo "not-reviewed"
  exit 1
fi
