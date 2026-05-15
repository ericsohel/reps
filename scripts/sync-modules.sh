#!/usr/bin/env bash
# Mirror the roadmap markdown source files into app/roadmap/_content/.
#
# Source files live outside the Next.js project (sibling repo). They're not
# bundled by Next, so we keep a versioned copy inside the app for SSG builds.
#
# This script is safe to run on Vercel / CI: if the source dir isn't present
# it exits 0 silently, leaving the committed _content/ copy in place.
#
# Override the source location with ROADMAP_MODULES_DIR if needed.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEFAULT_SOURCE="$SCRIPT_DIR/../../roadmap/dsa-roadmap/modules"
SOURCE="${ROADMAP_MODULES_DIR:-$DEFAULT_SOURCE}"
TARGET="$SCRIPT_DIR/../app/roadmap/_content"

if [ ! -d "$SOURCE" ]; then
  # Source not available (CI, fresh clone, etc.) — keep the committed copy.
  exit 0
fi

if [ ! -d "$TARGET" ]; then
  mkdir -p "$TARGET"
fi

changed=0
for src in "$SOURCE"/*.md; do
  [ -f "$src" ] || continue
  dst="$TARGET/$(basename "$src")"
  if [ ! -f "$dst" ] || ! cmp -s "$src" "$dst"; then
    cp "$src" "$dst"
    changed=$((changed + 1))
  fi
done

if [ "$changed" -gt 0 ]; then
  echo "✓ sync-modules: refreshed $changed file(s) from $SOURCE"
fi
