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

Start Claude Code with the plugin, then type:
```
Use is_login to connect to IdeaSpaces
```
This opens your browser for Google OAuth. Credentials are stored automatically.

**Option B — API key:**

1. Get an API key at [ideaspaces.xyz/settings](https://ideaspaces.xyz/settings)
2. Enter it when prompted during plugin installation

## Tools

13 tools for working with your knowledge space:

| Tool | What |
|---|---|
| `is_navigate` | Browse the tree — context, summaries, guidance, perspectives |
| `is_search` | Semantic search by meaning |
| `is_read` | Read a file or note by path or ID |
| `is_write` | Create or update a Note |
| `is_grep` | Text search or cross-file section extraction |
| `is_git` | Temporal awareness — log, changes, diff |
| `is_list` | Filter nodes by entity, type, tag, contributor |
| `is_list_tags` | Discover existing tags |
| `is_outline` | Full tree with summaries and node IDs |
| `is_delete` | Remove a file (recoverable) |
| `is_move` | Move or rename, preserving identity |
| `is_update_metadata` | Update tags, entities, accessibility |
| `is_login` | Authenticate via browser |

## Skills

- **is-space** — How to work with the knowledge space (orient → engage → organize)
- **is-writing** — Writing standard for Notes that compound
