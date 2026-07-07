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
| `ideaspaces write <path>` | Create/update a Note with Layer 1 frontmatter; stages it and returns a content sha (`--if-match` for safe updates). |
| `ideaspaces commit -m <msg> <path>…` | The explicit save — commits only the paths you name (`--tracked` / `--all`), never unrelated staged work. |
| `ideaspaces status [--path FILE]` | Git position + plugin-tracked captures awaiting commit; single-file sha for `--if-match`. |
| `ideaspaces sync` | Integrate remote changes and push committed captures (`--dry-run`). |
| `ideaspaces skills [<name>]` | List the skill catalog, or print one skill's markdown. |
| `ideaspaces login` | Save optional remote credentials. |
| `ideaspaces publish` | Create/reuse a remote IdeaSpaces repo and push the current branch. |

`publish` preflights tracked markdown frontmatter before pushing.

## MCP tools

Five tools plus skill resources. Native Claude Code `Read`, `Glob`, `Grep`, `Edit`, `Write`, and `Bash` cover local navigation and editing.

| Tool | What |
|---|---|
| `is_write` | Create/update a Note (Layer 1 frontmatter); stages it and returns a content sha. `if_match` for safe updates. |
| `is_commit` | The explicit save — commits only the paths you name, never the user's other staged work. |
| `is_status` | Capture state: git position + tracked captures, or a single file's sha for `if_match`. |
| `is_pull` | Integrate remote changes into the local space; never pushes; refuses on a dirty/uncommitted tree. |
| `is_push` | Send committed captures to the remote; never pulls; refuses when behind — pull first. |
| `is_auth` | Log in / out for optional remote hosting. |

Skill resources at `ideaspaces://skill/<name>` expose the canonical catalog (`resources/list` / `resources/read`) for non-plugin clients.

MCP stays thin: every tool and resource shells the bundled CLI with `--json`. One implementation, many surfaces — and the logic stays in the CLI + SDK, out of the agent's context.

## Skills

- **is-setup** — conversational layer over `ideaspaces create`
- **is-publish** — conversational layer over `ideaspaces publish`
- **is-capture** — propose writing a Note when conversation crystallizes
- **is-reflect** — propose updates to Purpose, Now, or structure when direction drifts
- **is-writing** — writing standard for Notes that compound
- **is-shape** — create a reusable `_agent/` primitive or perspective
- **is-space** — `_agent/` contract, navigation conventions, voice rules

Skills read their full protocols from `reference/` (the SDK's canonical skill catalog, built via `readSkill()`).

## Hooks

**SessionStart awareness** (`dist/awareness-hook.js`) — walks root → cwd and, in a git ideaspace, emits orientation (Now, tree, agent context, skills, since-last-session), a git-state line, and a **stale-doc drift** block: docs that declare `code_paths` whose referenced code was committed *after* the doc, flagged before the agent quotes their status. Missing `purpose.md`/`now.md` surface as direction not yet captured. Persists HEAD for the next session's diff. Same-repo only; cross-repo staleness is the Delta Protocol skill's job.

It also **bridges the session id**: the MCP server can't read the Claude Code session id from the protocol, so this hook writes it (from its stdin `session_id`) to a user-level cache (`~/.ideaspaces/sessions/<hash of project dir>`, outside the project tree so no visited repo is touched), where `is_commit` reads it to stamp the `Conversation` trailer. Best-effort; absent → the trailer is simply omitted.

**PostToolUse capture-nudge** (`dist/capture-nudge-hook.js`) — when a knowledge file (`*.md` or under `_agent/`) is written with native Write/Edit inside an ideaspace, nudges toward the `is_write` → `is_commit` capture flow. Silent for source, configs, build artifacts, and markdown outside an ideaspace.

## Repo-local agent context

This plugin repo's own `_agent/` is local working context and is gitignored. Public repo orientation lives in `README.md`, `CLAUDE.md`, skill files, and source.

Contributors who want local agent orientation can manually create a private `_agent/`, or run `ideaspaces create` from the repo root to preview the scaffold and copy the parts they want. Do not commit it.

## Rebuilding

The plugin ships pre-built: the CLI and MCP bundles are vendored from the sibling repos, the skill `reference/` is built from the SDK, and the hooks are built here. To update after code changes:

```bash
# 1. Rebuild the sibling bundles
cd ../cli && npm run build && npm run bundle
cd ../mcp-server && npm run build && npm run bundle

# 2. In the plugin: refresh the SDK, vendor the bundles, build reference + hooks
cd ../ideaspaces-plugin
npm install                # pin the current SDK
npm run vendor             # cli + mcp bundles ← sibling repos
npm run build:reference    # reference/*.md ← SDK readSkill()
npm run build:hook         # SessionStart + capture-nudge hooks
npm run typecheck

# 3. Smoke check
node cli/bundle/ideaspaces.js --help
node cli/bundle/ideaspaces.js skills
```
