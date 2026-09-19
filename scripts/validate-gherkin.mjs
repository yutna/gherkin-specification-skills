#!/usr/bin/env node
// Parses every fenced gherkin block in the repository so no published
// example can drift into syntax that a real Gherkin parser would reject.
//
// Most snippets are fragments rather than whole documents. Rather than
// guess which shape a snippet is from its keywords — which breaks on tag
// lines and on non-English dialects — each snippet is tried as a whole
// document first, then wrapped in a synthesised Feature, then in a Feature
// and Scenario. A snippet is valid if any of those parses and the parse
// recognised it as Gherkin rather than as prose.
//
// That second half is what makes the check mean anything. A Feature's
// description swallows every line that follows it, so a snippet reading
// `Scenrio: typo` parses perfectly well once wrapped, as a description. A
// wrapped snippet is therefore accepted only when the wrapper gained a
// child, or a step, and left no description behind; and no description
// anywhere in the parse may begin with a keyword of the snippet's own
// dialect, which is what an unrecognised step looks like afterwards.
//
// Deliberately poor examples in the review skill are still syntactically
// valid, so they need no exemption.

import { readdirSync, readFileSync, lstatSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AstBuilder,
  dialects,
  GherkinClassicTokenMatcher,
  Parser,
} from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SKIP_DIRS = new Set(['node_modules', '.git'])
const uuid = IdGenerator.uuid()

const DEFAULT_LANGUAGE = 'en'
const LANGUAGE_LINE = /^\s*#\s*language\s*:\s*([A-Za-z0-9_-]+)\s*$/
const BLOCK_KEYWORDS = [
  'feature',
  'rule',
  'background',
  'scenario',
  'scenarioOutline',
  'examples',
]
const STEP_KEYWORDS = ['given', 'when', 'then', 'and', 'but']

// Symlinked directories are skipped: link-local.sh points .claude/skills at
// plugin/skills/, and following the links would parse everything twice.
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

// Only whitespace is removed, and never more of it than the fence itself is
// indented by. Slicing the raw line instead would eat real characters from a
// line that sits further left than its own fence.
function stripIndent (line, width) {
  let index = 0
  while (index < width && (line[index] === ' ' || line[index] === '\t')) {
    index += 1
  }
  return line.slice(index)
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
      blocks.push({
        startLine: current.startLine,
        body: current.body.join('\n'),
      })
      current = null
      continue
    }
    if (current !== null) {
      current.body.push(stripIndent(line, current.indent))
    }
  }
  // An unterminated fence would otherwise drop its block on the floor, and
  // the file would be reported as containing one example fewer than it does.
  if (current !== null) {
    blocks.push({
      startLine: current.startLine,
      body: current.body.join('\n'),
      unterminated: true,
    })
  }
  return blocks
}

// A leading `# language:` comment must stay on the first line, so it is
// lifted out before any wrapper is prepended and put back on top afterwards.
function splitLanguageHeader (source) {
  const lines = source.split('\n')
  let index = 0
  let language = DEFAULT_LANGUAGE
  while (index < lines.length) {
    const line = lines[index]
    const declared = LANGUAGE_LINE.exec(line)
    if (declared) {
      language = declared[1]
      index += 1
      continue
    }
    if (line.trim().length === 0) {
      index += 1
      continue
    }
    break
  }
  return {
    header: lines.slice(0, index).join('\n'),
    rest: lines.slice(index).join('\n'),
    language,
  }
}

function dialectFor (language) {
  return dialects[language] ?? dialects[DEFAULT_LANGUAGE]
}

// A wrapper written in English would be a parse error under a non-English
// language header, so the synthesised keywords come from the same dialect
// the snippet declared.
function wrapperKeywords (language) {
  const dialect = dialectFor(language)
  return {
    feature: dialect.feature[0],
    scenario: dialect.scenario[0],
  }
}

// What an unrecognised line looks like once the parser has swept it into a
// description: still starting with a keyword of the declared dialect, still
// a table row, still a tag.
function keywordPrefixes (language) {
  const dialect = dialectFor(language)
  const prefixes = []
  for (const key of BLOCK_KEYWORDS) {
    for (const keyword of dialect[key] ?? []) {
      prefixes.push(`${keyword}:`)
    }
  }
  for (const key of STEP_KEYWORDS) {
    for (const keyword of dialect[key] ?? []) {
      prefixes.push(keyword)
    }
  }
  return prefixes
}

function indentBy (text, spaces) {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.trim().length === 0 ? line : pad + line))
    .join('\n')
}

function candidates (source) {
  const { header, rest, language } = splitLanguageHeader(source)
  const prefix = header.length > 0 ? `${header}\n` : ''
  const keyword = wrapperKeywords(language)
  return [
    { shape: 'document', language, text: source },
    {
      shape: 'feature',
      language,
      text: `${prefix}${keyword.feature}: Snippet\n\n${indentBy(rest, 2)}\n`,
    },
    {
      shape: 'scenario',
      language,
      text:
        `${prefix}${keyword.feature}: Snippet\n\n` +
        `  ${keyword.scenario}: Snippet\n${indentBy(rest, 4)}\n`,
    },
  ]
}

function parseDocument (text) {
  const parser = new Parser(
    new AstBuilder(uuid),
    new GherkinClassicTokenMatcher(DEFAULT_LANGUAGE),
  )
  try {
    return { document: parser.parse(text) }
  } catch (error) {
    return {
      error: (error.errors ?? [error])
        .map((item) => item.message ?? String(item))
        .join('; '),
    }
  }
}

function eachDescription (feature, visit) {
  if (!feature) return
  visit(feature.description)
  const walk = (children) => {
    for (const child of children ?? []) {
      if (child.background) visit(child.background.description)
      if (child.scenario) {
        visit(child.scenario.description)
        for (const examples of child.scenario.examples ?? []) {
          visit(examples.description)
        }
      }
      if (child.rule) {
        visit(child.rule.description)
        walk(child.rule.children)
      }
    }
  }
  walk(feature.children)
}

function unrecognisedLine (feature, language) {
  const prefixes = keywordPrefixes(language)
  let found = null
  eachDescription(feature, (description) => {
    if (found !== null || !description) return
    for (const raw of description.split('\n')) {
      const line = raw.trim()
      if (line.length === 0) continue
      if (line.startsWith('|') || line.startsWith('@')) {
        found = line
        return
      }
      if (prefixes.some((prefix) => line.startsWith(prefix))) {
        found = line
        return
      }
    }
  })
  return found
}

function firstChildScenario (feature) {
  for (const child of feature.children ?? []) {
    if (child.scenario) return child.scenario
  }
  return null
}

// Why a candidate that parsed is still not evidence the snippet is Gherkin.
function rejection (shape, document, language) {
  const feature = document.feature
  const stray = unrecognisedLine(feature, language)
  if (stray !== null) {
    return `"${stray}" was read as description text, not as Gherkin`
  }
  if (shape === 'document') return null
  if (!feature) return 'nothing was recognised as Gherkin'
  if ((feature.description ?? '').trim().length > 0) {
    return 'the snippet parsed as description text, not as Gherkin'
  }
  if (shape === 'feature') {
    return (feature.children ?? []).length > 0
      ? null
      : 'the snippet parsed as description text, not as Gherkin'
  }
  const scenario = firstChildScenario(feature)
  if (!scenario) return 'nothing was recognised as Gherkin'
  if ((scenario.description ?? '').trim().length > 0) {
    return 'the snippet parsed as description text, not as Gherkin'
  }
  return (scenario.steps ?? []).length > 0
    ? null
    : 'no steps were recognised in the snippet'
}

// The error reported is the one from parsing the snippet as written, which
// of the three is the one that names a line. When every shape parsed but
// none recognised any Gherkin there is no parse error to show, so the
// rejection is reported instead — preferring whichever one quotes the line
// that was swept into a description, since that is the line to look at.
function checkBlock (body) {
  let parseError = null
  let quoted = null
  let generic = null
  for (const candidate of candidates(body)) {
    const { document, error } = parseDocument(candidate.text)
    if (error !== undefined) {
      if (parseError === null) parseError = error
      continue
    }
    const rejected = rejection(candidate.shape, document, candidate.language)
    if (rejected === null) return null
    if (rejected.startsWith('"')) {
      if (quoted === null) quoted = rejected
    } else if (generic === null) {
      generic = rejected
    }
  }
  return parseError ?? quoted ?? generic
}

const files = collectMarkdown(ROOT)
const failures = []
let blockCount = 0

for (const file of files) {
  for (const block of extractBlocks(file)) {
    const where = { file: relative(ROOT, file), line: block.startLine }
    if (block.body.trim().length === 0 && !block.unterminated) continue
    blockCount += 1
    if (block.unterminated) {
      failures.push({ ...where, detail: 'the fence is never closed' })
      continue
    }

    const detail = checkBlock(block.body)
    if (detail !== null) failures.push({ ...where, detail })
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
