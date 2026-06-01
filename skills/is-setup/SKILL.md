---
name: is-setup
description: >
  Conversational onboarding for an ideaspace. Inspects what's here (greenfield,
  existing markdowns, old `_agent/`, code repo), reflects findings, gets
  confirmation, then runs `ideaspaces create` via the bundled CLI to scaffold
  the seed of the contract. Captures purpose / now / next as real files in
  conversation when content emerges. Use when: user says "set up a space",
  "add ideaspaces here", or asks about the contract.
allowed-tools: "mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_auth Edit Read Write Glob Bash"
---

# Setup an Ideaspace

Full protocol: read `${CLAUDE_PLUGIN_ROOT}/reference/purpose-elicitation.md` and `${CLAUDE_PLUGIN_ROOT}/reference/repo-context.md`.

**Goal:** detect → confirm → run `ideaspaces create` → capture purpose / now / next in conversation when content emerges.

This skill is the **conversational layer** around the bundled CLI. The conversation lives here; the file writes live in the CLI. That keeps one source of truth — change the CLI's templates, the skill's behavior updates automatically.

The CLI ships inside this plugin at `${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js`. Invoke via `Bash`. No separate install required.

Don't offer unprompted. Wait for a signal — "set up a space", "add ideaspaces here", or detection of a directory the user wants structured.

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

The CLI handles git init (if needed), `_agent/foundation.md`, `_agent/guide.md`, `CLAUDE.md` (or `CLAUDE.local.md`), `.gitattributes`, `.gitignore` defaults, and the initial commit. Errors don't roll back partial scaffolds — git is the recovery surface.

**Why seed-only:** `foundation.md` + `guide.md` describe the contract that names `purpose.md`, `now.md`, and `next.md`. Reading them, an agent sees those names without matching files and the drift rule fires — propose creating them. Real content from real exchange beats placeholder filler.

## 4. Capture purpose / now / next in conversation

For each of these, draw the content out and write the file when there's real content. **Skip the file if the user has nothing to say** — missing files are honest "not captured yet" signals; the next session's agent will surface them again.

1. **Purpose** — *"Why does this space exist? What's it for?"* Two-sentence answer becomes `_agent/purpose.md`. If a `README.md` is already present, propose a draft from it.
2. **Now** — *"What are you working on right now?"* Single paragraph becomes `_agent/now.md`.
3. **Next** — *"What's queued after now?"* Optional. Vague is OK.

Use `is_write` for these (Layer 1 frontmatter — `name`, `summary`). Capture is conscious; don't write Purpose for the user, elicit and reflect back. After each capture, commit it as its own commit (`Bash: git add _agent/{file}.md && git commit -m "Capture {name}"`).

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
- Initial commit + any capture commits

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
- Partial scaffolds can be cleaned up with `git status` + `git restore` (or `git clean -n` to preview untracked files)
- The CLI is idempotent on existing files (won't overwrite `CLAUDE.md`, won't double-append `.gitignore` block) — re-running with `--yes` is safe
