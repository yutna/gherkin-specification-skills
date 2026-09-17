# Living documentation

Turning executed scenarios into something people outside the delivery team
actually read. This is where the cost of writing in business language is
repaid, and it is the step most teams skip.

## Contents

- [Why publishing is the point](#why-publishing-is-the-point)
- [What to generate](#what-to-generate)
- [Where to publish it](#where-to-publish-it)
- [What the report must show](#what-the-report-must-show)
- [Showing what is not covered](#showing-what-is-not-covered)
- [Linking to the decisions](#linking-to-the-decisions)
- [Keeping it read](#keeping-it-read)
- [Reporting failures usefully](#reporting-failures-usefully)
- [Machine-readable output](#machine-readable-output)
- [Signs it is not working](#signs-it-is-not-working)

## Why publishing is the point

Scenarios written in business language cost more than unit tests. They are
slower to write, slower to run, and require agreement before they can be
written at all. The return on that cost is a specification that stays
true, because it fails when it stops matching the system.

That return only arrives if somebody reads it. A suite whose output is a
pass or fail count in a build log has paid the whole cost and collected
none of the benefit, and the sensible response to that situation is to
stop writing scenarios, not to write more.

## What to generate

Every runner emits a structured result, and every ecosystem has reporters
that turn it into a browsable document. The specifics differ; the
requirements do not.

The output should be a page per feature, showing the scenarios as written,
with the result of each. Not a test report with the scenario text as a
label, but the specification itself, annotated with whether it currently
holds.

Generate it from the main-branch run. Reports from feature branches are
noise, because they describe behaviour that may never ship.

## Where to publish it

At a stable address that survives builds. A page hosted from the
repository, an internal site, or a documentation platform — the mechanism
matters far less than the property that a link to it keeps working.

What does not work is a build artefact. A report that requires finding the
right run, expanding the artefacts, downloading a zip, and opening a local
file will be read by engineers occasionally and by nobody else ever.

Link it from wherever the team's documentation starts. If someone has to
be told the address, they will not go back.

## What the report must show

Four things, beyond the scenarios themselves:

- **When it was generated**, and against which commit. A reader must be
  able to tell whether they are looking at current behaviour.
- **Which scenarios did not run**, and why. A report showing forty passes
  and hiding nine skips is misleading in exactly the direction that
  matters.
- **The rules**, if `Rule` blocks are used. Grouping by rule is more
  readable than a flat scenario list, because rules are what people came
  to check.
- **A way to search.** Past a few hundred scenarios, a reader with a
  specific question needs to find the answer without scrolling.

## Showing what is not covered

The most valuable thing a specification can say is what it does not
specify. Two additions make that visible.

Publish the open questions from discovery alongside the scenarios. A rule
with an unanswered question is a rule the system may be getting wrong, and
that is worth more to a reader than another passing scenario.

Publish the rules that have no refusal scenario. A rule demonstrated only
by success has not really been demonstrated. This is harder to automate
than the rest — it usually needs the rules to be `Rule` blocks and a
convention for what a refusal looks like — but even a manually maintained
list is better than silence.

## Linking to the decisions

Connect each feature to whatever records the decision behind it: the
ticket, the policy, the meeting note. A reader asking "why is the hold
period three days?" should be one link away from the answer.

Do this in the feature description block rather than in tags, so it is
visible in the published document:

```gherkin
Feature: Reservation collection

  The three-day hold period was set by the 2026 lending policy review.
  Branch managers may not vary it locally.

  Scenario: An uncollected reservation passes to the next member
```

Free-text description is ignored by the parser and appears in every
report, which makes it the right place for context that a reader needs and
cannot infer.

## Keeping it read

Publishing once and hoping is not a strategy. Three habits that work:

- **Use it in the conversation.** When someone asks how the system
  behaves, answer with a link rather than an explanation. That single
  habit does more than any amount of promotion.
- **Review it when a rule changes.** Before agreeing a change, look at the
  current specification for that capability. If it is wrong, that is the
  finding.
- **Check it is readable, with someone who did not write it.** Once a
  quarter, ask a person outside the delivery team to answer a real
  question from it. What they struggle with is the backlog.

If nobody reads it after a genuine attempt, that is a real result. It
usually means the scenarios are written at the wrong altitude, and the fix
is in the wording rather than in the publishing.

## Reporting failures usefully

The report is also where failures get investigated, so make a failure
self-explanatory:

- Show the failing step, not just the failing scenario.
- Attach the evidence gathered by the hooks: the last response, a
  screenshot, the relevant log excerpt.
- Include the seed if the run order was randomised, so it can be
  reproduced.
- Distinguish a failing scenario from an erroring one. A step that threw
  before asserting is usually an environment problem, not a behaviour
  change, and mixing them wastes investigation time.

A failure that arrives with evidence is fixed in minutes. A failure that
requires re-running locally to see anything is the reason suites get
ignored.

## Machine-readable output

Keep the structured result alongside the human-readable report. It is what
lets the health metrics be computed: run time per scenario, flaky rate,
pending count, and the trend of each.

Store enough history to see trends. A single run tells you the suite is
slow; a quarter of runs tells you it is getting slower, which is the
finding that prompts action.

Resist building a dashboard before anyone has asked a question it would
answer. Four numbers in the build summary are usually enough.

## Signs it is not working

- Nobody has opened the report in a month.
- The report exists but the address is unknown outside the team.
- People ask the team how the system behaves rather than looking.
- The report shows scenarios nobody recognises, because the wording is
  written for the automation rather than for a reader.
- Skipped and pending scenarios are invisible, so the report overstates
  coverage.
- The report is generated on every branch, so nobody knows which one
  describes what actually ships.
