# Changelog

All notable changes to this project are recorded here. The format follows
the common keep-a-changelog conventions, with one difference: entries are
written as labelled bullets rather than as repeated subheadings, because
repeated headings collide with the Markdown linting rules this repository
runs.

This project adheres to semantic versioning.

## 2.1.1

Released 2026-09-19.

Fixes and hardening only, which is why it is a patch. Unlike 2.1.0, this
one does change what the skills say: five errors in the published
examples are corrected, so an installed copy is worth refreshing with
`./scripts/install.sh --force`, or `-Force` in PowerShell.

- Fixed: the Thai localisation example in `gherkin-scenario-writing` used
  a scenario keyword no Gherkin dialect defines, so the whole scenario
  was read as description text rather than as a scenario.
- Fixed: the behave data-table example bound the step without the
  trailing colon that every feature file in these skills writes. behave
  matches the step text exactly, so the step was undefined. The other
  five language files were already right.
- Fixed: `outlines-and-tables.md` said the indentation of a doc string's
  closing delimiter sets the left margin. It is the opening delimiter;
  the closing one has no effect at all.
- Fixed: `review-checklist.md` pointed at a remedy column in a list that
  has no columns, left over from a table the line-length rule does not
  allow.
- Fixed: the .NET custom parameter type example could not have run. Its
  transformation patterns had no capturing group, so the method was
  called with no arguments, and they had no `Name`, without which a
  Cucumber Expression cannot reach them. Checked against Reqnroll 3.3.4.
- Changed: the .NET living documentation section pointed at LivingDoc,
  which belongs to the discontinued SpecFlow line. Reqnroll carries the
  Cucumber HTML formatter as a dependency, so the section now shows the
  `reqnroll.json` entry that turns it on.
- Fixed: the Gherkin validator accepted any snippet a synthesised
  `Feature` could swallow as description text, which is how the first two
  errors above survived. Thirty-three of the eighty-two published blocks
  were being accepted that way. A wrapped snippet must now produce a
  child or a step and leave no description behind, and the wrapper is
  built from the snippet's own dialect rather than always from English.
- Fixed: both installers reported `N skill(s) installed` after a dry run
  that copied nothing.
- Fixed: `link-local.sh` accepted any argument, so a mistyped `--remov`
  linked instead of removing. It now parses options as `install.sh` does,
  and both `link-local` scripts report a missing `plugin/skills` in the
  same words rather than one printing nothing and the other throwing.
- Fixed: the frontmatter validator threw a stack trace on a missing or
  malformed manifest, and its exact-version check skipped a range nested
  inside an `overrides` entry.
- Added: both `link-local` scripts clear links whose skill has since been
  renamed or deleted, instead of leaving them pointing at nothing.
- Added: `scripts/test-scripts.mjs`, a fourth check in `npm test`. It
  runs all four installer scripts against a throwaway copy of the
  repository and compares what the shell and PowerShell versions print,
  so the pair cannot drift apart unnoticed. A shell that is not installed
  is skipped, so it passes on a machine with only one of them.
- Fixed: `SECURITY.md` named only the shell installers among the parts
  that run on a contributor's machine. The PowerShell pair has been there
  since 2.1.0.
- Fixed: the pull request label check did not re-run when a pull request
  was pushed to, so the first push after opening left it unmergeable,
  with branch protection waiting for a check that would only come back if
  someone toggled a label by hand.
- Changed: continuous integration cancels a pull request run that a later
  push has superseded. Runs on main are left alone, so every commit there
  keeps a status of its own.
- Changed: `CONTRIBUTING.md` and the pull request template said one type
  label where the check requires at least one, and one priority label
  where it requires exactly one. More than one type is deliberate: a
  release that also carries a fix is two honest labels.
- Changed: `actions/checkout` to v7 and `actions/github-script` to v9.

## 2.1.0

Released 2026-09-19.

Tooling and contribution workflow only. Nothing in the five skills
changed, so an installed copy behaves exactly as it did at 2.0.1.

- Fixed: a denial-of-service advisory in `smol-toml`, reached through
  `markdownlint-cli2`. npm's only suggested fix was to downgrade
  `markdownlint-cli2` by a major version, so the transitive dependency is
  pinned with an `overrides` entry instead. Remove it once upstream ships
  the patched version.
- Added: a pull request hygiene check. It assigns the author, and
  requires one type label and one priority label before a pull request
  can merge. Dependabot is held to `dependencies` instead, since it
  cannot choose labels.
- Added: `.github/dependabot.yml`, updating GitHub Actions monthly. npm
  is deliberately excluded; a markdownlint release can add a rule and
  turn the build red with no content change, so those bumps want a person
  deciding when to take them.
- Changed: `actions/checkout` to v5 and `actions/setup-node` to v7. v4
  was running on a deprecated Node version on the runner.
- Added: `scripts/install.ps1` and `scripts/link-local.ps1`, so Windows
  users with neither a shell nor WSL have a supported route. The
  PowerShell links are directory junctions, which need no administrator
  rights.
- Added: `.editorconfig`, matching what the linters already expect.
- Added: `.npmrc` with `save-exact`, and a check that fails `npm test` if
  any dependency carries a range rather than an exact version.
- Fixed: `install.sh --dry-run` said `copied` for files it had not
  copied, and interleaved `mkdir` noise between the lines that mattered.
- Added: `.node-version`, pinning Node to an exact version, and
  `mise.toml`, which tells mise to honour it. Both `mise install` and
  `actions/setup-node` read `.node-version`, so the version is written
  once and continuous integration cannot drift from a local setup.
- Changed: the project now requires Node 24. `package.json` previously
  declared `>=20`, which nothing verified once development moved to 24.

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
