// dashboard.01.scoreinfo.js — Score info panel content registry.

// -----------------------------
// Score-only Insights Rendering (Option B)
// -----------------------------
const SCORE_INFO_KEYS = new Set(["tour_layout_presets","tour_info_toggle","tour_i_buttons","tour_cta_buttons","tour_faq","tour_glossary","dashboard_overview","panel_scores","panel_depth","codiviumScore","medianTimeToAC","avgAttemptsToAC","firstTryPassRate","breadthScore","microBreadthScore","interviewBreadthScore","mcqBreadthScore","panel_heatmap","panel_time","panel_exercise","panel_mcq","mcqEasy","mcqMedium","mcqHard","codiviumPointsAll","codiviumPoints30","efficiencyPtsPerHr","depthOverallScore","microDepthScore","interviewDepthScore"]);

function clearInfoPaneStaticText(){
  // The tour windows keep their explanatory text; the always-visible info pane shows analysis only.
  const bodyEl = cv$("infoPaneBody");
  if (bodyEl) bodyEl.textContent = "";
  const aggWrap = cv$("infoAgg");
  if (aggWrap) aggWrap.style.display = "none";
}

function renderInsightObject(container, insight){
  if (!container) return;

  // Clear
  container.textContent = "";
  while (container.firstChild) container.removeChild(container.firstChild);

  if (!insight || typeof insight !== "object"){
    container.textContent = "Analysis for this score will be added soon.";
    return;
  }

  const sections = Array.isArray(insight.sections) ? insight.sections : [];
  const MAX_SECTIONS_COLLAPSED = 3;
  const needsMore = sections.length > MAX_SECTIONS_COLLAPSED;

  const frag = document.createDocumentFragment();

  const mkHeading = (text) => {
    const el = document.createElement("div");
    el.className = "ciInsightHeading";
    el.textContent = String(text || "");
    return el;
  };

  const mkPara = (text) => {
    const el = document.createElement("div");
    el.className = "ciInsightPara";
    el.textContent = String(text || "");
    return el;
  };

  const mkNote = (text) => {
    const el = document.createElement("div");
    el.className = "ciInsightNote";
    el.textContent = String(text || "");
    return el;
  };

  const mkBullets = (items) => {
    const ul = document.createElement("ul");
    ul.className = "ciInsightList";
    (items || []).forEach((it) => {
      const li = document.createElement("li");
      li.textContent = String(it || "");
      ul.appendChild(li);
    });
    return ul;
  };

  const renderBlocks = (blocks, parent) => {
    (blocks || []).forEach((b) => {
      if (!b || typeof b !== "object") return;
      const kind = String(b.kind || "p");
      if (kind === "bullets") parent.appendChild(mkBullets(b.items || []));
      else if (kind === "note") parent.appendChild(mkNote(b.text || ""));
      else parent.appendChild(mkPara(b.text || ""));
    });
  };

  const renderSection = (sec, parent) => {
    if (!sec || typeof sec !== "object") return;
    if (sec.heading) parent.appendChild(mkHeading(sec.heading));
    renderBlocks(sec.blocks, parent);
  };

  const main = document.createElement("div");
  main.className = "ciInsightWrap";

  const more = document.createElement("div");
  more.className = "ciInsightMore isHidden";

  sections.forEach((sec, idx) => {
    if (!needsMore || idx < MAX_SECTIONS_COLLAPSED) renderSection(sec, main);
    else renderSection(sec, more);
  });

  if (needsMore){
    main.appendChild(more);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ciMoreBtn";
    btn.textContent = "Show more";
    btn.addEventListener("click", () => {
      const isHidden = more.classList.contains("isHidden");
      if (isHidden){
        more.classList.remove("isHidden");
        btn.textContent = "Show less";
      } else {
        more.classList.add("isHidden");
        btn.textContent = "Show more";
      }
    });

    frag.appendChild(main);
    frag.appendChild(btn);
  } else {
    frag.appendChild(main);
  }

  container.appendChild(frag);
}


  // --- Glossary tooltips for beginners ---
  // We keep analysis content as plain text and add safe tooltips in the UI by wrapping key terms
  // in <abbr> elements. This avoids trusting backend HTML.
  const __CI_GLOSSARY = [
    { re: /\bEvidence\b/gi, title: "Evidence = how much data this insight is based on (e.g., number of solves or attempts). More evidence usually means more reliable insights." },
    { re: /\bStable\b/gi, title: "Stable = less likely to swing up/down with a small amount of new activity." },
    { re: /\bCatalog\b/gi, title: "Catalog = the set of categories currently available on Codivium right now (your breadth is measured against this current list)." },
    { re: /\bFreshness\b/gi, title: "Freshness = whether the interpretation is based on recent activity or your full history. Right now we use your full history." },
    { re: /\bBand\b/gi, title: "Band = a simple label describing where this metric sits relative to thresholds (a quick way to interpret the number)." },

    // Band values (shown when relevant)
    { re: /Ramp-up/gi, title: "Ramp-up = you are just getting started covering categories (very early coverage)." },
    { re: /Foundation/gi, title: "Foundation = you have started covering categories, but there are still many gaps." },
    { re: /Developing\s+breadth/gi, title: "Developing breadth = you are covering a growing range of categories; keep expanding while consolidating weak areas." },
    { re: /Strong\s+breadth/gi, title: "Strong breadth = you cover most categories; focus on converting exposure into consistent performance." },
    { re: /Comprehensive/gi, title: "Comprehensive = you cover almost all categories currently available." },
    { re: /Unavailable/gi, title: "Unavailable = there are currently no categories available for this track (so breadth cannot be computed meaningfully)." },

    // Codivium Score band values
    { re: /Getting started/gi, title: "Getting started = you are ramping up. Focus on consistent clean solves and building coverage." },
    { re: /Building foundations/gi, title: "Building foundations = you have a base. Widen coverage and improve correctness/efficiency." },
    { re: /Developing consistency/gi, title: "Developing consistency = performance is becoming repeatable. Keep improving first-try correctness and expand." },
    { re: /Strong performance/gi, title: "Strong performance = solid results across many areas. Push harder categories and interview transfer." },
    { re: /Advanced trajectory/gi, title: "Advanced trajectory = strong overall trajectory. Maintain breadth and push difficulty with high correctness." },


    // Additional beginner-friendly terms

    { re: /\bCoverage\b/gi, title: "Coverage = breadth. It means how many categories you have touched out of what is currently available. Coverage ≠ mastery." },
    { re: /\bconcentration\b/gi, title: "Concentration = how much of your total depth sits in your top categories (e.g., top-1 or top-3 share). Some concentration is normal during focus cycles; extreme concentration can hide gaps." },
    { re: /\bOutliers?\b/gi, title: "Outliers = categories unusually high or low compared to your own baseline. We compute this robustly (median + MAD) and only show it when there is enough evidence, to avoid false alarms." },
    { re: /\bAC\b/g, title: "AC = Accepted. Your solution passed all tests. Depth is based on accepted solves (verified work)." },
    { re: /\bsigma\b/gi, title: "Sigma (σ) = a measure of spread. Here it is a robust sigma derived from MAD, used to express how far a category is from your baseline." },
    { re: /σ/g, title: "σ (sigma) = a measure of spread. Here it is a robust sigma derived from MAD." },
    { re: /Weighted\s+MCQ/gi, title: "Weighted MCQ = MCQ score averaged with difficulty weights (Advanced contributes more than Basic). It is not the same as raw accuracy." },
    { re: /\bMAD\b/g, title: "MAD = median absolute deviation. It measures typical distance from the median and is more robust than standard deviation when there are outliers." },
    { re: /median\s+absolute\s+deviation/gi, title: "Median absolute deviation (MAD) = typical distance from the median. It is robust (less sensitive to extreme values) and is used here to detect outliers safely." },

    { re: /\bPercentile\b/gi, title: "Percentiles show the spread of your results. p50 is the median; p75 means 75% of your solves were at or below that value." },
    { re: /\bp25\b/gi, title: "p25 = 25th percentile (a faster-than-typical solve)." },
    { re: /\bp50\b/gi, title: "p50 = median (typical value)." },
    { re: /\bp75\b/gi, title: "p75 = 75th percentile (a slower-than-typical solve; useful for spotting long outliers)." },
    { re: /First-attempt failure rate/gi, title: "First-attempt failure rate = among solved sessions, how often the first submission was NOT accepted. Lower is better." },
    { re: /Difficulty cliff/gi, title: "Difficulty cliff = performance drops noticeably when moving from Basic to Advanced problems." },
    { re: /Transfer gap/gi, title: "Transfer gap = performance is stronger in drills (micro) than in interview-style problems. The fix is practicing transfer." },
    
    { re: /\bDepth\b/gi, title: "Depth = how much verified coding work you’ve done in a category. It grows when you complete (AC) problems, especially at higher difficulty and with strong convergence." },
    { re: /\bTouched\b/gi, title: "Touched categories = categories where you have some depth (you’ve completed at least one accepted solve)." },
    { re: /\bUntouched\b/gi, title: "Untouched categories = categories in the current coding catalog where you have not yet built depth (no accepted solves yet)." },
    { re: /\bVolatility\b/gi, title: "Volatility = how much a metric may swing with a small amount of new activity. Low sample sizes are more volatile." },
    { re: /\bFocus\b/gi, title: "Focus band = your highest-depth categories (top part of your own depth distribution)." },
    { re: /\bEmerging\b/gi, title: "Emerging band = categories with some depth, but still early compared to your strongest areas." },
    { re: /\bBuilding\b/gi, title: "Building band = categories where depth is developing (middle of your depth distribution)." },
    { re: /\bConcentrated\b/gi, title: "Concentrated = most of your depth sits in a small number of categories. Good for specialization, but it can leave gaps." },
    { re: /\bOpportunity\b/gi, title: "Opportunity categories = categories you’ve started, but where depth is still low. They’re often the easiest wins to improve next." },
{ re: /Likely explanation/gi, title: "Likely explanation = a best-guess interpretation based on your current data. It is not a certainty." }
  ];

  function __ciWrapGlossaryTerms(root){
    if (!root) return;

    // Snapshot text nodes first; we will replace nodes in-place.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    const wrapNode = (textNode, regex, title) => {
      if (!textNode || !textNode.parentNode) return;
      if (textNode.parentNode && textNode.parentNode.nodeName === "ABBR") return;

      const text = textNode.nodeValue;
      regex.lastIndex = 0;
      const match = regex.exec(text);
      if (!match) return;

      const frag = document.createDocumentFragment();
      let last = 0;
      regex.lastIndex = 0;

      let m;
      while ((m = regex.exec(text))){
        const start = m.index;
        const end = start + m[0].length;

        if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));

        const ab = document.createElement("abbr");
        ab.className = "ciGlossTerm";
        ab.title = title;
        ab.textContent = text.slice(start, end);
        frag.appendChild(ab);

        last = end;
      }

      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));

      textNode.parentNode.replaceChild(frag, textNode);
    };

    // Apply glossary replacements term-by-term for deterministic behavior.
    __CI_GLOSSARY.forEach(term => {
      nodes.forEach(tn => wrapNode(tn, term.re, term.title));
    });
  }



function buildDepthFallbackInsightFromOverride(depthItems){
  const items = Array.isArray(depthItems) ? depthItems.filter(x => (x && Number(x.depth) > 0)) : [];
  const all = Array.isArray(depthItems) ? depthItems : [];
  const touched = items.slice().sort((a,b)=>(Number(b.depth)||0)-(Number(a.depth)||0));
  const available = all.length;
  const touchedCount = touched.length;
  const untouchedCount = Math.max(0, available - touchedCount);
  const depths = touched.map(x => Number(x.depth)||0).sort((a,b)=>a-b);

  function percentile(sorted, p){
    if (!sorted.length) return 0;
    const clamped = Math.min(1, Math.max(0, p));
    const idx = (sorted.length - 1) * clamped;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    const w = idx - lo;
    return sorted[lo] * (1-w) + sorted[hi] * w;
  }
  const pFocus = percentile(depths, 0.80);
  const pBuild = percentile(depths, 0.50);
  const pEmerg = percentile(depths, 0.20);

  function bandFor(v){
    if (v <= 0) return "Untouched";
    if (pFocus>0 && v >= pFocus) return "Focus";
    if (pBuild>0 && v >= pBuild) return "Building";
    if (pEmerg>0 && v >= pEmerg) return "Emerging";
    return "Emerging";
  }

  const focusCount = touched.filter(x => bandFor(Number(x.depth)||0) === "Focus").length;
  const buildCount = touched.filter(x => bandFor(Number(x.depth)||0) === "Building").length;
  const emergCount = touched.filter(x => bandFor(Number(x.depth)||0) === "Emerging").length;

  const total = touched.reduce((a,b)=>a+(Number(b.depth)||0),0);
  const top1 = total>0 ? (Number(touched[0]?.depth)||0)/total : 0;
  const top3 = total>0 ? touched.slice(0,3).reduce((a,b)=>a+(Number(b.depth)||0),0)/total : 0;

  const topCats = touched.slice(0,5).map(x => `${String(x.category)} — depth ${Math.round((Number(x.depth)||0)*10)/10} (${bandFor(Number(x.depth)||0)})`);
  const oppCats = touched.slice().sort((a,b)=>(Number(a.depth)||0)-(Number(b.depth)||0)).slice(0,5)
    .map(x => `${String(x.category)} — depth ${Math.round((Number(x.depth)||0)*10)/10} (${bandFor(Number(x.depth)||0)})`);

  // Robust outliers (Option A style): median + MAD
  const baselineMedian = percentile(depths, 0.50);
  const absDevs = touched.map(x => Math.abs((Number(x.depth)||0) - baselineMedian)).sort((a,b)=>a-b);
  const mad = percentile(absDevs, 0.50);
  const robustSigma = 1.4826 * mad;
  const outZ = 1.5;
  const outMinAbsGap = 5.0;
  const outMax = 3;

  let highOut = [], lowOut = [];
  let outSuppressed = null;
  if (touchedCount < 5){
    outSuppressed = "Not enough touched categories yet for robust outliers (need at least 5).";
  } else if (!isFinite(robustSigma) || robustSigma <= 1e-6){
    outSuppressed = "Depth values are very similar right now, so outliers are suppressed to avoid over-interpreting tiny differences.";
  } else {
    for (const x of touched){
      const v = Number(x.depth)||0;
      const gap = v - baselineMedian;
      const absGap = Math.abs(gap);
      if (absGap < outMinAbsGap) continue;
      const z = gap / robustSigma;
      if (z >= outZ) highOut.push({cat: String(x.category), depth: v, z});
      else if (z <= -outZ) lowOut.push({cat: String(x.category), depth: v, z});
    }
    highOut.sort((a,b)=>b.z-a.z);
    lowOut.sort((a,b)=>a.z-b.z);
    highOut = highOut.slice(0,outMax);
    lowOut = lowOut.slice(0,outMax);
  }

  const likely = (top1 >= 0.55 || top3 >= 0.80)
    ? "Your depth is concentrated in a small number of categories. That can be great for mastery—just keep a light sweep elsewhere to avoid gaps."
    : "Your depth is spread across multiple categories. That builds coverage, but you may benefit from a short focus cycle to push 1–2 categories deeper.";

  const actions = [
    "Pick 1–2 Focus categories for a 7–14 day cycle and aim to increase depth there.",
    "Keep a light sweep: 1 short session in 1–2 non-focus categories per week.",
    "Use micro → interview transfer in the same category to lock in depth with application."
  ];

  return {
    title: "Depth by category",
    summary: `${touchedCount} touched • ${untouchedCount} untouched • Focus ${focusCount}`,
    sections: [
      { heading: "Snapshot", type: "snapshot", blocks: [
        { kind: "bullets", items: [
          `Touched categories: ${touchedCount} / ${available} (Untouched: ${untouchedCount})`,
          `Focus: ${focusCount} • Building: ${buildCount} • Emerging: ${emergCount}`,
          `Concentration: top1 ${(top1*100).toFixed(0)}% • top3 ${(top3*100).toFixed(0)}%`
        ]}
      ]},
      { heading: "Depth outliers (robust)", type: "diagnosis", blocks: [
        { kind: "p", text: "Outliers compare categories to your typical depth baseline (median), using a robust spread estimate (MAD). This is a client-side fallback and does not have per-category evidence counts." },
        ...(outSuppressed ? [{ kind: "callout", text: outSuppressed }] : []),
        ...(!outSuppressed && highOut.length ? [{ kind: "bullets", items: ["High outliers (strengths):", ...highOut.map(x => `${x.cat} — depth ${Math.round(x.depth*10)/10} (+${x.z.toFixed(1)}σ vs baseline)`) ] }] : []),
        ...(!outSuppressed && lowOut.length ? [{ kind: "bullets", items: ["Low outliers (priority gaps):", ...lowOut.map(x => `${x.cat} — depth ${Math.round(x.depth*10)/10} (${x.z.toFixed(1)}σ vs baseline)`) ] }] : []),
        ...(!outSuppressed && !highOut.length && !lowOut.length ? [{ kind: "p", text: `No clear outliers beyond the thresholds (≥${outZ}σ and ≥${outMinAbsGap} depth gap).` }] : []),
        ...(!outSuppressed && (highOut.length || lowOut.length) ? [{ kind: "p", text: `Baseline median: ${Math.round(baselineMedian*10)/10} • Robust σ: ${Math.round(robustSigma*10)/10}.` }] : [])
      ]},
      { heading: "Top categories", type: "section", blocks: [
        { kind: "bullets", items: topCats.length ? topCats : ["No non-zero depth values found."] }
      ]},
      { heading: "Opportunities", type: "section", blocks: [
        { kind: "bullets", items: oppCats.length ? oppCats : ["No opportunities yet — add more depth in at least one category."] }
      ]},
      { heading: "Likely explanation", type: "diagnosis", blocks: [
        { kind: "p", text: `${likely}` }
      ]},
      { heading: "Recommended next steps", type: "actions", blocks: [
        { kind: "bullets", items: actions }
      ]},
      { heading: "Guards", type: "guards", blocks: [
        { kind: "bullets", items: [
          "Catalog basis: uses the categories shown in your depth chart.",
          "Freshness: This interpretation uses data across your full history."
        ] }
      ]}
    ],
    meta: { fallback: true }
  };
}
