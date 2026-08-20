---
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: ["Read", "Glob", "Grep", "Skill"]
---
This blows up when the account has no owner yet: `function ownerEmail(account) { return account.owner.email.toLowerCase(); }` — fix it.
