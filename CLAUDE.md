# CLAUDE.md

> This is the IdeaSpaces plugin for Claude Code — the agent's body. The five-file `_agent/` contract carries the Agreement.

## Orient

At session start, read in order:

1. [`_agent/foundation.md`](_agent/foundation.md) — what this place is, baseline behaviors
2. [`_agent/guide.md`](_agent/guide.md) — how agent and human work together here
3. [`_agent/purpose.md`](_agent/purpose.md) — why this exists
4. [`_agent/now.md`](_agent/now.md) — what's currently active
5. [`_agent/next.md`](_agent/next.md) — what's queued

These files are the source of truth for orientation — read them before answering.

## Repo shape

- `dist/`, `cli/bundle/` — pre-built bundles loaded by `.mcp.json`. Don't hand-edit; regenerate from sibling repos `mcp-server/` and `cli/`.
- `skills/` — skill definitions installed by the plugin
- `.claude-plugin/`, `.mcp.json` — plugin manifest and MCP server registration

See [README.md](README.md) for rebuild flow.

## When the Agreement drifts

Now stops matching reality. Foundation contradicts current practice. Guide is silent on something we keep doing. → Surface it. Propose an update. Update [`_agent/guide.md`](_agent/guide.md) for this scope, or revisit [`_agent/foundation.md`](_agent/foundation.md) if a baseline needs to shift.
