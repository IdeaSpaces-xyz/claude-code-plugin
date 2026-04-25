# Purpose

> This is where we shape the agent in Claude Code. The plugin is the agent's body — skills, tools, conventions. When we edit here, we edit how the agent shows up.

Everything inside `ideaspaces-plugin/` defines a behavior the agent will have on someone's machine: which tools it reaches for, which conventions it respects (Two Roles, `_agent/` as marker, voice per folder), how it orients at session start. Changes to this repo are changes to the agent.

We work here together. The human notices friction from using the thing. The agent notices what it didn't know when it needed to know it. Both surface back into skills, hook, `is-setup` flow.
