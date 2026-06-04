---
name: is-sync
description: >
  Sync an ideaspace when the user says sync, push, pull, share, publish current
  state, or align with remote. Treat sync as the remote agreement boundary:
  committed captures move between local and remote. If local understanding is
  not captured yet, capture first.
allowed-tools: "mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_sync mcp__plugin_ideaspaces_core__is_auth Read Bash"
---

# Sync

Sync aligns the local ideaspace with its remote. It is not where understanding is written; it moves already-captured state.

## Rule

- **Uncaptured changes?** Capture first or ask whether to leave them local.
- **Committed state?** Sync can integrate remote changes and push.
- **Missing auth?** Use `is_auth` only when sync reports credentials are needed.

## How

1. Inspect state with `is_status`.
2. If staged captures are still uncommitted, do not sync yet. Ask to commit them first (`is_commit`), or leave them local.
3. Preview when useful: `is_sync({ dry_run: true })`.
4. If the plan is safe, run `is_sync`.
5. Report what moved: integrated commits, pushed commits, or why nothing changed.

## Watch for

- Dirty working tree plus remote changes: ask before proceeding; sync may refuse until local changes are captured or stashed.
- No upstream/remote: suggest **is-publish** if the user wants to host this space remotely.
- Auth failure: offer `is_auth action="login"`, then retry sync.

## After sync

If sync followed a meaningful capture, consider **is-reflect**: does Now, Purpose, or the local agreement still match reality?
