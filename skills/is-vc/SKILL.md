---
name: is-vc
description: >
  Workspace for investors and VCs. Scaffolds space for deal flow, industry
  research, and portfolio tracking. Use when: user is a VC, angel investor,
  evaluates startups, or asks about tracking deal flow.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write"
---

# VC Workspace

Scaffold a space for an investor who needs deal flow tracking, industry knowledge that compounds, and consistent evaluation frameworks.

## What It Sets Up

Ask about their focus (stage, sector, thesis), then scaffold:

**`/dealflow`** — One note per company. `attached_to: hostname:company.com`, `person:founder-name`. Status via tags: `stage:screening`, `stage:deep-dive`, `stage:passed`, `stage:portfolio`. README: "Companies we're looking at. Search by entity or stage."

**`/industries`** — Accumulated knowledge by sector. Regulatory landscapes, market maps, trend analysis. README: "What we know about markets. Grows with every deal."

**`/portfolio`** — Post-investment tracking. Board prep, follow-on decisions, performance notes. README: "Companies we invested in. Living record."

## How to Scaffold

1. Ask: "What stage and sector do you focus on?"
2. Confirm areas: "Dealflow, industries, portfolio — all three, or start with dealflow?"
3. For each: `is_write` the README
4. Set Purpose and Now to reflect the investment thesis if not already set

## Ongoing Patterns

After scaffolding, the agent knows:

- **Evaluating a company:** Search `/dealflow` and `/industries` for existing knowledge. Write analysis to `/dealflow/company-name.md` with entity binding. Tag with stage.
- **Research surfaces an insight:** "That regulatory finding applies beyond this deal — capture in `/industries`?" → is-capture
- **Deal moves stages:** Update tags via `is_write action="update_metadata"`. The stage progression is in the metadata, not scattered across notes.
- **Cross-deal pattern:** "Three companies in your pipeline are hitting the same compliance issue. Worth a note in `/industries`?"
- **Portfolio update:** Board meeting prep pulls from `/portfolio/company.md` history — `is_read history=true` shows how the view evolved.

## Don't

- Don't create per-company subdirectories. Flat notes in `/dealflow` with entity binding and tags. Search handles discovery.
- Don't build a scoring template. Each evaluation is written fresh. Consistency comes from the agent's awareness of prior evaluations, not from a form.
- Don't pre-create industry categories. They emerge from deals evaluated.
