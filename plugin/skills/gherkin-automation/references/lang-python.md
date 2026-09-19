# Python

Two mainstream runners with genuinely different models. The choice matters
more here than in most ecosystems.

## Contents

- [Choosing a runner](#choosing-a-runner)
- [Project shape](#project-shape)
- [The pytest-based runner](#the-pytest-based-runner)
- [The standalone runner](#the-standalone-runner)
- [Sharing state](#sharing-state)
- [Custom parameter types](#custom-parameter-types)
- [Hooks](#hooks)
- [Data tables and doc strings](#data-tables-and-doc-strings)
- [Parallel runs](#parallel-runs)
- [Async code](#async-code)
- [Pitfalls](#pitfalls)

## Choosing a runner

**pytest-bdd** turns scenarios into pytest tests. Fixtures,
parametrisation, plugins, parallel execution, and reporting all come from
pytest, and the suite lives alongside ordinary unit tests. Choose it when
the project already uses pytest, which is almost always.

**behave** is the standalone runner. It has its own execution model, its
own context object, and its own hook set, and is configured with
`behave.ini`, `.behaverc`, `setup.cfg`, or `pyproject.toml`. It is
simpler to start with and reads more like the other Cucumber
implementations. Choose it when the suite is separate from the unit
tests, or when a team already knows this model.

Do not mix them in one repository.

## Project shape

```text
tests/
  features/
    lending.feature
  step_defs/
    conftest.py
    test_lending.py
  support/
    tasks.py
    drivers.py
```

With pytest-bdd it is the module calling `scenarios()` that pytest must
collect, so that one needs a `test_` prefix. Step definitions themselves
do not: put shared ones in `conftest.py`, or in any module the test file
imports, and they load fine. The failure to watch for is a step file that
nothing imports and that pytest does not collect either, which leaves
every step in it undefined.

## The pytest-based runner

```python
from pytest_bdd import scenarios, given, when, then, parsers

scenarios("../features/lending.feature")


@given(parsers.parse("{member} has a loan {days:d} days overdue"),
       target_fixture="member")
def overdue_member(tasks, member, days):
    return tasks.lending.create_overdue_loan(member, days)


@when(parsers.parse('{member} borrows "{title}"'), target_fixture="result")
def borrows(tasks, member, title):
    return tasks.lending.borrow(member, title)


@then(parsers.parse("the loan is {outcome}"))
def loan_outcome(result, outcome):
    assert result.outcome == outcome
```

`scenarios(...)` generates one pytest test per scenario in the file. The
`target_fixture` argument is the idiomatic way to pass a value forward: the
step becomes a fixture that later steps request by name, which keeps state
explicit rather than hidden in a shared object.

`parsers.parse` handles the common cases with typed placeholders such as
`{days:d}`. `parsers.cfparse` adds Cucumber-Expression-style types, and
`parsers.re` drops to a regular expression when nothing else fits.

## The standalone runner

```python
from behave import given, when, then


@given('{member} has a loan {days:d} days overdue')
def step_overdue(context, member, days):
    context.member = context.tasks.lending.create_overdue_loan(member, days)


@when('{member} borrows "{title}"')
def step_borrow(context, member, title):
    context.result = context.tasks.lending.borrow(member, title)


@then('the loan is {outcome}')
def step_outcome(context, outcome):
    assert context.result.outcome == outcome
```

Step modules live in a `steps/` directory beside the features and are
loaded automatically regardless of their names.

The `context` object is passed to every step and to every hook. It is
layered: values set during a scenario are discarded when it ends, which
gives isolation without any explicit cleanup.

## Sharing state

With the pytest-based runner, prefer fixtures over a mutable context
object. A fixture makes the dependency visible in the signature, and
pytest handles the lifecycle.

```python
@pytest.fixture
def tasks(drivers):
    return Tasks(drivers)
```

Fixture scope is the isolation control. Default function scope gives a
fresh instance per scenario, which is what most things want. Reserve
session scope for genuinely read-only resources such as a started
application.

With the standalone runner, use `context` and rely on its layering. Set
values in the scenario layer, not in `before_all`, or they persist for the
whole run.

Never use a module-level global in either runner.

## Custom parameter types

The pytest-based runner registers types through the parser:

```python
from pytest_bdd import parsers
from parse_type import TypeBuilder

parse_outcome = TypeBuilder.make_choice(["recorded", "refused"])


@then(parsers.cfparse("the loan is {outcome:Outcome}",
                      extra_types={"Outcome": parse_outcome}))
def loan_outcome(result, outcome):
    assert result.outcome == outcome
```

The standalone runner registers them once, globally:

```python
from behave import register_type


def parse_member(text):
    return Member.named(text)


register_type(Member=parse_member)
```

Then `{member:Member}` in any step text yields a real object.

## Hooks

The standalone runner uses a dedicated `environment.py`:

```python
def before_scenario(context, scenario):
    context.drivers.database.begin()


def after_scenario(context, scenario):
    if scenario.status == "failed":
        context.drivers.browser.save_screenshot()
    context.drivers.database.rollback()


def before_tag(context, tag):
    if tag == "browser":
        context.drivers.browser.launch()
```

The pytest-based runner uses ordinary pytest fixtures with `yield`, which
gives setup and teardown in one place:

```python
@pytest.fixture(autouse=True)
def transaction(drivers):
    drivers.database.begin()
    yield
    drivers.database.rollback()
```

Teardown after `yield` runs even when the test fails, which is exactly the
property cleanup needs.

## Data tables and doc strings

The standalone runner exposes them on the context:

```python
@given('the catalogue contains:')
def step_catalogue(context):
    for row in context.table:
        context.build.title(row["title"], row["branch"], int(row["copies"]))
```

`context.table` is iterable with dictionary-style access by header, and
`context.text` holds a doc string.

With pytest-bdd, declare a `datatable` argument on the step function and
it arrives as a list of lists. The header is the first row, so a step that
wants only the data iterates from `datatable[1:]`. The argument may only
be declared on a step that actually has a table attached.

## Parallel runs

With pytest-bdd, parallelism comes from `pytest-xdist` and works at test
level, meaning per scenario. The requirements are the ordinary ones: no
globals, unique identifiers across processes, per-worker resources.

The standalone runner has no built-in parallelism. Teams normally shard by
feature file across processes in CI, which is coarser but adequate.

## Async code

For an async application, either run the event loop explicitly inside the
step, or use the async plugin appropriate to the runner. Do not create a
new event loop per step; a client created on one loop and used on another
fails in ways that look like flakiness rather than a defect.

Keep the loop on the context or in a session-scoped fixture and reuse it.

## Pitfalls

- Step modules nothing ever loads: with pytest-bdd, a step file that is
  neither `conftest.py` nor imported by a collected test; with behave, a
  file outside `steps/`.
- Module-level globals holding scenario state.
- Setting values in `before_all` that were meant to be per scenario.
- Session-scoped fixtures holding mutable state.
- Assertions inside `given` steps, which turn setup failures into
  behavioural ones.
- Bare `assert` with no message in a `then` step; a failure that prints
  only the line is a slower investigation than one that prints the values.
- Mixing the two runners in one repository.
