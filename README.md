# IdeaSpaces Plugin for Claude Code

Connect Claude Code to your [IdeaSpaces](https://ideaspaces.xyz) knowledge space. Persistent, searchable knowledge that compounds across sessions.

## Setup

1. Get an API key at [ideaspaces.xyz/settings](https://ideaspaces.xyz/settings)
2. Install the plugin:
   ```bash
   claude plugin install ideaspaces
   ```
3. Enter your API key when prompted

## Tools

10 tools for working with your knowledge space:

| Tool | What |
|---|---|
| `is_navigate` | Browse the tree — context, summaries, Now |
| `is_search` | Semantic search by meaning |
| `is_read` | Read a file with metadata |
| `is_write` | Create or update a Note |
| `is_grep` | Text search or cross-file section extraction |
| `is_git` | Temporal awareness — log, changes, diff |
| `is_list_tags` | Discover existing tags |
| `is_delete` | Remove a file (recoverable) |
| `is_move` | Move or rename, preserving identity |
| `is_update_metadata` | Update tags, entities, accessibility |

## Skills

- **is-space** — How to work with the knowledge space (orient → engage → organize)
- **is-writing** — Writing standard for Notes that compound (summaries, sections, entities)

## Development

```bash
# Test locally
claude --mcp-config mcp-test.json --plugin-dir ./ideaspaces-plugin

# The MCP server runs standalone too
IS_API_KEY=your_key node mcp-server/dist/index.js
```
