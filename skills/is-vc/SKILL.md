---
name: is-vc
description: Collaborative VC workspace kickoff. Use when a user asks to set up investor workflow, dealflow structure, or firm operating context. Do NOT use for one-off company analysis or routine note capture.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write"
---

# VC Workspace Kickoff

This skill follows the shared protocol in `../_shared/workspace-kickoff-pattern.md`.

Use that flow as the default behavior. This file defines the VC-specific overlay.

## Domain Triggers

Strong triggers:
- "set this up for my VC workflow"
- "help me structure dealflow / IC process"
- "I want this space to run our investing process"

Do **not** use for:
- one-off deal analysis
- single note writing or cleanup
- routine metadata updates on existing notes

## VC Discovery Prompts (2–3, then synthesize)

- "What do you mainly invest in right now (stage + themes)?"
- "How do deals move from first look to decision in your firm?"
- "Where do you currently lose context or repeat work?"

Optional follow-ups:
- portfolio involvement level
- IC artifact style (memo-heavy vs discussion-heavy)
- 90-day success signal for this space

## Suggested Branch Options (proposal phase)

Offer as options, not defaults:

- `/pipeline` (or `/dealflow`) — active company evaluations
- `/market-intel` (or `/industries`) — reusable sector/thematic knowledge
- `/portfolio` — post-investment updates and decision history
- optional `/ic` — investment committee memos and decisions

For each approved branch, scaffold:
- `README.md`
- optional `_agent/guidance.md`

## Suggested Local Guidance

### `/pipeline/_agent/guidance.md`
- Prioritize investment-relevant evidence.
- Always surface upside case, failure case, and disconfirming signals.
- Keep stage in metadata (`stage:*`), not prose drift.

### `/market-intel/_agent/guidance.md`
- Promote cross-deal patterns from pipeline notes.
- Capture reusable insights (regulation, GTM, market structure).
- Prefer specific claims with evidence over generic trends.

### `/portfolio/_agent/guidance.md`
- Track thesis shifts, follow-on logic, and board decisions over time.
- Separate facts from interpretation.

## Recommended Metadata Conventions

Tags:
- `stage:screening | deep-dive | ic | passed | portfolio`
- `sector:*`, `round:*`, `geo:*`, `priority:*`

Entities (`attached_to`):
- `hostname:company.com`
- `person:founder-name`

## Ongoing Repetitive-Work Patterns

- New deal: capture in `/pipeline` with stage + entity binding
- Cross-deal pattern: promote to `/market-intel`
- Deal stage change: metadata update instead of narrative drift
- Board/follow-on updates: append to `/portfolio` with decision rationale

## Success Test

A partner says: "I just met a Series A fintech founder" and the agent knows:
- where to place it,
- what metadata to suggest,
- what prior context to retrieve,
- and how to move it through that firm’s process.
