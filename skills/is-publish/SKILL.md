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

**Markdown frontmatter parses?** Don't run a separate identity check here. `node_id` frontmatter is no longer required. `ideaspaces publish` preflights tracked markdown for YAML syntax before login/network/push. If that preflight fails, surface the CLI output and ask the user to fix the reported YAML.

**On the `main` branch?** IdeaSpaces uses `main` as the default branch — publishing requires the local branch to match so server and clones stay aligned. Detect:

```bash
git rev-parse --abbrev-ref HEAD
```

If output is the literal string `HEAD`, the user is in detached-HEAD state. Don't offer a rename — short-circuit with: *"You're in detached-HEAD state. Check out a branch first (e.g. `git checkout main`) and re-run `/is-publish`."*

Otherwise, if output isn't `main`, ask before proceeding:

> "You're on `<current-branch>`. IdeaSpaces uses `main` as the default — keeping local and remote consistent makes future `git pull` / clones work without surprises. Rename `<current-branch>` → `main` for this folder?"

If yes, run `git branch -m main`. If the rename fails (most common cause: a local `main` branch already exists — perhaps stale or orphaned), surface git's error verbatim and stop with: *"You may already have a local `main` branch. Resolve manually (`git branch -d main` if it's stale, or `git checkout main` if it's the one you want) and re-run `/is-publish`."* On success, continue. If the user declines the rename, abort: *"Switch to `main` and re-run `/is-publish` when ready."* — don't try to push a non-main branch; `ideaspaces publish` refuses anyway.

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

1. Preflights tracked markdown frontmatter syntax before network work.
2. Confirms login via stored credentials.
3. Calls `/auth/me` and creates/reuses a server repo.
4. Sets local `git config user.email = person:<username>@ideaspaces` for this folder only.
5. Adds/updates `origin` pointing at `git.ideaspaces.xyz/<namespace>/<slug>.git`.
6. Pushes the current branch.
7. Records folder ↔ space mapping in `~/.ideaspaces/spaces.json`.

### Size-cap recovery (oversized tracked files)

If the CLI exits 1 with `Cannot publish yet: N tracked file(s) exceed the 200,000-byte server limit.` followed by a list of `path (bytes)` lines, the offenders are tracked files larger than the server cap. The CLI fails fast locally — no push attempted. Parse the offender list and decide:

**Known clutter** — if every offender path matches one of these patterns, offer the conversational fix as a single yes/no:

```
.obsidian/    node_modules/    .DS_Store    .cache/    .idea/    .vscode/
```

> *"I see `<matched paths>` tracked — that's <vault config / build output / editor metadata>, not your knowledge. I can append <patterns> to `.gitignore`, untrack with `git rm --cached -r <path>`, commit, and retry publish. OK?"*

On confirm, run in this order: append the matching patterns to `.gitignore` (don't duplicate existing lines), `git rm --cached -r <path>` for each, `git commit -m "Untrack non-publishable clutter"`, then re-run `ideaspaces publish`.

**Mixed or unknown offenders** — if any offender is outside the clutter list (e.g. a 5 MB image the user might want), don't auto-fix. Surface the CLI output verbatim and stop with: *"These files are over the 200KB cap. Shrink them, store externally, or link via frontmatter (`attached_to:`). Re-run `/is-publish` when resolved."* — the user might have intent for that file.

### Stale-mapping recovery (remote deleted server-side)

If the CLI exits 1 with `This folder is mapped to <namespace>/<slug> (repo_id=<id>) but that remote no longer exists on the server.`, the local `~/.ideaspaces/spaces.json` entry points at a repo that's been deleted (or the user lost access). The CLI catches this before any push attempt.

Offer the conversational fix as a single yes/no:

> *"This folder was published as `<namespace>/<slug>` but that remote is gone — likely deleted on the server. I can re-publish as a fresh space (new `repo_id`), which keeps the local content and history but creates a new server-side repo. OK?"*

On confirm, re-run `ideaspaces publish --force`. The CLI replaces the stale mapping in `~/.ideaspaces/spaces.json` and provisions a fresh remote. The old `slug` is reused by default; pass `--slug` if the user wants to rename at the same time.

If the user declines (e.g. they want to investigate which case it is first), stop with: *"Remove this folder's entry from `~/.ideaspaces/spaces.json` and re-run `/is-publish` for a fresh space, or restore the remote in the web UI if it was accidentally deleted."* — the spaces.json edit covers both deleted-repo and lost-access cases; the web-UI restore is specific to deletion the user can reverse.

## 5. Narrate result

On success, surface the remote URL and the local changes:

> "Published `<name>` to `<remote_url>`. This folder's git identity is now `person:<username>@ideaspaces` locally, so server-side attribution works. The folder mapping is saved at `~/.ideaspaces/spaces.json`."

## Failure modes

| Symptom | Likely cause | What to suggest |
|---|---|---|
| `Not logged in` | No stored credentials | Run `ideaspaces login`. |
| `Cannot publish yet: N tracked file(s) exceed the 200,000-byte server limit.` | CLI size preflight | See "Size-cap recovery" above — auto-handle known clutter, surface the rest. |
| `Push failed: ... size cap` | Server-side cap (only if CLI preflight is bypassed) | Same as above; re-run `/is-publish` so the local preflight surfaces the offender list. |
| `This folder is mapped to ... but that remote no longer exists on the server.` | Server-side repo deleted, local mapping stale | See "Stale-mapping recovery" above — offer `--force` re-publish as a fresh space. |
| `Push failed: ... attribution doesn't match` | Commit author doesn't match account | Re-run publish; it sets local `user.email`. Amend/recommit if needed. |
| `Local branch is \`<x>\`; IdeaSpaces uses \`main\`` | Pre-flight didn't run / user invoked CLI directly | Rename via `git branch -m main` and retry, or use `/is-publish` which offers the rename. |
| `Couldn't determine the current branch — is HEAD detached?` | Detached-HEAD state (rare; pre-flight catches via skill) | Check out a branch (`git checkout main`) and retry. |
| `--name only applies on first publish` | Re-publish path | Drop the flag or use `--force` for a fresh remote mapping. |

Recovery posture: re-running publish is safe after failures. If `~/.ideaspaces/spaces.json` has a stale folder mapping, it is plain JSON — delete that entry and re-publish.

## What comes next

- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-space** — navigation reference
