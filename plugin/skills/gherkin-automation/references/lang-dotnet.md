# .NET

Notes for running Gherkin on .NET, where the binding model and the
scenario-scoped container do most of the work.

## Contents

- [Runners](#runners)
- [Project shape](#project-shape)
- [Defining bindings](#defining-bindings)
- [Sharing state by injection](#sharing-state-by-injection)
- [Custom parameter types](#custom-parameter-types)
- [Hooks](#hooks)
- [Data tables and doc strings](#data-tables-and-doc-strings)
- [Asynchronous steps](#asynchronous-steps)
- [Parallel runs](#parallel-runs)
- [Living documentation](#living-documentation)
- [Pitfalls](#pitfalls)

## Runners

**Reqnroll** is the maintained runner and what new work should use. It
generates test-framework tests from feature files at build time, driven
by a test project targeting NUnit, xUnit, or MSTest. Its packages are
named `Reqnroll.*`, its namespace is `Reqnroll`, and it is configured
with `reqnroll.json`.

**SpecFlow** is its predecessor and is no longer maintained. Packages
are named `SpecFlow.*`, the namespace is `TechTalk.SpecFlow`, and the
configuration file is `specflow.json`.

Reqnroll is a continuation of the same model, so the binding attributes,
the scenario container, and the hook model below apply to both. Migration
is mostly a package swap plus renaming the namespace from
`TechTalk.SpecFlow` to `Reqnroll`; Reqnroll also still reads a
`specflow.json` left in place.

Two differences matter for the examples below, and both are called out
where they appear: `DataTable` is a Reqnroll alias that SpecFlow does not
have, and Cucumber Expressions are native to Reqnroll but reached
SpecFlow only in 4.0.

## Project shape

```text
Library.Specs/
  Features/
    Lending.feature
  Steps/
    LendingSteps.cs
  Support/
    ScenarioContext.cs
    Hooks.cs
  Library.Specs.csproj
Library/
  Tasks/
  Drivers/
```

Feature files must be included in the project so the generator sees them.
A feature file added to the folder but not to the project produces no
tests at all and no error, which is a confusing first hour.

## Defining bindings

```csharp
[Binding]
public class LendingSteps
{
    private readonly ScenarioState _state;
    private readonly LendingTasks _lending;

    public LendingSteps(ScenarioState state, LendingTasks lending)
    {
        _state = state;
        _lending = lending;
    }

    [Given(@"{member} has a loan {int} days overdue")]
    public async Task GivenOverdueLoan(Member member, int days)
    {
        await _lending.CreateOverdueLoanAsync(member, days);
    }

    [When(@"{member} borrows {string}")]
    public async Task WhenBorrows(Member member, string title)
    {
        _state.LastResult = await _lending.BorrowAsync(member, title);
    }

    [Then(@"the loan is {outcome}")]
    public void ThenOutcomeIs(Outcome expected)
    {
        Assert.Equal(expected, _state.LastResult.Outcome);
    }
}
```

The `[Binding]` attribute is what makes a class discoverable. A step class
without it is silently ignored and every step in it reports as undefined.

Cucumber Expressions and regular expressions are both accepted by
Reqnroll. SpecFlow gained Cucumber Expressions natively only in 4.0;
on 3.x they need a separate plugin package. The runner decides which by
inspecting the pattern, so a pattern containing regular expression
metacharacters is treated as a regular expression even when an expression
was intended. Keep patterns unambiguous.

## Sharing state by injection

The container creates one instance of each binding class per scenario, and
any type appearing in a binding constructor is created once per scenario
and shared among that scenario's bindings.

```csharp
public class ScenarioState
{
    public LoanResult? LastResult { get; set; }
}
```

That is the whole mechanism. Use it instead of static fields, and instead
of the untyped dictionary the framework also offers; a typed class gives
compile-time errors rather than key-not-found failures at run time.

Register anything needing configuration in a `[BeforeScenario]` hook or
through the container's own registration point, so drivers can be swapped
for a different environment.

## Custom parameter types

```csharp
[Binding]
public class ParameterTypes
{
    [StepArgumentTransformation(@"(Priya|Marcus|Ana)", Name = "member")]
    public Member ToMember(string name) => Member.Named(name);

    [StepArgumentTransformation(@"(recorded|refused)", Name = "outcome")]
    public Outcome ToOutcome(string word) =>
        Enum.Parse<Outcome>(word, ignoreCase: true);
}
```

Two details decide whether this works, and both fail in ways that do not
say what is wrong.

The pattern needs its capturing group. The groups are what the method
receives, so `@"Priya|Marcus|Ana"` captures nothing and calls a
one-argument method with no arguments, reported as a parameter count
mismatch rather than as a pattern problem.

`Name` is what makes the transformation reachable from a Cucumber
Expression. It is the name in the braces, so `Name = "member"` is what
lets a step read `{member}`; without it the expression fails with an
undefined parameter type, and the type's own name does not stand in for
it. One unnamed transformation is enough to fail every step in the run,
so the message may name a step that is not the one at fault.

A transformation with no pattern still applies to any argument of that
type in a regular-expression step, which is a compact way to convert
every date or money value in the suite in one place. A Cucumber
Expression cannot use it: with nothing to match, there is no parameter
type to name.

## Hooks

```csharp
[Binding]
public class Hooks
{
    private readonly Drivers _drivers;

    public Hooks(Drivers drivers) => _drivers = drivers;

    [BeforeScenario(Order = 0)]
    public Task Begin() => _drivers.Database.BeginAsync();

    [BeforeScenario("@browser", Order = 10)]
    public Task LaunchBrowser() => _drivers.Browser.LaunchAsync();

    [AfterScenario]
    public async Task Finish(ScenarioContext context)
    {
        if (context.TestError is not null)
        {
            await _drivers.Browser.CaptureAsync();
        }
        await _drivers.Database.RollbackAsync();
    }
}
```

Hook order is explicit through `Order`, which matters as soon as there is
more than one. `[BeforeTestRun]` and `[AfterTestRun]` are static and run
once per test process, so under parallel execution they run once per
process, not once per suite.

## Data tables and doc strings

```csharp
[Given(@"the catalogue contains:")]
public void GivenCatalogue(DataTable table)
{
    foreach (var title in table.CreateSet<TitleRow>())
    {
        _build.Title(title);
    }
}
```

`DataTable` is Reqnroll's alias for the older `Table` class, added to
match Gherkin's own term. On SpecFlow the parameter type is `Table`;
Reqnroll accepts either.

The assist helpers do most of the conversion work: `CreateSet<T>` for a
list, `CreateInstance<T>` for a vertical table, and comparison helpers for
asserting a table against a collection.

Table comparison helpers are worth knowing about. Asserting an expected
table against actual results produces a failure message showing the
difference, which is far more useful than an equality failure on a
collection.

A doc string arrives as a `string` parameter in the last position.

## Asynchronous steps

Return `Task` from step methods rather than blocking. Blocking on an
asynchronous call inside a step is the most common cause of intermittent
hangs in .NET suites, and it fails differently depending on the test
framework's synchronisation context.

The same applies in hooks; they support `Task` return types for exactly
this reason.

## Parallel runs

Parallel execution is configured in the test framework, not in the Gherkin
layer, and the unit of parallelism differs: some frameworks parallelise by
class, which after generation means by feature file.

Before enabling it, remove static mutable state, make identifiers unique
across processes, and check that any file or port used by the suite is
per-worker. The generated code is designed for it, so failures under
parallelism almost always come from the glue or the application.

## Living documentation

Reqnroll carries the Cucumber HTML formatter as a dependency, so a
browsable specification is a configuration entry rather than an install:

```json
{
  "formatters": {
    "html": { "outputFilePath": "living-doc.html" }
  }
}
```

The file lands beside the test assembly and holds the scenarios as
written with the result of each. LivingDoc, the tool most .NET teams
know, belongs to SpecFlow and its plugin is tied to that discontinued
line; on Reqnroll the choices are this formatter or a third-party plugin.
Where to publish whatever is produced, and how to keep it read, belongs
to the `gherkin-suite-design` skill.

## Pitfalls

- A step class missing `[Binding]`.
- Feature files not included in the project.
- Blocking on asynchronous calls inside steps or hooks.
- Static fields holding scenario state.
- The untyped context dictionary used where a typed injected class would
  give compile-time safety.
- `[BeforeTestRun]` used for per-scenario setup.
- A pattern intended as a Cucumber Expression being read as a regular
  expression because it contains metacharacters.
