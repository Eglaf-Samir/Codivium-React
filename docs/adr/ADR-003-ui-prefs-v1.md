# ADR-003: UI Preferences V1 Model

**Status:** Accepted  
**Date:** 2026-03  
**Deciders:** Dashboard team

## Decision
Use `dashboard-ui-prefs-v1` as the UI preferences contract. The server persists `selectedTrack` and related prefs; the frontend reads them from the payload.

## Context
UI preferences needed a stable contract to allow server-side persistence without frontend drift.

## Consequences
- `selectedTrack` flows from server through payload to UI
- See `contracts/dashboard-ui-prefs-v1.contract.md`
