# Test data, isolation, and determinism

Where suites become slow, flaky, and frightening to change. Almost always a
data problem wearing a different hat.

## Contents

- [The isolation contract](#the-isolation-contract)
- [Builders over fixtures](#builders-over-fixtures)
- [Uniqueness](#uniqueness)
- [Cleanup strategies](#cleanup-strategies)
- [Controlling the clock](#controlling-the-clock)
- [Randomness](#randomness)
- [Asynchronous work](#asynchronous-work)
- [Parallel execution](#parallel-execution)
- [External dependencies](#external-dependencies)
- [Diagnosing a flaky scenario](#diagnosing-a-flaky-scenario)
- [Speed](#speed)

## The isolation contract

Every scenario must be able to run alone, in any order, at the same time as
any other scenario, and produce the same result. Everything in this file
follows from that one sentence.

Three consequences worth stating explicitly:

- A scenario may not read data another scenario created.
- A scenario may not leave state that changes another scenario's outcome.
- A scenario must not depend on the wall clock, on random values it
  asserts against, or on work that finishes at an unpredictable time.

A suite that violates the contract can still pass for months. It fails
when someone adds parallelism, reruns a single scenario, or skips one.

## Builders over fixtures

A shared fixture that every scenario reads becomes untouchable: changing
one row breaks scenarios nobody can enumerate. Prefer building exactly what
one scenario needs.

```javascript
const member = await this.build.member({ tier: 'premium' })
const title = await this.build.title({ copies: 2 })
```

Good builders have three properties:

- **Complete defaults.** Every attribute not named gets a sensible value,
  so a scenario states only what its rule depends on.
- **Composable.** Building a loan builds the member and the title it needs,
  unless they were passed in.
- **Returning the object.** The scenario gets back the thing it created,
  with its generated identifier, rather than having to look it up.

Where a genuinely static reference dataset is needed, such as a currency
list or a branch calendar, load it once and treat it as read-only. The
problem is never shared data; it is shared mutable data.

## Uniqueness

Anything a scenario creates needs an identifier no other scenario will
produce. A counter is not enough once scenarios run in parallel across
processes.

```javascript
function unique (prefix) {
  return `${prefix}-${process.pid}-${Date.now()}-${counter++}`
}
```

Include something human-readable in the prefix. When a scenario fails and
leaves a record behind, `member-lending-4711` tells an investigator where
it came from; `a7f3c2` does not.

Do not make values unique when the scenario asserts on them. A scenario
checking that a duplicate title is rejected needs the same title twice, on
purpose.

## Cleanup strategies

Four approaches, in rough order of preference.

**Transaction rollback.** Wrap each scenario in a transaction and roll it
back afterwards. Fast and complete. It breaks when the application under
test manages its own transactions, when the scenario spans processes, or
when the work is committed by a background worker. For a browser suite it
usually does not apply at all.

**Create and delete.** Track what the scenario created and delete it in an
After hook. Reliable and explicit. The hook must run even when the scenario
failed, or one failure leaves debris that poisons later runs.

**Namespacing.** Give each scenario its own tenant, branch, or prefix and
never clean up. Fastest to implement and works well for read-heavy suites.
The database grows, so pair it with a periodic reset.

**Reset between runs.** Restore a known state before the suite, not before
each scenario. Cheap but gives no isolation within a run, so it only works
alongside one of the others.

Whichever is chosen, apply it uniformly. A suite where half the scenarios
clean up and half rely on a reset has the failure modes of both.

## Controlling the clock

Any rule involving expiry, ageing, working days, or scheduling needs a
clock the test can move. Reading the system clock produces a suite that
fails at midnight, on the last day of a month, and twice a year at the
daylight-saving boundaries.

Inject time as a dependency and expose it as a step:

```gherkin
Given today is Monday 2 March
And a loan became overdue on Saturday 28 February
When fees are calculated
Then 1 day of fee is charged
```

Where the application cannot be given a clock, the fallback is to create
data relative to now: instead of setting a date, create a loan that is
already three days overdue. This keeps scenarios stable, at the cost of
being unable to express rules about specific calendar days.

Never advance a real clock by sleeping. A scenario that waits three days is
not a scenario.

## Randomness

Random values are correct for uniqueness and wrong for anything asserted
on. A scenario whose expected outcome depends on a random input will fail
occasionally and be dismissed as flaky.

Where the application itself uses randomness, seed it from the test and
record the seed in the failure output, so a failure can be reproduced
exactly.

## Asynchronous work

Work that completes eventually will occasionally complete after the
assertion. Three ways out, best first:

- **Run it synchronously in tests.** Configure the worker to execute
  inline. Fastest and completely deterministic.
- **Wait for the effect, with a timeout.** Poll for the observable
  consequence, not for a fixed duration. Own this in the driver layer so it
  is expressed once.
- **Trigger it explicitly.** Add a step that runs the pending work, which
  also makes the scenario honest about the fact that a job is involved.

Never sleep for a fixed period. It is slow when the work is fast and flaky
when the work is slow, which is the worst of both.

## Parallel execution

Parallelism is the test of whether isolation is real. Before enabling it:

- Remove every module-level mutable variable in the glue.
- Make created identifiers unique across processes, not just within one.
- Give each worker its own browser, connection pool, and temporary
  directory.
- Check for shared singletons in the application, such as a cache or a
  file lock, that two workers will contend on.
- Make ports and other fixed resources per-worker.

Enable it on a branch first and run the suite ten times. Coupling shows up
as failures that move around rather than failures that repeat.

Randomising scenario order, even without parallelism, finds most of the
same problems and is cheaper to adopt.

## External dependencies

A suite that calls a third-party service inherits its availability, its
rate limits, and its data. For scenarios about the rules of your own
system, replace it: a stub the driver layer owns, configured per scenario.

Keep a small, separately tagged set of scenarios that do call the real
thing, so a contract change is noticed. Run them on a schedule rather than
on every commit, and accept that they are a different kind of test with a
different tolerance for failure.

Where the dependency has a sandbox, prefer it to a hand-written stub for
the contract set, and prefer the stub for everything else.

## Diagnosing a flaky scenario

Work in this order; it converges much faster than guessing.

1. Run the single scenario twenty times alone. If it fails, the problem is
   inside the scenario: timing, randomness, or a real defect.
1. Run it after each of the scenarios that touch the same data. If it fails
   after a specific one, that scenario is leaking state.
1. Run the suite in random order several times. Failures that move around
   mean shared state; failures that stay put mean an ordering assumption.
1. Run it in parallel with itself. Failures here mean non-unique
   identifiers or a shared resource.
1. Check for a wall-clock dependency by running it with the clock set near
   midnight and near a month boundary.

Quarantine a flaky scenario rather than adding a retry. A retry hides the
defect and the suite slowly stops meaning anything; a quarantined scenario
with an owner and a date gets fixed.

## Speed

Most slow suites are slow for one reason: everything is driven through the
interface. The remedy is not faster hardware.

- Drive setup through the fastest path available. Creating a member with an
  overdue loan should be an API call or a direct insert, never a sequence
  of clicks. Only the behaviour under test needs the real interface.
- Reuse expensive resources across scenarios where they are read-only, such
  as a started application or a warmed cache. Never reuse anything a
  scenario mutates.
- Move cases down the pyramid. Twenty outline rows exercising a validation
  rule belong in unit tests, and the scenario keeps the one row that
  matters to the conversation.
- Measure before optimising. Most suites have a handful of scenarios
  responsible for most of the runtime, and they are rarely the ones anyone
  suspects.

A useful target: the whole suite runs in the time someone will wait
without switching tasks. Past that, people stop running it locally, and a
suite nobody runs locally stops being maintained.
