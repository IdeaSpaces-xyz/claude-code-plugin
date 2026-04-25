# Orientation — PR Plan

> Implementation plan to close the gap between the orientation design and what the plugin actually does. Spans `sdk/`, `cli/`, and `ideaspaces-plugin/`. **SDK does most of the work.**

**Date:** 2026-04-25
**Design:** [`ideaspace/architecture/plugin/orientation.md`](../../ideaspace/architecture/plugin/orientation.md)
**Bug:** [`_agent/bugs/2026-04-17 Session-Start Blindness.md`](../_agent/bugs/2026-04-17%20Session-Start%20Blindness.md)

---

## What this fixes

Today the plugin's awareness pipeline pre-dates the four-dimension `_agent/` model:

- SessionStart hook only fires when cwd is itself a connected Space — silent in subdirs, sibling repos, Space-adjacent code repos
- `getAwarenessBlock()` reads `purpose.md` + `now.md` (old convention) — doesn't know about `always.md`, `rules.md`, or `compression.md`
- Skill descriptions (`is-space`, `is-setup`) describe the old `_agent/` shape (`guidance.md`, `soul.md`, "perspective" not "POV")
- Visibility status (.gitignore-derived) is invisible to the agent

## Scope

**In:**
- Walk-up `_agent/` detection (SDK)
- Four-dimension contract loading (SDK)
- Compression as awareness entry point (SDK)
- Visibility awareness from `.gitignore` (SDK)
- Basic identity line in awareness (SDK)
- New `ideaspaces orient` CLI command (CLI)
- Plugin SessionStart hook update + skill description sync + bundle refresh (plugin)

**Out** (parked in [orientation.md](../../ideaspace/architecture/plugin/orientation.md#not-now-parked)):
- Multi-space monorepo awareness (parent has multiple `_agent/` descendants)
- Explicit POV/identity beyond basic line
- `_agent/_local/` per-developer agent state convention

---

## PR 1 — SDK: orientation foundations

**Repo:** [`sdk/`](https://github.com/IdeaSpaces-xyz/sdk) (`@ideaspaces/sdk`)

**Goal:** provide the building blocks the plugin's hook and `is-space` skill need.

### Files

| File | Change | Notes |
|---|---|---|
| `src/patterns/locate.ts` | **new** | `findSpaceRoot(cwd) → { root, contract, source }`. Walks up from cwd, checks each dir for `_agent/`, parses contents. `source = "connected" \| "local" \| "none"`. |
| `src/patterns/visibility.ts` | **new** | `computeVisibility(scope) → { shared: string[], private: string[] }`. Reads `.gitignore` + walks tree. |
| `src/patterns/session.ts` | **update** | `getAwarenessBlock()`: read all four contract files, append compression if present, append visibility section, append identity line. Backwards-compatible: existing fields remain. |
| `src/types.ts` | **update** | `Contract` type with `purpose`, `now`, `always`, `rules`, `compression` (optional fields). |
| `src/index.ts` | **update** | Re-export new symbols. |

### Tests

- `findSpaceRoot` finds `_agent/` at cwd, parent, grandparent
- `findSpaceRoot` returns `source: "none"` when no `_agent/` anywhere in tree
- `findSpaceRoot` returns `source: "local"` when `_agent/` exists but no backend connection
- `findSpaceRoot` returns `source: "connected"` when both
- `getAwarenessBlock` reads all four files when present
- `getAwarenessBlock` gracefully handles partial contract (missing files)
- `getAwarenessBlock` includes compression block when present
- `getAwarenessBlock` includes visibility block always
- `computeVisibility` handles empty `.gitignore`, nested `.gitignore`, gitignore globs, no gitignore at all

### Acceptance

- `findSpaceRoot('/path/to/Docs/Slow thoughts/')` returns the slow-thoughts scope (walks up from inside the dir)
- `findSpaceRoot('/path/to/cli/')` returns `source: "none"` (no `_agent/` here, none in parents that count)
- `getAwarenessBlock` output includes the four-dimension contract content + compression + visibility
- All existing SDK tests still pass (no regressions)
- `pi-is-space` continues to work against published SDK (additive API)

### Risks

- **Backwards compatibility.** `pi-is-space` imports from SDK. New API surface is additive, but verify by running pi-is-space tests against the SDK PR before merge.
- **Awareness block size.** Adding four files + compression + visibility could overflow context for large scopes. Mitigation: truncate compression to *Why* section if total length exceeds a threshold (~4KB).
- **Visibility cost.** Parsing `.gitignore` + tree walk on every session start. Should be cheap; cache by `mtime` if profiling shows otherwise.

---

## PR 2 — CLI: `ideaspaces orient`

**Repo:** [`cli/`](https://github.com/IdeaSpaces-xyz/cli) (`@ideaspaces/cli`)

**Goal:** expose the orientation surface as a CLI command. Becomes what the plugin's SessionStart hook calls.

### Files

| File | Change | Notes |
|---|---|---|
| `src/commands/orient.ts` | **new** | Calls `findSpaceRoot` + `getAwarenessBlock` from SDK, prints to stdout. `--json` flag for structured output. |
| `src/router.ts` | **update** | Register `orient` command. |
| `src/argv.ts` | **update** | Usage / examples. |
| `src/test/orient.test.ts` | **new** | Golden output tests against fixture directories. |

The existing `awareness` command can stay as an alias or migrate to `orient` — `orient` is the more accurate name (orienting includes more than just awareness).

### Tests

- `ideaspaces orient` from a fixture inside a `_agent/`-shaped scope prints the right block
- `ideaspaces orient --json` returns parseable JSON matching the SDK's awareness shape
- `ideaspaces orient` in a directory with no `_agent/` exits 0 with a graceful "no scope found" message
- `ideaspaces orient` walks up correctly (test from a deep subdir)

### Acceptance

- Command works from any directory
- Output is consumable by the plugin's hook (text format)
- `--json` output is consumable programmatically
- Existing `awareness` command continues to work (alias) or has a deprecation notice

### Risks

- **CLI bundle size.** `orient` pulls in `findSpaceRoot` + visibility code from SDK; verify bundle stays under ~200KB.

---

## PR 3 — Plugin: hook + skill sync + bundle refresh

**Repo:** [`ideaspaces-plugin/`](https://github.com/IdeaSpaces-xyz/claude-code-plugin)

**Goal:** ship the SDK and CLI improvements through to Claude Code users via updated bundles, hook, and skill descriptions.

### Files

| File | Change | Notes |
|---|---|---|
| `dist/index.js` | **rebuild** | From updated `mcp-server/` (depends on updated SDK). |
| `cli/bundle/ideaspaces.js` | **rebuild** | From updated CLI (PR 2). |
| `skills/is-space/SKILL.md` | **update** | Four-dimension contract (purpose/now/always/rules), POV vocabulary, *private by default* convention, `_agent/` marker rule. Drop references to `guidance.md` and `soul.md`. |
| `skills/is-setup/SKILL.md` | **update** | Scaffold all four files (purpose/now/always/rules); add `_agent/` to `.gitignore` if `.github/` present in target repo; install hook to call `ideaspaces orient` (not the static echo text). |
| `skills/is-writing/SKILL.md` | **update** | Reference compression update rule + commit skill. |
| `_agent/now.md` | **update** | Reflect orientation work shipped; what's next. |
| `README.md` | **update** | Migration note for users with existing hook installations. |

### The hook update is load-bearing

Currently `is-setup` writes a static echo into `.claude/settings.local.json`:

```
echo 'IdeaSpaces connected. Orient before acting...'
```

After this PR, `is-setup` writes:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "ideaspaces orient"
          }
        ]
      }
    ]
  }
}
```

This means the hook output becomes dynamic — reads the actual `_agent/` contract at session start. That's the real fix for session-start blindness, not a string in a settings file.

### Tests

- Plugin loads with updated bundles (smoke test)
- `is-space` description matches current model
- Manual: agent lands in `ideaspaces-plugin/` cwd → hook surfaces plugin's `_agent/` contract correctly
- Manual: agent lands in `Docs/Slow thoughts/` → hook walks up, finds the scope, surfaces it
- Manual: agent lands in `cli/` → no `_agent/`, hook reports gracefully

### Acceptance

- Hook fires from any directory and produces orientation output (or graceful absence)
- Skills describe the current four-dimension model
- Existing users with old hook get an upgrade path (migration note + `is-setup --upgrade-hook` flag, or similar)

### Risks

- **Skill description churn.** Users have habits formed around current descriptions. Migration note in README; old skill behavior remains backwards-compatible (no breaking interface changes).
- **Hook backwards-compat.** Users with old static-echo hooks need an upgrade. `is-setup` should detect the old hook and offer to upgrade — or document the manual edit.

---

## Sequencing

1. **PR 1 (SDK)** — ships first. Provides building blocks. Publish to npm.
2. **PR 2 (CLI)** — ships after PR 1's npm publish. Consumes new SDK exports. Publish CLI bundle.
3. **PR 3 (plugin)** — ships last. Pulls new bundles in. Updates skills + hook installer.

Each PR independently reviewable. PR 3 cannot merge until PRs 1 + 2 are published.

## Cross-repo coordination

- **`pi-is-space`** imports from `@ideaspaces/sdk`. PR 1 must be additive (no breaking changes). Verify pi-is-space tests pass against PR 1's branch before merge.
- **`mcp-server`** depends on SDK. Bundle rebuild after PR 1 to pick up new exports — happens implicitly when `dist/index.js` rebuilds in PR 3.

## Out of scope (parked)

These are real follow-ons but not part of this plan:

- **Multi-space monorepo awareness** — when cwd has multiple `_agent/`-shaped descendants, surface them and let the agent pick scope. Wait until walk-up detection has been used for a few sessions and the multi-scope friction shows up concretely.
- **Explicit POV/identity surfacing** — beyond the basic identity line. Could include perspectives applied this session, who's been writing what, etc. Defer until current additions prove themselves.
- **`_agent/_local/` convention** — per-developer agent state inside `_agent/`. Walked back during the design jam (no observed need).
- **Tuner / radio UI** — listener-driven attention model from the slow thoughts. Bigger separate effort, larger scope, frontend work.

## Open questions

1. **Truncation strategy for awareness block size.** What's the threshold? What gets truncated first? Suggest: compression *Consequences* block first, then *Primitives*, then content of `always.md` longer entries. Keep *Why* + *Now* always.
2. **`.gitignore` parser.** Use existing npm package (`ignore`) or hand-roll? Suggest: use `ignore` — same library `git` itself uses semantically.
3. **Caching strategy for visibility computation.** Per-session in-memory cache, invalidate on file change? Suggest: no cache initially; profile first; add caching only if hot path.
4. **Backwards-compat on hook upgrade.** Detect-and-offer vs detect-and-apply? Suggest: detect-and-offer (preserves user agency).

## Acceptance for the whole plan

The session-start blindness bug is closed when:

- An agent in any directory with `_agent/` (cwd or ancestor) gets oriented context at session start
- The orientation reflects the four-dimension contract, not the old shape
- Visibility (shared vs private) is surfaced before the agent writes
- Skill descriptions match the model the contract uses
- The plugin can be installed fresh and works on a Space the user just created

When this lands, [`_agent/bugs/2026-04-17 Session-Start Blindness.md`](../_agent/bugs/2026-04-17%20Session-Start%20Blindness.md) gets resolved and the bug note moves to a *fixed/* archive (or gets closed with a commit reference).
