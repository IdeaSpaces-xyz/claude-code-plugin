---
name: is-fork
description: >
  Materialize an independent local Space from a canonical Space URL. Use when
  the user says fork this Space, take this public Space home, make a local
  independent copy, update or refresh a maintained fork, or wants to work from
  a copy without an account. Fork is history-free and unpublished; use
  is-publish later to host it.
allowed-tools: "mcp__plugin_ideaspaces_core__is_auth Read Bash"
---

# Fork a Space Locally

Fork brings one copy-authorized Space home as a new independent local Git repository. A public,
copy-enabled source needs no IdeaSpaces account. The result has fresh Note and root identity, one
import commit, source lineage for later updates, no source history, no remote, and no hosted owner.

This skill invokes the CLI bundled with the plugin. No separate install or native `is_fork` tool is
required:

```bash
CLI=(node "${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js")
```

## Confirm the coordinate

Require a canonical Space URL and choose the destination folder. If the user omitted the folder,
state the CLI-derived local name before running. A destination that already exists is never merged,
replaced, or removed. If the user already named both source and destination, that is confirmation;
do not ask twice.

`--name <local-name>` changes only the unpublished display name. Never pass `--location` or `--slug`:
hosting placement belongs to later `ideaspaces publish --hostname/--slug`.

## Materialize

Quote the URL, path, and optional name:

```bash
"${CLI[@]}" fork "<space-url>" "<destination>" [--name "<local-name>"]
```

Do not log in first for a public source. The CLI sends valid ambient credentials when they already
exist, allowing a directly shared private Fork through the same local-only path, but never invents
an empty token. If a private source is neutrally refused and the user expects direct access, offer
`is_auth action="login"`, then retry the identical command.

The CLI validates the complete bounded snapshot before touching the destination and removes its
temporary sibling on failure. Do not reproduce the snapshot with `curl`, raw file writes, or Git
plumbing.

## Maintain from the source

Run update from inside a fork. Preview first unless the user already explicitly asked to apply:

```bash
"${CLI[@]}" update
```

Report the proposed Markdown and asset writes, deletes, and conflicts. Apply only after confirmation:

```bash
"${CLI[@]}" update --yes
```

A public source remains account-free while both public View and Fork are enabled. Do not log in
preemptively. If a directly shared private source is neutrally refused and the user expects access,
offer `is_auth action="login"`, then retry the same update. Never reproduce the three-way update with
raw writes: the CLI preserves local additions, `*.local.md`, staged bystanders, destination identity,
and conflicting local files. Report conflicts as preserved local work and an unchanged second run as
a no-op.

## Report the result

State:

- destination path and fresh local Space identity;
- that source history was not copied;
- that the repository has one clean `main` import commit and no remote;
- that the Space is unpublished and locally owned.

Offer **is-publish** only if the user now wants remote hosting. Publishing is the account boundary;
Fork itself is not.
