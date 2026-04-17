/* menu-tour.js
 * Guided tour for the exercise menu page.
 * Uses ciTour* CSS classes (from assets/components/core/tour.css).
 * Same visual pattern as the dashboard tour.
 *
 * Steps: exercise cards → filter → search → exercise name →
 *        exercise category → difficulty level → completion status
 */
(function () {
  "use strict";

  /* ── Tour steps ─────────────────────────────────────────────── */
  var STEPS = [
    {
      selector: ".exercise-card",
      title: "Exercise Cards",
      body: "Each card represents one coding exercise. Click any card to open it in the exercise workspace. Cards show the exercise name, a short description, category, difficulty, and your completion status."
    },
    {
      selector: "#drawerTab",
      title: "Filters",
      body: "Click this tab (or press Ctrl+Shift+F) to open the filter drawer. Filter by category, difficulty, and completion status. Sort by name, difficulty, or status. Your filter selection is saved between visits."
    },
    {
      selector: "#menuSearch",
      title: "Search",
      body: "Type to instantly filter exercises by name or description. Results update as you type — no need to press Enter."
    },
    {
      selector: ".exercise-card .card-name, .exercise-card",
      title: "Exercise Name",
      body: "The exercise name describes what you need to solve. Harder exercises tend to have longer, more specific names. Click any card to start."
    },
    {
      selector: ".pill.cat, .exercise-card .pill",
      title: "Category",
      body: "The category tag shows which data structure or algorithm topic this exercise covers — for example: Arrays, Strings, Trees, or Dynamic Programming. Use the filter to focus on specific categories."
    },
    {
      selector: ".pill.level, .exercise-card .pill:nth-child(2)",
      title: "Difficulty Level",
      body: "Exercises are rated Beginner, Intermediate, or Advanced. Start with Beginner to build confidence, then work up through Intermediate to Advanced as your skills develop."
    },
    {
      selector: ".status-dot, .exercise-card .card-status",
      title: "Completion Status",
      body: "The status indicator shows whether you have Not Started, Attempted (partially completed), or Completed each exercise. Use the filter to see exercises by status — for example, to revisit ones you attempted but haven't solved yet."
    }
  ];

  /* ── State ──────────────────────────────────────────────────── */
  var _idx      = 0;
  var _active   = false;
  var _backdrop = null;
  var _spot     = null;
  var _card     = null;

  /* ── Build DOM ──────────────────────────────────────────────── */
  function buildUI() {
    if (_backdrop) return; // already built

    _backdrop = make("div", "ciTourBackdrop");
    _backdrop.id = "menuTourBackdrop";

    _spot = make("div", "ciTourSpotlight");
    _spot.id = "menuTourSpotlight";

    _card = make("div", "ciTourCard");
    _card.id = "menuTourCard";
    _card.setAttribute("role", "dialog");
    _card.setAttribute("aria-modal", "true");
    _card.setAttribute("aria-labelledby", "menuTourCardTitle");
    _card.setAttribute("tabindex", "-1");

    _card.innerHTML =
      "<div class=\"ciTourCardHead\">" +
        "<div>" +
          "<div class=\"ciTourCardTitle\" id=\"menuTourCardTitle\"></div>" +
          "<div class=\"ciTourCardMeta\" id=\"menuTourStep\"></div>" +
        "</div>" +
        "<button class=\"ciTourClose\" id=\"menuTourClose\" type=\"button\" aria-label=\"Close tour\">" +
          "&#x2715;" +
        "</button>" +
      "</div>" +
      "<div class=\"ciTourCardBody\" id=\"menuTourBody\"></div>" +
      "<div class=\"ciTourFoot\">" +
        "<span></span>" +
        "<div class=\"ciTourBtns\">" +
          "<button class=\"ciTourNavBtn\" id=\"menuTourBack\" type=\"button\">Back</button>" +
          "<button class=\"ciTourNavBtn primary\" id=\"menuTourNext\" type=\"button\">Next</button>" +
        "</div>" +
      "</div>";

    document.body.appendChild(_backdrop);
    document.body.appendChild(_spot);
    document.body.appendChild(_card);

    /* Wire buttons */
    _card.querySelector("#menuTourClose").addEventListener("click", stop);
    _card.querySelector("#menuTourBack").addEventListener("click", function () {
      if (_idx > 0) { _idx--; render(); }
    });
    _card.querySelector("#menuTourNext").addEventListener("click", function () {
      if (_idx < STEPS.length - 1) { _idx++; render(); }
      else stop();
    });

    /* Keyboard */
    document.addEventListener("keydown", function (e) {
      if (!_active) return;
      if (e.key === "Escape")     stop();
      if (e.key === "ArrowRight") { if (_idx < STEPS.length - 1) { _idx++; render(); } }
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

  /* ── Helpers ─────────────────────────────────────────────────── */
  function make(tag, cls) {
    var el = document.createElement(tag);
    el.className = cls;
    return el;
  }

  function getTarget(sel) {
    if (!sel) return null;
    var parts = sel.split(",");
    for (var i = 0; i < parts.length; i++) {
      try {
        var el = document.querySelector(parts[i].trim());
        if (el) return el;
      } catch (e) {}
    }
    return null;
  }

  function positionSpotlight(el) {
    if (!_spot) return;
    if (!el) {
      _spot.style.display = "none";
      return;
    }
    var r = el.getBoundingClientRect();
    var pad = 8;
    _spot.style.display  = "";
    _spot.style.left     = (r.left   - pad) + "px";
    _spot.style.top      = (r.top    - pad) + "px";
    _spot.style.width    = (r.width  + pad * 2) + "px";
    _spot.style.height   = (r.height + pad * 2) + "px";
  }

  function positionCard(targetEl) {
    if (!_card) return;
    var cw = _card.offsetWidth  || 460;
    var ch = _card.offsetHeight || 220;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var left = Math.round(vw / 2 - cw / 2);
    var top  = Math.round(vh / 2 - ch / 2);

    if (targetEl) {
      var r = targetEl.getBoundingClientRect();
      var belowTop  = r.bottom + 16;
      var aboveTop  = r.top    - ch - 16;
      var clampLeft = function (l) { return Math.max(12, Math.min(vw - cw - 12, l)); };

      if (belowTop + ch < vh) {
        top  = belowTop;
        left = clampLeft(r.left);
      } else if (aboveTop > 0) {
        top  = aboveTop;
        left = clampLeft(r.left);
      } else {
        /* default: centred */
        left = Math.round(vw / 2 - cw / 2);
        top  = Math.max(16, Math.round(vh / 2 - ch / 2));
      }
    }

    _card.style.left = left + "px";
    _card.style.top  = top  + "px";
  }

  /* ── Render current step ─────────────────────────────────────── */
  function render() {
    if (!_card) return;
    var step = STEPS[_idx];
    if (!step) return;

    var _title = _card.querySelector("#menuTourCardTitle");
    var _body  = _card.querySelector("#menuTourBody");
    var _step  = _card.querySelector("#menuTourStep");
    if (_title) _title.textContent = step.title;
    if (_body)  _body.textContent  = step.body;
    if (_step)  _step.textContent  = "Step " + (_idx + 1) + " of " + STEPS.length;

    var backBtn = _card.querySelector("#menuTourBack");
    var nextBtn = _card.querySelector("#menuTourNext");
    backBtn.disabled    = (_idx === 0);
    nextBtn.textContent = (_idx === STEPS.length - 1) ? "Finish" : "Next";

    var targetEl = getTarget(step.selector);
    if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

    /* Reposition after potential scroll */
    requestAnimationFrame(function () {
      var t = getTarget(step.selector);
      positionSpotlight(t);
      positionCard(t);
      _card.focus();
    });
  }

  /* ── Public API ──────────────────────────────────────────────── */
  function start() {
    buildUI();
    _idx    = 0;
    _active = true;
    _backdrop.style.display = "";
    _spot.style.display     = "";
    _card.style.display     = "";
    render();
  }

  function stop() {
    _active = false;
    if (_backdrop) _backdrop.style.display = "none";
    if (_spot)     _spot.style.display     = "none";
    if (_card)     _card.style.display     = "none";
    var btn = document.getElementById("menuTourBtn");
    if (btn) btn.focus();
  }

  /* ── Wire button ─────────────────────────────────────────────── */
  function wire() {
    var btn = document.getElementById("menuTourBtn");
    if (btn && !btn._tourWired) {
      btn._tourWired = true;
      btn.addEventListener("click", start);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
  document.addEventListener("cvMenuReady", wire);

})();
