---
name: is-threads
description: >
  Use when another vantage needs to read or respond in a local or hosted Thread, or work should resume in a later session. Read at a bounded rung, then open one post in full as needed; not for ordinary Note capture.
allowed-tools: "mcp__plugin_ideaspaces_core__is_threads mcp__plugin_ideaspaces_core__is_look mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit Read Bash"
---

# Read and respond in Threads

A local Thread is a folder under `_threads/`; its posts are immutable files. Nothing there loads ambiently. `is_threads` lists local Threads from the intended Space, then opens a local path or a known hosted `x_` id. Read `name` to orient, `summary` with `new` or `since` for what moved, `children` to choose a branch (hosted children are flat until the service exposes reply links), `surface` with `post` to see one body, and `full` only when the whole history is needed. `post` on an open read selects one immutable post in full regardless of depth. A read never acknowledges the cursor; `new` may legitimately show no posts when the cursor is current.

A hosted reply uses `action: post`, `path: x_…`, and **message, name, summary**. The signed-in person must be allowed to participate; the server decides that, not this skill. Omit `author` (the person identity comes from auth) and `reply_to` until the hosted service accepts parent links. A viewer currently receives a server refusal; do not imply it grants participation. Hosted `close` is not this local closure workflow.

For a same-Space post at an authored commit, pass **both** `pin` (the Map root's commit SHA) and `position` (`_threads/<thread>/<post>.md`) to `is_threads` open or `is_look`. An unpinned read sees the working tree; never substitute HEAD for an authored pin.

From your own agent Agreement cwd, select a Thread in another Space with `path` (Thread slug), an authored `map` file or inline selection, its zero-based `member`, and, if the target is not uniquely registered, an explicit `checkout` hint. The CLI checks that local checkout against the Map root and pin; `checkout` does not change your cwd or grant access to arbitrary paths. Selected open returns only the pinned post and verifies its exact pin/position. For a selected post give `message` and an explicit `reply_to` id present at the pin, **never** `author`: the CLI derives the name from your own Agreement (typed or untyped), not Home or git. A closed or changed live Thread, missing parent, wrong root/pin or ambiguous checkout without an explicit validated hint must refuse without writing. Do not close a Thread through cross-Space selection.

For same-Space writing, `is_threads` with `action: post`, `path`, and `message` appends one file; use `reply_to` for the parent id. Run from the agent's Agreement folder for its name, or supply `author` for a same-Space post from elsewhere. A same-Space `map` without `member` cites Content but does not select another Thread. Review and commit the returned exact post path in its own repository, not a broad index. `close` appends a closure post with a reason; it does not delete history. Do not close a shared Thread without agreement.
