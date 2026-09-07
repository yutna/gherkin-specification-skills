# Scenario smells, with rewrites

Each entry shows the text as it usually arrives, then the repair. The
before-and-after pairing is the point; a named smell without a rewrite
rarely changes anything.

## Contents

- [Click-by-click narration](#click-by-click-narration)
- [Steps joined by and](#steps-joined-by-and)
- [Two actions under test](#two-actions-under-test)
- [Assertions nobody can observe](#assertions-nobody-can-observe)
- [Names that identify tests](#names-that-identify-tests)
- [Background as a dumping ground](#background-as-a-dumping-ground)
- [An outline with one row](#an-outline-with-one-row)
- [Columns that carry nothing](#columns-that-carry-nothing)
- [Two rules in one table](#two-rules-in-one-table)
- [Scenarios that need each other](#scenarios-that-need-each-other)
- [Schema words in the specification](#schema-words-in-the-specification)
- [Numbers with no meaning](#numbers-with-no-meaning)
- [Only success is described](#only-success-is-described)
- [Tags carrying runner options](#tags-carrying-runner-options)
- [The same scenario twice](#the-same-scenario-twice)
- [Comments doing the step's job](#comments-doing-the-steps-job)
- [A feature covering everything](#a-feature-covering-everything)

## Click-by-click narration

The most common defect and the most expensive.

Before:

```gherkin
Scenario: Borrow
  Given I am on the login page
  When I enter "priya@example.com" in the email field
  And I enter "hunter2" in the password field
  And I click "Sign in"
  And I click "Catalogue" in the navigation bar
  And I type "Kindred" in the search box
  And I press Enter
  And I click the first result
  And I click the "Borrow" button
  Then I see a green banner reading "Success"
```

After:

```gherkin
Scenario: Borrowing an available title records the loan
  Given Priya is signed in
  And "Kindred" is available at her branch
  When she borrows it
  Then the loan is recorded against her account
  And the copy is no longer available to others
```

What changed: eight mechanical steps became one statement of intent, and
the assertion moved from a banner to the two facts the library actually
promised. Renaming the button now costs one edit in the step definitions
instead of one edit per scenario.

## Steps joined by and

Before:

```gherkin
When she signs in and borrows a title
```

After:

```gherkin
Given Priya is signed in
When she borrows "Kindred"
```

What changed: the sign-in was context, not the action under test, so it
became a `Given`. Both steps are now reusable, and a failure names which
one broke.

Where both halves genuinely are the action, the scenario is testing two
behaviours and should be split instead.

## Two actions under test

Before:

```gherkin
Scenario: Reserve and cancel
  Given "Kindred" is on loan
  When Priya reserves it
  Then she is first in the queue
  When she cancels the reservation
  Then the queue is empty
```

After:

```gherkin
Scenario: Reserving a title on loan joins the queue
  Given "Kindred" is on loan
  When Priya reserves it
  Then she is first in the queue

Scenario: Cancelling a reservation leaves the queue empty
  Given "Kindred" is on loan
  And Priya has reserved it
  When she cancels the reservation
  Then nobody is waiting for it
```

What changed: two behaviours became two scenarios. The second one's setup
states the reservation as a fact rather than re-performing it, so the
scenarios stay independent.

## Assertions nobody can observe

Before:

```gherkin
Then the loan record is persisted
And the cache is invalidated
```

After:

```gherkin
Then the loan appears in Priya's borrowing history
And the copy is no longer offered to other members
```

What changed: two implementation facts became two consequences a librarian
could check. If a step genuinely has no observable consequence, it is
testing internals and belongs in a unit test, not a specification.

## Names that identify tests

Before:

```gherkin
Scenario: TC-114
Scenario: Test borrow flow 2
Scenario: Happy path
```

After:

```gherkin
Scenario: Borrowing within the limit records the loan
Scenario: Borrowing beyond the limit is refused
Scenario: Borrowing is refused while a title is overdue
```

What changed: each name now asserts something a reader can agree or
disagree with, and a failure report says what broke rather than which test
number failed.

## Background as a dumping ground

Before:

```gherkin
Background:
  Given the Sathorn branch is open
  And the Phaya branch is open
  And the catalogue contains 400 titles
  And Priya is a premium member
  And Marcus is a standard member
  And Ana has 2 overdue titles
  And the late fee is 5 baht per day
  And the fee cap is 200 baht
```

After:

```gherkin
Background:
  Given the Sathorn branch is open

Scenario: Premium members may hold five titles
  Given Priya is a premium member holding 4 titles
  When she borrows one more
  Then the loan is recorded
```

What changed: only the genuinely shared fact stayed. Each scenario now
states the members and quantities it actually needs, so a reader arriving
at scenario nine does not have to scroll up and filter.

If nothing is shared by every scenario, delete the `Background` entirely.
If the leftover setup is large and splits cleanly in two, the feature is
covering two capabilities.

## An outline with one row

Before:

```gherkin
Scenario Outline: Borrowing limit
  Given a <tier> member holding <held> titles
  When they borrow one more
  Then the loan is <outcome>

  Examples:
    | tier    | held | outcome  |
    | premium | 4    | recorded |
```

After:

```gherkin
Scenario: Premium member within the limit may borrow
  Given a premium member holding 4 titles
  When they borrow one more
  Then the loan is recorded
```

What changed: the template disappeared. A reader no longer looks for a
variation that was never there.

## Columns that carry nothing

Before:

```gherkin
Scenario Outline: Late fee accrues per day
  Given a <tier> member has a loan <days> days overdue
  When the fee is calculated
  Then it is <fee> baht

  Examples:
    | tier    | days | fee |
    | premium | 1    | 5   |
    | premium | 7    | 35  |
    | premium | 30   | 150 |
```

After:

```gherkin
Scenario Outline: Late fee accrues per overdue day
  Given a premium member has a loan <days> days overdue
  When the fee is calculated
  Then it is <fee> baht

  Examples:
    | days | fee |
    | 1    | 5   |
    | 7    | 35  |
    | 30   | 150 |
```

What changed: `tier` never varied, so it was a constant pretending to be a
variable. Moving it into the step text removes a column the reader had to
check.

## Two rules in one table

Before:

```gherkin
Scenario Outline: Borrowing
  Given a member holding <held> titles
  And <overdue> overdue titles
  When they borrow one more
  Then the result is <result>

  Examples:
    | held | overdue | result   |
    | 4    | 0       | accepted |
    | 5    | 0       | refused  |
    | 2    | 1       | refused  |
```

After:

```gherkin
Scenario Outline: Borrowing is refused at the holding limit
  Given a member holding <held> titles with nothing overdue
  When they borrow one more
  Then the loan is <outcome>

  Examples:
    | held | outcome  |
    | 4    | recorded |
    | 5    | refused  |

Scenario: Borrowing is refused while a title is overdue
  Given a member holding 2 titles with 1 overdue
  When they borrow one more
  Then the loan is refused
  And they are told the overdue title must come back first
```

What changed: the holding limit and the overdue rule were separated, so
each name states one rule and each refusal explains itself. The generic
`result` column, which existed only to switch the assertion, disappeared.

## Scenarios that need each other

Before:

```gherkin
Scenario: Create the member
  When a member is registered as "Priya"
  Then the registration succeeds

Scenario: Borrow as that member
  When Priya borrows "Kindred"
  Then the loan is recorded
```

After:

```gherkin
Scenario: Registering a member succeeds
  When a member is registered as "Priya"
  Then she can sign in

Scenario: A registered member may borrow an available title
  Given Priya is a registered member
  And "Kindred" is available
  When she borrows it
  Then the loan is recorded
```

What changed: the second scenario states its own preconditions instead of
inheriting them from whichever scenario happened to run first. The suite
can now run in parallel, and either scenario can run alone.

The repeated setup is not duplication worth removing. Independence is
worth more than brevity here.

## Schema words in the specification

Before:

```gherkin
Given a row exists in tbl_rental with status_cd = 'A'
When the return_dt is set to today
Then the rental_status flips to 'R'
```

After:

```gherkin
Given Priya has an active loan of "Kindred"
When she returns it
Then the loan is closed
```

What changed: the specification now uses the words the library uses. The
step definitions carry the translation to `tbl_rental`, which is where a
schema rename should cost one edit.

## Numbers with no meaning

Before:

```gherkin
Given a member with 4820 points and tier code 2
When they borrow a title
Then the loan is recorded
```

After:

```gherkin
Given a premium member
When they borrow a title
Then the loan is recorded
```

What changed: the reader no longer has to know that 4820 crosses a
threshold and that tier code 2 means premium. The scenario also survives a
change to the threshold, which the original would not.

Keep a literal only where the number is the rule, such as the fee cap.

## Only success is described

Before, a feature file whose every scenario ends in success. The rules are
invisible, because nothing demonstrates where they apply.

After, each rule gains its refusal:

```gherkin
Scenario: Borrowing beyond the limit is refused
  Given a premium member holding 5 titles
  When they borrow one more
  Then the loan is refused
  And they are told the limit is 5 titles

Scenario: Borrowing is refused while a title is overdue
  Given a member with a loan 3 days overdue
  When they borrow another title
  Then the loan is refused
  And they are told the overdue title must come back first
```

What changed: the file now demonstrates rules rather than a walkthrough.
Note that each refusal also states what the member is told; a refusal with
no explanation is a rule half specified.

## Tags carrying runner options

Before:

```gherkin
@chrome @staging @retry3 @parallel-off
Scenario: Borrowing an available title records the loan
```

After:

```gherkin
@lending @smoke
Scenario: Borrowing an available title records the loan
```

What changed: browser, environment, retry count, and parallelism moved to
the runner configuration, where they belong. The remaining tags describe
what the scenario is about, which is the only thing a reader can use.

## The same scenario twice

Before:

```gherkin
Scenario: Member borrows a book
  Given "Kindred" is available
  When Priya borrows it
  Then the loan is recorded

Scenario: Borrowing a title that is on the shelf
  Given "Earthsea" is available
  When Marcus borrows it
  Then the loan is saved
```

After: one scenario, whichever wording is clearer.

What changed: the two demonstrated the same rule with different names for
the same things, so both had to be maintained and a rule change would
update one. Merging also revealed that "recorded" and "saved" were being
used for the same concept, which is a vocabulary problem worth fixing
across the suite.

## Comments doing the step's job

Before:

```gherkin
# this checks that the fee stops at 200
Then the fee is 200 baht
```

After:

```gherkin
Then the fee is capped at 200 baht
```

What changed: the explanation moved into the step, where every reader sees
it. A comment explaining what a step does means the step is badly worded.

A comment explaining why a rule exists is different and worth keeping:

```gherkin
# The cap was introduced by the 2026 lending policy review.
Scenario: Fee stops accruing at the cap
```

## A feature covering everything

Symptom: one file with thirty scenarios, a `Background` of eight steps, and
a name like Member management.

This is a boundary problem, not a formatting problem, and no amount of
rewriting individual scenarios fixes it. Split on the rules: registration,
borrowing limits, late fees, and reservations are four capabilities that
happen to involve the same person. Each file then gets a short
`Background` of its own and a name that means something.

The reliable seam is the one from discovery: each business rule that needs
more than one example is a candidate `Rule` block, and each cluster of
related rules is a candidate feature.
