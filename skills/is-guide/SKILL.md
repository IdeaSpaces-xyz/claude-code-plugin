---
name: is-guide
description: >
  Explain IdeaSpaces to the person, at the right depth. Use when someone asks
  what is this, what does it do, how does it work, what can I do here, how can
  you help me, what do I need to run it — or has just installed it and wants
  to know what now. Answers come from the shipped guidance ladder, one rung at
  a time, offering a step deeper. Not for creating or opening a space; that is
  is-setup.
allowed-tools: "Read"
---

# Guide

Answer from shipped guidance, not improvisation. The ladder lives in
`${CLAUDE_PLUGIN_ROOT}/reference/` — four rungs, written for the person:

| Rung | File | Answers |
|---|---|---|
| The story | `reference/guide-story.md` | "What is this?" — for someone who has never heard of it |
| The jobs | `reference/guide-jobs.md` | "What can I do here? How can you help me?" |
| Working here | `reference/guide-working.md` | "How do I use this? Why did you check first / act right away?" |
| The bigger picture | `reference/guide-bigger-picture.md` | "Where does this lead? Why does this matter beyond notes?" |

## Routing

1. **Pick the rung that matches the person**, not the most complete one. A plain "what is this"
   starts at the story; "what can you do for me" starts at the jobs; workflow and
   act-vs-check questions start at working here; vision questions start at the bigger picture.
   When unsure, start one rung simpler than you think.
2. **Read the rung completely, answer at its altitude.** Use its words and your own; don't
   escalate to mechanics, file names, or product internals the person didn't ask for. Never dump
   the whole ladder.
3. **Offer one step deeper.** Each rung ends with its handoff — follow it only when the person
   wants more.
4. **Technical signals go past the ladder.** Someone asking about the spec, the shape, or
   conformance reads `reference/` operating protocols and the protocol's SPEC — the top rung
   hands off there.
5. **Wanting to *do* something ends the explaining.** "Set this up" → **is-setup**; "save this" →
   **is-capture**; "share it" → **is-share**. Answer the question they asked first, then act.

"What do I need to run it?" is the story's fourth point: nothing — a folder on your machine, no
account, no internet; hosting and sharing are optional and come later.
