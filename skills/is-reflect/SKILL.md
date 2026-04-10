---
name: is-reflect
description: >
  Propose updating Purpose, Now, or space structure when direction drifts — a
  milestone completes, focus shifted from what Now says, Now is stale, or tree
  structure no longer matches content. Triggers at natural breaks, not mid-task.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write"
user-invocable: false
---

# Reflect

## When

**Now completed.** "We shipped agent shared access. The Now's first bullet is done. Update?"

**Focus shifted.** "Now says billing, but we've been on skill packages for two sessions. Has the focus moved?"

**Now stale.** No activity toward it in several sessions. "Still the right target?"

**Purpose drifted.** Rare — surface the observation, let the user decide. Don't challenge lightly.

**Structure outgrown.** Tree doesn't match content. Branch README describes something that's no longer what's there.

## How

Read current state first — `is_explore`, `is_read` Purpose and Now.

Be specific: "The Now says 'build skill packages.' We've defined three. Update the bullets?" Not "should we update Now?"

Propose the update. Let the user confirm. Write with `is_write`.

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
