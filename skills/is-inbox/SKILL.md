---
name: is-inbox
description: >
  Read and reply to direct Inbox messages, or ask a person a question about
  shared Content from the local agent. Use when the user says check my Inbox,
  read this message, ask the owner/person about this, send an inquiry, or reply.
  Not for giving someone access to a Space; that is is-share.
allowed-tools: "mcp__plugin_ideaspaces_core__is_auth Read Bash"
---

# Direct Inbox

Inbox is the person-accountable feedback loop around shared Content. A local agent may help compose
and invoke it, but every read and send acts as the logged-in person. Never substitute a bare Agent
credential or reproduce the flow with raw API calls.

This skill invokes the CLI bundled with the plugin:

```bash
CLI=(node "${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js")
```

No separate install or native Inbox tool is required.

## Read

Listing and reading are read-only and need no confirmation:

```bash
"${CLI[@]}" inbox list
"${CLI[@]}" inbox read "<thread-id>"
```

Use normal human output unless exact structured fields are needed; then append `--json`. Preserve the
CLI's distinction between an empty Inbox and an unavailable one. A message is visible only to its
two human parties.

## Choose the send coordinate

A new inquiry needs:

- one exact target coordinate (`n_…`) the message is about — a Content Note, an Actor profile, or
  a Process the sender can read;
- optionally one person, as an email address or `@handle`. **Omit the person and the message goes
  to the target's owner.** That is the right form when the user knows the Space but not its maker;
- a short name, dense summary, and Markdown message.

For the current Space root, `"${CLI[@]}" status --json` exposes its declared root identity. A
canonical `/repos/n_…` URL also carries the root coordinate. For a nested target, use an exact
coordinate already supplied by the user, Map, or hosted reader; never guess one from a local path.

When the subject is not any Content — the tool itself, the service, the person — the honest target
is the maker's public profile: a Thread about their Actor node, with no recipient, reaches them.
Sending grants nothing: the recipient sees the message and the Map's legend, and reads a named Note
only with access they already hold. Use **is-share** if they should be able to read it.

Before sending, state the target, the recipient (or that it goes to the owner), and the message.
Ask for confirmation when any were inferred or composed beyond the user's request. A request that
already names them counts as confirmation; do not ask twice.

## Send and reply

Quote every user-provided value. Pass longer Markdown through stdin rather than flattening it. Mint
one stable send id per intended message and reuse that exact id only when retrying the same immutable
send after an ambiguous network failure.

```bash
"${CLI[@]}" inbox send "@owner" \
  --about "n_0123456789abcdef01234567" \
  --name "Question" \
  --summary "One decision needs clarification" \
  --send-id "<stable-send-id>" \
  --message "What should happen next?"

# No person named: the Node's owner receives it.
"${CLI[@]}" inbox send \
  --about "n_0123456789abcdef01234567" \
  --name "share invite fails" \
  --summary "404 on every repo since this morning" \
  --send-id "<stable-send-id>" \
  --message "..."

printf '%s\n' "# Answer" "" "Keep the boundary narrow." | \
  "${CLI[@]}" inbox reply "<thread-id>" \
    --name "Answer" \
    --summary "A bounded answer" \
    --send-id "<stable-reply-id>"
```

A reply needs no recipient or target: the original message fixes both. Never change the send id while
retrying changed content; changed content is a new message and needs a new id.

If authentication is required, offer `is_auth action="login"`, then retry the identical operation.

## Report the result

For a send or reply, report the message id, the target it remains attached to, and — when no
person was named — that it went to the target's owner. Do not
claim the recipient read it merely because delivery succeeded. Surface neutral not-found,
recipient-unavailable, blocked, rate-limit, and history-bound refusals without guessing hidden
account or Content state.
