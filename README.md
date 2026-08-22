# IdeaSpaces for Claude Code and Cowork

[![CI](https://github.com/IdeaSpaces-xyz/claude-code-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/IdeaSpaces-xyz/claude-code-plugin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Give Claude a standard way to turn useful work into knowledge that survives the chat.

Useful decisions, findings, plans, and context should not disappear with the chat. This local-first plugin gives Claude a standard way to orient in your work, recognize when understanding has changed, and capture what matters as ordinary Markdown with git history.

The [protocol](https://github.com/IdeaSpaces-xyz/ideaspace-protocol) defines the repository shape and operating loop. This plugin makes that standard native to **Claude Code and Cowork** through session awareness, capture skills, and safe commit/sync tools. Everything stays on your machine unless you choose to publish or sync it.

[Install IdeaSpaces](#install) · [Explore the protocol as an Ideaspace](https://ideaspaces.xyz/spaces/n_64dbf7878f05362337a6cda6) · [Use IdeaSpaces with Pi](https://github.com/IdeaSpaces-xyz/pi-is-space)

## What you get

- **Awareness on arrival** — Claude reads the active `_agent/` agreement, current direction, tree, and recent movement.
- **Deliberate capture** — when understanding crystallizes, Claude proposes preserving it, stages the agreed draft, and commits only after explicit confirmation.
- **Knowledge that compounds** — decisions and context become ordinary Markdown rather than remaining trapped in transcripts.
- **Explicit history** — commits preserve authorship, agent contribution, conversation provenance, and multi-commit Changes.
- **Optional collaboration** — work fully offline, then publish, push, or pull when you want remote access.

## Install

IdeaSpaces installs the same way in **Claude Code** and **Cowork** — both read plugins from a GitHub repository. You'll add ours once, then install with one click or one command.

Marketplace repository: **`IdeaSpaces-xyz/claude-code-plugin`**

### Claude Code

Inside a Claude Code session, type:

```
/plugin marketplace add IdeaSpaces-xyz/claude-code-plugin
/plugin install ideaspaces@ideaspaces-xyz
```

Or from your terminal:

```bash
claude plugin marketplace add IdeaSpaces-xyz/claude-code-plugin
claude plugin install ideaspaces@ideaspaces-xyz
```

### Cowork

1. Open **Customize** in the sidebar, then **Plugins**.
2. Click **Add marketplace** and paste `IdeaSpaces-xyz/claude-code-plugin` (the `owner/repo` shorthand or the full `https://github.com/IdeaSpaces-xyz/claude-code-plugin` URL both work).
3. Find **ideaspaces** in the list and click **Install**.
4. Approve the plugin when prompted — it includes a small local helper (see Requirements).

**What works in Cowork's sandbox.** Cowork runs in an isolated sandbox with restricted network access, so IdeaSpaces behaves a little differently there:

- ✅ **Working locally works fully.** Create a space and capture notes as usual — Cowork writes to a folder you've **connected on the desktop**, so your markdown is saved to real files that persist. Create your space *inside* a connected folder.
- ⚠️ **Remote sync may be blocked — switch to Claude Code view.** Publishing and `is_push` / `is_pull` reach a git host outside the sandbox, which the Cowork view restricts. The fix is simple: **switch to Claude Code view and ask the agent to push or pull there.** Sync works from Claude Code view, and it's the same space, so nothing is lost — capture in Cowork, sync in Code.

### Your first session

Open Claude Code in any folder and say **"set up an ideaspace"** — or **"create an agent"**. The conversation takes it from there: what's already in the folder gets inspected and confirmed before anything is written, and an agent's character is drawn out from real examples rather than a form.

### For a whole team (auto-install)

Commit this to your project's `.claude/settings.json` and everyone who trusts the repo gets IdeaSpaces automatically:

```json
{
  "extraKnownMarketplaces": {
    "ideaspaces-xyz": {
      "source": { "source": "github", "repo": "IdeaSpaces-xyz/claude-code-plugin" }
    }
  },
  "enabledPlugins": { "ideaspaces@ideaspaces-xyz": true }
}
```

### Requirements

IdeaSpaces runs a small local helper on your machine — a Node.js program that manages the markdown and git. It ships pre-built inside the plugin (no `npm install`, and **no global `ideaspaces` command to install** — the skills invoke the bundled CLI for you). But it needs two things available on your PATH:

- **Node.js 18+** — the runtime for the helper, the MCP server, and the hooks. **Not guaranteed by Claude Code:** the native installer (`irm …` / `curl …`) bundles its own runtime and does *not* put `node` on your PATH, so a machine that only ever installed Claude Code that way has no Node. (Installed Claude Code via `npm i -g`? Then you already have it.)
- **git** — for version history and remote sync. Working locally needs nothing else; git is only required once you commit, publish, or push.

Install whatever's missing:

| OS | Node.js | git |
|---|---|---|
| **Windows** | `winget install OpenJS.NodeJS` | `winget install Git.Git` |
| **macOS** | `brew install node` | `brew install git` (or Xcode Command Line Tools) |
| **Linux** | `apt install nodejs` etc. — older LTS ships < 18, so use [NodeSource](https://github.com/nodesource/distributions) or `nvm` for 18+ | e.g. `apt install git` |

After installing, **restart Claude Code** so the new tools are picked up on PATH. Or just ask your agent — *"set up my machine for IdeaSpaces"* — and it can detect what's missing and run the right install for your OS.

---

## First steps

Once installed, just start working — the plugin orients your agent at the start of each session and nudges toward capturing what matters.

- **Start a space** — say *"set up an ideaspace here"* (runs the `/is-setup` skill), or scaffold one directly:
  ```bash
  node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create my-space --yes
  ```
- **Capture as you go** — when a decision or insight lands, the agent proposes writing it down. You confirm.
- **Publish when ready** — say *"publish this space"* (`/is-publish`) to host it on a remote and reach it from another device. Optional; everything works fully offline without it.
- **Choose who can use it** — say *"share this with alice@example.com for Explore"*, *"share with team acme.com for Collaborate"*, or *"make this public"* (`/is-share`).

Eight skills are yours to invoke — type `/` in Claude Code or Cowork to see them: `is-setup`, `is-orient`, `is-shape`, `is-space`, `is-publish`, `is-share`, `is-push`, `is-pull`.

Three more run on the agent's initiative rather than yours, so they won't appear in that menu: `is-capture` offers to write a Note when something crystallizes, `is-reflect` offers to update direction when it drifts, and `is-writing` shapes how Notes get written. You reach them by saying what you want — *"capture this"*, *"has our direction changed?"* — not by typing a command.

---

## Under the hood

Everything below is for contributors and the curious — you don't need any of it to use IdeaSpaces.

### How distribution works

The plugin **is** its GitHub repo. `IdeaSpaces-xyz/claude-code-plugin` is public and contains a `.claude-plugin/marketplace.json`, so both Claude Code and Cowork treat it as an installable marketplace directly — there's nothing else to publish. The MCP server and CLI are vendored as self-contained bundles, so an end-user install needs no dependency step.

To also list IdeaSpaces in Anthropic's built-in catalog for discoverability, submit it via [claude.com/docs/plugins/submit](https://claude.com/docs/plugins/submit). That's optional and separate from the install flow above.

### Bundled CLI

The skills invoke this CLI; no global npm install is required.

| Command | What |
|---|---|
| `ideaspaces create [name]` | Scaffold the seed `_agent/` contract, `CLAUDE.md`, git defaults, and initial commit. |
| `ideaspaces write <path>` | Create/update a Note with Layer 1 frontmatter; stages it and returns a content sha (`--if-match` for safe updates). |
| `ideaspaces commit -m <msg> <path>…` | The explicit save — commits only the paths you name (`--all`), never unrelated staged work. Optional `--op` / `--change-id` / `--co-author` / `--conversation` trailers. |
| `ideaspaces change new [<handle>]` | Mint a `Change-Id` for a decision spanning multiple commits/repos. |
| `ideaspaces navigate [<path>] [--mark-seen]` | Re-derive orientation at a position (fractal contract + tree + drift); `--json` for the structured block. |
| `ideaspaces status [--path FILE]` | Git position + plugin-tracked captures awaiting commit; single-file sha for `--if-match`. |
| `ideaspaces pull` / `push` | Integrate remote changes / send committed captures (`--dry-run`). |
| `ideaspaces skills [<name>]` | List the skill catalog, or print one skill's markdown. |
| `ideaspaces login` | Save optional remote credentials. |
| `ideaspaces publish` | Create/reuse a remote IdeaSpaces repo and push the current branch. |
| `ideaspaces share person|team|list|remove|visibility` | Manage recipients, Explore/Fork/Collaborate grades, and public/private visibility. |

`publish` preflights tracked markdown frontmatter before pushing.

### MCP tools

The MCP tools, plus skill resources. Native Claude Code `Read`, `Glob`, `Grep`, `Edit`, `Write`, and `Bash` cover file editing; `is_navigate` adds the composed `_agent` contract that a plain tree can't reconstruct.

| Tool | What |
|---|---|
| `is_write` | Create/update a Note (Layer 1 frontmatter); stages it and returns a content sha. `if_match` for safe updates. |
| `is_commit` | The explicit save — commits only the paths you name, never the user's other staged work. Auto-stamps attribution trailers (agent, session, open Change). |
| `is_change_open` / `is_change_close` | Open/close a Change — a `Change-Id` stamped on every `is_commit` for one decision, across files and repos. |
| `is_status` | Capture state: git position + tracked captures, or a single file's sha for `if_match`. |
| `is_navigate` | Re-derive orientation at a position — the fractal `_agent` contract (foundation + deepest guide/purpose/now), tree, git-state, and drift. Read-only. |
| `is_pull` | Integrate remote changes into the local space; never pushes; refuses on a dirty/uncommitted tree. |
| `is_push` | Send committed captures to the remote; never pulls; refuses when behind — pull first. |
| `is_sync` | Where you stand: ahead/behind, uncommitted captures, and whether a fork's source has moved. Reads only; integrates nothing. |
| `is_spaces` | List remote spaces available to the signed-in person. |
| `is_clone` | Clone a selected remote space into a local folder — a linked working copy of a space you already have. |
| `is_fork` | Take an independent copy of a space — current content, no shared history, no write access back. Creates a remote space and a local folder in one irreversible step; `location` fixes the namespace permanently. |
| `is_auth` | Log in / out for optional remote hosting. |

Skill resources at `ideaspaces://skill/<name>` expose the canonical catalog (`resources/list` / `resources/read`) for non-plugin clients.

MCP stays thin: portable local reads use the protocol in-process, while platform and write verbs shell the bundled CLI with `--json`. Shared shape stays in the protocol; harness lifecycle and presentation stay on the surface. Share is intentionally CLI-backed through `is-share` in this release; there is no native `is_share` tool.

### Skills

User-invocable (they appear when you type `/`):

- **is-setup** — conversational layer over `ideaspaces create`
- **is-orient** — orient inside a space: where are we, what's active, what changed
- **is-shape** — create a reusable `_agent/` primitive or perspective
- **is-space** — `_agent/` contract, navigation conventions, voice rules
- **is-publish** — conversational layer over `ideaspaces publish`
- **is-share** — manage people, teams, Explore/Fork/Collaborate grades, and public/private visibility
- **is-push** — send committed captures to the remote
- **is-pull** — integrate remote changes into the local space

Model-triggered only — `user-invocable: false` in their `SKILL.md`, so the agent
reaches for them from their `description`, and typing `/name` will not work:

- **is-capture** — propose writing a Note when conversation crystallizes
- **is-reflect** — propose updates to Purpose, Now, or structure when direction drifts
- **is-writing** — writing standard for Notes that compound

Skills read their full protocols from `reference/` (the protocol's canonical skill catalog, built via `readSkill()`).

### Hooks

**SessionStart awareness** (`dist/awareness-hook.js`) — imports the exact-pinned protocol directly, assembles its structured Content manifest in-process, and emits the canonical orientation (position, Now, tree, agent context, skills, since-last-session activity, git state, stale-doc drift, and missing direction). Claude-specific placement stays in the hook. After rendering, the hook advances the local seen ref for the next session; that lifecycle write remains surface-owned because protocol shape primitives are read-only. The MCP `is_navigate` tool consumes the same manifest/renderer, so parity is structural rather than routed through a bundled CLI process.

It also **bridges the session id**: the MCP server can't read the Claude Code session id from the protocol, so this hook writes it (from its stdin `session_id`) to a user-level cache (`~/.ideaspaces/sessions/<hash of project dir>`, outside the project tree so no visited repo is touched), where `is_commit` reads it to stamp the `Conversation` trailer. Best-effort; absent → the trailer is simply omitted. The cache is keyed by project dir (the reader only knows `CLAUDE_PROJECT_DIR`, never the session), so distinct dirs and worktrees are isolated but two concurrent sessions in the *same* dir share one entry — last-writer-wins, an accepted v1 tradeoff.

**PreToolUse capture-nudge** (`dist/capture-nudge-hook.js`) — before a knowledge file (`*.md` or under `_agent/`) is written with native Write/Edit inside an ideaspace, or a `git commit` is run by hand inside one, nudges toward the `is_write` → `is_commit` capture flow. It informs and never blocks. At most once per kind per session. Silent for source, configs, build artifacts, ordinary shell commands, anything outside an ideaspace, and markdown inside nested code repos unless that repo carries its own `_agent/` contract.

### Repo-local agent context

This plugin repo's own `_agent/` is local working context and is gitignored. Public repo orientation lives in `README.md`, `CLAUDE.md`, skill files, and source.

Contributors who want local agent orientation can manually create a private `_agent/`, or run `ideaspaces create` from the repo root to preview the scaffold and copy the parts they want. Do not commit it.

### Rebuilding

The plugin ships pre-built: the CLI and MCP bundles are vendored from the sibling repos, the skill `reference/` is built directly from the protocol, and the hooks are built here. To update after code changes:

```bash
# 1. Rebuild the sibling bundles
cd ../cli && npm run build && npm run bundle
cd ../mcp-server && npm run build && npm run bundle

# 2. In the plugin: install the protocol pin, vendor bundles, build reference + hooks
cd ../ideaspaces-plugin
npm install                # install the exact protocol pin
npm run vendor             # bundles ← sibling repos; refreshes vendor-lock.json
npm run build:reference    # reference/*.md ← protocol readSkill()
npm run build:hook         # SessionStart + capture-nudge hooks
npm run typecheck

# 3. Drift + smoke checks
npm run check:generated    # committed references/hooks match their generators
npm run check:vendor       # rebuild public vendors; verify every locked hash
node cli/bundle/ideaspaces.js --help
node cli/bundle/ideaspaces.js skills
```

`vendor-lock.json` records each upstream repository commit and expected bundle hash. Vendor CI rebuilds public upstreams byte-for-byte and verifies every committed copy against its lock. The private MCP source repo enforces source → bundle freshness in its own CI; plugin CI verifies that exact bundle's locked hash without requiring cross-repo credentials.

## Status

Public preview. The local orientation and capture loop is in active use; the protocol remains provisional before 1.0, and remote hosting is optional.

## License

[MIT](LICENSE)
