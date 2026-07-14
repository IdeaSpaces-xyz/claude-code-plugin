---
name: is-capture
description: >
  Preserve agreed understanding in the ideaspace when the user says capture,
  remember, save this, write this into the space, or when a decision/finding has
  crystallized. The skill chooses the mechanism: `is_write` for Notes, native
  edits for existing docs/specs, then `is_commit` for the agreement boundary.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_push mcp__plugin_ideaspaces_core__is_pull ToolSearch Read Glob Grep Edit Write Bash"
user-invocable: false
---

# Capture

Capture is the agreement moment: conversation becomes shared state.

Do not make the user or agent choose between `Write`, `is_write`, `git add`, and `is_commit` at the top level. The intent is **capture**. This skill chooses the mechanism.

Canonical protocols: read `${CLAUDE_PLUGIN_ROOT}/reference/capture.md` and `${CLAUDE_PLUGIN_ROOT}/reference/writing.md` when the task needs the full capture and writing standards.

## When to Propose

- **Decision made.** "We're going with X because Y." Highest-value capture — prevents relitigating.
- **Understanding shifted.** Something got articulated that wasn't clear before.
- **Research produced a finding.** Took effort to produce, would take effort to reproduce.
- **Pattern emerged.** Same thing surfaced three times — the common thread is worth naming.
- **Context that saves time.** Next session would need this to be productive.

**Don't propose** when it's already in code/git, is a temporary task detail, is a personal preference, or the conversation is still forming.

## Mechanism Choice

| Situation | Use |
|---|---|
| New or updated knowledge Note | `is_write` — creates frontmatter, stages, tracks, and returns `sha` |
| Purpose / Now / Note-style markdown refinement | `is_write` with a safe-update `sha` |
| Existing spec/doc/README/agent contract edit | native `Edit` / `Write`, then `is_commit` with explicit paths |
| File move/delete | native `Bash` (`git mv`, `rm`), then `is_commit` with explicit paths |
| User asks to share/push after capture | **is-push** / `is_push` |

`is_write` is a capture primitive, not the outer intent. Use it when the target is a Note that should carry Layer 1 frontmatter (`name`, `summary`) and optional Layer 2 fields (`tags`, `attached_to`). Use native edits for README/spec/docs and `_agent/` primitives that are not Note-style files; still end at the same capture boundary with `is_commit` unless the user explicitly wants local draft state.

## How

Brief. Don't interrupt flow.

> "That decision about [X] is worth capturing. Want me to write it to the space?"

If yes:

1. Search first with `Glob` / `Grep` to avoid duplicates; `Read` the target area for context.
2. Choose the mechanism:
   - Note capture or Note-style refinement → `is_write`.
   - Existing README/doc/spec/contract refinement → native `Edit` / `Write`.
   - Moves/deletes → `Bash` (`git mv`, `rm`).
3. For `is_write` refinements, use safe updates:
   - first update to an existing file: `is_status({ path })` → use its `sha` as `if_match`
   - refinement of a file just written: use the previous `is_write` response's `sha`
   - `force: true` only after re-reading and reconciling divergent content
4. Show what changed when useful. The user confirms the capture boundary.
5. Commit with `is_commit({ message, all: true })` for staged knowledge, or explicit `paths` for native edits. Never sweep unrelated staged work.
6. Optionally use **is-push** / `is_push` to share it (or **is-pull** first to get the latest).

If the user says no, drop it and don't re-ask.

### Reaching the tools

Prefer the plugin's `is_*` MCP tools for frontmatter-aware Note writes and the explicit commit boundary. Use native tools for ordinary docs/specs, moves, and deletes, then commit those exact paths with `is_commit`. If an `is_*` tool isn't in your palette, load it with `ToolSearch` — e.g. `select:mcp__plugin_ideaspaces_core__is_write` (same for `is_commit`, `is_status`, `is_push`, `is_pull`).

## Commit message

Use the space's commit convention when present (for example `_agent/skills/commit.md`). It defines the message shape; don't restate it here.

## Rhythm

One or two captures per meaningful session. Not every session produces one.

After meaningful captures, check: does Now still match? → **is-reflect**
