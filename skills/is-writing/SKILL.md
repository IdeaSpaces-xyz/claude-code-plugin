---
name: is-writing
description: Writing standard for IdeaSpaces Notes — structure, summaries, entities. Use when writing to the knowledge space.
user-invocable: false
---

# Writing Standard for IdeaSpaces

**The full standard lives in `${CLAUDE_PLUGIN_ROOT}/reference/writing.md`** — generated from the canonical protocol skill catalog. Read it when writing or revising a Note: it covers summaries, sections as the semantic fingerprint, concreteness, progressive disclosure, and what not to do. The notes below are only the surface-specific bits.

## Frontmatter this surface writes

Required on create:
- `name` — human-readable title
- `summary` — the most important field. Dense, two sentences; it's what search, navigate, and awareness show.

Optional but valuable:
- `tags` — descriptors for search, not categories ("regulatory", "series-a")
- `attached_to` — bind the entity a Note is about: `hostname:acme.com`, `person:alice`, `note:n_abc123`. Entities you name in the prose should be entities in the index — that's how Notes connect across the Space.

## Placement

Always `Glob` and `Read` the target area first. Understand what branches mean (their READMEs). Place content where it compounds with related knowledge; reuse existing locations before creating new ones.

This standard applies whenever **is-capture** proposes writing to the space.
