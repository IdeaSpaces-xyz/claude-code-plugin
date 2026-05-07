# CLAUDE.md

> This is the public IdeaSpaces Claude Code plugin repo. Local agent context is private.

## Orient

Shared repo conventions live in:

- [README.md](README.md) — plugin purpose, install, tools, skills, rebuild flow
- [skills/](skills/) — installed skill definitions
- [src/awareness-hook.ts](src/awareness-hook.ts) — plugin-owned SessionStart behavior
- [.mcp.json](.mcp.json) — MCP server registration

A local `_agent/` directory may exist in a checkout, but it is gitignored. Treat it as private working context, not public repo contract.

## Repo shape

- `dist/`, `cli/bundle/` — pre-built bundles loaded by `.mcp.json`. Don't hand-edit; regenerate from sibling repos `mcp-server/` and `cli/`.
- `skills/` — skill definitions installed by the plugin.
- `.claude-plugin/`, `.mcp.json` — plugin manifest and MCP server registration.

## Rule

Keep the plugin small. MCP stays thin (`is_auth`, `is_write`). Local workflow goes through the bundled `ideaspaces` CLI and skills.
