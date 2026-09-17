# Create a space

> Talk first. Scaffold. Write what was agreed. One file.

Adopted from the public Knowledge kind (`knowledge:repo:n_f1511280efecd7fcff155152`), whose page
explains what a knowledge space is and carries a complete example to compare against. This is the
procedure as it runs in Claude Code, where the bundled CLI is the scaffold writer.

## 1. Look before speaking

Read the folder. Say what you found in a line. Change nothing. The table in `SKILL.md` says what
each finding means.

If they seem to want an agent — "an assistant", "something that does X for me" — switch to
[`create-an-agent.md`](create-an-agent.md).

## 2. Draw out

Open with the story, not a form:

> "Tell me about the last time you needed this. What were you trying to do, and what got in the way?"

Listen for the seven things. Ask only for what is missing *and* needed before the first move.

| | Listen for | If it has not come up |
|---|---|---|
| 1 | What this place is around; what it should make possible | "If this worked, what could you do next week that you can't now?" |
| 2 | What a good result looks like | "Show me one good outcome and one bad one." |
| 3 | What the agent does alone; what it brings back | "Where do you want to be asked first? Where would asking annoy you?" |
| 4 | What stays private, is kept, may be shared | "Who else, if anyone, should ever see what lands here?" |
| 5 | Words that mean something specific here | Collect; don't ask. |
| 6 | What is not decided | "What haven't you made your mind up about?" |
| 7 | What would say this is set up wrong | "What would make you want to change this?" |

Cases, not categories. Their words, not yours. If something is undecided, the file says so and the
work starts.

## 3. Reflect back

Before writing, say it in the shape the file will take:

> "Here's what I have. This place is … Work goes … You'd rather I ask before … and not bother you
> about … The words: … Still open: … We'd revisit if … Where am I wrong?"

Revise until it is right.

## 4. Scaffold

Dry-run, show the plan, apply on a yes:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create [<name>]
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js create [<name>] --yes
```

Without `<name>` it scaffolds the current folder; with one it creates `./<name>/`. In a code repo
`_agent/` stays private unless `--shared`. The CLI writes `_agent/agreement.md` under the knowledge
kind with every section a prompt, a short `CLAUDE.md`, `.gitattributes`, `.gitignore` defaults, and
makes the initial commit on `main` when git is usable. Relay its stdout.

## 5. Write what was agreed

Replace each prompt in `_agent/agreement.md` with `Edit`. The shape the CLI left:

```markdown
---
name: Agreement — <place>
summary: <two dense sentences: what this place is and how work goes here>
agreement: knowledge:repo:n_f1511280efecd7fcff155152    ← leave as written
---

# Agreement — <place>

## What this place is
<the story, in their words>

## How work goes here
<three to six lines — what lands where, what good looks like. Say what a Note is here: one file,
a two-line summary at the top, in a folder named for what it is about. The agent proposes, you
confirm.>

## Alone, and brought back
Alone: <…>. Brought back: <…>, and any change to this file.

## Words with local meaning
- **<term>** — <what it means here>

## Still open
- <undecided things, named>

## When to revisit
<the signals from 7>
```

Remove the "every section below is a prompt" line once none is. Keep the rest of the frontmatter
exactly as the CLI wrote it.

Do **not** write `purpose.md`, `now.md`, or an empty `skills/`. They come when there is something
real to put in them.

## 6. Check it loads

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js navigate --json
```

`manifest.contractSource` must be `agreement` and `manifest.agreementReference` the knowledge kind.
If `contract_invalid` appears, a frontmatter line is wrong — usually the `summary` gained a colon.

## 7. Show, confirm, commit

Show the file once more. On a yes, commit **by explicit path** with `is_commit` — only
`_agent/agreement.md` — with a message like `Form the Agreement for <place>`, before the session
ends, not after another round.

## 8. Offer what comes next — do not do it

- **Publish**, when they want it on another machine or shared: `/is-publish` shows a plan and
  changes nothing without agreement.
- **The first Note.** If the story contained something worth keeping — it usually does — propose it
  as the first file, in the shape the Agreement just described. That is the space's first capture.
- **A skill** (**is-shape**), if a procedure came up in the story that will repeat.
- **`purpose.md`**, when they can say in a paragraph why the place exists and it is not the same
  paragraph as "what this place is".
