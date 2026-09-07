#!/usr/bin/env bash
#
# Makes the skills discoverable inside this repository while working on
# them, by linking skills/<name> into the two per-project locations that
# Claude Code and Codex scan.
#
# Both target directories are gitignored, so nothing here is committed and
# Windows clones are unaffected.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="${REPO_ROOT}/skills"

CLAUDE_DIR="${REPO_ROOT}/.claude/skills"
AGENTS_DIR="${REPO_ROOT}/.agents/skills"

if [ "${1:-}" = "--remove" ]; then
  rm -rf "$CLAUDE_DIR" "$AGENTS_DIR"
  printf 'removed local skill links\n'
  exit 0
fi

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  cat <<'USAGE'
Usage: scripts/link-local.sh [--remove]

Links skills/<name> into .claude/skills and .agents/skills so an agent
working in this repository picks them up without installing anything.

  --remove   Delete the links again
USAGE
  exit 0
fi

mkdir -p "$CLAUDE_DIR" "$AGENTS_DIR"

count=0
for src in "$SKILLS_SRC"/*/; do
  [ -d "$src" ] || continue
  name="$(basename "$src")"

  for target_dir in "$CLAUDE_DIR" "$AGENTS_DIR"; do
    link="${target_dir}/${name}"
    if [ -e "$link" ] || [ -L "$link" ]; then
      rm -rf "$link"
    fi
    ln -s "$src" "$link"
  done

  printf 'linked %s\n' "$name"
  count=$((count + 1))
done

printf '\n%d skill(s) linked into .claude/skills and .agents/skills\n' "$count"
