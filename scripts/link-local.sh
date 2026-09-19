#!/usr/bin/env bash
#
# Makes the skills discoverable inside this repository while working on
# them, by linking plugin/skills/<name> into .claude/skills, the per-project
# location Claude Code scans.
#
# The target directory is gitignored, so nothing here is committed and
# Windows clones are unaffected.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="${REPO_ROOT}/plugin/skills"

CLAUDE_DIR="${REPO_ROOT}/.claude/skills"

usage() {
  cat <<'USAGE'
Usage: scripts/link-local.sh [options]

Links plugin/skills/<name> into .claude/skills so an agent working in
this repository picks them up without installing anything.

Options:
  --remove        Delete the links again
  -h, --help      Show this message
USAGE
}

remove=0

while [ $# -gt 0 ]; do
  case "$1" in
    --remove)      remove=1 ;;
    -h|--help)     usage; exit 0 ;;
    *) printf 'Unknown option: %s\n\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

if [ "$remove" -eq 1 ]; then
  rm -rf "$CLAUDE_DIR"
  printf 'removed local skill links\n'
  exit 0
fi

if [ ! -d "$SKILLS_SRC" ]; then
  printf 'error: %s not found\n' "$SKILLS_SRC" >&2
  exit 1
fi

mkdir -p "$CLAUDE_DIR"

count=0
for src in "$SKILLS_SRC"/*/; do
  [ -d "$src" ] || continue
  name="$(basename "$src")"

  link="${CLAUDE_DIR}/${name}"
  if [ -e "$link" ] || [ -L "$link" ]; then
    rm -rf "$link"
  fi
  ln -s "$src" "$link"

  printf 'linked %s\n' "$name"
  count=$((count + 1))
done

# A skill that was renamed or deleted leaves a link behind that points at
# nothing. Claude Code keeps scanning the directory, so clear the dead ones
# rather than emptying the directory, which may hold links this script did
# not make.
pruned=0
for link in "$CLAUDE_DIR"/*; do
  if [ ! -L "$link" ]; then continue; fi
  if [ -e "$link" ]; then continue; fi
  rm -f "$link"
  printf 'pruned %s (no longer a skill)\n' "$(basename "$link")"
  pruned=$((pruned + 1))
done

printf '\n%d skill(s) linked into .claude/skills, %d pruned\n' "$count" "$pruned"
