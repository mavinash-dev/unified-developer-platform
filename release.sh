#!/usr/bin/env bash
set -euo pipefail

# Greek alphabet sequence — must match lib/version.ts
GREEK=(alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega)

# Build full sequence: alpha…omega, then alpha-alpha…omega-omega
SEQUENCE=("${GREEK[@]}")
for a in "${GREEK[@]}"; do
  for b in "${GREEK[@]}"; do
    SEQUENCE+=("${a}-${b}")
  done
done

# Find last released version from git tags
LAST_TAG=$(git tag --sort=-creatordate | grep -E '^[a-z]+(-[a-z]+)?$' | head -1 || true)

if [[ -z "$LAST_TAG" ]]; then
  NEXT="alpha"
else
  # Find position of last tag in sequence
  FOUND=-1
  for i in "${!SEQUENCE[@]}"; do
    if [[ "${SEQUENCE[$i]}" == "$LAST_TAG" ]]; then
      FOUND=$i
      break
    fi
  done

  if [[ $FOUND -eq -1 ]]; then
    echo "✗ Last tag '$LAST_TAG' not found in Greek sequence. Something is off."
    exit 1
  fi

  NEXT_IDX=$((FOUND + 1))
  if [[ $NEXT_IDX -ge ${#SEQUENCE[@]} ]]; then
    echo "✗ Already at the last version (${SEQUENCE[-1]}). That's 600 releases — impressive."
    exit 1
  fi

  NEXT="${SEQUENCE[$NEXT_IDX]}"
fi

PREV="${LAST_TAG:-}"

echo ""
echo "  ⚡ UDD Release"
echo "  ──────────────────────────────"
if [[ -n "$PREV" ]]; then
  echo "  Current : $PREV"
fi
echo "  Next    : $NEXT"
echo "  ──────────────────────────────"
echo ""
read -p "  Release as '$NEXT'? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "  Aborted."
  exit 0
fi

# Update lib/version.ts
sed -i '' "s/^export const VERSION = '[^']*'/export const VERSION = '${NEXT}'/" lib/version.ts

# Verify
if ! grep -q "VERSION = '${NEXT}'" lib/version.ts; then
  echo "✗ Failed to update lib/version.ts"
  exit 1
fi

# Tag and push — no file changes needed, version is derived from tags at runtime
git tag "${NEXT}"
git push --tags

# Create GitHub release if gh is available
RELEASE_NOTES="UDD ${NEXT}"
if [[ -n "$PREV" ]]; then
  RELEASE_NOTES="UDD ${NEXT} — follows ${PREV}"
fi

if command -v gh &>/dev/null; then
  gh release create "${NEXT}" --title "UDD ${NEXT}" --notes "${RELEASE_NOTES}"
  echo ""
  echo "  ✓ Released ${NEXT} — live on GitHub Releases"
else
  echo ""
  echo "  ✓ Tag pushed. Install 'gh' CLI to auto-create GitHub Releases."
fi

if [[ -n "$PREV" ]]; then
  echo "  ${PREV} → ${NEXT}"
fi
echo ""
