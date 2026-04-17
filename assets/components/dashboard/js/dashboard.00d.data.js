// dashboard.00d.data.js — getInfoContent, getAnalysisText, applyDashboardData, refresh
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

function getInfoContent(key){
    const base = INFO_CONTENT[key] || null;
    const detail = (typeof INFO_DETAIL !== 'undefined' && INFO_DETAIL[key]) ? INFO_DETAIL[key] : null;
    const override = (__cvState.__infoContentOverrides && __cvState.__infoContentOverrides[key]) ? __cvState.__infoContentOverrides[key] : null;
    if (!base && !detail && !override) return null;
    return Object.assign({}, base || {}, detail || {}, override || {});
  }

  function getAnalysisText(key){
    if (__cvState.__analysisOverrides && typeof __cvState.__analysisOverrides[key] === "string") return __cvState.__analysisOverrides[key];
    if (typeof __cvState.__analysisProvider === "function") {
      try {
        const v = __cvState.__analysisProvider(key, __cvState.__dashData);
        if (typeof v === "string") return v;
      } catch (e) {
        // fail open to built-in interpretation
      }
    }
    return interpretMetric(key) || "";
  }

  /**
   * Apply a production payload to the dashboard's internal data model.
   * This keeps visuals identical but allows real data injection.
   *
   * @param {DashboardData} payload
   */
  function applyDashboardData(payload){
    if (!payload || typeof payload !== "object") return;

    __cvState.__dashData = payload;

    __cvEnsureUiPrefsLoaded();

    // Detect v2 (track-namespaced) payloads
    const __isV2 = !!(payload && typeof payload === "object" && (payload.micro || payload.interview || payload.mcq || payload.Micro || payload.Interview || payload.Mcq));

    // Sources by namespace
    const __overallSrc = __isV2 ? (payload.overall || payload.Overall || payload.summary || payload.Summary || {}) : payload;
    const __codingSrc  = __isV2 ? (payload.combinedCoding || payload.CombinedCoding || payload.coding || payload.Coding || payload.combined || payload.Combined || {}) : payload;
    const __microSrc   = __isV2 ? (payload.micro || payload.Micro || {}) : null;
    const __interviewSrc = __isV2 ? (payload.interview || payload.Interview || {}) : null;
    const __mcqSrc     = __isV2 ? (payload.mcq || payload.Mcq || {}) : payload;

    // Endpoint override (optional)
    const ep = (payload && payload.meta && (payload.meta.sessionStartEndpoint || payload.meta.session_start_endpoint)) ||
               (__overallSrc && __overallSrc.meta && (__overallSrc.meta.sessionStartEndpoint || __overallSrc.meta.session_start_endpoint)) ||
               (payload && (payload.sessionStartEndpoint || payload.session_start_endpoint)) || null;
    if (ep) __cvState.__sessionStartEndpoint = String(ep);

    // Reset v2-only structures if not v2
    if (!__isV2){
      __cvState.__heatmapData = null;
      __cvState.__heatmapFocus = null;
    }

    // Anchor date (optional): supports anchorDate / anchor_date / meta.anchorDate / snapshotDate.
    const ad =
      (payload.anchorDate ?? payload.anchor_date ??
       (payload.meta && (payload.meta.anchorDate ?? payload.meta.anchor_date)) ??
       payload.snapshotDate ?? payload.snapshot_date ?? null);
    __cvState.__anchorDateValue = ad ? String(ad) : null;


    // UI prefs (optional): payload.meta.ui.mode and .panels are only applied
    // when the user has NOT saved a personal layout preference — prevents the
    // demo/default payload from overwriting a saved layout choice on every load.
    // selectedTrack always comes from the payload when present (it is content-
    // driven, not a user layout preference).
    const uiFromPayload = __cvReadUiFromPayload(payload, __overallSrc);
    const hasUserPref = !!(window.localStorage && window.localStorage.getItem(__UI_STORAGE_KEY));
    if (uiFromPayload){
      if (!hasUserPref){
        __cvState.__uiMode = uiFromPayload.mode;
        __cvState.__uiPanels = Object.assign({}, uiFromPayload.panels);
        __cvWriteUiToLocalStorage({ mode: __cvState.__uiMode, panels: __cvState.__uiPanels });
      }
      // selectedTrack always applies from payload regardless of stored prefs
      if (uiFromPayload.selectedTrack) __cvState.__selectedCodingTrack = uiFromPayload.selectedTrack;
    }

    // allowedModes: server-side mode restriction (optional). Clamping enforced in __cvGetEffectiveUiState.
    try {
      const _meta = payload && typeof payload === 'object' && payload.meta && typeof payload.meta === 'object' ? payload.meta : null;
      const am = _meta && (_meta.allowedModes || _meta.AllowedModes);
      __cvState.__allowedModes = (Array.isArray(am) && am.length > 0)
        ? am.map((m) => __cvNormalizeUiMode(m))
        : null;
    } catch (_) { __cvState.__allowedModes = null; }


    // Overrides for the info pane (dynamic "Analysis of your results")
    if (payload.analysisOverrides && typeof payload.analysisOverrides === "object"){
      __cvState.__analysisOverrides = payload.analysisOverrides;
    }
    if (payload.infoContentOverrides && typeof payload.infoContentOverrides === "object"){
      __cvState.__infoContentOverrides = payload.infoContentOverrides;
    }

    // Structured insights (Option B). Accept both camelCase and PascalCase payloads.
    const insightsObj =
      (__overallSrc.insights && typeof __overallSrc.insights === "object") ? __overallSrc.insights :
      (__overallSrc.Insights && typeof __overallSrc.Insights === "object") ? __overallSrc.Insights :
      null;
    if (insightsObj) __cvState.__insights = insightsObj;
    if (typeof payload.analysisProvider === "function" || typeof __overallSrc.analysisProvider === "function"){
      __cvState.__analysisProvider = (typeof __overallSrc.analysisProvider === "function") ? __overallSrc.analysisProvider : payload.analysisProvider;
    }

    // Charts / metrics data
    // Allocation by category (exercise time): accept multiple payload shapes/casing.
const alloc =
  (__codingSrc.allocation && Array.isArray(__codingSrc.allocation)) ? __codingSrc.allocation :
  (__codingSrc.Allocation && Array.isArray(__codingSrc.Allocation)) ? __codingSrc.Allocation :
  (__codingSrc.allocationByCategory && Array.isArray(__codingSrc.allocationByCategory)) ? __codingSrc.allocationByCategory :
  (__codingSrc.AllocationByCategory && Array.isArray(__codingSrc.AllocationByCategory)) ? __codingSrc.AllocationByCategory :
  (__codingSrc.allocation && __codingSrc.allocation.rows && Array.isArray(__codingSrc.allocation.rows)) ? __codingSrc.allocation.rows :
  (__codingSrc.Allocation && __codingSrc.Allocation.Rows && Array.isArray(__codingSrc.Allocation.Rows)) ? __codingSrc.Allocation.Rows :
  null;

if (alloc){
  exerciseTimeByCategory = alloc.map((x) => ({
    category: String(x.category ?? x.Category ?? ""),
    minutes: Number(x.minutes ?? x.Minutes) || 0,
    solved: Number(x.solved ?? x.Solved) || 0,
  })).filter(x => x.category);

  // Keep category list in sync (used by MCQ and heatmap defaults)
  CATEGORIES = exerciseTimeByCategory.map(x => x.category);
}

// Cache per-track allocation (used by the coding track selector).
function __extractAlloc(src) {
  if (!src) return null;
  const a = src.allocation || src.Allocation || src.allocationByCategory || src.AllocationByCategory;
  if (!Array.isArray(a)) return null;
  return a.map(x => ({
    category: String(x.category ?? x.Category ?? ""),
    minutes: Number(x.minutes ?? x.Minutes) || 0,
    solved: Number(x.solved ?? x.Solved) || 0,
  })).filter(x => x.category);
}
function __extractDepth(src) {
  if (!src) return null;
  const container = (src.depth && typeof src.depth === "object") ? src.depth : src;
  const items = container.depthByCategory || container.DepthByCategory;
  if (Array.isArray(items)) {
    return items.map(x => ({ category: String(x.category ?? x.Category ?? ""), depth: Number(x.depth ?? x.Depth ?? 0) })).filter(x => x.category);
  }
  return null;
}
__cvState.__allocationByTrack.combined = __extractAlloc(__codingSrc) || alloc;
__cvState.__allocationByTrack.micro    = __extractAlloc(__isV2 ? (payload.micro || payload.Micro) : null);
__cvState.__allocationByTrack.interview = __extractAlloc(__isV2 ? (payload.interview || payload.Interview) : null);

    // MCQ payload: accept multiple shapes/casing.
const mcq =
  (__mcqSrc && __mcqSrc.mcq && typeof __mcqSrc.mcq === "object") ? __mcqSrc.mcq :
  (__mcqSrc && __mcqSrc.Mcq && typeof __mcqSrc.Mcq === "object") ? __mcqSrc.Mcq :
  (__mcqSrc && typeof __mcqSrc === "object" && (
    __mcqSrc.byDifficulty || __mcqSrc.ByDifficulty ||
    __mcqSrc.overall || __mcqSrc.Overall ||
    __mcqSrc.basic || __mcqSrc.Basic ||
    __mcqSrc.intermediate || __mcqSrc.Intermediate ||
    __mcqSrc.advanced || __mcqSrc.Advanced
  )) ? __mcqSrc :
  null;

if (mcq){
  const byDiff =
    (mcq.byDifficulty && typeof mcq.byDifficulty === "object") ? mcq.byDifficulty :
    (mcq.ByDifficulty && typeof mcq.ByDifficulty === "object") ? mcq.ByDifficulty :
    null;

  const basicMap =
    byDiff ? (byDiff.basic || byDiff.Basic || {}) :
    (mcq.basic || mcq.Basic || {});

  const interMap =
    byDiff ? (byDiff.intermediate || byDiff.Intermediate || {}) :
    (mcq.intermediate || mcq.Intermediate || {});

  const advMap =
    byDiff ? (byDiff.advanced || byDiff.Advanced || {}) :
    (mcq.advanced || mcq.Advanced || {});

  const cats = (Array.isArray(CATEGORIES) && CATEGORIES.length)
    ? CATEGORIES.slice()
    : Array.from(new Set([].concat(Object.keys(basicMap||{}), Object.keys(interMap||{}), Object.keys(advMap||{}))));

  const byEv =
    (mcq.byDifficultyEvidence && typeof mcq.byDifficultyEvidence === "object") ? mcq.byDifficultyEvidence :
    (mcq.ByDifficultyEvidence && typeof mcq.ByDifficultyEvidence === "object") ? mcq.ByDifficultyEvidence :
    null;

  const evBasicMap = byEv ? (byEv.basic || byEv.Basic || {}) : (mcq.basicEvidence || mcq.BasicEvidence || {});
  const evInterMap = byEv ? (byEv.intermediate || byEv.Intermediate || {}) : (mcq.intermediateEvidence || mcq.IntermediateEvidence || {});
  const evAdvMap = byEv ? (byEv.advanced || byEv.Advanced || {}) : (mcq.advancedEvidence || mcq.AdvancedEvidence || {});

  const getEv = (map, category) => {
    const e = map && map[category];
    if (!e || typeof e !== "object") return { attempts: 0, questions: 0 };
    const a = Number(e.attempts ?? e.Attempts) || 0;
    const q = Number(e.questions ?? e.Questions) || 0;
    return { attempts: a, questions: q };
  };

  const mk = (score, ev) => ({
    avgScore: Number(score) || 0,
    attemptCount: Number(ev && ev.attempts) || 0,
    questionCount: Number(ev && ev.questions) || 0,
    last7Delta: 0
  });

  mcqMatrix = cats.map((category) => ({
    category,
    Easy: mk(basicMap[category], getEv(evBasicMap, category)),
    Medium: mk(interMap[category], getEv(evInterMap, category)),
    Hard: mk(advMap[category], getEv(evAdvMap, category)),
  }));

  const overall =
    (mcq.overallCorrect && typeof mcq.overallCorrect === "object") ? mcq.overallCorrect :
    (mcq.OverallCorrect && typeof mcq.OverallCorrect === "object") ? mcq.OverallCorrect :
    (mcq.overall && typeof mcq.overall === "object") ? mcq.overall :
    (mcq.Overall && typeof mcq.Overall === "object") ? mcq.Overall :
    null;

  if (overall){
    mcqOverallTotals = {
      correct: Number(overall.correct ?? overall.Correct) || 0,
      total: Number(overall.total ?? overall.Total) || 0
    };
  }
}

    // Time on platform: accept multiple shapes/casing and parse ISO dates safely.
const top =
  (__overallSrc.timeOnPlatform && typeof __overallSrc.timeOnPlatform === "object") ? __overallSrc.timeOnPlatform :
  (__overallSrc.TimeOnPlatform && typeof __overallSrc.TimeOnPlatform === "object") ? __overallSrc.TimeOnPlatform :
  null;

const daily =
  (top && Array.isArray(top.daily)) ? top.daily :
  (top && Array.isArray(top.Daily)) ? top.Daily :
  (__overallSrc.dailyPlatform && Array.isArray(__overallSrc.dailyPlatform)) ? __overallSrc.dailyPlatform :
  (__overallSrc.DailyPlatform && Array.isArray(__overallSrc.DailyPlatform)) ? __overallSrc.DailyPlatform :
  null;

if (daily){
  const mapped = daily.map((p) => ({
    date: parseIsoDate(p.date ?? p.Date),
    minutes: Number(p.minutes ?? p.Minutes) || 0
  })).filter(x => x.date instanceof Date && !isNaN(x.date.getTime()));

  // Densify last ~370 days so UI toggles and KPIs remain stable even if backend sends sparse days.
  const map = new Map();
  mapped.forEach(x => {
    const key = `${x.date.getFullYear()}-${String(x.date.getMonth()+1).padStart(2,'0')}-${String(x.date.getDate()).padStart(2,'0')}`;
    map.set(key, (map.get(key) || 0) + x.minutes);
  });

  const now = new Date(); now.setHours(0,0,0,0);
  const start = new Date(now); start.setDate(now.getDate() - 369);

  const out = [];
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)){
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    out.push({ date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), minutes: map.get(key) || 0 });
  }
  DAILY_PLATFORM_SERIES = out;
}

    
if (__overallSrc.metrics && typeof __overallSrc.metrics === "object"){
  // Accept both camelCase and snake_case metric keys
  const m = __overallSrc.metrics;

  const num = (v) => (v === null || v === undefined) ? null : Number(v);
  const pick = (...keys) => {
    for (const k of keys){
      if (m[k] !== undefined) return num(m[k]);
    }
    return null;
  };

  const cod = pick("codiviumScore","codivium_score");
  const bAll = pick("breadthOverall","overall_breadth","overallBreadth");
  const bInt = pick("breadthInterview","interview_breadth","interviewBreadth");
  const bMic = pick("breadthMicro","micro_challenge_breadth","microBreadth","micro_challengeBreadth");
  const bMcq = pick("breadthMcq","mcq_breadth","mcqBreadth");
  const ft = pick("firstTryPassRate","first_try_pass","firstTryPass");
  const avgA = pick("avgAttemptsToAC","avg_attempts","avgAttempts");
  const medT = pick("medianTimeToACMinutes","median_time","medianTime");
  const wMcq = pick("weightedMcqScore","weighted_mcq_score","weightedMcq");

  const ptsAll = pick("codiviumPointsAll","codivium_points_all","pointsAll","points_all");
  const pts30  = pick("codiviumPoints30","codivium_points_30","points30","points_30");
  const effHr  = pick("efficiencyPtsPerHr","efficiency_pts_per_hr","efficiencyPtsHr","ptsPerHr","efficiency");
  const dAll   = pick("depthOverall","depth_overall","depthOverallScore","overallDepth");
  const dMic   = pick("depthMicro","depth_micro","microDepth");
  const dInt   = pick("depthInterview","depth_interview","interviewDepth");

  __cvState.__metricsOverride = {
    codiviumScore: cod,
    breadthOverall: bAll,
    breadthInterview: bInt,
    breadthMicro: bMic,
    breadthMcq: bMcq,
    weightedMcqScore: wMcq,
    // Points, efficiency and depth variants — needed by renderScoresExpanded
    codiviumPointsAll: ptsAll,
    codiviumPoints30: pts30,
    efficiencyPtsPerHr: effHr,
    depthOverall: dAll,
    depthMicro: dMic,
    depthInterview: dInt,
  };

  // Update the submission snapshot metrics if provided
  if (ft != null) submissionMetrics.firstTryPassRate = ft;
  if (avgA != null) submissionMetrics.avgAttemptsToAC = avgA;
  if (medT != null) submissionMetrics.medianTimeToACMinutes = medT;

  // Also reflect directly into pills for interpretation fallback (safe)
  if (cod != null) setText("codiviumScore", Math.round(cod));
  if (bAll != null) setText("breadthScore", Math.round(bAll));
  if (bInt != null) setText("interviewBreadthScore", Math.round(bInt));
  if (bMic != null) setText("microBreadthScore", Math.round(bMic));
  if (bMcq != null) setText("mcqBreadthScore", Math.round(bMcq));
  if (wMcq != null) setText("weightedMcqScore", Math.round(wMcq));
  if (ptsAll != null) setText("codiviumPointsAll", Math.round(ptsAll));
  if (pts30 != null) setText("codiviumPoints30", Math.round(pts30));
  if (effHr != null) setText("efficiencyPtsPerHr", (Math.round(effHr*10)/10).toFixed(1));
  if (dAll != null) setText("depthOverallScore", Math.round(dAll));
  if (dMic != null) setText("microDepthScore", Math.round(dMic));
  if (dInt != null) setText("interviewDepthScore", Math.round(dInt));
}

// Convergence heatmap
function __extractHeatmapFromAny(obj){
  if (!obj || typeof obj !== "object") return null;
  // Accept either {convergenceHeatmap:{...}} or the heatmap object directly
  const hm = (obj.convergenceHeatmap && typeof obj.convergenceHeatmap === "object") ? obj.convergenceHeatmap :
             (obj.ConvergenceHeatmap && typeof obj.ConvergenceHeatmap === "object") ? obj.ConvergenceHeatmap :
             obj;

  const categories = hm.categories || hm.Categories || null;
  const buckets = hm.buckets || hm.Buckets || null;
  const values = hm.values || hm.Values || null;
  const counts = hm.counts || hm.Counts || null;

  // Focus/ranking metadata (v2)
  const focus = (hm.focus && typeof hm.focus === "object") ? hm.focus : (hm.Focus && typeof hm.Focus === "object") ? hm.Focus : null;
  const focusModes =
    (focus && Array.isArray(focus.modes)) ? focus.modes :
    (focus && Array.isArray(focus.Modes)) ? focus.Modes :
    (Array.isArray(hm.focusModes)) ? hm.focusModes :
    (Array.isArray(hm.FocusModes)) ? hm.FocusModes :
    null;

  const defaultModeId =
    (focus && (focus.defaultModeId || focus.DefaultModeId || focus.default_mode || focus.defaultMode)) ? String(focus.defaultModeId || focus.DefaultModeId || focus.default_mode || focus.defaultMode) :
    (hm.defaultModeId || hm.DefaultModeId || hm.default_mode || hm.defaultMode) ? String(hm.defaultModeId || hm.DefaultModeId || hm.default_mode || hm.defaultMode) :
    null;

  const rankings =
    (focus && focus.rankings && typeof focus.rankings === "object") ? focus.rankings :
    (focus && focus.Rankings && typeof focus.Rankings === "object") ? focus.Rankings :
    (hm.focusRankings && typeof hm.focusRankings === "object") ? hm.focusRankings :
    (hm.FocusRankings && typeof hm.FocusRankings === "object") ? hm.FocusRankings :
    null;

  const topNDefault =
    (focus && (focus.topNDefault || focus.top_n_default)) ? Number(focus.topNDefault || focus.top_n_default) :
    (hm.topNDefault || hm.top_n_default) ? Number(hm.topNDefault || hm.top_n_default) :
    null;

  const topNOptions =
    (focus && Array.isArray(focus.topNOptions)) ? focus.topNOptions :
    (focus && Array.isArray(focus.top_n_options)) ? focus.top_n_options :
    (Array.isArray(hm.topNOptions)) ? hm.topNOptions :
    (Array.isArray(hm.top_n_options)) ? hm.top_n_options :
    null;

  if (!Array.isArray(categories) || !Array.isArray(values)) return null;

  return {
    categories: categories.map(String),
    buckets: Array.isArray(buckets) ? buckets.map(String) : null,
    values: values,
    counts: Array.isArray(counts) ? counts : null,
    focusModes: focusModes,
    defaultModeId: defaultModeId,
    focusRankings: rankings,
    topNDefault: (isFinite(topNDefault) && topNDefault > 0) ? topNDefault : null,
    topNOptions: Array.isArray(topNOptions) ? topNOptions.map((x)=>Number(x)).filter((n)=>isFinite(n) && n>0) : null,
  };
}

// Combined (coding) heatmap drives the main heatmap view
const __combinedHm = __extractHeatmapFromAny(__codingSrc);
if (__combinedHm){
  __cvState.__convergenceOverride = {
    categories: __combinedHm.categories,
    buckets: __combinedHm.buckets,
    values: __combinedHm.values,
    counts: __combinedHm.counts
  };

  if (__isV2){
    const microHm = __extractHeatmapFromAny(__microSrc || {});
    const interviewHm = __extractHeatmapFromAny(__interviewSrc || {});
    __cvState.__heatmapData = {
      combined: __combinedHm,
      micro: microHm || null,
      interview: interviewHm || null
    };

    // Focus configuration (backend-driven ranking)
    const modes = Array.isArray(__combinedHm.focusModes) ? __combinedHm.focusModes : null;
    const defaultId = __combinedHm.defaultModeId || (modes && modes[0] && (modes[0].id || modes[0].Id)) || null;
    const rankings = __combinedHm.focusRankings || null;

    __cvState.__heatmapFocus = {
      modes: modes ? modes.map((m)=>({
        id: String(m.id || m.Id || ''),
        label: String(m.label || m.Label || m.id || m.Id || ''),
        description: String(m.description || m.Description || ''),
        isDefault: !!(m.isDefault || m.IsDefault)
      })).filter(x=>x.id) : [],
      defaultModeId: String(defaultId || ''),
      rankings: (rankings && typeof rankings === 'object') ? rankings : {},
      topNDefault: __combinedHm.topNDefault || 12,
      topNOptions: __combinedHm.topNOptions || [8,10,12,14,16]
    };

    if (!__cvState.__heatmapFocusModeId){
      const pick = (__cvState.__heatmapFocus.modes || []).find(x=>x.isDefault) || (__cvState.__heatmapFocus.modes || [])[0] || null;
      __cvState.__heatmapFocusModeId = pick ? pick.id : (__cvState.__heatmapFocus.defaultModeId || 'impact');
    }
    if (!(__cvState.__heatmapTopN && isFinite(__cvState.__heatmapTopN))){
      __cvState.__heatmapTopN = __cvState.__heatmapFocus.topNDefault || 12;
    }
  }
}

// Depth by category (dashboard depth chart)
// Accept either:
// - source.depthByCategory: [{category, depth}, ...] OR { [category]: depth }
// - source.depth: { depthByCategory: ..., depthAvg: ... }
const depthSource = (__codingSrc && typeof __codingSrc === "object") ? __codingSrc : payload;
const depthContainer = depthSource.depth && typeof depthSource.depth === "object" ? depthSource.depth : depthSource;

const depthItems = depthContainer.depthByCategory || depthContainer.DepthByCategory || null;
const depthAvg = depthContainer.depthAvg ?? depthContainer.DepthAvg ?? null;

if (Array.isArray(depthItems)){
  __cvState.__depthOverride = depthItems
    .map((x) => ({
      category: String(x.category ?? x.Category ?? ""),
      depth: Number(x.depth ?? x.Depth ?? 0)
    }))
    .filter(x => x.category.length > 0);
} else if (depthItems && typeof depthItems === "object"){
  __cvState.__depthOverride = Object.keys(depthItems).map((k) => ({ category: String(k), depth: Number(depthItems[k]) || 0 }));
}

if (depthAvg != null) __cvState.__depthAvgOverride = Number(depthAvg) || 0;
else if (Array.isArray(__cvState.__depthOverride) && __cvState.__depthOverride.length){
  __cvState.__depthAvgOverride = __cvState.__depthOverride.reduce((a,b)=>a+(b.depth||0),0) / __cvState.__depthOverride.length;
}

// Cache per-track depth (used by the coding track selector).
__cvState.__depthByTrack.combined  = __extractDepth(__codingSrc) || __cvState.__depthOverride;
__cvState.__depthByTrack.micro     = __extractDepth(__isV2 ? (payload.micro || payload.Micro) : null);
__cvState.__depthByTrack.interview = __extractDepth(__isV2 ? (payload.interview || payload.Interview) : null);

// Recommended actions (Option C)
const ra = (__overallSrc && Array.isArray(__overallSrc.recommendedActions)) ? __overallSrc.recommendedActions :
           (__overallSrc && Array.isArray(__overallSrc.RecommendedActions)) ? __overallSrc.RecommendedActions :
           (payload && Array.isArray(payload.recommendedActions)) ? payload.recommendedActions :
           (payload && Array.isArray(payload.RecommendedActions)) ? payload.RecommendedActions :
           [];
__cvState.__recommendedActions = Array.isArray(ra) ? ra.slice() : [];
    // Apply UI mode + panel visibility + dynamic layout on every payload update (safe no-op if mount missing)
    if (typeof __cvApplyUiModeAndLayout === 'function') __cvApplyUiModeAndLayout();
    else __cvApplyPanelVisibility();


  // End of applyDashboardData
  }

function setInfoPane(key) {
    const data = getInfoContent(key);
    if (!data) return;
    setText("infoPaneTitle", data.title || "Metric details");
    setText("infoPaneSub", data.sub || "");
    const bodyEl = cv$("infoPaneBody");
    if (bodyEl) {
      const body = (data.body || "").replace(/\\n/g, "\n");
      bodyEl.textContent = body;
}
const aggWrap = cv$("infoAgg");
const aggBtn = cv$("infoAggBtn");
const aggBody = cv$("infoAggBody");
const aggText = (data.agg || data.aggregation || "").replace(/\n/g, "\n");

if (aggWrap && aggBtn && aggBody) {
  if (aggText && aggText.trim().length > 0) {
    aggWrap.style.display = "";
    aggBtn.style.display = "";
    aggBtn.setAttribute("aria-expanded", "false");
    aggBody.classList.add("isHidden");
    aggBody.textContent = aggText;
} else {
    aggWrap.style.display = "none";
    aggBtn.setAttribute("aria-expanded", "false");
    aggBody.classList.add("isHidden");
    aggBody.textContent = "";
  }
}
    const interpEl = cv$("infoPaneInterp");
    if (interpEl) interpEl.textContent = getAnalysisText(key) || "";
}

  function refreshInfoIfActive(key){
    if (!key) return;
    if (__cvState.__activeInfoKey !== key) return;
    try {
      if (SCORE_INFO_KEYS.has(key)) setScoresInfoPane(key);
      else setInfoPane(key);
    } catch (e) { ciErr('ignored error', e); }
  }

  function refreshActiveInfoPane(){
    if (!__cvState.__activeInfoKey) return;
    refreshInfoIfActive(__cvState.__activeInfoKey);
  }

  

// =============================================================
// PANEL RESIZER — DRAG-TO-RESIZE
// =============================================================
