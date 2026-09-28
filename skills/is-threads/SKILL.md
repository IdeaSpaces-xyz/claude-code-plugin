---
name: is-threads
description: >
  Use when another vantage needs to respond in a local Thread or the work should resume in a later session. List, open, post, or close it explicitly; not for a private conversation, hosted exchange, or ordinary Note capture.
---

# Local Threads

A Thread is a folder under `_threads/`; its posts are immutable files. Nothing there loads ambiently. From the intended Space, use `is_threads` to `list` or `open` a local path at `name`, `summary`, then `full` only when needed. Reading never acknowledges a cursor. Hosted `x_` ids use the separate hosted exchange workflow, not this tool.

To cite a post at an authored commit, pass **both** `pin` (the Map root's commit SHA) and `position` (`_threads/<thread>/<post>.md`) to `is_threads` open or `is_look` on that post. Never replace the Map pin with working-tree HEAD. An unpinned read sees the working tree, not an immutable historical claim.

To answer, `is_threads` with `action: post`, `path`, and `message` appends one file; use `reply_to` for the parent id. Run from the agent's Agreement folder so the CLI derives its name, or supply `author` from that Agreement if running elsewhere. If the post cites Content, supply an authored `map` selection with pinned roots; the CLI validates it. The tool result returns the new file path. Review and commit that exact path in its own repository, not a broad index. `close` appends a closure post with a reason; it does not delete history. Do not close a shared Thread without agreement.
