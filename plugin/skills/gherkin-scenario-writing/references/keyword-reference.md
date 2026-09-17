# Gherkin keyword reference

Every construct the language offers, what it does, and the rules that are
easy to get wrong.

## Contents

- [File structure](#file-structure)
- [Primary keywords](#primary-keywords)
- [Step keywords](#step-keywords)
- [Feature](#feature)
- [Rule](#rule)
- [Background](#background)
- [Scenario](#scenario)
- [Scenario Outline and Examples](#scenario-outline-and-examples)
- [Data tables](#data-tables)
- [Doc strings](#doc-strings)
- [Tags](#tags)
- [Comments](#comments)
- [Localisation](#localisation)
- [Parsing rules worth knowing](#parsing-rules-worth-knowing)

## File structure

A feature file holds exactly one `Feature`. Inside it, in this order and
all optional except at least one example:

1. Free-text description lines.
1. An optional `Background`.
1. Any number of `Rule` blocks, `Scenario` blocks, or `Scenario Outline`
   blocks.

Indentation carries no meaning to the parser. It is purely for readers, so
be consistent: two spaces per level is the common convention.

## Primary keywords

| Keyword            | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `Feature`          | Names the capability; opens the file     |
| `Rule`             | Groups examples of one business rule     |
| `Background`       | Shared setup, re-run before each example |
| `Scenario`         | One concrete example                     |
| `Example`          | Synonym for `Scenario`                   |
| `Scenario Outline` | A template driven by `Examples` rows     |
| `Scenario Template`| Synonym for `Scenario Outline`           |
| `Examples`         | The rows that fill an outline            |
| `Scenarios`        | Synonym for `Examples`                   |

## Step keywords

| Keyword | Meaning                                      |
| ------- | -------------------------------------------- |
| `Given` | State that already holds                     |
| `When`  | The action under test                        |
| `Then`  | An observable outcome                        |
| `And`   | Continues the previous step keyword          |
| `But`   | Continues it, with a note of contrast        |
| `*`     | Continues it, with no word at all            |

The parser treats `And`, `But`, and `*` identically. Their keyword for
matching purposes is whichever of `Given`, `When`, or `Then` preceded them,
which is why a step definition written for a `Given` will also match an
`And` that follows one.

`*` is useful for lists that read badly with repeated `And`:

```gherkin
Given the branch is open
* the catalogue is loaded
* two members are waiting
```

## Feature

```gherkin
Feature: Borrowing limits

  Members may hold a bounded number of titles at once. The bound depends
  on membership tier and on whether anything is overdue.

  Scenario: Borrowing within the limit succeeds
    Given Priya holds 4 titles
    When she borrows one more
    Then the loan is recorded
```

The description block runs until the next keyword. It is free text, may
span many lines, and is never executed. Use it for the context a reader
needs and cannot infer, not for a restatement of the scenarios below.

## Rule

`Rule` sits between `Feature` and the examples, and takes its own optional
description and its own `Background`.

```gherkin
Feature: Late fees

  Rule: Fees accrue only on working days

    Background:
      Given the branch calendar marks Sunday as closed

    Scenario: A Sunday adds no fee
      Given a loan became overdue on Saturday
      When fees are calculated on Monday
      Then 1 day of fee is charged
```

A `Background` under a `Rule` applies only to that rule's scenarios, and
runs after any feature-level `Background`.

## Background

Runs before every scenario in its container, once per scenario, not once
per file. It may contain only `Given` steps in spirit; the parser will
accept `When` and `Then` there, but doing so means every scenario begins
mid-action, which is always a mistake.

A `Background` cannot appear after the first scenario, and there can be at
most one per container.

## Scenario

A scenario is a sequence of steps. There is no upper limit, but the useful
range is three to eight. Longer usually means several `Given` steps that
should collapse into one summarising state.

`Example` is an exact synonym and reads better inside a `Rule` block, where
the word "scenario" competes with the surrounding prose.

## Scenario Outline and Examples

An outline's steps contain placeholders written as `<column>`. Each row of
the `Examples` table produces one scenario.

```gherkin
Scenario Outline: Tier determines the borrowing limit
  Given a <tier> member with no overdue titles
  When they check their allowance
  Then it is <limit> titles

  Examples:
    | tier     | limit |
    | standard | 3     |
    | premium  | 5     |
    | staff    | 10    |
```

Placeholders may appear in step text, in data tables attached to steps, and
inside doc strings. The header row names the columns; a placeholder with no
matching column is an error in most runners and a silent literal in others,
so treat any mismatch as a bug.

Multiple `Examples` tables are allowed under one outline, each with its own
tags. That is the clean way to mark a subset of rows slow or pending:

```gherkin
Scenario Outline: Search matches on title
  Given the catalogue is loaded
  When a member searches for "<term>"
  Then <count> results are returned

  Examples: Common terms
    | term    | count |
    | earth   | 2     |

  @slow
  Examples: Whole-catalogue scans
    | term    | count |
    | e       | 812   |
```

## Data tables

A table indented under a step becomes an argument to that step.

```gherkin
Given the catalogue contains:
  | title            | branch  | copies |
  | The Dispossessed | Sathorn | 2      |
  | Kindred          | Phaya   | 1      |
```

Every row must have the same number of cells as the header, including
the header itself; a missing trailing pipe is the usual cause of a
confusing parse error.

Escaping, whitespace handling, empty cells, and when a table is the wrong
tool are covered in `outlines-and-tables.md`.

## Doc strings

A doc string passes a block of text to a step, delimited by three double
quotes or three backticks.

```gherkin
When the client submits:
  """json
  {"title": "Kindred", "branch": "Phaya"}
  """
Then the response status is 201
```

The word after the opening delimiter is a content type, available to the
step definition and ignored by the parser.

Indentation, the backtick delimiter, and when a doc string is the wrong
tool are covered in `outlines-and-tables.md`.

## Tags

Tags attach to `Feature`, `Rule`, `Scenario`, `Scenario Outline`, and
`Examples`. They begin with `@`, contain no whitespace, and sit on the line
above what they mark.

```gherkin
@lending @regression
Feature: Borrowing limits
```

Inheritance runs downward only: feature to rule to scenario to examples. A
scenario therefore carries its own tags plus every tag above it. There is
no way to remove an inherited tag, which is the main reason to tag
sparingly at the feature level.

## Comments

A line whose first non-whitespace character is `#` is a comment. There are
no end-of-line comments and no block comments.

```gherkin
# Fees were capped at 200 baht from the 2026 policy change.
Scenario: Fee stops accruing at the cap
```

A comment explaining why a rule exists is useful. A comment explaining what
the next step does means the step is badly worded; fix the step.

## Localisation

The first line may select a dialect:

```gherkin
# language: fr
Fonctionnalité: Limites d'emprunt

  Scénario: Emprunt dans la limite
    Soit un membre avec 4 titres
    Quand il emprunte un titre de plus
    Alors le prêt est enregistré
```

Common dialect codes are `en`, `fr`, `de`, `es`, `pt`, `ja`, `zh-CN`, `th`,
`id`, `vi`, and around seventy others. Each dialect defines its own words
for every keyword, and most define several synonyms per keyword.

Two practical rules: pick one dialect per suite, and put the language
comment on the very first line, before any tag.

## Parsing rules worth knowing

- One `Feature` per file. A second one is a parse error.
- The file extension is `.feature` by convention, and most runners will not
  discover anything else.
- A step with no `Given`, `When`, `Then`, `And`, `But`, or `*` prefix is a
  parse error, which is why free text must live in a description block.
- Blank lines are permitted anywhere and carry no meaning.
- Trailing whitespace on a step is stripped before matching, so it cannot
  break a step definition, but it can make two apparently identical steps
  look different in a diff.
- Placeholder substitution is textual and happens before step matching, so
  `<limit>` inside a quoted string is still substituted.
