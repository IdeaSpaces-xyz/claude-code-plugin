---
name: is-space
description: >
  Work with the IdeaSpaces knowledge space. Use is_* tools instead of local
  file tools when working with knowledge that should be searchable, connected
  to entities, and persist across sessions. Read this when you see is_* tools
  available or when the user asks about their knowledge space.
allowed-tools: "mcp__ideaspaces__is_navigate mcp__ideaspaces__is_search mcp__ideaspaces__is_read mcp__ideaspaces__is_write mcp__ideaspaces__is_grep mcp__ideaspaces__is_git mcp__ideaspaces__is_list_tags mcp__ideaspaces__is_list mcp__ideaspaces__is_delete mcp__ideaspaces__is_move mcp__ideaspaces__is_update_metadata mcp__ideaspaces__is_outline"
---

# Working with IdeaSpaces

You have two sets of tools: local file tools (Read, Write, Edit, Bash) and IdeaSpaces tools (is_*). Use the right set for the task.

**Local tools for code. is_* tools for knowledge.** If it should be findable by meaning, connected to entities, and persist across sessions — use is_* tools. If it's a source file, config, or temporary artifact — use local tools.

## Start Here

**Orient first.** Call `is_navigate` at the start of a session to understand the space — what branches exist, what the user is working on (Now), what guidance applies. This is your map.

## The 12 Tools

### Orient — understand what's there

- `is_navigate` — tree position + awareness. Returns README context, children with summaries, agent guidance, Now. **Navigate before writing** to understand where content belongs.
- `is_search` — find by meaning across the Space. Supports facet filtering by entity, type, directory, author, tags. Use to discover existing knowledge before creating.
- `is_grep` — text/regex search within files, or extract sections by heading across files. Complements semantic search — is_search finds meaning, is_grep finds exact references.
- `is_outline` — full tree of the space — every file and directory with name, summary, node ID. Use for big-picture orientation and resolving references.

### Engage — read and write

- `is_read` — full content + metadata (tags, attached_to, node_id, SHA). Supports windowed reads with offset/limit — grep for a heading, then read just that section.
- `is_write` — create or update a Note. Gets indexed, embedded, searchable. **Summary is the most important field** — it's what search shows and what loads in context. Use `attached_to` for entity binding: `hostname:x`, `person:y`, `note:n_id`.

### Organize — restructure the space

- `is_delete` — remove a file. Recoverable via git history.
- `is_move` — move or rename a file or directory. Preserves node identity and history.
- `is_update_metadata` — update tags, entities, accessibility on a node without re-embedding.

### Time — track evolution

- `is_git` — temporal awareness. Operations: `log` (recent commits), `changes` (files changed since a SHA), `find` (commits that introduced a string), `diff` (what a commit changed), `word_diff` (word-level diff). Scope any operation to a path for file-level history.
- `is_list_tags` — discover what tags exist before tagging. Prevents duplicates.
- `is_list` — structural traversal by metadata: filter nodes by entity, type, tag, contributor, directory. Complements is_search (semantic) — is_list finds by relationship, is_search finds by meaning.

## Key Patterns

- **Navigate before writing.** Always `is_navigate` the target area first. Understand what branches mean (READMEs). Place content where it compounds with related knowledge.
- **Search before creating.** `is_search` to check if something similar exists. Avoid duplicates. Build on what's there.
- **Summary is everything.** The `summary` field determines how a Note is found. Write it like the first thing someone reads.
- **Entities connect.** Add `attached_to` when writing: `hostname:acme.com`, `person:alice`. This is how Notes connect across the Space.
- **Position matters.** Where you `is_write` determines which branch context applies. Navigate first, understand the branch, then write.
