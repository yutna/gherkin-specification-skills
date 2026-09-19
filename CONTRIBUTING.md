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

Node 20 or later, and nothing else. `mise.toml` pins the version this is
developed on, so `mise install` sets it up if you use mise. Continuous
integration runs the checks on both that version and the 20 floor
declared in `package.json`, so either works.

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
fit the 1536-character budget it shares with `when_to_use`, `license`
must be `MIT`, `metadata.version` must match `package.json`, and no
frontmatter key may fall outside the set Claude Code documents. The
validator holds that list; adding a key it rejects means the key is
either a typo or a feature this runtime does not have.

**Gherkin validation** extracts every fenced `gherkin` block in the
repository and parses it. Fragments are wrapped automatically, so a few
bare steps are fine, but anything that would not parse fails the build.

Continuous integration installs with `npm ci`, which refuses to run when
`package.json` and `package-lock.json` disagree. So a change to any
dependency version has to be made by running `npm install`, not by
editing `package.json` by hand.

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

1. Create `plugin/skills/<name>/SKILL.md`.
1. Run `npm test`.

No manifest edit is needed. `plugin/.claude-plugin/plugin.json` declares
`"skills": "./skills/"`, so a new directory is picked up automatically.
Its `metadata.version` must match `package.json`, or `npm test` fails.

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

## Security

Do not report a suspected vulnerability as a public issue. `SECURITY.md`
describes what is in scope and how to report it privately.
