# Agent instructions

This repository contains Agent Skills. Read this before changing
anything in it.

## What is here

`plugin/skills/<name>/SKILL.md` is the single source of truth for each
skill. Every other file — the manifests, the install script, this file —
points at those directories. Nothing duplicates skill prose, and a change
that would require editing the same sentence in two places is a sign the
structure is wrong.

Everything the plugin ships lives under `plugin/`. The repository's own
tooling stays outside it, for the reason given under "Files you should
not create".

The five skills are `gherkin-discovery`, `gherkin-scenario-writing`,
`gherkin-scenario-review`, `gherkin-automation`, and
`gherkin-suite-design`. Their `SKILL.md` frontmatter describes when each
one applies.

## Before you finish any change

```bash
npm test
```

That runs Markdown linting, skill frontmatter validation, and Gherkin
parsing. All three must pass. Run them as you write, not once at the end;
the line-length rule in particular is easier to satisfy while drafting
than to retrofit.

`npm test` does not check the lock file, but continuous integration
installs with `npm ci`, which fails when `package.json` and
`package-lock.json` disagree. Change a dependency by running
`npm install`, never by editing `package.json` alone.

## Hard constraints

These are not preferences, and a change that breaks one will be rejected.

- **Markdown must pass `markdownlint` default rules.** There is no
  configuration file, and inline suppression comments are forbidden.
  Adding either to make a file pass is not an acceptable fix; rewrite the
  content instead.
- **Frontmatter stays inside the set Claude Code documents.** The
  validator lists them; the ones used here are `name`, `description`,
  `license`, `metadata`, and `argument-hint`. A key outside the set is a
  hard validation error, because it is either a typo or a feature this
  runtime does not have.
- **Skill content is English only.**
- **Dependencies are pinned to an exact version, never a range.** A caret
  range lets a patch release change what `markdownlint` reports, and this
  repository forbids lint configuration, so the build can turn red with no
  content change. `.npmrc` sets `save-exact`; `npm test` fails on a range
  that was added by hand.
- **No citations.** Do not add book titles, author names, publisher
  names, or bibliographic references to any tracked file.
- **Every fenced `gherkin` block must parse.** The validator wraps
  fragments automatically, so a snippet of bare steps is fine, but broken
  syntax fails the build.

## Writing rules that follow from the linter

The default rules bite in specific ways. The ones that catch people out:

- Lines are capped at 80 characters, and the cap covers code blocks and
  tables as well as prose.
- Heading text must be unique within a file, across all levels. Do not
  repeat "Example", "Good", or "Why" as headings; use list items with
  bold labels instead.
- No inline HTML at all. HTML comments are permitted.
- A line consisting only of emphasis is treated as a heading unless it
  ends in punctuation, so write `**Note:** ...` rather than `**Note**`.
- Every fence needs a language tag.
- A code block inside a numbered list must be indented to the item's
  content column, or the numbering restarts.
- Command examples must not use a `$` prompt prefix.
- Link text may not be `here`, `link`, `click here`, or `more`.
- Because tables are also capped at 80 characters, wide comparison tables
  are not viable. Use headings and lists.

## House style for skills

- `SKILL.md` opens with a single level-one heading and stays under about
  500 lines. Overflow goes to `references/`, one level deep.
- Reference files longer than 100 lines start with a contents list.
- `description` is third person, names what the skill covers and the
  situations that should trigger it, and is clearly distinct from the
  other four so routing works.
- Examples are written fresh, in neutral domains such as library lending,
  bike share, parking, or subscription billing. Rotate domains rather
  than building one running example.
- Cover more than web interfaces. API, batch, and event-driven examples
  earn their place, because that is where teams conclude the technique
  does not fit them.

## Adding a skill

1. Create `plugin/skills/<name>/SKILL.md` with the frontmatter above.
1. Run `npm test`.
1. Check the description does not overlap an existing skill's triggers.
   Two skills that could both claim a task means neither will be chosen
   reliably.

The manifest needs no change. `plugin/.claude-plugin/plugin.json` declares
`"skills": "./skills/"`, so a new directory is discovered without being
listed anywhere. The version in its frontmatter must match
`package.json`; `npm test` fails if it does not.

## The two script pairs

`scripts/install.sh` and `scripts/install.ps1` do the same job, as do
`scripts/link-local.sh` and `scripts/link-local.ps1`. This is the one
place the repository deliberately keeps two implementations of the same
thing, because a Windows user may have neither a shell nor WSL. Change
one and change the other in the same commit, and keep their output
wording identical so a bug report reads the same from either.

## Working locally

```bash
./scripts/link-local.sh
```

This links `plugin/skills/` into `.claude/skills/` so an agent working in
this repository can load them. That directory is gitignored. Remove the
links with `./scripts/link-local.sh --remove`. On Windows the equivalent
is `.\scripts\link-local.ps1`, with `-Remove`.

## Files you should not create

- Any `markdownlint` configuration file.
- A second copy of skill content in another format.
- `plugin/package.json` or `plugin/package-lock.json`. A lock file at the
  plugin's root makes `claude plugin install` run npm on the machine of
  everyone who installs the plugin, pulling this repository's dev tooling
  for no benefit. That is why `plugin/` exists at all. `npm test` fails if
  either file appears there.
- `SOURCES.md` is gitignored by design. Do not commit it, and do not add
  its contents to any tracked file.
