---
type: llm
focus: last_message
---
Passes only if all hold:
- The answer treats this as preserving a decision in the space, and says where it would go.
- It shows or describes what it would write before writing, so the person can confirm.
- The decision's reason (the offline / no-network install) is carried, not just the choice.

Fails if the answer writes into an arbitrary file without naming a destination, or asks the person to choose between write mechanisms (Write vs is_write vs git) instead of choosing one.
