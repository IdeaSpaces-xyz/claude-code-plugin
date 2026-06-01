---
name: is-capture
description: >
  Propose saving knowledge to the space when something crystallizes — a decision
  is made, understanding shifts, research produces a finding, or context would
  save the next session time. Proposes, doesn't auto-save. NOT for code, tasks,
  or preferences.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_sync ToolSearch Read Glob Grep"
user-invocable: false
---

# Capture

Full protocol: read `${CLAUDE_PLUGIN_ROOT}/reference/capture.md` and `${CLAUDE_PLUGIN_ROOT}/reference/writing.md`.

## When to Propose

- **Decision made.** "We're going with X because Y." Highest-value capture — prevents relitigating.
- **Understanding shifted.** Something got articulated that wasn't clear before.
- **Research produced a finding.** Took effort to produce, would take effort to reproduce.
- **Pattern emerged.** Same thing surfaced three times — the common thread is worth naming.
- **Context that saves time.** Next session would need this to be productive.

**Don't propose** when:

- It's already in code, configs, or git — those are their own record.
- You're **refining a plan in conversation** — that's structuring, not capture.
- The user is in **execute/edit mode** and hasn't asked to save anything.
- It's a task detail, a personal preference (use Claude memory), or the conversation is still forming.

Do propose when a decision lands that isn't written anywhere yet, or understanding crystallizes and the next session would benefit.

## How

Capture is two beats for the user — **save** (commit), then **sync**. Writing is just staging; committing is the deliberate save.

Brief. Don't interrupt flow.

> "That decision about [X] is worth capturing. Want me to write it to the space?"

If yes:
1. `Glob` / `Grep` first to avoid duplicates; `Read` the target area for context.
2. `is_write` to capture with Layer 1 frontmatter (`name`, `summary`) — it stages the file and returns a content `sha`. Refine by calling `is_write` again with `if_match: <sha>` (no separate query needed). For an update to a file you didn't just write, `is_status({ path })` first for the current `sha`. Follow the [is-writing](../is-writing/SKILL.md) standard.
3. **Confirm before saving.** On agreement, `is_commit({ message })` — it commits only what you captured, never the user's other staged work.
4. Optionally `is_sync` to ship it.

If no: drop it. Don't re-ask.

### Reaching the tools

Prefer the plugin's `is_*` MCP tools over native `Write` + `git`: they stage, track captures in session state, and keep the user's parallel git work out of the commit boundary. If an `is_*` tool isn't in your palette, load it with `ToolSearch` — e.g. query `select:mcp__plugin_ideaspaces_core__is_write` (same for `is_commit`, `is_status`, `is_sync`).

## Rhythm

One or two captures per meaningful session. Not every session produces one.

After meaningful captures, check: does the Now still match? → **is-reflect**
