/* mcq-tour.js
 * ============================================================
 * Guided tour spanning mcq-parent.html AND mcq-single-question.html.
 * Uses ciTour* CSS from assets/components/core/tour.css.
 *
 * Cross-page behaviour:
 *   - Steps 0–N  run on mcq-parent.html
 *   - Steps N+1+ run on mcq-single-question.html
 *   - Tour state is persisted in sessionStorage so it survives navigation.
 *   - Ending or skipping the tour from any page returns to mcq-parent.html.
 *   - If mcq-single-question.html is not yet available, the final step
 *     of the parent tour offers a "Go to Quiz Page" button instead.
 *
 * Buttons on every card:  Previous | Next  (and ✕ skip-tour / close).
 * ============================================================ */
(function () {
  "use strict";

  /* ── Storage key ─────────────────────────────────────────────── */
  var STORAGE_KEY = "cv.mcqTour";

  /* ── Detect which page we're on ─────────────────────────────── */
  var ON_PARENT   = document.body.classList.contains("mcq-parent");
  var ON_QUESTION = document.body.classList.contains("mcq-quiz");

  /* ── Tour steps: parent page ─────────────────────────────────── */
  var PARENT_STEPS = [
    {
      selector: null,
      title: "MCQ Quiz Setup — Overview",
      body: "This page lets you configure a Multiple Choice Quiz before starting.\n\nUse the filters on the left to choose which topics to be tested on, set the difficulty level and number of questions, then hit Start Quiz.\n\nThis tour walks through every part of the page."
    },
    {
      selector: "#tabSimple, #tabPower",
      title: "Simple / Power Filter",
      body: "Two modes for selecting categories.\n\nSimple Filter shows all categories as clickable pills — tap one to toggle it on or off.\n\nPower Filter is faster when you know what you want: type to search, matching categories are highlighted, press Enter to select all matches at once."
    },
    {
      selector: "#catTabSimple",
      title: "Category Pills (Simple Mode)",
      body: "Each pill is a topic category. Tap any pill to include it in your quiz.\n\nUse the search box above to filter by name. Use Select All or Clear to change all at once.\n\nYour selection is reflected live in the Selected Settings panel on the right."
    },
    {
      selector: "#catTabPower",
      title: "Power Filter",
      body: "Type a keyword to search categories — matching items are highlighted in the list below.\n\nPress Enter to instantly select every match. Click the browse arrow (▾) to see all categories.\n\nUseful when you know the exact topic you want, or want to select a group of related topics by keyword."
    },
    {
      selector: ".cat-meta",
      title: "Selection Summary & View Toggle",
      body: "Shows how many categories are currently selected.\n\nThe All / Selected toggle changes what you see in the list — it does not affect your selection. Switch to Selected to review only what you have chosen.\n\nClear removes all selected categories in one step."
    },
    {
      selector: ".togglebar",
      title: "Difficulty Level",
      body: "Choose the challenge level for your quiz.\n\nBasic covers fundamentals and core concepts.\nIntermediate introduces multi-step reasoning and common patterns.\nAdvanced targets harder edge-cases and deeper understanding.\n\nTip: stick to one difficulty while practising a topic, then move up when you are consistently strong."
    },
    {
      selector: ".range-wrap",
      title: "Number of Questions",
      body: "Drag the slider to choose how many questions your quiz will contain — anywhere from 10 to 50.\n\nUse the Min or Max buttons for one-tap presets.\n\nThe selected count is shown in the display above the slider and updated live in the Selected Settings panel."
    },
    {
      selector: ".checkline",
      title: "Exclude Previously Correct",
      body: "When enabled, the quiz skips questions you have already answered correctly in previous sessions.\n\nThis keeps your practice focused on areas where you still have gaps, rather than repeating questions you have already mastered."
    },
    {
      selector: ".panel-quickguide",
      title: "Quick Start Guide",
      body: "A concise reminder of the steps needed to start a quiz.\n\nEach step has a small ⓘ button — click it to read a detailed explanation in the Info panel on the right.\n\nThe final step flashes the Start Quiz button so you can find it quickly."
    },
    {
      selector: ".window-rail[aria-label='Explanations']",
      title: "Info / Explanations Panel",
      body: "Click any ⓘ button on the page and a clear explanation appears here.\n\nUse this panel to understand what each setting does before you make a choice. The × button clears the panel when you are done reading."
    },
    {
      selector: ".window-palette",
      title: "Selected Settings Panel",
      body: "A live summary of everything you have configured.\n\nShows the chosen difficulty (as a visual ladder), the number of questions, the categories you have selected (as pills), and whether the exclude-correct setting is active.\n\nThe green Ready indicator lights up when you have at least one category selected and the quiz is ready to start."
    },
    {
      selector: "#startQuiz",
      title: "Start Quiz",
      body: "When you are happy with your settings, press Start Quiz.\n\nYour settings are saved automatically, so the next time you visit this page they will still be selected.\n\nThe next step of this tour continues on the quiz page itself."
    }
  ];

  /* ── Tour steps: single-question page ───────────────────────── */
  var QUESTION_STEPS = [
    {
      selector: null,
      title: "Quiz Page — Overview",
      body: "This is where each question is presented during your quiz.\n\nYou will see the question text, up to six answer options, your progress through the quiz, and a timer.\n\nThis tour walks through every element on the page."
    },
    {
      selector: "#mcqQuestionText, .question-text, [data-role='question']",
      title: "Question",
      body: "The question is displayed here. Read it carefully before selecting an answer.\n\nQuestions are drawn from the categories and difficulty level you chose on the setup page."
    },
    {
      selector: "#mcqOptions, .options-list, [data-role='options']",
      title: "Answer Options",
      body: "Up to six options are presented for each question. Most questions have one correct answer — select it and move on.\n\nSome questions have multiple correct answers. When that is the case, the question will say so. Select all the options that apply before submitting.\n\nOnce you submit, immediate feedback is shown — correct answers are highlighted green, incorrect answers red, and the correct answer is revealed if you were wrong."
    },
    {
      selector: "#mcqProgress, .progress-bar, [data-role='progress']",
      title: "Progress",
      body: "Shows how far through the quiz you are — for example, Question 3 of 10.\n\nA progress bar gives a visual indication of completion. Your score so far is also shown."
    },
    {
      selector: "#mcqTimer, .quiz-timer, [data-role='timer']",
      title: "Timer",
      body: "Tracks how long you have been working on the current question and the quiz overall.\n\nThere is no time limit — the timer is informational only, helping you track your pace."
    },
    {
      selector: "#mcqNextBtn, .next-question-btn, [data-role='next']",
      title: "Next Question",
      body: "After selecting an answer, press Next to move to the following question.\n\nOn the final question, this button becomes Finish Quiz and takes you to your results summary."
    },
    {
      selector: "#mcqExitBtn, .exit-quiz-btn, [data-role='exit']",
      title: "Exit Quiz",
      body: "Returns you to the setup page at any time.\n\nYour progress on the current quiz session will be lost if you exit early, but your historical scores and settings are always preserved."
    },
    {
      selector: null,
      title: "Tour Complete",
      body: "That covers everything on the MCQ pages.\n\nGo back to the setup page whenever you are ready to start a quiz — your previous settings will still be waiting for you.\n\nGood luck!"
    }
  ];

  var ALL_STEPS = PARENT_STEPS.concat(QUESTION_STEPS);
  var PARENT_COUNT = PARENT_STEPS.length;

  /* ── State ──────────────────────────────────────────────────── */
  var _idx      = 0;
  var _active   = false;
  var _backdrop = null;
  var _spot     = null;
  var _card     = null;

  /* ── sessionStorage helpers ─────────────────────────────────── */
  function saveState(idx) {
    try { sessionStorage.setItem(STORAGE_KEY, String(idx)); } catch (e) {}
  }
  function loadState() {
    try { return parseInt(sessionStorage.getItem(STORAGE_KEY) || "-1", 10); } catch (e) { return -1; }
  }
  function clearState() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  /* ── Build DOM ──────────────────────────────────────────────── */
  function buildUI() {
    if (_backdrop) return;

    _backdrop = make("div", "ciTourBackdrop");
    _backdrop.id = "mcqTourBackdrop";

    _spot = make("div", "ciTourSpotlight");
    _spot.id = "mcqTourSpotlight";

    _card = make("div", "ciTourCard");
    _card.id = "mcqTourCard";
    _card.setAttribute("role", "dialog");
    _card.setAttribute("aria-modal", "true");
    _card.setAttribute("aria-labelledby", "mcqTourCardTitle");
    _card.setAttribute("tabindex", "-1");

    _card.innerHTML =
      "<div class=\"ciTourCardHead\">" +
        "<div>" +
          "<div class=\"ciTourCardTitle\" id=\"mcqTourCardTitle\"></div>" +
          "<div class=\"ciTourCardMeta\" id=\"mcqTourStep\"></div>" +
        "</div>" +
        "<button class=\"ciTourClose\" id=\"mcqTourClose\" type=\"button\" aria-label=\"Skip tour\">&#x2715;</button>" +
      "</div>" +
      "<div class=\"ciTourCardBody\" id=\"mcqTourBody\"></div>" +
      "<div class=\"ciTourFoot\">" +
        "<button class=\"ciTourNavBtn\" id=\"mcqTourSkip\" type=\"button\">Skip Tour</button>" +
        "<div class=\"ciTourBtns\">" +
          "<button class=\"ciTourNavBtn\" id=\"mcqTourBack\" type=\"button\">Previous</button>" +
          "<button class=\"ciTourNavBtn primary\" id=\"mcqTourNext\" type=\"button\">Next</button>" +
        "</div>" +
      "</div>";

    document.body.appendChild(_backdrop);
    document.body.appendChild(_spot);
    document.body.appendChild(_card);

    /* Wire buttons */
    id("mcqTourClose").addEventListener("click", endTour);
    id("mcqTourSkip").addEventListener("click", endTour);
    id("mcqTourBack").addEventListener("click", function () {
      if (_idx > 0) { _idx--; render(); }
    });
    id("mcqTourNext").addEventListener("click", advanceOrNavigate);

    /* Keyboard */
    document.addEventListener("keydown", function (e) {
      if (!_active) return;
      if (e.key === "Escape")     { endTour(); return; }
      if (e.key === "ArrowRight") { advanceOrNavigate(); }
      if (e.key === "ArrowLeft")  { if (_idx > 0) { _idx--; render(); } }
    });

    /* Focus trap */
    _card.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var els = Array.from(_card.querySelectorAll("button:not(:disabled)"));
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ── Advance or navigate to next page ───────────────────────── */
  function advanceOrNavigate() {
    /* Last step on parent page → go to quiz page */
    if (ON_PARENT && _idx === PARENT_COUNT - 1) {
      saveState(PARENT_COUNT); /* resume on question page at first question step */
      window.location.href = window.__CODIVIUM_MCQ_QUIZ_URL__ || "mcq-quiz.html";
      return;
    }
    /* Last step overall → end tour */
    if (_idx >= ALL_STEPS.length - 1) {
      endTour();
      return;
    }
    _idx++;
    render();
  }

  /* ── End tour (any reason) → always return to parent page ───── */
  function endTour() {
    _active = false;
    clearState();
    hide(_backdrop);
    hide(_spot);
    hide(_card);
    /* If on the question page, navigate back */
    if (ON_QUESTION) {
      window.location.href = "mcq-parent.html";
      return;
    }
    /* Restore focus to tour button */
    var btn = id("mcqTourBtn");
    if (btn) btn.focus();
  }

  /* ── Render current step ─────────────────────────────────────── */
  function render() {
    if (!_card) return;

    /* Determine the active step set based on page */
    var steps   = ON_PARENT ? PARENT_STEPS : QUESTION_STEPS;
    /* Local index within the current page's steps */
    var localIdx = ON_PARENT ? _idx : (_idx - PARENT_COUNT);
    if (localIdx < 0 || localIdx >= steps.length) return;

    var step = steps[localIdx];
    var totalLocal = steps.length;

    id("mcqTourCardTitle").textContent = step.title;
    id("mcqTourBody").textContent      = step.body;
    id("mcqTourStep").textContent      = "Step " + (localIdx + 1) + " of " + totalLocal;

    var backBtn = id("mcqTourBack");
    var nextBtn = id("mcqTourNext");

    backBtn.disabled = (localIdx === 0);

    if (ON_PARENT && localIdx === PARENT_COUNT - 1) {
      nextBtn.textContent = "Go to Quiz Page \u2192";
    } else if (localIdx === totalLocal - 1) {
      nextBtn.textContent = "Finish";
    } else {
      nextBtn.textContent = "Next";
    }

    var targetEl = getTarget(step.selector);
    if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

    requestAnimationFrame(function () {
      var t = getTarget(step.selector);
      positionSpotlight(t);
      positionCard(t);
      _card.focus();
    });
  }

  /* ── Public: start from step 0 ─────────────────────────────── */
  function start() {
    buildUI();
    _idx    = 0;
    _active = true;
    saveState(0);
    show(_backdrop);
    show(_spot);
    show(_card);
    render();
  }

  /* ── Resume from saved state (question page auto-start) ─────── */
  function resumeIfNeeded() {
    var saved = loadState();
    if (!ON_QUESTION || saved < PARENT_COUNT) return;
    buildUI();
    _idx    = saved;
    _active = true;
    show(_backdrop);
    show(_spot);
    show(_card);
    render();
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  function make(tag, cls) { var el = document.createElement(tag); el.className = cls; return el; }
  function id(i) { return document.getElementById(i); }
  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }

  function getTarget(sel) {
    if (!sel) return null;
    var parts = sel.split(",");
    for (var i = 0; i < parts.length; i++) {
      try { var el = document.querySelector(parts[i].trim()); if (el) return el; } catch (e) {}
    }
    return null;
  }

  function positionSpotlight(el) {
    if (!_spot) return;
    if (!el) { hide(_spot); return; }
    var r = el.getBoundingClientRect();
    var pad = 8;
    show(_spot);
    _spot.style.left   = (r.left   - pad) + "px";
    _spot.style.top    = (r.top    - pad) + "px";
    _spot.style.width  = (r.width  + pad * 2) + "px";
    _spot.style.height = (r.height + pad * 2) + "px";
  }

  function positionCard(targetEl) {
    if (!_card) return;
    var cw = _card.offsetWidth  || 560;
    var ch = _card.offsetHeight || 240;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var left = Math.round(vw / 2 - cw / 2);
    var top  = Math.round(vh / 2 - ch / 2);

    if (targetEl) {
      var r = targetEl.getBoundingClientRect();
      var belowTop  = r.bottom + 16;
      var aboveTop  = r.top - ch - 16;
      var clampL = function (l) { return Math.max(12, Math.min(vw - cw - 12, l)); };
      if (belowTop + ch < vh)    { top = belowTop; left = clampL(r.left); }
      else if (aboveTop > 0)     { top = aboveTop; left = clampL(r.left); }
      else                       { left = Math.round(vw / 2 - cw / 2); top = Math.max(16, Math.round(vh / 2 - ch / 2)); }
    }

    _card.style.left = left + "px";
    _card.style.top  = top  + "px";
  }

  /* ── Wire entry point ────────────────────────────────────────── */
  function wire() {
    var btn = id("mcqTourBtn");
    if (btn && !btn._tourWired) {
      btn._tourWired = true;
      btn.addEventListener("click", start);
    }
    resumeIfNeeded();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

})();
