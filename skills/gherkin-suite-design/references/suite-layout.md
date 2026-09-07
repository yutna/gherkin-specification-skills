# Suite layout

Where the boundaries go, and what to do when a file has outgrown them.

## Contents

- [The organising principle](#the-organising-principle)
- [Finding a capability boundary](#finding-a-capability-boundary)
- [Directory shape](#directory-shape)
- [Naming files](#naming-files)
- [Rule blocks versus separate files](#rule-blocks-versus-separate-files)
- [Splitting a file that has grown](#splitting-a-file-that-has-grown)
- [Where the glue lives](#where-the-glue-lives)
- [Cross-cutting behaviour](#cross-cutting-behaviour)
- [Multiple applications in one repository](#multiple-applications-in-one-repository)
- [Layouts that fail](#layouts-that-fail)

## The organising principle

Group by what the system does for someone, in the words that someone uses.
Everything else — the screen, the service, the team, the sprint — changes
for reasons unrelated to behaviour, and a layout organised around it
becomes wrong without anyone deciding to change it.

The test is simple: if the application were rebuilt from scratch with a
completely different architecture and interface, would this file still
belong where it is? A capability survives that. A screen does not.

## Finding a capability boundary

The seams from discovery are the reliable ones. Each business rule that
needed more than one example is a candidate `Rule` block; each cluster of
rules that share a vocabulary and a starting state is a candidate feature.

Three questions that resolve most boundary arguments:

- **Do these scenarios share a `Background`?** If the natural setup for
  half the file is irrelevant to the other half, there are two
  capabilities.
- **Would a reader looking for one rule expect to find the other here?**
  Someone checking the late-fee cap does not expect registration rules on
  the way.
- **Do these rules change together?** Rules that a single policy decision
  would alter belong together, even when they touch different screens.

Borrowing limits, late fees, renewals, and reservations are four
capabilities in one lending domain. They involve the same member and the
same catalogue, and they change independently, which is what makes them
separate.

## Directory shape

Two levels, almost always:

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

The top level is a domain area, the second is a capability. A third level
usually means capabilities have been split by mechanism — a
`reservations/api/` beside a `reservations/web/` describes two ways of
reaching one rule, and the rule should be specified once.

Where a suite covers several products or services, the top level becomes
the product and the domain area moves down one. Beyond that, the suite is
probably several suites.

## Naming files

Name the file after the capability, in business words, hyphenated:

- `borrowing-limits.feature`
- `late-fees.feature`
- `collecting-a-reservation.feature`

Names to avoid, and why:

- `member.feature` — a noun with no behaviour in it, so everything about
  members will eventually land there.
- `lending-tests.feature` — the suffix says nothing; every file is tests.
- `LC-204-borrowing.feature` — a ticket reference dates the file
  immediately and means nothing a year later.
- `misc.feature` — the sign of a boundary nobody wanted to decide.

The file name should match the `Feature:` line closely enough that
searching for either finds the other.

## Rule blocks versus separate files

Reach for a `Rule` block first. It groups related scenarios, carries its
own `Background`, and keeps the vocabulary in one place.

```gherkin
Feature: Borrowing limits

  Rule: A member may hold at most five titles at once

    Scenario: Borrowing within the limit succeeds
      Given a member holding 4 titles
      When they borrow one more
      Then the loan is recorded

  Rule: An overdue title blocks further borrowing

    Scenario: Borrowing is refused while a title is overdue
      Given a member with a loan 3 days overdue
      When they borrow another title
      Then the loan is refused
```

Move to a separate file when the rules stop sharing a starting state,
when the file passes roughly fifteen scenarios, or when two people keep
colliding while editing different rules in it.

## Splitting a file that has grown

Work in this order; it avoids the common outcome of a split that leaves
both halves incoherent.

1. **List the rules the file covers.** Group its scenarios under them. A
   scenario that fits no rule is either misplaced or demonstrates a rule
   nobody wrote down.
1. **Look at the `Background`.** Split it mentally into the part every
   rule needs and the parts only some need. The division usually reveals
   the seam.
1. **Cut on the seam**, not on scenario count. Two files of eight
   scenarios each is not obviously better than one of sixteen; two files
   with distinct subjects is.
1. **Give each half its own short `Background`** built from what its
   scenarios actually need, rather than copying the original into both.
1. **Rename both files.** A split that leaves one file with the old
   generic name has not finished.
1. **Move the step definitions** to match, if they were grouped by
   feature.

If no seam appears, the file may genuinely be one capability with too many
rules, in which case `Rule` blocks are the answer and the file stays.

## Where the glue lives

Mirror the feature structure in the step definitions, so someone changing
a rule can find the code without searching:

```text
features/lending/late-fees.feature
steps/lending/fee.steps
```

Group step definitions by domain area, never by keyword. A file containing
every `Given` in the suite tells nobody anything and guarantees ambiguous
matches.

Keep a small file of genuinely universal steps — authentication, clock
control — and treat additions to it with suspicion. Shared step files grow
until they are the reason two steps collide.

The task and driver layers are ordinary source code and belong in ordinary
source directories, not under the test tree. That placement is also what
lets them be reused by anything else that needs to drive the application.

## Cross-cutting behaviour

Some rules apply across many capabilities: permissions, audit records,
rate limits, soft deletion. Two ways to handle them, and the choice
depends on whether the rule is uniform.

Where the rule is genuinely uniform, give it its own capability file that
specifies it once, with a few representative cases:

```text
features/access/permissions.feature
```

Where it varies by capability, specify each variation inside the
capability it belongs to. A permission rule that differs for lending and
for membership is two rules, and hiding them in one file makes both harder
to find.

What does not work is asserting the cross-cutting rule in every scenario
that touches it. That adds a `Then` to fifty scenarios, none of which is
about it, and the rule still is not specified anywhere.

## Multiple applications in one repository

Keep one feature tree per deployable, next to the thing it specifies,
rather than one central tree for everything:

```text
services/lending/features/
services/catalogue/features/
```

Shared step definitions across services are usually a mistake: they couple
the services' test suites and make it impossible to change one without
considering the other. Duplicating a small amount of glue is cheaper than
the coupling.

Scenarios that genuinely span services belong in a separate, small,
clearly-labelled tree with its own slower run, not in either service's
suite.

## Layouts that fail

- **By screen.** Merged and redesigned screens leave the layout wrong with
  no obvious repair.
- **By test type.** A `smoke/` folder beside a `regression/` folder puts
  the same capability in two places and turns a depth decision into a
  filesystem decision. Use tags for depth.
- **By team.** Teams reorganise; the specification then describes an
  organisation chart that no longer exists.
- **By sprint or release.** Produces an archive rather than a
  specification, and nobody can find the current rule.
- **One flat directory.** Works until about twenty files, then nobody can
  find anything and duplicates start appearing.
- **Mirroring the source tree.** Couples the specification to the
  architecture, so a refactor moves feature files for no behavioural
  reason.
