---
name: is-setup
description: >
  Conversational onboarding for an ideaspace. Inspects what's here (greenfield,
  existing markdowns, old `_agent/`, code repo), reflects findings, gets
  confirmation, scaffolds the five-file `_agent/` contract + `CLAUDE.md` +
  `.gitignore` defaults, then conversationally seeds purpose/now/next. The
  conversational layer that `ideaspace create` will wrap. Use when: user says
  "set up a space", "add ideaspaces here", or asks about the contract.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_write mcp__plugin_ideaspaces_ideaspaces__is_auth Edit Read Write Glob Bash"
---

# Setup an Ideaspace

**Goal:** detect → confirm → scaffold the five-file contract → seed Purpose / Now / Next.

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

Once confirmed:

1. `git init` if not already a repo (ask first; default yes)
2. Create `_agent/foundation.md`, `guide.md`, `purpose.md`, `now.md`, `next.md`
3. Create `CLAUDE.md` (or `CLAUDE.local.md` for private code repos) at root pointing at the contract
4. Append `.gitignore` defaults under a `# ideaspace defaults` header. **Append, never replace.**
   - Content space: `*.draft.md`, `scratch/`, `_local/`
   - Code repo with private `_agent/`: add `_agent/`, `CLAUDE.local.md`
5. Conversational seeding (next section)
6. Initial commit

## Seed conversationally

For purpose / now / next:

1. **Purpose** — *"Why does this space exist? What's it for?"* Two-sentence answer becomes `purpose.md`. If a `README.md` is already present, propose a draft from it.
2. **Now** — *"What are you working on right now?"* Single paragraph becomes `now.md`.
3. **Next** — *"What's queued after now?"* Optional. Vague is OK. Leave a placeholder if nothing comes to mind.

Each step is skippable — the user can fill in later. Capture is conscious; don't write Purpose for the user, elicit and reflect back.

## Don'ts

- **Never overwrite existing `CLAUDE.md`.** Append a `## Ideaspace` section pointing at `_agent/`, or ask the user to merge. Show a diff.
- **Never delete or modify existing markdowns.** They're the user's data.
- **Never auto-`git init`.** Surface the question; default yes.
- **Never overwrite existing `_agent/` files.** Propose changes; user confirms each.
- **Never overwrite an existing `.gitignore`.** Append under a `# ideaspace defaults` header.
- **Never silently add `.gitignore` patterns mid-session.** Gitignore edits are Agreement-level. Surface and confirm.
- **Never push to a remote.** Local-first; the user pushes when they choose.

## Optional: SessionStart hook

After scaffold, offer to install the SessionStart hook (lands in a subsequent step):

> "Want me to set up automatic check-in? Each new session, I'll surface Purpose, Now, and recent changes inline so you don't have to re-explain context."

Read `.claude/settings.local.json` first; merge under `hooks.SessionStart` rather than overwriting. The hook command lands when the rebuild ships — for now, the offer is the placeholder.

## Confirm

Summarize what was set up:
- `_agent/` scaffolded (five files)
- `CLAUDE.md` (or `CLAUDE.local.md`) added
- `.gitignore` defaults appended
- Purpose / Now / Next seeded (one line each)
- SessionStart hook installed (if yes)
- Initial commit made

> "You're set. Next session will start oriented to your space."

## What comes next

After setup:

- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-writing** — writing standard for Notes
- **is-space** — navigation, Two Roles, the five-file contract reference
