---
name: is-vc
description: Collaborative VC workspace kickoff. Use when a user asks to set up investor workflow, dealflow structure, or firm operating context. Do NOT use for one-off company analysis or routine note capture.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write"
---

# VC Workspace Kickoff

## Intent

Set up a VC workspace without imposing a rigid template. The partner stays in charge. The agent runs a short kickoff conversation, synthesizes their operating model, proposes structure, and scaffolds only after approval.

## Core Principles

1. **User agency first** — no scaffolding before explicit approval.
2. **Collaborative kickoff, not interrogation** — ask only what is needed to model their workflow.
3. **Small initial footprint** — start with minimal structure; expand with use.
4. **Local context over global rules** — README + `_agent/guidance.md` at each branch.

## Entry Conditions

Use this when user says they are a VC/investor or asks for workspace setup.

If not connected / no space selected: suggest `is-setup` first.

## Activation Signals and Boundaries

Strong triggers:
- "set this up for my VC workflow"
- "help me structure dealflow / IC process"
- "I want this space to run our investing process"

Do **not** use this skill for:
- one-off deal analysis (just evaluate one company)
- single note writing or cleanup
- routine metadata updates on existing notes

In those cases, continue with normal `is_*` tools and only offer this skill if the user asks to design the full workspace.

---

## Flow

### 1) Kickoff Conversation (discovery)

Use a short, collaborative onboarding tone: "Help me understand how *you* run deals so I can support your process."

Start with 3 core prompts:

- "What do you mainly invest in right now (stage + themes)?"
- "How do deals move from first look to decision in your firm?"
- "Where do you currently lose context or repeat work?"

Optional follow-ups (only if needed):
- portfolio involvement level
- IC artifact style (memo-heavy vs discussion-heavy)
- 90-day success signal for this space

Rules:
- Ask 1 question at a time once they start answering.
- After ~3 answered prompts, synthesize a first draft immediately.
- Cap discovery to ~5 total questions unless they ask for deeper design.
- Reflect back in plain language after every 1–2 answers.
- Don’t scaffold yet.

### 2) Synthesize Operating Story

Generate a short artifact for confirmation:

## Operating Story
- Investment style (stage, check size, pace)
- Decision workflow (screening → diligence → IC → follow-up)
- Portfolio behavior (hands-on / light-touch)
- Current bottlenecks
- Success criteria for this space

Ask: **“Is this accurate? What should I change?”**

### 3) Propose Structure (preview only)

Provide a proposal, not a command:

## Proposed Structure (Draft)
- `/pipeline` (or `/dealflow`) — active company evaluations
- `/market-intel` (or `/industries`) — reusable sector/thematic knowledge
- `/portfolio` — post-investment updates and decision history
- optional `/ic` — investment committee memos and decisions

For each branch, include:
- why it exists
- what goes there
- what should *not* go there

Also propose `_agent` context files:
- root `_agent/purpose.md`
- root `_agent/now.md`
- root `_agent/guidance.md`
- branch-level `_agent/guidance.md` for decision standards

### 4) Confirm before write

Ask for explicit choice:
- Apply as proposed
- Edit names/branches first
- Start smaller (pick 1–2 branches)

No writes until user confirms.

### 5) Scaffold approved structure

Use `is_write` to create only approved files.

Per approved branch create:
- `README.md` (clear inclusion/exclusion guidance)
- optional `_agent/guidance.md` (local behavior and quality bar)

At root, update/set:
- `_agent/purpose.md` (from their stated value target)
- `_agent/now.md` (current focus + progress signals)
- `_agent/guidance.md` (how to support this firm)

Do not create placeholder company notes.

### 6) Confirm setup

Return:
- created paths
- one-line purpose
- current focus snapshot
- suggested first action (e.g., “let’s capture the first deal you’re reviewing”)

---

## Suggested Guidance Content (short form)

### `/pipeline/_agent/guidance.md`
- Prioritize investment-relevant evidence.
- Always surface: upside case, failure case, disconfirming signals.
- Keep stage in metadata (`stage:*`), not prose drift.
- Ask before escalating to IC recommendation.

### `/market-intel/_agent/guidance.md`
- Promote cross-deal patterns from pipeline notes.
- Capture reusable insights (regulation, GTM, market structure).
- Prefer specific claims with evidence over generic trends.

### `/portfolio/_agent/guidance.md`
- Track changes over time (thesis shifts, follow-on logic, board decisions).
- Separate facts from interpretation.
- Keep follow-on decisions tied to prior assumptions.

---

## Metadata Conventions (recommend, not force)

Tags:
- `stage:screening | deep-dive | ic | passed | portfolio`
- `sector:*`, `round:*`, `geo:*`, `priority:*`

Entities (`attached_to`):
- `hostname:company.com`
- `person:founder-name`

---

## Don’t

- Don’t force fixed directory names.
- Don’t apply a scoring template as mandatory process.
- Don’t pre-create many empty notes.
- Don’t overwrite Purpose/Now without confirmation.

---

## Success Test

A partner can say: **“I just met a Series A fintech founder”** and the agent knows:
- where to place it,
- what metadata to suggest,
- what prior context to retrieve,
- and how to move it through that firm’s real process.
