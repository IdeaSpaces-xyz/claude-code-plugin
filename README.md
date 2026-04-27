# IdeaSpaces Plugin for Claude Code

> Local-first knowledge space for Claude Code. A markdown folder, agent skills, git as sync. Optional remote sync when you're ready.

The plugin makes a local markdown folder a great place for an agent and a human to think together. The agent gets oriented from `_agent/` files at session start, captures decisions when understanding crystallizes, and tracks state via git.

> **Status:** mid-pivot from server-first to local-first. The flagship `ideaspace create` command lands in a subsequent step. See [`ideaspace/architecture/plans/plugin-local-first/`](https://github.com/IdeaSpaces-xyz/ideaspace/tree/master/architecture/plans/plugin-local-first) for the plan.

## Install

```bash
claude plugin add ideaspaces-xyz/claude-code-plugin
```

Server sync is optional — call `is_auth` to log in only when you want to share or back up.

## Tools

Two MCP tools. Native `Read`, `Glob`, `Grep`, `Edit`, `Write`, and `Bash` cover the rest of local navigation.

| Tool | What |
|---|---|
| `is_write` | Create a Note with Layer 1 frontmatter (`name`, `summary`). Use for capture. |
| `is_auth` | Log in / out, sync state, connection status. |

## Skills

**Core:**
- **is-capture** — propose writing a Note when conversation crystallizes
- **is-reflect** — propose updates to Purpose, Now, or structure when direction drifts
- **is-writing** — writing standard for Notes that compound
- **is-space** — `_agent/` contract, navigation conventions, voice rules
- **is-setup** — onboarding flow (becomes the conversational layer for `ideaspace create` once it lands)

**Workspace packages** (parked until templates land):
- **is-founder** — solo founder / small team
- **is-vc** — investor

## Architecture

The plugin ships a thin MCP server that shells out to the [IdeaSpaces CLI](https://github.com/IdeaSpaces-xyz/cli) with `--json`. One implementation, two surfaces.

```
Agent → MCP (2 tools) → spawn CLI --json → SDK → local files (or remote when authed)
```

## Rebuilding

The plugin ships pre-built bundles from two source repos. To update after code changes:

```bash
# 1. Rebuild CLI bundle
cd ../cli
npm run build && npm run bundle

# 2. Rebuild MCP server bundle
cd ../mcp-server
npm run build && npm run bundle

# 3. Copy bundles to plugin
cp ../mcp-server/bundle/index.js dist/index.js
cp ../cli/bundle/ideaspaces.js cli/bundle/ideaspaces.js

# 4. Commit, push, then update in Claude Code
claude plugin add ideaspaces-xyz/claude-code-plugin
```
