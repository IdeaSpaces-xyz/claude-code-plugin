---
name: is-push
description: >
  Push an ideaspace when the user asks to push, sync, or send committed captures
  to its existing remote. Push never changes recipients or public visibility;
  use is-share for those requests. If you are behind, pull first. Capture first
  if changes aren't committed.
allowed-tools: "mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit mcp__plugin_ideaspaces_core__is_push mcp__plugin_ideaspaces_core__is_pull mcp__plugin_ideaspaces_core__is_auth Read Bash"
---

# Push

Push sends your committed captures to the remote. It is one direction across the agreement boundary — it never integrates others' work in.

Push is not access sharing. Requests to share with a person or team, inspect recipients, or change public/private visibility belong to **is-share**.

## Rule

- **Uncommitted captures?** They won't be pushed. Capture first (`is_commit`), or ask whether to leave them local.
- **Behind the remote?** Push refuses — run `is_pull` first, then push. You can't push over remote work.
- **Missing auth?** Use `is_auth` only when push reports credentials are needed.

## How

1. Inspect state with `is_status`.
2. If staged captures are uncommitted, commit them first (`is_commit`) or leave them local.
3. Preview when useful: `is_push({ dry_run: true })`.
4. If behind, pull first with `is_pull`, then push.
5. If the plan is safe, run `is_push`.
6. Report what pushed, or why nothing changed.

## Watch for

- No upstream/remote: suggest **is-publish** if the user wants to host this space remotely.
- Auth failure: offer `is_auth action="login"`, then retry push.

## After push

If push followed a meaningful capture, consider **is-reflect**: does Now, Purpose, or the local agreement still match reality?
