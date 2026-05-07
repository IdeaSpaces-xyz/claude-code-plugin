# IdeaSpaces Plugin for Claude Code

> Local-first knowledge space for Claude Code. A markdown folder, agent skills, git as sync. Optional remote hosting when you're ready.

The plugin makes a local markdown folder a good place for an agent and a human to think together. Start locally, capture shared understanding into markdown, and publish to IdeaSpaces only when you want the space hosted remotely.

## Install

```bash
claude plugin add ideaspaces-xyz/claude-code-plugin
```

## Local-first flow

```bash
# Scaffold a local ideaspace
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create my-space --yes
cd my-space

# Later, after login, host it remotely
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js login
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js publish
```

In Claude Code, use `/is-setup` for conversational setup and `/is-publish` for conversational publishing. The skills invoke the bundled CLI; no global npm install is required.

## Bundled CLI

| Command | What |
|---|---|
| `ideaspaces create [name]` | Scaffold the seed `_agent/` contract, `CLAUDE.md`, git defaults, and initial commit. |
| `ideaspaces write <path>` | Create/update a markdown Note with Layer 1 frontmatter and stable `node_id`. |
| `ideaspaces id` | Check/repair local markdown `node_id` frontmatter before publishing. |
| `ideaspaces login` | Save optional remote credentials. |
| `ideaspaces publish` | Create/reuse a remote IdeaSpaces repo and push the current branch. |

Every committed markdown file in a published ideaspace needs a stable `node_id`. The CLI handles this at create/write boundaries and `publish` preflights tracked markdown before pushing.

## MCP tools

Two tools. Native Claude Code `Read`, `Glob`, `Grep`, `Edit`, `Write`, and `Bash` cover local navigation and editing.

| Tool | What |
|---|---|
| `is_write` | Create a Note with Layer 1 frontmatter (`name`, `summary`). Use for capture. |
| `is_auth` | Log in / out for optional remote hosting. |

MCP stays thin: it shells out to the bundled CLI with `--json`. One implementation, two surfaces.

## Skills

- **is-setup** — conversational layer over `ideaspaces create`
- **is-publish** — conversational layer over `ideaspaces publish`
- **is-capture** — propose writing a Note when conversation crystallizes
- **is-reflect** — propose updates to Purpose, Now, or structure when direction drifts
- **is-writing** — writing standard for Notes that compound
- **is-space** — `_agent/` contract, navigation conventions, voice rules

## Awareness hook

The SessionStart hook (`dist/awareness-hook.js`) walks up from `cwd` looking for `_agent/`, formats the awareness block via the SDK, and writes it to stdout. If `purpose.md` or `now.md` are missing, it surfaces that as direction not yet captured.

## Repo-local agent context

This plugin repo's own `_agent/` is local working context and is gitignored. Public repo orientation lives in `README.md`, `CLAUDE.md`, skill files, and source.

Contributors who want local agent orientation can manually create a private `_agent/`, or run `ideaspaces create` from the repo root to preview the scaffold and copy the parts they want. Do not commit it.

## Rebuilding

The plugin ships pre-built bundles from sibling source repos plus its own SessionStart hook. To update after code changes:

```bash
# 1. Rebuild CLI bundle
cd ../cli
npm run build && npm run bundle

# 2. Rebuild MCP server bundle
cd ../mcp-server
npm run build && npm run bundle

# 3. Copy bundles to plugin
cd ../ideaspaces-plugin
cp ../mcp-server/bundle/index.js dist/index.js
cp ../cli/bundle/ideaspaces.js cli/bundle/ideaspaces.js

# 4. Rebuild the SessionStart hook (plugin-owned)
npm install
npm run build:hook

# 5. Smoke check
node cli/bundle/ideaspaces.js --help
node cli/bundle/ideaspaces.js id --help
npm run typecheck
```
