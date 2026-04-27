---
name: Now
summary: Plugin local-first pivot. Cleanup pass running first (Layer A migrating this
  repo's `_agent/` to the five-file shape, then user-facing copy, skill descriptions,
  source-repo strip). After cleanup — SessionStart hook rebuild, `ideaspace create`,
  skills triad rewrite, dogfood test.
---

# Now

> Plugin local-first pivot. Strip to a great single-player experience; server sync becomes the optional upgrade.

**Updated:** 2026-04-27

---

## The thread

Plan: [`ideaspace/architecture/plans/plugin-local-first/`](../../ideaspace/architecture/plans/plugin-local-first/README.md). Strip the plugin to a great single-player experience — local markdown folder + agent skills + git as sync. Server sync becomes the optional upgrade.

## Plan documents

- [README.md](../../ideaspace/architecture/plans/plugin-local-first/README.md) — strategy, sequencing, dogfood test
- [scope-review.md](../../ideaspace/architecture/plans/plugin-local-first/scope-review.md) — four-repo audit (keep/reframe/strip/drop)
- [ideaspace-create.md](../../ideaspace/architecture/plans/plugin-local-first/ideaspace-create.md) — flagship CLI behavior
- [enhancements.md](../../ideaspace/architecture/plans/plugin-local-first/enhancements.md) — Claude Code plugin features for polish
- [identity-attribution.md](../../ideaspace/architecture/plans/plugin-local-first/identity-attribution.md) — trailer format, onboarding, agent identity

## What's done

- ideaspace `_agent/` migrated to the new five-file shape — dogfooded before shipping the template
- CLAUDE.md added at the ideaspace root
- Memory rescoped: `Co-Authored-By` format depends on repo type (GitHub vs ideaspace)
- Monorepo CLAUDE.md updated to reference the five-file contract

## What's active

**Cleanup pass** — running before hook rebuild because it validates scope-review against reality:

- **Layer A** — this repo's `_agent/` migration (foundation/guide/next added, `always.md` / `bugs/` / `docs/orientation-pr-plan.md` dropped, CLAUDE.md added at plugin root)
- **Layer B** — plugin user-facing copy (manifest + README) goes local-first
- **Layer C** — skill descriptions reframe (drop dropped-tool refs, reframe `is-space` and `is-setup`)
- **Layer D** — strip `mcp-server/` / `cli/` / `sdk/` source per scope-review

## What's next

After cleanup pass:

- SessionStart hook rebuild — walk-up detection + Purpose/Now content inline. Build `findSpaceRoot()` in SDK first.
- Implement `ideaspace create` + canonical default template (per [ideaspace-create.md](../../ideaspace/architecture/plans/plugin-local-first/ideaspace-create.md)).
- Skills triad rewrite — agent-voice, awareness triggers, chained.
- Run dogfood test.

## Not now

- New `is_*` tools beyond `is_auth` + `is_write`
- New workspace skills until `is-founder` + `is-vc` prove out as templates (likely `--template` flags for `ideaspace create`)
- Local semantic search (returns when sync upgrade ships)
- POV → schema rename (touches LanceDB)
