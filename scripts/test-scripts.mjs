#!/usr/bin/env node
// Exercises the four installer scripts against a throwaway copy of the
// repository, so the shell pair and the PowerShell pair are known to work
// and to say the same things.
//
// Nothing here touches the real checkout or the real ~/.claude: every run
// gets its own copy of plugin/ and scripts/ and its own HOME. A shell that
// is not present is skipped rather than failed, so this runs on a machine
// with only bash, only pwsh, or both; continuous integration has both.

import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SKILLS = join(ROOT, 'plugin', 'skills')

const failures = []
let checks = 0

function check (label, condition, detail) {
  checks += 1
  if (!condition) failures.push(detail ? `${label}: ${detail}` : label)
}

function has (command) {
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore' })
  return probe.error === undefined && probe.status === 0
}

// Creating a link needs Developer Mode or elevation on Windows, so the
// checks that need one are skipped rather than failed where it is denied.
function trySymlink (target, path) {
  try {
    symlinkSync(target, path, 'junction')
    return true
  } catch {
    process.stdout.write('skip  cannot create a link here\n')
    return false
  }
}

// Each case runs in its own copy, so one case cannot leave state for the
// next and a failure is reproducible on its own.
function workspace () {
  const dir = mkdtempSync(join(tmpdir(), 'gherkin-skills-'))
  cpSync(join(ROOT, 'plugin'), join(dir, 'repo', 'plugin'), {
    recursive: true,
  })
  cpSync(join(ROOT, 'scripts'), join(dir, 'repo', 'scripts'), {
    recursive: true,
  })
  return { dir, repo: join(dir, 'repo'), home: join(dir, 'home') }
}

function run (shell, script, args, space) {
  const command = shell === 'bash'
    ? ['bash', [join(space.repo, 'scripts', `${script}.sh`), ...args]]
    : ['pwsh', ['-NoProfile', '-File',
        join(space.repo, 'scripts', `${script}.ps1`), ...args]]
  const result = spawnSync(command[0], command[1], {
    encoding: 'utf8',
    env: { ...process.env, HOME: space.home, USERPROFILE: space.home },
  })
  if (result.error) throw result.error
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

const SKILL_COUNT = readdirSync(SKILLS)
  .filter((entry) => !entry.startsWith('.')).length

// Every assertion below is about text both scripts must print identically,
// so each one runs twice: once per shell.
function exerciseInstall (shell, flag) {
  const force = flag.force
  const dryRun = flag.dryRun
  const space = workspace()
  const skills = join(space.home, '.claude', 'skills')
  try {
    const dry = run(shell, 'install', [dryRun], space)
    check(`${shell} install ${dryRun}`, dry.status === 0, dry.stderr)
    check(
      `${shell} install ${dryRun} counts nothing as installed`,
      dry.stdout.includes(
        `${SKILL_COUNT} skill(s) would be installed, 0 skipped`,
      ),
      dry.stdout,
    )
    check(
      `${shell} install ${dryRun} writes nothing`,
      !existsSync(skills),
    )

    const first = run(shell, 'install', [], space)
    check(`${shell} install`, first.status === 0, first.stderr)
    check(
      `${shell} install reports every skill`,
      first.stdout.includes(`${SKILL_COUNT} skill(s) installed, 0 skipped`),
      first.stdout,
    )
    check(
      `${shell} install copies the skill body`,
      existsSync(join(skills, 'gherkin-discovery', 'SKILL.md')),
    )

    const again = run(shell, 'install', [], space)
    check(
      `${shell} install is not destructive on a second run`,
      again.stdout.includes(`0 skill(s) installed, ${SKILL_COUNT} skipped`),
      again.stdout,
    )

    const forced = run(shell, 'install', [force], space)
    check(
      `${shell} install ${force} replaces`,
      forced.stdout.includes(`${SKILL_COUNT} skill(s) installed, 0 skipped`),
      forced.stdout,
    )

    // A link whose target has gone still occupies the name, so the plain
    // run must skip it and the forced run must replace it.
    rmSync(join(skills, 'gherkin-discovery'), { recursive: true })
    if (trySymlink(join(space.dir, 'nowhere'),
      join(skills, 'gherkin-discovery'))) {
      const dangling = run(shell, 'install', [], space)
      check(
        `${shell} install treats a dangling link as installed`,
        dangling.stdout.includes('skip   gherkin-discovery'),
        dangling.stdout,
      )
      const repaired = run(shell, 'install', [force], space)
      check(
        `${shell} install ${force} replaces a dangling link`,
        existsSync(join(skills, 'gherkin-discovery', 'SKILL.md')),
        repaired.stderr,
      )
    }

    return { dry: dry.stdout, first: first.stdout, again: again.stdout }
  } finally {
    rmSync(space.dir, { recursive: true, force: true })
  }
}

function exerciseLinkLocal (shell, removeFlag) {
  const space = workspace()
  const links = join(space.repo, '.claude', 'skills')
  try {
    const linked = run(shell, 'link-local', [], space)
    check(`${shell} link-local`, linked.status === 0, linked.stderr)
    check(
      `${shell} link-local reports every skill`,
      linked.stdout.includes(
        `${SKILL_COUNT} skill(s) linked into .claude`,
      ),
      linked.stdout,
    )
    // A junction is what the PowerShell script makes on Windows, and how
    // that is reported varies, so the link type is only asserted where the
    // script makes a symbolic link.
    check(
      `${shell} link-local makes a link, not a copy`,
      process.platform === 'win32' ||
        lstatSync(join(links, 'gherkin-discovery')).isSymbolicLink(),
    )

    if (trySymlink(join(space.repo, 'plugin', 'skills', 'gone'),
      join(links, 'gherkin-gone'))) {
      const pruned = run(shell, 'link-local', [], space)
      check(
        `${shell} link-local prunes a dead link`,
        pruned.stdout.includes('pruned gherkin-gone (no longer a skill)') &&
          !existsSync(join(links, 'gherkin-gone')),
        pruned.stdout,
      )
    }

    const removed = run(shell, 'link-local', [removeFlag], space)
    check(`${shell} link-local ${removeFlag}`, removed.status === 0)
    check(
      `${shell} link-local ${removeFlag} clears the directory`,
      !existsSync(links),
      removed.stdout,
    )

    return { linked: linked.stdout, removed: removed.stdout }
  } finally {
    rmSync(space.dir, { recursive: true, force: true })
  }
}

function exerciseErrors (shell) {
  const space = workspace()
  try {
    const missing = join(space.repo, 'plugin', 'skills')
    rmSync(missing, { recursive: true })
    for (const script of ['install', 'link-local']) {
      const result = run(shell, script, [], space)
      check(
        `${shell} ${script} without plugin/skills exits 1`,
        result.status === 1,
        `status ${result.status}`,
      )
      check(
        `${shell} ${script} without plugin/skills says so`,
        result.stderr.includes('not found'),
        result.stderr,
      )
    }
  } finally {
    rmSync(space.dir, { recursive: true, force: true })
  }
}

// Only the shell pair takes short options; PowerShell rejects an unknown
// parameter itself, with its own wording.
function exerciseUnknownOption () {
  const space = workspace()
  try {
    for (const script of ['install', 'link-local']) {
      const result = run('bash', script, ['--nope'], space)
      check(
        `bash ${script} --nope exits 2`,
        result.status === 2,
        `status ${result.status}`,
      )
      check(
        `bash ${script} --nope prints usage`,
        result.stderr.includes('Unknown option: --nope') &&
          result.stderr.includes('Usage:'),
        result.stderr,
      )
      const help = run('bash', script, ['--help'], space)
      check(`bash ${script} --help exits 0`, help.status === 0)
      check(
        `bash ${script} --help prints usage`,
        help.stdout.includes('Usage:'),
        help.stdout,
      )
    }
  } finally {
    rmSync(space.dir, { recursive: true, force: true })
  }
}

// The pair exists so a bug report reads the same from either script, which
// only holds if the wording matches. Paths and separators differ by
// platform, so compare the lines that carry the counts.
function summaries (text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.includes('skill(s)'))
    .map((line) => line.replace(/\\/g, '/'))
}

// Windows is the PowerShell pair's reason for existing; Git Bash copies
// where ln -s would link, so the shell pair is not the route there and is
// not exercised there either.
const shells = []
if (process.platform === 'win32') {
  process.stdout.write('skip  bash is not the supported route on Windows\n')
} else if (has('bash')) {
  shells.push('bash')
} else {
  process.stdout.write('skip  bash not available\n')
}
if (has('pwsh')) shells.push('pwsh')
else process.stdout.write('skip  pwsh not available\n')

const install = {}
const link = {}
for (const shell of shells) {
  const flags = shell === 'bash'
    ? { force: '--force', dryRun: '--dry-run', remove: '--remove' }
    : { force: '-Force', dryRun: '-DryRun', remove: '-Remove' }
  install[shell] = exerciseInstall(shell, flags)
  link[shell] = exerciseLinkLocal(shell, flags.remove)
  exerciseErrors(shell)
}
if (shells.includes('bash')) exerciseUnknownOption()

if (shells.length === 2) {
  for (const [name, results] of [['install', install], ['link-local', link]]) {
    for (const stage of Object.keys(results.bash)) {
      check(
        `${name} ${stage} reads the same from both scripts`,
        JSON.stringify(summaries(results.bash[stage])) ===
          JSON.stringify(summaries(results.pwsh[stage])),
        `${JSON.stringify(summaries(results.bash[stage]))} vs ` +
          `${JSON.stringify(summaries(results.pwsh[stage]))}`,
      )
    }
  }
}

for (const failure of failures) {
  process.stderr.write(`error ${failure}\n`)
}
if (failures.length > 0) {
  process.stderr.write(`\n${failures.length} script check(s) failed\n`)
  process.exit(1)
}
if (shells.length === 0) {
  process.stdout.write('warn  no shell available; nothing was exercised\n')
}
process.stdout.write(
  `ok    ${checks} script check(s) passed across ${shells.length} shell(s)\n`,
)
