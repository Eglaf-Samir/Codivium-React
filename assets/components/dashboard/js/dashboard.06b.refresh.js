// dashboard.06b.refresh.js
// STATUS: LIVE — source file (do not deploy directly; deploy dashboard.bundle.js)
// OWNER: CodiviumInsights public API — init, update, refresh, destroy, setUiPrefs,
//        getUiPrefs, toggleInfoPane, setSelectedTrack, getSelectedTrack,
//        setAnalysisOverrides, setInfoContentOverrides
// NOT owned here: layout engine (core.js), chart rendering (06.mcq-and-render.js)
// GENERATED: No — this is an authored source file

// ============================================================
// dashboard.06b.refresh.js
// OWNER: Refresh / resilience / visibility system
// Depends on: dashboard.00.core.js (__cvState, __cvConfig, safeInvoke, ciErr)
//             dashboard.06.mcq-and-render.js (renderAll, __cvRefreshChartsInPlace)
// ============================================================
// __cvState.__hardRefreshTimer, __cvState.__hardRefreshToken now live in __cvState (dashboard.00.core.js)

function __cvIsElementVisible(el){
  if (!el) return false;
  let rect;
  try { rect = el.getBoundingClientRect(); } catch (e) { return false; }
  if (!rect || rect.width < 8 || rect.height < 8) return false;
  let cs;
  try { cs = window.getComputedStyle(el); } catch (e) { cs = null; }
  if (cs){
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const op = Number(cs.opacity || '1');
    if (!isNaN(op) && op < 0.02) return false;
  }
  return true;
}


// Checks that all visible chart canvases have real pixel dimensions right now.
// Used by __cvHardRefreshWhenVisible and __cvRenderWhenSized to decide whether
// a layout transition has fully completed and all charts could be created.
function allCanvasesRendered() {
  var mount = (typeof getMount === 'function') ? getMount() : null;
  if (!mount) return false;
  var ids = (typeof __CV_CHART_CANVAS_IDS !== 'undefined') ? __CV_CHART_CANVAS_IDS :
    ['depthChart','timePlatformChart','exerciseAllocChart','mcqEasyChart','mcqMediumChart','mcqHardChart'];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var el = mount.querySelector('#' + id) ||
             (typeof cv$ === 'function' ? cv$(id) : document.getElementById(id));
    if (!el) continue;
    // Skip canvases inside hidden panels (display:none — they are intentionally not rendered).
    var panel = el.closest && el.closest('.panel');
    if (panel && panel.classList && panel.classList.contains('isHidden')) continue;
    try {
      var r = el.getBoundingClientRect();
      if (!r || r.width < 8 || r.height < 8) return false;
    } catch (_) { return false; }
  }
  return true;
}

function __cvHardRefreshWhenVisible(token){
  const mount = getMount();
  let tries = 0;
  const maxTries = 14; // ~3.5s total; covers SPA tab transitions/animations

  const tick = () => {
    if (token !== __cvState.__hardRefreshToken) return;
    tries++;

    if (__cvIsElementVisible(mount)){
      try { renderAll(); } catch (e) { ciErr('ignored error', e); }
      try { __cvStampRefresh('hard'); } catch (e) { ciErr('ignored error', e); }

      // After renderAll(), check if any chart canvases are still 0px.
      // This happens when a layout switch reveals a previously-hidden panel
      // (e.g. switching TO a layout with MCQ from one without it):
      // display:none was just lifted, but the browser needs at least one more
      // frame before the canvas has real dimensions.
      // If any are still 0px, delegate to __cvRenderWhenSized which uses a
      // ResizeObserver to re-run renderAll() once dimensions are real.
      // If any visible chart canvas is still 0px after renderAll(), a panel was
      // just revealed from display:none (e.g. MCQ panel shown by layout switch).
      // Delegate to __cvRenderWhenSized which watches canvas containers via
      // ResizeObserver and re-runs renderAll() once they have real dimensions.
      try {
        if (typeof __cvRenderWhenSized === 'function' && !allCanvasesRendered()) {
          __cvRenderWhenSized('hard_refresh_followup');
          return;
        }
      } catch (_) {}

      // All canvases already rendered — do the settle-check passes as before.
      let lastRect = null;
      try { lastRect = mount.getBoundingClientRect(); } catch (e) { lastRect = null; }
      const maybeRefresh = () => {
        if (token !== __cvState.__hardRefreshToken) return;
        let r = null;
        try { r = mount.getBoundingClientRect(); } catch (e) { r = null; }
        if (!r || !lastRect) {
          try { __cvRefreshChartsInPlace(); } catch (e) { ciErr('ignored error', e); }
          return;
        }
        const dw = Math.abs((r.width||0) - (lastRect.width||0));
        const dh = Math.abs((r.height||0) - (lastRect.height||0));
        if (dw > 1 || dh > 1) {
          lastRect = r;
          try { __cvRefreshChartsInPlace(); } catch (e) { ciErr('ignored error', e); }
        }
      };
      setTimeout(maybeRefresh, 350);
      setTimeout(maybeRefresh, 1250);
      return;
    }

    if (tries < maxTries) setTimeout(tick, 250);
  };

  tick();
}


// ── Boot render: wait for all panel containers to have real dimensions ──────────────────────
//
// Root cause of blank/partial charts:
//  - renderAll() checks __cvCanRenderCanvas(canvas) — if the canvas container (canvasWrap)
//    is 0px (CSS grid fr-unit not yet resolved), that chart is skipped and never created.
//    __cvRefreshChartsInPlace only resizes EXISTING chart objects, so skipped charts stay blank.
//  - The heatmap uses a virtualised renderer that reads host.clientHeight at render time.
//    If that height is 0 or partial, only a few rows are painted.
//  - Multiple observers firing renderAll() independently causes concurrent renders / flicker.
//
// Fix: one unified coordinator.
//  1. Observe ALL canvasWraps + the heatmapWrap host with a single ResizeObserver.
//  2. Coalesce all resize events through a single rAF-debounced renderAll() call.
//  3. Keep re-rendering as long as new size changes arrive (grid settling in stages).
//  4. Once stable (no new events for one render cycle), disconnect and hand off
//     to the resilience system.
//  5. For the heatmap specifically: after the first successful renderAll(), install a
//     dedicated height-change observer that calls __renderSlice only (not full renderAll).

// Canvases that Chart.js renders into — observing their .canvasWrap parents.
var __CV_CHART_CANVAS_IDS = [
  'depthChart',
  'timePlatformChart',
  'exerciseAllocChart',
  'mcqEasyChart',
  'mcqMediumChart',
  'mcqHardChart'
];

function __cvRenderWhenSized(reason) {
  // One rAF to commit __cvApplyUiModeAndLayout's inline grid-template-* writes.
  requestAnimationFrame(function () {

    var mount = getMount();
    if (!mount) return;

    // Collect the containers we need to watch:
    //   - .canvasWrap parents of each chart canvas
    //   - .heatmapWrap (virtualised heatmap — depends on clientHeight)
    var targets = [];

    __CV_CHART_CANVAS_IDS.forEach(function (id) {
      var el = mount.querySelector('#' + id) ||
               (typeof cv$ === 'function' ? cv$(id) : document.getElementById(id));
      if (!el) return;
      var wrap = (el.closest && el.closest('.canvasWrap')) || el.parentElement || el;
      if (targets.indexOf(wrap) === -1) targets.push(wrap);
    });

    var heatHost = mount.querySelector('#convergenceHeatmap');
    if (heatHost && targets.indexOf(heatHost) === -1) targets.push(heatHost);

    if (!targets.length || typeof ResizeObserver === 'undefined') {
      // No targets found or old browser — render immediately and exit.
      try { renderAll(); } catch (e) { ciErr('render_when_sized_immediate', e); }
      try { __cvStampRefresh('hard'); } catch (_) {}
      return;
    }

    // Coalescing state: all resize callbacks schedule through a single pending rAF.
    var pendingRaf   = 0;
    var disconnected = false;
    var ro;

    // Track which targets have reported real dimensions at least once.
    // Only disconnect once ALL targets have been seen with real dimensions
    // AND at least one renderAll() has fired after the last one became real.
    var seenReal = new Set();



    function scheduleRender() {
      if (disconnected) return;
      if (pendingRaf) return;             // Already scheduled — coalesce.
      pendingRaf = requestAnimationFrame(function () {
        pendingRaf = 0;
        if (disconnected) return;
        try { renderAll(); } catch (e) { ciErr('render_when_sized_pass', e); }
        try { __cvStampRefresh('hard'); } catch (_) {}

        // Disconnect only when ALL chart canvases have real dimensions RIGHT NOW,
        // post-renderAll(). This is the only reliable signal that the grid has
        // fully resolved and every chart had a real container when it was created.
        if (allCanvasesRendered()) {
          disconnect();
        }
        // Otherwise, stay connected — the ResizeObserver will fire again when the
        // remaining canvases (e.g. MCQ in bottom grid row) get real dimensions.
      });
    }

    function disconnect() {
      if (disconnected) return;
      disconnected = true;
      if (pendingRaf) { cancelAnimationFrame(pendingRaf); pendingRaf = 0; }
      try { if (ro) ro.disconnect(); } catch (_) {}
      __cvWatchHeatmapHeight(mount);
    }

    try {
      ro = new ResizeObserver(function (entries) {
        if (disconnected) return;
        var anyReal = false;
        for (var i = 0; i < entries.length; i++) {
          var r = entries[i].contentRect;
          if (r && r.width > 8 && r.height > 8) { anyReal = true; break; }
        }
        if (!anyReal) return;
        scheduleRender();
      });

      targets.forEach(function (el) { ro.observe(el); });
    } catch (e) {
      ciErr('render_when_sized_ro_bind', e);
      try { renderAll(); } catch (e2) { ciErr('render_when_sized_fallback', e2); }
      return;
    }

    // Initial render pass — handles the case where all panels are already sized.
    scheduleRender();

    // Safety net: if not all targets become real within 8s, render whatever we have.
    setTimeout(function () {
      if (disconnected) return;
      disconnect();
      try { renderAll(); } catch (e) { ciErr('render_when_sized_timeout', e); }
    }, 8000);
  });
}

// Install a ResizeObserver specifically on the heatmap host that re-fires
// the virtualised slice calculation when the container height changes.
// This is lightweight — it does NOT call renderAll(), only recalculates visible rows.
function __cvWatchHeatmapHeight(mount) {
  if (typeof ResizeObserver === 'undefined') return;
  var host = mount && mount.querySelector('#convergenceHeatmap');
  if (!host) return;
  // Only install once.
  if (host.__cvHeightWatcher) return;
  host.__cvHeightWatcher = true;

  var lastH = host.clientHeight || 0;
  try {
    var hro = new ResizeObserver(function () {
      var h = host.clientHeight || 0;
      if (Math.abs(h - lastH) < 2) return;  // Ignore sub-pixel noise.
      lastH = h;
      // Re-fire the virtualised slice calculation with the new height.
      if (host.__cvVirt && typeof host.__cvVirt.renderNow === 'function') {
        requestAnimationFrame(function () {
          try { host.__cvVirt.renderNow(); } catch (e) { ciErr('heatmap_height_ro', e); }
        });
      }
    });
    hro.observe(host);
  } catch (e) { ciErr('heatmap_height_ro_bind', e); }
}

function __cvScheduleHardRefresh(reason){
  __cvState.__hardRefreshToken++;
  const token = __cvState.__hardRefreshToken;
  if (__cvState.__hardRefreshTimer) clearTimeout(__cvState.__hardRefreshTimer);

  const r = String(reason || "");
  const isManual = r.indexOf("manual") !== -1;

  const now = Date.now();
  const since = now - (__cvState.__lastRefreshAt || 0);
  const remaining = (__cvState.__lastRefreshAt && !isManual) ? Math.max(0, __cvMinRefreshIntervalMs - since) : 0;
  const delay = Math.max(80, remaining);

  __cvState.__hardRefreshTimer = setTimeout(() => {
    __cvState.__hardRefreshTimer = null;
    __cvHardRefreshWhenVisible(token);
  }, delay);
}


function setupRefreshDashboardButton(){
  const btns = qAll('.refreshDashboardBtn');
  if (!btns || !btns.length) return;
  btns.forEach((b) => {
    if (b.__cvBound) return;
    b.__cvBound = true;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        __cvRequestRefresh('hard', 'manual_button', { immediate: true });
      } catch (err) { ciErr('ignored error', err); }
    });
  });
}

function setupScoresTabs(){
  const btnSummary = document.getElementById('scoresTabBtnSummary');
  const btnBreakdown = document.getElementById('scoresTabBtnBreakdown');
  const panelSummary = document.getElementById('scoresTabSummary');
  const panelBreakdown = document.getElementById('scoresTabBreakdown');
  if (!btnSummary || !btnBreakdown || !panelSummary || !panelBreakdown) return;

  // Guard: bind once
  if (btnSummary.__cvBound || btnBreakdown.__cvBound) return;
  btnSummary.__cvBound = true;
  btnBreakdown.__cvBound = true;

  const KEY = '__cvScoresTab';

  function setActive(which){
    const isSummary = String(which || 'summary') === 'summary';

    btnSummary.classList.toggle('isActive', isSummary);
    btnBreakdown.classList.toggle('isActive', !isSummary);

    btnSummary.setAttribute('aria-selected', isSummary ? 'true' : 'false');
    btnBreakdown.setAttribute('aria-selected', !isSummary ? 'true' : 'false');

    panelSummary.hidden = !isSummary;
    panelBreakdown.hidden = isSummary;

    try { sessionStorage.setItem(KEY, isSummary ? 'summary' : 'breakdown'); } catch (e) { ciErr('ignored error', e); }
  }

  // Default: summary; restore last in-session state if available
  let initial = 'summary';
  try {
    const s = sessionStorage.getItem(KEY);
    if (s === 'breakdown' || s === 'summary') initial = s;
  } catch (e) { ciErr('ignored error', e); }
  setActive(initial);

  btnSummary.addEventListener('click', (e) => {
    e.preventDefault();
    setActive('summary');
  });
  btnBreakdown.addEventListener('click', (e) => {
    e.preventDefault();
    setActive('breakdown');
  });
}
// __cvState.__softRefreshTimer, __cvState.__lastRefreshAt now live in __cvState (dashboard.00.core.js)

function __cvStampRefresh(kind){
  try { __cvState.__lastRefreshAt = Date.now(); } catch (_) { __cvState.__lastRefreshAt = Date.now(); }
  // Future: record kind/reason for debug HUD
}

function __cvRequestRefresh(kind, reason, opts){
  kind = String(kind || 'soft');
  const r = String(reason || '');
  const o = (opts && typeof opts === 'object') ? opts : {};
  const immediate = !!o.immediate;

  if (kind === 'hard') {
    if (immediate) {
      try { renderAll(); __cvStampRefresh('hard'); } catch (e) { ciErr('ignored error', e); }
    }
    try { __cvScheduleHardRefresh(r || 'requested_hard'); } catch (e) { ciErr('ignored error', e); }
    return;
  }

  // default soft
  if (immediate) {
    try { __cvRefreshChartsInPlace(); } catch (e) { ciErr('ignored error', e); }
  } else {
    try { __cvScheduleSoftRefresh(r || 'requested_soft'); } catch (e) { ciErr('ignored error', e); }
  }
}

const __cvMinRefreshIntervalMs = ((__cvConfig.refresh || {}).minIntervalMs) || 30000; // 30s (reduces heatmap jumpiness / keeps reading stable)
// During initial page load, container sizes can shift as fonts/styles settle.
// A soft refresh triggered too early can cause brief Chart.js flicker.
// We ignore non-manual soft refresh triggers during this short settle window.
// During initial page load, container sizes can shift as fonts/styles settle.
// A refresh triggered too early can cause brief Chart.js flicker.
// We ignore resilience-triggered refreshes during this settle window.
const __cvBootSettleUntil = Date.now() + 2200;

// Some browsers fire focus/resize/observer callbacks immediately on load.
// Arming resilience too early causes an extra "mini refresh" before the first
// stable paint. Delay arming slightly to avoid any visible flicker.
// __cvState.__resilienceIgnoreUntil now lives in __cvState.__resilienceIgnoreUntil (dashboard.00.core.js)
// Initialise it here since __cvConfig is available at this point.
__cvState.__resilienceIgnoreUntil = Date.now() + (((__cvConfig.resilience || {}).initialIgnoreMs) || 2600);
try {
  if (typeof window !== 'undefined'){
    window.__cvSetResilienceIgnoreUntil = window.__cvSetResilienceIgnoreUntil || function(ms){
      try { __cvState.__resilienceIgnoreUntil = Date.now() + Math.max(0, (ms | 0)); } catch (_e) {}
    };
  }
} catch (_e) {}
// __cvState.__wasEverHidden now lives in __cvState.__wasEverHidden (dashboard.00.core.js)


  function __cvRefreshChartsInPlace(){
    // Chart.js instances: resize + redraw without rebuilding data.
    try {
      Object.keys(charts || {}).forEach((k) => {
        const c = charts[k];
        if (!c) return;
        if (typeof c.resize === "function") c.resize();
        if (typeof c.update === "function") c.update("none");
      });
    } catch (e) { ciErr('ignored error', e); }

    // Non-Chart.js visuals that depend on container size
    try { renderConvergenceHeatmap(); } catch (e) { ciErr('ignored error', e); }
    // Exercise allocation is a Chart.js instance (charts.exerciseDonut) and is already
    // handled by the Chart.js resize/update loop above. Rebuilding it here causes visible
    // multi-pass redraws on page refresh.
  
    __cvStampRefresh('soft');
  }

  function __cvScheduleSoftRefresh(reason){
    if (__cvState.__softRefreshTimer) return;

    const r = String(reason || "");
    const isManual = r.indexOf("manual") !== -1;

    // Avoid doing a Chart.js resize/update pass during the initial layout settle phase.
    // This is the main cause of "one quick flicker" on page refresh.
    if (!isManual && Date.now() < __cvBootSettleUntil) return;

    const now = Date.now();
    const since = now - (__cvState.__lastRefreshAt || 0);
    const remaining = (__cvState.__lastRefreshAt && !isManual) ? Math.max(0, __cvMinRefreshIntervalMs - since) : 0;
    const delay = Math.max(120, remaining);

    __cvState.__softRefreshTimer = setTimeout(() => {
      __cvState.__softRefreshTimer = null;
      __cvRefreshChartsInPlace();
    }, delay);
  }

  function __cvSetupResilience(){
    const mount = getMount();
    if (!mount) return;

    const st = __cvMountState(mount);
    if (st.resilienceBound) return;
    st.resilienceBound = true;

    const onVis = () => {
      if (document.visibilityState === "hidden") { __cvState.__wasEverHidden = true; return; }
      if (document.visibilityState === "visible" && __cvState.__wasEverHidden) __cvRequestRefresh('hard', 'visibility');
    };

    const onFocus = () => {
      if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
      __cvRequestRefresh('hard', 'focus');
    };

    const onPageShow = (e) => {
      if (e && e.persisted) __cvRequestRefresh('hard', 'pageshow_persisted');
    };

    const onResize = () => {
      if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
      __cvRequestRefresh('soft', 'resize');
    };

    const onTransitionEnd = (e) => {
      if (Date.now() < __cvState.__resilienceIgnoreUntil) return;

      try {
        if (!e || !e.target) return;
        const t = e.target;
        if (!mount.contains(t)) return;

        const prop = String(e.propertyName || "").toLowerCase();
        // Only react to layout-affecting properties (avoid hover-only transitions).
        const okProp = (
          prop === "width" ||
          prop === "height" ||
          prop === "max-width" ||
          prop === "max-height" ||
          prop === "flex-basis" ||
          prop === "transform"
        );
        if (!okProp) return;

        // Ignore common hover/interaction elements to avoid thrash.
        if (t.closest && t.closest(".side-link, .cvLayoutBtn, .cvFocusBtn, .infoBtn, button, a")) return;

        // Only refresh when a layout container finishes transitioning.
        if (t.closest) {
          const okHost = t.closest(".sidebar, .insights-layout, .canvasWrap, .treemapWrap, #infoPane, #insightsForm");
          if (!okHost) return;
        }

        __cvRequestRefresh('soft', 'transitionend');
      } catch (err) { ciErr('transitionend', err); }
    };

    st.resilienceHandlers = { onVis, onFocus, onPageShow, onResize, onTransitionEnd };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("resize", onResize);
    document.addEventListener("transitionend", onTransitionEnd, true);

    // Container resize (more precise than window resize)
    if (typeof ResizeObserver !== "undefined") {
      try {
        const ro = new ResizeObserver(() => {
          if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
          __cvRequestRefresh('soft', 'resize_observer');
        });
        st.resilienceRO = ro;
        Array.prototype.slice.call(mount.querySelectorAll(".canvasWrap, .treemapWrap")).forEach((el) => ro.observe(el));
      } catch (e) { ciErr('resize_observer_bind', e); }
    }

    // If the user scrolls away and back, some canvases can become stale in certain browsers.
    if (typeof IntersectionObserver !== "undefined") {
      try {
        const io = new IntersectionObserver((entries) => {
          if (Date.now() < __cvState.__resilienceIgnoreUntil) return;
          for (const ent of entries) {
            if (ent && ent.isIntersecting) { __cvRequestRefresh('hard', 'intersection'); break; }
          }
        }, { threshold: 0.12 });
        st.resilienceIO = io;
        Array.prototype.slice.call(mount.querySelectorAll(".canvasWrap, .heatmapWrap, .treemapWrap")).forEach((el) => io.observe(el));
      } catch (e) { ciErr('intersection_observer_bind', e); }
    }
  }

    // -----------------------------
  // Public API (production integration)
  // -----------------------------
  window.CodiviumInsights = window.CodiviumInsights || {};

  /**
   * Initialize the dashboard.
   * @param {{ mountId?: string, data?: DashboardData }} opts
   */
  window.CodiviumInsights.init = function(opts){
    opts = opts || {};
    if (opts.mountId) IDS.mount = String(opts.mountId);
    if (opts.data) applyDashboardData(opts.data);
    // If a page provides __CODIVIUM_DASHBOARD_DATA__ globally, consume it once.
    if (!opts.data && window.__CODIVIUM_DASHBOARD_DATA__) {
      try { applyDashboardData(window.__CODIVIUM_DASHBOARD_DATA__); } catch (e) { ciErr('ignored error', e); }
    }
    init();
  };

  /**
   * Update dashboard data (partial updates allowed).
   * @param {DashboardData} payload
   */
  window.CodiviumInsights.update = function(payload){
    __cvState.__hasLivePayload = true;
    applyDashboardData(payload);
    // applyDashboardData → __cvApplyUiModeAndLayout writes grid-template-* inline styles
    // synchronously. Use __cvRenderWhenSized to render once the container has real
    // pixel dimensions (replaces blind single-RAF assumption).
    __cvRenderWhenSized('update');
  };

  /**
   * Force a full re-render (useful after returning to a hidden tab).
   */
  window.CodiviumInsights.refresh = function(){
    try { __cvRequestRefresh('hard', 'api_refresh', { immediate: true }); } catch (e) { ciErr('ignored error', e); }
  };


  /**
   * Tear down listeners/observers (SPA safety). Call before removing the dashboard from the DOM.
   */
  window.CodiviumInsights.destroy = function(){
    const mount = getMount();
    if (!mount) return;
    const st = __cvMountState(mount);

    // UI layout (core)
    try {
      if (st.uiLayoutOnResize) window.removeEventListener('resize', st.uiLayoutOnResize);
      st.uiLayoutOnResize = null;
      st.uiLayoutBound = false;
    } catch (e) { ciErr('destroy_ui_layout', e); }

    // Button tooltips
    try {
      const h = st.btnTipsHandlers;
      if (h){
        mount.removeEventListener('pointerover', h.onOver, true);
        mount.removeEventListener('pointerout', h.onOut, true);
        mount.removeEventListener('pointermove', h.onMove);
        mount.removeEventListener('mouseleave', h.onLeave);
      }
      st.btnTipsHandlers = null;
      st.btnTipsBound = false;
    } catch (e) { ciErr('destroy_btn_tips', e); }

    // Time controls
    try {
      if (st.timeControlsOnClick) mount.removeEventListener('click', st.timeControlsOnClick);
      st.timeControlsOnClick = null;
      st.timeControlsBound = false;
    } catch (e) { ciErr('destroy_time_controls', e); }

    // Allocation controls
    try {
      if (st.allocControlsOnClick) mount.removeEventListener('click', st.allocControlsOnClick);
      st.allocControlsOnClick = null;
      st.allocControlsBound = false;
    } catch (e) { ciErr('destroy_alloc_controls', e); }

    // Resilience observers/listeners
    try {
      const rh = st.resilienceHandlers;
      if (rh){
        document.removeEventListener('visibilitychange', rh.onVis);
        window.removeEventListener('focus', rh.onFocus);
        window.removeEventListener('pageshow', rh.onPageShow);
        window.removeEventListener('resize', rh.onResize);
        document.removeEventListener('transitionend', rh.onTransitionEnd, true);
      }
      st.resilienceHandlers = null;
      st.resilienceBound = false;
      if (st.resilienceRO && typeof st.resilienceRO.disconnect === 'function') st.resilienceRO.disconnect();
      if (st.resilienceIO && typeof st.resilienceIO.disconnect === 'function') st.resilienceIO.disconnect();
      st.resilienceRO = null;
      st.resilienceIO = null;
    } catch (e) { ciErr('destroy_resilience', e); }

    // Timers
    try { if (__cvState.__softRefreshTimer) { clearTimeout(__cvState.__softRefreshTimer); __cvState.__softRefreshTimer = null; } } catch (_) {}
    try { if (__cvState.__hardRefreshTimer) { clearTimeout(__cvState.__hardRefreshTimer); __cvState.__hardRefreshTimer = null; } } catch (_) {}
  };



  window.CodiviumInsights.setAnalysisOverrides = function(map){
    if (map && typeof map === "object") __cvState.__analysisOverrides = map;
  };

  window.CodiviumInsights.setInfoContentOverrides = function(map){
    if (map && typeof map === "object") __cvState.__infoContentOverrides = map;
  };  function __cvNormalizeRedirectUrl(raw){
    try {
      if (!raw) return null;
      const u = String(raw).trim();
      if (!u) return null;
      if (u.startsWith('#')) return u;

      // Block obviously dangerous schemes
      if (/^(javascript|data|vbscript):/i.test(u)) return null;

      const loc = window.location;
      const isFile = !!(loc && loc.protocol === 'file:');

      // Allow file:// redirects only when running from file://
      if (/^file:\/\//i.test(u)) {
        return isFile ? u : null;
      }

      // Absolute http(s): allow only same-origin (and never from file:// demo)
      if (/^https?:\/\//i.test(u)) {
        if (isFile) return null;
        const parsed = new URL(u);
        return (parsed.origin === loc.origin) ? parsed.href : null;
      }

      // Relative URLs: resolve against current document.
      const base = (loc && loc.href) ? loc.href : (loc && loc.origin ? loc.origin : '');
      const parsedRel = new URL(u, base);
      if (isFile) return parsedRel.href;
      return (parsedRel.origin === loc.origin) ? parsedRel.href : null;
    } catch (e) {
      return null;
    }
  }

  // Normalize a POST endpoint to a safe, same-origin URL.
  // Accepts relative URLs and same-origin absolute URLs. Blocks dangerous schemes.
  function __cvNormalizeSameOriginEndpoint(raw){
    try {
      if (!raw) return null;
      const u = String(raw).trim();
      if (!u) return null;

      if (/^(javascript|data|vbscript):/i.test(u)) return null;
      // Protocol-relative URLs are ambiguous and can escape origin.
      if (/^\/\//.test(u)) return null;

      const loc = window.location;
      const isFile = !!(loc && loc.protocol === 'file:');

      // Absolute http(s): allow only same-origin (and never from file:// demo)
      if (/^https?:\/\//i.test(u)) {
        if (isFile) return null;
        const parsed = new URL(u);
        return (parsed.origin === loc.origin) ? parsed.href : null;
      }

      // file:// endpoints are not meaningful for fetch in production.
      if (/^file:\/\//i.test(u)) {
        return isFile ? u : null;
      }

      // Relative: resolve against current document.
      const base = (loc && loc.href) ? loc.href : (loc && loc.origin ? loc.origin : '');
      const parsedRel = new URL(u, base);
      if (isFile) return parsedRel.href;
      return (parsedRel.origin === loc.origin) ? parsedRel.href : null;
    } catch (_e) {
      return null;
    }
  }


