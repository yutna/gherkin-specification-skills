#!/usr/bin/env bash
#
# Installs the skills for use by any agent on this machine.
#
# Skills are copied into ~/.agents/skills/<name>, the shared location that
# Codex and several other agents discover, and ~/.claude/skills/<name> is
# linked to point at them. Both runtimes then read the same files.
#
# This script deliberately does not touch ~/.agents/.skill-lock.json; that
# file belongs to a separate installer.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="${REPO_ROOT}/skills"

AGENTS_DIR="${HOME}/.agents/skills"
CLAUDE_DIR="${HOME}/.claude/skills"

install_agents=1
install_claude=1
dry_run=0
force=0

usage() {
  cat <<'USAGE'
Usage: scripts/install.sh [options]

Options:
  --claude-only   Install into ~/.claude/skills only
  --codex-only    Install into ~/.agents/skills only
  --force         Overwrite skills that are already installed
  --dry-run       Print what would happen and change nothing
  -h, --help      Show this message

With no options, skills are copied into ~/.agents/skills and linked from
~/.claude/skills, so both Claude Code and Codex read the same files.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --claude-only) install_agents=0 ;;
    --codex-only)  install_claude=0 ;;
    --force)       force=1 ;;
    --dry-run)     dry_run=1 ;;
    -h|--help)     usage; exit 0 ;;
    *) printf 'Unknown option: %s\n\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

if [ ! -d "$SKILLS_SRC" ]; then
  printf 'error: %s not found\n' "$SKILLS_SRC" >&2
  exit 1
fi

run() {
  if [ "$dry_run" -eq 1 ]; then
    printf 'would: %s\n' "$*"
  else
    "$@"
  fi
}

# The default copies once into the shared directory and links Claude Code at
# it. With --claude-only the shared directory is not wanted at all, so the
# copy goes straight into ~/.claude/skills and nothing is linked.
if [ "$install_agents" -eq 1 ]; then
  copy_target="$AGENTS_DIR"
  link_target="$CLAUDE_DIR"
else
  copy_target="$CLAUDE_DIR"
  link_target=""
fi
if [ "$install_claude" -eq 0 ]; then
  link_target=""
fi

installed=0
skipped=0

for src in "$SKILLS_SRC"/*/; do
  [ -d "$src" ] || continue
  name="$(basename "$src")"
  dest="${copy_target}/${name}"

  if { [ -e "$dest" ] || [ -L "$dest" ]; } && [ "$force" -eq 0 ]; then
    printf 'skip   %s (already installed; use --force to replace)\n' "$name"
    skipped=$((skipped + 1))
    continue
  fi

  run mkdir -p "$copy_target"
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    run rm -rf "$dest"
  fi
  run cp -R "$src" "$dest"
  printf 'copied %s -> %s\n' "$name" "$dest"

  if [ -n "$link_target" ]; then
    link="${link_target}/${name}"
    run mkdir -p "$link_target"
    if [ -e "$link" ] || [ -L "$link" ]; then
      run rm -rf "$link"
    fi
    run ln -s "$dest" "$link"
    printf 'linked %s -> %s\n' "$name" "$link"
  fi

  installed=$((installed + 1))
done

printf '\n%d skill(s) installed, %d skipped\n' "$installed" "$skipped"

if [ "$installed" -gt 0 ] && [ "$dry_run" -eq 0 ]; then
  printf 'Start a new session for the skills to be discovered.\n'
fi
