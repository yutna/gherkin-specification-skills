---
name: gherkin-discovery
description: Turn a vague story, ticket, or requirement into agreed concrete examples before any scenario is written. Use when acceptance criteria are missing or ambiguous, when a feature request is too abstract to build, when the team disagrees about scope, when nobody can say what "done" means, or when asked to find edge cases and open questions for a piece of work. Produces a set of business rules with worked examples and unanswered questions, ready to be phrased as Gherkin.
argument-hint: "[ticket, story, or requirement]"
license: MIT
metadata:
  version: "2.1.1"
  author: yutna
---

# Discovering examples

## Overview

Most bad specifications are not badly written. They are written too early,
before anyone knew what the rules were. Discovery is the work of turning a
request into a small set of rules, each illustrated by concrete examples,
with the disagreements surfaced rather than buried.

The output is not Gherkin. It is a list of rules, examples, and open
questions. Phrasing comes afterwards, and is much easier once the content
is settled.

## When to use this skill

- A story or ticket says what someone wants but not what the system should
  do in each case.
- Acceptance criteria exist but are abstract, such as "handles invalid
  input gracefully".
- Two people describe the same feature differently.
- Someone asks what the edge cases are.
- An estimate is being requested for work nobody can describe precisely.

If the examples are already agreed and the task is phrasing them, go
straight to `gherkin-scenario-writing`.

## The core loop

Work through four artefacts, in this order, and keep them visible:

1. **The story.** One sentence naming who wants what, and why. If it
   cannot be stated in one sentence, it is more than one story.
1. **Rules.** The business constraints that govern it. Each is a complete
   statement someone could agree or disagree with.
1. **Examples.** For each rule, concrete cases that illustrate it,
   including at least one where the rule bites.
1. **Questions.** Anything nobody in the room can answer. These are the
   most valuable output; they are the risk made visible.

The loop is finished when every rule has at least one example, and the
remaining questions are ones only someone outside the room can answer.

## Working from a story to rules

Start from what the request implies but does not say. For a request like
"members should be able to reserve titles that are on loan", the rules are
hiding in the words nobody defined:

- Who may reserve? Every member, or only some tiers?
- How many reservations may one member hold?
- What happens when the title comes back?
- How long is it held for them?
- What if they already have one on loan?
- Can a reservation be cancelled, and by whom?

Each answer is a candidate rule. Write it as a statement, not a question:

- A member may hold at most three active reservations.
- A returned title is held for the first person waiting for three days.
- A member with an overdue title may not reserve.

Rules that nobody can state are not rules yet. They are questions, and they
belong in the fourth list.

## Writing examples that earn their place

An example is a specific case with specific values and a specific outcome.
Its job is to make a rule unambiguous, so it must be concrete enough that
two people cannot read it differently.

For the rule "a returned title is held for three days":

- Ana is first in the queue. The title is returned on Monday. She collects
  it on Wednesday. She gets it.
- Ana is first in the queue. The title is returned on Monday. She has not
  collected it by Thursday. It passes to the next person.
- Ana is the only person waiting. She does not collect it. It returns to
  general availability.

The third example is the one that usually surfaces a disagreement, and that
is exactly why it is worth writing.

Aim for the smallest set that pins the rule down. Two examples that differ
only by an arbitrary number teach nothing; one at each side of a boundary
teaches everything.

## Finding the cases people miss

Run the request through a fixed set of probes rather than relying on
inspiration. The full catalogue is in `references/edge-case-heuristics.md`;
the ones that pay off most often are:

- **Boundaries.** For every limit, ask about one below, exactly at, and one
  above.
- **Emptiness.** Zero results, an empty list, a first-time user, a brand
  new account.
- **Multiplicity.** Two at once, the maximum, one more than the maximum.
- **Already done.** The request arrives twice. The action was already
  performed. The state is already what is being asked for.
- **Permission.** Someone who may not do this tries to.
- **Time.** Across midnight, across a time zone, on a closed day, during a
  daylight-saving shift, after an expiry.
- **Failure.** The dependency is down, slow, or returns something
  unexpected. What does the actor see, and what state is left behind?
- **Concurrency.** Two actors act on the same thing at the same moment.

Not every probe applies. Running them all takes minutes and reliably finds
the rule nobody had considered.

## The conversation

Discovery works best as a short structured conversation among three
perspectives: the person who wants the behaviour, the person who will build
it, and the person who will try to break it. One human may hold more than
one perspective, but all three must be represented or the same gaps recur.

Each perspective contributes something the others miss:

- The business perspective knows why the rule exists and which exceptions
  matter commercially.
- The building perspective knows which cases are cheap, which are
  expensive, and which are already handled elsewhere.
- The testing perspective supplies the cases that break the stated rule.

Timebox it. Twenty-five minutes per story is enough; past that, the session
has turned into design and should be split off. Facilitation detail,
including how to run this remotely and what to do when it stalls, is in
`references/facilitation.md`.

## Knowing when to stop

Stop when any of these is true:

- Every rule has an example, and no new example changes anyone's mind.
- The remaining questions need a decision from someone not present.
- The conversation has moved from what the system does to how it will be
  built.
- The timebox is up.

Discovery is not finished when every case is known. It is finished when the
unknowns are written down and owned.

## The hand-off

Produce a short artefact the scenario writer can work from directly:

```text
Story
  A member can reserve a title that is currently on loan.

Rule: A member may hold at most 3 active reservations
  - Priya has 2 reservations, reserves a third: accepted
  - Priya has 3 reservations, reserves a fourth: refused
  - Priya has 3, one is collected, reserves again: accepted

Rule: A returned title is held for the first in queue for 3 days
  - Returned Monday, Ana collects Wednesday: she gets it
  - Returned Monday, uncollected by Thursday: passes to next
  - Returned Monday, nobody else waiting, uncollected: back to shelf

Questions
  - Does an overdue title block reserving? Owner: branch manager
  - Are the 3 days working days or calendar days? Owner: policy team
```

Plain text is enough. Turning this into a `.feature` file is a separate,
mechanical step, and doing it too early hides the questions inside
syntax.

## Quick reference

- One sentence for the story. Longer means split it.
- Rules are statements, not questions. Questions go in their own list.
- Every rule needs an example where it bites, not only one where it does
  not.
- Run the probes; do not wait for inspiration.
- Three perspectives, or the same gaps come back.
- Unanswered questions are output, not failure.
- Stop at the timebox.

## Common mistakes

- Jumping to Given/When/Then. Syntax turns an open conversation into an
  editing task and the disagreements go quiet.
- Writing only happy paths. The rules are in the refusals.
- Accepting an abstract rule such as "handle errors gracefully" without an
  example. It means nothing until someone says what the member sees.
- Turning the session into design. As soon as the talk is about tables and
  services, discovery has ended.
- Recording decisions and dropping the questions. The questions are the
  part that prevents rework.
- Producing forty examples. Volume is not coverage; each example should
  make a rule sharper than it was.
- One person writing the examples alone, then circulating them for
  approval. Approval is not agreement, and the gaps survive.

## Reference files

- `references/example-mapping.md` — the four-artefact conversation format
  in detail, with a worked session and how to read the result.
- `references/edge-case-heuristics.md` — the full probe catalogue, grouped
  by the kind of system under discussion.
- `references/facilitation.md` — running the session, remote variants,
  common stalls, and what to do with the output.
