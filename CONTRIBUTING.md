# Contributing

Contributions are welcome, particularly corrections from people who have
run large suites and found where this advice breaks down.

## Getting set up

```bash
git clone https://github.com/yutna/gherkin-specification-skills.git
cd gherkin-specification-skills
npm install
npm test
```

Node 20 or later. There is nothing else to install.

To load the skills in an agent while you work on them:

```bash
./scripts/link-local.sh
```

## The checks

`npm test` runs three things, and all three must pass.

**Markdown linting** uses `markdownlint-cli2` with default rules. The
repository has no configuration file and no inline suppression comments,
and pull requests that add either will be asked to rewrite the content
instead. This is deliberate: the constraint keeps the prose tight and the
examples short, which suits the subject.

**Skill validation** checks every `SKILL.md`: `name` must match its
directory and be lowercase kebab-case, `description` must be present and
under 1024 characters, `license` must be `MIT`, and no frontmatter key
may fall outside `name`, `description`, `license`, `compatibility`,
`metadata`, and `allowed-tools`. That subset is what makes the same file
work in both Claude Code and Codex.

**Gherkin validation** extracts every fenced `gherkin` block in the
repository and parses it. Fragments are wrapped automatically, so a few
bare steps are fine, but anything that would not parse fails the build.

## Linting rules that catch people out

Run the linter while drafting rather than at the end. The rules that most
often need a rewrite:

- 80-character lines, applying to code blocks and tables as well as
  prose.
- Unique heading text within each file, across all levels.
- No inline HTML.
- No emphasis-only lines unless they end in punctuation.
- A language tag on every code fence.
- Code fences inside numbered lists indented to the item's content
  column.
- No `$` prompt prefix in command examples.
- No `here`, `link`, or `more` as link text.

## Writing style

Skills are read by an agent under time pressure, so:

- Say the rule, then show it. A worked example beats a paragraph of
  explanation.
- Prefer the rewrite to the criticism. A smell entry without a repair is
  half an entry.
- Keep `SKILL.md` under about 500 lines and move detail into
  `references/`, one level deep.
- Start reference files longer than 100 lines with a contents list.
- Write examples in neutral domains, and rotate them rather than building
  one running example.
- Include non-interface examples. API, batch, and event-driven cases are
  where this technique is most often wrongly dismissed.

## No citations

The repository contains no book titles, author names, publisher names, or
bibliographic references, and pull requests that add them will be asked
to remove them. Contribute the technique in your own words and your own
examples.

If a contribution reproduces text, tables, or example scenarios from a
source you did not write, it cannot be accepted under the MIT license
this repository uses.

## Proposing a new skill

Open an issue first. The main question is whether a new skill's triggers
can be stated without overlapping the existing five, because two skills
that could both claim a task means neither gets chosen reliably.

If it is accepted:

1. Create `skills/<name>/SKILL.md`.
1. Add the directory to the `skills` array in
   `.claude-plugin/marketplace.json`.
1. Run `npm test`.

## Pull requests

- One subject per pull request. A wording fix and a new skill are two
  changes.
- Say which skill you changed and why in the description.
- Run `npm test` before opening it. Continuous integration runs the same
  checks, so a red build means the local run was skipped.
- Corrections based on real experience are more valuable than additions.
  If something in here is wrong, say what you observed instead.

## Reporting a problem

Open an issue with the skill name, what you asked the agent to do, and
what it produced. A concrete transcript is worth far more than a general
report, because most problems are triggering problems rather than content
problems.

## Code of conduct

Participation is governed by `CODE_OF_CONDUCT.md`.
