#!/usr/bin/env bash
# Links skills from this repo into ~/.claude/commands/ so Claude Code picks them up.
# Uses symlinks — git pull automatically updates skills without re-running this script.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/commands"
SKILLS_SRC="$REPO_DIR/skills"

if [ ! -d "$SKILLS_SRC" ]; then
  echo "Error: $SKILLS_SRC not found. Are you running from the repo root?" >&2
  exit 1
fi

mkdir -p "$SKILLS_DIR"
echo "Linking skills: $SKILLS_SRC → $SKILLS_DIR"
echo ""

linked=0
skipped=0

for skill in "$SKILLS_SRC"/*.md; do
  [ -f "$skill" ] || continue
  name="$(basename "$skill")"
  target="$SKILLS_DIR/$name"

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "  ⚠  $name — already exists (not a symlink). Remove it manually to replace:"
    echo "     rm \"$target\""
    skipped=$((skipped + 1))
  else
    ln -sf "$skill" "$target"
    echo "  ✓  $name"
    linked=$((linked + 1))
  fi
done

echo ""
echo "$linked skill(s) linked, $skipped skipped."
echo ""
echo "Skills update automatically on 'git pull' — no need to re-run setup."
echo "Start the dashboard: npm run dev"
