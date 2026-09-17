# Probes for finding missing cases

A checklist beats inspiration. Run the probes that apply, in order, and the
rule nobody considered usually surfaces within a few minutes.

## Contents

- [How to use these](#how-to-use-these)
- [Quantity and boundaries](#quantity-and-boundaries)
- [Absence and emptiness](#absence-and-emptiness)
- [Identity and permission](#identity-and-permission)
- [Repetition and idempotence](#repetition-and-idempotence)
- [Time](#time)
- [Money and rounding](#money-and-rounding)
- [Text and input](#text-and-input)
- [Failure and partial failure](#failure-and-partial-failure)
- [Concurrency and ordering](#concurrency-and-ordering)
- [State transitions](#state-transitions)
- [Probes for HTTP APIs](#probes-for-http-apis)
- [Probes for batch jobs](#probes-for-batch-jobs)
- [Probes for event consumers](#probes-for-event-consumers)
- [Questions that end the session early](#questions-that-end-the-session-early)

## How to use these

Take one rule at a time and read down the list, skipping what obviously
does not apply. For each probe that does apply, ask for a concrete case
with real values. If the room cannot produce one, that is a question, not a
gap in the list.

Two or three probes usually produce everything worth having. The value is
in asking systematically rather than in exhausting the catalogue.

## Quantity and boundaries

For every limit, threshold, or count in the rule:

- One below the limit, exactly at it, one above.
- Zero, and one.
- The maximum the system permits, and one beyond it.
- A negative quantity, where the type allows one.
- What happens when the limit changes while something is in flight.

The boundary cases are the ones most often specified loosely. "Up to five"
and "fewer than five" differ by one case, and teams disagree on which was
meant more often than anyone expects.

## Absence and emptiness

- No results at all.
- An empty collection where the rule assumes several.
- A brand-new account with no history.
- An optional field left blank.
- A dependency that has never been configured.
- The last item being removed, leaving the container empty.

Empty states are the most commonly shipped-broken part of any feature,
because they never appear in a demo.

## Identity and permission

- Someone acting on their own record versus someone else's.
- A role that may read but not change.
- A role that may act only within one branch, team, or tenant.
- An account that is suspended, expired, or pending.
- An actor who was permitted when the request started and is not when it
  completes.
- The system acting on its own behalf, with no human actor.

Ask explicitly what a forbidden actor sees: a refusal, or a pretence that
the thing does not exist. That is a real decision and it is rarely made
deliberately.

## Repetition and idempotence

- The same request arrives twice.
- The action was already performed, by someone else.
- The state being requested is already the current state.
- An undo of something that was never done.
- A retry after a timeout where the first attempt actually succeeded.

For anything with a network between the actor and the effect, this group is
mandatory, not optional.

## Time

- Across midnight.
- Across a month or year boundary.
- On a day the business is closed.
- Across a daylight-saving transition, in both directions.
- Two actors in different time zones seeing the same deadline.
- Exactly at an expiry moment, one second before, one second after.
- A duration expressed in calendar days versus working days.
- A clock that is wrong, or an event timestamped in the future.

The calendar-versus-working-days question is worth asking about every
duration in every rule. It changes behaviour and is almost never written
down.

## Money and rounding

- An amount that does not divide evenly, such as splitting 100 three ways.
- Rounding at the half, and which direction.
- A currency with no minor unit, or with three decimal places.
- A discount that exceeds the total.
- A refund larger than the original payment.
- A total that reaches exactly zero.
- Whether tax applies before or after a discount.

State the rounding rule explicitly in an example with real numbers. Two
people saying "round normally" often mean different things.

## Text and input

- The longest value the field accepts, and one longer.
- Leading and trailing whitespace.
- Names with accents, non-Latin scripts, or right-to-left text.
- A value that looks like a delimiter, such as a comma in a name.
- Case differences in something used for matching.
- Text that is only whitespace.

These matter most where the value is used for identity or search, and
barely at all where it is only displayed.

## Failure and partial failure

- The dependency is unavailable.
- The dependency is slow enough to time out.
- The dependency returns success but with unusable content.
- The action succeeds, then a later part of the same operation fails.
- The actor abandons the operation halfway.

For each, ask two questions: what does the actor see, and what state is
left behind. The second is the one that gets skipped, and it is where the
data corruption lives.

## Concurrency and ordering

- Two actors act on the same record at the same moment.
- The last available item is claimed twice.
- An update arrives based on a version that has since changed.
- Events arrive out of the order they were produced.
- A long-running job overlaps with the next scheduled run.

If the answer is "that cannot happen", ask what the system does if it does
happen anyway. That is usually a real rule.

## State transitions

Draw the states the thing can be in, then ask about every transition,
including the ones that should be impossible:

- Cancelling something already completed.
- Completing something already cancelled.
- Reopening something closed.
- A transition triggered twice in quick succession.
- A state that can be reached but never left.

Listing the impossible transitions explicitly is worthwhile, because the
specification then says what happens instead of leaving it to whichever
guard clause is written first.

## Probes for HTTP APIs

- A field the consumer sends that the contract does not define.
- A required field omitted.
- A field of the right name but the wrong type.
- A body that is not valid at all.
- A payload far larger than expected.
- The same idempotency key reused with a different body.
- Pagination past the last page, and with a page size of zero.
- An expired or malformed credential versus a valid one lacking rights.

The last distinction is worth an example each, because the responses should
differ and frequently do not.

## Probes for batch jobs

- An empty input file.
- A single unreadable row among many good ones. Does the run continue?
- Every row bad.
- Duplicate rows within one file.
- The same file submitted twice.
- The run overlapping with the previous run.
- The run interrupted halfway, then restarted.
- Output when nothing changed.

The continue-or-abandon question is the one that must be answered
explicitly. It is a business decision, not a technical one.

## Probes for event consumers

- The same event delivered twice.
- Events arriving out of order.
- An event referring to something the consumer has never seen.
- An event whose schema has a field the consumer does not know.
- A backlog of events arriving at once after an outage.
- An event that cannot be processed at all: where does it go, and who
  notices?

Duplicate delivery and out-of-order arrival should be assumed rather than
argued about; the useful question is what the rule says when they happen.

## Questions that end the session early

Some answers make the rest of the discussion pointless, so ask them first:

- Who is allowed to do this at all?
- What should happen when it fails halfway?
- Is this reversible, and by whom?
- Does anything outside this system need to be told?
- What does the person see when it is refused?

A story where these five are unanswered is not ready to build, however many
examples the rest of the session produces.
