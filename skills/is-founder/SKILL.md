---
name: is-founder
description: >
  Workspace for solo founders and small teams. Scaffolds space for tracking
  decisions, progress, customers, and documentation. Use when: user is a founder,
  building a startup, or asks about tracking progress across sessions.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write"
---

# Founder Workspace

Scaffold a space for a founder who works extensively with AI and needs knowledge to compound across sessions.

## What It Sets Up

Ask what the user is building, then scaffold:

**`/decisions`** — The most valuable thing to capture. Every "we're going with X because Y" that would otherwise be lost. README: "Why we chose what we chose. Prevents relitigating."

**`/customers`** — Interview notes, feedback, patterns. Each customer as a note with `attached_to: hostname:company.com` or `person:name`. README: "What customers tell us. Raw signal."

**`/progress`** — Weekly or milestone-based updates. What shipped, what's blocked, what's next. README: "What happened and what we learned."

**`/docs`** — Living documentation that stays current. Product specs, architecture decisions, processes. README: "How things work. Keep it updated or delete it."

## How to Scaffold

1. Confirm with user: "I'd suggest four areas: decisions, customers, progress, docs. Want all four, or start smaller?"
2. For each accepted area: `is_write` the directory README
3. Don't create empty placeholder notes — only READMEs
4. Update Now to reflect the new structure if appropriate

## Ongoing Patterns

After scaffolding, the agent knows:

- **After a decision:** "That's a clear decision — capture in `/decisions`?" → is-capture
- **After a user conversation:** "Want to capture that customer feedback?" → write to `/customers` with entity binding
- **End of a work session:** "Anything worth logging in `/progress`?" → brief update
- **Documentation drifted:** "The spec in `/docs` doesn't match what we just built" → is-reflect

## Don't

- Don't create subdirectories within the four areas upfront. Let them emerge.
- Don't create templates. Each note is written fresh by is-writing standard.
- Don't force the structure. If the user only wants `/decisions`, that's enough.
