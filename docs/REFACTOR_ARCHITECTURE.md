# Refactor Target Architecture

**Version:** CVU-2026-03-AL  
**Status:** Design document — approved before atomic refactor begins.

---

## Current state (what we are moving away from)

```
backend/reference/
  CodiviumDashboardBackend_AllInOne_CodiviumScoringEngine.cs   ← 2450 lines, 12 classes in one file
                                                       COMPILED despite being in reference/
                                                       Misleading name suggests it is inactive

backend/
  CodiviumDashboardBackend_AllInOne_v38.cs           ← Only DTO classes — no scoring logic
  CodiviumKatexScoring.v1.cs                         ← Clean KaTeX math (stays as-is)
  CodiviumInsights.v1.cs                             ← Info pane analysis (stays as-is)
  CodiviumHeatmapFocusBuilder.v1.cs                  ← Focus mode rankings (stays, small fix)
  CodiviumDashboardPayloadV2Adapter.v1.cs            ← Payload assembly (stays as-is)
  CodiviumDashboardUiPrefs.v1.cs                     ← UI prefs model (stays as-is)
  CodiviumRawDataBuilder.v1.cs                       ← Raw data builder (stays as-is)
  CodiviumRecommendedActions.v1.cs                   ← CTA builder (stays as-is)
  CodiviumKatexConfig.v1.cs                          ← Config loader (stays as-is)
  CodiviumConfigValidation.v1.cs                     ← Config validation (stays as-is)
  CodiviumClock.v1.cs                                ← Clock abstraction (stays as-is)
  CodiviumJsonConverters.v1.cs                       ← JSON converters (stays as-is)
  CodiviumPoints.v1.cs                               ← Tombstone (stays as-is)
  McqPayloadCallExample.v1.cs                        ← Reference example (stays as-is)
```

---

## Target state (what we are moving to)

```
backend/
  CodiviumScoringEngine.cs          ← NEW: replaces v37 core (CodiviumScoring, 
                                       CodiviumRawData, CodingSession, CodiviumCatalog,
                                       HeatmapFocusModesConfig, CodiviumScoreBundle)
                                       ~680 lines (combined L43-L809 + L297-L518 from v37)

  CodiviumPayloadDtos.cs            ← NEW: replaces v38 (all DTO classes only, no logic)

  CodiviumDepthByCategory.cs        ← EXTRACTED from v37 L1230-L1307 (78 lines)
  CodiviumTimeOnPlatform.cs         ← EXTRACTED from v37 L1308-L1404 (97 lines)
  CodiviumAllocation.cs             ← EXTRACTED from v37 L1405-L1463 (59 lines)
  CodiviumMcq.cs                    ← EXTRACTED from v37 L1464-L1646 (183 lines)
  CodiviumConvergenceHeatmap.cs     ← EXTRACTED from v37 L1647-L1750 (104 lines)

  ── unchanged files ──────────────────────────────────────────────────────────
  CodiviumKatexScoring.v1.cs        ← UNCHANGED (the clean KaTeX math)
  CodiviumInsights.v1.cs            ← UNCHANGED (info pane analysis)
  CodiviumHeatmapFocusBuilder.v1.cs ← SMALL FIX: read alpha_imp/beta_imp from config
  CodiviumDashboardPayloadV2Adapter.v1.cs ← UNCHANGED
  CodiviumDashboardUiPrefs.v1.cs    ← UNCHANGED
  CodiviumRawDataBuilder.v1.cs      ← UNCHANGED
  CodiviumRecommendedActions.v1.cs  ← UNCHANGED
  CodiviumKatexConfig.v1.cs         ← SMALL FIX: add heatmap.focus_modes config reading
  CodiviumConfigValidation.v1.cs    ← UNCHANGED
  CodiviumClock.v1.cs               ← UNCHANGED
  CodiviumJsonConverters.v1.cs      ← UNCHANGED
  CodiviumPoints.v1.cs              ← UNCHANGED (tombstone)
  McqPayloadCallExample.v1.cs       ← UNCHANGED (reference example)

backend/reference/
  ← EMPTY (no compiled files remain here after refactor)
  CodiviumDashboardBackend_AllInOne_CodiviumScoringEngine.cs ← DELETED (content moved to new files)
  CodiviumMcqPayload.legacy.v1.cs                 ← UNCHANGED (legacy reference)
  CodiviumPoints.v1.superseded.cs                 ← UNCHANGED (legacy reference)

legacy/ (already exists)
  dashboard.css.legacy              ← UNCHANGED
```

---

## What is NOT moved from v37

Three classes in v37 are unused legacy code — they are **deleted**, not moved:

| Class | Lines | Reason |
|---|---|---|
| `CodiviumBreadthInsights` | L1751–L2267 (517 lines) | Superseded entirely by `CodiviumInsights.v1.cs`. No callers outside v37. |
| `CodiviumDashboardPayload` | L2268–L2354 (87 lines) | Old v1 payload builder. Superseded by `CodiviumDashboardPayloadV2Adapter.v1.cs`. No callers. |
| `CodiviumDashboardExample` | L2355–L2450 (96 lines) | Demo example. Superseded by `McqPayloadCallExample.v1.cs`. No callers. |

---

## Changes beyond file moves

### 1. CodiviumHeatmapFocusBuilder.v1.cs — read impact weights from config

Currently hardcoded:
```csharp
var impact = (0.55 * weakness + 0.45 * (1.0 - depthNorm)) * timeWeight;
```

After refactor, reads from config:
```csharp
var alphaImp = k.Heatmap?.FocusModes?.ImpactWeights?.AlphaImp ?? 0.55;
var betaImp  = k.Heatmap?.FocusModes?.ImpactWeights?.BetaImp  ?? 0.45;
var impact   = (alphaImp * weakness + betaImp * (1.0 - depthNorm)) * timeWeight;
```

### 2. CodiviumKatexConfig.v1.cs — add HeatmapConfig parsing

Add deserialization of the new `heatmap.focus_modes.impact_weights` section from
`scoring-config.katex.v1.json` into the KatexConfig object.

### 3. CodiviumConvergenceHeatmap.cs — minimum session guard (new)

The current code outputs `null` for cells with no sessions. We add a
`min_sessions_for_cell` config constant (default=1, matching current behaviour)
to formally specify the null threshold per the new KaTeX spec.

### 4. diagnostics bug — already fixed in previous pass

`firstTryPassRate`, `avgAttemptsToAC`, `medianTimeToACMinutes` were already fixed
in CVU-2026-03-AL. The fix is preserved through the refactor.

---

## Atomic step sequence

Steps are executed in this order. Oracle runs after EVERY step.

| Step | Action | Files touched | Logic change? |
|---|---|---|---|
| A | Extract `CodiviumDepthByCategory` from v37 → `CodiviumDepthByCategory.cs` | v37 (delete class), new file | None |
| B | Extract `CodiviumTimeOnPlatform` → `CodiviumTimeOnPlatform.cs` | v37, new file | None |
| C | Extract `CodiviumAllocation` → `CodiviumAllocation.cs` | v37, new file | None |
| D | Extract `CodiviumMcq` → `CodiviumMcq.cs` | v37, new file | None |
| E | Extract `CodiviumConvergenceHeatmap` → `CodiviumConvergenceHeatmap.cs` | v37, new file | None |
| F | Delete `CodiviumBreadthInsights`, `CodiviumDashboardPayload`, `CodiviumDashboardExample` from v37 | v37 | None (unused code) |
| G | Move remaining v37 content → `CodiviumScoringEngine.cs`, delete v37 file | v37 (deleted), new file | None |
| H | Move v38 DTOs → `CodiviumPayloadDtos.cs`, delete v38 file | v38 (deleted), new file | None |
| I | Add HeatmapConfig to `CodiviumKatexConfig.v1.cs` | CodiviumKatexConfig.v1.cs | None (config reading only) |
| J | Read impact weights from config in `CodiviumHeatmapFocusBuilder.v1.cs` | CodiviumHeatmapFocusBuilder.v1.cs | Numeric: same values, from config |
| K | Update `.csproj` compile includes if needed | Codivium.Dashboard.csproj | None |
| L | Update `package/reference/DEPLOYMENT_BOUNDARY.md`, `package/reference/DEPLOY_WHITELIST.txt`, `package/getting-started/HANDOVER.md` | Docs | None |

---

## Golden oracle checkpoints

Oracle (`python3 tests/verify_golden_output.py`) runs after steps:
A, B, C, D, E, F, G, H, I, J — every step.

Step J is the only step with a numeric change (impact weights from config).
Since the config values are 0.55/0.45 (same as the hardcoded values),
the oracle must still pass green after step J.

---

## File ownership after refactor

| File | Owns |
|---|---|
| `CodiviumScoringEngine.cs` | `CodiviumRawData`, `CodingSession`, `ComputeScoreBundle`, `CodiviumCatalog`, config types |
| `CodiviumPayloadDtos.cs` | All payload DTO classes (`DashboardPayloadV2`, `MetricsDto`, etc.) |
| `CodiviumKatexScoring.v1.cs` | All KaTeX math (evidence, breadth, depth, score, points, efficiency) |
| `CodiviumDepthByCategory.cs` | Depth-by-category chart computation |
| `CodiviumTimeOnPlatform.cs` | Daily time-on-platform series |
| `CodiviumAllocation.cs` | Minutes and solved count per category |
| `CodiviumMcq.cs` | MCQ performance chart payload |
| `CodiviumConvergenceHeatmap.cs` | Heatmap cell values and matrix |
| `CodiviumHeatmapFocusBuilder.v1.cs` | Focus mode rankings (reads config weights) |
| `CodiviumInsights.v1.cs` | Info pane analysis text |
| `CodiviumDashboardPayloadV2Adapter.v1.cs` | Wires everything into the v2 payload |
