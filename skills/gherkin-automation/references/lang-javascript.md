# JavaScript and TypeScript

Notes for running Gherkin on Node, including the browser-driver
integrations that most teams reach for.

## Contents

- [Runners](#runners)
- [Project shape](#project-shape)
- [Defining steps](#defining-steps)
- [The World](#the-world)
- [Custom parameter types](#custom-parameter-types)
- [Hooks](#hooks)
- [Data tables and doc strings](#data-tables-and-doc-strings)
- [TypeScript](#typescript)
- [Parallel runs](#parallel-runs)
- [Browser integration](#browser-integration)
- [Pitfalls](#pitfalls)

## Runners

Two mainstream choices.

The reference implementation runs feature files directly, owns its own
World, and integrates with browser drivers through your own code. It is
the right default when the suite is not primarily a browser suite.

The other approach layers Gherkin on top of a browser test runner,
generating that runner's tests from feature files. It inherits the browser
runner's fixtures, parallelism, tracing, and reporting, which is a large
practical advantage for a browser-first suite. The trade is that scenario
lifecycle follows the host runner's model rather than the classic one.

Pick one per repository. Running both means two World models and two sets
of hooks.

## Project shape

```text
features/
  lending.feature
  reservations.feature
support/
  world.js
  hooks.js
  parameter-types.js
steps/
  lending.steps.js
  reservations.steps.js
src/
  tasks/
  drivers/
```

The task and driver layers sit under `src/`, not under the test tree,
because they are ordinary application code and should be usable outside the
suite.

## Defining steps

```javascript
import { Given, When, Then } from '@cucumber/cucumber'

Given('{member} has a loan {int} days overdue', async function (member, days) {
  await this.tasks.lending.createOverdueLoan(member, days)
})

When('{member} borrows {string}', async function (member, title) {
  this.lastResult = await this.tasks.lending.borrow(member, title)
})

Then('the loan is {outcome}', function (expected) {
  expect(this.lastResult.outcome).toBe(expected)
})
```

Use `function` rather than an arrow function for step bodies in the
classic runner. Arrow functions do not bind `this`, so the World is
unreachable, and the resulting error is confusing.

Return a promise or use `async`. Callback style still works and is not
worth using in new code.

## The World

The World is constructed fresh per scenario, which is what makes isolation
free.

```javascript
import { setWorldConstructor, World } from '@cucumber/cucumber'

class LibraryWorld extends World {
  constructor (options) {
    super(options)
    this.drivers = createDrivers()
    this.tasks = createTasks(this.drivers)
    this.build = createBuilders(this.drivers)
  }
}

setWorldConstructor(LibraryWorld)
```

Anything a step needs to pass to a later step goes on `this`. Nothing goes
in a module-level variable, ever; module scope is shared across every
scenario in the process.

`this.parameters` carries values from the runner configuration, which is
the clean way to pass a base URL or an environment name.

## Custom parameter types

```javascript
import { defineParameterType } from '@cucumber/cucumber'

defineParameterType({
  name: 'member',
  regexp: /Priya|Marcus|Ana/,
  transformer (name) {
    return Member.named(name)
  },
})
```

The transformer runs with the World as `this` when declared as a method
rather than an arrow function, which lets a type look something up rather
than only converting a string.

## Hooks

```javascript
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber'

Before(async function () {
  await this.drivers.database.begin()
})

After(async function ({ result }) {
  if (result.status === 'FAILED') {
    this.attach(await this.drivers.browser.screenshot(), 'image/png')
  }
  await this.drivers.database.rollback()
})

Before({ tags: '@browser' }, async function () {
  await this.drivers.browser.launch()
})
```

`BeforeAll` and `AfterAll` run once per worker process, not once per suite.
Anything placed there must be safe to do several times when running in
parallel.

Attach diagnostics rather than logging. Attachments appear in the report
next to the failing scenario.

## Data tables and doc strings

```javascript
Given('the catalogue contains:', async function (table) {
  for (const row of table.hashes()) {
    await this.build.title(row)
  }
})
```

- `table.hashes()` gives an array of objects keyed by the header row.
- `table.raw()` gives an array of arrays, header included.
- `table.rowsHash()` gives one object from a two-column vertical table.

A doc string arrives as a plain string in the same last-argument position.

## TypeScript

Type the World and register it once; every step body then gets
completion on `this`.

```typescript
declare module '@cucumber/cucumber' {
  interface World {
    tasks: Tasks
    drivers: Drivers
    lastResult?: LoanResult
  }
}
```

Compile ahead of time, or use a loader configured in the runner's own
options. Source maps are worth the setup: without them, stack traces point
at compiled output and every investigation starts with a translation step.

## Parallel runs

The classic runner parallelises by scenario across worker processes.
Before enabling it:

- Ensure identifiers are unique across processes, not just within one.
- Give each worker its own browser instance and temporary directory.
- Check that `BeforeAll` work is idempotent, since it runs per worker.

The browser-runner integration inherits that runner's parallelism model
instead, which is usually per file rather than per scenario.

## Browser integration

Keep the browser out of the step definitions entirely. A driver owns the
page object, and the task layer speaks in domain terms.

Two habits pay for themselves quickly. Wait on conditions the driver
exposes, never on fixed durations. And drive setup through the API even in
a browser suite, reserving the interface for the behaviour actually under
test; a scenario that clicks through registration to test borrowing is
paying for registration on every run.

## Pitfalls

- Arrow functions in step bodies, which silently lose the World.
- Module-level variables holding scenario state, which work until the day
  parallelism is enabled.
- Forgetting to await inside a loop, so the step returns before its work
  finishes and the failure surfaces in a later scenario.
- Mixing the two runner styles in one repository.
- `BeforeAll` used for per-scenario setup, which then leaks across
  scenarios within a worker.
- Leaving generated step snippets unedited, so the glue grows a layer of
  bodies that only throw.
