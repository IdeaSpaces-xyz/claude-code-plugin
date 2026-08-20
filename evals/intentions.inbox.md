# Inbox — raw phrasings

Write sentences. Nothing else. One per line under a heading, no ids, no schema —
the bookkeeping (type, expected skill, expected tool) gets added when these are
folded into `intentions.csv`.

Write how a person would actually say it, including the ones that are vague,
rambling, or half-wrong. A phrasing that makes us look bad is worth more than one
that doesn't.

---

## Understand what this is
*"what is this, what can I ask you for" — 2 phrasings, both currently fail*
What can I do here?
How can you help me
Can you tell me how IdeaSpaces work
What do I need to run IdeaSpaces

-

## Make an agent / assistant / persona
*2 phrasings, passing*
I need an executive assistant
I’m working on sales agent
I need critique who would help me work on my plan

-

## Make a place for knowledge
*3 phrasings, implicit passes*
I’m building my knowledge base about recepies
I need to create a repository for my teams KPI's
I need a vault for my call transcripts
I’m building small CRM


-

## Save something / capture
*2 phrasings — implicit now passes, contextual fails*
Lets save
These are good insights, we should capture this
Commit

-

## See what I have / what I can get to
*only 1 phrasing, fails*
What are knowledge repos I have access to
What are the team repos I can see and work with

-

## Where are we / what were we doing
*only 1 phrasing, fails*
What has recently happened here

-

## Make my own copy of someone's space
*3 phrasings — nothing exists to serve these yet*
I would like to copy this space [space_url]
Lets make a copy of this

-

## Am I up to date / has anything changed
*only 1 phrasing, nothing exists yet*
Lets check if there is anything new
Are there any updates
Are we up to date

-

## Let someone see it / work together
*2 phrasings, both fail*
I would like to share this repository with my team
I would like to share this with martins@abill.io and anna@abillio.io

-

## Put it online
*only 1 phrasing, fails*
I would like to make this public and allow others to copy this space
lets publish this for my team


-

## Something else
*A job none of the headings above cover. These are the most valuable rows here —
they are the ones our analysis missed entirely.*

-

---

## Must NOT fire

Adjacent requests where the plugin should stay out of the way. We have three and
need roughly nine — this is the guard that stops us widening descriptions until
everything triggers on everything.

Especially wanted: sentences using our trigger words for something ordinary —
"save", "write down", "share", "publish", "copy", "sync", "where are we".

-

---

## Where the holes are

| | have | want |
|---|---|---|
| contextual — the ask buried in a real message | 5 | more; this is the class that fails |
| negative — must not fire | 3 | ~12 |
| explicit — names the skill outright | 3 | fine as is |

Six jobs have exactly one phrasing. One sentence is not a measurement.
