# Codivium Dashboard — Canonical Contract Story

**Version:** 1.0.22  
This document is the single authoritative statement of the live contract chain.

---

## The three contracts

| Contract | File | Status |
|---|---|---|
| Raw data input | `contracts/raw-data-v1.contract.md` | ✅ Live |
| Dashboard payload output | `contracts/dashboard-payload-v2.contract.md` | ✅ Live |
| UI preferences model | `contracts/dashboard-ui-prefs-v1.contract.md` | ✅ Live |

---

## The chain

```
Your database
    ↓  (you query your DB)
CodiviumRawData  ← raw-data-v1 contract
    ↓  CodiviumDashboardPayloadV2Adapter.BuildFromRaw()
DashboardPayloadV2  ← dashboard-payload-v2 contract
    ↓  GET /api/dashboard/payload → JSON (camelCase)
Browser dashboard  ← dashboard.bundle.js
```

---

## UI preferences side-channel

```
Browser ↔ POST /api/dashboard/ui-prefs ↔ DashboardUiPrefs  ← dashboard-ui-prefs-v1 contract
              ↕ also persisted to localStorage "cv.dashboard.ui"
              ↕ also embedded in payload at meta.ui (merged at build time)
```

---

## Layout presets

Layout presets ("Full Dashboard", "Scores Only", etc.) are **frontend macros only**.
They serialize to `mode + panels` in `DashboardUiPrefs`. There is no `preset` field
in the backend model or any contract. See `backend/api/README_API.md` for the full
preset → mode/panels mapping.

---

## Stable version identifiers

| Thing | Stable version string |
|---|---|
| Raw data contract | `"raw-data-v1"` |
| Payload contract | `"dashboard-payload-v2"` — must appear in `payload.version` |
| UI prefs contract | `"dashboard-ui-prefs-v1"` |
| Backend all-in-one | `v38` (file: `CodiviumDashboardBackend_AllInOne_v38.cs`) |

---

## What is NOT in any contract

- The KaTeX scoring formulas (defined in `config/scoring-config.katex.v1.json`)
- The frontend tour/FAQ/glossary content (in-bundle)
- The layout preset macros (frontend only)
- The `granularity` parameter for weekly/monthly series (not yet implemented)

---

## For detailed field mapping

See `docs/FIELD_CONSISTENCY_MATRIX.md` — maps every significant field through
raw data → backend → payload → frontend.
