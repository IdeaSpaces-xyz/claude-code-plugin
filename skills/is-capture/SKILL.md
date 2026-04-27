---
name: is-capture
description: >
  Propose saving knowledge to the space when something crystallizes — a decision
  is made, understanding shifts, research produces a finding, or context would
  save the next session time. Proposes, doesn't auto-save. NOT for code, tasks,
  or preferences.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_write Read Glob Grep"
user-invocable: false
---

# Capture

## When to Propose

- **Decision made.** "We're going with X because Y." Highest-value capture — prevents relitigating.
- **Understanding shifted.** Something got articulated that wasn't clear before.
- **Research produced a finding.** Took effort to produce, would take effort to reproduce.
- **Pattern emerged.** Same thing surfaced three times — the common thread is worth naming.
- **Context that saves time.** Next session would need this to be productive.

**Don't propose** when it's already in code/git, is a temporary task detail, is a personal preference (use Claude memory), or the conversation is still forming.

## How

Brief. Don't interrupt flow.

> "That decision about [X] is worth capturing. Want me to write it to the space?"

If yes: `Glob` / `Grep` first to avoid duplicates, `Read` the target area for context, then `is_write` to capture with Layer 1 frontmatter (`name`, `summary`). Follow [is-writing](../is-writing/SKILL.md) standard.

If no: drop it. Don't re-ask.

## Rhythm

One or two captures per meaningful session. Not every session produces one.

After meaningful captures, check: does the Now still match? → **is-reflect**
