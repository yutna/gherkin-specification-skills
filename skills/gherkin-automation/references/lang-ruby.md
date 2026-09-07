# Ruby

Notes for the original Cucumber implementation, where the conventions the
rest of the ecosystem copied were first established.

## Contents

- [Project shape](#project-shape)
- [Defining steps](#defining-steps)
- [The World](#the-world)
- [Custom parameter types](#custom-parameter-types)
- [Hooks](#hooks)
- [Data tables and doc strings](#data-tables-and-doc-strings)
- [Rails and Rack applications](#rails-and-rack-applications)
- [Profiles](#profiles)
- [Parallel runs](#parallel-runs)
- [Pitfalls](#pitfalls)

## Project shape

```text
features/
  lending.feature
  step_definitions/
    lending_steps.rb
  support/
    env.rb
    world.rb
    hooks.rb
lib/
  tasks/
  drivers/
```

Everything under `features/support` loads first, then everything under
`features/step_definitions`. `env.rb` loads before the rest of `support`,
which is the place for anything the other support files depend on.

The layout is convention rather than configuration, so a step definition
file anywhere under `features/` is loaded. That is convenient and is also
why large suites accumulate steps nobody can find.

## Defining steps

```ruby
Given('{member} has a loan {int} days overdue') do |member, days|
  tasks.lending.create_overdue_loan(member, days)
end

When('{member} borrows {string}') do |member, title|
  @last_result = tasks.lending.borrow(member, title)
end

Then('the loan is {outcome}') do |expected|
  expect(@last_result.outcome).to eq(expected)
end
```

`Given`, `When`, and `Then` are aliases of the same method, so a step
defined with one matches text written with any. That is deliberate: the
keyword is documentation for the reader, not part of the match.

Blocks are evaluated in the World instance, so instance variables and
World methods are available without ceremony.

## The World

A fresh World object is created for each scenario, which is where the
isolation comes from. Instance variables set in one scenario are gone by
the next.

Extend it with modules rather than defining methods globally:

```ruby
module LibraryWorld
  def tasks
    @tasks ||= Tasks.new(drivers)
  end

  def drivers
    @drivers ||= Drivers.new
  end
end

World(LibraryWorld)
```

Several `World(...)` calls compose, so helpers can be grouped by concern.
Keep the surface small; a World with forty methods is a global namespace
in disguise.

Never use a class variable or a constant for scenario state. Both survive
the scenario and reintroduce coupling.

## Custom parameter types

```ruby
ParameterType(
  name: 'member',
  regexp: /Priya|Marcus|Ana/,
  transformer: ->(name) { Member.named(name) }
)

ParameterType(
  name: 'outcome',
  regexp: /recorded|refused/,
  transformer: ->(word) { word.to_sym }
)
```

Transformers are evaluated in the World, so a type can look something up
rather than only converting a string. Define them in `support`, where they
load before the step definitions that use them.

Regular expressions still work for step patterns and remain common in
older suites. New steps should use expressions; they read better in the
step definition file and produce typed arguments.

## Hooks

```ruby
Before do
  drivers.database.begin
end

Before('@browser') do
  drivers.browser.launch
end

After do |scenario|
  attach(drivers.browser.screenshot, 'image/png') if scenario.failed?
  drivers.database.rollback
end

AfterStep do |result|
  # useful for tracing; keep it cheap
end
```

Hooks run in definition order, and `After` hooks run in reverse, so the
nesting works out. Tagged hooks take a tag expression, so
`Before('@browser and not @mobile')` is valid.

`AfterConfiguration` and `at_exit` handle once-per-run work. Anything
placed there must tolerate being run once per process when the suite is
sharded.

## Data tables and doc strings

```ruby
Given('the catalogue contains:') do |table|
  table.hashes.each { |row| build.title(row) }
end
```

- `table.hashes` gives an array of hashes keyed by the header row.
- `table.raw` gives an array of arrays including the header.
- `table.rows_hash` gives one hash from a two-column vertical table.
- `table.diff!(actual)` compares and raises with a readable difference,
  which is far better than an equality failure on an array.

A doc string arrives as a plain string argument.

## Rails and Rack applications

For a Rails suite, the generator wires transactional scenarios by default:
each scenario runs in a transaction that is rolled back afterwards. That
gives fast, complete isolation and is the right default.

It stops working when the scenario spans processes, which is what happens
as soon as a real browser drives the application. In that case switch to a
truncation or deletion strategy for the affected scenarios, usually
selected by tag, and accept that they run more slowly.

Drive setup through models or service objects rather than the interface.
A scenario that clicks through registration to reach a borrowing rule pays
for registration on every run and fails whenever registration changes.

## Profiles

`cucumber.yml` holds named profiles, which is the idiomatic place for the
run-time choices that should never appear as tags in a feature file:

```yaml
default: --format pretty --tags 'not @wip'
ci: --format progress --format junit --out reports --tags 'not @manual'
wip: --tags '@wip' --wip
```

The `--wip` option inverts the exit status, failing the run if a tagged
scenario unexpectedly passes. It is a genuinely useful way to track
scenarios agreed but not yet implemented, without leaving them silently
green.

## Parallel runs

There is no built-in parallel runner. Teams shard by feature file across
processes, usually with a helper gem, and give each process its own
database and its own port.

The prerequisites are the ordinary ones: no class variables or constants
holding state, identifiers unique across processes, and per-process
resources. Ruby's convention of a fresh World per scenario means the glue
is usually already clean; the application and the database are where
contention appears.

## Pitfalls

- Class variables or constants holding scenario state.
- A World grown into a grab bag of unrelated helpers.
- Step definitions scattered across many files with no naming convention,
  so nobody can find whether a step already exists.
- Transactional scenarios left enabled for browser-driven scenarios, where
  they silently do not isolate.
- Regular expression steps without anchors, matching more than intended.
- `@wip` scenarios left in the suite without the profile that tracks them.
- Driving setup through the interface when a model call would do.
