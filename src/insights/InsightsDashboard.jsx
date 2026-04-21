// src/insights/InsightsDashboard.jsx
import React, {
  useRef, useState, useCallback, useEffect, useLayoutEffect
} from 'react';
import { createPortal } from 'react-dom';
import { useDashboardData }    from './hooks/useDashboardData.js';
import { useDashboardMetrics } from './hooks/useDashboardMetrics.js';
import { computeCtaActions }   from './utils/metrics.js';
import { useResizers }         from './hooks/useResizers.js';
import { useDashboardTour, default as DashboardTour } from './components/DashboardTour.jsx';
import { useAnalyseMode }      from './components/AnalyseMode.jsx';
import DashboardHeader         from './components/DashboardHeader.jsx';
import ScoresPanel             from './components/ScoresPanel.jsx';
import DepthPanel              from './components/DepthPanel.jsx';
import HeatmapPanel            from './components/HeatmapPanel.jsx';
import TimeDonutPanel          from './components/TimeDonutPanel.jsx';
import McqPanel                from './components/McqPanel.jsx';
import InfoPane                from './components/InfoPane.jsx';
import FaqModal                from './components/FaqModal.jsx';
import GlossaryModal           from './components/GlossaryModal.jsx';
import { INFO_CONTENT }        from './data/infoContent.js';
import { interpretMetric }     from './utils/interpretMetric.js';
import { useGlowFollow } from '../shared/useGlowFollow.js';

// ── Layout presets ────────────────────────────────────────────────────────────
const PRESETS = [
  { id:'full',          label:'Full Dashboard', ui:{ mode:'full',      panels:{ scores:true,  depth:true,  heatmap:true,  time:true,  allocation:true,  mcq:true,  infoPane:true  }}},
  { id:'coding_core',   label:'Coding Core',    ui:{ mode:'full',      panels:{ scores:true,  depth:true,  heatmap:true,  time:true,  allocation:true,  mcq:false, infoPane:true  }}},
  { id:'heatmap_focus', label:'Heatmap Focus',  ui:{ mode:'full',      panels:{ scores:false, depth:false, heatmap:true,  time:false, allocation:false, mcq:false, infoPane:true  }}},
  { id:'scores_only',   label:'Scores Only',    ui:{ mode:'full',      panels:{ scores:true,  depth:false, heatmap:false, time:false, allocation:false, mcq:false, infoPane:true  }}},
  { id:'info_only',     label:'Summary View',   ui:{ mode:'info_only', panels:{ scores:false, depth:false, heatmap:false, time:false, allocation:false, mcq:false, infoPane:true  }}},
  { id:'mcq_only',      label:'MCQ Only',       ui:{ mode:'full',      panels:{ scores:false, depth:false, heatmap:false, time:false, allocation:false, mcq:true,  infoPane:true  }}},
];

// ── SVG icons for preset buttons (mirrors __cvLayoutPresetIconSvg) ─────────────
function PresetIcon({ id }) {
  const r = (x,y,w,h,cls) =>
    <rect key={`${x}${y}`} x={x} y={y} width={w} height={h} rx={0} ry={0} className={cls||undefined}/>;
  const base = { className:'cvLayoutIco', width:34, height:34, viewBox:'0 0 64 64', 'aria-hidden':'true', focusable:'false' };
  const frame = r(6,6,52,52,'cvLayoutFrame');
  const MAIN_X=10,MAIN_Y=10,MAIN_W=34,MAIN_H=44;
  const PANE_X=46,PANE_Y=10,PANE_W=8,PANE_H=44;
  const pane = r(PANE_X,PANE_Y,PANE_W,PANE_H,'cvLayoutPane');
  const L_X=10,L_W=10,M_X=21,M_W=12,R_X=34,R_W=10;
  let inner;
  if (id==='info_only')    inner = <>{r(10,10,44,10)}{r(10,22,44,32)}</>;
  else if (id==='scores_only') inner = <>{r(MAIN_X,MAIN_Y,MAIN_W,MAIN_H)}{pane}</>;
  else if (id==='heatmap_focus') inner = <>{r(MAIN_X,MAIN_Y,MAIN_W,MAIN_H)}{r(12,13,6,6)}{r(20,13,6,6)}{r(28,13,6,6)}{r(12,22,6,6)}{r(20,22,6,6)}{r(28,22,6,6)}{pane}</>;
  else if (id==='coding_core')  inner = <>{r(L_X,MAIN_Y,L_W,18)}{r(L_X,29,L_W,25)}{r(M_X,MAIN_Y,M_W,MAIN_H)}{r(R_X,MAIN_Y,R_W,18)}{r(R_X,29,R_W,25)}{pane}</>;
  else if (id==='mcq_only') inner = <>{r(MAIN_X,MAIN_Y,MAIN_W,MAIN_H)}{r(12,14,8,36)}{r(23,22,8,28)}{r(34,30,8,20)}{pane}</>;
  else /* full */ inner = <>{r(L_X,MAIN_Y,L_W,12)}{r(L_X,23,L_W,19)}{r(M_X,MAIN_Y,M_W,22)}{r(R_X,MAIN_Y,R_W,12)}{r(R_X,23,R_W,19)}{r(MAIN_X,38,MAIN_W,16)}{pane}</>;
  return <svg {...base}>{frame}{inner}</svg>;
}

// ── Grid layout computation (mirrors __cvApplyDynamicGridLayout) ──────────────
function computeGrid(panels, breakpoint) {
  const leftOn  = !!(panels.scores || panels.depth);
  const heatOn  = !!panels.heatmap;
  const rightOn = !!(panels.time  || panels.allocation);
  const mcqOn   = !!panels.mcq;

  if (!leftOn && !rightOn && !heatOn && !mcqOn) return null;

  const TOP_FR = 2.73, MCQ_FR = 1.3;
  let rows = [], colCount = 1, colTemplate = '1fr';

  if (breakpoint === 'wide') {
    const top = [];
    if (leftOn) top.push('left');
    if (heatOn) top.push('heat');
    if (rightOn) top.push('right');
    if (!top.length) { if (mcqOn) top.push('mcq'); else return null; }
    rows.push(top);
    colCount = top.length;
    colTemplate = colCount===3 ? '26.7fr 23.1fr 48.4fr'
                : colCount===2 ? 'minmax(520px,1fr) minmax(520px,1fr)'
                : '1fr';
    if (mcqOn && !(top.length===1 && top[0]==='mcq'))
      rows.push(new Array(colCount).fill('mcq'));
  } else if (breakpoint === 'medium') {
    const top = [];
    if (leftOn) top.push('left');
    if (rightOn) top.push('right');
    if (!top.length) { if (heatOn) top.push('heat'); else if (mcqOn) top.push('mcq'); else return null; }
    rows.push(top);
    colCount = top.length;
    colTemplate = colCount===2 ? 'minmax(520px,1fr) minmax(520px,1fr)' : '1fr';
    if (heatOn && !top.includes('heat')) rows.push(new Array(colCount).fill('heat'));
    if (mcqOn && !(top.length===1 && top[0]==='mcq')) rows.push(new Array(colCount).fill('mcq'));
  } else {
    const stack = [];
    if (leftOn)  stack.push('left');
    if (heatOn)  stack.push('heat');
    if (rightOn) stack.push('right');
    if (mcqOn)   stack.push('mcq');
    if (!stack.length) return null;
    rows = stack.map(a => [a]);
    colCount = 1; colTemplate = '1fr';
  }

  const areas = rows.map(r => `"${r.join(' ')}"`).join('\n');
  const rowTemplate = rows.map(r => r.includes('mcq') ? `minmax(0,${MCQ_FR}fr)` : `minmax(0,${TOP_FR}fr)`).join(' ');
  return { areas, colTemplate, rowTemplate };
}

function getBreakpoint() {
  const w = window.innerWidth || 0;
  if (w <= 1100) return 'narrow';
  if (w <= 1400) return 'medium';
  return 'wide';
}

function formatAnchorDate(raw) {
  if (!raw) return '';
  try {
    const d = new Date(String(raw).trim());
    return isNaN(d.getTime()) ? '' :
      d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  } catch (_) { return ''; }
}

// ── Layout preset dock (portal to document.body, position:fixed) ──────────────
function LayoutDock({ panels, uiMode, onPreset }) {
  const activePresetId = PRESETS.find(p =>
    p.ui.mode === uiMode &&
    Object.keys(p.ui.panels).every(k => panels[k] === p.ui.panels[k])
  )?.id;

  return createPortal(
    <div id="cvLayoutPresetDock" className="cvLayoutPresetDock isInHeader"
      role="group" aria-label="Dashboard layout presets">
      {PRESETS.map(p => (
        <button key={p.id} type="button"
          className={`cvLayoutBtn${activePresetId===p.id ? ' isOn isActive' : ''}`}
          data-layout-preset={p.id} aria-label={p.label}
          onClick={() => onPreset(p)}>
          <span className="cvLayoutBtnLabel">
            {p.label.includes(' ')
              ? <>{p.label.split(' ')[0]}<br/>{p.label.split(' ').slice(1).join(' ')}</>
              : p.label}
          </span>
          <span className="cvLayoutBtnIcon"><PresetIcon id={p.id} /></span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function InsightsDashboard() {
  useGlowFollow();
  const db      = useDashboardData();
  const metrics = useDashboardMetrics(db.dashData, db.selectedTrack);
  const mountRef = useRef(null);
  const resizers = useResizers(mountRef);
  const tour     = useDashboardTour();
  // Auto-refresh info pane when track changes (depth/heatmap/exercise data changes)
  const TRACK_SENSITIVE_KEYS = new Set([
    'panel_depth','panel_heatmap','panel_exercise','panel_scores'
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (TRACK_SENSITIVE_KEYS.has(db.activeInfoKey)) {
      db.setActiveInfoKey(db.activeInfoKey); // re-trigger to recompute interpretMetric
    }
  }, [db.selectedTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureInfoPaneOpen = useCallback(() => {
    db.setPanels(prev => prev.infoPane ? prev : { ...prev, infoPane: true });
  }, [db]);
  const analyse  = useAnalyseMode(mountRef, db.setActiveInfoKey, ensureInfoPaneOpen);
  const [faqOpen,   setFaqOpen]   = useState(false);
  const [glossOpen, setGlossOpen] = useState(false);
  const [themeKey,  setThemeKey]  = useState(0); // incremented on theme change to force chart rebuild

  const infoContent = INFO_CONTENT[db.activeInfoKey] || {};
  // CTA actions: use backend-provided recommendedActions merged with client-side fallbacks
  const ctaActions = computeCtaActions(
    db.dashData, metrics, metrics.alloc, metrics.mcqMatrix,
    metrics.depthScores, metrics.heatmapData
  );

  const infoInterp  = interpretMetric(
    db.activeInfoKey, metrics, metrics?.alloc, metrics?.mcqMatrix, metrics?.dailySeries
  );
  const anchorText  = formatAnchorDate(metrics.anchorDate || db.anchorDate);
  const uiMode      = db.uiMode;
  const panels      = db.panels;
  const isInfoOnly  = uiMode === 'info_only';

  const applyPreset = useCallback((p) => {
    db.setMode(p.ui.mode);
    db.setPanels({ ...p.ui.panels });
  }, [db]);

  const toggleInfoPane = useCallback(() => {
    db.setPanels(prev => ({ ...prev, infoPane: !prev.infoPane }));
  }, [db]);

  // Escape key closes open modals
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (faqOpen)   setFaqOpen(false);
      if (glossOpen) setGlossOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [faqOpen, glossOpen]);

  // Theme change → rebuild charts
  useEffect(() => {
    function onTheme() { setThemeKey(k => k + 1); }
    document.addEventListener('cv:theme-change', onTheme);
    return () => document.removeEventListener('cv:theme-change', onTheme);
  }, []);

  // Point mountRef at the #ciMount rendered by this component, and mark the
  // body with data-page so scoped selectors in dashboard.shell.css apply.
  useEffect(() => {
    mountRef.current = document.getElementById('ciMount');
    const prevPage = document.body.dataset.page;
    document.body.dataset.page = 'Performance Insights';
    return () => {
      if (prevPage === undefined) delete document.body.dataset.page;
      else document.body.dataset.page = prevPage;
    };
  }, []);

  // ── Apply data-layout, data-cv-panels, body class, grid layout ────────────
  useLayoutEffect(() => {
    const mount = document.getElementById('ciMount');
    if (!mount) return;

    // data-layout — drives CSS mode rules
    mount.setAttribute('data-layout', isInfoOnly ? 'info_only' : 'full');
    // body class — drives dock positioning in info_only
    document.body.classList.toggle('cv-body-info-only', isInfoOnly);

    // data-cv-panels — drives panel-specific CSS tweaks
    const active = [];
    if (panels.scores)     active.push('scores');
    if (panels.depth)      active.push('depth');
    if (panels.heatmap)    active.push('heatmap');
    if (panels.time)       active.push('time');
    if (panels.allocation) active.push('alloc');
    if (panels.mcq)        active.push('mcq');
    mount.setAttribute('data-cv-panels', active.join(' ') || 'none');

    // Dynamic grid layout on .form-body
    if (!isInfoOnly) {
      const formBody = mount.querySelector('.form-body');
      if (formBody) {
        const bp   = getBreakpoint();
        const grid = computeGrid(panels, bp);
        if (grid) {
          formBody.style.setProperty('grid-template-areas',   grid.areas);
          formBody.style.setProperty('grid-template-columns', grid.colTemplate);
          formBody.style.setProperty('grid-template-rows',    grid.rowTemplate);
        }
      }
    }
  }, [panels, uiMode, isInfoOnly]);

  // ── Wire data-info-key click delegation (matches vanilla setupInfoButtons) ─
  useEffect(() => {
    function onInfoClick(e) {
      const btn = e.target?.closest?.('.infoBtn');
      if (!btn) return;
      const key = btn.dataset?.infoKey;
      if (!key) return;
      db.setActiveInfoKey(key);
      // Also ensure info pane is open
      db.setPanels(prev => prev.infoPane ? prev : { ...prev, infoPane: true });
    }
    const mount = document.getElementById('ciMount');
    if (mount) mount.addEventListener('click', onInfoClick);
    return () => { if (mount) mount.removeEventListener('click', onInfoClick); };
  }, [db]);

  // ── Wire aggregation details toggle in info pane ──────────────────────────
  useEffect(() => {
    function onAggClick() {
      const body = document.getElementById('infoAggBody');
      const btn  = document.getElementById('infoAggBtn');
      if (!btn || !body) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      body.classList.toggle('isHidden', expanded);
    }
    const btn = document.getElementById('infoAggBtn');
    if (btn && !btn._cvBound) {
      btn._cvBound = true;
      btn.addEventListener('click', onAggClick);
    }
  });

  // ── Modal close delegation (data-close-modal) and in-pane help links ───────
  useEffect(() => {
    function onDocClick(e) {
      // Close buttons inside modals
      const closeBtn = e.target?.closest?.('[data-close-modal]');
      if (closeBtn) {
        const id = closeBtn.getAttribute('data-close-modal');
        if (id === 'cvFaqModal')      setFaqOpen(false);
        if (id === 'cvGlossaryModal') setGlossOpen(false);
        return;
      }
      // Click on modal backdrop (cvHelpModal class directly)
      if (e.target?.classList?.contains('cvHelpModal')) {
        if (e.target.id === 'cvFaqModal')      setFaqOpen(false);
        if (e.target.id === 'cvGlossaryModal') setGlossOpen(false);
        return;
      }
      // In-pane FAQ / Glossary links
      const link = e.target?.closest?.('#openFaqLinkInPane, #openGlossaryLinkInPane');
      if (link) {
        e.preventDefault();
        if (link.id === 'openFaqLinkInPane')      setFaqOpen(true);
        if (link.id === 'openGlossaryLinkInPane') setGlossOpen(true);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Re-compute grid on window resize
  useEffect(() => {
    function onResize() {
      const mount = document.getElementById('ciMount');
      if (!mount) return;
      const formBody = mount.querySelector('.form-body');
      if (!formBody) return;
      const bp   = getBreakpoint();
      const grid = computeGrid(panels, bp);
      if (grid) {
        formBody.style.setProperty('grid-template-areas',   grid.areas);
        formBody.style.setProperty('grid-template-columns', grid.colTemplate);
        formBody.style.setProperty('grid-template-rows',    grid.rowTemplate);
      }
    }
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [panels]);

  // Helper: className with optional isHidden
  const cls = (base, visible) => `${base}${visible ? '' : ' isHidden'}`;

  return (
    <div id="ciMount">
      <LayoutDock
        panels={panels} uiMode={uiMode}
        onPreset={applyPreset}
      />

      {/* ── insights-layout — rendered inside #ciMount ── */}
      <div className="insights-layout">

        <section className="insights-form" id="insightsForm">
          <DashboardHeader
            anchorDate={anchorText}
            onOpenFaq={() => setFaqOpen(true)}
            onOpenGlossary={() => setGlossOpen(true)}
            onStartTour={tour.start}
            infoPaneOpen={panels.infoPane}
            onToggleInfoPane={toggleInfoPane}
            analyseActive={analyse.analyseActive}
            onToggleAnalyse={analyse.toggleAnalyse}
            isInfoOnly={isInfoOnly}
            onRefresh={() => { if (db.dashData) db.applyData(db.dashData); }}
          />

          {/* form-body: ALL panels always in DOM — visibility via isHidden class */}
          <div className={cls('form-body', !isInfoOnly)}>

            {/* colLeft: scores + depth  (grid-area: left) */}
            <div className={cls('colLeft', !!(panels.scores || panels.depth))}>

              {/* Coding track selector — Combined / Micro / Interview */}
              {(metrics?.allocByTrack?.micro?.length > 0 || metrics?.depthByTrack?.micro?.length > 0) && (
                <div className="cvTrackSelector" role="group" aria-label="Coding track filter">
                  <span className="cvTrackLabel">Track:</span>
                  <div className="segmented cvTrackPills" role="tablist" aria-label="Coding track">
                    {['combined','micro','interview'].map(track => {
                      const hasMicro     = !!(metrics?.allocByTrack?.micro?.length || metrics?.depthByTrack?.micro?.length);
                      const hasInterview = !!(metrics?.allocByTrack?.interview?.length || metrics?.depthByTrack?.interview?.length);
                      const disabled = (track === 'micro' && !hasMicro) || (track === 'interview' && !hasInterview);
                      const label = track.charAt(0).toUpperCase() + track.slice(1);
                      return (
                        <button
                          key={track}
                          className={`segBtn${db.selectedTrack === track ? ' isActive' : ''}`}
                          data-cv-track={track}
                          type="button"
                          disabled={disabled}
                          aria-pressed={db.selectedTrack === track}
                          title={disabled ? `${label} data not available` : undefined}
                          onClick={() => db.setSelectedTrack(track)}
                        >{label}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              <ScoresPanel
                metrics={metrics}
                onInfoKey={db.setActiveInfoKey}
                hidden={!panels.scores}
                recommendedActions={ctaActions}
                isExpanded={uiMode === 'scores_only'}
              />
              <DepthPanel
                metrics={metrics}
                onInfoKey={db.setActiveInfoKey}
                hidden={!panels.depth}
                themeKey={themeKey}
                recommendedActions={ctaActions}
              />
            </div>

            {/* heatmapPanel: grid-area: heat */}
            <HeatmapPanel
              heatmapCells={metrics.heatmapData}
              onInfoKey={db.setActiveInfoKey}
              hidden={!panels.heatmap}
              themeKey={themeKey}
              heatmapView={db.selectedTrack === 'micro' ? 'micro' :
                           db.selectedTrack === 'interview' ? 'interview' : 'focus'}
              onViewChange={(view) => {
                if (view === 'micro')     db.setSelectedTrack('micro');
                else if (view === 'interview') db.setSelectedTrack('interview');
                else                     db.setSelectedTrack('combined');
              }}
              hasMicro={!!(metrics?.allocByTrack?.micro?.length || metrics?.depthByTrack?.micro?.length)}
              hasInterview={!!(metrics?.allocByTrack?.interview?.length || metrics?.depthByTrack?.interview?.length)}
              recommendedActions={ctaActions}
              allocData={metrics.alloc || []}
              depthData={metrics.depthScores || []}
            />

            {/* colRight: time + donut  (grid-area: right) */}
            <div className={cls('colRight', !!(panels.time || panels.allocation))}>
              <TimeDonutPanel
                metrics={metrics}
                onInfoKey={db.setActiveInfoKey}
                hiddenTime={!panels.time}
                hiddenAlloc={!panels.allocation}
                themeKey={themeKey}
                recommendedActions={ctaActions}
              />
            </div>

            {/* mcqPanel: grid-area: mcq */}
            <McqPanel
              metrics={metrics}
              onInfoKey={db.setActiveInfoKey}
              hidden={!panels.mcq}
              themeKey={themeKey}
              recommendedActions={ctaActions}
            />

          </div>
        </section>

        {/* infoPane: sibling of insights-form */}
        <InfoPane
          title={infoContent.title || 'Analysis'}
          sub={infoContent.sub || ''}
          body={infoContent.body || ''}
          interp={infoInterp || infoContent.interp || ''}
          hidden={!panels.infoPane}
          onClose={toggleInfoPane}
          showTabs={uiMode === 'info_only'}
          activeInfoKey={db.activeInfoKey}
          onTabClick={db.setActiveInfoKey}
        />

      </div>

      <DashboardTour tourState={tour} />

      {faqOpen   && createPortal(<FaqModal      open onClose={() => setFaqOpen(false)}   />, document.body)}
      {glossOpen && createPortal(<GlossaryModal open onClose={() => setGlossOpen(false)} />, document.body)}
    </div>
  );
}
