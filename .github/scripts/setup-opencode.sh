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

# Install opencode via npm
echo "Installing opencode@${OPENCODE_VERSION}..."
npm install -g "opencode@${OPENCODE_VERSION}" 2>&1 | tail -5

# Verify installation
OPENCODE_BIN=$(which opencode)
echo "OpenCode installed at: ${OPENCODE_BIN}"
opencode --version 2>/dev/null || echo "Version check skipped"

# Configure git for OpenCode
git config --global user.name "${GIT_USER_NAME:-nilesh32236}"
git config --global user.email "${GIT_USER_EMAIL:-nilesh32236@gmail.com}"

# Ensure .opencode directory exists
mkdir -p .opencode

echo "::endgroup::"
echo "OpenCode setup complete."
