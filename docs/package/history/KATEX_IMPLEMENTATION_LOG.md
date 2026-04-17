# KaTeX Backend Implementation Log (chronological)

## Step 1 — Contract + Canonicalization Foundations

### Changes made
1) **Category key canonicalization now matches KaTeX**
   - Categories: `lower(trim(x))` (no internal whitespace removal)
   - Tracks: keep whitespace-stripping behavior (track ids are not category keys)

2) **Alias mapping added + applied consistently**
   - `scoring-config.v1.json` now supports `category_key.aliases`.
   - `ScoringConfig` model now includes `CategoryKeyConfig`.
   - `CodiviumCatalog.Build(...)` builds an alias dictionary and stores it in the catalog.
   - All scoring/aggregation code now resolves categories via `catalog.ResolveCategoryKey(...)`.

3) **ExerciseId added to coding sessions**
   - `CodingSession.ExerciseId` is now required.
   - `CodiviumRawDataBuilder` validates `CodingSessionRow.ExerciseId` and copies it into `CodingSession`.

4) **MCQ `U_all` input added (optional for now)**
   - `CodiviumRawData.UniqueCorrectMcqAllTime (legacy: mcqDistinctCorrectAllTime)` added.
   - `CodiviumRawDataBuilder.Build(..., UniqueCorrectMcqAllTime (legacy: mcqDistinctCorrectAllTime))` supports passing it.

5) **Build conflict removed**
   - Removed the duplicate `CodiviumRecommendedActions` class from `CodiviumDashboardBackend_AllInOne_v38.cs`.
   - V2 payload generation continues to reference `CodiviumRecommendedActions` from `CodiviumRecommendedActions.v1.cs`.

### Tests
- Added unit tests verifying:
  - category key canonicalization is lower+trim only
  - track id canonicalization removes whitespace
  - alias resolution happens after canonicalization


## Step 1A — Raw Contract Strictness (KaTeX hard requirements)

### Changes made
1) **MCQ U_all is now required**
   - `CodiviumRawData.UniqueCorrectMcqAllTime (legacy: mcqDistinctCorrectAllTime)` changed from nullable to `required int`.
   - `CodiviumRawDataBuilder.Build(...)` now requires `UniqueCorrectMcqAllTime (legacy: mcqDistinctCorrectAllTime)` (no silent default).
   - Demo provider + tests updated to always supply a value.

2) **Timestamps are strict (no silent fallback)**
   - Accepted coding solves must have `CompletedAtUtc` (preferred) or accepted attempt `SubmittedAtUtc`.
   - MCQ attempts must have `TakenAtUtc` when `katex.mcq.breadth.uses_recency_decay = true`.
   - Removed fallback-to-StartedAt/asOf behavior in the KaTeX scorer to prevent decay distortion.

3) **Raw Data Contract published**
   - Added `contracts/raw-data-v1.contract.md`
   - Added `contracts/raw-data-v1.schema.json`

### Notes
- This step intentionally fails fast when required time fields are missing, rather than producing “plausible” numbers that do not match the KaTeX spec.
## Step 3.1 — Demo fixtures + payload-field audit (Dashboard payload consistency)

### Changes made
1) **Demo payload metrics now follow KaTeX composition rules**
   - `overall.metrics.breadthOverall` is now the weighted average of:
     - `breadthMicro`, `breadthInterview`, `breadthMcq`
     - using KaTeX config `breadth.overall_weights` (micro/interview/mcq).
   - `overall.metrics.codiviumScore` is now the KaTeX mastery harmonic mean:
     - `S = 2 * B * D / (B + D)` using `B = breadthOverall` and `D = depthOverall`.

2) **Demo fixtures regenerated from a single source**
   - `demo/payload_example1.json` is the canonical demo payload.
   - All `demo/demo_data_*.js` presets are now regenerated from that payload with preset-specific `meta.ui`/`_demoUi`.

3) **Anchor date added to demo payload**
   - Added `meta.anchorDate` (dashboard uses it when present).

4) **Strengthened payload validation checks**
   - `scripts/validate_payload_contract.js` now includes a renderability audit:
     - Requires the concrete KPI keys used by the dashboard’s `pick()` logic.
     - Requires core panel blocks (`combinedCoding`, `micro`, `interview`, `mcq`) and expected sub-shapes.

### Notes
- This step focuses on **payload completeness and demo coherence**.
- KaTeX-consistent **info pane narrative** remains a separate follow-up step.

## Step 4 (completed — 2026-03-05): Backend Insights + KaTeX-aligned CTAs

### G13 — Side-pane insights
- Implemented `CodiviumInsights.BuildAll(...)` to generate structured analysis text for all keys used by the dashboard’s info pane.
- Insights are computed server-side and embedded into `payload.overall.insights` so the frontend doesn’t rely on fallback logic.
- Explanations are KaTeX-aligned: breadth activation threshold (τ_E), entropy balance, confidence term, depth saturation, and convergence weights are described using the same terminology as the KaTeX document.

### G12 — Recommended actions (CTAs)
- Implemented `CodiviumRecommendedActions.BuildFromKatex(...)` to produce one action per panel (heatmap/allocation/depth/time/mcq).
- Actions are evidence-aware (use KaTeX evidence + category availability) and include routing hints: track, category, difficulty, timeboxMinutes, intent.
- Kept legacy `Build(payload,cfg)` as a payload-only fallback for backward compatibility.

### Scoring bundle
- Added `CodiviumScoring.ComputeScoreBundle(...)` returning:
  - `Scores` (legacy dictionary),
  - `Katex` (full KaTeX results),
  - `Catalog` (normalized universe/availability),
  - `AsOfUtc`.
- Adapter now uses the bundle to avoid recomputing KaTeX evidence.
