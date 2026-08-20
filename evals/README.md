# Evals — does what people say reach what we built?

These cases test **matching**, not execution. Each prompt is a sentence in a person's own
words; the graders ask whether the agent reached the right capability and answered in terms
the person would recognise.

Run:

```bash
claude plugin eval . --ablation with-without --judge-model sonnet
```

`--ablation with-without` adds a no-plugin baseline arm. A case the baseline already passes
is not evidence the plugin works — the delta is the result.

## Why the tools are withheld

Every case grants only the read-only set (`Read`, `Glob`, `Grep`, `Skill`). Nothing here can
write a file, create a remote object, fork, or grant anybody access, so the suite is safe to
run unattended against a real account.

That is a deliberate scope, not a limitation we regret. What breaks on this surface is the
step *before* execution: the skill and tool descriptions are the only text loaded before the
agent decides what to do, and they are written in our vocabulary rather than the user's.
Execution correctness across real runtimes — no Node, no git, sandboxed network — is verified
separately, in environments a prompt cannot supply.

## The cases

Eight jobs plus one negative. Cases marked **expected miss** encode a known gap — they are
written to fail today, and flipping them is what "fixed" means.

| Case | The job | Expected today |
|---|---|---|
| `learn-what-this-is` | Understand what this is and what to ask for | **miss** — no skill answers this |
| `want-an-assistant` | An assistant / persona / profile | weak — vocabulary not in any description |
| `want-a-knowledge-base` | A knowledge base / notebook / second brain | **miss** — no phrasing matches |
| `save-what-we-decided` | Preserve a decision | pass |
| `what-do-i-have-access-to` | See what's mine and what's shared with me | weak — the tool speaks in slugs and roles |
| `make-my-own-copy` | Take an independent copy | **miss** — fork has no agent-side surface |
| `am-i-current` | Know whether anything moved | **miss** — no skill over `sync` or the trail |
| `let-someone-see-it` | Give a person read access | pass |
| `plain-code-request` | *(negative)* an ordinary coding task | must not fire |

`plain-code-request` is the floor invariant: a suite with no should-not-fire case measures
eagerness, not accuracy. Widening a description until every positive case passes will break
this one, which is the point.

## Reading a result

Each case pairs an **outcome grader** (an `llm` rubric over the final answer — what a person
would notice) with a **trigger indicator** (`tool_used: Skill`). The indicator is reported but
excluded from the score in both arms, so it never moves the delta; it tells you *which* skill
fired when a case fails, which is usually the whole diagnosis.

A case can fail two ways worth telling apart: nothing fired (no description matched), or the
wrong thing fired (a neighbouring description was a better match than the right one). The
second is the more expensive bug and only the indicator surfaces it.

## Status

**Not yet piloted.** `claude plugin eval` is in early access and not enabled on our account,
so these graders are uncalibrated — written against the jobs analysis, never run. Treat the
expected-outcome column as a prediction, not a baseline. Gate 2 is piloting the suite,
reading every judge verdict, and revising the rubrics before any of this is trusted.
