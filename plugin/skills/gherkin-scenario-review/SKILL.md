---
name: gherkin-scenario-review
description: Critique and repair feature files that already exist. Use when reviewing a pull request that touches .feature files, when asked whether a scenario is any good, when a suite has grown unreadable or brittle, when auditing acceptance criteria inherited from another team, or when asked to clean up or refactor existing Gherkin. Supplies a catalogue of scenario smells with the rewrite for each, a review rubric, and guidance on delivering the feedback.
argument-hint: "[.feature files, a path, or a pull request]"
license: MIT
metadata:
  version: "2.1.1"
  author: yutna
---

# Reviewing Gherkin

## Overview

Reviewing a feature file is a different job from writing one. The text
already exists, somebody meant it, and the useful output is not a verdict
but a rewrite. A review that says "this is too imperative" helps nobody; a
review that shows the same scenario four lines shorter and more truthful
gets merged.

This skill supplies the diagnosis and the repair for each recurring defect.

## When to use this skill

- A pull request adds or changes `.feature` files.
- Someone asks whether a scenario reads well.
- A suite has become slow, flaky, or unreadable and nobody knows where to
  start.
- Feature files arrive from another team and need assessing.
- A refactor of existing scenarios is requested.

If the scenarios do not exist yet, write them with
`gherkin-scenario-writing` instead. If the underlying rules were never
agreed, no amount of rewriting will fix the file, and the work belongs in
`gherkin-discovery`.

## How to review

Read in three passes. Each pass finds a class of problem the others miss,
and doing them at once produces a scattered review.

1. **Names only.** Read the feature name and every scenario name, in
   order, ignoring the steps. Does the list describe a capability? Could a
   reader spot a missing rule from the gaps? Most structural problems are
   visible here alone.
1. **Altitude.** Read the steps looking only for detail that has leaked
   down from behaviour into mechanism, and for scenarios that depend on
   each other.
1. **Truth.** Ask whether each `Then` is actually checkable by the person
   who wanted the feature, and whether the file covers the refusals or
   only the happy path.

Then write the review, leading with the two or three findings that matter,
each with a concrete rewrite.

## The smell catalogue

Each entry gives the symptom, what it costs, and the repair. The headings
match `references/smell-catalogue.md`, which carries the same set with a
full before-and-after rewrite for each.

### Click-by-click narration

- **Symptom:** steps name buttons, fields, selectors, URLs, or screens.
- **Cost:** the specification breaks when the interface changes, and the
  reader cannot tell whether the rule was satisfied.
- **Repair:** state the intent and move the mechanics into the step
  definitions.

```gherkin
Scenario: Borrowing an available title records the loan
  Given "Kindred" is available at Priya's branch
  When she borrows it
  Then the loan is recorded against her account
```

### Steps joined by and

- **Symptom:** a single step joining two actions with "and".
- **Cost:** neither half can be reused, and a failure does not say which
  half broke.
- **Repair:** split into separate steps, or collapse the first into a
  `Given` that names its result.

### Two actions under test

- **Symptom:** two or more `When` steps in one scenario.
- **Cost:** two behaviours are being tested at once, so a failure is
  ambiguous and the name cannot describe both.
- **Repair:** split the scenario, demoting the earlier action to a `Given`
  phrased as state.

### Assertions nobody can observe

- **Symptom:** no `Then`, or one that asserts nothing a person could
  observe, such as "the record is saved".
- **Cost:** the scenario passes whatever the system does.
- **Repair:** state the consequence the requester cares about. If there is
  no observable consequence, the case belongs in a unit test.

### Names that identify tests

- **Symptom:** names like `TC-114`, `Test 3`, or `Happy path`.
- **Cost:** failure reports and the file index become useless.
- **Repair:** name the behaviour as a disputable claim.

### Background as a dumping ground

- **Symptom:** a `Background` of many steps, some needed by only a few
  scenarios.
- **Cost:** every scenario starts from a state its reader has to scroll up
  to learn, and half of it is irrelevant.
- **Repair:** keep only what every scenario needs and what a reader must
  know. Push the rest into the scenarios that use it, or split the feature.

### An outline with one row

- **Symptom:** a `Scenario Outline` with one `Examples` row.
- **Cost:** ceremony with no benefit; the reader hunts for a variation that
  does not exist.
- **Repair:** write it as a plain `Scenario`.

### Columns that carry nothing

- **Symptom:** an `Examples` column with the same value in every row, or
  one that never affects the outcome.
- **Cost:** the reader has to work out that it does not matter.
- **Repair:** move the constant into the step text and delete the column.

### Two rules in one table

- **Symptom:** rows whose outcomes differ in kind, often with a `valid` or
  `expected result` column switching the assertion.
- **Cost:** neither outcome can be stated plainly in the step text.
- **Repair:** split into one scenario per outcome.

### Scenarios that need each other

- **Symptom:** a scenario relying on state left behind by an earlier one.
- **Cost:** the suite cannot run in parallel, cannot run a single scenario,
  and fails in confusing ways when one is skipped.
- **Repair:** give each scenario its own `Given` steps, even if that
  repeats setup. Repetition in the specification is cheaper than coupling.

### Schema words in the specification

- **Symptom:** words from the schema or the code where the business uses
  different ones.
- **Cost:** the file stops being readable by the people it was written for.
- **Repair:** use the business word and let the step definition translate.

### Numbers with no meaning

- **Symptom:** literal numbers or codes with no stated meaning.
- **Cost:** the reader cannot tell what is significant, and the scenario
  breaks when an unrelated threshold moves.
- **Repair:** name the concept in the step and let the step definition
  produce whatever satisfies it.

### Only success is described

- **Symptom:** every scenario succeeds.
- **Cost:** the rules are invisible, because a rule is only demonstrated by
  the case it refuses.
- **Repair:** for each rule, add the case where it bites. If nobody can
  say what that case is, the gap belongs in `gherkin-discovery`.

### Tags carrying runner options

- **Symptom:** tags encoding environments, browsers, or execution options.
- **Cost:** the specification carries operational detail that changes for
  reasons unrelated to behaviour.
- **Repair:** keep tags descriptive and move execution choices into the
  runner configuration.

### The same scenario twice

- **Symptom:** two scenarios differing only in wording or in an irrelevant
  value.
- **Cost:** both must be maintained, and a change to the rule will update
  one of them.
- **Repair:** merge them, or make the difference explicit and meaningful.

### Comments doing the step's job

- **Symptom:** a comment above a step explaining what the step does.
- **Cost:** the explanation is invisible in every report, and the step
  stays badly worded.
- **Repair:** move the meaning into the step text. A comment saying why a
  rule exists is different and worth keeping.

### A feature covering everything

- **Symptom:** one file with thirty scenarios, a long `Background`, and a
  name like Member management.
- **Cost:** a boundary problem that no amount of rewriting individual
  scenarios fixes.
- **Repair:** split on the rules. Each cluster of related rules is a
  candidate feature, and each rule needing several examples is a
  candidate `Rule` block.

## The rubric

For a quick pass, score the file against these. Anything answered no is a
finding. The expanded version, with what to do about each, is in
`references/review-checklist.md`.

- Does the scenario name list read as a description of the capability?
- Does every scenario have exactly one `When`?
- Could every `Then` be checked by the person who requested the feature?
- Is the file free of selectors, URLs, screens, and schema names, except
  where the contract itself is the subject?
- Does every rule have at least one scenario where it refuses something?
- Can each scenario run alone, in any order?
- Is every `Examples` column load-bearing?
- Does the vocabulary match the words the business uses?
- Is the `Background` short enough to hold in your head?
- Would someone outside the delivery team understand the file?

## Delivering the review

The rewrite is the review. Show the current text, then the proposed text,
then one sentence on what changed and why. Three findings presented that
way land better than fifteen presented as rules.

Rank by cost. Interface detail and order dependence will cost the team
repeatedly; a slightly weak scenario name will not. Say which findings are
worth fixing now and which are worth noting.

Separate defects from preferences explicitly. "This will break when the
button is renamed" is a defect. "I would have phrased this differently" is
a preference, and saying so keeps the review credible.

Where the problem is that a rule was never agreed, say that rather than
proposing wording. No rewrite fixes an unagreed rule, and proposing one
invents a decision the reviewer is not entitled to make.

## Common mistakes

- Reviewing wording while ignoring that half the rules are missing.
- Listing every smell found. A review with fifteen findings gets skimmed.
- Rewriting into the reviewer's own house style rather than fixing a
  defect.
- Demanding declarative phrasing in a scenario whose subject genuinely is
  the mechanism, such as a published API contract.
- Approving a file because the tests pass. Passing says nothing about
  whether the file describes the right behaviour.
- Treating a long feature file as a formatting problem when it is a
  boundary problem.

## Reference files

- `references/smell-catalogue.md` — every smell with a full worked
  before-and-after rewrite.
- `references/review-checklist.md` — the rubric expanded, plus a triage
  order for a suite that needs work everywhere.
