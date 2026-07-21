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

# Finds the latest release tag (Greek alphabet pattern) and checks it out.
# Falls back to main if no release tag exists yet.
checkout_latest_release() {
  git fetch --tags --quiet
  LATEST_TAG=$(git tag --sort=-creatordate | grep -E '^[a-z]+(-[a-z]+)?$' | head -1 || true)
  if [[ -n "$LATEST_TAG" ]]; then
    echo "→  Checking out release: $LATEST_TAG"
    git checkout "$LATEST_TAG" --quiet
  else
    echo "→  No release tag found — using latest main"
  fi
}

# ── Update ────────────────────────────────────────────────────────────────────
if [ "$MODE" = "--update" ]; then
  print_banner
  echo "→  Fetching latest release …"
  checkout_latest_release
  echo "→  Syncing dependencies …"
  npm install --silent
  CURRENT=$(git tag --sort=-creatordate | grep -E '^[a-z]+(-[a-z]+)?$' | head -1 || echo "unreleased")
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✓  On release: $CURRENT. Restart the dev server:"
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
  echo "✓  Repo already cloned at ./$DIR"
  cd "$DIR"
  checkout_latest_release
else
  echo "→  Cloning $REPO …"
  git clone "$REPO" "$DIR"
  cd "$DIR"
  checkout_latest_release
fi

echo "→  Installing dependencies …"
npm install --silent
mkdir -p data

CURRENT=$(git tag --sort=-creatordate | grep -E '^[a-z]+(-[a-z]+)?$' | head -1 || echo "unreleased")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓  All done. Release: $CURRENT"
echo ""
echo "  Starting server — watch the URL it prints below."
echo ""
echo "  Later: ./setup.sh --update   jump to latest release"
echo "         ./setup.sh --clean    wipe your data and start fresh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev
