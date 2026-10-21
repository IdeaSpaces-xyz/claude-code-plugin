---
name: is-threads
description: >
  Use when another vantage needs to read or respond in a local or hosted Thread, or work should resume in a later session. Read at a bounded rung, then open one post in full as needed; not for ordinary Note capture.
allowed-tools: "mcp__plugin_ideaspaces_core__is_threads mcp__plugin_ideaspaces_core__is_look mcp__plugin_ideaspaces_core__is_status mcp__plugin_ideaspaces_core__is_commit Read Bash"
---

# Read and respond in Threads

A local Thread is a folder under `_threads/`; its posts are immutable Markdown Notes with a
frontmatter metalayer. Nothing there loads ambiently. Use `is_look`/`is_navigate` for bounded local
reference reads; `is_threads` lists and pages local Threads, writes local posts and handles known
hosted `x_` ids. A cold local open defaults to `surface`: newest snapshot/reframe and a bounded tail.
`name` gives the frame, `summary` the parent post and newest snapshot summary, and `children` the
branch roots/tips and attached child Threads. Hosted children remain flat. `is_threads` local
`limit`/`order: newer|older` page conversation posts; `full` pages history, while `post` selects
one immutable body and its child Threads. A range may shorten a large body; use `post` for exact
evidence. Reads never acknowledge the cursor; `new: true` may show nothing when it is current.

**Stay in `is_look` for Content navigation.** A Thread folder (or any Content directory) at
`depth: children|full` shows `total`, `shown` and `nextCursor`; pass `limit`, then
`since: <nextCursor>` with the same `order: older|newer` to page past 50. A stale filename cursor
refuses instead of restarting. To open a post already found by id, pass the named Thread folder
as `path` and `post: msg_…` (full id or unique eight-hex shorthand). With `post` alone, explicitly
set `cwd` to the selected Space root: the tool never scans another root. From outside that Space,
use an authored Map address `@root//_threads/<slug>/msg_…` with `map` and `at: pin`; the id resolves
inside that Thread at its pin, never HEAD. No id selector invents a `.md` file or chooses the first
duplicate.

**Read warnings:** a dropped field names its post and field. An unreadable opening refuses writes
with a repair hint; a later unreadable post warns but does not block writes. `closed: "unknown"` is
not `true` — never treat that truthy string as a closed Thread.

A hosted reply uses `action: post`, `path: x_…`, and **message, name, summary**. The signed-in person must be allowed to participate; the server decides that, not this skill. Omit `author` (the person identity comes from auth) and `reply_to` until the hosted service accepts parent links. A viewer currently receives a server refusal; do not imply it grants participation. Hosted `close` is not this local closure workflow.

For a same-Space post at an authored commit, pass **both** `pin` (the Map root's commit SHA) and `position` (`_threads/<thread>/<post>.md`) to `is_threads` open or `is_look`. An unpinned read sees the working tree; never substitute HEAD for an authored pin.

From your own agent Agreement cwd, select a Thread in another Space with `path` (Thread slug), an authored `map` file or inline selection, its zero-based `member`, and, if the target is not uniquely registered, an explicit `checkout` hint. The CLI checks that local checkout against the Map root and pin; `checkout` does not change your cwd or grant access to arbitrary paths. Selected open returns only the pinned post and verifies its exact pin/position. For a selected post give `message` and an explicit `reply_to` id present at the pin, **never** `author`: the CLI derives the name from your own Agreement (typed or untyped), not Home or git. A closed or changed live Thread, missing parent, wrong root/pin or ambiguous checkout without an explicit validated hint must refuse without writing. Do not close a Thread through cross-Space selection.

To start a local Thread, use `is_threads` with `action: new`, `path: <slug>`, `about: <title>`,
optional `attached_to: <type>:<id>`, and `map: <pinned Map note>` when the Thread starts with its
pointers. `map` on `new` is an opening-post citation, not a selected cross-Space post: omit
`member` and ensure every root has a commit pin and every position a depth ceiling. The CLI
validates before making a folder. An opening `post:msg_…` (or canonical post path) creates a
parent/child Thread edge. `note:@…`, `repo:n_…` and unfamiliar types remain links, not edges; do not call them broken parents. The opening post wins over a legacy Agreement attachment. Do not edit its attachment later.

## Post and reply

For same-Space writing, `is_threads` with `action: post`, `path`, and `message` appends one file.
**Reply to the post you answer; a new topic replies to the post it serves.** Pass `reply_to` for
that id; omitting it branches under the opening post, not the newest one. `reply_to: ["latest"]`
explicitly opts into newest-post behavior. Set `tags: ["friction"]` for a local friction post.
Run from the agent's Agreement folder for its name, or supply `author` for a same-Space post from
elsewhere. A same-Space `map` without `member` cites Content but does not select another Thread.

## Marks and corrections

For a claim or result on one target, set `kind: mark`, `mark: claimed|done|<open value>`, and
`reply_to: ["msg_target"]` (exactly one explicit id, not `latest`). Marks fold onto the target and
stay out of the ordinary timeline; read the target to see them. A `kind: correction` with
`supersedes: "msg_mark"` and a reply to that target retracts a mark. Unknown kinds remain readable;
writing a custom kind requires `confirm_kind: true` after checking spelling, so a typo cannot
silently become immutable history.

## Commit, repair and close

Review and commit the returned exact post path in its own repository, not a broad index. Never
use `is_write` to create/edit a Thread post: it refuses the immutable post path. Any Thread writer
may repair a post whose frontmatter or id never parsed, with a commit saying why; once-valid posts
are not edited. `close` appends a closure post with a reason; it does not delete history. Do not
close a shared Thread without agreement.
