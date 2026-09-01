#!/bin/sh
# Regenerates the coverage data from the developer portal and the GitHub org.
# Run by hand, or on weekday mornings by com.globalpayments.sample-coverage.plist.
set -eu

# launchd starts with a bare PATH; node and gh both live in Homebrew's bin.
PATH=/opt/homebrew/bin:/usr/bin:/bin
export PATH

cd "$(dirname "$0")/.."

echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
node scripts/fetch-docs.mjs
node scripts/fetch-repos.mjs
node scripts/build-coverage.mjs
