# The four-artefact conversation

A short, structured way to take a story apart in front of the people who
will build and test it.

## Contents

- [The four artefacts](#the-four-artefacts)
- [Running it](#running-it)
- [A worked session](#a-worked-session)
- [Reading the result](#reading-the-result)
- [Splitting on the evidence](#splitting-on-the-evidence)
- [Variations that work](#variations-that-work)
- [What to keep afterwards](#what-to-keep-afterwards)

## The four artefacts

Everything discussed lands in one of four places. Keeping them physically
separate is most of the value, because it stops a question from being
mistaken for a decision.

- **Story.** One sentence. Who wants what, and why. Sits at the top and
  does not change during the session.
- **Rule.** A business constraint governing the story, written as a
  statement in the present tense. Sits under the story.
- **Example.** A concrete case illustrating one rule, with real values and
  a definite outcome. Sits under its rule.
- **Question.** Anything the room cannot answer. Sits to one side, with the
  name of whoever can answer it.

The layout matters: rules across, examples beneath each rule, questions
parked separately. The shape of the finished board tells you things the
content alone does not, which is covered below.

## Running it

1. Write the story. If it takes more than one sentence, stop and split it
   before going further.
1. Ask what rules govern it. Capture each as a statement. Do not debate
   them yet.
1. Take one rule and ask for an example. Then ask for one where the rule
   refuses something.
1. When anyone says "it depends" or "I think", that is a question. Write
   it down and move on rather than resolving it live.
1. Move to the next rule. Stop at the timebox.

Two habits do most of the work. First, whenever an example is offered in
abstract terms, ask for the actual values. Second, whenever a rule is
stated, ask for the case where it bites; that is where disagreements live.

## A worked session

Story:

```text
A member can reserve a title that is currently on loan.
```

The first rule offered is usually the obvious one:

```text
Rule: A member may reserve a title that has no available copies

  - All 2 copies of "Kindred" are on loan; Priya reserves it: accepted
  - One copy of "Kindred" is on the shelf; Priya reserves it: refused,
    she is told to borrow it instead
```

Asking who may reserve produces a second rule and, immediately, a
question:

```text
Rule: A member with an overdue title may not reserve

  - Priya has a loan 3 days overdue; she reserves: refused
  - Priya returns the overdue title, then reserves: accepted

Question: does an unpaid fee also block reserving, or only an
  overdue title? Owner: branch manager
```

Asking what happens when the title comes back produces the rule with the
most examples, which is a signal in itself:

```text
Rule: A returned title is held for the first in the queue for 3 days

  - Returned Monday, Ana collects Wednesday: she gets it
  - Returned Monday, uncollected by Thursday: passes to Marcus
  - Returned Monday, nobody else waiting, uncollected: back to shelf
  - Returned Monday, Ana cancels Tuesday: passes to Marcus at once

Question: are the 3 days calendar days or days the branch is open?
  Owner: policy team
```

And a limit nobody mentioned in the original request:

```text
Rule: A member may hold at most 3 active reservations

  - Priya holds 2, reserves a third: accepted
  - Priya holds 3, reserves a fourth: refused
  - Priya holds 3, one is collected, reserves again: accepted
```

Twenty minutes of conversation, four rules, eleven examples, two questions
with owners. None of it is Gherkin yet, and it does not need to be.

## Reading the result

The finished layout is diagnostic. Five patterns come up repeatedly.

- **A rule with no examples.** Nobody actually understands it. Either it is
  not a rule, or it is a question wearing a statement's clothes.
- **A rule with many examples.** Usually two rules that have been fused.
  In the session above, the three-day hold rule is close to this; the
  cancellation example hints at a separate rule about cancelling.
- **Many rules for one story.** The story is too big. Split it, using the
  rules as the seams.
- **Many questions.** The story is not ready to build. That is a useful
  finding delivered before the sprint rather than during it.
- **No questions at all.** Rare and slightly suspicious. Either the story
  is genuinely simple, or the probes were not run.

## Splitting on the evidence

When a story is too big, the rules are the natural cut lines, because each
rule already carries its own examples. Splitting on rules produces stories
that are independently valuable, unlike splitting on layers or screens.

In the worked session, a sensible split is one story for placing and
limiting reservations, and a second for what happens when a title is
returned. Each keeps its rules and examples intact, and the second can be
scheduled later without stranding the first.

## Variations that work

- **Two people instead of three.** Workable if one of them deliberately
  argues the missing perspective. Say so out loud so it is not mistaken for
  a real objection.
- **Asynchronous.** One person drafts rules and examples, then two others
  add only questions and counter-examples before any discussion. This
  finds gaps well; it is weaker at resolving them.
- **Before estimation.** Running the session immediately before estimating
  changes the estimate more often than not, usually downward, because the
  unknowns turn out to be fewer or larger than assumed.
- **On a bug.** A defect report is a story with one example. Ask which
  rule it violates, then write the examples that rule needs. The result is
  a regression test and, usually, two related defects nobody had filed.

## What to keep afterwards

Keep the rules, the examples, and the questions with their owners. The
rules become `Rule` blocks or feature boundaries. The examples become
scenarios, usually one for one. The questions become the follow-up list.

Do not keep a photograph of a whiteboard as the only record. Transcribe it
into plain text next to the story; it takes two minutes and makes the
result searchable when someone asks, six months later, why the hold period
is three days.
