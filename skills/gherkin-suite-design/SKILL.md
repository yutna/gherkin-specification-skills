---
name: gherkin-suite-design
description: Shape a whole body of feature files rather than one scenario. Use when setting up a BDD suite from scratch, deciding how to organise or split feature files, designing a tagging strategy, publishing scenarios as living documentation, deciding what runs in continuous integration and when, or introducing BDD into a codebase that already has tests. Concerns the shape of the whole suite, not the code behind any one step. Covers folder layout, feature granularity, tag taxonomy, suite health metrics, migration, and failure triage.
license: MIT
metadata:
  version: "1.0.0"
  author: yutna
---

# Designing a specification suite

## Overview

Individual scenarios can all be good while the suite is unusable. Suites
fail at the level above the scenario: files organised by screen, tags that
mean four things, a run nobody waits for, and documentation nobody reads
because it was never published anywhere.

This skill is about that level.

## When to use this skill

- Starting a suite in a new or existing codebase.
- Deciding how to divide behaviour across feature files.
- Designing or repairing a tagging scheme.
- Publishing scenarios so people outside the delivery team see them.
- Wiring the suite into continuous integration and deciding what runs
  when.
- The whole run has become too slow or too distrusted to be useful.

For phrasing one scenario, use the scenario-writing skill. For critiquing
existing files, use the review skill. For the code behind the steps, use
the automation skill.

## Organise by capability

The organising unit is a capability the business would name, not a screen,
a controller, or a sprint.

```text
features/
  lending/
    borrowing-limits.feature
    late-fees.feature
    renewals.feature
  reservations/
    placing-a-reservation.feature
    collecting-a-reservation.feature
  membership/
    registration.feature
    tiers.feature
```

Screens get merged and redesigned; capabilities persist. A folder named
`member-page` will be wrong within a year, and nobody will know which of
its scenarios to move.

Two practical rules. Name files after the capability, in the words the
business uses, so someone can find the specification for a rule without
grep. And keep the directory shallow: two levels is almost always enough,
and a third usually means capabilities have been split by mechanism.

Guidance on where exactly to draw the boundaries, and how to split a file
that has grown, is in `references/suite-layout.md`.

## Feature file size

A feature file should hold one capability and be readable in one sitting.
Practical bounds: roughly five to fifteen scenarios, and a `Background`
short enough to hold in your head.

Signals a file is too big:

- The `Background` has grown to serve unrelated scenarios.
- The name needs a conjunction.
- Two people editing different rules keep colliding in it.
- Nobody reads past the first screen.

Signals a file is too small: a feature with one scenario is usually a rule
that belongs inside a neighbouring file. Use `Rule` blocks to group inside
a file before reaching for a new file.

## Tags

Tags select scenarios. Everything else they get used for is a mistake.

A workable taxonomy has four kinds and no more:

- **Capability** tags mirroring the folder structure, such as `@lending`.
  Useful for running everything about one area.
- **Depth** tags saying how much of the suite a run should cover, such as
  `@smoke`. One or two values, not five.
- **Cost** tags marking scenarios that are slow or need scarce resources,
  such as `@slow` or `@external`.
- **Lifecycle** tags marking a temporary state, such as `@wip` or a
  defect reference on a quarantined scenario. Every one of these needs an
  owner and an expiry.

What does not belong in a tag: browsers, environments, retry counts,
parallelism settings, team names, and sprint numbers. Those change for
reasons unrelated to behaviour, and putting them in the specification
means editing the specification to change the schedule.

Keep the vocabulary small enough to list on one line. Tag inheritance runs
downward and cannot be cancelled, so tag sparingly at feature level.
Detailed taxonomy design and how to clean up an overgrown scheme are in
`references/tagging.md`.

## Living documentation

Scenarios written in business language and never shown to the business are
an expensive way to write tests. Publishing is what converts the cost into
a benefit.

The minimum that works:

- Generate a browsable report from each main-branch run.
- Publish it at a stable address, not as a build artefact people have to
  download.
- Include the scenarios that were not run, and why, so the reader knows
  what the report does not cover.
- Show the date and the commit, so a reader can tell whether it is
  current.

Two additions repay themselves quickly. Link each feature to whatever the
business uses to track work, so a rule can be traced to the decision that
created it. And publish the open questions from discovery alongside the
scenarios, so the specification shows what is undecided as well as what is
agreed.

More on generation, hosting, and keeping it read in
`references/living-documentation.md`.

## What the suite is for

A specification suite is not the whole test strategy, and treating it as
one is the most common way to end up with a suite that takes an hour.

Put in the suite the rules a non-engineer cares about, the cases where the
wording settled a disagreement, and enough end-to-end paths to prove the
parts connect. Everything else, including permutations of validation
rules, algorithmic edge cases, and error handling with no business
consequence, belongs in faster tests.

A rough shape that holds up: tens of scenarios per capability at most,
supported by hundreds of unit tests. A suite with a thousand scenarios and
few unit tests is a suite that will be deleted.

## Continuous integration

Decide what runs when, and make the fast path genuinely fast.

- On every push: the full suite if it fits inside the time people will
  wait; otherwise the depth-tagged subset.
- On the main branch: everything, including scenarios tagged as slow or
  needing external systems.
- On a schedule: the external-dependency set, and a randomised-order run
  to surface coupling.

Run scenarios in a randomised order wherever possible. It is the cheapest
way to find order dependence, and order dependence is what stops a suite
from ever being parallelised.

Publish the report on every run, including failures. A failing run whose
report is only reachable by reading raw logs will be ignored rather than
investigated.

## Suite health

Four numbers worth watching, because each maps to a decision:

- **Wall-clock time** for the run people wait for. When it passes the
  threshold where people stop running it locally, the suite is on its way
  to being ignored.
- **Flaky rate**, counted as scenarios that changed result without a code
  change. Anything above a very small number destroys trust in every
  failure.
- **Pending or skipped count.** Should be zero on the main branch. A
  scenario that neither passes nor fails is documentation claiming to be
  verified.
- **Rules without a refusal scenario.** Harder to measure and the most
  valuable, because a suite of successes demonstrates no rules at all.

Watch the trend, not the absolute value. A suite getting slower every
sprint has a problem regardless of where it started.

## Migrating an existing codebase

Introducing this into a codebase that already has tests, without a rewrite:

1. Pick one capability with a rule people actually argue about. Do not
   start with the easiest area; start where the conversation has value.
1. Run discovery on it and write the scenarios from that.
1. Build the task and driver layers for that capability only. Resist
   building a framework first.
1. Leave the existing tests alone. Delete one only when a scenario plus
   unit tests genuinely replace it.
1. Show the published documentation to someone outside the delivery team
   and see whether they can read it. That result decides whether to
   continue.
1. Add the second capability. Extract shared infrastructure at that point,
   when there is real evidence of what is shared.

Inherited feature files that nobody trusts are a separate problem. Triage
them with the review skill rather than attempting to fix them all, and
treat deleting a scenario nobody believes as progress.

## Quick reference

- Organise by capability, never by screen.
- Five to fifteen scenarios per file, shallow directories.
- Four kinds of tag, no operational configuration among them.
- Publish the report at a stable address, with dates and what was skipped.
- Most rules belong in unit tests; scenarios carry the ones people
  discuss.
- Randomise order in CI.
- Zero pending scenarios on the main branch.
- Start migration with one contentious capability, not a framework.

## Common mistakes

- Folders named after screens or teams.
- One enormous feature file per area, with a `Background` nobody reads.
- Tags encoding browsers, environments, or retry policy.
- Generating documentation into a build artefact nobody opens.
- Treating the suite as the whole test strategy, then wondering why it
  takes an hour.
- Adding retries to keep the build green, which converts visible
  flakiness into invisible unreliability.
- Building the framework first, before a single scenario has proved
  useful.
- Keeping scenarios nobody trusts because deleting them feels like losing
  coverage.

## Reference files

- `references/suite-layout.md` — capability boundaries, directory shape,
  splitting a file that has grown, and naming conventions.
- `references/tagging.md` — the taxonomy in detail, tag expressions, and
  repairing an overgrown scheme.
- `references/living-documentation.md` — generating, publishing, and
  keeping the output read.
