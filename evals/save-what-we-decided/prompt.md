---
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: ["Read", "Glob", "Grep", "Skill"]
---
We just worked out that we're going with the vendored-bundle approach instead of an npm dependency, because the install has to work with no network. Write that down somewhere it won't get lost.
