# KaTeX ↔ Backend Alignment Log (Codivium)

This is a **living checklist** tracking whether the backend + raw payload + dashboard payload match the KaTeX scoring document.

## Legend
- ✅ = aligned
- 🟡 = partially aligned (works, but not yet strict / complete)
- ❌ = not aligned

## Step 1 (completed): Contract + Canonicalization Foundations

### Category key derivation (KaTeX: `key = lower(trim(x))`)
- Backend canonicalization function: ✅ implemented (`CodiviumCatalog.CanonicalizeCategoryKey`)
- Track id canonicalization kept separate (whitespace-stripping): ✅ implemented (`CodiviumCatalog.CanonicalizeTrackId`)
- Dashboard display mapping still uses TitleCase display: ✅ unchanged

### Category aliases (KaTeX: apply aliases *after* canonicalization)
- Config support for `category_key.aliases`: ✅ added to `scoring-config.v1.json` + `ScoringConfig.CategoryKey`
- Alias resolution applied consistently: ✅ implemented via `Catalog.ResolveCategoryKey(...)`
- Safety (alias hop limit / cycle defense): ✅ implemented

### Raw coding session needs stable ExerciseId (for KaTeX Points: distinct & redo counting)
- Raw contract type (`CodingSession.ExerciseId`): ✅ added (required)
- Raw-data builder supports and validates ExerciseId: ✅ updated (`CodiviumRawDataBuilder`)
- Demo/example sessions updated: ✅ updated
- Dashboard payload does not expose ExerciseId (not needed for UI): ✅ by design

### MCQ input `U_all` (lifetime distinct MCQ correct)
- Raw contract field added: ✅ required (`CodiviumRawData.UniqueCorrectMcqAllTime (legacy: mcqDistinctCorrectAllTime)`)
- Builder supports passing value: ✅ required parameter (no silent default)
- Strict requirement enforcement: ✅ enforced (required; non-negative)


### Timestamp requirements (KaTeX recency decay must be real)
- Accepted coding sessions must have CompletedAtUtc (or accepted attempt SubmittedAtUtc): ✅ enforced (no fallback)
- MCQ attempts must have TakenAtUtc when uses_recency_decay=true: ✅ enforced (no fallback)

---

## Step 2 (completed): KaTeX metrics calculations in backend

### Mastery (Codivium Score)
- Overall breadth `B` computed per-track then weighted (micro/interview/mcq): ✅
- Overall depth `D` computed per-track then weighted (micro/interview): ✅
- Mastery score `S = 2BD/(B+D)`: ✅

### Breadth (coding + MCQ)
- Evidence → confidence → entropy blend per KaTeX (tau_E / alpha / beta / k): ✅
- Overall breadth weights (micro/interview/mcq): ✅

### Depth (coding)
- Evidence-weighted average depth per KaTeX: ✅
- Depth-by-category chart mapping uses KaTeX `D_chart(c)=100*(1-exp(-E/λ))` and merges evidence by canonical key: ✅

### Points + Efficiency
- All-time points + 30d points (recency decay): ✅
- Efficiency (pts/hr) using accepted minutes: ✅

---

## Step 2B (completed): Post-implementation audit + fixes
- Strictness + masking + defensive guards applied: ✅
- Contract + adapter coherence verified: ✅

---

## Step 3 (in progress): Payload schema & dashboard consistency

### 3.1 Demo fixtures + payload-field audit (completed)
- Demo payload metrics updated so `breadthOverall` uses KaTeX overall weights: ✅
- Demo `codiviumScore` updated to KaTeX harmonic mean: ✅
- Demo fixtures regenerated from a single source of truth (`payload_example1.json`): ✅
- Added/required `meta.anchorDate` in demo payload: ✅
- Strengthened `scripts/validate_payload_contract.js` with a dashboard renderability audit (required KPI keys + panel blocks): ✅

### Remaining Step 3 items
- Ensure **info pane analysis text** is KaTeX-consistent for every metric/panel: 🟡
- Ensure CTA routing metadata is fully specified end-to-end: 🟡

---

## Step 4 (planned): KaTeX ↔ code consistency checks
- Unit tests: golden-sample raw payload → expected KaTeX outputs: 🟡 (not yet added)

## Step 5 (planned): Documentation
- Full integration guide: DB → raw payload → scoring → dashboard payload → frontend rendering: 🟡 (not yet written)
