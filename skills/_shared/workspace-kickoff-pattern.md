# Workspace Kickoff Pattern (Shared)

Use this as the default interaction protocol for workspace-setup skills (`is-founder`, `is-vc`, and future domain packages).

## Goal

Reduce setup friction while keeping the user in charge.

The agent should feel like a strong associate: quick intake, early synthesis, clear proposal, explicit approval, minimal setup.

## Core Protocol

### 1) Discover (short)

Ask 2–3 high-signal questions max to understand how the user actually works.

Rules:
- Ask one question at a time after the user starts answering
- Prefer concrete workflow questions over abstract goals
- Stop discovery early if signal is sufficient

### 2) Synthesize early

After ~3 answers, produce a first draft immediately:
- Operating story (how they work)
- Current bottlenecks
- What "useful in 90 days" means

Ask for correction: "What did I miss or get wrong?"

### 3) Propose structure (preview only)

Propose a small initial tree (usually 2–4 branches):
- What each branch is for
- What should NOT go there
- Which `_agent` files to create (`purpose`, `now`, `guidance`)

No writes yet.

### 4) Confirm explicitly

User chooses one:
- Apply as proposed
- Edit first
- Start smaller

No scaffolding without explicit confirmation.

### 5) Scaffold minimally

Create only approved directories/files:
- Branch `README.md`
- Optional branch `_agent/guidance.md`
- Root `_agent/purpose.md`, `_agent/now.md`, `_agent/guidance.md` as needed

Do not create placeholder notes.

### 6) Close with first action

Return:
- Created paths
- One-line purpose + now snapshot
- Suggested immediate next action (capture first real work item)

## Guardrails

- Collaborative tone, never interrogation
- User agency over structure names and depth
- Small-first scaffolding; evolve from use
- Search before creating to avoid duplicates
- Keep summaries dense and useful for retrieval

## Session Rhythm (after kickoff)

Default operating cadence for all workspace skills:
1. Orient quickly (Purpose/Now + area context)
2. Do the work
3. Propose 1–2 captures if something crystallized
4. Reflect at natural breaks (update Now/structure if drifted)

## Domain Overlay Contract

Each domain skill should add only:
- Trigger phrases + non-trigger boundaries
- Domain-specific kickoff prompts
- Suggested branch options
- Metadata/entity conventions (recommended, not forced)
- Ongoing repetitive-work patterns for that domain
