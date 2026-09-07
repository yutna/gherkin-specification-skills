#!/usr/bin/env node
// Validates every skills/<name>/SKILL.md against the portable Agent Skills
// frontmatter subset, so the same file works in Claude Code and Codex.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SKILLS_DIR = join(ROOT, 'skills')

// Keys accepted by every runtime that implements the open standard. Anything
// else is a hard validation error outside Claude Code, so it is banned here.
const ALLOWED_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
])

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const RESERVED_WORDS = ['anthropic', 'claude']
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

const errors = []
const warnings = []

function fail (skill, message) {
  errors.push(`${skill}: ${message}`)
}

function readSkillDirs () {
  let entries
  try {
    entries = readdirSync(SKILLS_DIR)
  } catch {
    errors.push('skills/: directory not found')
    return []
  }
  return entries
    .filter((entry) => !entry.startsWith('.'))
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort()
}

function validateName (id, frontmatter) {
  const { name } = frontmatter
  if (typeof name !== 'string' || name.length === 0) {
    fail(id, 'frontmatter "name" is missing or empty')
    return
  }
  if (name !== id) {
    fail(id, `frontmatter "name" is "${name}" but the directory is "${id}"`)
  }
  if (name.length > 64) {
    fail(id, `"name" is ${name.length} characters, the limit is 64`)
  }
  if (!NAME_PATTERN.test(name)) {
    fail(id, `"name" must be lowercase kebab-case, got "${name}"`)
  }
  for (const word of RESERVED_WORDS) {
    if (name.includes(word)) {
      fail(id, `"name" must not contain the reserved word "${word}"`)
    }
  }
}

function validateDescription (id, frontmatter) {
  const { description } = frontmatter
  if (typeof description !== 'string' || description.trim().length === 0) {
    fail(id, 'frontmatter "description" is missing or empty')
    return
  }
  if (description.length > 1024) {
    fail(id, `"description" is ${description.length} characters, limit 1024`)
  }
  if (/[<>]/.test(description)) {
    fail(id, '"description" must not contain angle brackets')
  }
  if (description.length < 80) {
    warnings.push(`${id}: "description" is short, triggers may be too vague`)
  }
}

function validateKeys (id, frontmatter) {
  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_KEYS.has(key)) {
      fail(id, `frontmatter key "${key}" is outside the portable subset`)
    }
  }
  if (frontmatter.license !== 'MIT') {
    fail(id, 'frontmatter "license" must be "MIT"')
  }
}

// Headings must be counted outside fenced code, or a `# language:` comment in
// a Gherkin example reads as a second level-one heading.
function stripFences (body) {
  const kept = []
  let fence = null
  for (const line of body.split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)
    if (fence === null && marker) {
      fence = marker[1]
      continue
    }
    if (fence !== null) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) {
        fence = null
      }
      continue
    }
    kept.push(line)
  }
  return kept.join('\n')
}

function validateBody (id, rawBody) {
  const body = stripFences(rawBody)
  const firstLine = body.split(/\r?\n/).find((line) => line.trim().length > 0)
  if (!firstLine || !firstLine.startsWith('# ')) {
    fail(id, 'body must open with a single level-one heading')
  }
  const headings = body.match(/^# .+$/gm) ?? []
  if (headings.length > 1) {
    fail(id, `body has ${headings.length} level-one headings, expected 1`)
  }
  const lineCount = body.split(/\r?\n/).length
  if (lineCount > 500) {
    warnings.push(`${id}: body is ${lineCount} lines, move detail to references`)
  }
}

function validateReferences (id, dir, body) {
  const linked = new Set()
  for (const match of body.matchAll(/references\/([\w-]+\.md)/g)) {
    linked.add(match[1])
  }
  let present
  try {
    present = readdirSync(join(dir, 'references'))
  } catch {
    present = []
  }
  for (const file of linked) {
    if (!present.includes(file)) {
      fail(id, `SKILL.md links references/${file} but the file is missing`)
    }
  }
  for (const file of present) {
    if (file.endsWith('.md') && !linked.has(file)) {
      warnings.push(`${id}: references/${file} is never linked from SKILL.md`)
    }
  }
}

function validateSkill (id) {
  const dir = join(SKILLS_DIR, id)
  let raw
  try {
    raw = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  } catch {
    fail(id, 'SKILL.md not found')
    return
  }

  const match = FRONTMATTER.exec(raw)
  if (!match) {
    fail(id, 'SKILL.md has no YAML frontmatter block')
    return
  }

  let frontmatter
  try {
    frontmatter = parseYaml(match[1])
  } catch (error) {
    fail(id, `frontmatter is not valid YAML: ${error.message}`)
    return
  }
  if (frontmatter === null || typeof frontmatter !== 'object') {
    fail(id, 'frontmatter must be a YAML mapping')
    return
  }

  validateName(id, frontmatter)
  validateDescription(id, frontmatter)
  validateKeys(id, frontmatter)
  validateBody(id, match[2])
  validateReferences(id, dir, match[2])
}

function validateDistinctDescriptions (ids) {
  const seen = new Map()
  for (const id of ids) {
    const raw = readFileSync(join(SKILLS_DIR, id, 'SKILL.md'), 'utf8')
    const match = FRONTMATTER.exec(raw)
    if (!match) continue
    const text = parseYaml(match[1])?.description ?? ''
    if (seen.has(text)) {
      fail(id, `description is identical to ${seen.get(text)}`)
    }
    seen.set(text, id)
  }
}

const skillIds = readSkillDirs()
if (skillIds.length === 0 && errors.length === 0) {
  errors.push('skills/: no skill directories found')
}
for (const id of skillIds) {
  validateSkill(id)
}
if (errors.length === 0) {
  validateDistinctDescriptions(skillIds)
}

for (const warning of warnings) {
  process.stdout.write(`warn  ${warning}\n`)
}
for (const error of errors) {
  process.stderr.write(`error ${error}\n`)
}

if (errors.length > 0) {
  process.stderr.write(`\n${errors.length} skill validation error(s)\n`)
  process.exit(1)
}
process.stdout.write(
  `ok    ${skillIds.length} skill(s) valid: ${skillIds.join(', ')}\n`,
)
