#!/usr/bin/env bash
# compute_sri_hashes.sh
# Run from the codivium_platform directory.
# Requires: curl, openssl
# Outputs integrity= attribute values for editor.html CDN scripts.

set -euo pipefail

compute_hash() {
  local url="$1"
  local name="$2"
  echo -n "  ${name}: integrity=\"sha384-"
  curl -sf "$url" | openssl dgst -sha384 -binary | openssl base64 -A
  echo '"'
}

echo "SRI hashes for editor.html CDN scripts:"
echo "(Copy each integrity= value into the matching <script> tag in editor.html)"
echo ""

compute_hash \
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js" \
  "codemirror.min.js"

compute_hash \
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js" \
  "python.min.js"

compute_hash \
  "https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js" \
  "marked.min.js"

echo ""
echo "After computing, add to each <script> tag:"
echo '  integrity="sha384-[HASH]" crossorigin="anonymous"'
