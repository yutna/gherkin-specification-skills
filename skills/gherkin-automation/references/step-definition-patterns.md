# Step definition patterns

The glue layer, in detail: matching, typing, structuring, and the refactors
that keep it thin.

## Contents

- [Anatomy of a good definition](#anatomy-of-a-good-definition)
- [Cucumber Expressions in full](#cucumber-expressions-in-full)
- [Custom parameter types](#custom-parameter-types)
- [Optional and alternative text](#optional-and-alternative-text)
- [When a regular expression is right](#when-a-regular-expression-is-right)
- [Receiving data tables](#receiving-data-tables)
- [Receiving doc strings](#receiving-doc-strings)
- [The task layer](#the-task-layer)
- [The driver layer](#the-driver-layer)
- [Refactor: driver code in the step](#refactor-driver-code-in-the-step)
- [Refactor: the branching step](#refactor-the-branching-step)
- [Refactor: near-duplicate steps](#refactor-near-duplicate-steps)
- [Organising the files](#organising-the-files)
- [Assertions](#assertions)

## Anatomy of a good definition

Three lines is typical. Parse, delegate, stop.

```javascript
When('{actor} borrows {string}', async function (actor, title) {
  this.lastResult = await this.tasks.lending.borrow(actor, title)
})
```

It captures typed arguments, calls one task, and stores the outcome where
a later `Then` can assert on it. It contains no branching, no selectors, no
assertions, and no knowledge of how borrowing works.

## Cucumber Expressions in full

The built-in parameter types, and what each yields:

- `{int}` matches `42` or `-7` and yields an integer.
- `{float}` matches `3.5` or `-0.25` and yields a floating-point number.
- `{word}` matches a single unquoted word and yields a string.
- `{string}` matches text in single or double quotes and yields the
  string with the quotes removed.
- `{}` matches anything up to the next literal and yields a string.
- `{bigdecimal}` matches a decimal number and yields an exact decimal,
  in the runners that support it.

`{string}` is the one to reach for whenever a value appears in the
specification with quotes around it, which is the convention for titles,
names, and messages.

```gherkin
When "Kindred" is borrowed by Priya
Then the loan is recorded
```

```javascript
When('{string} is borrowed by {word}', async function (title, member) {
  this.lastResult = await this.tasks.lending.borrow(member, title)
})
```

Avoid `{}` in shared steps. It matches greedily and will eventually
swallow a step somebody else wrote.

## Custom parameter types

The highest-value technique in this file. A custom type converts a domain
word into a domain object once, and every step definition then receives
something real instead of a string.

```javascript
defineParameterType({
  name: 'member',
  regexp: /Priya|Marcus|Ana/,
  transformer: (name) => Member.named(name),
})

defineParameterType({
  name: 'outcome',
  regexp: /recorded|refused/,
  transformer: (word) => (word === 'recorded' ? Outcome.Recorded : Outcome.Refused),
})
```

```javascript
Then('the loan is {outcome}', function (outcome) {
  expect(this.lastResult.outcome).toEqual(outcome)
})
```

Three benefits beyond brevity. The specification gains a controlled
vocabulary, because a step using an unknown member name simply will not
match. The conversion lives in one place. And the step definitions stop
containing string comparisons, which is where subtle bugs hide.

Define types for the concepts that recur: actors, money, durations,
statuses, dates expressed in business terms such as `today` and
`3 days ago`.

## Optional and alternative text

Expressions handle small wording variations without a second definition.

- Parentheses make text optional: `borrows a title(s)` matches both.
- A slash offers alternatives: `the loan is refused/rejected`.
- A backslash escapes a character that would otherwise be syntax.

Use these sparingly. They exist so a specification can read naturally in
singular and plural, not so one definition can absorb three different
meanings.

## When a regular expression is right

Reach for one only when the expression syntax genuinely cannot express the
match, such as an optional trailing clause with its own capture, or a
pattern anchored in an unusual way.

```javascript
When(/^the overnight renewal runs(?: for the (\w+) branch)?$/,
  async function (branch) {
    await this.tasks.batch.runRenewal(branch ?? 'all')
  })
```

If a regular expression is unavoidable, name what it captures in the step
body immediately, because the pattern itself no longer says what the
arguments mean.

## Receiving data tables

A table arrives as the last argument. Read it by header rather than by
position, so adding a column does not silently shift everything.

```gherkin
Given the catalogue contains:
  | title            | branch  | copies |
  | The Dispossessed | Sathorn | 2      |
  | Kindred          | Phaya   | 1      |
```

```javascript
Given('the catalogue contains:', async function (table) {
  for (const row of table.hashes()) {
    await this.build.title(row)
  }
})
```

For a two-column vertical table describing one thing, most runners offer a
map conversion, which reads better than a single-row list.

Do the sentinel translation here, in one place:

```javascript
function value (cell) {
  return cell === '(none)' ? null : cell
}
```

## Receiving doc strings

A doc string arrives as a string, with its content type available where the
runner exposes it.

```javascript
When('the branch submits:', async function (body) {
  this.lastResponse = await this.drivers.api.post('/titles', JSON.parse(body))
})
```

Parse in the step definition only when the parsing is trivial. Anything
more belongs in the task layer, so that a second step needing the same
payload shape does not reimplement it.

## The task layer

Tasks are the vocabulary of the domain, expressed as operations. They are
the reason step definitions can stay short.

```javascript
export class LendingTasks {
  constructor (drivers) {
    this.drivers = drivers
  }

  async borrow (member, title) {
    const copy = await this.drivers.catalogue.findAvailable(title)
    return this.drivers.lending.createLoan(member.id, copy.id)
  }

  async createOverdueLoan (member, days) {
    const loan = await this.borrow(member, 'any available title')
    return this.drivers.lending.backdate(loan.id, days)
  }
}
```

Two properties make a task layer work. Its methods are named for what the
business calls them, and it is usable outside the test suite, because
nothing in it knows it is being tested.

## The driver layer

Drivers are the only code that knows how the system is actually reached:
selectors, endpoints, queues, tables, files.

Keep one driver per mechanism, not one per scenario. A browser driver, an
API client, a message publisher, a database fixture helper. When the
interface changes, exactly one driver changes.

A useful discipline: the driver layer should be swappable. If the same
task layer can drive the application through its API in one configuration
and its interface in another, the seams are in the right places, and most
scenarios can run against the faster path.

## Refactor: driver code in the step

Before:

```javascript
When('Priya borrows Kindred', async function () {
  await this.page.goto('https://library.example/catalogue')
  await this.page.fill('#search', 'Kindred')
  await this.page.click('[data-testid="result-0"]')
  await this.page.click('button.borrow')
  await this.page.waitForSelector('.banner-success')
})
```

After:

```javascript
When('{member} borrows {string}', async function (member, title) {
  this.lastResult = await this.tasks.lending.borrow(member, title)
})
```

The five browser operations moved into a catalogue driver, and the step
gained parameters so it serves every scenario instead of one. The wait
became the driver's responsibility, where it can be expressed as a
condition rather than repeated in every step.

## Refactor: the branching step

Before:

```javascript
Then('the loan is {word}', function (outcome) {
  if (outcome === 'recorded') {
    expect(this.lastResult.status).toEqual('active')
  } else if (outcome === 'refused') {
    expect(this.lastResult.error).toBeDefined()
  } else {
    throw new Error(`unknown outcome ${outcome}`)
  }
})
```

After, with a custom parameter type carrying the conversion:

```javascript
Then('the loan is {outcome}', function (expected) {
  expect(this.lastResult.outcome).toEqual(expected)
})
```

The branch disappeared because the parameter type now owns the mapping,
and an unknown word fails to match rather than reaching a runtime error.

## Refactor: near-duplicate steps

Before, three definitions:

```gherkin
Given a premium member exists
Given a standard member exists
Given a staff member exists
```

After, one:

```javascript
Given('a {tier} member exists', async function (tier) {
  this.member = await this.build.member({ tier })
})
```

Merge when the steps mean the same thing with a different value. Do not
merge when they read the same but mean different things; widening a
pattern to absorb an unrelated step is how ambiguous matches start.

## Organising the files

Group step definitions by the domain area they serve, mirroring the feature
files: `lending.steps`, `reservations.steps`, `fees.steps`. Do not group by
keyword; a file of every `Given` in the suite tells nobody anything.

Keep genuinely universal steps, such as authentication or clock control, in
one small shared file and resist adding to it. A large shared file is where
ambiguous matches breed.

The task and driver layers are ordinary application code and belong in
ordinary source directories, not buried under the test tree, precisely
because they should be usable outside it.

## Assertions

Assert in `Then` steps only. A `Given` that asserts turns a setup failure
into something that looks like a behavioural failure, and the report points
at the wrong place.

Assert on the outcome the step text names, and nothing else. A `Then` that
checks five things is hiding four assertions the specification never
claimed.

Use the assertion library's own message where possible; a failure that
prints expected and actual values costs nothing extra and saves the first
minute of every investigation.

Where a `Then` needs the result of the `When`, read it from the scenario
context rather than performing the action again. Re-performing it tests
the action twice and can pass while the original attempt failed.
