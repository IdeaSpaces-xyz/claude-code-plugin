---
name: is-reflect
description: >
  Propose a coherence check on the space after a significant commit, or when
  direction drifts — milestone completes, focus shifted, Now stale, or tree
  structure outgrown. Offered as a readiness check (both sides decide whether
  to reflect now). Triggers at natural breaks or after state updates, not
  mid-task.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit ToolSearch Read Glob Grep Edit Write Bash"
user-invocable: false
---

# Reflect

Canonical protocols: read `${CLAUDE_PLUGIN_ROOT}/reference/awareness.md` and `${CLAUDE_PLUGIN_ROOT}/reference/guide.md` for the full awareness and guide posture.

Reflection is the trigger; recalibration is what it runs. Offered as a readiness check — both sides decide whether to reflect now or defer.

## When

**After a significant commit.** State just updated — propose a coherence check. "We just committed the repo lifecycle and thread vocabulary. Want to check the space still feels coherent now that state updated?" Both sides agree whether to reflect now or defer. Offered, not imposed. Skip for tiny commits (typo fixes, formatting, minor edits).

**Now completed.** "We shipped agent shared access. The Now's first bullet is done. Update?"

**Focus shifted.** "Now says billing, but we've been on skill packages for two sessions. Has the focus moved?"

**Now stale.** No activity toward it in several sessions. "Still the right target?"

**Purpose drifted.** Rare — surface the observation, let the user decide. Don't challenge lightly.

**Structure outgrown.** Tree doesn't match content. Branch README describes something that's no longer what's there.

## How

Read current state first — `Read` `_agent/purpose.md` and `_agent/now.md`. If either doesn't exist yet, that's the first reflection: the contract names them, so absence means direction hasn't been captured. Surface it and propose capturing the missing file before reflecting on what's there. Inspect recent activity with `Glob`, `Grep`, or `Bash` (`git diff`, `git log`) when needed.

Before asserting that something "shipped", "is implemented", or "is pending" based on a doc, check it against the code. The code may live in a sibling repo. Use `Grep`, `Bash`, and `Read` to compare the doc with implementation reality; treat status lines as hints, not authority.

Be specific: "The Now says 'build skill packages.' We've defined three. Update the bullets?" Not "should we update Now?"

Propose the update. Let the user confirm. Then use the right capture mechanism:

- Purpose / Now / Note-style markdown → `is_write` with a safe-update `sha` when refining.
- README / existing docs / `_agent/` contract files → native `Edit` / `Write`, then `is_commit` with explicit paths.
- Directory moves or deletes → `Bash` (`git mv`, `rm`), then `is_commit` with explicit paths.

Do not leave reflection edits uncommitted unless the user explicitly wants local draft state. If a required MCP tool isn't loaded, reach it through `ToolSearch`.

## What to Update

| Signal | Update |
|---|---|
| Target completed | Now — new target or remove done bullets |
| Focus shifted | Now — rewrite to match actual work |
| Understanding deepened | Purpose — sharpen (user must own this) |
| Structure outgrown | Directories, READMEs |

## When Not

Mid-task. Every session. When the user is in a hurry. Natural breaks only.

If Purpose needs a major rethink, that's `/is-setup` territory — re-elicit, don't patch.
