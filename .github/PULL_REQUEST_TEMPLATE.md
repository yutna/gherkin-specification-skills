# Pull request

## What changed

Describe the change and which skill it affects.

## Why

What prompted it. For a correction, say what you observed that the
current guidance got wrong.

## Labels

Two are required, and a check enforces them:

- At least one type: `feature`, `release`, `bug`, `hotfix`, `chore`, or
  `documentation`.
- Exactly one priority: `priority: high`, `priority: medium`, or
  `priority: low`.

Anything else is optional. `breaking-change`, `security`, and `skill` are
worth reaching for when they apply.

## Checklist

- [ ] `npm test` passes locally.
- [ ] A type label and a priority label are set.
- [ ] No `markdownlint` configuration file or inline suppression comment
      was added.
- [ ] Frontmatter stays within the set the validator accepts.
- [ ] `metadata.version` matches `package.json`.
- [ ] No book titles, author names, or citations were added.
- [ ] Any new `gherkin` example parses.
- [ ] For a new skill, its triggers do not overlap an existing skill's.
