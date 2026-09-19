# Security policy

## What this repository contains

Markdown skill files, three Node scripts that check them, and two pairs
of installer scripts, one shell and one PowerShell. The skills themselves
are documentation: they are read by an agent and contain no executable
content.

The parts that do run on a contributor's machine are:

- `scripts/install.sh` and `scripts/install.ps1`, which copy directories
  under the home directory, and `scripts/link-local.sh` and
  `scripts/link-local.ps1`, which link them inside the checkout.
- `scripts/validate-skills.mjs` and `scripts/validate-gherkin.mjs`, which
  read files in the repository, and `scripts/test-scripts.mjs`, which
  runs the four installer scripts against a temporary copy of it.
- The development dependencies installed by `npm ci`.

## Supported versions

The latest release on the default branch is the only supported version.
Fixes are made there rather than backported.

## Reporting a vulnerability

Report privately through the repository's GitHub security advisory page,
under the Security tab, rather than by opening a public issue.

Please include what an attacker could achieve, the steps to reproduce it,
and the versions involved. An initial response can be expected within a
few days. This is a small project maintained in spare time, so please do
not expect a same-day reply.

Do not open a public issue for anything exploitable until a fix is
available.

## Scope

In scope:

- A path traversal, injection, or unsafe expansion in the installers or
  the validation scripts.
- Anything in this repository that could overwrite or delete files
  outside the directories the installers document.
- A dependency vulnerability that is reachable through the scripts here.

Out of scope:

- Advice in the skills that you disagree with. Open an issue instead;
  corrections from real experience are welcome.
- Vulnerabilities in Cucumber, Reqnroll, behave, pytest-bdd, godog, or
  any other tool the skills mention. Report those to their own
  maintainers.
- Behaviour of Claude Code itself, or of any other agent that reads
  these skills. Report those to the vendor concerned.
- Issues that require an attacker to already have write access to the
  machine running the scripts.

## What running these skills does

Installing skills places Markdown files in a directory an agent reads.
The skills instruct an agent about writing and reviewing Gherkin; they do
not instruct it to fetch remote content, run commands against your
systems, or transmit anything. Anything an agent does after reading them
is governed by that agent's own permission model.
