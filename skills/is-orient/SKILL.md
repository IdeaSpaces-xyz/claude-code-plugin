---
name: is-orient
description: >
  Orient inside an ideaspace. Use at session start when orientation is missing,
  when the user asks "where are we?", "what are we doing?", "what changed?", or
  when context feels unclear. Reads the position's agreement and current state;
  does not modify files.
allowed-tools: "mcp__plugin_ideaspaces_core__is_status Read Glob Grep Bash"
---

# Orient

Orient is the first conscious step after arrival: understand the place before acting.

The plugin already injects an awareness block at session start. Use this skill when the user asks for orientation, when you need to refresh your footing, or when the automatic block is not enough.

## How

1. Inspect state with `is_status` when git/capture state matters.
2. Read by position, not search:
   - root `_agent/foundation.md`
   - applicable `_agent/guide.md`
   - `_agent/purpose.md`, `_agent/now.md`, `_agent/next.md` when present
   - `README.md` along the path when it helps explain the place
3. Inspect recent movement when relevant:
   - `git log --oneline -5` for recent commits
   - `git status --short` for local drift
4. Answer with the active purpose, current work, relevant pending changes, and any drift signals.

## Posture

- Missing named `_agent/` files are drift signals, not errors.
- `README.md` describes the place; `_agent/` carries the agent agreement.
- Keep the answer compact. Orientation should make the next action obvious, not become a full audit.

## Next intents

- If the user wants to preserve understanding → **is-capture**.
- If the user wants to push/pull/share state → **is-sync**.
- If the agreement no longer matches reality → **is-reflect**.
- If the user wants to change how agents work here → **is-shape**.
