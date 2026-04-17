// dashboard.00c.layout.js — Panel visibility, layout presets, grid, mode application
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

function __cvApplyPanelVisibility(){
    const mount = getMount();
    if (!mount) return;

    const panels = (__cvState.__uiPanels && typeof __cvState.__uiPanels === "object") ? __cvState.__uiPanels : __UI_DEFAULT.panels;

    const setVisible = (selector, isVisible) => {
      try {
        mount.querySelectorAll(selector).forEach((el) => {
          el.classList.toggle("isHidden", !isVisible);
          el.setAttribute("aria-hidden", (!isVisible).toString());
        });
      } catch (_) {}
    };

    setVisible(".scoresPalette", !!panels.scores);
    setVisible(".depthPanel", !!panels.depth);
    setVisible(".heatmapPanel", !!panels.heatmap);
    setVisible(".timePanel", !!panels.time);
    setVisible(".donutPanel", !!panels.allocation);
    setVisible(".mcqPanel", !!panels.mcq);
    setVisible("#infoPane", !!panels.infoPane);

    const leftOn = !!(panels.scores || panels.depth);
    const rightOn = !!(panels.time || panels.allocation);

    setVisible(".colLeft", leftOn);
    setVisible(".colRight", rightOn);

    // If the scores-expanded tri-track view is active but scores_only is no longer
    // the current layout, tear it down so .scoresScrollArea becomes visible again.
    // (window.__cv_teardownScoresExpanded is registered by dashboard.06.mcq-and-render.js)
    try {
      if (typeof window.__cv_teardownScoresExpanded === 'function') {
        window.__cv_teardownScoresExpanded();
      }
    } catch (_) {}

    // Stamp a data-cv-panels attribute on #ciMount so CSS can target single-panel
    // layouts without relying on data-cv-focus (which is never set by JS).
    try {
      const mount = getMount();
      if (mount) {
        const active = [];
        if (panels.scores)     active.push('scores');
        if (panels.depth)      active.push('depth');
        if (panels.heatmap)    active.push('heatmap');
        if (panels.time)       active.push('time');
        if (panels.allocation) active.push('alloc');
        if (panels.mcq)        active.push('mcq');
        mount.setAttribute('data-cv-panels', active.join(' ') || 'none');
      }
    } catch (_) {}
  }

  // -----------------------------
  // UI mode + dynamic layout (G03)
  // -----------------------------
  const __CV_AUTO_SUMMARY_MAX_W = 900; // below this, force info-only summary view

  function __cvGetViewportWidth(){
    try { return Math.max(0, Math.floor(window.innerWidth || 0)); } catch (e) { return 0; }
  }

  function __cvGetBreakpoint(width){
    const w = Number(width) || __cvGetViewportWidth();
    if (w <= 1100) return 'narrow';
    if (w <= 1400) return 'medium';
    return 'wide';
  }

  function __cvClampToAllowedMode(mode, allowed){
    if (!allowed || !Array.isArray(allowed) || allowed.length === 0) return mode;
    const normalised = allowed.map((m) => __cvNormalizeUiMode(m));
    if (normalised.includes(mode)) return mode;
    return normalised[0] || 'full';
  }

  function __cvGetEffectiveUiState(){
    __cvEnsureUiPrefsLoaded();
    const vw = __cvGetViewportWidth();
    const bp = __cvGetBreakpoint(vw);
    const forced = vw > 0 && vw < __CV_AUTO_SUMMARY_MAX_W;
    const rawMode = __cvNormalizeUiMode(__cvState.__uiMode);
    // allowedModes: server constraint — clamp *before* forced-small-screen override
    const clamped = __cvClampToAllowedMode(rawMode, __cvState.__allowedModes);
    const mode = forced ? 'info_only' : clamped;
    const panels = __cvNormalizePanels(__cvState.__uiPanels);
    return {
      width: vw,
      breakpoint: bp,
      forcedSmallScreen: forced,
      mode,
      panels
    };
  }

  function __cvIsHidden(el){
    if (!el) return true;
    try {
      if (el.classList && el.classList.contains('isHidden')) return true;
      const anc = el.closest && el.closest('.isHidden');
      if (anc) return true;
      const cs = window.getComputedStyle(el);
      if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return true;
      return false;
    } catch (e) { return true; }
  }

  function __cvEnsureSummaryBanner(mount){
    try {
      if (!mount) return null;
      const infoPane = mount.querySelector('#infoPane');
      if (!infoPane) return null;
      let banner = infoPane.querySelector('#cvSummaryBanner');
      if (!banner){
        banner = document.createElement('div');
        banner.id = 'cvSummaryBanner';
        banner.className = 'cvSummaryBanner isHidden';
        banner.setAttribute('role', 'note');
        banner.innerHTML = '<strong>Summary view</strong> on small screens. Use a desktop for the full dashboard.';
        const head = infoPane.querySelector('.infoPaneHead');
        if (head && head.parentNode) head.parentNode.insertBefore(banner, head.nextSibling);
        else infoPane.insertBefore(banner, infoPane.firstChild);
      }
      return banner;
    } catch (e) { return null; }
  }

  function __cvEnsureInfoPaneNavigator(mount){
    try {
      if (!mount) return null;
      const infoPane = mount.querySelector('#infoPane');
      if (!infoPane) return null;
      let strip = infoPane.querySelector('#cvInfoPaneTabs');
      if (strip) return strip;

      strip = document.createElement('div');
      strip.id = 'cvInfoPaneTabs';
      strip.className = 'infoPaneTabs isHidden';
      strip.setAttribute('role', 'tablist');
      strip.setAttribute('aria-label', 'Dashboard summaries');

      const tabs = [
        { key: 'dashboard_overview', label: 'Overview' },
        { key: 'panel_scores', label: 'Scores' },
        { key: 'panel_heatmap', label: 'Heatmap' },
        { key: 'panel_depth', label: 'Depth' },
        { key: 'panel_time', label: 'Time' },
        { key: 'panel_exercise', label: 'Allocation' },
        { key: 'panel_mcq', label: 'MCQ' }
      ];

      for (const t of tabs){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'infoPaneTabBtn';
        btn.textContent = t.label;
        btn.setAttribute('data-info-key', t.key);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          __cvState.__activeInfoKey = t.key;
          try { if (typeof setScoresInfoPane === 'function') setScoresInfoPane(t.key); } catch (_) {}
          __cvSyncInfoPaneNavigatorActive(t.key);
        });
        strip.appendChild(btn);
      }

      const head = infoPane.querySelector('.infoPaneHead');
      if (head && head.parentNode) head.parentNode.insertBefore(strip, head.nextSibling);
      else infoPane.insertBefore(strip, infoPane.firstChild);

      return strip;
    } catch (e) { return null; }
  }



  // -----------------------------
  // Layout preset toggle buttons (header layout switcher)
  // -----------------------------

  // NOTE: Button order is intentional: Full dashboard on the far left.
  const __CV_LAYOUT_PRESETS = [
    {
      id: 'full',
      label: 'Full Dashboard',
      ui: {
        mode: 'full',
        panels: {
          scores: true,
          depth: true,
          heatmap: true,
          time: true,
          allocation: true,
          mcq: true,
          infoPane: true
        }
      }
    },
    {
      id: 'coding_core',
      label: 'Coding Core',
      ui: {
        mode: 'full',
        panels: {
          scores: true,
          depth: true,
          heatmap: true,
          time: true,
          allocation: true,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'heatmap_focus',
      label: 'Heatmap Focus',
      ui: {
        mode: 'full',
        panels: {
          scores: false,
          depth: false,
          heatmap: true,
          time: false,
          allocation: false,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'scores_only',
      label: 'Scores Only',
      ui: {
        mode: 'full',
        panels: {
          scores: true,
          depth: false,
          heatmap: false,
          time: false,
          allocation: false,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'info_only',
      label: 'Summary View',
      ui: {
        mode: 'info_only',
        panels: {
          scores: false,
          depth: false,
          heatmap: false,
          time: false,
          allocation: false,
          mcq: false,
          infoPane: true
        }
      }
    },
    {
      id: 'mcq_only',
      label: 'MCQ Only',
      ui: {
        mode: 'full',
        panels: {
          scores: false,
          depth: false,
          heatmap: false,
          time: false,
          allocation: false,
          mcq: true,
          infoPane: true
        }
      }
    }
  ];

  function __cvLayoutPresetIconSvg(presetId){
    // Icons should accurately represent which dashboard components are visible.
    // Components considered (user spec):
    // (i) side window (info pane)  (ii) MCQ performance  (iii) heat map
    // (iv) time on platform  (v) scores  (vi) time by category.

    const base = '<svg class="cvLayoutIco" width="34" height="34" viewBox="0 0 64 64" aria-hidden="true" focusable="false">';
    const end = '</svg>';
    const r = (x, y, w, h, cls) => '<rect ' + (cls ? ('class="' + cls + '" ') : '') + 'x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="0" ry="0" />';
    const frame = r(6, 6, 52, 52, 'cvLayoutFrame');

    // Geometry: main area + right-side info pane.
    const MAIN_X = 10, MAIN_Y = 10, MAIN_W = 34, MAIN_H = 44;
    const PANE_X = 46, PANE_Y = 10, PANE_W = 8, PANE_H = 44;
    const pane = r(PANE_X, PANE_Y, PANE_W, PANE_H, 'cvLayoutPane');

    // 1) Summary view (info-only): header strip + info pane content (same width).
    if (presetId === 'info_only'){
      return base + frame +
        r(10, 10, 44, 10) +
        r(10, 22, 44, 32) +
        end;
    }

    // Helper: three-column layout (Scores | Heatmap | Time/Allocation)
    const L_X = 10, L_W = 10;
    const M_X = 21, M_W = 12;
    const R_X = 34, R_W = 10;

    // Scores-only: just the Scores window + side pane.
    if (presetId === 'scores_only'){
      return base + frame + r(MAIN_X, MAIN_Y, MAIN_W, MAIN_H) + pane + end;
    }

    // Heatmap focus: just the Heatmap window + side pane.
    // Render a heatmap-like grid inside the main block to differentiate it.
    if (presetId === 'heatmap_focus'){
      const cells = [
        r(MAIN_X + 2, MAIN_Y + 3, 6, 6), r(MAIN_X + 10, MAIN_Y + 3, 6, 6), r(MAIN_X + 18, MAIN_Y + 3, 6, 6),
        r(MAIN_X + 2, MAIN_Y + 12, 6, 6), r(MAIN_X + 10, MAIN_Y + 12, 6, 6), r(MAIN_X + 18, MAIN_Y + 12, 6, 6),
      ].join('');
      return base + frame + r(MAIN_X, MAIN_Y, MAIN_W, MAIN_H) + cells + pane + end;
    }

    // Coding core: Scores + Heatmap + Time on platform + Time by category + side pane.
    // (No MCQ panel.)
    if (presetId === 'coding_core'){
      return base + frame +
        // Left: Scores (top) + (Depth lives here too, represented as second block)
        r(L_X, MAIN_Y, L_W, 18) + r(L_X, MAIN_Y + 19, L_W, 25) +
        // Middle: Heatmap
        r(M_X, MAIN_Y, M_W, MAIN_H) +
        // Right: Time (top) + Time by category (bottom)
        r(R_X, MAIN_Y, R_W, 18) + r(R_X, MAIN_Y + 19, R_W, 25) +
        pane + end;
    }

    // MCQ-only: full-width MCQ panel + side info pane.
    if (presetId === 'mcq_only'){
      const bw = 8, bx1 = MAIN_X + 2, bx2 = MAIN_X + 13, bx3 = MAIN_X + 24;
      return base + frame +
        r(MAIN_X, MAIN_Y, MAIN_W, MAIN_H) +
        r(bx1, MAIN_Y + 4, bw, 36) +
        r(bx2, MAIN_Y + 12, bw, 28) +
        r(bx3, MAIN_Y + 20, bw, 20) +
        pane + end;
    }

    // Full dashboard: Coding core + MCQ performance row spanning the main area.
    return base + frame +
      // Top area (Scores / Heatmap / Time+Allocation)
      r(L_X, MAIN_Y, L_W, 12) + r(L_X, MAIN_Y + 13, L_W, 19) +
      r(M_X, MAIN_Y, M_W, 22) +
      r(R_X, MAIN_Y, R_W, 12) + r(R_X, MAIN_Y + 13, R_W, 19) +
      // Bottom row: MCQ
      r(MAIN_X, MAIN_Y + 28, MAIN_W, 16) +
      pane + end;
  }

  function __cvPresetMatchesState(preset, state){
    try {
      if (!preset || !state) return false;
      const pm = __cvNormalizeUiMode((preset.ui && preset.ui.mode) || 'full');
      if (pm !== state.mode) return false;
      if (state.mode === 'info_only') return preset.id === 'info_only';
      const pp = __cvNormalizePanels((preset.ui && preset.ui.panels) || null);
      const sp = __cvNormalizePanels(state.panels || null);
      for (const k of Object.keys(pp)){
        if (pp[k] !== sp[k]) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  function __cvEnsureLayoutPresetDock(mount, state){
    try {
      if (!mount) return null;
      const st = state || __cvGetEffectiveUiState();
      let dock = mount.querySelector('#cvLayoutPresetDock');

      if (!dock){
        dock = document.createElement('div');
        dock.id = 'cvLayoutPresetDock';
        dock.className = 'cvLayoutPresetDock';
        dock.setAttribute('role', 'group');
        dock.setAttribute('aria-label', 'Dashboard layout presets');

        for (const p of __CV_LAYOUT_PRESETS){
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cvLayoutBtn';
          btn.setAttribute('data-layout-preset', p.id);
          btn.setAttribute('aria-label', p.label);
          btn.setAttribute('aria-pressed', 'false');
          // title tooltip removed — label text now shown directly on the button
          const labelSpan = document.createElement('span');
          labelSpan.className = 'cvLayoutBtnLabel';
          // Split label at first space so two-word labels render on two lines
          const _lblWords = p.label.split(' ');
          if (_lblWords.length >= 2) {
            labelSpan.innerHTML = _lblWords[0] + '<br>' + _lblWords.slice(1).join(' ');
          } else {
            labelSpan.textContent = p.label;
          }
          btn.innerHTML = '';
          btn.appendChild(labelSpan);
          const iconWrapper = document.createElement('span');
          iconWrapper.className = 'cvLayoutBtnIcon';
          iconWrapper.innerHTML = __cvLayoutPresetIconSvg(p.id);
          btn.appendChild(iconWrapper);

          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eff = __cvGetEffectiveUiState();
            if (eff.forcedSmallScreen && p.id !== 'info_only') return;
            try {
              const cfg = window.CodiviumInsightsConfig || {};
              const ms = (cfg.resilience && cfg.resilience.ignoreAfterToggleMs) || 180;
              if (typeof window.__cvSetResilienceIgnoreUntil === 'function') window.__cvSetResilienceIgnoreUntil(ms);
            } catch (_) {}
            try {
              if (window.CodiviumInsights && typeof window.CodiviumInsights.setUiPrefs === 'function'){
                window.CodiviumInsights.setUiPrefs(p.ui);
              }
            } catch (_) {}
          });

          dock.appendChild(btn);
        }
      }

      // Dock on document.body: position:fixed is always viewport-relative.
      dock.classList.remove('isInInfoPane');
      dock.classList.add('isInHeader');
      if (dock.parentNode !== document.body){
        document.body.appendChild(dock);
      }

      return dock;
    } catch (e) { return null; }
  }

  function __cvSyncLayoutPresetDock(state){
    try {
      const mount = getMount();
      if (!mount) return;
      const st = state || __cvGetEffectiveUiState();
      const dock = __cvEnsureLayoutPresetDock(mount, st);
      if (!dock) return;

      const forced = !!st.forcedSmallScreen;
      dock.classList.toggle('isForced', forced);

      dock.querySelectorAll('button[data-layout-preset]').forEach((btn) => {
        const id = btn.getAttribute('data-layout-preset');
        const preset = __CV_LAYOUT_PRESETS.find((p) => p.id === id);
        const on = __cvPresetMatchesState(preset, st);
        const presetMode = __cvNormalizeUiMode((preset && preset.ui && preset.ui.mode) || 'full');
        const allowed = __cvState.__allowedModes;
        const modeBlocked = allowed && Array.isArray(allowed) && allowed.length > 0 &&
                            !allowed.map((m) => __cvNormalizeUiMode(m)).includes(presetMode);
        const dis = (forced && id !== 'info_only') || !!modeBlocked;

        btn.classList.toggle('isOn', on);
        btn.classList.toggle('isDisabled', dis);
        btn.classList.toggle('isHidden', !!modeBlocked);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-hidden', modeBlocked ? 'true' : 'false');
        if (dis) btn.setAttribute('disabled', 'disabled');
        else btn.removeAttribute('disabled');
      });
    } catch (e) { /* ignore */ }
  }
  function __cvSyncInfoPaneNavigatorActive(activeKey){
    try {
      const mount = getMount();
      if (!mount) return;
      const strip = mount.querySelector('#cvInfoPaneTabs');
      if (!strip) return;
      strip.querySelectorAll('button[data-info-key]').forEach((btn) => {
        const k = btn.getAttribute('data-info-key');
        const on = (k === activeKey);
        btn.classList.toggle('isActive', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    } catch (e) { /* ignore */ }
  }

  function __cvApplyInfoPaneLayoutForMode(mount, mode){
    try {
      if (!mount) return;
      const infoPane = mount.querySelector('#infoPane');
      if (!infoPane) return;
      const strip = mount.querySelector('#cvInfoPaneTabs');
      const hint = infoPane.querySelector('#infoPaneHint');
      const agg = infoPane.querySelector('#infoAgg');
      const interpWrap = infoPane.querySelector('.infoPaneInterp');
      const body = infoPane.querySelector('#infoPaneBody');

      const isInfoOnly = (mode === 'info_only');
      if (strip) strip.classList.toggle('isHidden', !isInfoOnly);
      if (hint) hint.classList.toggle('isHidden', isInfoOnly);
      if (agg) agg.classList.toggle('isHidden', isInfoOnly);

      // In Summary View we still want the main body text visible.
      // Keep both the body and interp sections available; we hide hint/agg instead.
      if (interpWrap) interpWrap.classList.remove('isHidden');
      if (body) body.classList.remove('isHidden');
    } catch (e) { /* ignore */ }
  }

  function __cvApplyDynamicGridLayout(mount, bp){
    try {
      if (!mount) return;
      const formBody = mount.querySelector('.form-body');
      if (!formBody) return;

      const leftEl = mount.querySelector('.colLeft');
      const rightEl = mount.querySelector('.colRight');
      const heatEl = mount.querySelector('.heatmapPanel');
      const mcqEl = mount.querySelector('.mcqPanel');

      const leftOn = leftEl && !__cvIsHidden(leftEl);
      const rightOn = rightEl && !__cvIsHidden(rightEl);
      const heatOn = heatEl && !__cvIsHidden(heatEl);
      const mcqOn = mcqEl && !__cvIsHidden(mcqEl);

      if (!leftOn && !rightOn && !heatOn && !mcqOn) return;

      let rows = [];
      let colCount = 1;
      let colTemplate = '1fr';

      if (bp === 'wide'){
        const top = [];
        if (leftOn) top.push('left');
        if (heatOn) top.push('heat');
        if (rightOn) top.push('right');
        if (!top.length){
          if (mcqOn) top.push('mcq');
          else return;
        }
        rows.push(top);
        colCount = top.length;
        if (colCount === 3) {
          const storedCols = mount.style.getPropertyValue('--cv-heat-cols');
          colTemplate = (storedCols && storedCols.trim()) ? storedCols.trim() : '26.7fr 23.1fr 48.4fr';
        }
        else if (colCount === 2) colTemplate = 'minmax(520px, 1fr) minmax(520px, 1fr)';
        else colTemplate = '1fr';
        if (mcqOn && !(top.length === 1 && top[0] === 'mcq')) rows.push(new Array(colCount).fill('mcq'));
      }
      else if (bp === 'medium'){
        const top = [];
        if (leftOn) top.push('left');
        if (rightOn) top.push('right');
        if (!top.length){
          if (heatOn) top.push('heat');
          else if (mcqOn) top.push('mcq');
          else return;
        }
        rows.push(top);
        colCount = top.length;
        colTemplate = (colCount === 2) ? 'minmax(520px, 1fr) minmax(520px, 1fr)' : '1fr';
        if (heatOn && !top.includes('heat')) rows.push(new Array(colCount).fill('heat'));
        if (mcqOn && !(top.length === 1 && top[0] === 'mcq')) rows.push(new Array(colCount).fill('mcq'));
      }
      else {
        const stack = [];
        if (leftOn) stack.push('left');
        if (heatOn) stack.push('heat');
        if (rightOn) stack.push('right');
        if (mcqOn) stack.push('mcq');
        if (!stack.length) return;
        rows = stack.map((a) => [a]);
        colCount = 1;
        colTemplate = '1fr';
      }

      const areas = rows.map((r) => `"${r.join(' ')}"`).join('\n');

      // Row template: use fr ratios that match the CSS so the inline style
      // and the stylesheet agree. repeat(N, auto) was overriding the CSS fr values.
      // Rows array structure: every row that contains 'mcq' gets the MCQ fr weight;
      // all other rows (analytics) share the top fr weight equally.
      const TOP_FR  = 2.73;
      const MCQ_FR  = 1.3;

      // If the user has dragged the MCQ splitter, --cv-mcq-h is set on #ciMount.
      // Use that px value directly as the MCQ row size so the drag survives layout
      // passes — otherwise the fr ratio would overwrite the user's choice.
      const storedMcqH = mount.style.getPropertyValue('--cv-mcq-h');
      const mcqRowSize = (storedMcqH && parseFloat(storedMcqH) > 0)
        ? storedMcqH.trim()
        : `minmax(0, ${MCQ_FR}fr)`;

      const rowTemplate = rows
        .map((r) => r.includes('mcq') ? mcqRowSize : `minmax(0, ${TOP_FR}fr)`)
        .join(' ');

      formBody.style.setProperty('grid-template-areas', areas);
      formBody.style.setProperty('grid-template-columns', colTemplate);
      formBody.style.setProperty('grid-template-rows', rowTemplate);
    } catch (e) { /* ignore */ }
  }


  // (dead function removed — no longer needed after !important refactor)


  // ── Info-pane side toggle ───────────────────────────────────────────────
  // A small button shown in form-head-right whenever the layout has the info
  // pane as a collapsible side window (i.e. mode=full, any preset except info_only).
  // Hides itself in info_only mode where the pane IS the main view.

  function __cvSyncInfoPaneToggle(state) {
    try {
      const mount = getMount();
      if (!mount) return;

      let btn = mount.querySelector('#cvInfoPaneToggleBtn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'cvInfoPaneToggleBtn';
        btn.type = 'button';
        btn.className = 'cvInfoPaneToggleBtn';
        btn.setAttribute('aria-label', 'Toggle info panel');
        btn.innerHTML =
          '<svg class="cvInfoPaneToggleIco" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
          '<rect x="2" y="2" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
          '<rect x="13" y="2" width="5" height="16" rx="0" fill="currentColor" opacity="0.3"/>' +
          '<line x1="13" y1="2" x2="13" y2="18" stroke="currentColor" stroke-width="1.4"/>' +
          '</svg>' +
          '<span class="cvInfoPaneToggleTxt">Info</span>';
        btn.addEventListener('click', function() {
          try {
            if (window.CodiviumInsights && typeof window.CodiviumInsights.toggleInfoPane === 'function') {
              window.CodiviumInsights.toggleInfoPane();
            }
          } catch (_) {}
        });

        // Insert into form-head-right
        const headRight = mount.querySelector('.form-head-right');
        if (headRight) {
          headRight.insertBefore(btn, headRight.firstChild);
        }
      }

      const isInfoOnly = state && state.mode === 'info_only';
      const paneOpen = state && state.panels && state.panels.infoPane !== false;

      // Hide entirely in info_only mode
      btn.classList.toggle('isHidden', !!isInfoOnly);

      // Reflect open/closed state
      btn.classList.toggle('isPaneOpen', !isInfoOnly && !!paneOpen);
      btn.setAttribute('aria-pressed', (!isInfoOnly && !!paneOpen) ? 'true' : 'false');

      // Update label
      const txt = btn.querySelector('.cvInfoPaneToggleTxt');
      if (txt) txt.textContent = paneOpen ? 'Info' : 'Info';

    } catch (e) { /* silent */ }
  }

  function __cvApplyUiModeAndLayout(){
    const mount = getMount();
    if (!mount) return;

    const state = __cvGetEffectiveUiState();
    __cvState.__uiEffectiveMode = state.mode;
    __cvState.__uiForcedSmallScreen = state.forcedSmallScreen;

    // data-layout attr — authoritative signal read by dashboard.layout.css
    mount.setAttribute('data-layout', state.mode); // e.g. "info_only" | "full"

    // Mode classes — kept for backward compat; new CSS uses data-layout instead
    // Note: data-layout attribute (set above) is the canonical CSS authority.
    // cv-mode-* classes removed (R16 cleanup) — they were never used in CSS rules.
    mount.classList.toggle('cv-forced-summary', !!state.forcedSmallScreen);
    // Propagate mode to body so the dock (which lives on body) can be repositioned
    try { document.body.classList.toggle('cv-body-info-only', state.mode === 'info_only'); } catch (_) {}

    const formBody = mount.querySelector('.form-body');
    const infoPane = mount.querySelector('#infoPane');

    // Ensure the summary banner exists and toggle it only when forced by small screens.
    const banner = __cvEnsureSummaryBanner(mount);
    if (banner) banner.classList.toggle('isHidden', !state.forcedSmallScreen);

    // Ensure info-pane navigator exists.
    __cvEnsureInfoPaneNavigator(mount);

    // Ensure layout preset dock exists and reflects the current mode/panels.
    __cvSyncLayoutPresetDock(state);

    // Sync the info-pane side toggle button in form-head-right.
    __cvSyncInfoPaneToggle(state);

    if (state.mode === 'info_only'){
      // Disable the tour in Summary View.
      try {
        const tourBtn = mount.querySelector('#startTourBtn');
        if (tourBtn){
          tourBtn.setAttribute('disabled', 'disabled');
          tourBtn.setAttribute('aria-disabled', 'true');
          tourBtn.tabIndex = -1;
        }
      } catch (_) {}

      // Clear dynamic-grid inline styles so CSS info_only rules take full control.
      try {
        if (formBody) {
          formBody.style.removeProperty('grid-template-areas');
          formBody.style.removeProperty('grid-template-columns');
          formBody.style.removeProperty('grid-template-rows');
        }
      } catch (_) {}

      if (formBody) formBody.classList.add('isHidden');
      if (infoPane){
        infoPane.classList.remove('isHidden');
        infoPane.setAttribute('aria-hidden', 'false');
      }

      // Ensure the summary is visible (no "halfway down" surprise after scrolling in full mode).
      try {
        const outer = mount.closest('.grid-scroll') || document.querySelector('#gridScroll');
        if (outer && typeof outer.scrollTop === 'number') outer.scrollTop = 0;
        const ips = mount.querySelector('#infoPaneScroll');
        if (ips && typeof ips.scrollTop === 'number') ips.scrollTop = 0;
      } catch (_) {}

      __cvApplyInfoPaneLayoutForMode(mount, 'info_only');

      // Default to an overview summary.
      if (!__cvState.__activeInfoKey || __cvState.__activeInfoKey === 'welcome') __cvState.__activeInfoKey = 'dashboard_overview';

      // Render the correct info content for the active key.
      try {
        // Prefer the structured score renderer (it has a robust fallback for dashboard_overview).
        if (typeof setScoresInfoPane === 'function') {
          // Guard against rare TDZ issues by checking SCORE_INFO_KEYS presence safely.
          const canUseScoreKeys = (typeof SCORE_INFO_KEYS !== 'undefined' && SCORE_INFO_KEYS && typeof SCORE_INFO_KEYS.has === 'function');
          if (!canUseScoreKeys || SCORE_INFO_KEYS.has(__cvState.__activeInfoKey)) {
            setScoresInfoPane(__cvState.__activeInfoKey);
          } else if (typeof setInfoPane === 'function') {
            setInfoPane(__cvState.__activeInfoKey);
          }
        } else if (typeof refreshInfoIfActive === 'function') {
          refreshInfoIfActive(__cvState.__activeInfoKey);
        }
      } catch (_) {}
      __cvSyncInfoPaneNavigatorActive(__cvState.__activeInfoKey);

      // In info-only mode, ignore stored panel toggles for the info pane (it must remain visible).
      return;
    }

    // Full mode: ensure tour button is enabled.
    try {
      const tourBtn = mount.querySelector('#startTourBtn');
      if (tourBtn){
        tourBtn.removeAttribute('disabled');
        tourBtn.setAttribute('aria-disabled', 'false');
        tourBtn.tabIndex = 0;
      }
    } catch (_) {}

    // Full mode: apply per-panel toggles and rebuild grid.
    if (formBody) formBody.classList.remove('isHidden');
    __cvApplyPanelVisibility();
    __cvApplyInfoPaneLayoutForMode(mount, 'full');
    __cvApplyDynamicGridLayout(mount, state.breakpoint);

    // Keep navigator state in sync if the active key is one of the tab keys.
    __cvSyncInfoPaneNavigatorActive(__cvState.__activeInfoKey);

    // Initialise / teardown drag-resize splitters based on current mode and breakpoint.
    try { __cvInitPanelResizers(); } catch (_) {}
  }

  
  // Coalesce multiple UI changes into a single layout pass.
  function __cvRequestUiApply(reason, afterApply){
    try {
      if (__cvState.__cvUiApplyRaf) {
        // A rAF is already pending. If a new afterApply callback was provided,
        // chain it onto the existing pending apply by cancelling and rescheduling.
        if (typeof afterApply === 'function') {
          cancelAnimationFrame(__cvState.__cvUiApplyRaf);
          __cvState.__cvUiApplyRaf = 0;
        } else {
          return; // No callback and rAF already queued — coalesce.
        }
      }
      __cvState.__cvUiApplyRaf = requestAnimationFrame(() => {
        __cvState.__cvUiApplyRaf = 0;
        try { __cvApplyUiModeAndLayout(); } catch (e) { ciErr('ui_apply', reason, e); }
        // Run post-apply callback AFTER layout is applied (panels shown/hidden).
        if (typeof afterApply === 'function') {
          try { afterApply(); } catch (e) { ciErr('ui_apply_after', reason, e); }
        }
      });
    } catch (e) {
      // Fallback: apply immediately if rAF is unavailable
      try { __cvApplyUiModeAndLayout(); } catch (err) { ciErr('ui_apply_fallback', reason, err); }
      if (typeof afterApply === 'function') { try { afterApply(); } catch (_) {} }
    }
  }

function __cvBindUiLayoutListeners(){
    const mount = getMount();
    if (!mount) return;
    const st = __cvMountState(mount);
    if (st.uiLayoutBound) return;
    st.uiLayoutBound = true;

    const onResize = () => {
      __cvRequestUiApply('resize');
    };

    st.uiLayoutOnResize = onResize;
    try { window.addEventListener('resize', onResize, { passive: true }); } catch (e) { window.addEventListener('resize', onResize); }
  }




  // Expose minimal UI-pref API for future settings integration (optional)
  window.CodiviumInsights = window.CodiviumInsights || {};
  // Expose bounded state object for test introspection (read-only reference).
  if (__cvConfig.debug) window.CodiviumInsights.__state = __cvState;

  window.CodiviumInsights.getUiPrefs = function(){
    __cvEnsureUiPrefsLoaded();
    return { mode: __cvState.__uiMode, panels: Object.assign({}, __cvState.__uiPanels) };
  };

  // Toggle the info pane open/closed (used by the collapse button in the info pane header).
  window.CodiviumInsights.toggleInfoPane = function(){ __cvToggleInfoPane(); };

  // Coding track selector setter (used by the track pills in dashboard.06).
  window.__cv_setSelectedTrack = function(track) {
    const valid = ['combined', 'micro', 'interview'];
    if (!valid.includes(track)) return;
    __cvState.__selectedCodingTrack = track;
    // Persist alongside existing ui prefs so selection survives page reload
    try {
      __cvWriteUiToLocalStorage({
        mode:  __cvState.__uiMode,
        panels: __cvState.__uiPanels,
        selectedTrack: track
      });
    } catch (_) {}
  };
  window.CodiviumInsights.getSelectedTrack = function(){ return __cvState.__selectedCodingTrack; };
  window.CodiviumInsights.setSelectedTrack = function(track){ window.__cv_setSelectedTrack(track); };

  window.CodiviumInsights.getEffectiveUiState = function(){
    try { return __cvGetEffectiveUiState(); } catch (e) { return { mode: __cvState.__uiMode, panels: Object.assign({}, __cvState.__uiPanels) }; }
  };
  window.CodiviumInsights.setUiPrefs = function(ui){
    __cvEnsureUiPrefsLoaded();
    safe('bind_ui_layout_listeners', () => { if (typeof __cvBindUiLayoutListeners === 'function') __cvBindUiLayoutListeners(); });
    if (!ui || typeof ui !== "object") return;
    // Clamp mode to server-allowed set before storing
    const requestedMode = __cvNormalizeUiMode(ui.mode);
    __cvState.__uiMode = __cvClampToAllowedMode(requestedMode, __cvState.__allowedModes);
    __cvState.__uiPanels = __cvNormalizePanels(ui.panels);
    __cvWriteUiToLocalStorage({ mode: __cvState.__uiMode, panels: __cvState.__uiPanels });
    // Pass refresh() as afterApply so it fires AFTER __cvApplyUiModeAndLayout removes
    // isHidden (display:none) from newly-shown panels. Without this, refresh() fires
    // before the panel is visible and charts measure 0px, then are never retried.
    const doRefresh = () => {
      if (window.CodiviumInsights && typeof window.CodiviumInsights.refresh === 'function') {
        window.CodiviumInsights.refresh();
      }
    };
    if (typeof __cvRequestUiApply === 'function') __cvRequestUiApply('set_ui_prefs', doRefresh);
    else {
      if (typeof __cvApplyUiModeAndLayout === 'function') __cvApplyUiModeAndLayout();
      else __cvApplyPanelVisibility();
      safe('refresh_after_set_ui_prefs', doRefresh);
    }
  };

  /** @type {(infoKey: string, data: any) => string | null} */
