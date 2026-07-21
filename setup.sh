#!/usr/bin/env bash
set -e

REPO="https://github.com/mavinash-dev/unified-developer-platform"
DIR="unified-developer-platform"
MODE="${1:-install}"   # install | --update | --clean

print_banner() {
  echo ""
  echo "  ██╗   ██╗██████╗ ██████╗ "
  echo "  ██║   ██║██╔══██╗██╔══██╗"
  echo "  ██║   ██║██║  ██║██║  ██║"
  echo "  ██║   ██║██║  ██║██║  ██║"
  echo "  ╚██████╔╝██████╔╝██████╔╝"
  echo "   ╚═════╝ ╚═════╝ ╚═════╝   Unified Developer Dashboard"
  echo ""
  echo "  Built by Avinash · mavinash.dev@gmail.com"
  echo "  $REPO"
  echo ""
}

# ── Update ────────────────────────────────────────────────────────────────────
if [ "$MODE" = "--update" ]; then
  print_banner
  echo "→  Pulling latest changes …"
  git pull --ff-only
  echo "→  Syncing dependencies …"
  npm install --silent
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✓  Updated. Restart the dev server to apply changes:"
  echo ""
  echo "     npm run dev"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 0
fi

# ── Clean ─────────────────────────────────────────────────────────────────────
if [ "$MODE" = "--clean" ]; then
  print_banner
  echo "⚠️   CLEAN will permanently delete:"
  echo "     • data/career.db        (all applications, resumes, contacts, sessions)"
  echo "     • data/udd/               (your profile and context snapshot)"
  echo ""
  echo "    The app code and your installed skills are NOT touched."
  echo ""
  printf "    Type YES to confirm: "
  read -r CONFIRM
  if [ "$CONFIRM" != "YES" ]; then
    echo "  Cancelled — nothing was deleted."
    exit 0
  fi
  echo ""
  echo "→  Deleting data/career.db …"
  rm -f data/career.db
  echo "→  Deleting data/udd/ …"
  rm -rf "data/udd"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✓  Clean complete. Fresh start on next npm run dev."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 0
fi

# ── Install (default) ─────────────────────────────────────────────────────────
print_banner

if ! command -v node &>/dev/null; then
  echo "❌  Node.js not found. Install from https://nodejs.org (v18+) and re-run."
  exit 1
fi
NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
echo "✓  Node $NODE_VER"

if ! command -v claude &>/dev/null; then
  echo ""
  echo "⚠️   Claude CLI not found — install it first:"
  echo "     npm install -g @anthropic-ai/claude-code"
  echo "    Then re-run this script."
  exit 1
fi
echo "✓  Claude CLI found"

if [ -d "$DIR" ]; then
  echo "✓  Repo already cloned at ./$DIR — pulling latest"
  git -C "$DIR" pull --ff-only
else
  echo "→  Cloning $REPO …"
  git clone "$REPO" "$DIR"
fi

cd "$DIR"
echo "→  Installing dependencies …"
npm install --silent
mkdir -p data

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓  All done. Start the dashboard:"
echo ""
echo "     cd $DIR && npm run dev"
echo ""
echo "  Then open: http://localhost:3004"
echo ""
echo "  Later: ./setup.sh --update   pull latest changes"
echo "         ./setup.sh --clean    wipe your data and start fresh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
