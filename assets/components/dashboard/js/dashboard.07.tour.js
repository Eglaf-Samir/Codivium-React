// dashboard.07.tour.js — Guided tour system.

// -----------------------------
// Guided tour (metric-by-metric)
// -----------------------------
const TOUR_STEPS = [
  // ── UI controls ──────────────────────────────────────────────────────────
  { key: "tour_layout_presets", selector: "#cvLayoutPresetDock" },
  { key: "tour_info_toggle",    selector: "#cvInfoPaneToggleBtn" },
  { key: "tour_i_buttons",      selector: ".infoBtn.chipInfo" },
  { key: "tour_cta_buttons",    selector: ".panelCtaBtn" },
  { key: "tour_faq",            selector: "#openFaqLink" },
  { key: "tour_glossary",       selector: "#openGlossaryLink" },
  // ── Panels ───────────────────────────────────────────────────────────────
  { key: "panel_scores", selector: ".scoresPalette" },
  { key: "codiviumScore", selector: "#codiviumScore" },
  { key: "breadthScore", selector: "#breadthScore" },
  { key: "interviewBreadthScore", selector: "#interviewBreadthScore" },
  { key: "microBreadthScore", selector: "#microBreadthScore" },
  { key: "mcqBreadthScore", selector: "#mcqBreadthScore" },
    { key: "firstTryPassRate", selector: "#firstTryPassRate" },
  { key: "avgAttemptsToAC", selector: "#avgAttemptsToAC" },
  { key: "medianTimeToAC", selector: "#medianTimeToAC" },

  { key: "panel_depth", selector: ".depthPanel" },
  { key: "panel_heatmap", selector: ".heatmapPanel" },

  { key: "panel_time", selector: ".timePanel" },
  { key: "panel_exercise", selector: ".donutPanel" },

  { key: "panel_mcq", selector: ".mcqPanel" },
  { key: "mcqEasy", selector: "#mcqEasyChart" },
  { key: "mcqMedium", selector: "#mcqMediumChart" },
  { key: "mcqHard", selector: "#mcqHardChart" },
];


function __tourCtaForKey(key){
  const k = String(key || "");
  if (k === "tour_layout_presets" || k === "tour_info_toggle" || k === "tour_i_buttons" ||
      k === "tour_cta_buttons" || k === "tour_faq" || k === "tour_glossary") return "";
  if (k === "panel_scores") return "CTA: Use the panel button to start a targeted session that improves your overall score by prioritising the weakest areas in your signals.";
  if (k === "panel_depth") return "CTA: Use the panel button to start a session focused on the lowest-depth categories (the bars highlight where depth is weakest).";
  if (k === "panel_heatmap") return "CTA: Use the panel button to practise categories with low early-attempt convergence (tiles with lower values in A1–A3).";
  if (k === "panel_time") return "CTA: Use the panel button to start a short session that helps you keep consistency (especially if your recent days are sparse).";
  if (k === "panel_exercise") return "CTA: Use the panel button to practise the currently selected category. Tip: click a bar to select a category and see its details.";
  if (k === "panel_mcq") return "CTA: Use the panel button to launch a quiz targeting your weakest MCQ areas by difficulty and category.";
  if (k === "mcqEasy" || k === "mcqMedium" || k === "mcqHard") return "CTA: Use the MCQ panel button to start a quiz; the chart highlights where you should focus next.";
  return "";
}

let __tour = null;

function startTour(){
  if (__tour && __tour.active) return;

  // Tour is disabled in Summary View (info-only).
  try {
    const ui = (window.CodiviumInsights && typeof window.CodiviumInsights.getEffectiveUiState === 'function')
      ? window.CodiviumInsights.getEffectiveUiState()
      : null;
    if (ui && ui.mode === 'info_only') {
      alert('The guided tour is not available in Summary View. Use a larger screen or switch to Full Dashboard mode.');
      return;
    }
  } catch (_) { /* ignore */ }
  __tour = createTour();
  __tour.start();
}

function createTour(){
  const state = {
    active: false,
    index: 0,
    steps: [],
    backdrop: null,
    spotlight: null,
    card: null,
    aggOpen: false,
  };

  function buildUI(){
    const backdrop = document.createElement("div");
    backdrop.className = "ciTourBackdrop";

    const spotlight = document.createElement("div");
    spotlight.className = "ciTourSpotlight";

    const card = document.createElement("div");
    card.className = "ciTourCard";
    card.innerHTML = `
      <div class="ciTourCardHead">
        <div>
          <div class="ciTourCardTitle" id="ciTourTitle"></div>
          <div class="ciTourCardMeta" id="ciTourMeta"></div>
        </div>
        <button class="ciTourClose" type="button" aria-label="Close tour" id="ciTourClose">×</button>
      </div>
      <div class="ciTourCardBody" id="ciTourBody"></div>

      <div class="ciTourCalcNote" id="ciTourCalcNote">
        Calculation details are available in the FAQ and Glossary.
      </div>

      <div class="ciTourFoot">
        <button class="ciTourNavBtn" type="button" id="ciTourSkip">Skip</button>
        <div class="ciTourBtns">
          <button class="ciTourNavBtn" type="button" id="ciTourBack">Back</button>
          <button class="ciTourNavBtn primary" type="button" id="ciTourNext">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(spotlight);
    document.body.appendChild(card);

    state.backdrop = backdrop;
    state.spotlight = spotlight;
    state.card = card;

    // Bind
    card.querySelector("#ciTourClose").addEventListener("click", stop);
    card.querySelector("#ciTourSkip").addEventListener("click", stop);
    card.querySelector("#ciTourBack").addEventListener("click", prev);
    card.querySelector("#ciTourNext").addEventListener("click", next);

    document.addEventListener("keydown", onKeyDown);
    try {
      const g = (window.__cvGlobals = window.__cvGlobals || {});
      if (!g.tourKeyHandlers) g.tourKeyHandlers = new Set();
      g.tourKeyHandlers.add(onKeyDown);
    } catch (_e) {}
    window.addEventListener("resize", renderStep);
  }

  function destroyUI(){
    try { document.removeEventListener("keydown", onKeyDown); } catch (e) { ciErr('ignored error', e); }
    try {
      const g = window.__cvGlobals;
      if (g && g.tourKeyHandlers) g.tourKeyHandlers.delete(onKeyDown);
    } catch (_e) {}
    try { window.removeEventListener("resize", renderStep); } catch (e) { ciErr('ignored error', e); }
    if (state.backdrop) state.backdrop.remove();
    if (state.spotlight) state.spotlight.remove();
    if (state.card) state.card.remove();
    state.backdrop = state.spotlight = state.card = null;
  }

  function onKeyDown(e){
    if (!state.active) return;
    if (e.key === "Escape") stop();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  }

  function getStep(){
    return (state.steps && state.steps[state.index]) || null;
  }

  function getContent(key){
    // Prefer INFO_DETAIL (richer), fallback to INFO_CONTENT
    const detail = (typeof INFO_DETAIL !== "undefined" && INFO_DETAIL[key]) ? INFO_DETAIL[key] : null;
    const base = (typeof INFO_CONTENT !== "undefined" && INFO_CONTENT[key]) ? INFO_CONTENT[key] : null;
    const title = (base && base.title) ? base.title : (key || "Metric");
    const body = (detail && detail.body) ? detail.body : ((base && base.body) ? base.body : "");
    const agg = (detail && detail.agg) ? detail.agg : "";
    return { title, body, agg };
  }

function stripAnalysisSection(text){
  // Tour boxes focus on the metric explanation; personalized analysis appears in the right-side panel.
  const marker = "\n\nAnalysis of your results";
  const idx = text.indexOf(marker);
  const base = (idx >= 0) ? text.slice(0, idx) : text;
  return base.trim();
}

  function positionCard(rect){
    const card = state.card;
    if (!card) return;

    const pad = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.getBoundingClientRect().width;
    const ch = card.getBoundingClientRect().height;

    // Prefer right side
    let left = rect.right + pad;
    let top = rect.top;

      // Nudge MCQ tour cards upward slightly (they can otherwise sit too low).
      const step = getStep();
      if (step && (step.key === "panel_mcq" || step.key === "mcqEasy" || step.key === "mcqMedium" || step.key === "mcqHard")) {
        top = top - 80;
      }

    if (left + cw > vw - pad) {
      left = rect.left - cw - pad;
    }
    if (left < pad) left = pad;

    // Clamp vertically
    if (top + ch > vh - pad) top = vh - ch - pad;
    if (top < pad) top = pad;

    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  }

  function renderStep(){
    if (!state.active) return;
    const step = getStep();
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (!el) return;

    try { el.scrollIntoView({ block: "center", inline: "nearest" }); } catch (e) { ciErr('ignored error', e); }

    const rect = el.getBoundingClientRect();
    const spot = state.spotlight;
    if (spot){
      const m = 6;
      spot.style.left = `${Math.max(0, Math.round(rect.left - m))}px`;
      spot.style.top = `${Math.max(0, Math.round(rect.top - m))}px`;
      spot.style.width = `${Math.round(rect.width + m*2)}px`;
      spot.style.height = `${Math.round(rect.height + m*2)}px`;
    }

    const { title, body } = getContent(step.key);

    const card = state.card;
    if (card){
      const titleEl = card.querySelector("#ciTourTitle");
      const metaEl = card.querySelector("#ciTourMeta");
      const bodyEl = card.querySelector("#ciTourBody");
      const calcNote = card.querySelector("#ciTourCalcNote");
      const nextBtn = card.querySelector("#ciTourNext");
      const backBtn = card.querySelector("#ciTourBack");

      titleEl.textContent = title;
      metaEl.textContent = `Step ${state.index + 1} of ${(state.steps ? state.steps.length : 0)}`;
      const baseText = stripAnalysisSection(body || "");
      const cta = __tourCtaForKey(step.key);
      bodyEl.textContent = cta ? (baseText + "\n\n" + cta) : baseText;

      if (calcNote) calcNote.textContent = "For full calculation details, see the FAQ and Glossary.";

      backBtn.disabled = state.index === 0;
      nextBtn.textContent = (state.index === (state.steps ? state.steps.length : 0) - 1) ? "Done" : "Next";

      positionCard(rect);
    }
  }


function computeVisibleSteps(){
  const steps = [];
  (TOUR_STEPS || []).forEach((s) => {
    if (!s || !s.selector) return;
    const el = document.querySelector(s.selector);
    if (!el) return;
    // Skip hidden panels / elements.
    try {
      if (el.classList && el.classList.contains('isHidden')) return;
      if (el.closest && el.closest('.isHidden')) return;
    } catch (_) {}
    steps.push(s);
  });
  return steps;
}

  function start(){
    state.steps = computeVisibleSteps();
    state.index = 0;
    if (!state.steps || !state.steps.length){
      alert('No visible panels are available for the tour.');
      return;
    }
    state.active = true;
    buildUI();
    renderStep();
  }

  function stop(){
    state.active = false;
    destroyUI();
  }

  function next(){
    if (!state.active) return;
    if (state.index >= (state.steps ? state.steps.length : 0) - 1) { stop(); return; }
    state.index += 1;
    renderStep();
  }

  function prev(){
    if (!state.active) return;
    if (state.index <= 0) return;
    state.index -= 1;
    renderStep();
  }

  return { get active(){ return state.active; }, start, stop };
}


