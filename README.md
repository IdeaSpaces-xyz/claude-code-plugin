# IdeaSpaces Plugin for Claude Code

Connect Claude Code to your [IdeaSpaces](https://ideaspaces.xyz) knowledge space. Persistent, searchable knowledge that compounds across sessions.

## Install

```bash
claude plugin marketplace add IdeaSpaces-xyz/claude-code-plugin
claude plugin install ideaspaces@claude-code-plugin
```

Or test locally:

```bash
claude --plugin-dir ./path/to/claude-code-plugin
```

## Setup

**Option A — Browser login (recommended):**

Start Claude Code with the plugin installed, then:
```
Use is_login to connect to IdeaSpaces
```
Opens your browser for Google OAuth. Credentials stored automatically.

**Option B — API key:**

1. Get an API key at [ideaspaces.xyz/settings](https://ideaspaces.xyz/settings)
2. Enter it when prompted during plugin installation

## What It Does

IdeaSpaces gives your agent a knowledge space — a searchable, entity-connected, git-versioned collection of notes that persists across sessions. Navigate by meaning, not file paths. Connect notes to entities. Apply perspectives to transform information. Track what changed over time.

### Tools

| Tool | What |
|---|---|
| `is_navigate` | Browse the tree — direction, guidance, perspectives, skills |
| `is_search` | Semantic search by meaning |
| `is_read` | Read by path or node ID |
| `is_write` | Create or update a Note |
| `is_list` | Filter nodes by entity, type, tag, contributor |
| `is_grep` | Text search or cross-file section extraction |
| `is_git` | Temporal awareness — log, changes, diff |
| `is_list_tags` | Discover existing tags |
| `is_outline` | Full tree with summaries and node IDs |
| `is_delete` | Remove a file (recoverable) |
| `is_move` | Move or rename, preserving identity |
| `is_update_metadata` | Update tags, entities, accessibility |
| `is_login` | Authenticate via browser |
| `is_logout` | Clear stored credentials |

### Skills

- **is-space** — When and how to use the knowledge space
- **is-writing** — Writing standard for Notes that compound

## Session Awareness

The plugin tracks what changed between sessions. On your first `is_navigate` call, it shows changes since your last session — so the agent picks up where it left off.
