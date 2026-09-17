# Java and the JVM

Notes for running Gherkin on the JVM, where dependency injection does most
of the work that other ecosystems do by hand.

## Contents

- [Runner setup](#runner-setup)
- [Project shape](#project-shape)
- [Defining steps](#defining-steps)
- [Sharing state by injection](#sharing-state-by-injection)
- [Custom parameter types](#custom-parameter-types)
- [Hooks](#hooks)
- [Data tables and doc strings](#data-tables-and-doc-strings)
- [Spring integration](#spring-integration)
- [Parallel runs](#parallel-runs)
- [Other JVM languages](#other-jvm-languages)
- [Pitfalls](#pitfalls)

## Runner setup

The modern approach runs feature files through the JUnit Platform's own
test engine, discovered like any other test, with configuration in
`src/test/resources/junit-platform.properties` rather than annotations on
a runner class. The filename matters: the engine reads its settings only
from that file.

```properties
cucumber.glue=com.example.library.steps
cucumber.plugin=pretty, html:target/report.html
cucumber.publish.quiet=true
```

Point the engine at the features with a suite class rather than with a
`cucumber.features` property. Setting that property makes the engine
ignore every JUnit Platform discovery selector, which can run the whole
suite more than once.

```java
@Suite
@IncludeEngines("cucumber")
@SelectDirectories("src/test/resources/features")
class RunCucumberTest {
}
```

The older annotated runner class still works and is worth migrating away
from: engine-based discovery gives better tooling integration, parallel
execution, and filtering.

## Project shape

```text
src/test/resources/features/
  lending.feature
src/test/java/com/example/library/steps/
  LendingSteps.java
  ParameterTypes.java
  Hooks.java
src/test/java/com/example/library/support/
  ScenarioContext.java
src/main/java/com/example/library/tasks/
src/main/java/com/example/library/drivers/
```

Glue classes must sit in a package named by `cucumber.glue`. A step in a
package outside it is silently not found, which presents as an undefined
step and wastes a surprising amount of time.

## Defining steps

```java
public class LendingSteps {
  private final ScenarioContext context;
  private final LendingTasks lending;

  public LendingSteps(ScenarioContext context, LendingTasks lending) {
    this.context = context;
    this.lending = lending;
  }

  @Given("{member} has a loan {int} days overdue")
  public void memberHasOverdueLoan(Member member, int days) {
    lending.createOverdueLoan(member, days);
  }

  @When("{member} borrows {string}")
  public void memberBorrows(Member member, String title) {
    context.setLastResult(lending.borrow(member, title));
  }

  @Then("the loan is {outcome}")
  public void loanOutcomeIs(Outcome expected) {
    assertThat(context.lastResult().outcome()).isEqualTo(expected);
  }
}
```

Step classes must have exactly one constructor, and it must be injectable.
A second constructor produces a container error at startup rather than a
useful message.

## Sharing state by injection

Do not use static fields. The container creates a fresh instance of each
glue class per scenario, and the clean way to share state is a
scenario-scoped object injected into every class that needs it.

```java
public class ScenarioContext {
  private LoanResult lastResult;

  public void setLastResult(LoanResult result) { this.lastResult = result; }
  public LoanResult lastResult() { return lastResult; }
}
```

With the picocontainer module on the classpath, any class appearing in a
glue constructor is created once per scenario and shared among the glue
classes for that scenario. That is the whole mechanism, and it is enough
for most suites.

Keep the context small and give it named accessors. A map of strings to
objects is a global with extra steps.

## Custom parameter types

```java
public class ParameterTypes {
  @ParameterType("Priya|Marcus|Ana")
  public Member member(String name) {
    return Member.named(name);
  }

  @ParameterType("recorded|refused")
  public Outcome outcome(String word) {
    return Outcome.valueOf(word.toUpperCase(Locale.ROOT));
  }
}
```

The method name becomes the placeholder name, so `member(...)` defines
`{member}`. Types registered this way are available to every glue class.

Register a `@DefaultParameterTransformer` and a
`@DefaultDataTableEntryTransformer` when many steps convert the same
shapes; both live in `io.cucumber.java` and together they remove a great
deal of repetitive parsing.

## Hooks

```java
public class Hooks {
  private final Drivers drivers;

  public Hooks(Drivers drivers) { this.drivers = drivers; }

  @Before
  public void begin() { drivers.database().begin(); }

  @Before(value = "@browser", order = 10)
  public void launchBrowser() { drivers.browser().launch(); }

  @After
  public void finish(Scenario scenario) {
    if (scenario.isFailed()) {
      scenario.attach(drivers.browser().screenshot(), "image/png", "screen");
    }
    drivers.database().rollback();
  }
}
```

`@Before` hooks run in ascending `order`, `@After` hooks in descending
order, so setup and teardown nest correctly. `@BeforeAll` and `@AfterAll`
are static and run once per JVM, which under parallel execution means once
per fork.

## Data tables and doc strings

```java
@Given("the catalogue contains:")
public void catalogueContains(List<Map<String, String>> rows) {
  rows.forEach(build::title);
}
```

The runner converts a data table to whatever the parameter type asks for:
a list of maps, a list of lists, a single map for a vertical table, or a
list of your own type once a `@DataTableType` is registered.

```java
@DataTableType
public Title title(Map<String, String> row) {
  return new Title(row.get("title"), row.get("branch"),
      Integer.parseInt(row.get("copies")));
}
```

A doc string arrives as a `String` parameter, or as a converted type with
`@DocStringType`.

## Spring integration

Add the Spring module and annotate one glue class with
`@CucumberContextConfiguration`. Exactly one, or startup fails.

```java
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class SpringConfiguration {
}
```

Beans then inject into step classes normally. Scenario-scoped state needs
`@ScenarioScope` on the context bean; a plain singleton leaks between
scenarios and reintroduces exactly the coupling injection was meant to
avoid.

The application context is cached across scenarios, which is what keeps a
Spring suite fast. Anything that dirties it forces a restart, so avoid
`@DirtiesContext` unless it is genuinely unavoidable.

## Parallel runs

Enable it in `junit-platform.properties`. These keys are read from that
file alone, so putting them in `cucumber.properties` silently does
nothing:

```properties
cucumber.execution.parallel.enabled=true
cucumber.execution.parallel.config.strategy=fixed
cucumber.execution.parallel.config.fixed.parallelism=4
```

Then remove every static mutable field in the glue, make created
identifiers unique across threads, and check that any shared bean is
either immutable or scenario-scoped. Static state is the usual cause of a
suite that passes serially and fails in parallel.

## Other JVM languages

Kotlin and Scala have their own step-definition modules with a lambda
syntax rather than annotations. Everything above about injection, hooks,
parameter types, and parallelism applies unchanged; only the declaration
syntax differs.

In Kotlin, declare step definitions in the class body's `init` block, and
remember that the class is still instantiated per scenario.

## Pitfalls

- Glue classes outside the configured glue package, presenting as
  undefined steps.
- Static fields holding scenario state.
- More than one constructor on a glue class.
- More than one `@CucumberContextConfiguration`.
- Singleton-scoped Spring beans holding scenario state.
- `@BeforeAll` used for per-scenario setup.
- Leaving the generated snippet bodies in place, so undefined steps become
  steps that only throw.
