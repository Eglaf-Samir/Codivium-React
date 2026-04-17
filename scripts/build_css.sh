#!/usr/bin/env bash
# build_css.sh
# Minifies all CSS files in the assets/ directory using lightning-css.
# Outputs to dist/assets/ with content-hash filenames for long-lived caching.
#
# Prerequisites: npm install --save-dev lightningcss
# Usage: bash scripts/build_css.sh [output-dir]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}") /.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist}"
ASSETS_DIR="$ROOT_DIR/assets"
LIGHTNINGCSS="$ROOT_DIR/node_modules/.bin/lightningcss"

if [ ! -x "$LIGHTNINGCSS" ]; then
  echo "lightningcss not installed. Run: npm install --save-dev lightningcss"
  echo "Falling back to: copy CSS without minification"
  # Fallback: just copy
  find "$ASSETS_DIR" -name "*.css" -not -path "*/.colour_backup/*" | while read -r f; do
    rel="${f#$ROOT_DIR/}"
    dest="$OUT_DIR/$rel"
    mkdir -p "$(dirname "$dest")"
    cp "$f" "$dest"
  done
  echo "CSS copied (not minified) to $OUT_DIR"
  exit 0
fi

TARGETS="Chrome >= 89, Firefox >= 75, Safari >= 15"
MANIFEST="$OUT_DIR/css-manifest.json"
echo "{" > "$MANIFEST"
first=true

find "$ASSETS_DIR" -name "*.css" -not -path "*/.colour_backup/*" | sort | while read -r f; do
  rel="${f#$ROOT_DIR/}"
  dest_dir="$OUT_DIR/$(dirname "$rel")"
  mkdir -p "$dest_dir"

  # Compute content hash
  hash=$(sha256sum "$f" | cut -c1-12)
  base="${rel%.css}"
  out_file="$OUT_DIR/${base}.${hash}.css"

  "$LIGHTNINGCSS" --minify --targets "$TARGETS" "$f" -o "$out_file"

  # Write manifest entry
  if [ "$first" = true ]; then first=false; else echo "," >> "$MANIFEST"; fi
  echo -n "  \"$rel\": \"${base}.${hash}.css\"" >> "$MANIFEST"
done

echo -e "\n}" >> "$MANIFEST"
echo "CSS minified to $OUT_DIR"
echo "Manifest: $MANIFEST"
