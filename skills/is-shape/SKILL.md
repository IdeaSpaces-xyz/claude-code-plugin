---
name: is-shape
description: >
  Shape the `_agent/` contract — create a reusable primitive (procedure,
  checklist, review pattern, memory routine) or codify a perspective (a
  repeatable thinking pattern). Use when the user wants to make how the agent
  works in a situation repeatable, or to define an evaluation/analysis they
  apply often.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit ToolSearch Read Write Edit Glob Bash"
---

# Shape the `_agent/`

Canonical protocols: read `${CLAUDE_PLUGIN_ROOT}/reference/form-primitive.md` for procedures, checklists, routines, and agents; read `${CLAUDE_PLUGIN_ROOT}/reference/form-perspective.md` for reusable thinking patterns.

## Which one

- **Primitive** — *how to work* in a situation: a procedure, checklist, review pattern, memory routine. Any part of `_agent/` with `name` + `description` frontmatter (the description is the trigger). Use the canonical form-primitive reference above.
- **Perspective** — *how to think* about something repeatably: an evaluation or analysis with Object Definition, Thinking Structure, Expected Outcome. Use the canonical form-perspective reference above.

If the user wants consistent *evaluation/analysis*, it's a perspective. If they want a repeatable *procedure/behavior*, it's a primitive.

## How

Elicit progressively — don't demand the full structure up front. Start from a real instance ("walk me through the last time you did this"), find the invariant, draft, and **show it before saving**.

Primitives and perspectives live in `_agent/` at the level where they apply; everything in `_agent/` composes along the path root → current position.

Use native `Write` / `Edit` for `_agent/skills/*`, `_agent/perspectives/*`, and other agent-context primitives because they use `name` + `description` frontmatter, not Note `name` + `summary` frontmatter. Use `is_write` only for ordinary Note-style files such as `_agent/purpose.md` or `_agent/now.md`.

Preview, confirm, then write — the write gate in `${CLAUDE_PLUGIN_ROOT}/reference/guide.md` applies to shaping like any capture.

Shaping changes the agent agreement, so finish with the capture boundary:

- For Note-style files written with `is_write`, commit staged knowledge with `is_commit` after confirmation.
- For native `_agent/` edits, commit the explicit changed paths with `is_commit` after confirmation.
- If the user only wanted a draft, say that it remains local and uncommitted.

If a required MCP tool isn't loaded, reach it through `ToolSearch`.
