#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Enforce strict-CSP-friendly HTML: no inline handlers/scripts/styles.

# Inline event handlers: attributes that start with "on" at attribute boundary.
if grep -RIn --include="*.html" -E "\son[a-zA-Z]+\s*=\s*\"" "$ROOT_DIR" >/dev/null; then
  echo "SECURITY GATE FAILED: inline event handler attributes found (e.g. onerror=)."
  grep -RIn --include="*.html" -E "\son[a-zA-Z]+\s*=\s*\"" "$ROOT_DIR" | head -n 50
  exit 1
fi

# Inline scripts
if grep -RIn --include="*.html" -E "<script[^>]*>[^<]" "$ROOT_DIR" >/dev/null; then
  echo "SECURITY GATE FAILED: inline <script> blocks found."
  grep -RIn --include="*.html" -E "<script[^>]*>[^<]" "$ROOT_DIR" | head -n 50
  exit 1
fi

# Inline styles (attribute)
# docs/CODIVIUM_DEVELOPER_REFERENCE.html is excluded — it is a documentation HTML file
# that legitimately contains style= attributes in code examples within <pre> blocks.
if grep -RIn --include="*.html" -E "\sstyle\s*=\s*\"" "$ROOT_DIR" \
    --exclude="CODIVIUM_DEVELOPER_REFERENCE.html" >/dev/null; then
  echo "SECURITY GATE FAILED: inline style attributes found."
  grep -RIn --include="*.html" -E "\sstyle\s*=\s*\"" "$ROOT_DIR" \
    --exclude="CODIVIUM_DEVELOPER_REFERENCE.html" | head -n 50
  exit 1
fi

# Inline <style> blocks
# docs/CODIVIUM_DEVELOPER_REFERENCE.html is excluded — it is a documentation HTML file
# with a <style> block for its own layout (not a page loaded in the app).
# assets/docs/scoring_how_it_works.html is excluded for the same reason — it is a
# standalone user-facing explanation page with its own self-contained styles.
if grep -RIn --include="*.html" -E "<style[^>]*>" "$ROOT_DIR" \
    --exclude="CODIVIUM_DEVELOPER_REFERENCE.html" \
    --exclude="scoring_how_it_works.html" >/dev/null; then
  echo "SECURITY GATE FAILED: inline <style> blocks found."
  grep -RIn --include="*.html" -E "<style[^>]*>" "$ROOT_DIR" \
    --exclude="CODIVIUM_DEVELOPER_REFERENCE.html" \
    --exclude="scoring_how_it_works.html" | head -n 50
  exit 1
fi

echo "Security gates passed." 
