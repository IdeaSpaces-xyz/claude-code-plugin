# IdeaSpaces Plugin for Claude Code

Connect Claude Code to your [IdeaSpaces](https://ideaspaces.xyz) knowledge space — persistent, searchable knowledge that compounds across sessions.

## Install

```bash
claude plugin add ideaspaces-xyz/claude-code-plugin
```

On first use, call `is_auth` to log in via browser. No API key needed.

## Tools

5 tools — consolidated from the full CLI, optimized for agent use:

| Tool | What |
|---|---|
| `is_explore` | See what's in the space — tree, README context, changes since last session |
| `is_find` | Find by meaning (`search`), text pattern (`grep`), or metadata (`list`) |
| `is_read` | Read content + metadata. Add `history=true` for git log |
| `is_write` | Create, update, move, or delete notes |
| `is_auth` | Login, logout, list spaces, connection status |

## Skills

- **is-setup** — First-run onboarding: connect, set purpose and focus, install SessionStart hook
- **is-space** — How to work with the knowledge space (orient, find, read, write, auth)
- **is-writing** — Writing standard for Notes that compound
- **is-capture** — When and how to propose saving knowledge (decisions, insights, findings)
- **is-reflect** — When to propose updating Purpose, Now, and space structure

## Architecture

The plugin ships a thin MCP server (~235 lines) that shells out to the [IdeaSpaces CLI](https://github.com/IdeaSpaces-xyz/cli) with `--json`. The CLI handles auth, formatting, session tracking, and error mapping. Same validation, same output — one implementation, two interfaces.

```
Agent → MCP (5 tools) → spawn CLI --json → SDK → API
```
