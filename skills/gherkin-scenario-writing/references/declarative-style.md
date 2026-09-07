# Declarative phrasing

The rewrite that decides whether a suite survives its first redesign.

## Contents

- [The two altitudes](#the-two-altitudes)
- [Why imperative scenarios rot](#why-imperative-scenarios-rot)
- [The rewrite, step by step](#the-rewrite-step-by-step)
- [How far to go](#how-far-to-go)
- [Web interfaces](#web-interfaces)
- [HTTP APIs](#http-apis)
- [Scheduled batch jobs](#scheduled-batch-jobs)
- [Event-driven consumers](#event-driven-consumers)
- [When mechanics are the behaviour](#when-mechanics-are-the-behaviour)
- [Signals you are too low](#signals-you-are-too-low)

## The two altitudes

Imperative writing describes the operations a user performs. Declarative
writing describes what the user is trying to achieve and what the system
promises in return. Both can drive the same automation. Only one of them
still makes sense after the interface is redesigned.

Imperative:

```gherkin
Scenario: Borrow a title
  Given I open the borrowing page
  When I type "Kindred" into the search box
  And I click the first result
  And I click "Borrow"
  And I click "Confirm" in the dialog
  Then I see a green banner saying "Success"
```

Declarative:

```gherkin
Scenario: Borrowing an available title records the loan
  Given "Kindred" is available at Priya's branch
  When she borrows it
  Then the loan is recorded against her account
  And the copy is no longer available to others
```

The second version says what the library actually promised. The first says
which pixels were involved.

## Why imperative scenarios rot

Three failures, all of them expensive:

- The wording breaks when the interface changes, even though the rule did
  not. Renaming a button should never edit a specification.
- The reader cannot check the rule. A green banner is not evidence that a
  loan was recorded; it is evidence that a banner appeared.
- Steps stop being reusable. `When I click "Confirm" in the dialog` matches
  one dialog in one flow, so every new flow grows its own near-duplicate.

There is a fourth, subtler cost. Imperative scenarios push the interesting
decisions out of the conversation. Nobody argues about which button to
click, so nobody notices the rule was never agreed.

## The rewrite, step by step

Work through an imperative scenario in this order:

1. Find the one thing the actor wanted. That becomes the single `When`.
1. Everything before it becomes `Given` steps phrased as state. Collapse
   several actions into the state they produced.
1. Everything after it becomes `Then` steps phrased as consequences the
   business cares about, not as screen artefacts.
1. Delete any step that survives only to make the automation work.
   Navigation, waiting, and cleanup belong in the step definitions.
1. Reread the result and ask whether the person who requested the feature
   could dispute it. If not, it is still describing the test.

Applied to the example above, steps two through five collapse into
`When she borrows it`, and the banner assertion becomes two statements
about loans and availability.

## How far to go

Declarative does not mean vague. A scenario that says only
`Then it works` has climbed past the useful altitude and asserts nothing.

The target is the highest altitude at which the statement is still
falsifiable by someone who knows the domain. `Then the loan is recorded
against her account` passes: a librarian could look and disagree.
`Then the system behaves correctly` fails.

Keep concrete anything the rule depends on. Quantities, names, states, and
outcomes are domain facts and belong in the wording. Mechanisms are not.

## Web interfaces

The most common source of imperative drift, because the mechanics are so
visible.

Move into step definitions: navigation, authentication, form filling,
waiting, selectors, element text, and modal handling.

Keep in the scenario: who the actor is, what state their account is in,
what they are trying to do, and what the business outcome was.

```gherkin
Scenario: Reserving a title that is on loan joins the queue
  Given every copy of "Kindred" is on loan
  And Priya has no active reservations
  When she reserves it
  Then she is first in the queue
  And she is told roughly when it will be ready
```

"Roughly when" is deliberately loose. The exact wording of the estimate is
presentation; that a member is told is the promise.

## HTTP APIs

An API scenario has a genuine temptation to describe the transport,
because for an API the transport is part of the contract. The rule is that
the contract is fair game and the plumbing is not.

```gherkin
Scenario: Creating a loan for an unknown member is rejected
  Given no member exists with card number "L-99401"
  When a loan is requested for card "L-99401"
  Then the request is rejected as unknown member
  And no loan is created
```

If the consumer was promised a specific status code and error shape,
assert it, because breaking it breaks them:

```gherkin
Scenario: Unknown member returns a 404 with a typed error
  Given no member exists with card number "L-99401"
  When a loan is requested for card "L-99401"
  Then the response status is 404
  And the error code is "member_not_found"
```

Both versions are legitimate. The first suits a team where the API is an
internal detail; the second suits a published contract. What is never
legitimate is a scenario that names the header list, the serialisation
library, or the retry policy.

## Scheduled batch jobs

Batch work has no actor clicking anything, which makes the declarative
shape easier, not harder. The `When` is the run; the `Given` is the state
of the data going in; the `Then` is what changed and what was reported.

```gherkin
Scenario: Overnight renewal skips loans with a waiting reservation
  Given 3 loans are due today
  And one of those titles has a member waiting
  When the overnight renewal runs
  Then 2 loans are extended
  And the loan with a waiting reservation is left to expire
```

Resist naming the schedule, the job class, the batch size, or the file
format. If the rule is "runs at 02:00", that is a scenario of its own about
scheduling, not a clause in this one.

Batch scenarios also need an explicit statement about what happens to the
rest of the batch when one item fails, because that is the rule everybody
forgets to agree on:

```gherkin
Scenario: One unreadable row does not abandon the import
  Given an import file of 50 rows
  And row 12 has an unknown branch code
  When the import runs
  Then 49 rows are imported
  And row 12 is reported as rejected with its reason
```

## Event-driven consumers

The `When` is the arrival of one event. The `Given` is what the consumer
already believes. The `Then` is the new state or the event emitted in
response.

```gherkin
Scenario: A return event releases the next reservation
  Given "Kindred" is on loan
  And Ana is first in its reservation queue
  When a return is recorded for that copy
  Then Ana's reservation becomes collectable
  And she is notified once
```

"Once" is doing real work there. Duplicate delivery is the rule that
distinguishes an event-driven system, so make it explicit rather than
assumed:

```gherkin
Scenario: A repeated return event changes nothing further
  Given a return has already been recorded for "Kindred"
  When the same return event arrives again
  Then Ana is not notified a second time
  And the copy remains available
```

Keep the topic name, the broker, the serialisation format, and the offset
handling out of the wording. They are how the event arrived, not what it
meant.

## When mechanics are the behaviour

Some rules genuinely are about mechanism, and hiding it would make the
scenario meaningless. In those cases the low-level detail is the subject,
not a leak.

Legitimate cases include a published API contract, a file format a partner
depends on, an accessibility requirement about focus order, a security rule
about what a specific role can reach, and a compliance rule that names a
retention period or an audit record.

The test is simple: would the person who asked for this feature recognise
the detail as part of what they asked for? If yes, keep it. If it only
appears because that is how the software happens to be built, move it down.

## Signals you are too low

Any of these in scenario wording means the altitude has slipped:

- A CSS selector, element id, or `data-testid`.
- A button, tab, menu, or field label, unless the label itself is the rule.
- A URL path, unless the API contract is the subject.
- A database table, column, or query.
- A class, method, or function name.
- A wait, sleep, timeout, or retry count.
- A sequence of three or more `And` steps between `When` and `Then`,
  which usually means several actions were pasted in as one.
- The words "click", "type", "navigate", "press", or "select" in a scenario
  that is not about the interface itself.
