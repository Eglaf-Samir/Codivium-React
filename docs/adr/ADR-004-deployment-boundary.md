# ADR-004: Deployment Boundary — Combined Package

**Status:** Accepted  
**Date:** 2026-03 (updated for v1.1.0)  
**Deciders:** Package owner

## Decision
The package ships as a combined ZIP containing both the dashboard runtime and the editor/workspace prototype. Classification is explicit in `deployment-manifest.json`.

## Context
Previously the package was dashboard-only. v1.1.0 adds editor/workspace pages at prototype stage. These must not be accidentally deployed to production.

## Consequences
- `editor.html` is classified `demo_test_only` until the prototype-to-production gap is closed
- Site-level route stubs exist for local dev only
- `../package/reference/DEPLOYMENT_BOUNDARY.md`, `../package/reference/PACKAGE_OBJECT_MAP.md`, and `deployment-manifest.json` are the authoritative classification sources
