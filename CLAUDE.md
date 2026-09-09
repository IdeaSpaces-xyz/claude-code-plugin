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

Keep the plugin small, and keep the seam where the protocol puts it: **the user's side is self-sufficient; the CLI is the platform client, minimal by intent.**

- The MCP server and hooks own user/session-side state and its rendering — the session-id bridge, the persisted open Change (the server decides arming; the SessionStart hook only displays).
- Local reads, `is_write`, `is_commit`, and Change state run in-process through the protocol. MCP owns the process-local capture ledger: `all` means paths captured by that server session, never every staged knowledge path in a shared index.
- Platform interactions — auth, the credential helper, pull/push, publish, account-free local Fork and maintained updates, recipient-shaped Share, and person-accountable Inbox exchange — shell the bundled `ideaspaces` CLI. Fork/update, Share, and Inbox stay skill-mediated flows rather than automatic native-tool mirrors.
- `is_consult` is a third category: it spawns a read-only headless `claude` in another point of view's `_agent/` folder to consult that vantage — neither an in-process protocol read nor a platform CLI call. It relies on this plugin's own SessionStart hook to orient the spawned session.

Local capture goes through MCP and the protocol; platform workflow goes through the bundled CLI and skills.

## Releasing

Every PR that changes what users receive — `dist/`, `cli/bundle/`, `reference/`, `skills/`, hooks, or `.claude-plugin/` — **bumps the version** in both `.claude-plugin/plugin.json` and `package.json` (patch unless the surface changed). Claude Code keys the install cache by that version; an unbumped release mutates users' existing `cache/<marketplace>/ideaspaces/<version>/` slot in place, and update checks report "already at the latest version" while content silently drifts (how 0.3.1 accumulated four unversioned content PRs).

Ritual: bump the protocol pin if it moved → `npm install` → `npm run build:reference && npm run build:hook` → `npm run vendor` (siblings on clean `main` with fresh bundles) → bump both version fields → `typecheck` + `test` + `lint:skills` + `check:vendor` → PR.

Listing in Anthropic's built-in plugin catalog is optional and separate from the marketplace install: submit via [claude.com/docs/plugins/submit](https://claude.com/docs/plugins/submit).
