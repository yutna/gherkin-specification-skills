#!/usr/bin/env node
// Parses every ```gherkin fence in the repository so no published example can
// drift into syntax that a real Gherkin parser would reject.
//
// Most snippets are fragments rather than whole documents. Rather than guess
// which shape a snippet is from its keywords — which breaks on tag lines and
// on non-English dialects — each snippet is tried as a whole document first,
// then wrapped in a synthesised Feature, then in a Feature and Scenario. A
// snippet is valid if any of those parses. The error reported is the one from
// parsing it as written, which is the most useful of the three.
//
// Deliberately poor examples in the review skill are still syntactically
// valid, so they need no exemption.

import { readdirSync, readFileSync, lstatSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SKIP_DIRS = new Set(['node_modules', '.git'])
const uuid = IdGenerator.uuid()

// Symlinked directories are skipped: link-local.sh points .claude/skills and
// .agents/skills at skills/, and following them would parse everything three
// times.
function collectMarkdown (dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stats = lstatSync(full)
    if (stats.isSymbolicLink()) continue
    if (stats.isDirectory()) {
      collectMarkdown(full, found)
    } else if (entry.endsWith('.md')) {
      found.push(full)
    }
  }
  return found
}

function extractBlocks (file) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  const blocks = []
  let current = null

  for (const [index, line] of lines.entries()) {
    const opening = /^(\s*)(`{3,})gherkin\s*$/.exec(line)
    if (opening && current === null) {
      current = {
        indent: opening[1].length,
        fence: opening[2],
        startLine: index + 1,
        body: [],
      }
      continue
    }
    const closing = current !== null && /^\s*(`{3,})\s*$/.exec(line)
    if (closing && closing[1].length >= current.fence.length) {
      blocks.push({ startLine: current.startLine, body: current.body.join('\n') })
      current = null
      continue
    }
    if (current !== null) {
      current.body.push(line.slice(current.indent))
    }
  }
  return blocks
}

// A leading `# language:` comment must stay on the first line, so it is lifted
// out before any wrapper is prepended and put back on top afterwards.
function splitLanguageHeader (source) {
  const lines = source.split('\n')
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.trim().length === 0 || /^\s*#\s*language\s*:/i.test(line)) {
      index += 1
      continue
    }
    break
  }
  return {
    header: lines.slice(0, index).join('\n'),
    rest: lines.slice(index).join('\n'),
  }
}

function indentBy (text, spaces) {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.trim().length === 0 ? line : pad + line))
    .join('\n')
}

function candidates (source) {
  const { header, rest } = splitLanguageHeader(source)
  const prefix = header.length > 0 ? `${header}\n` : ''
  return [
    source,
    `${prefix}Feature: Snippet\n\n${indentBy(rest, 2)}\n`,
    `${prefix}Feature: Snippet\n\n  Scenario: Snippet\n${indentBy(rest, 4)}\n`,
  ]
}

function parseOrFail (text) {
  const parser = new Parser(
    new AstBuilder(uuid),
    new GherkinClassicTokenMatcher('en'),
  )
  try {
    parser.parse(text)
    return null
  } catch (error) {
    return (error.errors ?? [error])
      .map((item) => item.message ?? String(item))
      .join('; ')
  }
}

const files = collectMarkdown(ROOT)
const failures = []
let blockCount = 0

for (const file of files) {
  for (const block of extractBlocks(file)) {
    if (block.body.trim().length === 0) continue
    blockCount += 1

    let firstError = null
    let parsed = false
    for (const candidate of candidates(block.body)) {
      const error = parseOrFail(candidate)
      if (error === null) {
        parsed = true
        break
      }
      if (firstError === null) firstError = error
    }

    if (!parsed) {
      failures.push({
        file: relative(ROOT, file),
        line: block.startLine,
        detail: firstError,
      })
    }
  }
}

for (const failure of failures) {
  process.stderr.write(
    `error ${failure.file}:${failure.line} ${failure.detail}\n`,
  )
}

if (failures.length > 0) {
  process.stderr.write(
    `\n${failures.length} of ${blockCount} gherkin block(s) failed to parse\n`,
  )
  process.exit(1)
}
process.stdout.write(
  `ok    ${blockCount} gherkin block(s) parsed across ${files.length} file(s)\n`,
)
