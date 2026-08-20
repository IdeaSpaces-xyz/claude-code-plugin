# Evals — does what people say reach what we built?

An intention in a person's own words should reach the right skill, which should end at the
right tool. These cases test that chain, and mostly its first link — because that is the one
that breaks.

```bash
node evals/build-cases.mjs            # regenerate cases from the roster
claude plugin eval . --ablation with-without --judge-model sonnet
```

## The roster is the source

[`intentions.csv`](intentions.csv) is the artifact to review and argue with. One row per
intention:

| column | what it holds |
|---|---|
| `id` | `<type>-<job>`, also the case directory name |
| `job` | the job-to-be-done, in our shorthand |
| `type` | explicit · implicit · contextual · negative |
| `should_trigger` | whether any skill should fire at all |
| `expected_skill` | `(none today)` marks a known gap |
| `expected_tool` | the MCP tool that skill should end at, where one applies |
| `prompt` | the sentence, in the person's words |

`build-cases.mjs` generates the case directories from it, and `--check` exits 3 on drift.
Generated, not hand-maintained: a roster and a suite that disagree is the exact failure this
suite exists to catch, and there is no reason to be vulnerable to it ourselves.

Outcome rubrics live once per job in [`rubrics/`](rubrics/) and are shared by every phrasing
of that job — what changes across types is the prompt, not what a good answer looks like.

## The four types

From [OpenAI's skill-eval method](https://developers.openai.com/blog/eval-skills), which
names the axis our first pass was missing:

- **explicit** — the skill or command named outright. A control. If explicit passes and
  implicit fails, the capability is fine and the *description* is the bug. Nothing else
  separates those two cleanly.
- **implicit** — the job in plain words, no product vocabulary. This is what the description
  is actually for, and where we expect most failures.
- **contextual** — the same job buried in the noise a real conversation carries. Clean
  single-intent sentences flatter the matcher.
- **negative** — adjacent requests that must *not* fire. A suite without these measures
  eagerness, not accuracy.

## What is scored

Each case pairs an **outcome grader** (an `llm` rubric over the final answer — what a person
would notice) with a **trigger indicator** (`tool_used: Skill`), and where a tool applies, a
secondary **tool grader** at `weight: 0.5`.

The trigger indicator is reported but excluded from the score in both arms, so it never moves
the delta. It earns its place by distinguishing the two ways a case fails: *nothing fired*
(no description matched) or *the wrong thing fired* (a neighbour was a better match). The
second is the more expensive bug and only the indicator surfaces it.

`--ablation with-without` runs a no-plugin baseline arm. A case the bare model already passes
is not evidence the plugin works — the delta is the result.

## Side effects: read the warning

Each case grants only `Read`, `Glob`, `Grep`, `Skill`. **That is a floor, not a ceiling** — a
skill that fires self-grants the tools in its own `allowed-tools`, which for `is-capture` and
`is-setup` includes writing and committing.

**Run this in a scratch directory, not in a real space.** The suite is designed around
matching, so nothing here needs to succeed at execution, but a case that reaches `is-capture`
can write and commit before its answer comes back.

## Expected today

Rows whose `expected_skill` is `(none today)` encode a known gap — written to fail, and
flipping them is what "fixed" means. Understand, fork, and know-if-current are all in that
state; make-a-space and see-my-spaces are expected weak, matching on our vocabulary rather
than the person's.

## Status

**Not yet piloted.** `claude plugin eval` is in early access and not enabled on our account,
so every grader here is an uncalibrated prediction — written against the analysis, never run.

Piloting is a gate, not a formality: run the suite, read every judge verdict, ask whether any
should have scored differently, and revise until the answer is no. Until that happens, treat
the expected-outcome column as a hypothesis and nothing here as a baseline.
