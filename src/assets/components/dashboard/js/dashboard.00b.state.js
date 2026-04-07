// dashboard.00b.state.js — __cvState declaration, UI prefs read/write, normalise helpers
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

const __cvState = {
    // payload / data
    __dashData:             {},
    __hasLivePayload:       false,
    __anchorDateValue:      null,
    __metricsOverride:      null,
    __convergenceOverride:  null,
    // heatmap
    __heatmapData:          null,  // { combined, micro, interview }
    __heatmapFocus:         null,  // { modes, defaultModeId, rankings }
    __heatmapView:          "focus", // focus | all | micro | interview
    __heatmapFocusModeId:   null,
    __heatmapTopN:          12,
    // coding track selector
    __selectedCodingTrack:  "combined", // "combined" | "micro" | "interview"
    __depthByTrack:         { combined: null, micro: null, interview: null },
    __allocationByTrack:    { combined: null, micro: null, interview: null },
    // actionability
    __recommendedActions:   [],
    __sessionStartEndpoint: "/api/sessions/start",
    // info pane
    __activeInfoKey:        "welcome",
    // ui prefs  (initialised after __UI_DEFAULT is defined)
    __uiLoaded:             false,
    __uiMode:               null,   // set below after __UI_DEFAULT
    __uiPanels:             null,   // set below after __UI_DEFAULT
    __uiEffectiveMode:      null,   // set below after __UI_DEFAULT
    __uiForcedSmallScreen:  false,
    __allowedModes:         null,   // null = unrestricted; string[] = e.g. ['info_only'] or ['full','info_only']
    // render coordination
    __cvUiApplyRaf:         0,
    // refresh / visibility (managed by dashboard.06b.refresh)
    __hardRefreshTimer:     null,
    __hardRefreshToken:     0,
    __softRefreshTimer:     null,
    __lastRefreshAt:        0,
    __wasEverHidden:        false,
    __resilienceIgnoreUntil: 0,   // set to Date.now() + initialIgnoreMs after config loads
    // analysis / overrides
    __depthOverride:        null,
    __depthAvgOverride:     null,
    __analysisOverrides:    {},
    __infoContentOverrides: {},
    __insights:             {},
    __analysisProvider:     null,
  };
  // Deferred initialisers that depend on __UI_DEFAULT (defined just above)
  __cvState.__uiMode         = __UI_DEFAULT.mode;
  __cvState.__uiPanels       = Object.assign({}, __UI_DEFAULT.panels);
  __cvState.__uiEffectiveMode = __UI_DEFAULT.mode;


  function __cvNormalizeUiMode(mode){
    const m = String(mode || "").trim().toLowerCase();
    if (m === "info_only" || m === "info-only" || m === "summary" || m === "summary_only" || m === "summary-only") return "info_only";
    return "full";
  }

  function __cvNormalizeSelectedTrack(track){
    const t = String(track || '').trim().toLowerCase();
    if (t === 'micro' || t === 'interview') return t;
    return 'combined';
  }

  function __cvNormalizePanels(panels){
    const out = Object.assign({}, __UI_DEFAULT.panels);
    if (!panels || typeof panels !== "object") return out;
    for (const k of Object.keys(out)){
      const v = panels[k];
      if (typeof v === "boolean") out[k] = v;
      else if (typeof v === "number") out[k] = !!v;
      else if (typeof v === "string"){
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "yes" || s === "on") out[k] = true;
        else if (s === "0" || s === "false" || s === "no" || s === "off") out[k] = false;
      }
    }
    return out;
  }

  function __cvReadUiFromLocalStorage(){
    try {
      if (!window.localStorage) return null;
      const raw = window.localStorage.getItem(__UI_STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      const mode = __cvNormalizeUiMode(obj.mode);
      const panels = __cvNormalizePanels(obj.panels);
      const selectedTrack = __cvNormalizeSelectedTrack(obj.selectedTrack);
      return { mode, panels, selectedTrack };
    } catch (e) { return null; }
  }

  function __cvWriteUiToLocalStorage(ui){
    try {
      if (!window.localStorage) return;
      if (!ui || typeof ui !== "object") return;
      const out = {
        mode: __cvNormalizeUiMode(ui.mode),
        panels: __cvNormalizePanels(ui.panels),
        // Preserve selectedTrack: use supplied value, else fall back to current state
        selectedTrack: __cvNormalizeSelectedTrack(
          ui.selectedTrack !== undefined ? ui.selectedTrack : __cvState.__selectedCodingTrack
        )
      };
      window.localStorage.setItem(__UI_STORAGE_KEY, JSON.stringify(out));
    } catch (e) {
      // ignore
    }
  }

  function __cvReadUiFromPayload(payload, overallSrc){
    try {
      const rootMeta = (payload && (payload.meta || payload.Meta) && typeof (payload.meta || payload.Meta) === "object") ? (payload.meta || payload.Meta) : null;
      const overallMeta = (overallSrc && (overallSrc.meta || overallSrc.Meta) && typeof (overallSrc.meta || overallSrc.Meta) === "object") ? (overallSrc.meta || overallSrc.Meta) : null;

      const uiObj = (rootMeta && (rootMeta.ui || rootMeta.Ui) && typeof (rootMeta.ui || rootMeta.Ui) === "object") ? (rootMeta.ui || rootMeta.Ui) :
                    (overallMeta && (overallMeta.ui || overallMeta.Ui) && typeof (overallMeta.ui || overallMeta.Ui) === "object") ? (overallMeta.ui || overallMeta.Ui) :
                    null;

      if (!uiObj) return null;

      const mode = __cvNormalizeUiMode(uiObj.mode);
      const panels = __cvNormalizePanels(uiObj.panels);
      // selectedTrack is optional inside meta.ui; fall through to 'combined' if absent
      const selectedTrack = (uiObj.selectedTrack || uiObj.SelectedTrack)
        ? __cvNormalizeSelectedTrack(uiObj.selectedTrack || uiObj.SelectedTrack)
        : null;
      return { mode, panels, selectedTrack };
    } catch (e) { return null; }
  }

  function __cvEnsureUiPrefsLoaded(){
    if (__cvState.__uiLoaded) return;
    __cvState.__uiLoaded = true;
    const ls = __cvReadUiFromLocalStorage();
    if (ls) {
      __cvState.__uiMode = ls.mode;
      __cvState.__uiPanels = Object.assign({}, ls.panels);
      // Restore selected track if stored (falls back to 'combined' via normalise)
      if (ls.selectedTrack) __cvState.__selectedCodingTrack = ls.selectedTrack;
    }
  }
