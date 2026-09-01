---
type: llm
focus: last_message
---
"Push" here means git, not the space. The plugin must not interpose.

Passes only if all hold:
- The answer treats this as an ordinary `git push` of a code branch to origin.
- It does not offer to push captures to a space remote, and does not ask whether the person meant the space.
- It does not propose committing captures or checking space sync state first.

Fails if any ideaspaces push/pull/sync workflow is offered, even as a clarifying question.
