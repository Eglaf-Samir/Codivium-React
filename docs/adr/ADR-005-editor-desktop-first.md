# ADR-005: Editor/Workspace Desktop-First Policy

**Status:** Accepted  
**Date:** 2026-03  
**Deciders:** Editor/workspace team

## Decision
The exercise workspace is desktop-first. Minimum supported viewport: 1280×720px. A graceful unsupported notice is shown below 1024px logical width.

## Context
The 4-pane resizable layout requires screen real estate to be usable. Mobile/tablet support would require a fundamentally different layout model. Desktop-first is the correct trade-off for the target user (developer/student at a desk).

## Consequences
- No responsive layout engineering required (reduces scope significantly)
- `#cvd-unsupported-screen` handles all sub-1024px viewports
- Documented in `docs/EDITOR_DESIGN_SYSTEM.md` and `../package/operations/BROWSER_SUPPORT.md`
