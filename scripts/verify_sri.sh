#!/usr/bin/env bash
# verify_sri.sh — Verify and print SRI hashes for editor/workspace CDN dependencies.
# Run this before deployment to get the correct integrity= values.
# Usage: bash scripts/verify_sri.sh
set -euo pipefail

echo "Fetching and computing SRI hashes for editor/workspace CDN assets..."
echo "Add these as integrity= attributes in editor.html."
echo ""

sri() {
  local url="$1"
  local name="$2"
  local tmp
  tmp=$(mktemp)
  if curl -fsSL --retry 3 "$url" -o "$tmp" 2>/dev/null; then
    local hash
    hash=$(openssl dgst -sha384 -binary "$tmp" | openssl base64 -A)
    echo "  $name"
    echo "    URL: $url"
    echo "    integrity=\"sha384-${hash}\""
    echo ""
  else
    echo "  FAILED: $url"
    echo ""
  fi
  rm -f "$tmp"
}

sri "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css"  "CodeMirror CSS"
sri "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"   "CodeMirror JS"
sri "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js" "CodeMirror Python mode"
sri "https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"                       "marked.js"

echo "Done. Paste the integrity= values into editor.html before deployment."
