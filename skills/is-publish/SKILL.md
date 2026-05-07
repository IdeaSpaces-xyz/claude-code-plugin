---
name: is-publish
description: >
  Conversational layer over `ideaspaces publish` — host the current folder
  as a remote ideaspace. Detects login state and offers to log in if needed,
  reads the folder-keyed spaces map to detect re-publish, confirms the
  remote name in plain English, then runs the bundled CLI. Use when: the
  user says "publish this", "host it remotely", "make it accessible from
  another device", or after `/is-setup` finishes.
allowed-tools: "Read Bash"
---

# Publish an Ideaspace

**Goal:** check login → confirm name → run `ideaspaces publish` → narrate the result.

This skill is the **conversational layer** around `ideaspaces publish` (the bundled CLI). The conversation lives here; the work lives in the CLI. The CLI is at `${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js`. No separate install required.

Run this when the user asks to publish, or after `/is-setup` finishes a fresh scaffold and the user wants to take it remote.

## 1. Pre-flight checks

Before invoking the CLI, verify the basics so we can fail fast with a useful message.

**Inside an ideaspace?** This dir should be a git repo with `_agent/foundation.md` already scaffolded. If not, suggest `/is-setup` first.

```bash
test -f _agent/foundation.md && test -d .git && echo "ok" || echo "missing"
```

**Logged in?** Read the credentials file directly — its presence is the login signal:

```bash
test -f ~/.ideaspaces/credentials.json && echo "yes" || echo "no"
```

If `no`, propose login (next section). If `yes`, continue to step 3.

**Already published?** Check the folder-keyed map:

```bash
node -e "console.log(JSON.stringify((require('${HOME}/.ideaspaces/spaces.json'))[process.cwd()] || null))"
```

If non-null, this folder is already mapped to a remote. Re-publishing is fine — the CLI reuses the existing repo_id and just re-pushes. Surface the existing slug so the user knows what they're publishing to.

## 2. Login (if needed)

> "You'll need to log in first — that's how IdeaSpaces knows the space belongs to you. I'll open a browser; complete the OAuth flow there and the credentials save automatically. OK?"

On confirm:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js login
```

The CLI opens a browser, runs a callback server on a local port, and writes `~/.ideaspaces/credentials.json` once OAuth completes. If the user is in a remote shell or the browser doesn't open, surface this and let them complete manually.

After login succeeds, continue to step 3.

## 3. Confirm the destination

Default values come from cwd and the OAuth account:

- **Slug** — derived from the folder's basename (e.g. `KnowledgeSpace` → `knowledgespace`). Override with `--slug <name>` if the user wants something different. Slugs are URL-friendly: lowercase letters, digits, hyphens.
- **Name** — display name; defaults to folder basename. Override with `--name "<display>"`.
- **Hostname** — `null` (personal space) by default. Override with `--hostname <host>` to publish into an org space (the user must already be a member).

In plain English:

> "I'll publish this as `ernests_s/knowledgespace` (your personal space). Want a different slug or display name? Or publish to an organization?"

For re-publish: don't re-ask — show the existing slug and confirm intent.

> "This folder is already published as `ernests_s/knowledgespace`. I'll re-push to the same remote. (Add `--force` if you want a fresh server-side repo — the old one isn't deleted, just unlinked locally.)"

## 4. Run publish

Once confirmed, invoke the CLI. The flags map to whatever the user agreed to:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js publish [--slug ...] [--name ...] [--hostname ...] [--force]
```

What the CLI does, in plain language for the user:

1. Confirms login by reading their stored credentials.
2. Asks the IdeaSpaces server who they are (`/auth/me`) and creates a server-side repo (`POST /repos`) if first publish.
3. Sets `git config --local user.email = person:<username>@ideaspaces` **in this folder only** — so commits in this directory are attributed to the right IdeaSpaces account. Other folders untouched.
4. Adds an `origin` remote pointing at `git.ideaspaces.xyz/<namespace>/<slug>.git` and pushes the current branch.
5. Records the folder ↔ repo mapping in `~/.ideaspaces/spaces.json` so re-publish from this folder reuses the same remote.

If anything fails, the CLI exits non-zero with a readable message. Surface it directly to the user and offer a next step (re-login, rename slug, shrink an oversized blob).

## 5. Narrate the result

On success, the CLI prints the remote URL. Surface it and the structural changes in user-friendly terms:

> "Published `<name>` to `<remote_url>`. Two things to know:
>
> - This folder's git identity is now `person:<username>@ideaspaces`. That's how the platform attributes commits to your IdeaSpaces account. Your global git config (other folders) is unchanged.
> - The folder ↔ space mapping is saved at `~/.ideaspaces/spaces.json`. Re-running `/is-publish` from this folder will push to the same space.
>
> You can clone this space onto another device with `git clone <remote_url>`."

## When the user has multiple spaces

The folder-keyed map handles the common case automatically: each folder maps to its own remote. If a user wants to look across spaces, point them at `~/.ideaspaces/spaces.json` (one record per published folder).

## Failure modes worth knowing

| Symptom | Likely cause | What to suggest |
|---|---|---|
| `Couldn't reach the IdeaSpaces server: ... 401` | Stored credentials expired | Re-run `ideaspaces login` |
| `Push failed: ... size cap` | A file in the repo is over 200KB | Shrink it, or move it out of the repo |
| `Push failed: ... attribution doesn't match` | Local `user.email` not picked up | The CLI sets it; re-run if it didn't take effect |
| `Couldn't determine the current branch` | Detached HEAD | `git checkout main` (or whichever branch) first |
| `--name only applies on first publish` | Re-publish path | Drop the flag, or pass `--force` for a fresh remote |

## Recovery

The publish flow is mostly idempotent:

- Re-running on success is a no-op (push is fast-forward / "already up to date")
- Re-running after a failure picks up where it left off (createRepo is fast; the failed step is what gets retried)
- If something in `~/.ideaspaces/spaces.json` looks wrong, the file is plain JSON — the user can edit or delete entries

Don't try to manually undo a publish. The server-side repo persists once created; the only way to reuse a folder for a different space is `--force` (which orphans the old server repo, doesn't delete it).

## What comes next

- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-space** — navigation reference, including how to clone a published space onto another device
