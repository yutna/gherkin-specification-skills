# Tagging

A small taxonomy, applied consistently, and how to repair one that has
grown without a plan.

## Contents

- [What tags are for](#what-tags-are-for)
- [The four kinds](#the-four-kinds)
- [Capability tags](#capability-tags)
- [Depth tags](#depth-tags)
- [Cost tags](#cost-tags)
- [Lifecycle tags](#lifecycle-tags)
- [What must not be a tag](#what-must-not-be-a-tag)
- [Inheritance](#inheritance)
- [Tag expressions](#tag-expressions)
- [Naming conventions](#naming-conventions)
- [Repairing an overgrown scheme](#repairing-an-overgrown-scheme)
- [Keeping it small](#keeping-it-small)

## What tags are for

Selecting which scenarios to run. That is the whole purpose, and every
problem with tagging comes from using them for something else: recording
metadata, encoding configuration, or tracking work.

A useful check before adding a tag: would anyone ever run exactly the set
of scenarios this tag selects? If not, it is metadata, and metadata
belongs somewhere it can be queried, not in the specification.

## The four kinds

- **Capability** — what area this is about.
- **Depth** — how much of the suite a given run should cover.
- **Cost** — this scenario is expensive or needs something scarce.
- **Lifecycle** — this scenario is temporarily in an unusual state.

Four kinds is enough for a large suite. A fifth kind is nearly always
metadata that has escaped.

## Capability tags

Mirror the directory structure, one tag per top-level area, applied at
feature level:

```gherkin
@lending
Feature: Borrowing limits
```

These let someone run everything about one area while working on it, which
is the single most common selection anyone makes.

Do not tag more finely than the folder structure. A `@late-fees` tag on
top of `@lending` duplicates the file name, and the file name is already
selectable by path.

## Depth tags

One tag, marking the scenarios that must run on every push:

```gherkin
@smoke
Scenario: Borrowing an available title records the loan
```

Everything untagged is the full run. Two values at most; a scheme with
smoke, sanity, regression, and full requires everyone to remember the
ordering, and nobody does.

Choose the smoke set deliberately: the handful of scenarios that prove the
system is fundamentally working. If it is more than five per capability, it
is not a smoke set.

## Cost tags

Mark scenarios that are slow or need something not always available:

```gherkin
@slow
Scenario: Overnight renewal across every branch

@external
Scenario: Payment is captured by the provider
```

These exist so the fast path can exclude them, and so a scheduled run can
include them. Keep the count of distinct cost tags at two or three.

`@external` deserves a rule of its own: those scenarios test somebody
else's system as well as yours, so they fail for reasons unrelated to your
code. Run them on a schedule, and treat a failure as a signal to
investigate rather than as a broken build.

## Lifecycle tags

Temporary states, each with an owner and an expiry:

```gherkin
@wip
Scenario: Reservation transfers to another branch

@quarantined
Scenario: Bulk import handles a partial file
```

Two rules keep these from becoming permanent. Every lifecycle tag needs a
name and a date recorded somewhere, and the count must be visible on the
suite's health report. A quarantine tag with no owner is how a scenario
stops running for two years without anyone noticing.

`@wip` scenarios must be excluded from the default run and included in a
run whose exit status inverts, so that a work-in-progress scenario that
starts passing is reported. Otherwise finished work sits tagged as
unfinished indefinitely.

## What must not be a tag

Each of these changes for reasons unrelated to behaviour, so putting it in
the specification means editing the specification to change the schedule:

- Browsers, devices, and screen sizes.
- Environments: staging, production, local.
- Retry counts, timeouts, and parallelism settings.
- Team names, squad names, and component owners.
- Sprint or release numbers.
- Author names.
- Test-management identifiers.
- Priority levels, unless they genuinely drive a selection somebody makes.

All of these belong in the runner configuration, in a profile, or in
whatever tracks the work. A defect reference on a quarantined scenario is
the one reasonable exception, because it is temporary and it explains why
the scenario is not running.

## Inheritance

Tags apply downward: a feature tag reaches every scenario in the file, and
a rule tag reaches the scenarios under it. `Examples` tables may be tagged
individually, which is the clean way to mark a subset of outline rows.

There is no way to remove an inherited tag. That single fact is the reason
to tag sparingly at feature level: tagging a feature `@slow` because three
of its scenarios are slow makes the other twelve unrunnable in the fast
path, and there is no escape hatch.

```gherkin
@lending
Feature: Borrowing limits

  @smoke
  Scenario: Borrowing within the limit records the loan

  @slow
  Scenario Outline: Limits across every tier and branch

    Examples: Common tiers
      | tier     |
      | standard |

    @external
    Examples: Partner branches
      | tier    |
      | partner |
```

## Tag expressions

Selection uses boolean expressions, which are consistent across runners:

```text
@smoke
not @slow
@lending and not @external
@smoke or @lending
(@lending or @reservations) and not @wip
```

Put these in named profiles or configuration rather than in the commands
people type. A CI job whose selection is an inline expression will drift
from the one people run locally.

A useful default set:

- Push: `not @slow and not @external and not @wip`
- Main: `not @wip`
- Scheduled: `@external`

## Naming conventions

- Lower case, hyphenated: `@late-fees`, not `@LateFees`.
- Singular nouns for capability, adjectives for cost and lifecycle.
- No punctuation beyond the hyphen; some runners treat other characters as
  expression syntax.
- Never encode two things in one tag, such as `@slow-lending`. Two tags,
  so each can be selected independently.

Write the whole vocabulary down in the contributing guide. A tag scheme
that is not documented becomes a tag scheme that is not followed.

## Repairing an overgrown scheme

A suite with forty tags is normal after a few years. Repair it in this
order:

1. **Count them.** List every tag with the number of scenarios carrying
   it. The distribution alone shows the problem: tags on one scenario are
   almost always metadata.
1. **Delete the unused.** Any tag no configuration or job selects on is
   doing nothing. Remove it.
1. **Move the configuration out.** Browsers, environments, and retry
   settings go to the runner configuration.
1. **Merge the synonyms.** `@regression`, `@full`, and `@nightly`
   selecting the same set become one.
1. **Collapse the fine-grained capability tags** into the top-level areas,
   since paths already select more finely.
1. **Give every remaining lifecycle tag an owner and a date**, and delete
   the scenarios nobody will claim.
1. **Write the surviving vocabulary down**, and add a check that fails on
   an unknown tag.

That last step is what makes the repair stick. Without it, the scheme
regrows within a year.

## Keeping it small

The target is a vocabulary short enough to list in one line of the
contributing guide, something close to:

```text
@lending @reservations @membership @smoke @slow @external @wip
```

Seven tags for a substantial suite is not unusual and not too few. Every
addition should have to answer the question at the top of this file: would
anyone run exactly this set?
