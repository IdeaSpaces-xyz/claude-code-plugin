# IdeaSpaces for Claude Code, Codex, and Cowork

[![CI](https://github.com/IdeaSpaces-xyz/claude-code-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/IdeaSpaces-xyz/claude-code-plugin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> An agent is a folder. This plugin teaches yours to work in one.

An ideaspace is a folder of Markdown under git that holds two things: **your knowledge**, and **how to work with it**. Open your agent inside one and that's who you're talking to. The instructions live in the folder, not in the model, so the same folder works in Claude Code today and in whatever you run next year.

The plugin does three things. On arrival it reads the folder's `_agent/` instructions, the tree, and what changed since last time. While you work it proposes writing down decisions and findings as plain Markdown, and commits only what you agreed to, with your name on it. When you want, it publishes, shares, pushes, or pulls. Everything stays on your machine until then.

[How it works](https://ideaspaces.xyz/how-it-works) · [The protocol](https://github.com/IdeaSpaces-xyz/ideaspace-protocol) · [Use with Pi](https://github.com/IdeaSpaces-xyz/pi-is-space)

## Install

The marketplace is this repository: `IdeaSpaces-xyz/claude-code-plugin`.

**Claude Code**, inside a session:

```
/plugin marketplace add IdeaSpaces-xyz/claude-code-plugin
/plugin install ideaspaces@ideaspaces-xyz
```

Or from the terminal:

```bash
claude plugin marketplace add IdeaSpaces-xyz/claude-code-plugin
claude plugin install ideaspaces@ideaspaces-xyz
```

**Codex**:

```
codex plugin marketplace add IdeaSpaces-xyz/claude-code-plugin
codex plugin add ideaspaces@ideaspaces-xyz
```

**Cowork**: Customize → Plugins → Add marketplace → paste `IdeaSpaces-xyz/claude-code-plugin` → install **ideaspaces**. Cowork's sandbox blocks remote sync; capture there, and switch to Claude Code view to publish, push, or pull the same folder.

**Claude Code, for a whole team**: commit this to `.claude/settings.json` and everyone who trusts the repo gets it:

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

**Node.js 18+** and **git** on your PATH. Claude Code's native installer does not put `node` on your PATH, so a machine that only has Claude Code may not have it. Ask your agent: *"set up my machine for IdeaSpaces"*. It finds what is missing and installs it for your OS. Then restart the agent.

## First session

Open your agent in any folder and say one of these:

- *"set up an ideaspace here"* — looks at what is in the folder, draws out what the place is and how work goes, then writes that as `_agent/agreement.md`.
- *"create an agent"* — a folder that *is* an agent; who it is is drawn out in conversation and written as its Agreement.
- *"take this space home"* with a public space URL — a local copy, no account needed.

From then on, just work. When something worth keeping lands, the agent offers to write it down. Say *"write this down"* to do it yourself. Say *"publish this space"* to host it, *"share this with alice@example.com"* to let someone in, *"check my inbox"* to read questions about what you shared.

Type `/` to see the skills: `is-setup`, `is-guide`, `is-orient`, `is-capture`, `is-shape`, `is-space`, `is-fork`, `is-publish`, `is-share`, `is-inbox`, `is-threads`, `is-push`, `is-pull`. Two more work on the agent's own initiative: `is-reflect` offers to update direction when it drifts, and `is-writing` shapes how notes are written.

## What it installs

- **A session-start hook** that renders the folder's orientation: position, current focus, tree, `_agent/` instructions, skills, and what changed since last time. It stays under Claude Code's 10,000-character limit for inline hook output: a long Agreement arrives as its summary plus the path to read in full, rather than as a clipped preview. Inside an ideaspace it also says how to read Notes: with `is_look` or `Read`, not `cat`, so the reads can reach the conversation Map.
- **MCP tools**, loaded from the first turn rather than deferred behind tool search, for the local loop. That costs about 5.4 K tokens of cached context in every session where the plugin is enabled, inside an ideaspace or not. The tools: reference-only `is_navigate`, five-rung `is_look`, explicit `is_threads` (local list/open/post/close plus hosted x_ open/reply, five bounded rungs and authored Map-member selection across local Spaces without changing the agent's cwd; no ambient loading), `is_write`, `is_commit`, `is_status`, `is_change_open` / `is_change_close`, and `is_auth`, `is_spaces`, `is_clone`, `is_push`, `is_pull` for the optional remote. `is_look` reads one local Note, Content directory or Thread folder at `name`, `summary`, `surface`, `children`, or `full` without adopting its Agreement.
- **`is_collaborate`** — open or resume a local Agreement POV in a selected Pi or Claude runtime through the bundled CLI. Give an explicit local repo path and a message stating the purpose; choose runtime, model, Pi thinking or supported Claude effort separately. Claude starts with restricted read-only tools (Read/Grep/Glob, no MCP); writing requires `read_only: false`, and `bypassPermissions` must be chosen explicitly. An answer includes the `conversation_id` for `say`. `close` is non-destructive and does not imply a live child survived. For a Pi child, install and activate `@ideaspaces/pi-is-space` and `@ideaspaces/pi-local-context` in your user-scoped Pi installation first. The adapter reads only those installed connectors (not packages from the target repo), checks their declared extension/skill paths, and passes them explicitly to the CLI; it refuses with a remedy if either is missing. The CLI checks saved project-resource trust before it launches. The first turn gets its conversation id from the CLI; `say` resumes that exact id. Claude children do not require Pi connectors.
- **The `ideaspaces` CLI**, bundled, for fork, update, publish, share, inbox, and explicit local Threads. No global install needed. Its own page: [IdeaSpaces-xyz/cli](https://github.com/IdeaSpaces-xyz/cli).
- **A pre-commit nudge**: if a plain `git commit` is about to run inside an ideaspace, it notes once per session that `is_commit` would carry attribution and would not sweep up a teammate's staged files.

The plugin ships pre-built. The MCP server and CLI are vendored bundles with locked hashes; the skills' reference text is built from the protocol at an exact pin.

## Contributing

Bundles are build outputs; regenerate, never hand-edit:

```bash
cd ../cli && npm run build && npm run bundle
cd ../mcp-server && npm run build && npm run bundle
cd ../ideaspaces-plugin
npm install && npm run vendor && npm run build:reference && npm run build:hook
npm run typecheck && npm run check:generated && npm run check:vendor
```

Every PR that changes what users receive bumps the version in both `.claude-plugin/plugin.json` and `package.json`. Claude Code keys its install cache by that version. See [`CLAUDE.md`](CLAUDE.md).

## Status

Public preview. The local loop is in daily use. The protocol is provisional before 1.0. Hosting is optional.

## License

[MIT](LICENSE)
