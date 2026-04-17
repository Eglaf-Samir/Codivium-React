// src/insights/components/GlossaryModal.jsx
import React from 'react';

export default function GlossaryModal({ open, onClose }) {
  if (!open) return null;
  return <div dangerouslySetInnerHTML={{__html: GLOSSARY_HTML}} />;
}

const GLOSSARY_HTML = `<div aria-labelledby="cvGlossaryTitle" aria-modal="true" class="cvHelpModal" id="cvGlossaryModal" role="dialog">
<div class="cvHelpWindow cvHelpDoc" tabindex="-1">
<button aria-label="Close Glossary" class="cvHelpCloseBtn" data-close-modal="cvGlossaryModal" type="button">Close</button>
<div class="wrap">
<header>
<h1 id="cvGlossaryTitle">Glossary of Terms</h1>
<p class="sub">Definitions for the terms, labels, and acronyms used across the dashboard and analysis pane.</p>
</header>
<section aria-label="Glossary grouped" class="faq-groups">
<!-- Group A: Acronyms -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Badge -->
<svg viewBox="0 0 24 24">
<path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.2L5.5 20l2-7L2 9h7z"></path>
</svg>
</div>
<div class="group-title">
<strong>Acronyms &amp; symbols</strong>
<span>Short forms used in charts and explanations</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">AC</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>AC</strong> means <strong>Accepted</strong>: your final submission passed all unit tests for that session. Many metrics only count accepted solves because they are verified.</p></div></div></details>
<details><summary><div class="q">MCQ</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>MCQ</strong> means multiple-choice question. MCQs are used as diagnostics to test understanding and reveal misconceptions.</p></div></div></details>
<details><summary><div class="q">AUC</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>AUC</strong> means area under the curve. Here it refers to the area under your unit-test pass-rate curve over time within a session, normalized by total time.</p></div></div></details>
<details><summary><div class="q">MAD</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>MAD</strong> means median absolute deviation: the median of |value − median(value)|. It is a robust measure of spread that is less sensitive to extreme values than standard deviation.</p></div></div></details>
<details><summary><div class="q">σ (sigma)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>σ</strong> is a “spread” measure. In depth outliers we use a <em>robust sigma</em> computed from MAD: robust_sigma = 1.4826 × MAD.</p></div></div></details>
<details><summary><div class="q">n</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>n</strong> is an evidence count. In the heatmap it means “number of coding sessions in a cell”. In MCQ bars it means “number of questions behind a bar”. Larger n = more reliable averages.</p></div></div></details>
<details><summary><div class="q">7D / 30D / 90D / YTD</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>Time windows for the Time on platform chart: last 7/30/90 days, or year-to-date (Jan 1 to today).</p></div></div></details>
<details><summary><div class="q">A1, A2, A3, A4, A5</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Heatmap attempt buckets for attempt number. A1 means attempt 1, …, A5 means attempt 5.
If a session has more than 5 attempts, it is treated as A6 internally (6+) for scoring factors, but the dashboard heatmap displays A1–A5.
</p></div></div></details>
</div>
</details>

<!-- Group A2: Formula symbols -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Formula -->
<svg viewBox="0 0 24 24">
<path d="M18 4H8l7 8-7 8h10"></path>
<path d="M3 7h5"></path>
<path d="M3 17h5"></path>
</svg>
</div>
<div class="group-title">
<strong>Symbols used in formulae</strong>
<span>Variables and constants used in the scoring specification</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">a, c, e</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Symbols used as indices in the formulas:
</p><ul>
<li><strong>a</strong> = track (micro / interview / mcq)</li>
<li><strong>c</strong> = category within a track (e.g., Arrays, Graphs)</li>
<li><strong>e</strong> = an event (a coding session result or an MCQ quiz result)</li>
</ul></div></div></details>

<details><summary><div class="q">B, B<sub>micro</sub>, B<sub>interview</sub>, B<sub>mcq</sub></div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>B</strong> is overall breadth (0–100). Track breadths are also 0–100:
</p>
<p>$$B = 0.4\\,B_{micro}+0.4\\,B_{interview}+0.2\\,B_{mcq}.$$</p>
<p>The weights are fixed defaults (configurable) and do not require category pooling across tracks.</p>
</div></div></details>

<details><summary><div class="q">D, D<sub>micro</sub>, D<sub>interview</sub>, D<sub>a,c</sub></div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>D</strong> is overall mastery depth (0–100). In v1, depth is coding-only:
</p>
<p>$$D = 0.5\\,D_{micro}+0.5\\,D_{interview}.$$</p>
<p>Per-category depth within a coding track is:
$$D_{a,c}=100\\left(1-e^{-E_{a,c}/\\lambda}\\right),\\;\\lambda=12.$$
</p>
</div></div></details>

<details><summary><div class="q">E<sub>a,c</sub>, contrib(e)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>E<sub>a,c</sub></strong> is evidence for track <em>a</em> and category <em>c</em>:
</p>
<p>$$E_{a,c}=\\sum_{e\\in(a,c)} \\text{contrib}(e).$$</p>
<p>For coding tracks: $$\\text{contrib}_{code}(e)=w_a\\,o(e)\\,f_d(e)\\,\\text{decay}(e).$$</p>
<p>For MCQ: $$\\text{contrib}_{mcq}(e)=\\left(\\frac{p(e)}{100}\\right)^{\\gamma} f_d(e)\\,\\text{decay}(e),\\;\\gamma=1.5.$$</p>
</div></div></details>

<details><summary><div class="q">τ<sub>E</sub> (tau)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The evidence activation threshold for counting a category as “covered” in breadth:
</p>
<p>$$E_{a,c}\\ge \\tau_E,\\;\\tau_E=1.5.$$</p>
</div></div></details>

<details><summary><div class="q">f<sub>d</sub> (difficulty factor)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
A numeric multiplier derived from Codivium difficulty:
</p>
<ul>
<li>Basic: 1.0</li>
<li>Intermediate: 1.3</li>
<li>Advanced: 1.6</li>
</ul>
</div></div></details>

<details><summary><div class="q">decay(e), H, Δ</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Recency weighting applied to both coding evidence and MCQ breadth:
</p>
<p>$$\\text{decay}(e)=0.5^{\\Delta/H}$$ where \\(\\Delta\\) is days since the event and the half-life is \\(H=15\\) days.</p>
</div></div></details>

<details><summary><div class="q">w<sub>a</sub>, o(e)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
For coding evidence:
</p>
<ul>
<li><strong>w<sub>a</sub></strong> = activity weight by track (defaults: micro=1.0, interview=1.0)</li>
<li><strong>o(e)</strong> = quality term: $$o(e)=q_{tries}(e)\\,q_{conv}(e)\\,q_{time}(e)$$</li>
</ul>
</div></div></details>

<details><summary><div class="q">q<sub>tries</sub>, q<sub>conv</sub>, q<sub>time</sub>, T<sub>d</sub></div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Coding quality factors:
</p>
<ul>
<li>$$q_{tries}=\\mathrm{clamp}(1/\\sqrt{attempts},\\,0.45,\\,1.0)$$</li>
<li>$$q_{conv}$$ uses attempt-bucket weights A1..A6: [1.0, 0.92, 0.85, 0.78, 0.70, 0.60]</li>
<li>$$q_{time}=\\mathrm{clamp}(e^{-t/T_d},\\,0.6,\\,1.0)$$ with \\(T_d\\) by difficulty (Basic 90m, Intermediate 120m, Advanced 160m)</li>
</ul>
</div></div></details>

<details><summary><div class="q">λ (lambda)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Depth saturation constant (default \\(\\lambda=12\\)) in:
$$D_{a,c}=100(1-e^{-E_{a,c}/\\lambda}).$$
</p></div></div></details>

<details><summary><div class="q">P<sub>0</sub>, P<sub>redo</sub>, P<sub>mcq</sub>, U<sub>all</sub>, G</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Constants used for Codivium Points:
</p>
<ul>
<li><strong>P<sub>0</sub>=4.0</strong> (base coding points)</li>
<li><strong>P<sub>redo</sub>=2.5</strong> (redo multiplier)</li>
<li><strong>P<sub>mcq</sub>=0.8</strong> and <strong>U<sub>all</sub></strong> = UniqueCorrectMcqAllTime for MCQ padding: $$P_{mcq}\\sqrt{U_{all}}$$</li>
<li><strong>G=7 days</strong> minimum spacing between counted redos</li>
</ul>
</div></div></details>

<details><summary><div class="q">ε (epsilon)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
A small stabilizer in the Efficiency denominator (default \\(\\epsilon=1\\) minute) to avoid division by 0 when time is extremely small.</p>
</div></div></details>
</div>
</details>

<!-- Group B: Core structure -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Layout -->
<svg viewBox="0 0 24 24">
<rect height="16" rx="2" width="18" x="3" y="4"></rect>
<path d="M8 4v16"></path>
<path d="M3 9h18"></path>
</svg>
</div>
<div class="group-title">
<strong>Dashboard structure</strong>
<span>How the page is organized</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">Panel</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A card section on the dashboard (for example: Scores, Depth by category, Convergence heatmap).</p></div></div></details>
<details><summary><div class="q">Analysis pane</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>The right-hand explanation window. Clicking an “i” icon fills this pane with meaning, limits, and recommended actions.</p></div></div></details>
<details><summary><div class="q">Category</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A topic bucket such as Arrays, Strings, Trees, Graphs. Many metrics are computed per category.</p></div></div></details>
<details><summary><div class="q">Track</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A practice mode: Micro challenges, Interview prep, or MCQ practice. Each track can have its own category availability.</p></div></div></details>
<details><summary><div class="q">Current catalog / availability</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>The set of categories currently marked as available for a given track. Breadth/depth use this to avoid counting removed/legacy categories.</p></div></div></details>
</div>
</details>
<!-- Group C: Breadth -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Expand -->
<svg viewBox="0 0 24 24">
<path d="M4 10V4h6"></path>
<path d="M20 14v6h-6"></path>
<path d="M4 4l7 7"></path>
<path d="M20 20l-7-7"></path>
</svg>
</div>
<div class="group-title">
<strong>Breadth &amp; coverage</strong>
<span>What counts as covered and what doesn’t</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">Breadth / Coverage</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>Breadth / Coverage</strong> measures how widely you’ve built meaningful evidence across the currently available category catalog for a track.
A category counts as covered when its evidence passes the activation threshold:
$$E_{a,c}\\ge\\tau_E\\quad(\\text{default }\\tau_E=1.5).$$
Breadth blends coverage, balance (entropy), and a confidence stabilizer (see FAQ / KaTeX spec).
</p></div></div></details>
<details><summary><div class="q">Evidence (E)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>Evidence</strong> is the dashboard’s internal “amount of verified practice” in a category. Evidence is accumulated per track <em>a</em> and category <em>c</em>:
$$E_{a,c}=\\sum_{e\\in(a,c)} \\text{contrib}(e).$$

For <strong>coding tracks</strong> (micro + interview), each <em>accepted</em> session contributes:
$$\\text{contrib}_{code}(e)=w_a\\,o(e)\\,f_d(e)\\,\\text{decay}(e),$$
where \\(o(e)=q_{tries}(e)\\,q_{conv}(e)\\,q_{time}(e)\\) is a quality term, \\(f_d\\) is the difficulty factor, and \\(\\text{decay}(e)\\) is the recency weight.

For <strong>MCQ</strong>, each quiz result contributes:
$$\\text{contrib}_{mcq}(e)=\\left(\\frac{p(e)}{100}\\right)^{\\gamma}\\,f_d(e)\\,\\text{decay}(e),\\quad \\gamma=1.5,$$
where \\(p(e)\\) is the quiz percentage mark (0–100). MCQ quizzes have a single difficulty level.

If there are no events, evidence is defined as 0.
</p></div></div></details>
<details><summary><div class="q">Touched</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
A category that has <strong>meaningful evidence</strong> (meets the activation threshold): \\(E_{a,c}\\ge\\tau_E\\) (default \\(\\tau_E=1.5\\)).
</p></div></div></details>
<details><summary><div class="q">Untouched</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
A category that is currently available but has <strong>no meaningful evidence</strong> yet (\\(E_{a,c}&lt;\\tau_E\\)).
In charts this commonly appears as depth = 0.
</p></div></div></details>
<details><summary><div class="q">Denominator / available categories</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>The “available” count is the current catalog size for that track (or a union of tracks for overall breadth). Breadth is covered / available.</p></div></div></details>
</div>
</details>
<!-- Group D: Depth -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Layers -->
<svg viewBox="0 0 24 24">
<path d="M12 2l9 5-9 5-9-5 9-5z"></path>
<path d="M3 12l9 5 9-5"></path>
<path d="M3 17l9 5 9-5"></path>
</svg>
</div>
<div class="group-title">
<strong>Depth, bands, and outliers</strong>
<span>How depth grows and how to interpret the shape of your profile</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">Depth</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>Depth</strong> is a 0–100 measure of verified <strong>coding</strong> evidence within a category.
For a coding track \\(a\\in\\{\\text{micro},\\text{interview}\\}\\):
$$D_{a,c}=100\\left(1-e^{-E_{a,c}/\\lambda}\\right)\\quad\\text{(default }\\lambda=12).$$
MCQ does not contribute to mastery depth in v1.
</p></div></div></details>
<details><summary><div class="q">Emerging / Building / Focus</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>Relative bands based on your own depth distribution: Emerging ≥ p20, Building ≥ p50, Focus ≥ p80. Untouched means depth = 0.</p></div></div></details>
<details><summary><div class="q">Concentration</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>How much of your total depth sits in your top categories (top-1 share and top-3 share). High concentration can be good for specialization, but may hide gaps.</p></div></div></details>
<details><summary><div class="q">Outliers</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>Categories unusually high or low compared to your baseline depth. Detected robustly using median + MAD, and only shown when there is enough evidence.</p></div></div></details>
<details>
<summary>
<div class="q">p (percentile) and p20 / p50 / p80</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer">
<div class="a">
<p>
<strong>p</strong> stands for <strong>percentile</strong>. Percentiles rank values from low to high.
                  For example, <strong>p20</strong> means “20th percentile” — about 20% of your category depths are below this value, and about 80% are above it.
                </p>
<p>
                  Codivium uses percentiles to create bands that adapt to your own baseline, rather than using fixed thresholds that may not fit different learning stages.
                </p>
</div>
</div>
</details>
<details>
<summary>
<div class="q">Confidence</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer">
<div class="a">
<p>
<strong>Confidence</strong> is a plain-English indicator of how much you should trust a dashboard insight.
                  It is not a probability and it is not “AI certainty”.
                </p>
<p>
                  Confidence is mainly driven by <strong>evidence</strong> (how many accepted solves / attempts you have in the relevant categories and time window).
                  More evidence → signals are more stable; very little evidence → signals can swing due to randomness.
                </p>
</div>
</div>
</details>
<details>
<summary>
<div class="q">Guards</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer">
<div class="a">
<p>
<strong>Guards</strong> are safety rules that stop the dashboard from making strong claims when the data is too weak or too noisy.
                  They exist to reduce “false alarms”.
                </p>
<p>
                  Examples of guards include: requiring a minimum number of solved sessions before calling something an outlier,
                  ignoring extremely tiny differences, and suppressing an insight if there are too few categories to compare.
                </p>
</div>
</div>
</details>
<details><summary><div class="q">Robust z-score</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A standardized distance from baseline using robust sigma: robust_z = (depth − median) / robust_sigma. Used to rank outliers safely.</p></div></div></details>
<details><summary><div class="q">Percentile (p20, p50, p80)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A percentile describes position in a sorted list. p50 is the median. p80 means 80% of values are at or below that number.</p></div></div></details>
</div>
</details>
<!-- Group E: Scoring components -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Heatmap -->
<svg viewBox="0 0 24 24">
<path d="M4 4h7v7H4z"></path>
<path d="M13 4h7v7h-7z"></path>
<path d="M4 13h7v7H4z"></path>
<path d="M13 13h7v7h-7z"></path>
</svg>
</div>
<div class="group-title">
<strong>Heatmap &amp; convergence</strong>
<span>How the convergence heatmap is computed and interpreted</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">

<details><summary><div class="q">Convergence heatmap</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The <strong>convergence heatmap</strong> is the grid that shows how your unit-test pass% evolves across attempts for each category.
Rows are categories; columns are attempt buckets (A1..A5). Each tile color represents the average pass% in that bucket, and <strong>n</strong> shows how much evidence supports that value.
</p></div></div></details>

<details><summary><div class="q">Attempt bucket (A1..A5)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>An <strong>attempt bucket</strong> groups coding sessions by <strong>attempt number</strong>. <strong>A1</strong> is the first attempt, <strong>A2</strong> is the second attempt, and so on. In this dashboard, <strong>A5</strong> means the <strong>5th-attempt bucket</strong> (it does not mean “5 or more”).</p></div></div></details>
<details><summary><div class="q">Heatmap cell</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A <strong>heatmap cell</strong> is one square in the grid: a specific <strong>category</strong> (row) and a specific <strong>attempt bucket</strong> (column). The cell value is the <strong>average unit-test pass%</strong> for that bucket.</p></div></div></details>
<details><summary><div class="q">Evidence per cell (n)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>n</strong> is the number of coding sessions that contribute to a heatmap cell. Higher <strong>n</strong> means the average is more reliable. The dashboard uses <strong>guards</strong> (minimum n) before it calls something “fast” or “stalled”.</p></div></div></details>
<details><summary><div class="q">Mostly-passing threshold</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>The <strong>mostly-passing threshold</strong> is the unit-test pass% used to say “this attempt is mostly working.” The default threshold is <strong>85%</strong> unit tests passed.</p></div></div></details>
<details><summary><div class="q">Convergence</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>Convergence</strong> means your unit-test pass% rises across attempts (A1→A5) as you debug and refine your solution. Faster convergence usually means better planning and more efficient debugging.</p></div></div></details>
<details><summary><div class="q">Weighted average (by counts)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>When the dashboard averages heatmap values across categories, it uses a <strong>weighted average</strong>: categories with more evidence (larger <strong>n</strong>) contribute more to the overall mean. This reduces noise from tiny samples.</p></div></div></details>
<details><summary><div class="q">Stall / stagnation</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A <strong>stall</strong> (or stagnation) means your pass% stops improving late in the attempt sequence. The default rule is: <strong>small gain from A3→A5</strong> while still below the mostly-passing threshold.</p></div></div></details>
</div>
</details>
<!-- Group F: Time & allocation -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Clock -->
<svg viewBox="0 0 24 24">
<circle cx="12" cy="12" r="9"></circle>
<path d="M12 7v6l4 2"></path>
</svg>
</div>
<div class="group-title">
<strong>Time &amp; allocation</strong>
<span>Cadence, trends, and how time is distributed across categories</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">Time on platform</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A time-series of minutes across your Codivium activity that reports time into the dashboard. Right now it includes coding + MCQ minutes; tutorials and mini-projects will be added once tracked.</p></div></div></details>
<details><summary><div class="q">Active day / active week</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>An <strong>active day</strong> (or week) is a day/week with more than 0 minutes. Active counts are used as a consistency signal.</p></div></div></details>
<details><summary><div class="q">Streak</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A <strong>streak</strong> is a run of consecutive active days (Daily view) or active weeks (Weekly view). The dashboard may show your current streak and your longest streak in the selected window.</p></div></div></details>
<details><summary><div class="q">Trend (recent vs previous window)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A <strong>trend</strong> compares a recent window to the previous window of the same size (for example, last 30 days vs the 30 days before that). The dashboard only reports trends when there is enough evidence.</p></div></div></details>
<details><summary><div class="q">Spike / spiky time</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A <strong>spike</strong> means one day/week contributes a large share of the total minutes. Spikes are not “bad”, but steady practice is usually better for retention.</p></div></div></details>
<details><summary><div class="q">Granularity (Daily vs Weekly)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p><strong>Granularity</strong> means the unit shown on the chart. <strong>Daily</strong> uses one point per day. <strong>Weekly</strong> groups days into Monday-start weeks, which smooths noise.</p></div></div></details>

<details><summary><div class="q">Allocation / Exercise time by category</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
<strong>Allocation</strong> means how your <strong>coding minutes</strong> are distributed across categories.
Minutes include active practice time (whether or not you finished). The <strong>Solved</strong> count is shown as an additional context signal.
</p>
<p>
<strong>Solved</strong> (a.k.a. Exercises completed) means: an exercise where you submitted at least once and the unit tests reached <strong>100% pass</strong> (Accepted).
<strong>Time window:</strong> Solved counts are currently <strong>all-time</strong>.
</p></div></div></details>


<details><summary><div class="q">Exercises completed / Solved</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
In Allocation, <strong>Solved</strong> counts any exercise where a submission reached <strong>100% unit-test pass</strong> (Accepted). This count is currently reported <strong>all-time</strong>.
</p></div></div></details>

<details><summary><div class="q">Share</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>The percent of total time contributed by a category: share = categoryMinutes / totalMinutes × 100.</p></div></div></details>
<details><summary><div class="q">Minutes per accepted solve</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>A rough efficiency signal: total minutes in a category divided by the number of accepted solves. Because minutes include unsolved time, interpret this only when there are several solves.</p></div></div></details>
</div>
</details>
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Sigma-ish -->
<svg viewBox="0 0 24 24">
<path d="M18 4H8l7 8-7 8h10"></path>
</svg>
</div>
<div class="group-title">
<strong>Score components</strong>
<span>What each score label means</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details><summary><div class="q">Codivium Score</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The headline mastery score (0–100), computed as the harmonic mean of overall breadth \\(B\\) and overall depth \\(D\\):
$$\\text{CodiviumScore}=\\frac{2BD}{B+D}.$$
It cannot be inflated by breadth alone or depth alone.
</p></div></div></details>
<details><summary><div class="q">Coding score</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Not a separate additive “component” in the current methodology.
In v1, mastery depth \\(D\\) is computed from <strong>coding evidence</strong> in Micro + Interview tracks and then combined:
$$D=0.5D_{\\text{micro}}+0.5D_{\\text{interview}}.$$
</p></div></div></details>
<details><summary><div class="q">MCQ score</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
In the current methodology, MCQ contributes via <strong>MCQ breadth</strong> (coverage/balance/confidence from quiz results) and via <strong>MCQ points padding</strong> in Codivium Points.
For accuracy on MCQs, use <strong>Weighted MCQ Score</strong> (0–100).
</p></div></div></details>
<details><summary><div class="q">Heatmap score</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The convergence heatmap is a diagnostic visualization.
Scoring uses convergence indirectly via the coding evidence quality factor \\(q_{\\text{conv}}(e)\\), which penalizes slow convergence (many attempts).
</p></div></div></details>
<details><summary><div class="q">Improvement bonus</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The current methodology does not add a separate “bonus” term into Codivium Score.
Improvement is reflected by <strong>recency‑weighted evidence</strong> and may be summarized with optional delta metrics (e.g., \\(\\Delta\\)Score\\(_{7d}\\)).
</p></div></div></details>
<details><summary><div class="q">Time bonus</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The current methodology does not add a separate “bonus” term into Codivium Score.
Time is captured in the <strong>Time on platform</strong> chart and in <strong>Efficiency (pts/hr)</strong>, where time is explicitly in the denominator.
</p></div></div></details>
<details><summary><div class="q">Weighted MCQ Score</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
A 0–100 diagnostic of MCQ quiz performance using difficulty and recency weights:
$$\\text{WeightedMCQ}=\\frac{\\sum_e \\left(p(e)\\cdot f_{d(e)}\\cdot \\text{decay}(e)\\right)}{\\sum_e \\left(f_{d(e)}\\cdot \\text{decay}(e)\\right)}.$$
</p></div></div></details>
<details><summary><div class="q">MCQ evidence (attempts / questions)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
“Evidence” tells you how much data produced an average.
Attempts = number of quizzes; questions = total MCQ questions behind that bar. Higher evidence makes the bar more reliable.
</p></div></div></details>
<details><summary><div class="q">Difficulty cliff</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
A large performance drop from Basic → Advanced within the same topic (with enough evidence).
It often indicates missing edge cases or deeper reasoning despite surface familiarity.
</p></div></div></details>
<details><summary><div class="q">Codivium Points (all‑time)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Uncapped progression signal:
$$\\text{Points}_{\\text{all}}=\\text{CodingPoints}_{\\text{all}}+\\text{RedoPoints}_{\\text{all}}+P_{\\text{mcq}}\\sqrt{U_{\\text{all}}}.$$
Defaults: \\(P_0=4.0\\), \\(P_{\\text{redo}}=2.5\\), \\(P_{\\text{mcq}}=0.8\\), redo spacing \\(G=7\\) days.
</p></div></div></details><details><summary><div class="q">Codivium Points (last 30 days)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Uncapped momentum signal:
$$\\text{Points}_{30}=\\text{CodingPoints}_{30}+\\text{RedoPoints}_{30}.$$
This is designed to move faster than Codivium Score.
</p></div></div></details><details><summary><div class="q">Efficiency (pts/hr)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Rate of producing verified outcomes:
$$ \\text{Efficiency}=\\frac{\\sum_i w_i q_i}{\\epsilon+\\sum_i w_i t_i},\\quad \\text{pts/hr}=60\\cdot \\text{Efficiency}.$$
Default \\(\\epsilon=1\\) minute; weights \\(w_i=0.5^{\\Delta_i/H}\\) with half‑life \\(H=15\\) days.
</p></div></div></details><details><summary><div class="q">Overall Breadth (B)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Overall breadth is the fixed-weight blend of per-track breadths:
$$ B = 0.4\\,B_{\\text{micro}} + 0.4\\,B_{\\text{interview}} + 0.2\\,B_{\\text{mcq}}.$$
</p></div></div></details><details><summary><div class="q">Overall Depth (D)</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
Overall mastery depth (coding only in v1):
$$ D = 0.5\\,D_{\\text{micro}} + 0.5\\,D_{\\text{interview}}.$$
</p></div></div></details>

<details><summary><div class="q">First-try pass</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The percentage of accepted coding exercises that were accepted on the <strong>first submission</strong> (attempts = 1).
Higher values generally indicate stronger planning and fewer late edge-case fixes.
</p></div></div></details>
<details><summary><div class="q">Avg attempts</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The mean number of submissions required to reach acceptance (100% unit tests passing) on accepted coding exercises.
This is an execution/debugging friction signal.
</p></div></div></details>
<details><summary><div class="q">Median time</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The median minutes from starting an exercise to the first accepted submission (100% unit tests passing), across accepted coding exercises.
Unlike the mean, the median is robust to a small number of unusually long sessions.
</p></div></div></details>
<details><summary><div class="q">MCQ overall correct/total</div><div aria-hidden="true" class="chev"></div></summary><div class="answer"><div class="a"><p>
The MCQ panel’s headline bar: <strong>correct questions answered</strong> out of <strong>total questions attempted</strong>, shown as a percent.
This value is aggregated <strong>all-time</strong> across all categories and difficulty levels.
</p></div></div></details>

</div>
</details>
</section>
<div class="footer-bar">
        Codivium dashboards are designed to be precise. When in doubt: read the FAQ for formulas, then use the glossary for definitions.
      </div>
</div>
</div>
</div>`;
