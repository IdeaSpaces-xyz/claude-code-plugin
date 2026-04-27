---
name: Next
summary: After the local-first pivot lands — workspace skill packages refresh as templates,
  default template registry, sync-aware UX once the upgrade ships. Vague is allowed.
---

# Next

What's identified to come after Now. Vague is allowed — agents and humans figure out the flow.

---

## After local-first lands

- Workspace templates — build `is-founder` and `is-vc` from scratch as `--template founder` / `--template vc` for `ideaspace create` (the prior server-flavored skill files were removed; the concept returns as a template, not a refresh)
- Default template registry / discovery story
- Cross-space monorepo awareness (cwd is parent with multiple `_agent/`-shaped descendants)
- SessionStart hook polish — `FileChanged`, `CwdChanged`, `PostToolBatch` prompt enhancements (see plan's [enhancements.md](../../ideaspace/architecture/plans/plugin-local-first/enhancements.md))

## When sync upgrade ships

- `is_*` tools beyond `is_auth` + `is_write` return as needed
- Sync-aware skills triad — capture writes both local and remote
- Template fetching from URLs

## Loose

- POV → schema rename (`perspective` → `pov` in LanceDB)
- Compression as awareness entry point
