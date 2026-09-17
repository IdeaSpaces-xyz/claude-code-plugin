# Create an agent

> An agent is a folder whose Agreement says who it is. Draw out who, scaffold, then write it.

Adopted from the public Agent kind (`agent:repo:n_0935a5df1f883eeb60bcdfbb`), whose page explains
why an agent is a point of view and carries a complete example to compare against. This is the
procedure as it runs in Claude Code, where the bundled CLI is the scaffold writer.

## 1. Look before speaking

Read the folder. Say what you found in a line. Change nothing. The table in `SKILL.md` says what
each finding means; two things are specific to agents:

- An agent's folder is not a code repo — its folder is its memory. In a code repo, propose a
  sibling folder named for the agent. The CLI refuses `--agent` there anyway.
- Markdown files, no `_agent/`: ask whether this content is the agent's memory or something else
  that should stay separate.

If they want a place for knowledge rather than a someone, switch to
[`create-a-space.md`](create-a-space.md).

**Name it.** Short, filesystem-friendly: letters, digits, spaces, `. _ -`. The agent gets its own
folder with that name; the CLI refuses a name that would not survive the file's header.

## 2. Draw out who it is

Open with a task, not a personality:

> "Walk me through a task you'd hand this agent. What did a good result look like? Where would you
> not trust it?"

Listen for the seven things every Agreement needs and the three an agent adds. Cases, not
adjectives — "helpful and concise" is nothing; "cuts any line it can't link to a source" is a
trait.

| | Listen for | If it has not come up |
|---|---|---|
| 1 | What this agent is for; what it should make possible | "If it worked, what would you stop doing yourself?" |
| 2 | What a good result looks like | "Show me one good output and one you'd send back." |
| 3 | What it does alone; what it brings back | "What may it just do? What must it show you first?" |
| 4 | What it keeps, what stays private, what may be shared | "Where should what it produces go? Who else sees it?" |
| 5 | Words that mean something specific | Collect; don't ask. |
| 6 | What is not decided | "What are you unsure about?" |
| 7 | What would say it is set up wrong | "What would make you rewrite this?" |
| **8** | **Character** — three to five traits, each testable in an output | "What would you notice in its work that tells you it's this agent and not a generic one?" |
| **9** | **Boundaries** — what it refuses; what it never claims without checking | "What must it never do? What should it never say it did unless it did?" |
| **10** | **What it is not** — the neighbouring role and where the line sits | "What might someone confuse this with? When should it hand back?" |

Only what blocks the first task needs an answer. If character is thin after the conversation, the
section is short and says so; it fills in from real sessions.

## 3. Reflect back

> "Here's who I have. <Name> is … It shows up as … It never … It's not a … It may … on its own and
> brings back … Where am I wrong?"

Revise until they recognise the agent.

## 4. Scaffold

Dry-run, show the plan, apply on a yes:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create <name> --agent
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create <name> --agent --yes
```

The CLI creates `./<name>/` with `_agent/agreement.md` under the agent kind — the point-of-view
opener written, every other section a prompt — a `CLAUDE.md` whose first line says launching there
means being <Name>, `.gitattributes`, `.gitignore` defaults, and the initial commit on `main` when
git is usable. Relay its stdout.

## 5. Write who it is

Replace each prompt in `<name>/_agent/agreement.md` with `Edit`. The shape the CLI left:

```markdown
---
name: Agreement — <Name>
summary: <Name> is <one sentence: what it does for whom>. Launching here means being <Name> —
  <one sentence: the core of how it works and its hardest boundary>.
agreement: agent:repo:n_0935a5df1f883eeb60bcdfbb    ← leave as written
---

# Agreement — <Name>

This folder is <Name>'s **point of view**, not a subject to study. An agent launched here is <Name>
for the session. Nothing in this folder is knowledge *about* <Name>; it is the place <Name> looks
from and what it has produced.

## What this place is
<what <Name> reads, what it produces, for whom — from the task they described>

## Character
- **<trait>.** <one sentence of what it means in practice>

## Boundaries
- Never <…>.
- Never claims <…> without <…>.

## What <Name> is not
<the neighbouring role; where the line sits; what to hand back>

## How a task goes
1. <…>
2. <…>

## Alone, and brought back
Alone: <…>. Brought back: <…>, and any change to this file.

## Words with local meaning
- **<term>** — <what it means here>

## Still open
- <undecided things, named>

## When to revisit
<the signals from 7>
```

Remove the "every section below is a prompt" line once none is. Keep the opener and the rest of the
frontmatter exactly as the CLI wrote them.

Do **not** write `purpose.md`, `now.md`, or an empty `skills/`.

## 6. Check it loads

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js navigate --json
```

Run from inside `<name>/`. `manifest.contractSource` must be `agreement` and
`manifest.agreementReference` the agent kind. If `contract_invalid` appears, a frontmatter line is
wrong — usually the `summary` gained a colon.

## 7. Show, confirm, commit

Show the file once more. On a yes, commit **by explicit path** with `is_commit` (`cwd` =
`<name>/`) — only `_agent/agreement.md` — with a message like `Form <Name>'s Agreement`, before the
session ends, not after another round.

## 8. Offer what comes next — do not do it

- **Try it.** Open a new session in the folder and hand <Name> the task from the conversation. The
  first real run is the best test of the character section. SessionStart will say `Kind: agent —
  launching here means being <Name>`.
- **A skill** (**is-shape**), if the task has a procedure it will repeat every time — write it after
  the first run, not before.
- **Publish**, when they want <Name> on another machine or shared: `/is-publish` from inside the
  folder.

## What this does not do

- Write character the person did not give. Thin is honest; invented is not.
- Give the agent a name others can pick from a list, a picture, or permissions. Those come from
  wherever it is hosted, afterwards.
