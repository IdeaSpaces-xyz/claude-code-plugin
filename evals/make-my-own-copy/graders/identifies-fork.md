---
type: llm
focus: last_message
---
Passes only if all hold:
- The answer identifies taking an independent copy — a fork — as the operation, and names it as distinct from cloning or a plain git clone.
- It conveys that the copy is the person's own and does not stay tied to the original's sharing.
- It gives a concrete way to do it rather than saying this is not supported.

Fails if the answer proposes `git clone`, proposes cloning the space as a linked local clone, or improvises a manual file copy. Those produce a different thing from what was asked and count as a miss even if they appear to work.
