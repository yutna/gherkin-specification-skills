# Gherkin Specification Skills

Agent Skills that teach a coding agent to do behaviour-driven
specification properly: find the examples, phrase them as readable
Gherkin, review what already exists, implement thin step definitions, and
keep a suite people trust.

Written as Agent Skills — a directory and a `SKILL.md` each — and built
for Claude Code: install them as a plugin, or drop the directories into
`~/.claude/skills` and start a session.

## The five skills

- **`gherkin-discovery`** — turn a vague story or ticket into agreed rules
  with concrete examples, and surface the questions nobody can answer yet.
  Use it before any scenario is written.
- **`gherkin-scenario-writing`** — write feature files that read as
  behaviour rather than test scripts. Covers the full keyword set,
  declarative phrasing, outlines, data tables, tags, and localisation.
- **`gherkin-scenario-review`** — critique and repair existing feature
  files, with a smell catalogue that gives the rewrite for each defect.
- **`gherkin-automation`** — the code behind the steps: Cucumber
  Expressions, the layering rule, scenario state, test data, determinism,
  and per-language notes for JavaScript, Java, Python, .NET, Go, and Ruby.
- **`gherkin-suite-design`** — organise a whole suite: folder layout,
  feature granularity, tagging, living documentation, CI, and migration.

Each skill is self-contained, so installing one on its own works. Detail
lives in `references/` files that the agent loads only when it needs them.

## Install

### As a plugin

```text
/plugin marketplace add yutna/gherkin-specification-skills
/plugin install gherkin-specification-skills@gherkin-specification-skills
```

### With the install script

Copies every skill into `~/.claude/skills/`, where Claude Code finds it
in any project:

```bash
git clone https://github.com/yutna/gherkin-specification-skills.git
cd gherkin-specification-skills
./scripts/install.sh
```

Options: `--force` to replace an existing copy, `--dry-run` to see what
it would do.

On Windows, without needing a shell or WSL:

```powershell
git clone https://github.com/yutna/gherkin-specification-skills.git
cd gherkin-specification-skills
.\scripts\install.ps1
```

Same options, as `-Force` and `-DryRun`. PowerShell 7 or later.

### By hand

Copy any `plugin/skills/<name>/` directory into `~/.claude/skills/` for
every project, or into a project's `.claude/skills/` for one repository.
There is nothing to build and no dependency to install.

Start a new session afterwards, whichever route you took.

## Using them

The skills trigger on their own when a task matches. To invoke one
explicitly, name it:

```text
Use gherkin-discovery on this ticket before we estimate it.
```

They are also in the slash menu, each showing what it expects. Installed
by hand or by the script, a skill is its own command:

```text
/gherkin-scenario-review src/test/features
```

Installed as a plugin, the command carries the plugin name:
`/gherkin-specification-skills:gherkin-scenario-review`.

Typical sequence for new work: `gherkin-discovery` to find the examples,
then `gherkin-scenario-writing` to phrase them, then `gherkin-automation`
to implement the steps. `gherkin-scenario-review` and
`gherkin-suite-design` apply to work that already exists.

## Working on this repository

```bash
npm install
npm test
```

`npm test` runs three checks:

- `markdownlint-cli2` over every Markdown file, with **default rules
  only**. There is no configuration file and no inline rule suppression
  anywhere in the repository, and pull requests that add either will not
  be accepted. In practice the binding constraints are an 80-character
  line limit that also covers code blocks and tables, unique heading text
  within each file, and no inline HTML.
- `scripts/validate-skills.mjs`, which checks every `SKILL.md` against
  the frontmatter Claude Code accepts: `name` matching its directory, a
  `description` that fits the 1536-character budget it shares with
  `when_to_use`, `license: MIT`, no key outside the documented set, and a
  `metadata.version` matching `package.json`.
- `scripts/validate-gherkin.mjs`, which extracts every fenced `gherkin`
  block in the repository and parses it with a real Gherkin parser. Every
  published example is therefore valid Gherkin, including the deliberately
  poor ones in the review skill.

To work on the skills with an agent inside this repository:

```bash
./scripts/link-local.sh
```

On Windows, `.\scripts\link-local.ps1`, which makes directory junctions
and so needs neither administrator rights nor developer mode.

Either links `plugin/skills/` into `.claude/skills/`, which is
gitignored. Undo it with `--remove`, or `-Remove` in PowerShell.

## Repository layout

```text
plugin/skills/<name>/SKILL.md      the skill, and the single source of truth
plugin/skills/<name>/references/   detail loaded on demand
plugin/.claude-plugin/             the plugin manifest
.claude-plugin/marketplace.json    the marketplace manifest
scripts/                           installers and validators
.node-version                      the Node version, read by CI as well
```

Everything the plugin ships lives under `plugin/`. The repository's own
tooling — `package.json`, the lock file, `scripts/` — deliberately sits
outside it, because a lock file at a plugin's root makes
`claude plugin install` run npm on the machine of everyone who installs
it. `npm test` fails if either file reappears under `plugin/`.

The manifests and the install script all point at `plugin/skills/`. No
file duplicates skill content.

## Contributing

See `CONTRIBUTING.md`. In short: run `npm test` before opening a pull
request, keep frontmatter inside the set the validator accepts, and write
examples that parse.

## License

MIT. See `LICENSE`.
