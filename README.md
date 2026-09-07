# Gherkin Specification Skills

Agent Skills that teach a coding agent to do behaviour-driven
specification properly: find the examples, phrase them as readable
Gherkin, review what already exists, implement thin step definitions, and
keep a suite people trust.

Written to the Agent Skills open standard, so the same files work in
Claude Code and in Codex without modification.

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

### Claude Code, as a plugin

```text
/plugin marketplace add yutna/gherkin-specification-skills
/plugin install gherkin-specification-skills@gherkin-specification-skills
```

### Codex

Copy the skills into a directory Codex scans:

```bash
git clone https://github.com/yutna/gherkin-specification-skills.git
cp -R gherkin-specification-skills/skills/* ~/.agents/skills/
```

`~/.codex/skills/` also works if that is where your other skills live.
For a single project, `.agents/skills/` inside the repository is scanned
too.

### Both at once, with the install script

Copies the skills into `~/.agents/skills/` and links them from
`~/.claude/skills/`, so both runtimes read the same files:

```bash
git clone https://github.com/yutna/gherkin-specification-skills.git
cd gherkin-specification-skills
./scripts/install.sh
```

Options: `--claude-only`, `--codex-only`, `--force`, `--dry-run`.

### Cross-agent CLI

The layout matches what the `skills` CLI expects, so this works too and
reaches the other agents it supports:

```bash
npx skills add yutna/gherkin-specification-skills
```

### By hand

Copy any `skills/<name>/` directory into `~/.claude/skills/` or
`~/.agents/skills/`. There is nothing to build and no dependency to
install.

Start a new session afterwards, whichever route you took.

## Using them

The skills trigger on their own when a task matches. To invoke one
explicitly, name it:

```text
Use gherkin-discovery on this ticket before we estimate it.
```

Typical sequence for new work: discovery to find the examples, then
scenario-writing to phrase them, then automation to implement the steps.
Review and suite-design apply to work that already exists.

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
- `scripts/validate-skills.mjs`, which checks every `SKILL.md` against the
  portable frontmatter subset: `name` matching its directory, a
  `description` under 1024 characters, `license: MIT`, and no keys outside
  the open standard.
- `scripts/validate-gherkin.mjs`, which extracts every fenced `gherkin`
  block in the repository and parses it with a real Gherkin parser. Every
  published example is therefore valid Gherkin, including the deliberately
  poor ones in the review skill.

To work on the skills with an agent inside this repository:

```bash
./scripts/link-local.sh
```

That links `skills/` into `.claude/skills/` and `.agents/skills/`, both of
which are gitignored. Undo it with `--remove`.

## Repository layout

```text
skills/<name>/SKILL.md        the skill, and the single source of truth
skills/<name>/references/     detail loaded on demand
scripts/                      installers and validators
.claude-plugin/               Claude Code plugin and marketplace manifests
.codex-plugin/                Codex plugin manifest
.agents/plugins/              Codex marketplace manifest
```

The manifests and the install script all point at `skills/`. No file
duplicates skill content.

## Contributing

See `CONTRIBUTING.md`. In short: run `npm test` before opening a pull
request, keep to the portable frontmatter subset, and write examples that
parse.

## License

MIT. See `LICENSE`.
