#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "Running Codivium package checks..."
echo ""

# React bundle smoke test — checks bundles, HTML roots, CSS, route config
node "$ROOT_DIR/scripts/smoke_test.cjs"

# Per-page smoke tests
node "$ROOT_DIR/scripts/editor_smoke_test.cjs"
node "$ROOT_DIR/scripts/adaptive_smoke_test.cjs"
node "$ROOT_DIR/scripts/mcq_smoke_test.cjs"
node "$ROOT_DIR/scripts/account_settings_smoke_test.cjs"

# Dashboard unit tests
node "$ROOT_DIR/tests/dashboard.test.cjs"

# Dashboard mount tests (requires jsdom — skips gracefully if not installed)
node "$ROOT_DIR/tests/dashboard.mount.test.cjs"

# Payload contract validation
node "$ROOT_DIR/scripts/validate_payload_contract.cjs"

# Link checks
node "$ROOT_DIR/scripts/link_check.cjs"

# Regression guard
node "$ROOT_DIR/scripts/regression_guard.cjs"

# Manifest regeneration
node "$ROOT_DIR/scripts/generate_manifest.cjs"

# Optional: C# build/test if dotnet available
if command -v dotnet >/dev/null 2>&1; then
  echo "dotnet detected; running C# build + tests..."
  dotnet build "$ROOT_DIR/backend/Codivium.Dashboard.csproj" -c Release
  dotnet test "$ROOT_DIR/backend/tests/Codivium.Dashboard.Tests.csproj" -c Release
else
  echo "dotnet not found; skipping C# build/tests."
fi

echo ""
echo "All checks passed."
