#!/usr/bin/env bash
# mark-commit-reviewed.sh
# Marks a commit SHA as reviewed in the tracking file.
#
# Usage:
#   mark-commit-reviewed.sh <commit-sha> <tracking-file>

set -euo pipefail

COMMIT_SHA="$1"
TRACKING_FILE="${2:-.opencode/reviewed-commits.txt}"

mkdir -p "$(dirname "$TRACKING_FILE")"
touch "$TRACKING_FILE"

# Only add if not already present
if ! grep -q "^${COMMIT_SHA}$" "$TRACKING_FILE" 2>/dev/null; then
  echo "${COMMIT_SHA}" >> "$TRACKING_FILE"
  echo "Marked ${COMMIT_SHA} as reviewed"
else
  echo "${COMMIT_SHA} already marked as reviewed"
fi
