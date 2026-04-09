---
name: is-space
description: >
  Work with the IdeaSpaces knowledge space. Use is_* tools instead of local
  file tools when working with knowledge that should be searchable, connected
  to entities, and persist across sessions. Read this when you see is_* tools
  available or when the user asks about their knowledge space.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write mcp__plugin_ideaspaces_ideaspaces__is_auth"
---

# Working with IdeaSpaces

You have two sets of tools: local file tools (Read, Write, Edit, Bash) and IdeaSpaces tools (is_*). Use the right set for the task.

**IdeaSpaces (is_* tools)** — knowledge that should be findable by meaning, connected to entities, and shared across sessions. Decisions, research, architecture, plans, profiles, analysis.

**Local file tools** — source code, config, temporary artifacts, build outputs.

## Start Here

**Orient first.** Call `is_explore` at the start of a session to see the space — branches, README context, what changed since last session.

## Tools

### is_explore — see what's there
Navigate the knowledge tree. Returns branch context, children with summaries, agent guidance (Direction, Perspectives, Skills).

- `is_explore` — root of the space
- `is_explore path="core/"` — subtree
- `is_explore full=true` — full outline of every file and directory

### is_find — search for knowledge
Three methods in one tool. Automatically picks the right approach.

- `is_find query="MCP architecture"` — semantic search (default)
- `is_find method="grep" query="TODO"` — text/regex in files
- `is_find method="grep" heading="## Decision"` — extract sections by heading
- `is_find method="list" tag="architecture"` — filter by metadata
- `is_find method="list" attached_to="hostname:acme.com"` — find by entity

Filters: `scope`, `type`, `tag`, `attached_to`, `contributed_by`, `limit`.

### is_read — read content
Read a note's full content and metadata. Accepts paths or node IDs.

- `is_read path="core/About.md"` — by path
- `is_read path="n_b4d942f682a0"` — by node ID
- `is_read path="core/About.md" history=true` — include git log
- `is_read path="core/About.md" offset=10 limit=50` — windowed read

### is_write — create, update, move, delete
Four actions in one tool.

- `is_write path="analysis.md" content="# Analysis\n..." name="Analysis" summary="Key findings" tags=["research"]` — create/update
- `is_write action="update_metadata" node_id="n_abc" tags=["core"] attached_to=["hostname:acme.com"]` — update metadata
- `is_write action="move" source="old/path.md" destination="new/path.md"` — move/rename
- `is_write action="delete" path="draft.md"` — delete (recoverable via git)

Write fields: `name`, `summary`, `tags`, `attached_to`, `if_match` (conditional write).

### is_auth — connect and manage
- `is_auth` — login (opens browser for OAuth)
- `is_auth repo="my-notes"` — select a specific space
- `is_auth action="repos"` — list available spaces
- `is_auth action="status"` — connection info
- `is_auth action="logout"` — clear credentials

## Key Patterns

- **Navigate before writing.** `is_explore` the target area first. Place content where it compounds.
- **Search before creating.** `is_find` to check if something similar exists. Build on what's there.
- **Summary is everything.** The `summary` field determines how a Note is found. Write it like the first thing someone reads.
- **Entities connect.** Add `attached_to` when writing: `hostname:acme.com`, `person:alice`.
- **IDs are stable.** Node IDs survive moves and renames. Use them for references.
