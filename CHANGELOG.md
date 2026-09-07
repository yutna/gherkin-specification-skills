# Changelog

All notable changes to this project are recorded here. The format follows
the common keep-a-changelog conventions, with one difference: entries are
written as labelled bullets rather than as repeated subheadings, because
repeated headings collide with the Markdown linting rules this repository
runs.

This project adheres to semantic versioning.

## Unreleased

- Fixed: `install.sh --claude-only` no longer writes into
  `~/.agents/skills`; it copies straight into `~/.claude/skills` and
  creates no symlink.
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
