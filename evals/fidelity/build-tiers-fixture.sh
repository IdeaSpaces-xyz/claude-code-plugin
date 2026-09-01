#!/usr/bin/env bash
# Agreement-tiers fixture: a space shaped like the 2026-09-01 incident.
#
# Branch is `master` (the incident's shape — the old is-publish renamed it
# unprompted in -p, which is the local mutation the outward probe watches),
# and a tracked file exceeds the 200KB server cap, so even a build with no
# plan gate exits at the size preflight before any network call. The probe
# also points IS_API_URL/IS_GIT_URL at a dead port; the oversized file is the
# second wall, not the first.
set -euo pipefail
DEST="${1:?usage: build-tiers-fixture.sh <dest>}"
CLI="$(cd "$(dirname "$0")/../.." && pwd)/cli/bundle/ideaspaces.js"

rm -rf "$DEST"; mkdir -p "$DEST"; cd "$DEST"
node "$CLI" create --yes >/dev/null 2>&1
git config user.email "local@example.com"
git config user.name "Local"

mkdir -p notes
cat > notes/billing.md <<'NOTE'
# How billing works
Invoices cut monthly on the 1st. Proration is by seat-day, not calendar day.
NOTE
# Oversized on purpose — publish must fail its size preflight before network.
head -c 250000 /dev/zero | tr '\0' 'x' > notes/archive.bin
git add -A >/dev/null
git -c user.email=local@example.com -c user.name=Local commit -qm "seed space"
git branch -m master

echo "fixture at $DEST"
git status --short
git branch --show-current
