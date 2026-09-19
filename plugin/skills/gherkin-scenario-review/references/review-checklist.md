# Review checklist and triage

The rubric expanded into questions with a stated remedy, plus what to do
when a whole suite needs work and there is no time to fix all of it.

## Contents

- [Using the checklist](#using-the-checklist)
- [Structure and coverage](#structure-and-coverage)
- [Altitude](#altitude)
- [Independence](#independence)
- [Data](#data)
- [Language](#language)
- [Automation seams](#automation-seams)
- [Triaging a whole suite](#triaging-a-whole-suite)
- [Reviewing a pull request](#reviewing-a-pull-request)
- [What not to raise](#what-not-to-raise)

## Using the checklist

Read down the list once per file. Anything answered no is a candidate
finding, not an automatic one; the remedy attached to each entry says
whether it is worth raising. A review of more than three or four findings
will be skimmed, so rank ruthlessly before writing anything.

## Structure and coverage

- Does the feature name a capability rather than a screen or a class? If
  not, the file boundary is wrong and individual rewrites will not help.
- Read the scenario names alone, in order. Do they describe what the
  capability does? If the list reads as test activities, fix the names
  before anything else; it is the cheapest large improvement available.
- Does every rule have a scenario where it refuses something? A file of
  successes demonstrates no rules. If nobody can say what the refusal is,
  raise it as a discovery gap, not a wording problem.
- Are the obvious probes covered: the boundary, the empty case, the
  repeated request, the forbidden actor? Missing coverage is worth more
  than any phrasing finding.
- Is anything specified twice? Duplicates mean a rule change will update
  one of them.

## Altitude

- Does any step name a selector, element id, button label, URL, screen,
  table, column, class, or method? Unless the contract itself is the
  subject, this is the highest-cost defect in the file.
- Does any step mention waiting, sleeping, retrying, or a timeout? Those
  belong in the step definitions without exception.
- Could a `Then` be satisfied by something other than the rule holding? A
  banner appearing is not evidence that a loan was recorded.
- Would the person who requested the feature recognise every step as part
  of what they asked for?

## Independence

- Can each scenario run alone? Try naming one at random and asking what it
  assumes.
- Can the scenarios run in any order? Any that reads as step two of
  something is coupled.
- Does any scenario depend on data left behind by another, including data
  created in an earlier feature file?
- Does the `Background` contain anything that only some scenarios need?
- Is there exactly one `When` in each scenario?

## Data

- Is every `Examples` column load-bearing? A constant column is noise.
- Does every outline have more than one row?
- Do the outline rows demonstrate one rule, or several with a column
  switching the assertion?
- Are the rows arranged so a boundary is visible, rather than three
  arbitrary values?
- Does any literal value appear with no stated meaning? Name the concept
  unless the number itself is the rule.
- Do table rows all have the same cell count, and is any intended null
  actually an empty string?

## Language

- Does the vocabulary match the words the business uses, consistently
  across the file and between files?
- Is one concept ever given two names, such as loan and rental?
- Do the scenario names avoid "should", "verify", "check", and "test"?
- Would somebody outside the delivery team understand the file without
  help? This is the summary question; if the answer is no, at least one of
  the findings above explains why.

## Automation seams

Some defects are visible in the feature file but live in the glue. Note
them for the automation work rather than trying to fix the wording:

- A step that reads like a business statement but is known to click a
  specific control has a step definition doing too much.
- Two steps with near-identical wording usually mean a missing parameter.
- A step that appears in exactly one scenario and reads oddly is often
  glue that leaked upward.
- Tags encoding environments or browsers belong in the runner
  configuration.

## Triaging a whole suite

When everything needs work, fix in this order. Each stage makes the next
cheaper, and stopping after any of them leaves the suite better than it
was.

1. **Independence.** Remove order dependence first. Until scenarios can run
   alone, nothing else can be verified and the suite cannot be run in
   parallel.
1. **Names.** Rewrite feature and scenario names. This is fast, needs no
   automation changes, and immediately makes the remaining problems
   visible.
1. **Altitude, worst first.** Rewrite the most-repeated imperative
   sequences. One rewrite of a sign-in sequence used by forty scenarios
   pays for itself immediately.
1. **Missing refusals.** Add the scenario where each rule bites. This
   usually needs a conversation, so start it early.
1. **Data.** Collapse duplicate scenarios, split fused outlines, remove
   dead columns.
1. **Boundaries.** Split oversized features. Leave this until last; it is
   the most disruptive and the least urgent.

Do not attempt all six in one pull request. One stage per change keeps the
diff reviewable and lets the team stop at any point.

## Reviewing a pull request

Scope the review to what changed, with one exception: if the change adds a
scenario to a file whose existing scenarios are order-dependent, say so,
because the new scenario will inherit the problem.

Lead with the finding that will cost the team most often. Show the rewrite
rather than describing it. Mark clearly which findings block the merge and
which are notes for later; a review that does not say will be treated as
though everything blocks, and merged around next time.

If the change adds scenarios for rules that were never agreed, say that
plainly and stop. Proposing wording for an unagreed rule invents a
decision the reviewer is not entitled to make.

## What not to raise

Credibility is finite. These are not worth spending it on:

- Phrasing preferences where both versions are declarative and clear.
- The choice between `Scenario` and `Example`, or between `And` and `*`.
- Table alignment and whitespace.
- Whether a `Background` of two obviously shared steps should be inlined.
- Scenario length, when the steps are all necessary.
- An imperative step in a scenario whose subject genuinely is the
  interface, such as a keyboard navigation rule.
- A number left as a literal where the number is the rule being
  demonstrated.

Raising these alongside real defects makes the real defects easier to
ignore.
