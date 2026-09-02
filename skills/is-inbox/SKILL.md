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

- one explicit person, as an email address or `@handle`;
- one exact Content target coordinate (`n_…`) that the message is about;
- a short name, dense summary, and Markdown message.

For the current Space root, `"${CLI[@]}" status --json` exposes its declared root identity. A
canonical `/spaces/n_…` URL also carries the root coordinate. For a nested target, use an exact
coordinate already supplied by the user, Map, or hosted reader; never guess one from a local path.

Before sending, state the recipient, target, and message. Ask for confirmation when any were inferred
or composed beyond the user's request. A request that already names the recipient, target, and
message counts as confirmation; do not ask twice.

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

For a send or reply, report the message id and the Content target it remains attached to. Do not
claim the recipient read it merely because delivery succeeded. Surface neutral not-found,
recipient-unavailable, blocked, rate-limit, and history-bound refusals without guessing hidden
account or Content state.
