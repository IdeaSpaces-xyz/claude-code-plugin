---
name: is-writing
description: Writing standard for IdeaSpaces Notes — structure, summaries, entities. Use when writing to the knowledge space.
user-invocable: false
---

# Writing Standard for IdeaSpaces

When writing Notes to IdeaSpaces, follow these principles. They're functional requirements for knowledge that compounds — not style preferences.

## Summary Is Everything

The `summary` field is the most important thing you write. It's what search shows. It's what navigate shows. It's what loads in awareness context. Write it like the first thing someone reads — because it is.

Two sentences max. Dense. Immediate orientation. "What is this and why does it matter."

## Sections Are the Semantic Fingerprint

Each `## heading` creates a vector centroid. Well-scoped sections = precise retrieval.

- A Note with five distinct sections has a 5-dimensional fingerprint MaxSim can match
- A wall of text collapses to one dimension — hard to find, hard to compare
- Each section should make a complete point independently
- A reader landing on any section orients without needing what came before

## Concrete Over Abstract

Specifics cluster with related specifics in vector space. Abstractions diffuse.

| Abstract | Concrete |
|----------|----------|
| "Significant growth" | "Revenue grew 40% in Q3" |
| "Strong team" | "3 ex-Google engineers, 2 successful exits" |
| "Large market" | "$4.2B TAM, growing 25% annually" |

## Entity Binding

Mention entities → add them to `attached_to`:

- Company: `hostname:acme.com`
- Person: `person:alice`
- Other Note: `note:n_abc123`

Entities in the prose should be entities in the index. This is how Notes connect across the Space.

## Frontmatter

Required on create:
- `name` — human-readable title
- `summary` — dense orientation (see above)

Optional but valuable:
- `tags` — descriptors for search, not categories. "regulatory", "series-a"
- `attached_to` — entity binding (see above)

## Placement

Always `is_navigate` the target area first. Understand what branches mean (READMEs). Place content where it compounds with related knowledge. Reuse existing locations before creating new ones.

## Progressive Disclosure

Title → Summary → Sections. Each level complete at its depth. A reader (or search) can stop at any level and have a useful picture.

## What Not To Do

- No filler phrases: "It is important to note that..." — just state the thing
- No hedge stacking: "It seems like it might possibly..." — either state the claim or acknowledge uncertainty once
- No elegant variation: if it's a "startup" in the first paragraph, don't call it a "venture" in the second
- No empty summaries — every Note needs a summary that earns its place

This standard applies whenever **is-capture** proposes writing to the space.
