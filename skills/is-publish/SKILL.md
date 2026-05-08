---
name: is-publish
description: >
  Conversational layer over `ideaspaces publish` — host the current folder
  as a remote ideaspace. Checks markdown node IDs, login state, existing
  folder mapping, confirms destination, then runs the bundled CLI. Use when:
  the user says "publish this", "host it remotely", "make it accessible from
  another device", or after `/is-setup` finishes.
allowed-tools: "Read Bash"
---

# Publish an Ideaspace

**Goal:** login check → confirm destination → run `ideaspaces publish` → narrate result.

This skill is the conversational layer around the bundled CLI:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js ...
```

No separate install required.

## 1. Pre-flight checks

**Inside an ideaspace?** This dir should be a git repo with `_agent/foundation.md` already scaffolded. If not, suggest `/is-setup` first.

```bash
test -f _agent/foundation.md && test -d .git && echo "ok" || echo "missing"
```

**Markdown identities ready?** Don't run a separate broad `id .` check here. `ideaspaces publish` preflights the exact publish scope — tracked markdown files — before login/network/push. If that preflight fails, surface the CLI output and offer the fix commands it prints.

**On the `main` branch?** IdeaSpaces uses `main` as the default branch — publishing requires the local branch to match so server and clones stay aligned. Detect:

```bash
git rev-parse --abbrev-ref HEAD
```

If output isn't `main`, ask the user before proceeding:

> "You're on `<current-branch>`. IdeaSpaces uses `main` as the default — keeping local and remote consistent makes future `git pull` / clones work without surprises. Rename `<current-branch>` → `main` for this folder?"

If yes, run `git branch -m main`, then continue. If no, abort with: *"Switch to `main` (or rename) and re-run `/is-publish` when ready."* — don't try to push a non-main branch; `ideaspaces publish` refuses anyway.

**Logged in?** Read the credentials file directly — its presence is the login signal:

```bash
test -f ~/.ideaspaces/credentials.json && echo "yes" || echo "no"
```

If `no`, propose login. If `yes`, continue.

**Already published?** Check the folder-keyed map, if present:

```bash
node - <<'NODE'
const fs = require('fs');
const path = `${process.env.HOME}/.ideaspaces/spaces.json`;
if (!fs.existsSync(path)) { console.log('null'); process.exit(0); }
const map = JSON.parse(fs.readFileSync(path, 'utf8'));
console.log(JSON.stringify(map[process.cwd()] || null));
NODE
```

If non-null, this folder is already mapped to a remote. Re-publishing is fine — the CLI reuses the existing `repo_id` and pushes to the same remote.

## 2. Login if needed

> "You'll need to log in first — that's how IdeaSpaces knows the space belongs to you. I'll open a browser; complete the OAuth flow there and credentials save locally. OK?"

On confirm:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js login
```

If the user is in a remote shell or browser open fails, surface the CLI output and let them decide the next step.

## 3. Confirm destination

Default values:

- **Slug** — derived from folder basename. Override with `--slug <name>`.
- **Name** — display name; defaults to folder basename. Override with `--name "<display>"`.
- **Hostname** — personal space by default. Override with `--hostname <host>` for org spaces.

Example:

> "I'll publish this as your personal space using the folder name as slug. Want a different slug/display name, or publish to an organization?"

For re-publish, don't re-ask names:

> "This folder is already published as `<namespace>/<slug>`. I'll re-push to the same remote. Use `--force` only if you intentionally want a fresh remote mapping."

## 4. Run publish

Once confirmed:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js publish [--slug ...] [--name ...] [--hostname ...] [--force]
```

The CLI:

1. Preflights tracked markdown `node_id`s before network work.
2. Confirms login via stored credentials.
3. Calls `/auth/me` and creates/reuses a server repo.
4. Sets local `git config user.email = person:<username>@ideaspaces` for this folder only.
5. Adds/updates `origin` pointing at `git.ideaspaces.xyz/<namespace>/<slug>.git`.
6. Pushes the current branch.
7. Records folder ↔ space mapping in `~/.ideaspaces/spaces.json`.

## 5. Narrate result

On success, surface the remote URL and the local changes:

> "Published `<name>` to `<remote_url>`. This folder's git identity is now `person:<username>@ideaspaces` locally, so server-side attribution works. The folder mapping is saved at `~/.ideaspaces/spaces.json`."

## Failure modes

| Symptom | Likely cause | What to suggest |
|---|---|---|
| `markdown identity check failed` | Missing/malformed/duplicate `node_id` | Run `ideaspaces id --fix .`, or regenerate duplicate copied files. |
| `Not logged in` | No stored credentials | Run `ideaspaces login`. |
| `Push failed: ... size cap` | A tracked file exceeds 200KB | Shrink it or move it out of the repo. |
| `Push failed: ... attribution doesn't match` | Commit author doesn't match account | Re-run publish; it sets local `user.email`. Amend/recommit if needed. |
| `Couldn't determine the current branch` | Detached HEAD | Check out a branch first. |
| `--name only applies on first publish` | Re-publish path | Drop the flag or use `--force` for a fresh remote mapping. |

Recovery posture: re-running publish is safe after failures. If `~/.ideaspaces/spaces.json` has a stale folder mapping, it is plain JSON — delete that entry and re-publish.

## What comes next

- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-space** — navigation reference
