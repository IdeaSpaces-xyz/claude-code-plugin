---
name: is-setup
description: >
  Conversational onboarding for an ideaspace. Inspects what's here (greenfield,
  existing markdowns, old `_agent/`, code repo), reflects findings, gets
  confirmation, scaffolds the seed of the contract (`foundation.md` +
  `guide.md` + `CLAUDE.md` + `.gitignore` + `.gitattributes`), then
  conversationally captures purpose/now/next as real files when content
  emerges. The conversational layer that `ideaspaces create` wraps. Use
  when: user says "set up a space", "add ideaspaces here", or asks about
  the contract.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_write mcp__plugin_ideaspaces_ideaspaces__is_auth Edit Read Write Glob Bash"
---

# Setup an Ideaspace

**Goal:** detect → confirm → scaffold the seed (foundation + guide) → capture purpose / now / next in conversation when content emerges.

This skill is the conversational layer for setting up a space. The mechanical CLI equivalent is `ideaspaces create [name] [--yes]` — same inspect → confirm → scaffold flow without the conversation. Invoke this skill when the user wants to talk through the setup; reach for the CLI when the user just wants the bare scaffold.

Do not offer unprompted. Wait for a signal — "set up a space", "add ideaspaces here", or detection of a directory the user wants structured.

## Inspect (read-only)

Read the cwd before acting. Surface what was found in plain language. No side effects until the user confirms.

| Signal | What it tells us |
|---|---|
| Markdown files | Content already here. Could be notes, docs, or both. |
| `.git/` | Already a git repo. Don't `git init`. |
| `_agent/` | Old shape (`always.md`, `rules.md`, `soul.md`) or new (`foundation.md` etc.). |
| `CLAUDE.md` | Claude Code orientation already configured. Don't overwrite. |
| `.github/`, `package.json`, `Cargo.toml`, etc. | Code-repo signal. |

Use `Glob` and `Read` for inspection. `Bash` for `git rev-parse --is-inside-work-tree`.

## Reflect

Surface the findings:

> "I see 12 markdown files and a git repo here, no `_agent/` yet. Want to add ideaspace structure on top, treating these markdowns as Notes?"

Confirm intent. The skill doesn't auto-decide.

## Four shapes

The flow adapts to what's there:

1. **Greenfield** — empty or near-empty. Standard scaffold.
2. **Existing markdowns, no `_agent/`** — adopt as content space; markdowns are Notes; add `_agent/` alongside. Don't touch existing files.
3. **Existing `_agent/` in old shape** — migration. Detect via `always.md` / `rules.md` / `soul.md` present, `foundation.md` missing. Walk the user file-by-file; each step a confirmation, each commit atomic.
4. **Code repo** — ask shared-vs-private `_agent/`. Default **private** (gitignored `_agent/` + `CLAUDE.local.md`); shared is opt-in (each developer maintains private context, shared conventions live in `README.md` / `CONTRIBUTING.md`).

## Scaffold

Once confirmed, scaffold the **seed** of the contract:

1. `git init` if not already a repo (ask first; default yes)
2. Create `_agent/foundation.md` and `_agent/guide.md`
3. Create `.gitattributes` (`*.md diff=markdown text eol=lf`) if not already present
4. Create `CLAUDE.md` (or `CLAUDE.local.md` for private code repos) at root pointing at the contract
5. Append `.gitignore` defaults under a `# ideaspace defaults` header. **Append, never replace.**
   - Content space: `*.draft.md`, `scratch/`, `_local/`
   - Code repo with private `_agent/`: add `_agent/`, `CLAUDE.local.md`
6. Conversational seeding (next section) — purpose / now / next emerge here, not as scaffolded files
7. Initial commit

**Why seed-only:** `foundation.md` + `guide.md` describe the contract that names `purpose.md`, `now.md`, and `next.md`. Reading them, the agent sees those names without matching files and the drift rule fires — propose creating them. Real content from real exchange beats placeholder filler. An empty file is a clearer "no direction yet" signal than a placeholder masquerading as one.

## Seed conversationally

For purpose / now / next, draw the content out and capture each as a real file (no placeholder writes):

1. **Purpose** — *"Why does this space exist? What's it for?"* Two-sentence answer becomes `_agent/purpose.md`. If a `README.md` is already present, propose a draft from it.
2. **Now** — *"What are you working on right now?"* Single paragraph becomes `_agent/now.md`.
3. **Next** — *"What's queued after now?"* Optional. Vague is OK. Skip if nothing comes to mind — the user can capture it in a later session when something does.

Each step is skippable — missing files are honest "not captured yet" signals; the next session's agent will surface them again. Capture is conscious; don't write Purpose for the user, elicit and reflect back.

## Don'ts

- **Never overwrite existing `CLAUDE.md`.** Append a `## Ideaspace` section pointing at `_agent/`, or ask the user to merge. Show a diff.
- **Never delete or modify existing markdowns.** They're the user's data.
- **Never auto-`git init`.** Surface the question; default yes.
- **Never overwrite existing `_agent/` files.** Propose changes; user confirms each.
- **Never overwrite an existing `.gitignore`.** Append under a `# ideaspace defaults` header.
- **Never silently add `.gitignore` patterns mid-session.** Gitignore edits are Agreement-level. Surface and confirm.
- **Never push automatically.** Local-first by default. `ideaspaces publish` is the explicit step the user runs when they're ready to host the space remotely.

## Optional: publish

After scaffold, if the user is logged in (`ideaspaces login` previously) and wants to host the space remotely:

> "Want to publish this to a remote space now? `ideaspaces publish` from this directory will create a server-side repo and push. Or do that later when you're ready."

Don't run `ideaspaces publish` without explicit confirmation — pushing is structural and user-facing.

## Optional: SessionStart hook

After scaffold, offer to install the SessionStart hook (lands in a subsequent step):

> "Want me to set up automatic check-in? Each new session, I'll surface Purpose, Now, and recent changes inline so you don't have to re-explain context."

Read `.claude/settings.local.json` first; merge under `hooks.SessionStart` rather than overwriting. The hook command lands when the rebuild ships — for now, the offer is the placeholder.

## Confirm

Summarize what was set up:
- `_agent/foundation.md` + `_agent/guide.md` scaffolded (the seed)
- `_agent/purpose.md` / `now.md` / `next.md` if captured in conversation; missing if skipped
- `CLAUDE.md` (or `CLAUDE.local.md`) added
- `.gitattributes` added
- `.gitignore` defaults appended
- SessionStart hook installed (if yes)
- Initial commit made

> "You're set. Next session will start oriented to your space."

## What comes next

After setup:

- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-writing** — writing standard for Notes
- **is-space** — navigation, Two Roles, the contract reference
