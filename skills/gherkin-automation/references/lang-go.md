# Go

Notes for running Gherkin in Go, where there is no dependency-injection
container and scenario state is carried through `context.Context`.

## Contents

- [Runner setup](#runner-setup)
- [Project shape](#project-shape)
- [Defining steps](#defining-steps)
- [Sharing state](#sharing-state)
- [Typed arguments](#typed-arguments)
- [Hooks](#hooks)
- [Data tables and doc strings](#data-tables-and-doc-strings)
- [Assertions](#assertions)
- [Parallel runs](#parallel-runs)
- [Pitfalls](#pitfalls)

## Runner setup

godog runs as an ordinary Go test, which keeps the suite inside the
normal toolchain: build tags, coverage, and the race detector all work.
The notes below assume godog v0.13 or later: `ScenarioContext.Given`,
`When`, and `Then` arrived in v0.13, and `StepContext` in v0.12.

```go
func TestFeatures(t *testing.T) {
    suite := godog.TestSuite{
        ScenarioInitializer: InitializeScenario,
        Options: &godog.Options{
            Format:   "pretty",
            Paths:    []string{"features"},
            TestingT: t,
        },
    }
    if suite.Run() != 0 {
        t.Fatal("non-zero status returned, failed to run feature tests")
    }
}
```

Setting `TestingT` is what makes failures report as Go test failures and
makes assertion libraries behave correctly. Without it, a failed
assertion can abort the process rather than failing one scenario.

## Project shape

```text
features/
  lending.feature
internal/
  tasks/
  drivers/
lending_steps_test.go
main_test.go
```

Step definitions live in `_test.go` files, so they are compiled only for
tests and can stay in the package they exercise.

## Defining steps

```go
func InitializeScenario(sc *godog.ScenarioContext) {
    steps := &lendingSteps{}

    sc.Before(steps.reset)
    sc.Given(`^(\w+) has a loan (\d+) days overdue$`, steps.hasOverdueLoan)
    sc.When(`^(\w+) borrows "([^"]*)"$`, steps.borrows)
    sc.Then(`^the loan is (recorded|refused)$`, steps.loanOutcomeIs)
}

func (s *lendingSteps) borrows(
    ctx context.Context, member, title string,
) (context.Context, error) {
    result, err := s.tasks.Borrow(ctx, member, title)
    if err != nil {
        return ctx, err
    }
    return context.WithValue(ctx, lastResultKey{}, result), nil
}
```

A step returns an error rather than asserting and panicking. Returning a
non-nil error fails the scenario cleanly, with the message shown in the
report.

Patterns are regular expressions. Anchor them with `^` and `$`, or a
pattern will match steps it was never meant to, which presents as an
ambiguous or wrong match much later.

## Sharing state

There is no container and no World. State travels two ways, and mixing
them causes most of the confusion in Go suites.

The idiomatic way is `context.Context`. A step that produces something
returns a new context carrying it, and a later step reads it out:

```go
type lastResultKey struct{}

func (s *lendingSteps) loanOutcomeIs(
    ctx context.Context, expected string,
) error {
    result, ok := ctx.Value(lastResultKey{}).(LoanResult)
    if !ok {
        return errors.New("no borrow result in scenario context")
    }
    if result.Outcome != expected {
        return fmt.Errorf("expected %s, got %s", expected, result.Outcome)
    }
    return nil
}
```

Use an unexported struct type as the key, never a string, so two packages
cannot collide.

The simpler way is a struct whose methods are the step definitions, with
fields for scenario state. It reads better, but the struct must be reset
before each scenario or state leaks between them:

```go
sc.Before(func(
    ctx context.Context, _ *godog.Scenario,
) (context.Context, error) {
    *steps = lendingSteps{tasks: newTasks()}
    return ctx, nil
})
```

Pick one approach per suite. Package-level variables are never acceptable;
they break the race detector and any future parallelism.

## Typed arguments

The runner converts capture groups to the parameter types of the step
function, so declaring `days int` gives an integer without manual parsing.
An unconvertible value fails the step with a clear message.

For domain types, convert at the top of the step body and return an error
on failure. There is no equivalent of a registered custom parameter type,
so a small helper per concept is the practical substitute:

```go
func toMember(name string) (Member, error) {
    m, ok := knownMembers[name]
    if !ok {
        return Member{}, fmt.Errorf("unknown member %q", name)
    }
    return m, nil
}
```

## Hooks

```go
sc.Before(func(
    ctx context.Context, _ *godog.Scenario,
) (context.Context, error) {
    return drivers.Database.Begin(ctx)
})

sc.After(func(
    ctx context.Context, sc *godog.Scenario, err error,
) (context.Context, error) {
    if err != nil {
        drivers.Browser.Capture(ctx)
    }
    return ctx, drivers.Database.Rollback(ctx)
})

sc.StepContext().After(func(
    ctx context.Context, st *godog.Step, status godog.StepResultStatus,
    err error,
) (context.Context, error) {
    return ctx, nil
})
```

The scenario-level `After` receives the scenario error, which is the hook
to attach diagnostics from. Step-level hooks are available too and are
mainly useful for tracing.

Suite-level setup goes in `TestMain` or in the suite's own initialiser,
and runs once per test binary.

## Data tables and doc strings

A table arrives as `*godog.Table`:

```go
func (s *lendingSteps) catalogueContains(table *godog.Table) error {
    head := table.Rows[0].Cells
    for _, row := range table.Rows[1:] {
        values := map[string]string{}
        for i, cell := range row.Cells {
            values[head[i].Value] = cell.Value
        }
        if err := s.build.Title(values); err != nil {
            return err
        }
    }
    return nil
}
```

Write that header-to-map conversion once as a helper and reuse it; hand
indexing into `Cells` in every step is where off-by-one bugs live.

A doc string arrives as `*godog.DocString`, with the content in `Content`
and the content type in `MediaType`.

## Assertions

Prefer returning a descriptive error to using an assertion library. The
error message is the failure report, so include expected and actual values
in it.

Where an assertion library is used, ensure `TestingT` is set in the suite
options, or a failure will call `t.FailNow` on a goroutine the framework
does not own and behave unpredictably.

## Parallel runs

Set `Concurrency` in the suite options. The unit is the scenario, and the
requirements are the usual ones with one Go-specific addition: run the
suite with the race detector enabled, because it will find shared state
that intermittent failures would take weeks to surface.

Any struct holding step state must be per-scenario, not shared across
goroutines, which is the main reason the context-based approach is worth
the extra ceremony in a concurrent suite.

## Pitfalls

- Unanchored regular expressions matching more than intended.
- Package-level variables holding scenario state.
- A step struct reused across scenarios without being reset.
- String keys in `context.WithValue`, which collide silently.
- Panicking instead of returning an error, which loses the scenario
  context in the report.
- Forgetting `TestingT`, so assertion libraries misbehave.
- Ignoring the error returned by a driver call inside a step, so the
  scenario fails later at a confusing place.
