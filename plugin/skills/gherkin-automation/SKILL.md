---
name: gherkin-automation
description: Implement and repair the code behind Gherkin steps. Use when writing or refactoring step definitions, wiring glue code to an application, sharing state between steps, building test data, adding hooks, diagnosing why an individual scenario is flaky or slow, resolving undefined or ambiguous step errors, or deciding what belongs in a scenario versus a unit test. Covers Cucumber Expressions, parameter types, the layering rule, isolation, determinism, and per-language notes for JavaScript, Java, Python, .NET, Go, and Ruby.
argument-hint: "[step, glue file, or failing scenario]"
license: MIT
metadata:
  version: "2.1.1"
  author: yutna
---

# Automating Gherkin

## Overview

A step definition is a translation layer, and its whole job is to be thin.
It takes one business statement, converts it into a call on something that
already knows how to do the work, and gets out of the way. Suites become
unmaintainable when step definitions grow into the application driver
instead of calling one.

The rules below are the same in every runner. Language-specific notes live
in the reference files.

## When to use this skill

- Writing the code behind new or existing steps.
- A step is undefined, pending, or ambiguous.
- A scenario is flaky, or the glue prevents running in parallel.
- State is being passed between steps badly, usually through globals.
- Test data setup has become the biggest part of the suite.
- Deciding whether a case belongs in Gherkin at all.

If the scenarios themselves read as click-by-click scripts, no amount of
glue design will save the suite; fix the wording with
`gherkin-scenario-review` first.

## The layering rule

Three layers, and each may only call the one below it.

1. **Step definitions.** Parse the step, call one task, assert nothing
   beyond what the step says. A handful of lines.
1. **Task layer.** Domain-shaped operations in the language of the
   business: register a member, borrow a title, run the overnight renewal.
   This is where the knowledge of how to do things lives.
1. **Driver layer.** Page objects, API clients, message publishers,
   database fixtures. The only place that knows about selectors,
   endpoints, topics, and tables.

A selector or an endpoint appearing in a step definition is the single
most reliable predictor that a suite will be abandoned. When the interface
changes, the fix should be one edit in the driver layer, not forty.

```javascript
Given('{actor} has a title {int} days overdue', async function (actor, days) {
  await this.tasks.lending.createOverdueLoan(actor, days)
})
```

The step definition knows nothing about how an overdue loan is made.

## Cucumber Expressions

Prefer expressions to regular expressions. They are readable by people who
do not write regular expressions, they produce typed arguments, and they
are supported across every framework listed here.

Built-in parameter types cover most needs:

- `{int}` and `{float}` for numbers.
- `{word}` for a single unquoted word.
- `{string}` for text in single or double quotes, delivered unquoted.
- `{}` for anything, when nothing narrower fits.

```javascript
When('{string} is borrowed by {word}', async function (title, member) {
  await this.tasks.lending.borrow(member, title)
})
```

Define custom parameter types for the concepts that recur in the domain.
This is where most of the value is: the conversion happens once, the step
definitions receive real objects, and the specification gains a vocabulary
the glue enforces.

```javascript
defineParameterType({
  name: 'actor',
  regexp: /Priya|Marcus|Ana/,
  transformer: (name) => Actor.named(name),
})
```

Fall back to a regular expression only when matching genuinely needs one,
such as an optional clause the expression syntax cannot express. Anonymous
capture groups that produce untyped strings are the thing to avoid.

## One step, one intent

A step definition should do one thing, and the step text should say what
that thing is.

- If the body has branches on the step text, the step is really two steps.
- If it takes more than a few lines, the task layer is missing.
- If two steps differ only by a value, they want one step with a
  parameter.
- If a step both acts and asserts, split it, because `When` and `Then` are
  separate for a reason.

Reuse is a consequence of good phrasing, not a goal in itself. Two steps
that read differently because they mean different things should stay
separate even when their bodies are identical today.

## Sharing state between steps

Steps in one scenario need to pass things along: the actor, the thing just
created, the response just received. There is exactly one safe way to do
it, and it is not a module-level variable.

Use the runner's per-scenario context, whatever it is called: a `World`, a
context object, an injected scenario-scoped instance, or a fixture. Every
framework provides one, and every one of them is constructed fresh per
scenario.

- Never store scenario state in a static, global, or module-level
  variable. It survives between scenarios, which makes order matter and
  parallel execution impossible.
- Keep the context small and named. A bag with twenty keys is a global
  wearing a disguise.
- Store the last response or the last error where a `Then` needs to assert
  on it, rather than re-performing the action.

## Test data

Two rules keep data from taking over the suite.

**Build, do not fixture.** A shared fixture file that every scenario reads
becomes a dependency nobody can change. Prefer a builder that creates
exactly what one scenario needs, with sensible defaults for everything
else.

```javascript
const member = await this.build.member({ tier: 'premium' })
```

Every unspecified attribute gets a default, so the scenario states only
what matters to its rule. When the rule is about tiers, the tier is
explicit and nothing else is.

**Make it unique.** Generate identifiers per scenario so two scenarios
running at once cannot collide. Deterministic values are fine where they
are read-only; anything created must be unique.

Isolation and cleanup strategies, including transaction rollback and the
cases where it does not work, are in
`references/test-data-and-isolation.md`.

## Hooks

Hooks run around scenarios. Use them for the mechanics that every scenario
needs and no scenario should mention.

- Before: create the context, open the connection, start the transaction.
- After: capture diagnostics on failure, then release everything.
- Tagged hooks: apply extra setup only to scenarios carrying a tag.

Two rules. Hooks must not contain anything a reader of the feature file
would need to know, because it is invisible to them. And an After hook
must run its cleanup even when the scenario failed, or one failure poisons
the rest of the run.

Attach diagnostics on failure rather than logging throughout: the failing
step, the last response, a screenshot for a browser suite. A failure that
arrives with evidence is fixed in minutes.

## Determinism

Flakiness is a design defect, not bad luck. The recurring causes:

- **Fixed waits.** Never sleep. Wait for a condition with a timeout, and
  let the driver layer own that.
- **Real clocks.** A rule about expiry needs a controllable clock. Inject
  time rather than reading it, or the suite fails at midnight and around
  daylight-saving changes.
- **Random data used in assertions.** Random values are fine for
  uniqueness and wrong for anything asserted on.
- **Shared mutable state.** Two scenarios touching one record will
  eventually run at the same moment.
- **Order dependence.** If the suite only passes in file order, it has no
  isolation.
- **Unowned asynchronous work.** A background job that finishes eventually
  will occasionally finish after the assertion. Wait for its effect, or
  run it synchronously in tests.

Run the suite with randomised scenario order on a schedule. It finds
coupling that no review will.

## Undefined, pending, and ambiguous

- **Undefined** means no definition matched. The runner usually prints a
  snippet; take it, then rewrite it to call the task layer rather than
  leaving the generated body.
- **Pending** means the step is defined but deliberately unimplemented.
  Useful while a scenario is being agreed. It must never reach the main
  branch, because a pending scenario reports as neither passing nor
  failing and quietly stops meaning anything.
- **Ambiguous** means two definitions matched. Almost always two people
  wrote the same step in different files. Merge them; do not make one of
  the patterns narrower to dodge the clash, because the next person will
  hit it again.

A step matching more broadly than intended is worth checking for
deliberately: `{}` and loose regular expressions swallow steps their author
never considered.

## What does not belong in Gherkin

A scenario costs far more than a unit test to write, read, and run. Spend
that cost only where the readability is worth something.

Belongs in Gherkin: rules a non-engineer cares about, cases where the
wording resolves a genuine disagreement, and the handful of paths that
prove the pieces work together.

Belongs in unit tests: algorithmic edge cases, every permutation of a
validation rule, error handling with no observable business consequence,
and anything whose expected value a reader would have to compute.

A useful heuristic: if nobody outside the delivery team would ever read
the scenario, it did not need to be a scenario. Twenty outline rows
exercising a date parser are a unit test that has been given a costume.

## Quick reference

- Step definitions are thin. Selectors and endpoints never appear in them.
- Cucumber Expressions over regular expressions; custom parameter types
  for domain concepts.
- One step, one intent, no branching on step text.
- Per-scenario context for shared state. No globals, ever.
- Build data per scenario with unique identifiers.
- Hooks hold mechanics only, and clean up even on failure.
- Never sleep. Inject the clock. Randomise order in CI.
- No pending steps on the main branch.
- If it does not need to be readable, it is a unit test.

## Common mistakes

- Growing a step definition into a page object.
- Passing state through module-level variables, then discovering the suite
  cannot run in parallel.
- One giant shared fixture that no scenario can change safely.
- Asserting inside a `Given`, which turns setup failures into confusing
  behavioural failures.
- Reusing a step by widening its pattern until it matches things it should
  not.
- Writing a `Then` that re-performs the action to check the result.
- Cleanup in an After hook that is skipped when the scenario fails.
- Adding retries to hide flakiness, which converts a visible defect into
  an intermittent one.
- Driving the whole suite through the interface when most rules could be
  exercised a layer below, far faster and just as truthfully.

## Reference files

- `references/step-definition-patterns.md` — expressions, parameter
  types, the task layer, and worked refactors.
- `references/test-data-and-isolation.md` — builders, uniqueness,
  cleanup, clocks, and parallel execution.
- `references/lang-javascript.md` — JavaScript and TypeScript runners.
- `references/lang-java.md` — Java and the JVM.
- `references/lang-python.md` — Python runners.
- `references/lang-dotnet.md` — .NET runners.
- `references/lang-go.md` — Go.
- `references/lang-ruby.md` — Ruby.
