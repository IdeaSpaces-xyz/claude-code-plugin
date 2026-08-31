---
name: is-capture
description: >
  Write something down so it is not lost — a decision, a finding, a piece of
  context worth keeping. Use when someone says write this down, note this, save
  this, keep this somewhere, don't let me forget, remember this, put this in my
  notes, or add this to the knowledge base; or when a decision has just been made
  that would be expensive to relitigate. Not for saving an ordinary source or
  config file — that is a plain file write.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_push mcp__plugin_ideaspaces_core__is_pull ToolSearch Read Glob Grep Edit Write Bash"
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
| Durable navigation frame over selected territory | `is_write` with a deliberate protocol `map` block |
| Purpose / Now / Note-style markdown refinement | `is_write` with a safe-update `sha` |
| Existing spec/doc/README/agent contract edit | native `Edit` / `Write`, then `is_commit` with explicit paths |
| File move/delete | native `Bash` (`git mv`, `rm`), then `is_commit` with explicit paths |
| User asks to share/push after capture | **is-push** / `is_push` |

`is_write` is a capture primitive, not the outer intent. Use it when the target is a Note that should carry Layer 1 frontmatter (`name`, `summary`), optional Layer 2 fields (`tags`, `attached_to`), and—only for a map-note—an optional protocol `map` block. Use native edits for README/spec/docs and `_agent/` primitives that are not Note-style files; still end at the same capture boundary with `is_commit` unless the user explicitly wants local draft state.

### Map-note captures

A map-note is an ordinary Note whose prose is a useful legend and whose `map` block deliberately selects addresses. Use it when the durable understanding is *what territory matters from this vantage*, not for every Note that happens to mention files.

- Supply the structured `map` argument to `is_write`; never hand-splice YAML into `content`.
- Git roots need an already-known `space` or `root_node_id` plus an exact full commit SHA. Members carry positions and disclosure `depth`; open addresses may carry name/summary only.
- Selection is an agreement decision. Do not infer a Map from every file read or tool call.
- To inspect candidate local territory, run `node "${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js" map <repo> --depth full --json`. This is a working-tree observation, not an automatic capture: review `portable`, `dirty`, and `local_only_paths`, then deliberately select what belongs in the map-note.
- Capture never resolves, clones, or fetches roots. `is_write` validates and canonicalizes the block before touching the file or index.
- Omitting `map` on a later safe refinement preserves an existing Map. A Map-unaware reader still gets the body legend.

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
5. Commit with `is_commit({ message, all: true })` for paths captured by this session's `is_write` calls, or explicit `paths` for native edits. `all` never adopts other staged knowledge.
6. Optionally use **is-push** / `is_push` to share it (or **is-pull** first to get the latest).

If the user says no, drop it and don't re-ask.

### Reaching the tools

Prefer the plugin's `is_*` MCP tools for frontmatter-aware Note writes and the explicit commit boundary. Use native tools for ordinary docs/specs, moves, and deletes, then commit those exact paths with `is_commit`. If an `is_*` tool isn't in your palette, load it with `ToolSearch` — e.g. `select:mcp__plugin_ideaspaces_core__is_write` (same for `is_commit`, `is_status`, `is_push`, `is_pull`).

## Commit message

Use the space's commit convention when present (for example `_agent/skills/commit.md`). It defines the message shape; don't restate it here.

## Rhythm

One or two captures per meaningful session. Not every session produces one.

After meaningful captures, check: does Now still match? → **is-reflect**
