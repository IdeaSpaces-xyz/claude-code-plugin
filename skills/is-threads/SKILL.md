---
name: is-threads
description: >
  Use when another vantage needs to respond in a local Thread or the work should resume in a later session. List, open, post, or close it explicitly; not for a private conversation, hosted exchange, or ordinary Note capture.
allowed-tools: "mcp__plugin_ideaspaces_core__is_threads mcp__plugin_ideaspaces_core__is_look mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit Read Bash"
---

# Local Threads

A Thread is a folder under `_threads/`; its posts are immutable files. Nothing there loads ambiently. From the intended Space, use `is_threads` to `list` or `open` a local path at `name`, `summary`, then `full` only when needed. Reading never acknowledges a cursor. Hosted `x_` ids use the separate hosted exchange workflow, not this tool.

For a same-Space post at an authored commit, pass **both** `pin` (the Map root's commit SHA) and `position` (`_threads/<thread>/<post>.md`) to `is_threads` open or `is_look`. An unpinned read sees the working tree; never substitute HEAD for an authored pin.

From your own agent Agreement cwd, select a Thread in another Space with `path` (Thread slug), an authored `map` file or inline selection, its zero-based `member`, and, if the target is not uniquely registered, an explicit `checkout` hint. The CLI checks that local checkout against the Map root and pin; `checkout` does not change your cwd or grant access to arbitrary paths. Selected open returns only the pinned post and verifies its exact pin/position. For a selected post give `message` and an explicit `reply_to` id present at the pin, **never** `author`: the CLI derives the name from your own Agreement (typed or untyped), not Home or git. A closed or changed live Thread, missing parent, wrong root/pin or ambiguous checkout without an explicit validated hint must refuse without writing. Do not close a Thread through cross-Space selection.

For same-Space writing, `is_threads` with `action: post`, `path`, and `message` appends one file; use `reply_to` for the parent id. Run from the agent's Agreement folder for its name, or supply `author` for a same-Space post from elsewhere. A same-Space `map` without `member` cites Content but does not select another Thread. Review and commit the returned exact post path in its own repository, not a broad index. `close` appends a closure post with a reason; it does not delete history. Do not close a shared Thread without agreement.
