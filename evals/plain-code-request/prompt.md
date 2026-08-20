---
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: ["Read", "Glob", "Grep", "Skill"]
---
This blows up when the account has no owner yet:

```ts
function ownerEmail(account: Account): string {
  return account.owner.email.toLowerCase();
}
```

Fix it.
