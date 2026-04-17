#!/usr/bin/env bash
# build_dashboard_bundle.sh
#
# Builds assets/components/dashboard/js/dashboard.bundle.js from numbered sources.
#
# TWO MODES:
#   [esbuild]   npm install --save-dev esbuild  (recommended)
#               -> minification, source maps, strict syntax validation
#
#   [fallback]  no esbuild installed
#               -> concat + node --check (original behaviour, no minification)
#
# Source files are IIFEs (not ESM) - esbuild runs with --bundle=false.
# Output path never changes: dashboard.bundle.js

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."  && pwd)"
SRC_DIR="$ROOT_DIR/assets/components/dashboard/js"
OUT="$SRC_DIR/dashboard.bundle.js"
OUT_MAP="${OUT}.map"

FILES=(
  "dashboard.00.config.js"
  "dashboard.00a.utils.js"
  "dashboard.00b.state.js"
  "dashboard.00c.layout.js"
  "dashboard.00d.data.js"
  "dashboard.00e.resizers.js"
  "dashboard.01.scoreinfo.js"
  "dashboard.02.heatmap-analysis.js"
  "dashboard.03.time-analysis.js"
  "dashboard.04.exercise-analysis.js"
  "dashboard.05.overview-analysis.js"
  "dashboard.06.mcq-and-render.js"
  "dashboard.06b.refresh.js"
  "dashboard.07.tour.js"
  "dashboard.08.help-and-init.js"
  "dashboard.09.analyse-mode.js"
)

# Locate esbuild: local node_modules first, then PATH
ESBUILD_BIN="$ROOT_DIR/node_modules/.bin/esbuild"
if [ ! -x "$ESBUILD_BIN" ]; then
  ESBUILD_BIN="$(which esbuild 2>/dev/null || true)"
fi

CONCAT_TMP="${OUT}.concat.tmp"

echo "(function(){'use strict';" > "$CONCAT_TMP"
for f in "${FILES[@]}"; do
  cat "$SRC_DIR/$f" >> "$CONCAT_TMP"
  echo >> "$CONCAT_TMP"
done
echo "})();" >> "$CONCAT_TMP"

if [ -x "$ESBUILD_BIN" ]; then
  "$ESBUILD_BIN" "$CONCAT_TMP" \
    --bundle=false \
    --sourcemap \
    --outfile="$OUT" \
    --log-level=warning

  rm -f "$CONCAT_TMP"
  echo "Built $OUT (esbuild | source map: $OUT_MAP)"
else
  mv "$CONCAT_TMP" "$OUT"
  node --check "$OUT" >/dev/null
  echo "Built $OUT (concat fallback)"
  echo "  To enable esbuild (source maps + strict validation): npm install --save-dev esbuild"
fi

# ── Build ZIP distribution ────────────────────────────────────────
# Usage: cd /path/to/codivium_platform && bash scripts/build_zip.sh [output_path]
# Creates a distributable ZIP excluding source-only and dev-only folders.
build_zip() {
  local OUTPUT="${1:-codivium_platform_dist.zip}"
  echo "Building distribution ZIP: $OUTPUT"
  cd "$(dirname "$0")/.." || exit 1
  zip -r "$OUTPUT" . \
    --exclude "*/node_modules/*" \
    --exclude "*/.git/*" \
    --exclude "*/assets/vendor/*" \
    --exclude "*/.colour_backup/*" \
    --exclude "*/package-docs/*" \
    --exclude "*/scripts/.*" \
    --exclude "*/__pycache__/*"
  echo "ZIP created: $OUTPUT"
}
