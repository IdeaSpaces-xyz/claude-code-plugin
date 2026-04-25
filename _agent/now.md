# Now

> Close session-start blindness. The `_agent/` rule needs to travel.

**Updated:** 2026-04-24

---

## The thread

Monorepo `CLAUDE.md` now teaches the `_agent/` marker rule. But the plugin installs on other machines, other folder shapes — the rule doesn't travel with it yet. When an agent lands in a Space-adjacent folder (not the connected root), the hook stays silent and the skill gets pulled too late. See `_agent/bugs/2026-04-17 Session-Start Blindness.md`.

## What we're doing

- Make the hook (or the default SessionStart output) carry the Two Roles + `_agent/` rule regardless of connection status.
- Detect "I'm in a Space-adjacent place" — walk up, find neighbors, surface context.
- Verify `is-space` description triggers reliably when an agent enters an `_agent/`-bearing directory.
- Dogfood on real work. Notice where the agent didn't know something it should have. That's the signal.

## Not now

- New `is_*` tools. Five is enough.
- New workspace skills beyond `is-founder` + `is-vc` until those prove out.
- Update `is-setup` to scaffold the new four-file `_agent/` structure (`purpose`, `now`, `always`, `rules`) — let the structure live in `ideaspace/_agent/` for a session or two before encoding it in the setup flow.
- Rename `"perspective"` → `"pov"` in schema. Touches LanceDB. Bigger move, not from one jam.
