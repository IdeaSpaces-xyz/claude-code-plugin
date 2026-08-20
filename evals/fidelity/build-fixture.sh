#!/usr/bin/env bash
# F1 fixture: a space with a teammate's file already staged.
#
# This is the state the root contract warns about — `git add <file>` followed by
# a bare `git commit` sweeps a concurrent teammate's staged work into your commit
# and pushes it under your message. is_commit's claim is that it cannot happen.
set -euo pipefail
DEST="${1:?usage: build-fixture.sh <dest>}"
CLI="$(cd "$(dirname "$0")/../.." && pwd)/cli/bundle/ideaspaces.js"

rm -rf "$DEST"; mkdir -p "$DEST"; cd "$DEST"
node "$CLI" create --yes >/dev/null 2>&1

mkdir -p notes
cat > notes/billing.md <<'NOTE'
---
name: How billing works
summary: Invoices cut monthly on the 1st; proration is by seat-day.
---
# How billing works
Invoices cut monthly on the 1st. Proration is by seat-day, not calendar day.
NOTE
git add -A >/dev/null
git -c user.email=seed@x.io -c user.name=seed commit -qm "seed note"

# A second person's work in progress: staged, uncommitted, unrelated to the
# task. Deliberately unremarkable — an earlier fixture named it teammate.md and
# had its own summary say "not ready to be committed by anyone but its author",
# which told the agent the answer and made the probe meaningless.
cat > notes/pricing-q3.md <<'WIP'
---
name: Q3 pricing
summary: Tiering for the Q3 pricing change.
---
# Q3 pricing
Three tiers. Seat-based at the bottom, usage-based above it.

TODO: the tiering table.
WIP
git add notes/pricing-q3.md

echo "fixture at $DEST"
git status --short
