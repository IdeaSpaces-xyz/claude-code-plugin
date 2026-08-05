---
name: is-space
description: >
  Reference for working in an ideaspace — the five-file `_agent/` contract,
  Two Roles convention, and Claude plugin tool surface. Use when the user asks
  how an ideaspace works. For active intents, prefer the loop skills:
  is-orient, is-capture, is-push, is-pull, is-reflect, and is-shape.
allowed-tools: "mcp__plugin_ideaspaces_core__is_navigate mcp__plugin_ideaspaces_core__is_write mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_push mcp__plugin_ideaspaces_core__is_pull mcp__plugin_ideaspaces_core__is_auth Read Glob Grep Edit Write Bash"
---

# Working in an Ideaspace

Canonical protocols: read `${CLAUDE_PLUGIN_ROOT}/reference/guide.md`, `${CLAUDE_PLUGIN_ROOT}/reference/capture.md`, `${CLAUDE_PLUGIN_ROOT}/reference/writing.md`, or `${CLAUDE_PLUGIN_ROOT}/reference/awareness.md` when the task needs the full shared standard. This entrypoint adds Claude-specific navigation and tool guidance.

An ideaspace is inhabited through a simple loop:

```text
arrive → orient → inspect → act → capture → push/pull → reflect
```

The plugin handles **arrive** automatically with SessionStart awareness. For active work, pick the intent skill by tier:

- **Daily loop** — `is-orient`, `is-capture`, `is-push` / `is-pull`, `is-reflect`.
- **Space lifecycle** — `is-setup`, `is-publish`, `is-shape`.
- **Reference** — `is-space`, `is-writing`.

You have two working surfaces:

- **Skills** — agent procedures for user intent. Use these first.
- **Tools** — low-level primitives (`is_navigate`, `is_status`, `is_write`, `is_commit`, `is_push`, `is_pull`, `is_auth`). Skills choose the mechanism; don't make backend choice the user's problem.

Native `Read`, `Glob`, `Grep`, `Edit`, `Write`, and `Bash` remain the default for navigation, search, source-code work, and ordinary doc edits.

## Start here

**No `_agent/` yet?** Suggest `/is-setup` — it walks the user through the contract scaffold and conversational seeding.

**Returning?** The SessionStart hook surfaces what's present inline along with each file's summary and any operating skills. If you need to refresh at the current position or a branch, use **is-orient** or `is_navigate`.

Read `_agent/foundation.md` and `_agent/guide.md` first when acting beyond the injected awareness — they always exist on a scaffolded space. Then `_agent/purpose.md`, `now.md`, `next.md` when present; a named-but-absent file is a drift signal — surface it and propose capturing before other work.

## The `_agent/` contract

The contract's shape is deliberately not restated here. Every scaffolded space carries it in its own `_agent/foundation.md` — the five files, seed vs emergent, the skills/perspectives dimensions, the `.gitignore` boundary — and the shared operating standard lives in `${CLAUDE_PLUGIN_ROOT}/reference/guide.md`. Read the space's foundation; restating shape in entrypoints is how drift happens. Not in a space yet? `/is-setup` scaffolds the seed.

Branches (deeper directories) refine via their own `_agent/` without re-declaring foundation; most branches need only a `README.md`. Operating skills in `_agent/skills/` are listed at session start by name + summary — read a skill's body at the moment of use, don't preload.

## Two Roles at every position

Knowledge (regular `.md` files) and agent context (`_agent/`, `README.md`) — the protocol's split: the first is content that accumulates, the second is instruction read by position.

Within user content, voices can coexist at different branches. Don't mix them in one folder — use a subfolder to mark the shift:

- **Raw personal thinking** — one person's voice, pre-refinement. Own folder (e.g., `slow-thoughts/`, `journal/`).
- **Co-produced from conversation** — human + agent. Own folder or subfolder (e.g., `conversations/`, `captured/`). Who made it is recorded in the commit, not in frontmatter.
- **Stable concept docs** — refined, canonical. Top-level or `concepts/`.

When capturing from a conversation, check the target folder's voice before writing. If the folder is someone's raw personal thinking, don't write co-produced notes there — create a subfolder. See [is-writing](../is-writing/SKILL.md) for voice guidance and [is-capture](../is-capture/SKILL.md) for when to propose capture.

## Capture primitives

Use **is-capture** for the outer intent. It decides whether the mechanism is `is_write`, native edits, or a commit of explicit paths.

### `is_write` — create/update with Layer 1 frontmatter

Use inside capture when the target is a Note. It carries the writing standard and stages the result.

- `is_write path="analysis.md" content="..." name="Analysis" summary="Dense orientation"` — create or update the Note, stage it, and return a content `sha`
- Optional fields: `tags`, `attached_to`, `if_match`, `force`, `cwd`

Replace-semantics: callers specify all Layer 1 + 2 fields they want set; existing frontmatter is replaced wholesale. For file moves, deletions, and metadata-only edits, use native `Bash` (`git mv`, `rm`) and `Edit`.

Layer 1 (required): `name`, `summary`.
Layer 2 (optional): `tags`, `attached_to`.

Safe update flow:

- First update to an existing file: call `is_status({ path })`, then pass its `sha` as `is_write.if_match`.
- Refinement of a file just written: use the previous `is_write` response's `sha`.
- Use `force: true` only after re-reading and reconciling divergent content.

### `is_status` — capture state and file sha

- No path: shows git position plus staged IdeaSpaces captures awaiting commit.
- With `path`: returns single-file state, including the `sha` for `is_write.if_match`.

### `is_commit` — explicit capture commit

Use inside capture after user confirmation:

- `is_commit message="Capture decision" all=true` — commit all reviewed staged knowledge (markdown + `_agent/`)
- `is_commit message="Capture decision" paths=["notes/decision.md"]` — commit explicit paths

It never sweeps unrelated staged user work into the capture commit.

### `is_push` / `is_pull` — the two directions

Use **is-push** and **is-pull** for the outer intent. `is_pull` integrates remote changes into the local space and never pushes; `is_push` sends committed captures and never pulls. Push refuses when behind — pull first. Both refuse while staged knowledge is uncommitted. Use `dry_run: true` to preview.

**`cwd` matters after `cd` in Bash.** The MCP server is a separate process from the agent's Bash tool, so subprocess directory changes do not propagate to MCP tools. Pass `cwd` whenever the intended working directory differs from session start:

```
is_write path="_agent/purpose.md" content="..." name="Purpose" summary="..."
         cwd="/abs/path/to/the/space"
```

The default is the MCP server's launch directory.

## `is_auth` — sync state

- `is_auth action="login"` — log in (opens browser for OAuth)
- `is_auth action="logout"` — clear credentials

Sync is opt-in. The plugin works locally without auth.

To host a space remotely after login, use `/is-publish` or run `ideaspaces publish` from inside the space directory. It creates a server-side bare repo, sets the local `user.email` to the OAuth-resolved identity, and pushes. Folder ↔ repo mapping persists at `~/.ideaspaces/spaces.json` so re-publishing from the same dir reuses the existing remote.

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

- **is-orient** — refresh footing at the current position
- **is-capture** — when to preserve agreed understanding
- **is-reflect** — when to propose updating Purpose, Now, or structure
- **is-writing** — quality standard for summaries, sections, entities
- **is-setup** — conversational layer over `ideaspaces create` for a new or existing space
- **is-shape** — create `_agent/` primitives and perspectives
- **is-push** / **is-pull** — share or integrate committed captures
