#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR="$ROOT_DIR/assets/vendor"

mkdir -p "$VENDOR/chartjs" "$VENDOR/katex/contrib" "$VENDOR/katex/fonts"

# Chart.js (UMD)
# Try multiple CDNs for resilience (some networks block specific hosts).
CHART_URLS=(
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
)
CHART_OUT="$VENDOR/chartjs/chart.umd.min.js"

# KaTeX
# Use jsDelivr by default; fall back to unpkg if needed.
KATEX_BASES=(
  "https://cdn.jsdelivr.net/npm/katex@0.16.33/dist"
  "https://unpkg.com/katex@0.16.33/dist"
)
pick_katex_base() {
  local base
  for base in "${KATEX_BASES[@]}"; do
    if curl -fsSL "$base/katex.min.js" -o /dev/null; then
      echo "$base"
      return 0
    fi
  done
  return 1
}

KATEX_BASE="$(pick_katex_base)" || {
  echo "ERROR: Failed to reach KaTeX CDN endpoints." >&2
  echo "       If you're on a restricted network, you can still run the dashboard" >&2
  echo "       with CDN fallbacks enabled (data-cv-allow-cdn=\"true\")." >&2
  exit 1
}

KATEX_CSS="$KATEX_BASE/katex.min.css"
KATEX_JS="$KATEX_BASE/katex.min.js"
KATEX_AR="$KATEX_BASE/contrib/auto-render.min.js"


download_first_ok() {
  local out="$1"; shift
  local url
  for url in "$@"; do
    if curl -fsSL "$url" -o "$out"; then
      echo "$url"
      return 0
    fi
  done
  return 1
}

CHART_USED="$(download_first_ok "$CHART_OUT" "${CHART_URLS[@]}")" || {
  echo "ERROR: Failed to download Chart.js from all known sources." >&2
  echo "       If you're on a restricted network, enable CDN fallbacks by setting" >&2
  echo "       data-cv-allow-cdn=\"true\" on the dashboard HTML page." >&2
  exit 1
}

echo "Downloaded Chart.js ($CHART_USED) -> $CHART_OUT"

curl -fsSL "$KATEX_CSS" -o "$VENDOR/katex/katex.min.css"
curl -fsSL "$KATEX_JS" -o "$VENDOR/katex/katex.min.js"
curl -fsSL "$KATEX_AR" -o "$VENDOR/katex/contrib/auto-render.min.js"

# KaTeX fonts referenced by katex.min.css
# Download the full set of fonts used by KaTeX 0.16.33.
FONTS=(
  "KaTeX_AMS-Regular.woff2"
  "KaTeX_Caligraphic-Bold.woff2"
  "KaTeX_Caligraphic-Regular.woff2"
  "KaTeX_Fraktur-Bold.woff2"
  "KaTeX_Fraktur-Regular.woff2"
  "KaTeX_Main-Bold.woff2"
  "KaTeX_Main-BoldItalic.woff2"
  "KaTeX_Main-Italic.woff2"
  "KaTeX_Main-Regular.woff2"
  "KaTeX_Math-BoldItalic.woff2"
  "KaTeX_Math-Italic.woff2"
  "KaTeX_SansSerif-Bold.woff2"
  "KaTeX_SansSerif-Italic.woff2"
  "KaTeX_SansSerif-Regular.woff2"
  "KaTeX_Script-Regular.woff2"
  "KaTeX_Size1-Regular.woff2"
  "KaTeX_Size2-Regular.woff2"
  "KaTeX_Size3-Regular.woff2"
  "KaTeX_Size4-Regular.woff2"
  "KaTeX_Typewriter-Regular.woff2"
)

for f in "${FONTS[@]}"; do
  curl -fsSL "$KATEX_BASE/fonts/$f" -o "$VENDOR/katex/fonts/$f"
done

echo "Downloaded KaTeX -> $VENDOR/katex"

echo "Done. You can now run the dashboard fully offline using the local vendor assets."
# ── Editor / Workspace dependencies (optional — vendor instead of CDN) ─────────
# CodeMirror 5.65.16

echo "Fetching CodeMirror (editor/workspace)..."
mkdir -p "$ROOT_DIR/assets/vendor/codemirror"
curl -fsSL "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css" \
  -o "$ROOT_DIR/assets/vendor/codemirror/codemirror.min.css"
curl -fsSL "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js" \
  -o "$ROOT_DIR/assets/vendor/codemirror/codemirror.min.js"
mkdir -p "$ROOT_DIR/assets/vendor/codemirror/mode/python"
curl -fsSL "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js" \
  -o "$ROOT_DIR/assets/vendor/codemirror/mode/python/python.min.js"

echo "Fetching marked.js (editor/workspace)..."
mkdir -p "$ROOT_DIR/assets/vendor/marked"
curl -fsSL "https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js" \
  -o "$ROOT_DIR/assets/vendor/marked/marked.min.js"

echo "Editor/workspace vendor deps fetched."
echo "To use vendored versions, update editor.html to reference assets/vendor/ paths."
