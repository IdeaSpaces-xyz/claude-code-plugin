# Always

Invariant behaviors for working in this repo. Session-independent. See `ideaspace/_agent/always.md` for global collaboration invariants; these are plugin-specific additions.

## Architecture

- **Keep the MCP server thin.** Shell out to `@ideaspaces/cli` with `--json`. One implementation, two surfaces.
- **Don't fork logic** between CLI and MCP. New capabilities go in the SDK / CLI first; MCP exposes.
- **Five `is_*` tools.** Consolidate, don't expand. A new tool needs deliberate justification.

## Bundling

- Bundles sync from sibling repos: `../cli/bundle/` and `../mcp-server/bundle/`. See README rebuild section.
- Keep bundle copies committed here — Claude Code loads them directly via `.mcp.json`.
- Don't edit `dist/` or `cli/bundle/` by hand; regenerate from source.

## Agent-space awareness

- The plugin's job is partly to help an agent recognize `_agent/` in any directory it enters, Space-connected or not.
- When the cwd has an `_agent/` folder (or a parent does), the agent should read it before acting.
- The `is-space` skill carries the Two Roles convention and the `_agent/` contract shape. Keep it current.

## Sharp edges to remember

- The plugin installs on other machines — rules inferred from this monorepo's layout don't travel.
- Session-start context must be inside the plugin's hook output or skill descriptions, not in a parent `CLAUDE.md` the user may not have.

## See

- `ideaspace/_agent/always.md` — global collaboration invariants
- `_agent/bugs/` — observed failures we're working on
- `README.md` — rebuild flow
