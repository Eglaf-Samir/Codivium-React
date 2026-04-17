#!/bin/bash
# Codivium — Local development server
# Run: bash serve.sh
# Then open: http://localhost:3000

echo "Starting Codivium local server..."
echo ""
echo "Once started, open your browser to: http://localhost:3000"
echo "Press Ctrl+C to stop."
echo ""

# Try npx serve, fall back to Python
if command -v npx &> /dev/null; then
  npx serve . --listen 3000
elif command -v python3 &> /dev/null; then
  python3 -m http.server 3000
else
  python -m http.server 3000
fi
