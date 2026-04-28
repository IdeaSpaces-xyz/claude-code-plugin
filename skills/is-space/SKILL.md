---
name: is-space
description: >
  Reference for working in an ideaspace — the five-file `_agent/` contract,
  Two Roles convention (user content vs agent context), and tool surface.
  Read this when working with `is_*` tools or when the user asks how to
  navigate their space. Native Read/Glob/Grep/Edit/Write/Bash cover most
  navigation; `is_*` adds frontmatter-aware capture and sync state.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_write mcp__plugin_ideaspaces_ideaspaces__is_auth Read Glob Grep Edit Write Bash"
---

# Working in an Ideaspace

An ideaspace is a markdown folder where knowledge accumulates. The plugin makes the agent fluent in the conventions: how the tree is shaped, where agent context lives, when to capture.

You have two sets of tools:

- **Native** — `Read`, `Glob`, `Grep`, `Edit`, `Write`, `Bash`. Default for navigation, search, and source-code work.
- **`is_*` tools** — frontmatter-aware capture (`is_write`) and sync state (`is_auth`). Use when knowledge needs Layer 1 frontmatter or when you need to know whether sync is wired.

## Start here

**No `_agent/` yet?** Suggest `/is-setup` — it walks the user through the contract scaffold and conversational seeding.

**Returning?** Read `_agent/foundation.md`, `guide.md`, `purpose.md`, `now.md`, `next.md` to orient. The SessionStart hook surfaces this inline along with each file's summary and any operating skills present.

## The five-file `_agent/` contract

Every ideaspace carries an `_agent/` folder at root:

| File | Role |
|---|---|
| `foundation.md` | What this place is, baseline behaviors. Lives only at the space root and always loads. |
| `guide.md` | How agent and human work together at this scope, anchored to foundation. |
| `purpose.md` | Why this space exists. The North Star. |
| `now.md` | What's currently active. |
| `next.md` | What's queued. |

These five files are loaded by position. Read them at session start to orient.

`CLAUDE.md` at the space root tells Claude Code where the contract is — without it, the runtime reads ancestor `CLAUDE.md` only and misses the space-specific Agreement.

Branches (deeper directories) can refine via their own `_agent/` (any of guide / purpose / now / next) without re-declaring foundation. Most branches don't need their own — a `README.md` is enough when the agreement is light.

`.gitignore` is also part of the Agreement — the boundary between what's shared and what stays local. Drafts, scratch, secrets, per-developer context go there. Propose changes; never edit silently.

### Optional: `_agent/skills/`

A space can carry **operating skills** as markdown files in `_agent/skills/`. Each skill describes a procedure the agent should follow when working in this space — for example, `_agent/skills/commit.md` defining a three-tier commit shape. Skills are surfaced at session start (the awareness block lists them by name + summary), with full content loaded on demand when invoked.

Read a skill when the agent reaches for the procedure it describes. Don't preload — the listing is enough orientation; the body matters at the moment of use.

## Two Roles at every position

Every position in the tree holds two kinds of content. The folder convention enforces the split.

| Role | What | Folder convention |
|------|------|-------------------|
| **User content** | Notes — knowledge that accumulates | regular `.md` files |
| **Agent context** | Instructions that shape the agent | `_agent/`, `README.md` |

Within user content, voices can coexist at different branches. Don't mix them in one folder — use a subfolder to mark the shift:

- **Raw personal thinking** — one person's voice, pre-refinement. Own folder (e.g., `slow-thoughts/`, `journal/`).
- **Co-produced from conversation** — human + agent. Own folder or subfolder (e.g., `conversations/`, `captured/`). Every file carries `contributed_by: ["person:...", "agent:..."]` and `origin: "conversation:..."`.
- **Stable concept docs** — refined, canonical. Top-level or `concepts/`.

When capturing from a conversation, check the target folder's voice before writing. If the folder is someone's raw personal thinking, don't write co-produced notes there — create a subfolder. See [is-writing](../is-writing/SKILL.md) for voice guidance and [is-capture](../is-capture/SKILL.md) for when to propose capture.

## `is_write` — create/update with Layer 1 frontmatter

Use for capture. Carries the writing standard. Better than raw filesystem `Write` when the file should compound as a Note.

- `is_write path="analysis.md" content="..." name="Analysis" summary="Dense orientation"` — create or replace the Note's frontmatter and body
- Optional fields: `tags`, `attached_to`, `if_match`, `force`

Replace-semantics: callers specify all Layer 1 + 2 fields they want set; existing frontmatter is replaced wholesale and the body is preserved. For local file moves, deletions, and metadata-only edits, use native `Bash` (`git mv`, `rm`) and `Edit`.

Layer 1 (required): `name`, `summary`.
Layer 2 (optional): `tags`, `attached_to`.

## `is_auth` — sync state

- `is_auth action="login"` — log in (opens browser for OAuth)
- `is_auth action="logout"` — clear credentials

Sync is opt-in. The plugin works locally without auth.

## Native tools for the rest

- **`Glob`** — find by pattern. `**/*.md`, `_agent/*.md`, etc.
- **`Grep`** — search by content or regex. Replaces semantic search until a local index returns.
- **`Read`** — read a file, optionally windowed.
- **`Edit`**, **`Write`** — modify files. Use `is_write` when the result is a Note (frontmatter, capture); use native `Write` for source code, config, plain `README.md`.
- **`Bash`** — git operations and ad-hoc shell.

## Patterns

- **Navigate before writing.** `Glob` and `Read` the target area first.
- **Search before creating.** `Grep` to check if something similar exists.
- **Entities connect.** Add `attached_to` when writing a Note: `hostname:acme.com`, `person:alice`.

## Related skills

- **is-capture** — when to propose saving knowledge during work
- **is-reflect** — when to propose updating Purpose, Now, or structure
- **is-writing** — quality standard for summaries, sections, entities
- **is-setup** — onboarding flow for a new or existing space (will become the conversational layer for `ideaspace create`)
