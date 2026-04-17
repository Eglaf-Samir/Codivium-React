// dashboard.00e.resizers.js — Splitter factories, drag handlers, resizer init/cleanup
// Part of dashboard.00.core.js split — concatenated by build_dashboard_bundle.sh

const __CV_RESIZERS_KEY       = 'cv.dashboard.resizers';
  const __CV_RESIZER_INFO_W_MIN = 300;
  const __CV_RESIZER_INFO_W_MAX = 680;
  const __CV_RESIZER_MCQ_H_MIN  = 160;
  const __CV_RESIZER_MCQ_H_MAX  = 620;

  function __cvReadResizerState(){
    try {
      if (!window.localStorage) return {};
      const raw = window.localStorage.getItem(__CV_RESIZERS_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }

  function __cvWriteResizerState(patch){
    try {
      if (!window.localStorage) return;
      const existing = __cvReadResizerState();
      window.localStorage.setItem(__CV_RESIZERS_KEY,
        JSON.stringify(Object.assign({}, existing, patch)));
    } catch (e) {}
  }

  function __cvRestoreResizerState(mount){
    const st = __cvReadResizerState();
    // Use saved value if above minimum, otherwise apply default (40% wider than legacy 14.4%)
    const infoWDefault = 380;
    const infoW = (st.infoW && st.infoW >= __CV_RESIZER_INFO_W_MIN) ? st.infoW : infoWDefault;
    mount.style.setProperty('--cv-info-w', infoW + 'px');
    if (st.mcqH)     mount.style.setProperty('--cv-mcq-h',     st.mcqH  + 'px');
    // heatCols is stored as fr values (e.g. "26.7fr 23.1fr 48.4fr")
    if (st.heatCols) mount.style.setProperty('--cv-heat-cols', st.heatCols);
    // Col-panel flex: restore directly as inline important style on each panel
    const restore = [
      ['.scoresPalette', st.scoresFlex],
      ['.depthPanel',    st.depthFlex],
      ['.timePanel',     st.timeFlex],
      ['.donutPanel',    st.donutFlex],
    ];
    restore.forEach(([sel, val]) => {
      if (val != null){
        const el = mount.querySelector(sel);
        if (el) el.style.setProperty('flex', val + ' 1 0', 'important');
      }
    });
  }

  // Returns the current breakpoint for the mount (duplicates __cvGetBreakpoint for use
  // inside the resizer module without a hard dependency on its exact location).
  function __cvResizerBreakpoint(){
    try { return __cvGetEffectiveUiState().breakpoint; } catch (_) { return 'wide'; }
  }

  // Re-positions absolutely-placed form-body splitters to the true midpoint of each gap.
  // Only runs when breakpoint is 'wide' — heatmap splitters don't exist in other layouts.
  function __cvPositionGridSplitters(mount){
    const formBody = mount.querySelector('.form-body');
    if (!formBody) return;
    const fbRect = formBody.getBoundingClientRect();
    const bp = __cvResizerBreakpoint();

    // MCQ row boundary — midpoint between bottom of analytics area and top of MCQ panel
    const mcqEl  = mount.querySelector('.mcqPanel');
    const colL   = mount.querySelector('.colLeft');
    const mcqSpl = formBody.querySelector('#cvSplitterMcq');
    if (mcqEl && mcqSpl){
      const mcqTop    = mcqEl.getBoundingClientRect().top    - fbRect.top;
      const refBottom = colL
        ? (colL.getBoundingClientRect().bottom - fbRect.top)
        : (mcqTop - 9);
      mcqSpl.style.top = Math.max(0, ((refBottom + mcqTop) / 2) - 12) + 'px';
    }

    // Heatmap column splitters — only valid in wide layout
    if (bp !== 'wide') return;
    const heatEl = mount.querySelector('.heatmapPanel');
    const colR   = mount.querySelector('.colRight');
    const heatL  = formBody.querySelector('#cvSplitterHeatL');
    const heatR  = formBody.querySelector('#cvSplitterHeatR');
    if (!heatEl) return;
    const hRect  = heatEl.getBoundingClientRect();
    const topOff = hRect.top  - fbRect.top;
    const rowH   = hRect.height;
    if (heatL && colL){
      const lRect = colL.getBoundingClientRect();
      const midX  = (lRect.right + hRect.left) / 2 - fbRect.left;
      heatL.style.left   = (midX - 12) + 'px';
      heatL.style.top    = topOff + 'px';
      heatL.style.height = rowH  + 'px';
    }
    if (heatR && colR){
      const rRect = colR.getBoundingClientRect();
      const midX  = (hRect.right + rRect.left) / 2 - fbRect.left;
      heatR.style.left   = (midX - 12) + 'px';
      heatR.style.top    = topOff + 'px';
      heatR.style.height = rowH  + 'px';
    }
  }

  function __cvBindSplitterGlow(splitter, isVertical){
    splitter.addEventListener('mousemove', (e) => {
      try {
        const r = splitter.getBoundingClientRect();
        if (isVertical){
          splitter.style.setProperty('--sp-y',
            ((e.clientY - r.top) / Math.max(1, r.height) * 100).toFixed(1) + '%');
        } else {
          splitter.style.setProperty('--sp-x',
            ((e.clientX - r.left) / Math.max(1, r.width) * 100).toFixed(1) + '%');
        }
      } catch (_) {}
    }, { passive: true });
  }

  function __cvMakeSplitter(id, extraClass, ariaLabel, ariaOrientation){
    const el = document.createElement('div');
    el.id = id;
    el.className = 'cvSplitter ' + extraClass;
    el.setAttribute('role',             'separator');
    el.setAttribute('aria-label',       ariaLabel);
    el.setAttribute('aria-orientation', ariaOrientation);
    el.setAttribute('tabindex',         '0');
    el.innerHTML = '<div class="cvSplitLine"></div>';
    return el;
  }

  function __cvStartDrag(splitter, mount){
    splitter.classList.add('cv-active');
    mount.classList.add('cv-splitting');
  }
  function __cvEndDrag(splitter, mount){
    splitter.classList.remove('cv-active');
    mount.classList.remove('cv-splitting');
  }

  // ── Info-pane vertical splitter ──────────────────────────────────────
  function __cvInitInfoPaneSplitter(mount){
    const layout   = mount.querySelector('.insights-layout');
    const infoPane = mount.querySelector('#infoPane');
    if (!layout || !infoPane) return;
    if (layout.querySelector('#cvSplitterInfoPane')) return;

    const splitter = __cvMakeSplitter('cvSplitterInfoPane', 'cvSplitterV',
      'Drag to resize the analysis pane', 'vertical');
    layout.insertBefore(splitter, infoPane);
    __cvBindSplitterGlow(splitter, true);

    let dragging = false, startX = 0, startW = 0;

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startX = e.clientX;
      try { startW = parseFloat(getComputedStyle(infoPane).width) || 380; } catch (_) { startW = 380; }
      splitter.setPointerCapture(e.pointerId);
      __cvStartDrag(splitter, mount);
    });
    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const newW = Math.max(__CV_RESIZER_INFO_W_MIN,
        Math.min(__CV_RESIZER_INFO_W_MAX, startW + (startX - e.clientX)));
      mount.style.setProperty('--cv-info-w', newW + 'px');
      // Reposition absolute splitters so they track the resizing form-body
      __cvPositionGridSplitters(mount);
    }, { passive: true });
    const onEnd = () => {
      if (!dragging) return; dragging = false;
      __cvEndDrag(splitter, mount);
      try {
        __cvWriteResizerState({
          infoW: Math.round(parseFloat(getComputedStyle(infoPane).width) || startW)
        });
      } catch (_) {}
    };
    splitter.addEventListener('pointerup',     onEnd);
    splitter.addEventListener('pointercancel', onEnd);
  }

  // ── MCQ row-boundary horizontal splitter ─────────────────────────────
  function __cvInitMcqSplitter(mount){
    const formBody = mount.querySelector('.form-body');
    const mcqPanel = mount.querySelector('.mcqPanel');
    if (!formBody || !mcqPanel) return;
    if (formBody.querySelector('#cvSplitterMcq')) return;

    const splitter = __cvMakeSplitter('cvSplitterMcq', 'cvSplitterH',
      'Drag to resize MCQ panel', 'horizontal');
    formBody.appendChild(splitter);
    __cvBindSplitterGlow(splitter, false);
    __cvPositionGridSplitters(mount);

    let dragging = false, startY = 0, startH = 0, baseRows = [];

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startY = e.clientY;
      try { startH = parseFloat(getComputedStyle(mcqPanel).height) || 280; } catch (_) { startH = 280; }
      try {
        const raw = formBody.style.getPropertyValue('grid-template-rows') || '';
        const tokens = raw.match(/minmax\([^)]+\)|\d+(?:\.\d+)?(?:px|fr|%)/g) || [];
        baseRows = tokens.length > 1 ? tokens.slice(0, -1) : ['minmax(0, 2.73fr)'];
      } catch (_) { baseRows = ['minmax(0, 2.73fr)']; }
      splitter.setPointerCapture(e.pointerId);
      __cvStartDrag(splitter, mount);
    });
    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const newH = Math.max(__CV_RESIZER_MCQ_H_MIN,
        Math.min(__CV_RESIZER_MCQ_H_MAX, startH - (e.clientY - startY)));
      mount.style.setProperty('--cv-mcq-h', newH + 'px');
      formBody.style.setProperty('grid-template-rows',
        [...baseRows, newH + 'px'].join(' '));
      __cvPositionGridSplitters(mount);
    }, { passive: true });
    const onEnd = () => {
      if (!dragging) return; dragging = false;
      __cvEndDrag(splitter, mount);
      try {
        __cvWriteResizerState({
          mcqH: Math.round(
            parseFloat(mount.style.getPropertyValue('--cv-mcq-h')) || startH)
        });
      } catch (_) {}
    };
    splitter.addEventListener('pointerup',     onEnd);
    splitter.addEventListener('pointercancel', onEnd);
  }

  // ── Heatmap left + right vertical column splitters ───────────────────
  // Only injected on 'wide' breakpoint. Stores fr ratios so grid always
  // reflows proportionally when the insights-form container changes width.
  function __cvInitHeatSplitters(mount){
    const formBody = mount.querySelector('.form-body');
    const heatEl   = mount.querySelector('.heatmapPanel');
    if (!formBody || !heatEl) return;
    if (__cvResizerBreakpoint() !== 'wide') return; // not relevant outside wide layout

    ['HeatL', 'HeatR'].forEach((side) => {
      const id = 'cvSplitter' + side;
      if (formBody.querySelector('#' + id)) return;
      const splitter = __cvMakeSplitter(id, 'cvSplitterV',
        side === 'HeatL' ? 'Drag to resize left column' : 'Drag to resize right column',
        'vertical');
      formBody.appendChild(splitter);
      __cvBindSplitterGlow(splitter, true);
    });
    __cvPositionGridSplitters(mount);

    [['HeatL', 'left'], ['HeatR', 'right']].forEach(([side, which]) => {
      const splitter = formBody.querySelector('#cvSplitter' + side);
      if (!splitter) return;
      let dragging = false, startX = 0, startCols = [];

      splitter.addEventListener('pointerdown', (e) => {
        e.preventDefault(); dragging = true; startX = e.clientX;
        try {
          startCols = ['.colLeft', '.heatmapPanel', '.colRight']
            .map((s) => mount.querySelector(s))
            .filter(Boolean)
            .map((el) => el.getBoundingClientRect().width);
          if (startCols.length !== 3) startCols = [300, 260, 440];
        } catch (_) { startCols = [300, 260, 440]; }
        splitter.setPointerCapture(e.pointerId);
        __cvStartDrag(splitter, mount);
      });
      splitter.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        let [lw, mw, rw] = startCols;
        if (which === 'left'){
          lw = Math.max(80, lw + dx);
          mw = Math.max(80, startCols[0] + startCols[1] - lw);
        } else {
          rw = Math.max(80, rw - dx);
          mw = Math.max(80, startCols[1] + startCols[2] - rw);
        }
        // Store and apply as fr ratios so grid always reflows with container width.
        const total = lw + mw + rw;
        const frL = (lw / total * 100).toFixed(3);
        const frM = (mw / total * 100).toFixed(3);
        const frR = (rw / total * 100).toFixed(3);
        const tpl = frL + 'fr ' + frM + 'fr ' + frR + 'fr';
        formBody.style.setProperty('grid-template-columns', tpl);
        mount.style.setProperty('--cv-heat-cols', tpl);
        __cvPositionGridSplitters(mount);
      }, { passive: true });
      const onEnd = () => {
        if (!dragging) return; dragging = false;
        __cvEndDrag(splitter, mount);
        try {
          __cvWriteResizerState({
            heatCols: mount.style.getPropertyValue('--cv-heat-cols')
          });
        } catch (_) {}
      };
      splitter.addEventListener('pointerup',     onEnd);
      splitter.addEventListener('pointercancel', onEnd);
    });
  }

  // ── Generic in-column horizontal flex splitter ───────────────────────
  // Writes flex directly as important inline style on the panels so it beats
  // all !important stylesheet rules. Uses the actual panel rects (excluding
  // the splitter itself) to compute the drag delta correctly.
  function __cvInitColSplitter(mount, colSel, id, selTop, selBot, storeTop, storeBot){
    const colEl = mount.querySelector(colSel);
    const topEl = colEl && colEl.querySelector(selTop);
    const botEl = colEl && colEl.querySelector(selBot);
    if (!colEl || !topEl || !botEl) return;
    if (colEl.querySelector('#' + id)) return;

    const splitter = __cvMakeSplitter(id, 'cvSplitterH', 'Drag to resize panels', 'horizontal');
    colEl.insertBefore(splitter, botEl);
    __cvBindSplitterGlow(splitter, false);

    let dragging = false, startY = 0, startTopH = 0, startBotH = 0;

    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; startY = e.clientY;
      // Measure only the panel heights (not the splitter itself)
      startTopH = topEl.getBoundingClientRect().height;
      startBotH = botEl.getBoundingClientRect().height;
      splitter.setPointerCapture(e.pointerId);
      __cvStartDrag(splitter, mount);
    });
    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy      = e.clientY - startY;
      const newTopH = Math.max(80, startTopH + dy);
      const newBotH = Math.max(80, startBotH - dy);
      const total   = newTopH + newBotH;
      const fTop    = parseFloat((newTopH / total * 100).toFixed(3));
      const fBot    = parseFloat((newBotH / total * 100).toFixed(3));
      // inline !important beats all stylesheet rules including !important
      topEl.style.setProperty('flex', fTop + ' 1 0', 'important');
      botEl.style.setProperty('flex', fBot + ' 1 0', 'important');
    }, { passive: true });
    const onEnd = () => {
      if (!dragging) return; dragging = false;
      __cvEndDrag(splitter, mount);
      try {
        const patch = {};
        patch[storeTop] = parseFloat(topEl.style.flex) || 0;
        patch[storeBot] = parseFloat(botEl.style.flex) || 0;
        __cvWriteResizerState(patch);
      } catch (_) {}
    };
    splitter.addEventListener('pointerup',     onEnd);
    splitter.addEventListener('pointercancel', onEnd);
  }

  // ── Cleanup all splitters ────────────────────────────────────────────
  function __cvCleanupResizers(mount){
    ['#cvSplitterInfoPane','#cvSplitterMcq','#cvSplitterHeatL',
     '#cvSplitterHeatR','#cvSplitterScoresDep','#cvSplitterTimeDon']
      .forEach((sel) => {
        try { const el = mount.querySelector(sel); if (el) el.remove(); } catch (_) {}
      });
  }

  // ── Main entry point ─────────────────────────────────────────────────
  // True only when every main panel is visible — i.e. the full dashboard layout.
  function __cvIsFullDashboard(st){
    if (!st || st.mode !== 'full') return false;
    const p = st.panels || {};
    return !!(p.scores && p.depth && p.heatmap && p.time && p.allocation && p.mcq);
  }

  function __cvInitPanelResizers(){
    const mount = getMount();
    if (!mount) return;
    const st = __cvGetEffectiveUiState();

    if (st.mode === 'info_only' || st.breakpoint === 'narrow'){
      __cvCleanupResizers(mount);
      return;
    }

    __cvRestoreResizerState(mount);
    // Info-pane splitter present on all layouts (except summary/narrow above).
    __cvInitInfoPaneSplitter(mount);

    if (__cvIsFullDashboard(st)){
      __cvInitMcqSplitter(mount);
      if (st.breakpoint === 'wide'){
        __cvInitHeatSplitters(mount);
      } else {
        try { const el = mount.querySelector('#cvSplitterHeatL'); if (el) el.remove(); } catch (_) {}
        try { const el = mount.querySelector('#cvSplitterHeatR'); if (el) el.remove(); } catch (_) {}
      }
      __cvInitColSplitter(mount, '.colLeft',  'cvSplitterScoresDep',
        '.scoresPalette', '.depthPanel',  'scoresFlex', 'depthFlex');
      __cvInitColSplitter(mount, '.colRight', 'cvSplitterTimeDon',
        '.timePanel',     '.donutPanel',  'timeFlex',   'donutFlex');
      setTimeout(() => __cvPositionGridSplitters(mount), 0);
    } else {
      // Non-full layout — remove all panel-level splitters.
      ['#cvSplitterMcq','#cvSplitterHeatL','#cvSplitterHeatR',
       '#cvSplitterScoresDep','#cvSplitterTimeDon']
        .forEach((sel) => {
          try { const el = mount.querySelector(sel); if (el) el.remove(); } catch (_) {}
        });
    }
  }
