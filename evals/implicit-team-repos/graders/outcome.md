---
type: llm
focus: last_message
---
Passes only if all hold:
- The answer identifies that this product can list the person's remote spaces, including ones shared with them, and moves to do so or says login is needed first.
- It distinguishes what is theirs from what is shared, because that is what was asked.

Fails if the answer lists local files or directories as the response, asks the person which folder they mean, or says it has no way to see what they have access to.
