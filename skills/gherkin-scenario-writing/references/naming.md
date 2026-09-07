# Naming features and scenarios

Names are the index into a living specification. They are read far more
often than the steps beneath them.

## Contents

- [Why names carry the weight](#why-names-carry-the-weight)
- [Naming a feature](#naming-a-feature)
- [Where a feature ends](#where-a-feature-ends)
- [Naming a rule](#naming-a-rule)
- [Naming a scenario](#naming-a-scenario)
- [Naming negative cases](#naming-negative-cases)
- [Naming outline rows](#naming-outline-rows)
- [Names that signal trouble](#names-that-signal-trouble)
- [A quick self-test](#a-quick-self-test)

## Why names carry the weight

Most people who consult a feature file read only the names. They scan a
list of scenario titles to answer one question: does this system do the
thing I think it does? If the titles answer that, the file is documentation.
If they do not, the file is a test script that happens to be in English.

Names are also what a failure report shows. A red build that says
`Scenario: test 4 failed` costs someone a debugging session that a good
name would have saved.

## Naming a feature

A feature names a capability the business would recognise, in the words the
business uses. It is a noun phrase, not a sentence, and not a screen.

Names that work:

- Borrowing limits
- Late fees
- Reservation queue
- Bulk catalogue import

Names that do not:

- `LoanController` — an implementation artefact.
- Member page — a screen, not a capability. Screens get redesigned and
  merged; capabilities persist.
- Tests for borrowing — the file is not about testing.
- Miscellaneous — the sign of a file that has stopped having a subject.

Keep it short. If the feature name needs a conjunction, it is probably two
features.

## Where a feature ends

The boundary that holds up over time is one capability, not one screen and
not one class. Two heuristics:

- If a scenario in the file would still make sense after the interface is
  redesigned from scratch, it is in the right file.
- If the `Background` is growing to serve unrelated scenarios, the file is
  covering more than one capability. Split it and each half gets a smaller
  background of its own.

A feature with thirty scenarios is almost always several features. A
feature with one scenario is usually a rule that belongs inside a bigger
one.

## Naming a rule

A `Rule` name states the rule itself, as a complete sentence in the
present tense. It should be possible to agree or disagree with it without
reading anything else.

- A member may hold at most five titles at once
- Fees accrue only on working days
- A reservation expires if it is not collected within three days

Avoid restating the feature. Under a feature called Late fees, a rule
called Late fee rules says nothing.

## Naming a scenario

A scenario name states what happens, phrased so that someone could dispute
it in a planning conversation. The reliable shape is a condition and its
consequence.

- Member with an overdue title cannot borrow again
- Refund restores the borrowing allowance
- Returning a title makes it collectable for the first person waiting
- Import rejects rows with an unknown branch code

Three properties to aim for:

- It asserts. A reader learns a fact about the system from the name alone.
- It is specific. Swapping it with a neighbouring scenario's name would be
  obviously wrong.
- It avoids mechanism. No buttons, endpoints, or table names.

Present tense reads best. Avoid "should", which weakens the claim and adds
a word to every title in the suite. `Refund restores the allowance` is a
statement about the system; `Refund should restore the allowance` is a
statement about someone's hopes.

## Naming negative cases

Refusals are where the real rules live, so their names deserve the most
care. Name the reason, not the failure.

Weak, because they only say something went wrong:

- Invalid input
- Error case
- Borrow fails

Strong, because they name the rule being enforced:

- Borrowing is refused while a title is overdue
- Import rejects a row whose branch code is unknown
- Reservation cannot be collected after it has expired

If two negative scenarios would get the same name, they are testing the
same rule twice, or one of them has not been thought through.

## Naming outline rows

A `Scenario Outline` name describes the rule, not the values, because the
values are visible in the table right below it.

```gherkin
Scenario Outline: Membership tier sets the borrowing limit
  Given a <tier> member with nothing overdue
  When they check their allowance
  Then it is <limit> titles

  Examples:
    | tier     | limit |
    | standard | 3     |
    | premium  | 5     |
```

Placeholders may appear in the name, and most runners substitute them when
reporting, which makes failures easier to read. Use that only when the
value genuinely distinguishes the case; a title that becomes
`Tier standard sets the limit` for every row adds nothing.

Where an outline carries several `Examples` tables, name each one. The
table name appears in reports and explains why those rows are grouped.

## Names that signal trouble

Each of these usually means something structural is wrong, not just that
the wording is lazy:

- A test-case identifier such as `TC-114`. The specification has become a
  test-management artefact.
- Happy path. There is only one happy path per feature, so this name is
  either unique and uninformative or duplicated and confusing.
- Verify, Check, Test, or Validate as the first word. The name is
  describing the act of testing rather than the behaviour.
- A name containing "and". Two behaviours, one scenario.
- A name that matches the `When` step almost word for word. The name is
  restating the action instead of naming the consequence.
- A name nobody outside the delivery team could parse. Jargon has replaced
  the shared language.

## A quick self-test

Read only the scenario names in a file, in order, as a list. Then ask:

- Does the list explain what this capability does?
- Could a reader spot a missing rule from the gaps in the list?
- Would the person who asked for the feature agree with every line?

If the answer to all three is yes, the names are doing their job and the
file will still be useful a year from now. If the list reads as a sequence
of test activities, rewrite the names before touching the steps.
