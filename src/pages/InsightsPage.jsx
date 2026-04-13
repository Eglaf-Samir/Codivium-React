// InsightsPage.jsx — FIX: Error-safe dashboard with full DOM cleanup
import React, { useEffect, useRef, Component } from 'react';

// ── Error boundary catches the dashboard's DOM manipulation errors ──
class DashboardErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: false }; } // silently recover
  componentDidCatch(err) {
    // If it's a DOM insertBefore error from dashboard cleanup, ignore it
    if (err && err.message && err.message.includes('insertBefore')) return;
    console.warn('[Insights] Dashboard error caught:', err.message);
  }
  render() { return this.props.children; }
}

function loadScript(src) {
  const s = document.createElement('script');
  s.src = src + '?_t=' + Date.now();
  s.defer = true;
  document.body.appendChild(s);
  return s;
}

function cleanupDashboard() {
  // 1. Destroy dashboard instance
  try {
    if (window.CodiviumInsights?.destroy) window.CodiviumInsights.destroy();
  } catch (_) {}

  // 2. Delete all dashboard globals
  const globals = ['CodiviumInsights','CodiviumInsightsConfig','__cvConfig',
                   '__cvState','__cvLayout','__cvData'];
  globals.forEach(k => { try { delete window[k]; } catch (_) {} });

  // 3. Remove all dashboard-injected floating DOM elements
  const selectors = [
    // Preset dock (the Full Dashboard / Coding Core panel on right side)
    '#cvLayoutPresetDock', '.cvLayoutPresetDock',
    // Help modals
    '.cvHelpModal','#cvFaqModal','#cvGlossaryModal','.cv-help-window',
    // Tooltips + tour overlays
    '.cv-tooltip','.cv-tour-overlay','.cv-tour-highlight',
    '.cv-tour-backdrop','.cv-tour-spotlight','.cv-tour-card',
    // Other dashboard portals
    '[data-cv-dashboard]','[id^="cvTour"]','.dashboard-portal',
  ];
  selectors.forEach(sel => {
    try { document.querySelectorAll(sel).forEach(el => el.remove()); } catch (_) {}
  });

  // 4. Remove injected scripts/styles
  document.querySelectorAll('script[src*="dashboard.bundle"]').forEach(el => {
    try { document.body.removeChild(el); } catch (_) {}
  });
  document.querySelectorAll('style[data-cv-dashboard],link[data-cv-dashboard]').forEach(el => {
    try { el.remove(); } catch (_) {}
  });

  // 5. Reset body classes
  ['cv-tour-active','dashboard-modal-open'].forEach(c => document.body.classList.remove(c));

  // 6. Restore normal scroll
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

function InsightsDashboard() {
  const scriptRef = useRef(null);

  useEffect(() => {
    // Clean up any previous instance first
    cleanupDashboard();

    // Load fresh bundle
    scriptRef.current = loadScript('/dashboard-js/dashboard.bundle.js');

    return () => {
      // Call cleanup synchronously before React removes the DOM
      cleanupDashboard();
      if (scriptRef.current) {
        try { document.body.removeChild(scriptRef.current); } catch (_) {}
        scriptRef.current = null;
      }
    };
  }, []);

  return (
    <main className="main stage" id="stage" role="main">
      <div className="stage-shell">
        <div className="watermarks" aria-hidden="true">
          <div className="word watermark-word wm1" data-text="CODIVIUM">CODIVIUM</div>
          <div className="word watermark-word wm2" data-text="CODIVIUM">CODIVIUM</div>
          <div className="word watermark-word wm3" data-text="CODIVIUM">CODIVIUM</div>
        </div>
        <div className="grid-scroll" id="gridScroll" aria-label="Scrollable dashboard">
          <div className="ciMount" id="ciMount" role="main" tabIndex="-1">
            <div className="insights-layout">
              <section className="insights-form" id="insightsForm">
                <div className="form-head">
                  <div className="form-head-left">
                    <h1 className="pageTitle">
                      Performance Insights Dashboard{' '}
                      <button aria-label="Intro" className="infoBtn introLink" data-info-key="welcome" type="button">Intro</button>
                      <button aria-label="Dashboard summary" className="infoBtn pageInfoBtn" data-info-key="dashboard_overview" type="button">i</button>
                      <button aria-label="Refresh dashboard" className="infoBtn introLink refreshDashboardBtn" type="button">Refresh dashboard</button>
                    </h1>
                    <div className="pageSubRow">
                      <p className="pageSub">Track time, convergence, and knowledge signals across categories.</p>
                      <span id="anchorDate" className="anchorDateTagline" aria-label="Anchor date"/>
                    </div>
                  </div>
                  <div className="form-head-right">
                    <div className="headHelpLinks">
                      <a href="#" className="dashHelpLink" id="openFaqLink">Dashboard FAQ</a>
                      <span className="dashHelpSep" aria-hidden="true">·</span>
                      <a href="#" className="dashHelpLink" id="openGlossaryLink">Glossary of Terms</a>
                    </div>
                    <button className="segBtn tourBtn" id="startTourBtn" type="button">Take a tour</button>
                  </div>
                </div>
                <div className="form-body">
                  <div className="colLeft">
                    <div className="card panel scoresPalette">
                      <div className="shellHead"><div><p className="title">Scores</p><p className="desc">Quick summary indicators.</p></div><button aria-label="Info" className="infoBtn" data-info-key="panel_scores" type="button">i</button></div>
                      <div className="scoresScrollArea">
                        <div aria-label="Scores view" className="segmented scoresTabs" role="tablist">
                          <button className="segBtn isActive" data-scores-tab="summary" type="button" role="tab" aria-selected="true" aria-controls="scoresTabSummary" id="scoresTabBtnSummary">Summary</button>
                          <button className="segBtn" data-scores-tab="breakdown" type="button" role="tab" aria-selected="false" aria-controls="scoresTabBreakdown" id="scoresTabBtnBreakdown">Breakdown</button>
                        </div>
                        <div className="scoresTabPanels">
                          <div className="scoresTabPanel" id="scoresTabSummary" role="tabpanel" aria-labelledby="scoresTabBtnSummary">
                            <div className="scoresGrid scoresGridMain">
                              {[['Codivium Score (0–100)','codiviumScore','scoreChipWide','codiviumScore'],
                                ['Codivium Points (all-time)','codiviumPointsAll','sm','codiviumPointsAll'],
                                ['Codivium Points (30D)','codiviumPoints30','sm','codiviumPoints30'],
                                ['Efficiency (pts/hr)','efficiencyPtsPerHr','sm','efficiencyPtsPerHr'],
                                ['Overall Breadth (B)','breadthScore','sm','breadthScore'],
                                ['Overall Depth (D)','depthOverallScore','sm','depthOverallScore'],
                              ].map(([title,id,cls,infoKey]) => (
                                <div key={id} className={`scoreChip${cls==='scoreChipWide'?' scoreChipWide':''}`}>
                                  <div className="kpiTitle">{title}</div>
                                  <div className={`kpiValue${cls==='sm'?' sm':''}`} id={id}>—</div>
                                  <button aria-label="Info" className="infoBtn chipInfo" data-info-key={infoKey} type="button">i</button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="scoresTabPanel" id="scoresTabBreakdown" role="tabpanel" aria-labelledby="scoresTabBtnBreakdown" hidden>
                            <div className="scoresGrid scoresGridBreakdown">
                              {[['Micro Breadth','microBreadthScore'],['Interview Breadth','interviewBreadthScore'],
                                ['MCQ Breadth','mcqBreadthScore'],['Micro Depth','microDepthScore'],['Interview Depth','interviewDepthScore']
                              ].map(([t,id]) => (
                                <div key={id} className="scoreChip"><div className="kpiTitle">{t}</div><div className="kpiValue sm" id={id}>—</div><button aria-label="Info" className="infoBtn chipInfo" data-info-key={id} type="button">i</button></div>
                              ))}
                            </div>
                            <div className="compactMiniKpis">
                              {[['First-try pass','firstTryPassRate'],['Avg attempts','avgAttemptsToAC'],['Median time','medianTimeToAC']].map(([t,id]) => (
                                <div key={id} className="mini"><div className="kpiTitle">{t}</div><div className="kpiValue sm" id={id}>—</div><button aria-label="Info" className="infoBtn miniInfo" data-info-key={id} type="button">i</button></div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="isHidden"><span id="depthAvg">—</span></div>
                      </div>
                    </div>
                    <div className="card panel depthPanel">
                      <div className="shellHead"><div><p className="title">Depth score by category</p><p className="desc">Normalized focus by category.</p></div><button aria-label="Info" className="infoBtn" data-info-key="panel_depth" type="button">i</button></div>
                      <div className="canvasWrap depth"><canvas id="depthChart" role="img" aria-label="Depth by category bar chart"/></div>
                    </div>
                  </div>
                  <div className="card panel heatmapPanel">
                    <div className="shellHead"><div><p className="title">Convergence heatmap</p><p className="desc">Average unit test pass% by attempt number (1 → 5).</p></div><button aria-label="Info" className="infoBtn" data-info-key="panel_heatmap" type="button">i</button></div>
                    <div className="heatmapWrap">
                      <div className="heatmapHead">
                        <div className="hCell hLabel"/>
                        {['A1','A2','A3','A4','A5'].map(a => <div key={a} className="hCell">{a}</div>)}
                      </div>
                      <div className="heatmapBody" id="convergenceHeatmap"/>
                    </div>
                  </div>
                  <div className="colRight">
                    <div className="card panel timePanel">
                      <div className="shellHead"><div><p className="title">Time on platform</p><p className="desc">Switch range and aggregation to see trend + cadence.</p></div><button aria-label="Info" className="infoBtn" data-info-key="panel_time" type="button">i</button></div>
                      <div className="timeKpis">
                        <div className="pill" id="timeThisWeek">This week: —</div>
                        <div className="pill" id="timeLast7Avg">Avg/day (7d): —</div>
                        <div className="pill" id="timeDays7">Days practiced (7d): —</div>
                      </div>
                      <div className="timeControls">
                        <div aria-label="Range" className="segmented" role="tablist">
                          {['7d','30d','90d','ytd'].map(r => <button key={r} className={`segBtn${r==='7d'?' isActive':''}`} data-time-range={r} type="button">{r.toUpperCase()}</button>)}
                        </div>
                        <div aria-label="Aggregation" className="segmented" role="tablist">
                          <button className="segBtn isActive" data-time-gran="daily" type="button">Daily</button>
                          <button className="segBtn" data-time-gran="weekly" type="button">Weekly</button>
                        </div>
                      </div>
                      <div className="pillRow"><div className="pill" id="timePlatformBadge">Total shown: —</div></div>
                      <div className="canvasWrap platform"><canvas id="timePlatformChart" role="img" aria-label="Time on platform chart"/></div>
                    </div>
                    <div className="card panel exercisePanel">
                      <div className="shellHead"><div><p className="title">Exercise time by category</p><p className="desc">Time allocation across core topics.</p></div><button aria-label="Info" className="infoBtn" data-info-key="panel_exercise" type="button">i</button></div>
                      <div className="allocControlsRow">
                        <div className="pill" id="exerciseTotalBadge">Total —</div>
                        <div aria-label="Allocation mode" className="segmented allocMode" role="tablist">
                          <button className="segBtn isActive" data-alloc-mode="minutes" type="button">Minutes</button>
                          <button className="segBtn" data-alloc-mode="share" type="button">Share</button>
                        </div>
                        <button className="segBtn allocResetBtn" id="allocResetBtn" type="button">ALL</button>
                      </div>
                      <div className="plot allocPlot"><canvas id="exerciseAllocChart" role="img" aria-label="Allocation doughnut chart"/></div>
                      <div className="allocFooter" id="allocFooter">
                        <div className="allocFooterHint" id="allocFooterHint">Click a bar to focus a category.</div>
                        <div className="categoryDetail isHidden" id="categoryDetail">
                          <div className="categoryDetailRow"><div className="categoryDetailLabel">Total time</div><div className="categoryDetailValue" id="categoryDetailTime">—</div></div>
                          <div className="categoryDetailRow"><div className="categoryDetailLabel">Share of total</div><div className="categoryDetailValue" id="categoryDetailShare">—</div></div>
                          <div className="categoryDetailRow"><div className="categoryDetailLabel">Exercises completed</div><div className="categoryDetailValue" id="categoryDetailSolved">—</div></div>
                        </div>
                      </div>
                    </div>
                    <div className="card panel mcqPanel">
                      <div className="shellHead"><div><p className="title">MCQ performance</p><p className="desc">Three difficulty views.</p></div><button aria-label="Info" className="infoBtn" data-info-key="panel_mcq" type="button">i</button></div>
                      <div className="mcqOverallRow">
                        <div className="mcqOverallBarOuter"><div className="mcqOverallBarInner" id="mcqOverallFill"/><div className="mcqOverallBarText" id="mcqOverallPct">—</div></div>
                        <div className="mcqOverallMeta" id="mcqOverallMeta">—</div>
                      </div>
                      <div className="mcqGrid">
                        {[['Basic','mcqEasyChart','mcqEasy'],['Intermediate','mcqMediumChart','mcqMedium'],['Advanced','mcqHardChart','mcqHard']].map(([t,id,k]) => (
                          <div key={id} className="mcqCard"><div className="mcqTitle">{t}</div><button aria-label="Info" className="infoBtn mcqInfo" data-info-key={k} type="button">i</button><div className="canvasWrap mcq"><canvas id={id} role="img" aria-label={`MCQ ${t} chart`}/></div></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <aside aria-live="polite" className="infoPane card" id="infoPane">
                <div className="infoPaneHead">
                  <div className="infoPaneTitle" id="infoPaneTitle">Analysis</div>
                  <div className="infoPaneSub" id="infoPaneSub"/>
                  <button aria-label="Close analysis pane" className="infoPaneCloseBtn" id="infoPaneCloseBtn" title="Collapse analysis pane" type="button">&#x2715;</button>
                </div>
                <div className="infoPaneScroll" id="infoPaneScroll">
                  <div className="infoPaneHint" id="infoPaneHint">
                    For any term you do not understand, refer to the{' '}
                    <a href="#" className="dashHelpLink inline" id="openFaqLinkInPane">Dashboard FAQ</a> or the{' '}
                    <a href="#" className="dashHelpLink inline" id="openGlossaryLinkInPane">Glossary of Terms</a>.
                  </div>
                  <div className="infoPaneWelcome" id="infoPaneWelcome"/>
                  <div className="infoPaneBody" id="infoPaneBody"/>
                  <div className="infoAgg" id="infoAgg">
                    <button className="infoAggBtn" id="infoAggBtn" type="button" aria-expanded="false">Aggregation details</button>
                    <div className="infoAggBody isHidden" id="infoAggBody"/>
                  </div>
                  <div className="infoPaneInterp">
                    <div className="infoPaneInterpTitle">Analysis of your results</div>
                    <div className="infoPaneInterpBody" id="infoPaneInterp"/>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      {/* FAQ Modal */}
      <div aria-labelledby="cvFaqTitle" aria-modal="true" className="cvHelpModal isHidden" id="cvFaqModal" role="dialog">
        <div className="cvHelpWindow cvHelpDoc" tabIndex="-1">
          <button aria-label="Close Dashboard FAQ" className="cvHelpCloseBtn" data-close-modal="cvFaqModal" type="button">Close</button>
          <div className="wrap"><header><h1 id="cvFaqTitle">Dashboard FAQ</h1></header><div id="cvFaqContent"/></div>
        </div>
      </div>
      {/* Glossary Modal */}
      <div aria-labelledby="cvGlossaryTitle" aria-modal="true" className="cvHelpModal isHidden" id="cvGlossaryModal" role="dialog">
        <div className="cvHelpWindow cvHelpDoc" tabIndex="-1">
          <button aria-label="Close Glossary" className="cvHelpCloseBtn" data-close-modal="cvGlossaryModal" type="button">Close</button>
          <div className="wrap"><header><h1 id="cvGlossaryTitle">Glossary of Terms</h1></header><div id="cvGlossaryContent"/></div>
        </div>
      </div>
    </main>
  );
}

export default function InsightsPage() {
  return (
    <DashboardErrorBoundary>
      <InsightsDashboard />
    </DashboardErrorBoundary>
  );
}
