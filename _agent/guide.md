---
name: Guide
summary: Specific agreements for working in the ideaspaces-plugin repo. The `_agent/`
  is shared (committed) — code repos default to private, but the plugin is itself
  collaborative agent-shaping work. Active track is the local-first pivot. Friction
  with the plugin-as-installed surfaces back into skills, hook, and `is-setup`.
---

# Guide

> Specific agreements for this repo, beyond [foundation](foundation.md) defaults.

---

## What's specific here

- **The `_agent/` is shared.** Committed to git. Anyone cloning this repo inherits the Agreement. Code repos default to private `_agent/`; this one is shared because the plugin is itself collaborative agent-shaping work.
- **Active track.** The local-first pivot — see [now.md](now.md). Plan lives in [`ideaspace/architecture/plans/plugin-local-first/`](../../ideaspace/architecture/plans/plugin-local-first/README.md) when the monorepo is checked out alongside.

---

## Friction surfacing

The human notices friction from using the installed plugin. The agent notices what it didn't know when it needed to know it. Both surface back into skills, the SessionStart hook, and the `is-setup` flow.

---

## When the Agreement drifts

If [now](now.md) stops matching reality, or [foundation](foundation.md) contradicts current practice, or this guide is silent on something we keep doing — surface it. Propose an update. Update this guide for plugin-specific scope, or revisit foundation if a baseline needs to shift.
