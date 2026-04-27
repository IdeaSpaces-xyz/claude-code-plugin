---
name: Foundation
summary: Baseline for working in the ideaspaces-plugin repo. This is where we shape
  the agent in Claude Code — the plugin is the agent's body. Architectural invariants
  (thin MCP, no forked logic, bundles regenerated from sibling sources). The plugin
  must be self-contained on machines without the monorepo. Specific agreements live
  in guide.md.
---

# Foundation

> Baseline for the plugin. The Agreement model is inherited from ideaspace when in
> monorepo context; this refines for plugin-development specifics.

---

## What this place is

This repo defines the IdeaSpaces plugin for Claude Code. When we edit here, we change how the agent shows up on someone's machine — which tools it reaches for, which conventions it respects, how it orients at session start.

Sibling repos `mcp-server/`, `cli/`, and `sdk/` are the source for the MCP server and CLI bundles, copied here as `dist/index.js` and `cli/bundle/ideaspaces.js`.

Plugin-owned source lives in `src/` — currently the SessionStart hook (`src/awareness-hook.ts`), bundled into `dist/awareness-hook.js` via `npm run build:hook`. The hook is plugin behavior, not MCP-server behavior, so it's owned here.

---

## Architectural invariants

- **Thin MCP server.** Shell out to `@ideaspaces/cli` with `--json`. One implementation, two surfaces.
- **No forked logic.** New capabilities go in SDK / CLI first; MCP exposes.
- **Bundles regenerate from source.** Don't hand-edit `dist/` or `cli/bundle/`. See [README.md](../README.md) rebuild section.
- **Plugin-owned source is for plugin-specific behavior** (the SessionStart hook). Anything reusable across MCP / CLI surfaces stays in `mcp-server/`, `cli/`, or `sdk/`.
- **Self-contained on install.** Rules inferred from this monorepo's layout don't travel. Session-start context goes in the plugin's hook output or skill descriptions, not in a parent `CLAUDE.md` the user may not have.

---

## Agent-space awareness

The plugin's job is partly to help an agent recognize `_agent/` in any directory it enters — Space-connected or not. When the cwd has an `_agent/` folder (or a parent does), the agent reads it before acting. The `is-space` skill carries this convention.

---

Specific agreements for this repo live in [guide.md](guide.md). When the Agreement drifts — guide silent on something we keep doing, or this baseline contradicts current practice — surface it. Both sides agree before committing.
