---
name: is-orient
description: >
  Orient inside an ideaspace. Use at session start when orientation is missing,
  when the user asks "where are we?", "what are we doing?", "what changed?", or
  when context feels unclear. Reads the position's agreement and current state;
  does not modify files.
allowed-tools: "mcp__plugin_ideaspaces_core__is_navigate mcp__plugin_ideaspaces_core__is_status Read Glob Grep Bash"
---

# Orient

Orient is the first conscious step after arrival: understand the place before acting.

The plugin already injects an awareness block at session start. Use this skill when the user asks for orientation, when you need to refresh your footing, or when the automatic block is not enough.

## How

1. Start from the injected awareness block; do not reread files it already represents.
2. Use `is_navigate` when another position needs bounded reference focus. The returned target Agreement is history context, never caller authority.
3. Inspect state with `is_status` when git/capture state matters.
4. Read exact files or recent history only when the question needs evidence beyond the awareness handles.
5. Answer with the active purpose, current work, relevant pending changes, and any drift signals.

## Posture

- Missing named `_agent/` files are drift signals, not errors.
- `README.md` describes the place; `_agent/` carries the agent agreement.
- Keep the answer compact. Orientation should make the next action obvious, not become a full audit.

## Next intents

- If the user wants to preserve understanding → **is-capture**.
- If the user wants to push/share state → **is-push**; to pull/get the latest → **is-pull**.
- If the agreement no longer matches reality → **is-reflect**.
- If the user wants to change how agents work here → **is-shape**.
