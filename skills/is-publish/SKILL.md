---
name: is-publish
description: >
  Put this space online — host the current folder as a remote ideaspace, so it
  outlives this machine and the team or another device can reach it. Use when
  someone says put it online, publish this, host it, back this up, get this on
  my other computer, or make it available to the team; or after `/is-setup`
  finishes. Hosting starts private — who gets in is is-share. Plan-first:
  the bundled CLI shows exactly what would happen and mutates nothing until
  the user agrees and it runs again with --yes.
allowed-tools: "Read Bash"
---

# Publish an Ideaspace

**Goal:** login check → plan (`publish` without `--yes`, zero mutations) → the user agrees → apply
(`publish --yes`) → narrate result. The plan-then-apply split is the CLI's contract, not a
courtesy — see the outward tier of the agreement principle.

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

**Portable identity agrees?** Current shared scaffolds declare `root_node_id`; legacy Spaces may validly omit it. Never mint, edit, stage, or commit identity during publish. Run the bundled CLI's `status --json` and inspect `root_identity`: stop on `invalid`, `drift`, `ambiguous`, or `declaration.dirty`. Publish repeats this preflight against HEAD, index, worktree, canonical origin, and local registry before login or remote mutation.

**Markdown frontmatter parses?** The CLI preflights all tracked Markdown for YAML syntax. If it fails, surface the output and ask the user to fix and commit the reported YAML.

**On the `main` branch?** IdeaSpaces uses `main` as the default branch — publishing requires the local branch to match so server and clones stay aligned. Detect:

```bash
git rev-parse --abbrev-ref HEAD
```

If output is the literal string `HEAD`, the user is in detached-HEAD state. Don't offer a rename — short-circuit with: *"You're in detached-HEAD state. Check out a branch first (e.g. `git checkout main`) and re-run `/is-publish`."*

Otherwise, if output isn't `main`, ask before proceeding:

> "You're on `<current-branch>`. IdeaSpaces uses `main` as the default — keeping local and remote consistent makes future `git pull` / clones work without surprises. Rename `<current-branch>` → `main` for this folder?"

In a non-interactive session there is nobody to answer — never rename on your own; stop with the question as the result (the 2026-09-01 incident was exactly this rename, unasked). If yes, run `git branch -m main`. If the rename fails (most common cause: a local `main` branch already exists — perhaps stale or orphaned), surface git's error verbatim and stop with: *"You may already have a local `main` branch. Resolve manually (`git branch -d main` if it's stale, or `git checkout main` if it's the one you want) and re-run `/is-publish`."* On success, continue. If the user declines the rename, abort: *"Switch to `main` and re-run `/is-publish` when ready."* — don't try to push a non-main branch; `ideaspaces publish` refuses anyway.

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

## 3. Plan — run publish without `--yes`

The CLI is plan-first: without `--yes` it runs every preflight, prints exactly what would happen —
destination `namespace/slug`, the dir-local git identity write, whether the tip-commit author gets
rewritten, the origin URL, the commit count — and **changes nothing**, local or remote.

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js publish [--slug ...] [--name ...] [--hostname ...]
```

Show the user the plan and get their yes. Publishing is an outward action: even when the user
already said "publish this", the plan surfaces side effects they haven't seen (the identity write,
an author rewrite) — one look before it happens is the agreement, not friction. Flag overrides:
`--slug <name>`, `--name "<display>"`, `--hostname <host>` for org spaces (first publish only).

For re-publish the plan says it reuses the existing Space identity — don't re-ask names.

**Non-interactive sessions stop here.** With nobody to agree, the plan output *is* the honest
result; never add `--yes` on the user's behalf.

## 4. Apply — run with `--yes`

On the user's yes:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js publish --yes [same flags as the plan]
```

The CLI:

1. Evaluates the committed foundation against index/worktree, canonical origin, and local registry evidence.
2. Preflights tracked Markdown syntax and size before network work.
3. Confirms login and asks Keeper to adopt the exact committed `root_node_id` on first publish.
4. Creates or reuses the one matching hosted Space; `--force` cannot fork or rekey it.
5. Sets repo-local Git attribution, configures the matching canonical origin, and pushes `main`.
6. Records the verified folder ↔ Space binding in `~/.ideaspaces/spaces.json`.

### Size-cap recovery (oversized tracked files)

If the CLI exits 1 with `Cannot publish yet: N tracked file(s) exceed the 200,000-byte server limit.` followed by a list of `path (bytes)` lines, the offenders are tracked files larger than the server cap. The CLI fails fast locally — no push attempted. Parse the offender list and decide:

**Known clutter** — if every offender path matches one of these patterns, offer the conversational fix as a single yes/no:

```
.obsidian/    node_modules/    .DS_Store    .cache/    .idea/    .vscode/
```

> *"I see `<matched paths>` tracked — that's <vault config / build output / editor metadata>, not your knowledge. I can append <patterns> to `.gitignore`, untrack with `git rm --cached -r <path>`, commit, and retry publish. OK?"*

Before changing anything, require a clean index with `git diff --cached --quiet`. If it is not clean, stop and ask the user to commit or unstage their existing work first — never mix publish cleanup with an in-progress commit. Also require `git status --short -- .gitignore` to be empty before appending. If it is not empty, stop and surface the pre-existing modified or untracked file instead of absorbing it into the cleanup commit.

On confirm, run in this order:

1. Append the matching patterns to `.gitignore` without duplicating existing lines, then stage only that file with `git add -- .gitignore` if it changed.
2. Run `git rm --cached -r -- <path>` for each confirmed clutter path. This removes it from git while preserving the local files.
3. Review `git diff --cached --name-status`. Every staged entry must be `.gitignore` or a removal under the confirmed clutter paths. If anything else is staged, stop — do not commit or publish.
4. Only with that exact staged set, run `git commit -m "Untrack non-publishable clutter"`. The clean-index gate and staged-set check are mandatory because this commit intentionally records the prepared index; skipping either could sweep unrelated work.
5. Re-run the bundled `ideaspaces publish` command.

If any step fails, leave the state visible with `git status --short` and stop for the user to review.

**Mixed or unknown offenders** — if any offender is outside the clutter list (e.g. a 5 MB image the user might want), don't auto-fix. Surface the CLI output verbatim and stop with: *"These files are over the 200KB cap. Shrink them, store externally, or link via frontmatter (`attached_to:`). Re-run `/is-publish` when resolved."* — the user might have intent for that file.

### Stale-binding recovery

If the mapped remote is gone, inaccessible, or incompatible with the foundation/origin/registry evidence, stop before mutation. Never delete the registry entry or use `--force` merely to make publish proceed: that would erase authority rather than repair it. Offer the actual choices:

- restore access or the matching remote;
- use `ideaspaces link` when the hosted identity is known and the local mapping alone is stale;
- create an explicit local Fork in a separate destination when the user intends a new Space identity.

## 5. Narrate result

On success, surface the remote URL and the local changes:

> "Published `<name>` to `<remote_url>`. This folder's git identity is now `person:<username>@ideaspaces` locally, so server-side attribution works. The folder mapping is saved at `~/.ideaspaces/spaces.json`."

## Failure modes

| Symptom | Likely cause | What to suggest |
|---|---|---|
| `Not logged in` | No stored credentials | Run `ideaspaces login`. |
| `Cannot publish yet: N tracked file(s) exceed the 200,000-byte server limit.` | CLI size preflight | See "Size-cap recovery" above — auto-handle known clutter, surface the rest. |
| `Push failed: ... size cap` | Server-side cap (only if CLI preflight is bypassed) | Same as above; re-run `/is-publish` so the local preflight surfaces the offender list. |
| `This folder is mapped to ... but that remote no longer exists or you no longer have access` | Hosted binding cannot be reached | Restore access/binding; a new Space requires explicit local Fork in a separate destination. |
| `Push failed: ... attribution doesn't match` | Commit author doesn't match account | Re-run publish; it sets local `user.email`. Amend/recommit if needed. |
| `Local branch is \`<x>\`; IdeaSpaces uses \`main\`` | Pre-flight didn't run / user invoked CLI directly | Rename via `git branch -m main` and retry, or use `/is-publish` which offers the rename. |
| `Couldn't determine the current branch — is HEAD detached?` | Detached-HEAD state (rare; pre-flight catches via skill) | Check out a branch (`git checkout main`) and retry. |
| `Root identity evidence is invalid` / `Root identity drift` / `Root identity is ambiguous` | Foundation, origin, or registry evidence is unsafe | Stop. Inspect bundled `status --json`; repair evidence explicitly without rewriting identity. |
| `The root identity declaration differs between HEAD, the index, and the worktree` | Identity has an uncommitted change | Commit the intended declaration or restore it; never publish a different worktree value than HEAD. |
| `publish --force cannot fork or rekey` | Existing hosted binding | Re-publish normally, or use explicit local Fork in a separate destination. |
| `--name only apply on first publish` | Re-publish path | Drop the flag. A new name/identity requires explicit local Fork, not `--force`. |

Recovery posture: re-running publish is safe after repair. Preserve identity authority: restore or explicitly link matching evidence, or create a separate local Fork when a new Space is intended.

## What comes next

- **is-capture** — propose saving knowledge during work
- **is-reflect** — propose updating direction when it drifts
- **is-space** — navigation reference
