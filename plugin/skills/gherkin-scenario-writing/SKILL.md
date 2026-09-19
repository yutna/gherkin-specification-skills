---
name: gherkin-scenario-writing
description: Write Gherkin feature files and scenarios that read as behaviour rather than test scripts. Use when drafting or rewriting a .feature file, turning acceptance criteria or a user story into Given/When/Then, naming scenarios, choosing between a Scenario and a Scenario Outline, deciding whether a Background is justified, or when asked what a scenario should say. Covers the full Gherkin keyword set, declarative phrasing, data tables, doc strings, tags, and localisation.
argument-hint: "[rules and examples, or a .feature file]"
license: MIT
metadata:
  version: "2.1.0"
  author: yutna
---

# Writing Gherkin scenarios

## Overview

A Gherkin scenario is a worked example of one rule, written so that the
person who asked for the behaviour can confirm it is the behaviour they
wanted. It happens to be executable. That order matters: readable first,
automated second. A scenario nobody outside the delivery team can read has
lost the only advantage it had over a plain unit test.

Every rule below exists to protect that readability.

## When to use this skill

Reach for it when the task is to produce or revise scenario text:

- Turning a story, ticket, or acceptance criteria into a `.feature` file.
- Adding scenarios to an existing feature.
- Rewriting a scenario that reads like a click-by-click script.
- Deciding between a `Scenario` and a `Scenario Outline`.
- Choosing what belongs in `Background` and what does not.

If the examples themselves are not agreed yet, the input is still a vague
requirement. Find them first with `gherkin-discovery`, then come back here
to phrase them.

If the task is judging feature files that already exist, use
`gherkin-scenario-review` instead. This skill writes; that one critiques.

## The shape of a scenario

Three moves, in order, and nothing else:

- `Given` establishes the state the world is already in. It is a fact, not
  an action the actor performs. Prefer the past or a state of being.
- `When` is the single action under test. One per scenario, always.
- `Then` states an outcome the person who asked can observe and check.

```gherkin
Scenario: Member with an overdue title cannot borrow again
  Given Priya has a loan that is 3 days overdue
  When she tries to borrow "The Left Hand of Darkness"
  Then the loan is refused
  And she is told the overdue title must come back first
```

`And` and `But` continue whichever of the three came before them. `But` is
`And` with a hint of contrast; it has no separate meaning to the parser.
The `*` keyword also continues a step and is useful when a list of
preconditions would read badly with repeated `And`.

## One When per scenario

Two `When` steps mean two behaviours, or a setup step wearing the wrong
keyword. Split the scenario, or demote the earlier action into a `Given`
that names its result rather than its steps.

```gherkin
Scenario: Refund restores the borrowing allowance
  Given Marcus has paid a 40 baht late fee
  When the fee is refunded
  Then his borrowing allowance returns to 5 titles
```

The payment happened; it is context. Only the refund is under test.

## Declarative, not imperative

The single highest-value habit. State what the actor is trying to
accomplish, not which controls they operate. Imperative scenarios break
whenever the interface changes, even though the rule did not.

Rewrite mechanics into intent:

```gherkin
Scenario: Returning a title clears the hold
  Given a title is on hold for Ana
  When the current borrower returns it
  Then Ana is notified that it is ready to collect
```

The same scenario written imperatively would name a login form, three
field entries, and a button. None of those are the rule. If the wording
mentions a selector, a URL, a button label, a database table, or an HTTP
status, the detail has leaked one layer too high. Push it into the step
definitions, where changing it costs one edit instead of thirty.

The exception is when the mechanism genuinely is the behaviour. A scenario
about a public API contract may legitimately assert a status code, because
the status code is what the consumer was promised.

See `references/declarative-style.md` for the full treatment, including how
far to go and where the line sits for API, batch, and event-driven systems.

## Naming

The feature name is a capability. The scenario name is a claim about
behaviour, phrased so it could be read aloud in a planning session and
either agreed with or disputed.

Good scenario names assert something:

- Member with an overdue title cannot borrow again
- Refund restores the borrowing allowance
- Bulk import rejects rows with an unknown branch code

Names to avoid are the ones that describe the test rather than the rule:
`TC-114`, `Test borrow flow`, `Happy path`, `Should work correctly`. If two
scenarios in a file could swap names without anyone noticing, neither name
is carrying information.

Detail on feature-level naming, capability boundaries, and how to name
negative cases lives in `references/naming.md`.

## Vocabulary

Pick one word per concept and use it everywhere: in the feature file, in
the step definitions, in conversation, in the code. If the business says
"loan" and the schema says `rental`, the feature file says loan and the
step definition does the translating. Mixed vocabulary is how a
specification quietly stops being readable by the people it was written
for.

Name the data instead of inlining unexplained values. `Given Priya is a
premium member` survives a change to the premium threshold; `Given a member
with 4820 points` does not, and it makes the reader hunt for why 4820
matters.

## Structural keywords

- `Feature` opens the file and names one capability. A short free-text
  description may follow it, indented, and is ignored by the parser.
- `Rule` groups the scenarios that illustrate one business rule. Use it
  when a feature covers several rules that each need more than one example.
- `Background` holds `Given` steps shared by every scenario in its
  container. It runs before each of them, not once for the file.
- `Scenario` is one example. `Example` is an accepted synonym.
- `Scenario Outline` is a template; `Examples` supplies its rows.

```gherkin
Feature: Borrowing limits

  Rule: A member may hold at most five titles at once

    Background:
      Given Priya is a member in good standing

    Scenario: Borrowing within the limit succeeds
      Given she holds 4 titles
      When she borrows one more
      Then the loan is recorded

    Scenario: Borrowing beyond the limit is refused
      Given she holds 5 titles
      When she borrows one more
      Then the loan is refused
```

## When Background earns its place

`Background` is worth it when every scenario in the container genuinely
shares the same starting state and the shared steps say something a reader
needs. It stops being worth it as it grows, because a reader arriving at
scenario nine now has to scroll up to understand what is true.

Keep it to a few lines. Put nothing in it that only some scenarios need,
and nothing that a reader can safely ignore. If it is drifting past four or
five steps, the feature is probably covering more than one capability.

## Outlines and tables

Use a `Scenario Outline` when the same rule is being demonstrated with
different values and the reader gains something from seeing them side by
side.

```gherkin
Scenario Outline: Late fees accrue per overdue day
  Given a loan is <days> days overdue
  When the fee is calculated
  Then it is <fee> baht

  Examples:
    | days | fee |
    | 1    | 5   |
    | 7    | 35  |
    | 30   | 150 |
```

An outline with one row is a scenario wearing a costume; write it plainly.
An outline whose rows exercise different rules is hiding those rules; split
it. Every column must change the meaning of the example, otherwise it is
noise the reader has to filter.

Data tables attached to a step are a different tool: they pass structured
input to that one step. Doc strings pass a block of text, optionally with a
content type.

```gherkin
Given the catalogue contains:
  | title               | branch  | copies |
  | The Dispossessed    | Sathorn | 2      |
  | A Wizard of Earthsea| Phaya   | 1      |
When a member searches for "Earthsea"
Then 1 result is returned
```

`references/outlines-and-tables.md` covers escaping, empty and null cells,
multi-line values, typed doc strings, and when a table is the wrong answer.

## Tags

Tags mark scenarios for selection. They are inherited downward: a tag on
`Feature` applies to every scenario in it, and a tag on `Rule` applies to
the scenarios under that rule.

```gherkin
@lending
Feature: Borrowing limits

  @slow @regression
  Scenario: Bulk renewal across every branch
    Given 500 loans are due today
    When the overnight renewal runs
    Then every eligible loan is extended
```

Keep the vocabulary small and meaningful. Tagging strategy for a whole
suite belongs to `gherkin-suite-design`; here it is enough to tag
deliberately and consistently.

## Localisation

A `# language:` comment on the first line switches the keyword dialect for
that file. Everything else works the same way.

```gherkin
# language: th
ความสามารถ: การยืมหนังสือ

  สถานการณ์: ยืมได้เมื่อไม่มีรายการค้างส่ง
    กำหนดให้ สมาชิกไม่มีรายการค้างส่ง
    เมื่อ สมาชิกยืมหนังสือหนึ่งเล่ม
    ดังนั้น ระบบบันทึกการยืมสำเร็จ
```

Choose one language per suite and stay with it. The full keyword table for
every construct is in `references/keyword-reference.md`.

## Quick reference

- One `When`. Always.
- `Given` is a state, `Then` is an observation.
- No selectors, URLs, buttons, tables, or status codes in the wording,
  unless the contract itself is the behaviour.
- Scenario names assert something disputable.
- One word per concept, matching the business.
- Name the data; do not inline unexplained numbers.
- `Background` stays short or disappears.
- Outlines need more than one row and no dead columns.
- Three to eight steps is a healthy scenario. Beyond that, look for a
  missing `Given` that should summarise several actions.

## Common mistakes

- Writing the test instead of the rule. If it reads as instructions to a
  tester, it is the wrong altitude.
- Conjunction steps. `When she logs in and borrows a title` is two steps
  pretending to be one, and neither half can be reused.
- Assertions with no observer. `Then the record is saved` is only checkable
  if a person could see it; otherwise it is testing an implementation
  detail and belongs in a unit test.
- Scenarios that depend on the one before them. Each must stand alone; a
  suite that only passes in order is a suite that cannot be run in
  parallel.
- Covering the happy path only. The interesting rules live in the refusals.
- Using `Background` as a dumping ground for setup that only two scenarios
  need.
- Restating the same rule with different numbers across many scenarios
  instead of one outline, or the reverse.

## Reference files

- `references/keyword-reference.md` — every keyword, synonym, and
  structural rule, plus the localisation table.
- `references/declarative-style.md` — the imperative-to-declarative
  rewrite, with API, batch, and event-driven worked examples.
- `references/outlines-and-tables.md` — outlines, data tables, doc strings,
  escaping, and the cases where each is wrong.
- `references/naming.md` — naming features, scenarios, and negative cases.
