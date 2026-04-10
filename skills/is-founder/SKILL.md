---
name: is-founder
description: Collaborative founder workspace kickoff. Use when a user asks to set up startup workflow, operating context, or cross-session tracking. Do NOT use for one-off startup questions or single note edits.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write"
---

# Founder Workspace Kickoff

This skill follows the shared protocol in `../_shared/workspace-kickoff-pattern.md`.

Use that flow as the default behavior. This file defines the founder-specific overlay.

## Domain Triggers

Strong triggers:
- "set this up for my startup"
- "help me structure my founder workspace"
- "I want cross-session context for decisions/customers/progress"

Do **not** use for:
- one-off startup analysis
- quick writing/edit of one note
- ad-hoc brainstorming without workspace setup intent

## Founder Discovery Prompts (2–3, then synthesize)

- "What are you building, and for whom?"
- "Where do decisions or customer insights currently get lost?"
- "What recurring updates do you wish happened automatically each week?"

Optional follow-ups:
- solo founder or team workflow
- current GTM motion
- 90-day success signal for this space

## Suggested Branch Options (proposal phase)

Offer as options, not defaults:

- `/decisions` — why key choices were made
- `/customers` — interview notes, feedback, recurring patterns
- `/progress` — weekly/milestone log (shipped, blocked, learned)
- `/docs` — durable docs that should stay current
- optional `/experiments` — hypotheses, tests, results

For each approved branch, scaffold:
- `README.md`
- optional `_agent/guidance.md`

## Suggested Local Guidance

### `/decisions/_agent/guidance.md`
- Capture decision + rationale + tradeoffs + expected outcome.
- Prefer concrete evidence over opinion.

### `/customers/_agent/guidance.md`
- Distinguish direct quotes, interpretation, and implications.
- Promote repeated signals across customers.

### `/progress/_agent/guidance.md`
- Keep updates brief and factual: shipped, blocked, learned, next.
- Link changes back to current Now when relevant.

### `/docs/_agent/guidance.md`
- Keep docs alive: update or delete stale docs.
- Prefer focused docs over broad handbooks.

## Recommended Metadata Conventions

Tags:
- `type:decision`, `type:feedback`, `type:progress`, `type:experiment`
- `priority:*`, `theme:*`, `status:*`

Entities (`attached_to`):
- `hostname:company.com`
- `person:name`

## Ongoing Repetitive-Work Patterns

- After a decision: propose capture in `/decisions`
- After customer conversations: propose capture in `/customers`
- End of week/session: propose short `/progress` update
- When focus drifts: trigger `is-reflect` at natural break

## Success Test

A founder says: "I just talked to three users and changed pricing" and the agent knows:
- where each part belongs,
- what to capture now vs later,
- and how that affects current focus.
