# ADR-002: Split CSS Strategy (8 files, no dashboard.css)

**Status:** Accepted  
**Date:** 2026-03  
**Deciders:** Dashboard team

## Decision
The dashboard CSS is split into 8 purpose-built files. The legacy `dashboard.css` concat file is retired.

## Context
The monolithic `dashboard.css` caused cascade conflicts and made it hard to reason about ownership. The split strategy gives each concern its own file with clear ownership.

## Consequences
- All 8 CSS files must be deployed together
- `legacy/dashboard.css.legacy` exists for reference only
- New CSS belongs in the appropriate split file, not a new monolith
