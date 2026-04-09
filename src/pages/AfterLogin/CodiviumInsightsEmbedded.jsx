import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import usePageMeta from "../../hooks/usePageMeta";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";
import Header from "../../components/Header.jsx";
// import "../../assets/components/core/base.css";
import "../../assets/components/dashboard/dashboard.base.css";
import "../../assets/components/dashboard/dashboard.shell.css";
import "../../assets/components/dashboard/dashboard.resizers.css";
import "../../assets/components/dashboard/dashboard.layout.css";
import "../../assets/components/dashboard/dashboard.panels.css";
import "../../assets/components/dashboard/dashboard.chrome.css";
import "../../assets/components/dashboard/dashboard.modals.css";
import "../../assets/components/dashboard/dashboard.math.css";



function CodiviumInsightsEmbedded() {
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add("mcq-parent");

        return () => {
            document.body.classList.remove("mcq-parent");
        };
    }, []);

    return (
        <>
            <noscript>
                <div className="cv-noscript-wall">
                    <h1>JavaScript required</h1>
                    <p>Codivium requires JavaScript to run. Please enable JavaScript in your browser settings.</p>
                </div>
            </noscript>
            <div className="svg-sprite-container">
                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <symbol id="icon-adaptive" viewBox="0 0 24 24">
                        <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                        <path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0" />
                        <path d="M9 21v-6h6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-tutorials" viewBox="0 0 24 24">
                        <path d="M2.5 5.5h7.5a3.8 3.8 0 0 1 3.8 3.8V21a2.6 2.6 0 0 0-2.6-2.6H2.5V5.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                        <path d="M21.5 5.5H14a3.8 3.8 0 0 0-3.8 3.8V21a2.6 2.6 0 0 1 2.6-2.6h8.7V5.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-insights" viewBox="0 0 24 24">
                        <path d="M4 19V5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M8 19V11" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M12 19V8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M16 19V14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M20 19V6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                    </symbol>
                    <symbol id="icon-interview" viewBox="0 0 24 24">
                        <path d="M7 7h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 17h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M6 4h12a2 2 0 0 1 2 2v14l-4-2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-micro" viewBox="0 0 24 24">
                        <path d="M12 2v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M12 18v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M4.9 4.9l2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M16.3 16.3l2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M2 12h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M18 12h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M4.9 19.1l2.8-2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M16.3 7.7l2.8-2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" stroke="currentColor" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-mcq" viewBox="0 0 24 24">
                        <path d="M7 9h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 13h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M9 3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-settings" viewBox="0 0 24 24">
                        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2.0" />
                        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2.0" />
                    </symbol>
                </svg>
            </div>

            <a className="skip-link" href="#main-content">Skip to main content</a>
            <Header />
            <Sidebar />

            <main className="stage" id="stage">
                <div className="stage-shell">
                    <div aria-hidden="true" className="watermarks">
                        <div className="word watermark-word wm1" data-text="CODIVIUM">CODIVIUM</div>
                        <div className="word watermark-word wm2" data-text="CODIVIUM">CODIVIUM</div>
                        <div className="word watermark-word wm3" data-text="CODIVIUM">CODIVIUM</div>
                        <div className="word watermark-word wm4" data-text="CODIVIUM">CODIVIUM</div>
                        <div className="word watermark-word wm5" data-text="CODIVIUM">CODIVIUM</div>
                        <div className="word watermark-word wm6" data-text="CODIVIUM">CODIVIUM</div>
                        <div className="word watermark-word wm7" data-text="CODIVIUM">CODIVIUM</div>
                    </div>
                    <div aria-label="Scrollable exercise grid" className="grid-scroll" id="gridScroll">
                        <div className="ciMount" id="ciMount" role="main" tabindex="-1">
                            <div className="insights-layout">
                                <section className="insights-form" id="insightsForm">
                                    <div className="form-head">
                                        <div className="form-head-left">
                                            <h1 className="pageTitle">Performance Insights Dashboard <button aria-label="Intro" className="infoBtn introLink" data-info-key="welcome" type="button">Intro</button><button aria-label="Dashboard summary" className="infoBtn pageInfoBtn" data-info-key="dashboard_overview" type="button">i</button><button aria-label="Refresh dashboard" className="infoBtn introLink refreshDashboardBtn" type="button">Refresh dashboard</button></h1>
                                            <div className="pageSubRow"><p className="pageSub">Track time, convergence, and knowledge signals across categories.</p><span id="anchorDate" className="anchorDateTagline" aria-label="Anchor date"></span></div>
                                        </div>
                                        <div className="form-head-right">
                                            <div className="headHelpLinks">
                                                <a href="#" className="dashHelpLink" id="openFaqLink" role="link">Dashboard FAQ</a>
                                                <span className="dashHelpSep" aria-hidden="true">·</span>
                                                <a href="#" className="dashHelpLink" id="openGlossaryLink" role="link">Glossary of Terms</a>
                                            </div>
                                            <button className="segBtn tourBtn" id="startTourBtn" type="button">Take a tour</button>
                                        </div>
                                    </div>
                                    <div className="form-body">
                                        <div className="colLeft">
                                            <div className="card panel scoresPalette">
                                                <div className="shellHead">
                                                    <div>
                                                        <p className="title">Scores</p>
                                                        <p className="desc">Quick summary indicators.</p>
                                                    </div>
                                                    <button aria-label="Info" className="infoBtn" data-info-key="panel_scores" type="button">i</button>
                                                </div>
                                                <div className="scoresScrollArea">
                                                    <div aria-label="Scores view" className="segmented scoresTabs" role="tablist">
                                                        <button className="segBtn isActive" data-scores-tab="summary" type="button" role="tab" aria-selected="true" aria-controls="scoresTabSummary" id="scoresTabBtnSummary">Summary</button>
                                                        <button className="segBtn" data-scores-tab="breakdown" type="button" role="tab" aria-selected="false" aria-controls="scoresTabBreakdown" id="scoresTabBtnBreakdown">Breakdown</button>
                                                    </div>

                                                    <div className="scoresTabPanels">
                                                        <div className="scoresTabPanel" id="scoresTabSummary" role="tabpanel" aria-labelledby="scoresTabBtnSummary">
                                                            <div className="scoresGrid scoresGridMain">
                                                                <div className="scoreChip scoreChipWide">
                                                                    <div className="kpiTitle">Codivium Score (0–100)</div>
                                                                    <div className="kpiValue" id="codiviumScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="codiviumScore" type="button">i</button>
                                                                </div>

                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Codivium Points (all-time)</div>
                                                                    <div className="kpiValue sm" id="codiviumPointsAll">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="codiviumPointsAll" type="button">i</button>
                                                                </div>
                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Codivium Points (30D)</div>
                                                                    <div className="kpiValue sm" id="codiviumPoints30">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="codiviumPoints30" type="button">i</button>
                                                                </div>

                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Efficiency (pts/hr)</div>
                                                                    <div className="kpiValue sm" id="efficiencyPtsPerHr">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="efficiencyPtsPerHr" type="button">i</button>
                                                                </div>

                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Overall Breadth (B)</div>
                                                                    <div className="kpiValue sm" id="breadthScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="breadthScore" type="button">i</button>
                                                                </div>
                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Overall Depth (D)</div>
                                                                    <div className="kpiValue sm" id="depthOverallScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="depthOverallScore" type="button">i</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="scoresTabPanel" id="scoresTabBreakdown" role="tabpanel" aria-labelledby="scoresTabBtnBreakdown" hidden>
                                                            <div className="scoresGrid scoresGridBreakdown">
                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Micro Breadth</div>
                                                                    <div className="kpiValue sm" id="microBreadthScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="microBreadthScore" type="button">i</button>
                                                                </div>
                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Interview Breadth</div>
                                                                    <div className="kpiValue sm" id="interviewBreadthScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="interviewBreadthScore" type="button">i</button>
                                                                </div>

                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">MCQ Breadth</div>
                                                                    <div className="kpiValue sm" id="mcqBreadthScore">—</div>
                                                                    <div className="kpiSub">Weighted MCQ <span className="kpiInlineValue" id="weightedMcqScore">—</span></div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="mcqBreadthScore" type="button">i</button>
                                                                </div>

                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Micro Depth</div>
                                                                    <div className="kpiValue sm" id="microDepthScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="microDepthScore" type="button">i</button>
                                                                </div>
                                                                <div className="scoreChip">
                                                                    <div className="kpiTitle">Interview Depth</div>
                                                                    <div className="kpiValue sm" id="interviewDepthScore">—</div>
                                                                    <button aria-label="Info" className="infoBtn chipInfo" data-info-key="interviewDepthScore" type="button">i</button>
                                                                </div>
                                                            </div>

                                                            <div className="compactMiniKpis">
                                                                <div className="mini">
                                                                    <div className="kpiTitle">First-try pass</div>
                                                                    <div className="kpiValue sm" id="firstTryPassRate">—</div>
                                                                    <button aria-label="Info" className="infoBtn miniInfo" data-info-key="firstTryPassRate" type="button">i</button>
                                                                </div>
                                                                <div className="mini">
                                                                    <div className="kpiTitle">Avg attempts</div>
                                                                    <div className="kpiValue sm" id="avgAttemptsToAC">—</div>
                                                                    <button aria-label="Info" className="infoBtn miniInfo" data-info-key="avgAttemptsToAC" type="button">i</button>
                                                                </div>
                                                                <div className="mini">
                                                                    <div className="kpiTitle">Median time</div>
                                                                    <div className="kpiValue sm" id="medianTimeToAC">—</div>
                                                                    <button aria-label="Info" className="infoBtn miniInfo" data-info-key="medianTimeToAC" type="button">i</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="isHidden">
                                                        <span id="depthAvg">—</span>
                                                    </div>
                                                </div>

                                            </div>
                                            <div className="card panel depthPanel">
                                                <div className="shellHead">
                                                    <div>
                                                        <p className="title">Depth score by category</p>
                                                        <p className="desc">Normalized focus by category.</p>
                                                    </div>
                                                    <button aria-label="Info" className="infoBtn" data-info-key="panel_depth" type="button">i</button>
                                                </div>
                                                <div className="canvasWrap depth">
                                                    <canvas id="depthChart" role="img" aria-label="Depth by category bar chart"></canvas>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card panel heatmapPanel">
                                            <div className="shellHead">
                                                <div>
                                                    <p className="title">Convergence heatmap</p>
                                                    <p className="desc">Average unit test pass% by attempt number (1 → 5).</p>
                                                </div>
                                                <button aria-label="Info" className="infoBtn" data-info-key="panel_heatmap" type="button">i</button>
                                            </div>
                                            <div className="heatmapWrap">
                                                <div className="heatmapHead">
                                                    <div className="hCell hLabel"></div>
                                                    <div className="hCell">A1</div>
                                                    <div className="hCell">A2</div>
                                                    <div className="hCell">A3</div>
                                                    <div className="hCell">A4</div>
                                                    <div className="hCell">A5</div>
                                                </div>
                                                <div className="heatmapBody" id="convergenceHeatmap"></div>
                                            </div>
                                        </div>
                                        <div className="colRight">
                                            <div className="card panel timePanel">
                                                <div className="shellHead">
                                                    <div>
                                                        <p className="title">Time on platform</p>
                                                        <p className="desc">Switch range and aggregation to see trend + cadence.</p>
                                                    </div>
                                                    <button aria-label="Info" className="infoBtn" data-info-key="panel_time" type="button">i</button>
                                                </div>
                                                <div className="timeKpis">
                                                    <div className="pill" id="timeThisWeek">This week: —</div>
                                                    <div className="pill" id="timeLast7Avg">Avg/day (7d): —</div>
                                                    <div className="pill" id="timeDays7">Days practiced (7d): —</div>
                                                </div>
                                                <div className="timeControls">
                                                    <div aria-label="Range" className="segmented" role="tablist">
                                                        <button className="segBtn isActive" data-time-range="7d" type="button">7D</button>
                                                        <button className="segBtn" data-time-range="30d" type="button">30D</button>
                                                        <button className="segBtn" data-time-range="90d" type="button">90D</button>
                                                        <button className="segBtn" data-time-range="ytd" type="button">YTD</button>
                                                    </div>
                                                    <div aria-label="Aggregation" className="segmented" role="tablist">
                                                        <button className="segBtn isActive" data-time-gran="daily" type="button">Daily</button>
                                                        <button className="segBtn" data-time-gran="weekly" type="button">Weekly</button>
                                                    </div>
                                                </div>
                                                <div className="pillRow">
                                                    <div className="pill" id="timePlatformBadge">Total shown: —</div>
                                                </div>
                                                <div className="canvasWrap platform">
                                                    <canvas id="timePlatformChart" role="img" aria-label="Time on platform chart"></canvas>
                                                </div>
                                            </div>
                                            <div className="card panel donutPanel">
                                                <div className="shellHead">
                                                    <div>
                                                        <p className="title">Exercise time by category</p>
                                                        <p className="desc">Time allocation across core topics.</p>
                                                    </div>
                                                    <button aria-label="Info" className="infoBtn" data-info-key="panel_exercise" type="button">i</button>
                                                </div>
                                                <div className="allocControlsRow">
                                                    <div className="pill" id="exerciseTotalBadge">Total —</div>
                                                    <div aria-label="Allocation mode" className="segmented allocMode" role="tablist">
                                                        <button className="segBtn isActive" data-alloc-mode="minutes" type="button">Minutes</button>
                                                        <button className="segBtn" data-alloc-mode="share" type="button">Share</button>
                                                    </div>
                                                    <button className="segBtn allocResetBtn" id="allocResetBtn" type="button">ALL</button>
                                                </div>
                                                <div className="plot allocPlot">
                                                    <canvas id="exerciseAllocChart" role="img" aria-label="Allocation by category doughnut chart"></canvas>
                                                </div>
                                                <div className="allocFooter" id="allocFooter">
                                                    <div className="allocFooterHint" id="allocFooterHint">Click a bar to focus a category.</div>
                                                    <div className="categoryDetail isHidden" id="categoryDetail">
                                                        <div className="categoryDetailRow">
                                                            <div className="categoryDetailLabel">Total time</div>
                                                            <div className="categoryDetailValue" id="categoryDetailTime">—</div>
                                                        </div>
                                                        <div className="categoryDetailRow">
                                                            <div className="categoryDetailLabel">Share of total</div>
                                                            <div className="categoryDetailValue" id="categoryDetailShare">—</div>
                                                        </div>
                                                        <div className="categoryDetailRow">
                                                            <div className="categoryDetailLabel">Exercises completed</div>
                                                            <div className="categoryDetailValue" id="categoryDetailSolved">—</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div><div className="card panel mcqPanel">
                                            <div className="shellHead">
                                                <div>
                                                    <p className="title">MCQ performance</p>
                                                    <p className="desc">Three difficulty views (category on x-axis).</p>
                                                </div>
                                                <button aria-label="Info" className="infoBtn" data-info-key="panel_mcq" type="button">i</button>
                                            </div>
                                            <div className="mcqOverallRow">
                                                <div className="mcqOverallBarOuter">
                                                    <div className="mcqOverallBarInner" id="mcqOverallFill"></div>
                                                    <div className="mcqOverallBarText" id="mcqOverallPct">—</div>
                                                </div>
                                                <div className="mcqOverallMeta" id="mcqOverallMeta">—</div>
                                            </div>
                                            <div className="mcqGrid">
                                                <div className="mcqCard">
                                                    <div className="mcqTitle">Basic</div>
                                                    <button aria-label="Info" className="infoBtn mcqInfo" data-info-key="mcqEasy" type="button">i</button>
                                                    <div className="canvasWrap mcq">
                                                        <canvas id="mcqEasyChart" role="img" aria-label="MCQ breadth chart: easy"></canvas>
                                                    </div>
                                                </div>
                                                <div className="mcqCard">
                                                    <div className="mcqTitle">Intermediate</div>
                                                    <button aria-label="Info" className="infoBtn mcqInfo" data-info-key="mcqMedium" type="button">i</button>
                                                    <div className="canvasWrap mcq">
                                                        <canvas id="mcqMediumChart" role="img" aria-label="MCQ breadth chart: medium"></canvas>
                                                    </div>
                                                </div>
                                                <div className="mcqCard">
                                                    <div className="mcqTitle">Advanced</div>
                                                    <button aria-label="Info" className="infoBtn mcqInfo" data-info-key="mcqHard" type="button">i</button>
                                                    <div className="canvasWrap mcq">
                                                        <canvas id="mcqHardChart" role="img" aria-label="MCQ breadth chart: hard"></canvas>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div></section>
                                <aside aria-live="polite" className="infoPane card" id="infoPane">
                                    <div className="infoPaneHead">
                                        <div className="infoPaneTitle" id="infoPaneTitle">Analysis</div>
                                        <div className="infoPaneSub" id="infoPaneSub"></div>
                                        <button
                                            aria-label="Close analysis pane"
                                            className="infoPaneCloseBtn"
                                            id="infoPaneCloseBtn"
                                            title="Collapse analysis pane"
                                            type="button"
                                        >&#x2715;</button>
                                    </div>
                                    <div className="infoPaneScroll" id="infoPaneScroll">
                                        <div className="infoPaneHint" id="infoPaneHint">
                                            For any term you do not understand, refer to the <a href="#" className="dashHelpLink inline" id="openFaqLinkInPane">Dashboard FAQ</a> or the <a href="#" className="dashHelpLink inline" id="openGlossaryLinkInPane">Glossary of Terms</a>.
                                        </div>

                                        <div className="infoPaneWelcome" id="infoPaneWelcome"></div>

                                        <div className="infoPaneBody" id="infoPaneBody"></div>

                                        <div className="infoAgg" id="infoAgg">
                                            <button className="infoAggBtn" id="infoAggBtn" type="button" aria-expanded="false">
                                                Aggregation details
                                            </button>
                                            <div className="infoAggBody isHidden" id="infoAggBody"></div>
                                        </div>

                                        <div className="infoPaneInterp">
                                            <div className="infoPaneInterpTitle">Analysis of your results</div>
                                            <div className="infoPaneInterpBody" id="infoPaneInterp"></div>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default CodiviumInsightsEmbedded;
