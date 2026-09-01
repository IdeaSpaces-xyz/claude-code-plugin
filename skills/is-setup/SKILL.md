---
name: is-setup
description: >
  Set up the place someone is describing — a space for their knowledge, an agent
  with a role, or an existing remote space opened here. Use when someone names a
  thing they want to keep, track, or organize — a knowledge base, a vault for
  transcripts, a repository for the team's KPIs, notes on a topic, a small CRM —
  or a helper they want to work with: an assistant, a sales agent, a critique
  partner. Also on the direct asks: "set up a space", "add ideaspaces here",
  "create an agent", "get me into my space", "clone my notes", or a returning
  user with nothing local yet. Create inspects what's here, confirms, then runs
  `ideaspaces create` (`--agent` for an agent vantage plus character
  elicitation); Open lists your remote spaces (`is_spaces`) and clones the
  chosen one (`is_clone`). Not for building software — someone coding an app
  wants code, not a space.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_auth mcp__plugin_ideaspaces_core__is_spaces mcp__plugin_ideaspaces_core__is_clone mcp__plugin_ideaspaces_core__is_navigate Edit Read Write Glob Bash"
---

# Setup an Ideaspace

Canonical protocols: read `${CLAUDE_PLUGIN_ROOT}/reference/purpose-elicitation.md` and `${CLAUDE_PLUGIN_ROOT}/reference/repo-context.md` when eliciting direction or judging how an existing repo should be scaffolded.

**Goal:** detect → confirm → run `ideaspaces create` → capture purpose / now / next in conversation when content emerges.

This skill is the **conversational layer** around the bundled CLI. The conversation lives here; the file writes live in the CLI. That keeps one source of truth — change the CLI's templates, the skill's behavior updates automatically.

The CLI ships inside this plugin at `${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js`. Invoke via `Bash`. No separate install required.

Don't offer unprompted. Wait for a signal — "set up a space", "add ideaspaces here", or detection of a directory the user wants structured.

## Create new, open existing, or create an agent?

Three arrivals, one skill — read the signal before proceeding:

- **Create new** — structure *this* folder as a fresh space. Signals: "set up a space", "add ideaspaces here", a directory the user wants structured. → **Inspect → Reflect → create**, below.
- **Open existing** — the user already has spaces on the remote and wants one on this machine (new laptop, joining a team, "get me into my space", "clone my notes"). → **Open an existing space**, below. Requires login.
- **Create an agent** — the user wants an agent persona, not a knowledge space: "create an agent", "make me a research assistant", "I want a writing agent". → **Create an agent**, below.

Ambiguous (logged in, has spaces, empty cwd)? Ask which they want — don't assume.

## Create an agent

An agent is a **vantage-shaped space**: the five-file `_agent/` contract *is* the character (see `${CLAUDE_PLUGIN_ROOT}/reference/form-primitive.md`, Creating Agents). The space is not knowledge *about* the agent — it is the position the agent looks from, and the tree becomes its memory.

1. **Name it.** Ask what the agent should be called (short, filesystem-friendly — letters, digits, spaces, `. _ -`; the CLI refuses names that would not survive frontmatter). The agent gets its own folder.
2. **Scaffold.** Dry-run first, then apply on confirmation:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create <name> --agent
   node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create <name> --agent --yes
   ```

   The vantage foundation lands with **elicitation prompts** in Character, Boundaries, and What-this-vantage-is-not — placeholders meant to be replaced, never left standing.
3. **Elicit the character — this is the heart of the flow.** Draw it out from real examples, not adjectives: *"Walk me through a task you'd hand this agent. What did a good result look like? Where would you not trust it?"* Three to five character traits, each grounded in what it means in practice; boundaries as things it refuses or never claims without checking; one neighboring role it should not be confused with.
4. **Replace the prompts.** Use native `Edit` on `_agent/foundation.md` (contract files carry the character, not Note frontmatter), show the result, and on confirmation commit with `is_commit` using explicit paths.
5. **Offer skills.** If a repeatable procedure surfaced during elicitation ("it always formats reports the same way"), offer **is-shape** to capture it into `_agent/skills/` — and `ideaspaces skills sync` after, so the skill becomes invocable.
6. **Purpose / now stay emergent** like any space — elicit them when there is real signal, or let the drift rule surface them next session.

The agent is used by opening a session in its folder: Claude Code reads the vantage and inhabits it. Publishing works like any space when the user wants it on other devices.

## Open an existing space

1. **Ensure login.** If not logged in, run `is_auth` (login) first — `is_spaces` / `is_clone` need it.
2. **List.** `is_spaces` — show the user's remote spaces (slug, role, members). Present plainly; let them pick.
3. **Clone.** `is_clone` with the chosen space. It returns the local **path**.
4. **Orient there.** MCP tools take `cwd` per call and don't persist a working dir, so after cloning, pass the returned path as `cwd` to what follows — orient with `is_navigate` (`cwd` = the clone path) or the **is-orient** skill, and confirm the user is now working *inside* the cloned space.

**Cowork:** its sandbox may block the network that `is_spaces` / `is_clone` need. If they fail to reach the remote, tell the user to switch to **Claude Code view** for remote operations — local capture still works in Cowork.

## 1. Inspect (read-only)

Read the cwd before acting. Surface what was found in plain language. No side effects until the user confirms.

| Signal | What it tells us |
|---|---|
| Markdown files | Content already here. Could be notes, docs, or both. |
| `.git/` | Already a git repo. The CLI won't re-init. |
| `_agent/foundation.md` present | Already a complete ideaspace. The CLI will refuse; tell the user to edit `_agent/` directly. |
| `_agent/always.md` / `rules.md` / `soul.md` | Old shape. The CLI errors today; tell the user this is unimplemented. |
| `CLAUDE.md` | Claude Code orientation already configured. CLI won't overwrite. |
| `.github/`, `package.json`, `Cargo.toml`, etc. | Code-repo signal. CLI defaults to private `_agent/` + `CLAUDE.local.md`. |

Use `Glob` and `Read` for inspection. `Bash` for `git rev-parse --is-inside-work-tree`.

## 2. Reflect

Surface the findings and propose what'll happen:

> "I see 12 markdown files and a git repo here, no `_agent/` yet. I'll add the ideaspace seed (foundation + guide files in `_agent/`, a CLAUDE.md, and a `.gitignore` block). Your existing markdowns won't be touched. OK?"

Confirm intent. The skill doesn't auto-decide.

## 3. Dry-run, then apply

The CLI has a built-in `--yes`-gated dry-run. Use it as a preview before applying:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create
```

Without `--yes`, this prints the plan and exits 0 without writing. Show the plan to the user, get a final confirmation, then apply:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create --yes
```

For a code repo where the user wants shared (committed) `_agent/`, add `--shared`:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create --yes --shared
```

The CLI writes `_agent/foundation.md`, `_agent/guide.md`, `CLAUDE.md` (or `CLAUDE.local.md`), `.gitattributes`, and `.gitignore` defaults first. A shared scaffold mints portable `root_node_id` into the foundation before login; a code repo's private gitignored `_agent/` remains unstamped. Git init + the exact-path initial commit are a **best-effort finalize**. If Git is unavailable, the Space still exists with local identity but no version history, and the CLI prints the recovery commands. **Relay the CLI's own stdout; don't assume a commit happened.**

**Why seed-only:** the scaffolded foundation explains its own shape — the seed names the emergent files, and the drift rule fires from the files themselves. Nothing to restate here.

## 4. Capture purpose / now / next in conversation

For each of these, draw the content out and write the file when there's real content. **Skip the file if the user has nothing to say** — missing files are honest "not captured yet" signals; the next session's agent will surface them again.

1. **Purpose** — *"Why does this space exist? What's it for?"* Two-sentence answer becomes `_agent/purpose.md`. If a `README.md` is already present, propose a draft from it.
2. **Now** — *"What are you working on right now?"* Single paragraph becomes `_agent/now.md`.
3. **Next** — *"What's queued after now?"* Optional. Vague is OK.

Use `is_write` for these (Layer 1 frontmatter — `name`, `summary`). Don't write Purpose *for* the user — elicit and reflect back; the space's own capture rule governs the boundary. After each capture, commit it as its own capture commit with `is_commit` using the explicit path (or `all: true` for paths captured by this MCP session). Never use a broad git commit that could sweep unrelated staged work.

## 5. Offer publish

After scaffold (and capture, if any), suggest the natural next step:

> "Want to host this remotely so you can access it from other devices and Claude Code sessions? I can walk you through publishing — try `/is-publish`, or just say the word."

Don't run publish without explicit confirmation — it's a structural change and triggers OAuth login if not already done.

## Don'ts

- **Don't reimplement** what the CLI does. Run the bundle. The CLI is the source of truth for scaffold logic; this skill is the conversation around it.
- **Never overwrite existing `CLAUDE.md`.** The CLI doesn't; if the user has one, the bundle skips writing it. Append an `## Ideaspace` section manually if they want orientation pointers.
- **Never delete or modify existing markdowns.** They're the user's data. The CLI doesn't touch them either — verify if you ever bypass the CLI.
- **Don't `git init` outside the CLI.** The CLI handles it. If you `git init` first the CLI sees an existing repo and adapts.
- **Never overwrite an existing `.gitignore`.** The CLI appends under a `# ideaspace defaults` header.
- **Never push automatically.** Local-first by default. Use `/is-publish` (or the underlying `ideaspaces publish`) only when the user explicitly says so.

## Confirm

Summarize what landed:

- `_agent/foundation.md` + `_agent/guide.md` scaffolded (the seed)
- `_agent/purpose.md` / `now.md` / `next.md` if captured in conversation; missing if skipped
- `CLAUDE.md` (or `CLAUDE.local.md`) added
- `.gitattributes` + `.gitignore` defaults
- Version history: an initial commit **only if git ran** — the CLI's stdout says whether the space is versioned. If it reported "Working locally — no version history yet," relay that (and the `git init …` follow-up) instead of claiming a commit.

> "You're set. Next session will start oriented to your space. Run `/is-publish` when you're ready to host this remotely."

## What comes next

- **`/is-publish`** — host this space remotely (login + provision + push)
- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-writing** — writing standard for Notes
- **is-space** — navigation, Two Roles, the contract reference

## Recovery

If anything goes sideways during scaffold:

- The CLI's plan is dry-run by default — re-run without `--yes` to preview again
- In a **versioned** space, partial changes can be cleaned up with `git status` + `git restore` (or `git clean -n` to preview untracked files). If the space is **unversioned** (no git), there's no git recovery surface — edit or remove the scaffolded files directly
- The CLI is idempotent on existing files (won't overwrite `CLAUDE.md`, won't double-append `.gitignore` block) — re-running with `--yes` is safe
