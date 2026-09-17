# Changelog

All notable changes to this project are recorded here. The format follows
the common keep-a-changelog conventions, with one difference: entries are
written as labelled bullets rather than as repeated subheadings, because
repeated headings collide with the Markdown linting rules this repository
runs.

This project adheres to semantic versioning.

## 2.0.1

Released 2026-09-18.

- Fixed: installing the plugin no longer runs npm on the installer's
  machine. A `package-lock.json` at a plugin's root makes
  `claude plugin install` install that package's dependencies, so every
  user was getting this repository's 83 dev packages — about 18 MB of
  Markdown linting and Gherkin parsing tooling they never run. The plugin
  now lives in `plugin/`, leaving `package.json` and the lock file
  outside it, and `npm test` fails if either reappears there. Nothing
  about the installed skills changes.
- Changed: skills moved from `skills/` to `plugin/skills/`, and the
  plugin manifest from `.claude-plugin/plugin.json` to
  `plugin/.claude-plugin/plugin.json`. The marketplace manifest stays at
  the repository root. Installing by hand now copies
  `plugin/skills/<name>/`; every documented command is unchanged.

## 2.0.0

Released 2026-09-18.

This release drops Codex support. Skills installed under
`~/.agents/skills` keep working, because nothing about the files
themselves changed, but the repository no longer ships Codex manifests
and the installer no longer writes to that directory.

- Removed: Codex support. `.codex-plugin/` and `.agents/` are gone, and
  `install.sh` lost `--claude-only` and `--codex-only` because there is
  now one destination.
- Changed: `install.sh` copies into `~/.claude/skills` and creates no
  symlink; `link-local.sh` links only `.claude/skills`.
- Changed: the frontmatter validator accepts the keys Claude Code
  documents rather than a six-key portable subset, checks `description`
  and `when_to_use` against the 1536-character budget they share, and
  reserves the name `synced`.
- Changed: the `interface` block moved from the Codex manifest into
  `.claude-plugin/plugin.json`, where Claude Code plugin listings use it.
- Fixed: project instructions moved from `AGENTS.md` to `CLAUDE.md`.
  Claude Code does not read `AGENTS.md`, so none of the repository's
  constraints had been reaching an agent working in it.
- Fixed: six factual errors in the language reference files. `lang-dotnet`
  named neither SpecFlow nor Reqnroll while telling the reader to migrate
  between them; `lang-java` referenced a non-existent
  `DataTableEntryDefinition` and never named
  `junit-platform.properties`; `lang-python` claimed step modules need a
  `test_` prefix; `lang-ruby` recommended `AfterConfiguration`, removed
  in cucumber-ruby 8.0; `lang-javascript` typed the World in a way the
  documentation does not use.
- Fixed: the smell headings in `gherkin-scenario-review` now match
  `smell-catalogue.md`, so a smell leads to its rewrite. None of the
  fifteen matched before.
- Added: `argument-hint` on every skill, so each shows what it expects in
  the slash menu.
- Added: a check that the version in `package.json`, both manifests, and
  all five skills agree. Nothing previously compared them.
- Added: `SECURITY.md`, stating what is in scope and how to report a
  vulnerability privately.
- Added: `.gitattributes`, normalising line endings and keeping the shell
  and Node scripts checked out with LF on every platform.

## 1.0.0

Released 2026-09-07.

- Added: `gherkin-discovery`, for turning a vague requirement into agreed
  rules, examples, and open questions.
- Added: `gherkin-scenario-writing`, covering the full keyword set,
  declarative phrasing, naming, outlines, tables, doc strings, tags, and
  localisation.
- Added: `gherkin-scenario-review`, with a smell catalogue that supplies
  the rewrite for each defect, plus a review rubric and suite triage
  order.
- Added: `gherkin-automation`, covering Cucumber Expressions, custom
  parameter types, the step-task-driver layering rule, scenario state,
  test data, isolation, determinism, and per-language notes for
  JavaScript, Java, Python, .NET, Go, and Ruby.
- Added: `gherkin-suite-design`, covering folder layout, feature
  granularity, tag taxonomy, living documentation, continuous
  integration, suite health metrics, and migration.
- Added: installation for Claude Code as a plugin, for Codex through its
  own manifests and skill directories, and through a shared install
  script.
- Added: validation scripts that check skill frontmatter against the
  portable Agent Skills subset and parse every published Gherkin example.
