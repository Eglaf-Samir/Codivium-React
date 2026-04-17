# ADR-001: Dashboard Payload V2 (not V3)

**Status:** Accepted  
**Date:** 2026-03  
**Deciders:** Dashboard team

## Decision
Use `dashboard-payload-v2` as the authoritative payload contract. Do not implement v3.

## Context
A v3 schema was proposed but not implemented. The v2 contract covers all required fields including KaTeX scoring, heatmap, MCQ, and CTA data.

## Consequences
- All backend adapters must produce v2-compliant payloads
- The schema is in `contracts/dashboard-payload-v2.schema.json`
- v3 references in legacy code are dead — ignore them
