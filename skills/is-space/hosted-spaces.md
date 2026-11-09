# Hosted Spaces through the CLI

Use this workflow when someone asks to list, open, create, edit or copy a hosted Space, or place a hosted Thread in one. The host entrypoint supplies `is_cli`; use its bundled/pinned CLI, not an assumed global version. These commands are CLI-backed, not new native MCP or Pi tools. Ask for login through the host's normal auth flow if required; do not borrow credentials or invent raw API calls.

First run `is_cli --version`: this workflow needs CLI **0.9.0 or newer**. If the resolved CLI is missing or older, stop and tell the person which consumer needs updating; do not silently install or use an assumed global version.

A Space is a named Map over references, not a Repo. Adding a reference grants no access to its content. Local Maps and hosted Spaces update independently. Import/export make copies, not sync bindings. Repo clone/pull/push is a different job.

## Read before changing

```sh
is_cli spaces list --hosted --json
is_cli spaces open <map-id> --json
```

Show the choices and let the person choose. Plain `spaces list` still lists legacy coordination objects; do not substitute it for `--hosted`. Hosted list/open return Maps, not the old coordination shape. Preserve member ordinals and inaccessible/missing member states; do not claim every reference is readable.

## Create a hosted Space

Agree the Vault, name, summary and Core opening before writing:

```sh
is_cli vaults --json
is_cli spaces new --hosted --vault personal --name 'Research' --summary 'Our research' --message 'We work here.' --command-id <stable-id>
```

A Vault can be `personal`, `person:user_ID`, or `node:ORG_NODE_ID` from `vaults --json`. Creation needs active Sync; a company Vault needs a current OWNER. The Map and Core are created together. No local binding, extra content access or grants are created. After an uncertain answer, keep the same command id and every original argument for an exact retry; do not create a second Space speculatively.

## Add or remove a reference

Hosted edits are owner-only. Open the Space first, review the intended member and use its head `version_id` as `--if-match`, not a local file hash or an earlier write's version. Choose a stable command id of at most 64 characters before attempting the write.

```sh
is_cli spaces add <map-id> thread:<x_id> --if-match <head-version-id> --command-id <stable-id>
is_cli spaces add <map-id> --position notes/topic.md --root-node-id <repo-node-id> --sha <commit> --depth summary --if-match <head-version-id> --command-id <stable-id>
is_cli spaces remove <map-id> <member-ordinal> --if-match <head-version-id> --command-id <stable-id>
```

Removal previews until the person confirms: repeat the reviewed remove command with `--yes`. It removes a reference, never content, and cannot remove the Core reference. A stale head means reload and review, not blind rebasing. After an uncertain write, an exact retry keeps the original command id, head and ALL arguments. A successful retry returns that command's version, which may no longer be the current head: open the Space again. Do not turn an exact retry into a new edit by changing its head.

## Copy without implying sync

```sh
is_cli spaces export <map-or-version-id> fresh-copy.map.md --json
is_cli spaces import fresh-copy.map.md --json
```

Export writes an independent local UTF-8 Markdown copy and refuses to overwrite an existing path. Use a `version_id` from open for an exact version. Import creates a personal hosted copy, with no new Core and no new content access. Import has no command-id retry contract: after an uncertain answer, inspect the hosted list before importing again; another import creates another copy.

## Place a hosted Thread in a Space

After agreeing the destination and opening:

```sh
is_cli threads new --hosted --home map:<map-id> --name 'Topic' --summary 'What this is for' --message 'Opening'
is_cli threads send @handle --home map:<map-id> --name 'Topic' --summary 'What this is for' --message 'Opening'
```

Placement adds no Map member and grants no access. Local Threads refuse `--home`. To someone new, `threads send` may be a text-only knock, not a delivered Thread; relay the actual result, including `reach` and whether the message was stored. Do not silently send again or mark the person's unread work read. If the native Thread tool does not expose `home`, use this CLI workflow; never invent a tool parameter.
