# Outlines, tables, and doc strings

Three ways to attach data to a specification, and the failure mode of each.

## Contents

- [Choosing between them](#choosing-between-them)
- [Scenario outlines](#scenario-outlines)
- [Designing the Examples table](#designing-the-examples-table)
- [Multiple Examples tables](#multiple-examples-tables)
- [When an outline is the wrong answer](#when-an-outline-is-the-wrong-answer)
- [Data tables on a step](#data-tables-on-a-step)
- [Table escaping and empty values](#table-escaping-and-empty-values)
- [When a table is the wrong answer](#when-a-table-is-the-wrong-answer)
- [Vertical tables](#vertical-tables)
- [Doc strings](#doc-strings)
- [Named data over literal data](#named-data-over-literal-data)

## Choosing between them

- A `Scenario Outline` repeats a whole scenario with different values. It
  answers "does this rule hold across the range?"
- A data table attached to a step passes structured input to that one step.
  It answers "what data was set up, or submitted, or expected?"
- A doc string passes one block of text to a step. It answers "what exactly
  was the payload, the message, or the document?"

They compose. An outline may contain steps that carry data tables, and a
placeholder may appear inside a table cell or a doc string.

## Scenario outlines

Placeholders are written `<column>` and substituted textually before step
matching, so they work anywhere in the step, including inside quotes.

```gherkin
Scenario Outline: Membership tier sets the borrowing limit
  Given a <tier> member with nothing overdue
  When they check their allowance
  Then it is <limit> titles

  Examples:
    | tier     | limit |
    | standard | 3     |
    | premium  | 5     |
    | staff    | 10    |
```

Each row becomes an independent scenario with its own setup and teardown.
Rows never share state, and a failing row does not stop the others.

## Designing the Examples table

The table is part of the specification, so it should read like one.

- Every column must change the meaning of the example. A column that holds
  the same value in every row is a constant; move it into the step text.
- Every row must be a case somebody would argue about. Three rows that
  differ only by an arbitrary number are one case written three times.
- Order rows so the progression is visible: boundary below, boundary at,
  boundary above.
- Name the columns in business language. `tier` and `limit`, not `input1`
  and `expected`.
- Keep the table narrow enough to read without horizontal scrolling. Past
  five columns, ask whether several of them are one named concept.

A useful shape for a rule with a threshold:

```gherkin
Scenario Outline: Late fees stop at the cap
  Given a loan is <days> days overdue
  When the fee is calculated
  Then it is <fee> baht

  Examples:
    | days | fee |
    | 39   | 195 |
    | 40   | 200 |
    | 41   | 200 |
```

Three rows, and the cap is obvious from the shape of the data alone.

## Multiple Examples tables

An outline may carry several `Examples` blocks, each with its own name and
its own tags. This is the clean way to separate fast cases from slow ones,
or agreed cases from ones still under discussion.

```gherkin
Scenario Outline: Search matches on partial titles
  Given the catalogue is loaded
  When a member searches for "<term>"
  Then <count> titles are returned

  Examples: Everyday searches
    | term    | count |
    | earth   | 2     |
    | kindred | 1     |

  @slow
  Examples: Whole-catalogue scans
    | term | count |
    | e    | 812   |
```

Naming the tables is optional to the parser and valuable to the reader.

## When an outline is the wrong answer

- One row. It is a scenario with extra ceremony; write it plainly.
- Rows that exercise different rules. If one row is about tiers and another
  about overdue titles, two rules are hiding in one template. Split them.
- Rows whose expected value is computed by the reader. If understanding the
  table requires doing arithmetic, the example has stopped being an
  example.
- A column that exists only to switch the assertion, such as a `valid`
  flag with true and false rows. That is two scenarios wearing a trench
  coat, and the step text can no longer state either outcome plainly.

```gherkin
Scenario: Borrowing within the limit succeeds
  Given a premium member holding 4 titles
  When they borrow one more
  Then the loan is recorded

Scenario: Borrowing beyond the limit is refused
  Given a premium member holding 5 titles
  When they borrow one more
  Then the loan is refused
```

Two plain scenarios beat one outline whenever the outcomes differ in kind
rather than in value.

## Data tables on a step

A table indented under a step is an argument to that step alone.

```gherkin
Given the catalogue contains:
  | title            | branch  | copies |
  | The Dispossessed | Sathorn | 2      |
  | Kindred          | Phaya   | 1      |
When a member searches for "Kindred"
Then 1 title is returned
```

The step definition decides how to read it: as a list of maps keyed by the
header, as a list of lists, or as a single map when the table has two
columns and no header row. Prefer a header row; it makes the specification
self-describing even when the reader has never seen the step definition.

Tables also express expected output, which is often the clearest way to
assert on a collection:

```gherkin
When the overdue report is generated
Then it lists:
  | member | title    | days |
  | Priya  | Kindred  | 3    |
  | Marcus | Earthsea | 11   |
```

## Table escaping and empty values

- `\|` produces a literal pipe inside a cell.
- `\\` produces a literal backslash.
- `\n` produces a newline inside a cell, which is the only way to get a
  multi-line value into a table.
- Leading and trailing whitespace in a cell is stripped, so alignment
  spaces are free.
- Every row must have the same cell count as the header. A missing trailing
  pipe is the usual cause of a confusing parse error.

An empty cell is an empty string. There is no portable literal for null,
and runners differ, so express absence with a sentinel the step definition
translates:

```gherkin
Given the members are:
  | name   | branch  | phone   |
  | Priya  | Sathorn | 0812345 |
  | Marcus | Phaya   | (none)  |
```

Whichever sentinel is chosen, use the same one across the suite and
document it once in the step definition layer.

## When a table is the wrong answer

A table is the wrong tool when the reader has to count columns to follow
it. Past about five columns, ask whether several of them are really one
named concept that the step could state instead.

It is also wrong when only one row matters to the rule. A single-row table
is a step with its arguments moved somewhere less readable; put the values
in the step text.

```gherkin
Given Priya is a premium member at Sathorn
```

## Vertical tables

When a step needs many attributes of a single thing, a two-column table
reads better than a wide one:

```gherkin
Given a member exists with:
  | name    | Priya Raman |
  | tier    | premium     |
  | branch  | Sathorn     |
  | overdue | 0           |
```

Most runners can read this directly as a map. It also survives adding an
attribute without reformatting the whole block, which a wide table does
not.

## Doc strings

A doc string carries one block of text, delimited by three double quotes
or three backticks, with an optional content type after the opening
delimiter.

```gherkin
When the branch submits:
  """json
  {
    "title": "Kindred",
    "branch": "Phaya"
  }
  """
Then the title is added to the catalogue
```

The indentation of the opening delimiter sets the left margin. Everything
is de-indented by that amount, so the block can sit visually inside the
step without leading spaces reaching the step definition.

Use backticks as the delimiter when the content itself contains a run of
double quotes:

````gherkin
Then the export contains:
  ```csv
  title,branch
  "Kindred",Phaya
  ```
````

A doc string is the right tool for a payload, a message body, a rendered
document, or an error the consumer will see verbatim. It is the wrong tool
for structured data with a few fields, where a table reads far better, and
for anything longer than a screen, where nobody will read it at all.

## Named data over literal data

Every literal in a table is a small piece of unexplained context. Where the
value matters, name it in the step text and let the table hold only what
varies.

Instead of a table column carrying `4820` with no explanation, say
`a premium member` and let the step definition build whatever a premium
member requires. The specification then keeps working when the premium
threshold changes, and the reader is never left wondering what 4820 meant.

Reserve literal values for cases where the number itself is the rule, such
as the fee cap or the borrowing limit. There, the literal is the point.
