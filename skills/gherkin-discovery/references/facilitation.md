# Running the session

Practical guidance for holding the conversation, keeping it short, and
getting something usable out of it.

## Contents

- [Who needs to be there](#who-needs-to-be-there)
- [Before the session](#before-the-session)
- [The timebox](#the-timebox)
- [Keeping it moving](#keeping-it-moving)
- [Common stalls and what to do](#common-stalls-and-what-to-do)
- [Remote and asynchronous variants](#remote-and-asynchronous-variants)
- [When an agent runs the session](#when-an-agent-runs-the-session)
- [After the session](#after-the-session)
- [Making it stick](#making-it-stick)

## Who needs to be there

Three perspectives, not three job titles:

- Someone who can decide what the business wants and is allowed to answer
  questions rather than take them away.
- Someone who will build it and can say what is cheap, expensive, or
  already solved elsewhere.
- Someone whose instinct is to look for the case that breaks the stated
  rule.

One person may hold two perspectives if they can genuinely switch. Nobody
can hold all three, because the third only works by disagreeing with the
first two.

Four or five people is workable. Beyond that the session slows down and
quieter participants stop contributing, which defeats the point.

## Before the session

Ten minutes of preparation removes most of the friction:

- Write the story sentence in advance and send it round.
- Note any constraint already decided, so the room does not rediscover it.
- Have whoever requested the feature available, or their written answer to
  the five closing questions from the probe catalogue.

Do not prepare the rules. Arriving with a finished list turns the session
into a review, and reviews find far less than conversations.

## The timebox

Twenty-five minutes per story. Set it visibly and stop when it ends,
whatever state the board is in.

Stopping on time is a feature. An unfinished board with three good rules
and four honest questions is more useful than an hour of speculation, and
it tells everyone the story is bigger than it looked.

If a story regularly needs more than one timebox, it is too big. Split it
on the rules and run each half separately.

## Keeping it moving

Four interventions do almost all the facilitation work:

- When someone speaks in the abstract, ask for actual values. "It should
  handle overdue members properly" becomes "Priya is three days overdue and
  tries to reserve; what happens?"
- When someone says "it depends", "usually", "I think", or "presumably",
  write a question and move on. Do not resolve it live; resolving one
  question consumes the time that would have found three more.
- When a rule has only positive examples, ask for the case where it
  refuses something.
- When the talk turns to tables, services, or libraries, say so and return
  to behaviour. Design is a different session.

Write everything where everyone can see it. A conversation nobody is
recording produces agreement that evaporates by the afternoon.

## Common stalls and what to do

- **Silence after the story.** Ask the narrowest possible question with a
  concrete actor and value, rather than "what are the rules?"
- **One person answering everything.** Ask the testing perspective directly
  for a case that breaks the last rule stated.
- **An argument about one case.** It is a question. Write it down with an
  owner and move on. Arguments are the main way sessions overrun.
- **Endless examples for one rule.** Ask which of them would change how the
  system is built. Keep those, drop the rest.
- **"We will handle that in the code."** Ask what the member sees. If there
  is an observable difference, it is a rule.
- **Scope creep into a second feature.** Park it as a new story sentence,
  visibly, so the person who raised it can see it was not lost.

## Remote and asynchronous variants

Remote works well if the artefacts stay visible and separate. Any shared
document is enough; the tool matters far less than the discipline of
keeping rules, examples, and questions in distinct places.

An asynchronous variant that works:

1. One person writes the story and a first pass at the rules.
1. Two others add only examples and questions, without editing the rules.
   Adding a counter-example is encouraged; arguing in comments is not.
1. A fifteen-minute call resolves what is left.

This finds gaps well. It is weaker at resolving disagreement, because
disagreement needs a conversation, so keep the call.

## When an agent runs the session

An agent can drive discovery usefully, but only by asking rather than
answering. The failure mode is producing a confident, complete-looking set
of rules that nobody agreed to, which is worse than no rules at all,
because it looks finished.

Rules for doing it well:

- Ask one question at a time and wait. A list of twelve questions gets one
  answer.
- Propose rules as drafts to be confirmed or corrected, never as findings.
- Run the probe catalogue explicitly and say which probe is being applied,
  so the person can skip the ones that do not fit.
- Keep a running list of what is still unanswered and show it back.
- Never invent an answer to a question about business intent. An open
  question with a named owner is the correct output.
- Mark clearly which rules came from the person and which are proposals
  awaiting confirmation.

The useful contribution is coverage and structure. The person supplies
intent.

## After the session

Transcribe the board into plain text next to the story the same day. A
photograph of a whiteboard is not searchable and will not answer the
question "why is the hold period three days?" six months from now.

Then, in order:

- Send each question to its owner with a date.
- Turn the rules into feature or `Rule` boundaries.
- Turn the examples into scenarios, usually one for one.
- Re-estimate if the session changed the picture, which it often does.

Do not write scenarios for rules whose questions are still open. Write the
ones that are settled and leave a placeholder note for the rest; a scenario
built on a guess is harder to correct than an empty space.

## Making it stick

Two habits keep the practice alive past the first enthusiastic month:

- Run it on the story that seems too obvious to need it. That is where it
  most often finds a rule nobody had agreed, and where the team learns to
  trust it.
- Run it on a defect. Ask which rule was violated, write the examples that
  rule needs, and note how many related cases turn up. It is the fastest
  way to show the practice paying for itself.

Sessions stop happening when they run long, produce nothing anyone uses, or
turn into design meetings. Guarding the timebox and transcribing the output
prevents all three.
