// STATUS: LIVE — source file (do not deploy directly; deploy dashboard.bundle.js)
// OWNER: FAQ/Glossary modals, event delegation (all delegated click handlers),
//        boot sequence (init() entry point), KaTeX rendering
// NOT owned here: layout engine, chart rendering, public API
// GENERATED: No — authored source file

// dashboard.08.help-and-init.js — FAQ/Glossary modals, initialisation entry point.

// -----------------------------
// Help modals: Dashboard FAQ + Glossary of Terms
// -----------------------------
function setupHelpModals(){
  // Event delegation — works regardless of init call order or re-renders.
  const g = (window.__cvGlobals = window.__cvGlobals || {});
  if (g.helpModalDelegationBound) return;
  g.helpModalDelegationBound = true;

  // Open: capture phase so href='#' never fires scroll before preventDefault
  document.addEventListener('click', (e) => {
    const el = e.target.closest ? e.target.closest(
      '#openFaqLink, #openGlossaryLink, #openFaqLinkInPane, #openGlossaryLinkInPane'
    ) : null;
    if (!el) return;
    e.preventDefault();
    const id = (el.id === 'openFaqLink' || el.id === 'openFaqLinkInPane')
      ? 'cvFaqModal' : 'cvGlossaryModal';
    openHelpModal(id);
  }, true);

  // Close buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-close-modal]') : null;
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-close-modal');
    if (id) closeHelpModal(id);
  });

  // Click backdrop overlay to close
  document.addEventListener('mousedown', (e) => {
    if (!e.target.classList || !e.target.classList.contains('cvHelpModal')) return;
    closeHelpModal(e.target.id);
  });

  // Info-pane close button (replaces inline onclick — R20)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('#infoPaneCloseBtn') : null;
    if (!btn) return;
    e.preventDefault();
    try {
      if (window.CodiviumInsights && typeof window.CodiviumInsights.toggleInfoPane === 'function') {
        window.CodiviumInsights.toggleInfoPane();
      }
    } catch (_) {}
  });

  // Esc to close
  if (!g.helpEscHandler){
    g.helpEscHandler = (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.cvHelpModal:not(.isHidden)');
      if (open) closeHelpModal(open.id);
    };
    document.addEventListener('keydown', g.helpEscHandler);
  }
}



function __cvRenderKatexIn(root){
  if (!root) return;
  if (root.__cvKatexRendered) return;
  const fn = window.renderMathInElement;
  if (typeof fn !== 'function') return;
  try {
    fn(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
    root.__cvKatexRendered = true;
  } catch (e) { ciErr('ignored error', e); }
}


// Minimal HTML sanitizer for help/FAQ content.
// The FAQ answers are currently authored as trusted strings, but this prevents accidental
// XSS if those strings ever become data-driven.
function __cvSanitizeHelpHtml(html){
  try {
    const s = String(html || '');
    if (!s) return '';
    // Fast path: no tags
    if (s.indexOf('<') === -1) return s;
    const t = document.createElement('template');
    t.innerHTML = s;

    // Remove dangerous nodes
    t.content.querySelectorAll('script, style, iframe, object, embed, link[rel="import"], meta').forEach((n) => n.remove());

    // Strip inline event handlers and dangerous URL schemes
    t.content.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes || []).forEach((attr) => {
        const name = String(attr.name || '');
        const val = String(attr.value || '');
        if (/^on/i.test(name)) el.removeAttribute(name);
        if ((name === 'href' || name === 'src') && /^(javascript|data|vbscript):/i.test(val.trim())) el.removeAttribute(name);
      });
      if (el.tagName === 'A') {
        // Ensure safe external navigation behavior
        const target = String(el.getAttribute('target') || '').toLowerCase();
        if (target === '_blank') el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return t.innerHTML;
  } catch (_e) {
    return '';
  }
}


// -----------------------------
// FAQ content injection (answers + any missing metric questions)
// The FAQ HTML keeps questions as static markup; answers are injected here so the dashboard
// stays consistent with the KaTeX scoring specification and config defaults.
// -----------------------------
function __cvSetupFaqContent(){
  const faqModal = document.getElementById('cvFaqModal');
  if (!faqModal || faqModal.__cvFaqFilled) return;
  try {

  // These defaults mirror config/scoring-config.katex.v1.json.
  // Keep them here as a runtime fallback in case the config file is not accessible.
  const CFG = {
    recency: { halfLifeDays: 15 },
    difficultyFactor: { basic: 1.0, intermediate: 1.3, advanced: 1.6 },
    coding: {
      activityWeight: { micro: 1.0, interview: 1.0 },
      triesFactor: { min: 0.45, max: 1.0 },
      convergenceWeights: [1.0, 0.92, 0.85, 0.78, 0.70, 0.60], // A1..A6
      timeFactor: {
        min: 0.6,
        max: 1.0,
        TdMinutes: { basic: 90, intermediate: 120, advanced: 160 }
      }
    },
    mcq: {
      breadth: { gamma: 1.5, usesRecencyDecay: true },
      points: { Pmcq: 0.8 }
    },
    breadth: {
      tauE: 1.5,
      alpha: 0.65,
      beta: 0.35,
      confidenceK: { micro: 10, interview: 8, mcq: 14 },
      overallWeights: { micro: 0.4, interview: 0.4, mcq: 0.2 }
    },
    depth: {
      lambda: 12,
      overallWeights: { micro: 0.5, interview: 0.5 },
      chart: { lambdaChart: 12 }
    },
    points: { P0: 4.0, Predo: 2.5, redoSpacingDays: 7 },
    efficiency: { epsilonMinutes: 1.0 },
    edgeCases: { whenTotalEvidenceIsZeroReturn: 0 }
  };

  const esc = (s) => String(s || '').trim();
  const normQ = (s) => esc(s).toLowerCase().replace(/\s+/g, ' ');

  // Shared math snippets (KaTeX)
  const HALF = CFG.recency.halfLifeDays;
  const TAU = CFG.breadth.tauE;
  const ALPHA = CFG.breadth.alpha;
  const BETA = CFG.breadth.beta;
  const LAMBDA = CFG.depth.lambda;
  const GAMMA = CFG.mcq.breadth.gamma;
  const P0 = CFG.points.P0;
  const PREDO = CFG.points.Predo;
  const PMCQ = CFG.mcq.points.Pmcq;
  const EPS_MIN = CFG.efficiency.epsilonMinutes;

  const diffTableHtml = `
    <table class="cvMiniTable cvMiniTableDarkText">
      <thead><tr><th>Difficulty</th><th>Factor</th><th>Time baseline (T<sub>d</sub>)</th></tr></thead>
      <tbody>
        <tr><td>Basic</td><td>${CFG.difficultyFactor.basic.toFixed(1)}</td><td>${CFG.coding.timeFactor.TdMinutes.basic} min</td></tr>
        <tr><td>Intermediate</td><td>${CFG.difficultyFactor.intermediate.toFixed(1)}</td><td>${CFG.coding.timeFactor.TdMinutes.intermediate} min</td></tr>
        <tr><td>Advanced</td><td>${CFG.difficultyFactor.advanced.toFixed(1)}</td><td>${CFG.coding.timeFactor.TdMinutes.advanced} min</td></tr>
      </tbody>
    </table>
  `;

  const answers = new Map();

  // ---- Getting started (top-of-FAQ) ----
  answers.set(normQ("What is the dashboard and what is its purpose?"), `
    <p>The <strong>Performance Insights Dashboard</strong> is Codivium’s <strong>feedback layer</strong>. It does not replace practice — it makes practice <em>measurable</em> so you can improve faster.</p>
    <p>Codivium is built around <strong>deliberate practice</strong>: not just doing more problems, but repeatedly training the specific skills you are currently weakest at. Deliberate practice works best when you have:</p>
    <ul>
      <li><strong>A precise target</strong> (e.g., “I’m slow on DP transitions”, “I miss edge cases in graphs”).</li>
      <li><strong>Repeated reps</strong> on that target, in a time box.</li>
      <li><strong>Fast feedback</strong> on what happened (speed, accuracy, convergence, category balance).</li>
      <li><strong>Adjustment</strong> to the next practice block based on that feedback.</li>
    </ul>
    <p>The dashboard exists to provide that feedback and structure. It shows:</p>
    <ul>
      <li><strong>Mastery balance</strong> (Breadth + Depth) so you don’t over-invest in one dimension.</li>
      <li><strong>Time allocation</strong> by category so you can see what you’re actually training.</li>
      <li><strong>Convergence signals</strong> (attempt buckets / pass rates) that highlight where you’re burning time or repeatedly failing tests.</li>
      <li><strong>Trend + cadence</strong> (time on platform) to keep momentum and consistency.</li>
    </ul>
    <p>Think of it as a <strong>practice compass</strong>: it helps you choose the next best drills, measure whether they worked, and keep your training balanced over time.</p>
  `);

  answers.set(normQ("How do I use the dashboard?"), `
    <p>Use the dashboard as a <strong>weekly feedback loop</strong> that drives your deliberate practice plan. A simple, effective workflow:</p>
    <ol>
      <li><strong>Scan the headlines</strong> (Codivium Score, Points, Efficiency) to understand your current phase:
        <ul>
          <li><strong>Score</strong> rises when breadth and depth stay balanced (mastery).</li>
          <li><strong>Points</strong> rise with verified outcomes (momentum).</li>
          <li><strong>Efficiency</strong> rises when your time converts into accepts (execution quality).</li>
        </ul>
      </li>
      <li><strong>Pick 1–2 focus categories</strong> for the next practice cycle. Use <em>Exercise time by category</em> + <em>Depth</em> together:
        <ul>
          <li>If <strong>time is high</strong> but <strong>depth stays low</strong>, you likely have a bottleneck (missing prerequisite, weak pattern variants, or poor convergence).</li>
          <li>If <strong>depth is high</strong> but <strong>breadth is low</strong>, schedule a light weekly sweep of neglected categories.</li>
        </ul>
      </li>
      <li><strong>Use the Heatmap</strong> to diagnose convergence:
        <ul>
          <li>Lots of time in higher attempt buckets (A3–A5) indicates you’re losing time to mistakes, edge cases, or weak test strategy.</li>
          <li>Make the next block a deliberate drill: smaller problems, tighter timebox, and explicit post-mortems.</li>
        </ul>
      </li>
      <li><strong>Practice in short loops</strong>: choose a timebox (e.g., 45–90 minutes), run a focused session, then briefly review what failed and why.</li>
      <li><strong>Review the dashboard again</strong> after a few sessions. You’re looking for feedback signals:
        <ul>
          <li>Do attempts converge faster (more A1/A2)?</li>
          <li>Is time in the focus category producing more accepts?</li>
          <li>Is breadth staying healthy while depth improves?</li>
        </ul>
      </li>
    </ol>
    <p>In other words: <strong>Plan → Practice → Feedback → Adjust → Repeat</strong>. The dashboard is the feedback and measurement piece that makes deliberate practice efficient.</p>
  `);

  answers.set(normQ("Can I use Codivium without using the dashboard?"), `
    <p><strong>Yes.</strong> The dashboard is <strong>optional</strong>. You can use Codivium purely as a practice platform — solve exercises, run MCQs, and use the site’s services without ever opening the dashboard.</p>
    <p>What you miss by ignoring it is mainly the <strong>structured feedback</strong> layer. Deliberate practice still works without dashboards, but it becomes harder to answer questions like:</p>
    <ul>
      <li>“Which category should I train next?”</li>
      <li>“Am I getting faster at convergence or just spending more time?”</li>
      <li>“Am I neglecting whole areas while focusing on one topic?”</li>
    </ul>
    <p>If you prefer a lightweight approach, you can ignore the dashboard day-to-day and just use it occasionally (e.g., once a week) as a quick check-in. If you prefer a fully self-directed workflow, you can skip it entirely — Codivium’s core practice functionality is not dependent on the dashboard.</p>
  `);

  // ---- Existing FAQ questions (keep questions; inject answers) ----
  answers.set(normQ('What are the three headline scoring readouts?'), `
    <p>The dashboard reports three headline scoring readouts that each measure a different aspect of your progress. They are designed so you cannot inflate one by gaming another.</p>
    <ul>
      <li><strong>Codivium Score (0–100)</strong> — your master mastery score. It combines breadth (how widely you can apply skills) and depth (how reliably you apply them). Both need to be strong — a very high score in one cannot compensate for a very low score in the other. Focus on building both pillars consistently.</li>
      <li><strong>Codivium Points (uncapped)</strong> — a cumulative career-trajectory score that grows throughout your time on the platform. Points reward accepted solves, weighted by difficulty and how efficiently you reached them. Recent activity counts more than older activity. Re-doing the same exercise within 7 days adds no extra points.</li>
      <li><strong>Efficiency (pts / hr)</strong> — a rate metric: quality output per hour of active practice time. It cannot be inflated by spending more hours — only by improving the quality of your solves relative to the time spent. A declining efficiency while hours increase is a useful signal to change your approach.</li>
    </ul>
    <p>The key design principle: <strong>Codivium Score stays stable and meaningful</strong>, while Points and Efficiency provide career and momentum context. All three use recency weighting, so your scores reflect where you are now rather than where you were when you started.</p>
  `);

  answers.set(normQ('What does “Breadth / Coverage” mean?'), `
    <p><strong>Breadth</strong> is a 0–100 score measuring how widely you have engaged with the category catalog, computed separately for each track (Micro Challenges, Interview Preparation, and MCQ).</p>
    <p>Breadth rewards two things: <strong>coverage</strong> (how many categories you have meaningfully engaged with) and <strong>balance</strong> (how evenly your practice is spread across them). Concentrating all your sessions in one or two categories keeps breadth below where raw coverage alone would suggest.</p>
    <p>A small amount of activity in a category counts less than sustained engagement — a single session registers as partial coverage and grows as evidence accumulates. Categories you have never attempted do not count at all.</p>
    <p>The three track breadth scores are blended into an overall breadth score, with coding tracks weighted more heavily than MCQ.</p>
    <ul>
      <li><strong>To raise breadth:</strong> attempt new categories and distribute practice across them rather than repeating familiar ones.</li>
      <li><strong>Breadth ≠ mastery:</strong> high breadth with low depth means you have visited many areas but are not yet consistent within them.</li>
    </ul>
  `);

  
  
  answers.set(normQ('What are the breadth bands?'), `
    <p>Breadth is a continuous 0–100 score. The dashboard uses the following <strong>interpretation bands</strong> as guidance:</p>
    <ul>
      <li><strong>0–25</strong>: Narrow coverage (likely blind spots)</li>
      <li><strong>25–50</strong>: Developing coverage (some gaps remain)</li>
      <li><strong>50–75</strong>: Broad coverage (good topic sweep)</li>
      <li><strong>75–100</strong>: Comprehensive coverage (strong sweep + balance)</li>
    </ul>
    <p><em>Note:</em> these bands are interpretive. The underlying breadth calculation is evidence‑based and continuous (it does not “step” at these thresholds).</p>
  `);

  answers.set(normQ('What does “Depth” mean?'), `
    <p><strong>Depth</strong> measures how much verified coding evidence you have accumulated within categories, expressed as a 0–100 score with diminishing returns. It is computed from your Micro and Interview coding tracks only — MCQ does not contribute to depth.</p>
    <p>Depth has diminishing returns by design. The gap between “no evidence” and “some evidence” in a category is larger than the gap between “a lot” and “a little more.” This prevents grinding the same exercise from producing outsized depth scores.</p>
    <p>Depth also fades gradually when you have not practised a category recently. The fade is slow (weeks, not days) and harder categories fade more slowly than easier ones — keeping your depth score reflecting current ability rather than historical accumulation.</p>
    <ul>
      <li><strong>To raise depth:</strong> produce clean accepted solves on first or second attempts. Consistent early-attempt success is the strongest depth signal.</li>
      <li><strong>High attempt counts</strong> before accepting reduce your convergence quality, which reduces the evidence each session contributes to depth.</li>
      <li><strong>Long absence</strong> from a category gradually reduces its depth contribution — intentional, as depth should reflect current ability.</li>
    </ul>
    <p>The per-category depth chart is the most actionable view — it shows exactly where to focus to raise your Codivium Score.</p>
  `);

  
  answers.set(normQ('What are the depth bands (Emerging / Building / Focus)?'), `
    <p>The depth “bands” are <strong>relative to you</strong>. They summarize where each category sits in your own depth distribution.</p>
    <ul>
      <li><strong>Focus</strong>: categories in the top ~20% of your touched-category depths (≥ 80th percentile)</li>
      <li><strong>Building</strong>: categories around the middle (≥ 50th percentile)</li>
      <li><strong>Emerging</strong>: early depth among touched categories (≥ 20th percentile)</li>
      <li><strong>Untouched</strong>: depth = 0</li>
    </ul>
    <p>This makes the banding robust across different users and different total practice volumes.</p>
  `);

  answers.set(normQ('What is “concentration” in depth?'), `
    <p><strong>Concentration</strong> describes how much of your total depth is carried by your top-performing categories. It is shown as a quick diagnostic, not a scoring input.</p>
    <p>Some concentration is normal and healthy — if you have been in a focus cycle on a specific area, you would expect a high share of your depth to sit there. Very high concentration (most of your depth in one or two categories with little elsewhere) can hide gaps that are not visible from the overall depth score alone.</p>
    <p>Use concentration alongside the depth-by-category chart: if concentration is high, check which categories are carrying it and whether the lower-depth categories align with areas you want to improve. The adaptive recommendation engine will often surface this automatically as a weakness or re-entry recommendation.</p>
  `);

  answers.set(normQ('How are depth outliers detected (median + MAD)?'), `
    <p>Depth outliers are detected <strong>robustly</strong> so that a single extreme category doesn’t distort the baseline.</p>
    <h3>Robust baseline</h3>
    <ul>
      <li>Compute the <strong>median</strong> depth across touched categories: <code>m</code></li>
      <li>Compute <strong>MAD</strong>: median of <code>|depth − m|</code></li>
      <li>Convert to a robust sigma: <code>σ = 1.4826 × MAD</code></li>
    </ul>
    <h3>Outlier rule (dashboard default)</h3>
    <ul>
      <li>Require at least 5 touched categories (otherwise suppressed)</li>
      <li>Require an absolute gap ≥ <code>5.0</code> depth points</li>
      <li>Flag high outlier if <code>(depth − m)/σ ≥ 1.5</code>, low outlier if ≤ −1.5</li>
    </ul>
    <p>These thresholds are chosen to avoid “false alarms” when evidence is sparse or depths are nearly equal.</p>
  `);

  answers.set(normQ('What is the convergence heatmap showing?'), `
    <p>The <strong>convergence heatmap</strong> summarizes <em>solve quality</em> by category across attempt buckets.</p>
    <p>Rows are categories. Columns are attempt buckets:</p>
    <ul>
      <li><strong>A1</strong> = performance on first attempt</li>
      <li><strong>A2</strong> = second attempt, … up to <strong>A5</strong></li>
    </ul>
    <p>Each tile shows a <strong>pass‑rate style signal</strong> for that category and attempt bucket (displayed as a percentage). Higher values mean better convergence / cleaner solves in that bucket. Tiles may be empty (—) if there is not enough evidence in that bucket.</p>
  `);

  
  answers.set(normQ('What does “Time on platform” include?'), `
    <p><strong>Time on platform</strong> is the amount of time you were actively practicing on Codivium (coding sessions + MCQ quizzes), aggregated into the time window you selected (e.g., 7D, 30D, 90D, YTD).</p>
    <p>Depending on data availability, time can be derived from session timers (start/end) or from the sum of recorded attempt durations. It is used for interpretation and for <strong>Efficiency</strong> (points per hour).</p>
  `);

  answers.set(normQ('What do 7D/30D/90D/YTD and Daily/Weekly mean?'), `
    <p>These controls change the <strong>time window</strong> and the <strong>aggregation resolution</strong> used in charts:</p>
    <ul>
      <li><strong>7D / 30D / 90D</strong>: last 7 / 30 / 90 days ending today</li>
      <li><strong>YTD</strong>: from Jan 1 of the current year to today</li>
      <li><strong>Daily</strong>: each bar/point represents one day</li>
      <li><strong>Weekly</strong>: each bar/point represents one week (smoothed trends)</li>
    </ul>
    <p>Scores like breadth/depth are recency‑weighted by design (half‑life ${HALF} days). The window controls mainly affect time‑series charts and “last‑30‑days” variants of points/efficiency.</p>
  `);

  answers.set(normQ('What does “Exercise time by category” include?'), `
    <p>This chart shows how your practice time is distributed across categories (coding categories). It helps answer: <em>where did my time go?</em></p>
    <ul>
      <li>Time is grouped by category using the same canonical category keys as other charts.</li>
      <li>It includes active practice time within the selected window.</li>
      <li>Use it together with <strong>Depth by category</strong>: if a category consumes lots of time but depth stays low, it may indicate a bottleneck (difficulty cliff, missing prerequisite, or inefficient convergence).</li>
    </ul>
  `);

  answers.set(normQ('What is “Weighted MCQ Score” and what are its bands?'), `
    <p><strong>Weighted MCQ Score</strong> is a 0–100 diagnostic summary of your MCQ performance that emphasises harder quizzes and more recent results. It is shown as a supplementary metric, not a primary scoring input.</p>
    <p>The score weights each quiz session by its difficulty level and how recently it was taken — so a high score on an Advanced quiz contributes more than the same score on a Basic quiz, and a recent session counts more than one from several months ago.</p>
    <h3>Interpretation bands</h3>
    <ul>
      <li><strong>0–50 (Developing)</strong> — performance is inconsistent or concentrated at lower difficulty levels. Build consistency at Basic before advancing.</li>
      <li><strong>50–70 (Consolidating)</strong> — reasonable performance at lower difficulty; room to grow at Intermediate and Advanced.</li>
      <li><strong>70+ (Proficient)</strong> — strong consistent performance across difficulty levels. Growing coverage at Advanced is the next step.</li>
    </ul>
    <p>If Weighted MCQ Score is high but your coding Breadth or Depth scores are lower, your conceptual knowledge is ahead of your implementation skill — a useful signal to direct more time to coding exercises.</p>
  `);

  answers.set(normQ('What does “n” mean in the MCQ analysis?'), `
    <p><strong>n</strong> is the evidence count behind an MCQ statistic — typically the number of questions (or attempts) used to compute the percentage for a category/difficulty bar.</p>
    <p>Small <code>n</code> means the percentage is noisy; the dashboard may suppress callouts or confidence when evidence is too small. As a rule of thumb, treat results as stable only once <code>n</code> is comfortably above ~20 for that bar.</p>
  `);

  answers.set(normQ('What is a “difficulty cliff”?'), `
    <p>A <strong>difficulty cliff</strong> is when performance drops sharply as difficulty increases — typically when Basic performance is okay but Advanced performance is much lower in the same category.</p>
    <p>In the dashboard’s MCQ analysis, a cliff is flagged when:</p>
    <ul>
      <li>Both Basic and Advanced have enough evidence, and</li>
      <li><code>Basic% − Advanced% ≥ 25pp</code> (percentage points)</li>
    </ul>
    <p>Cliffs are useful because they often indicate missing edge‑case reasoning, fragile mental models, or gaps in prerequisite knowledge.</p>
  `);

    // Additional metric questions have been moved to docs/scoring/codivium_scoring_katex.html
  // The full mathematical specification is linked at the bottom of the FAQ modal.
  const extra = [];  // intentionally empty — formulae live in the scoring spec doc

  const groups = Array.from(faqModal.querySelectorAll('section.faq-groups > details.group'));
  const scoringGroup = groups.find(g => normQ(g.querySelector('summary .group-title strong')?.textContent).includes('scoring system')) || groups[0];
  const scoringFaq = scoringGroup ? scoringGroup.querySelector('.faq') : null;

  const existingQSet = new Set(Array.from(faqModal.querySelectorAll('.faq details summary .q')).map(el => normQ(el.textContent)));

  const mkDetails = (qText, aHtml) => {
    const d = document.createElement('details');
    const s = document.createElement('summary');
    const q = document.createElement('div');
    q.className = 'q';
    q.textContent = qText;
    const chev = document.createElement('div');
    chev.className = 'chev';
    chev.setAttribute('aria-hidden', 'true');
    s.appendChild(q);
    s.appendChild(chev);
    const ans = document.createElement('div');
    ans.className = 'answer';
    const a = document.createElement('div');
    a.className = 'a';
    a.innerHTML = __cvSanitizeHelpHtml(aHtml);
    ans.appendChild(a);
    d.appendChild(s);
    d.appendChild(ans);
    d.setAttribute('data-cv-faq-generated', '1');
    return d;
  };

  if (scoringFaq){
    extra.forEach(item => {
      const key = normQ(item.q);
      if (existingQSet.has(key)) return;
      scoringFaq.appendChild(mkDetails(item.q, item.a));
      existingQSet.add(key);
    });
  }

  // Inject answers into existing placeholders.
  faqModal.querySelectorAll('.faq details').forEach((d) => {
    const qEl = d.querySelector('summary .q');
    const aEl = d.querySelector('.answer .a');
    if (!qEl || !aEl) return;
    const key = normQ(qEl.textContent);
    const html = answers.get(key);
    if (html && (!aEl.textContent || !aEl.textContent.trim())) {
      aEl.innerHTML = __cvSanitizeHelpHtml(html);
    }
  });

  // Render any KaTeX we injected.
  __cvRenderKatexIn(faqModal);
  faqModal.__cvFaqFilled = true;
  } catch (e) {
    try { faqModal.__cvFaqFilled = false; } catch (_) {}
    // console.error('FAQ injection error', e);
  }
}


function __cvEnableModalFocusTrap(modal){
  if (!modal || modal.__cvTrapBound) return;
  modal.__cvTrapBound = true;

  const getFocusable = () => {
    const sel = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return Array.from(modal.querySelectorAll(sel))
      .filter((el) => {
        if (!el) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        // ignore hidden elements
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
  };

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    // Only trap when modal is open
    if (modal.classList.contains('isHidden')) return;

    const focusables = getFocusable();
    if (!focusables.length) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !modal.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, true);
}

function openHelpModal(id){
  const modal = document.getElementById(id);
  if (!modal) return;

  // Save focus
  modal.__lastFocus = document.activeElement;

  modal.classList.remove('isHidden');

  document.body.classList.add('cv-modal-open');

  __cvEnableModalFocusTrap(modal);

  // Focus the window for keyboard scroll
  const win = modal.querySelector('.cvHelpWindow');
  if (win) {
    win.focus({ preventScroll: true });
    win.scrollTop = 0;
  }

  // Init expandable answer animation heights (now that modal is visible)
  try {
    __cvInitHelpDoc(modal);
  } catch (e) {
    // non-fatal
  }

  // Render any KaTeX math in this modal (idempotent)
  __cvRenderKatexIn(modal);
}

function closeHelpModal(id){
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('isHidden');

  document.body.classList.remove('cv-modal-open');

  // Restore focus
  const last = modal.__lastFocus;
  if (last && typeof last.focus === 'function') {
    try { last.focus(); } catch (e) { ciErr('ignored error', e); }
  }
}

function __cvInitHelpDoc(root){
  if (!root) return;

  const setHeightVar = (detailsEl) => {
    const answer = detailsEl.querySelector(':scope > .answer');
    if (!answer) return;

    answer.style.removeProperty('--target-h');

    // Make measurable
    answer.style.maxHeight = 'none';
    const content = answer.firstElementChild;
    const target = content ? content.scrollHeight : answer.scrollHeight;

    // Restore controlled max-height
    answer.style.maxHeight = '';
    answer.style.setProperty('--target-h', `${target}px`);
  };

  // Initialize heights for all questions inside this modal
  root.querySelectorAll('.faq details').forEach((d) => setHeightVar(d));

  // Bind toggle handler once (scoped)
  try {
    const g = (window.__cvGlobals = window.__cvGlobals || {});
    if (!g.helpToggleBound){
      g.helpToggleBound = true;
      g.helpToggleHandler = (e) => {
        const d = e.target;
        if (!(d instanceof HTMLDetailsElement)) return;
        if (!d.closest('.cvHelpModal')) return;
        if (!d.closest('.faq')) return;
        setHeightVar(d);
      };
      document.addEventListener('toggle', g.helpToggleHandler, true);

      g.helpResizeRaf = null;
      g.helpResizeHandler = () => {
        if (g.helpResizeRaf) cancelAnimationFrame(g.helpResizeRaf);
        g.helpResizeRaf = requestAnimationFrame(() => {
          g.helpResizeRaf = null;
          document.querySelectorAll('.cvHelpModal:not(.isHidden) .faq details').forEach((d) => setHeightVar(d));
        });
      };
      window.addEventListener('resize', g.helpResizeHandler);
    }
  } catch (_e) {}
}

function init(){
    // Strict runtime validation (prevents cascading errors when DOM/assets are missing)
    let __domOk = true;
    try { if (typeof __cvValidateDom === 'function') __domOk = __cvValidateDom(); } catch (_) { __domOk = true; }
    if (!__domOk) return;

    // If CDN loading is disabled, missing vendors should be visible (not just console warnings).
    const __allowCdn = String(document.documentElement.getAttribute('data-cv-allow-cdn') || '').toLowerCase() === 'true';
    if (!hasChartJs() && !__allowCdn){
      try { if (typeof __cvAddRuntimeAlert === 'function') __cvAddRuntimeAlert('missing_chartjs', 'Chart.js is missing and CDN loading is disabled. Add vendor assets (scripts/fetch_vendor_deps.sh) or enable CDN.', 'warn'); } catch (_) {}
    }
    if (!hasChartJs()) console.warn("Chart.js missing; charts will not render.");

    // Bind UI controls (safe to call multiple times; functions guard internally)
    safe('setupTimeControls', setupTimeControls);
    safe('setupExerciseTreemap', setupExerciseTreemap);
    safe('setupInfoButtons', setupInfoButtons);
    safe('setupHelpModals', setupHelpModals);
    safe('__cvSetupFaqContent', __cvSetupFaqContent);
    safe('__cvSetupResilience', __cvSetupResilience);
    safe('clearInfoPaneStaticText', () => { clearInfoPaneStaticText(); const interpEl = cv$("infoPaneInterp"); if (interpEl) interpEl.textContent = ""; });
    safe('setupHeatmapControls', setupHeatmapControls);
    safe('setupPanelCtas', setupPanelCtas);
    safe('setupScoresTabs', setupScoresTabs);

    // Guided tour button
    const tourBtn = document.getElementById("startTourBtn");
    if (tourBtn && !tourBtn.__cvBound){
      tourBtn.__cvBound = true;
      tourBtn.addEventListener("click", (e) => {
        e.preventDefault();
        try { startTour(); } catch (err) { console.error("Tour error:", err); }
      });
    }



    // Apply stored/payload UI prefs (mode + panel visibility + layout) before first render.
    safe('__cvEnsureUiPrefsLoaded', () => { try { if (typeof __cvEnsureUiPrefsLoaded === 'function') __cvEnsureUiPrefsLoaded(); } catch (e) {} });
    safe('__cvBindUiLayoutListeners', () => { try { if (typeof __cvBindUiLayoutListeners === 'function') __cvBindUiLayoutListeners(); } catch (e) {} });
    safe('__cvApplyUiModeAndLayout', () => { try { if (typeof __cvApplyUiModeAndLayout === 'function') __cvApplyUiModeAndLayout(); } catch (e) {} });
    // Back-compat if mode/layout helper is missing
    safe('__cvApplyPanelVisibility', () => { try { if (typeof __cvApplyUiModeAndLayout !== 'function') { if (typeof __cvApplyPanelVisibility === 'function') __cvApplyPanelVisibility(); } } catch (e) {} });
    // (resizer setup removed — CVU-2026-03-B)



    // If Chart.js loads asynchronously (e.g., via CDN), ensure we render charts once it becomes available.
    try {
      if (!hasChartJs() && __allowCdn){
        let tries = 0;
        const maxTries = 20; // ~4s
        const tick = () => {
          tries++;
          if (hasChartJs()){
            try { if (typeof __cvClearRuntimeAlert === 'function') __cvClearRuntimeAlert('missing_chartjs'); } catch (_) {}
            try { window.CodiviumInsights.refresh(); } catch (_) {}
            return;
          }
          if (tries < maxTries) setTimeout(tick, 200);
          else {
            try { if (typeof __cvAddRuntimeAlert === 'function') __cvAddRuntimeAlert('missing_chartjs', 'Chart.js has not loaded yet. Charts may remain blank until it is available.', 'warn'); } catch (_) {}
          }
        };
        setTimeout(tick, 200);
      }
    } catch (_) {}

    // Render once the mount has real pixel dimensions.
    // __cvRenderWhenSized: one rAF to commit grid styles, then either renders
    // immediately (mount already sized) or attaches a one-shot ResizeObserver
    // that fires renderAll() the first time real dimensions appear — no timeouts.
    if (typeof __cvRenderWhenSized === 'function') {
      __cvRenderWhenSized('init');
    } else {
      // Fallback if 06b hasn't loaded yet (should not happen in normal bundle order).
      requestAnimationFrame(function(){
        try { renderAll(); } catch (err) { console.error('Insights render error:', err); }
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => window.CodiviumInsights.init({}));
  else window.CodiviumInsights.init({});
