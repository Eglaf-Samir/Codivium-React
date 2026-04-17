/* menu-data.js
 * Fetches the exercise menu payload for the current track,
 * renders cards into the grid, populates the category filter
 * checkboxes, and wires the search field.
 *
 * Depends on: drawer-and-filters.js (loaded after this file)
 * Expects in the DOM: #gridScroll > section.exercise-grid
 *                     #f-category  (the category checkbox group)
 *                     #menuSearch  (the search input)
 *                     #menuTrackTitle  (optional heading element)
 *
 * On successful load exposes: window.__cvMenuData (the payload)
 * so drawer-and-filters.js can access it if needed.
 *
 * Data contract (GET /api/menu/payload?track=...):
 * {
 *   track, trackLabel,
 *   categories: string[],
 *   difficultyLevels: string[],
 *   exercises: [{
 *     id, name, shortDescription, category, difficulty,
 *     completionStatus: "completed"|"attempted"|"not_started",
 *     completedAt: string|null
 *   }]
 * }
 */
(function () {
  'use strict';

  /* ── SVG icon library, keyed by canonical category name ──────
     Each entry is the inner content of a <svg viewBox="0 0 24 24">.
     Categories without a specific icon fall back to the generic one. */
  var ICONS = {
    /* ─── Data structures ──────────────────────────── */
    'arrays':
      '<path d="M4 4h7v7H4V4Z M13 4h7v7h-7V4Z M4 13h7v7H4v-7Z M13 13h7v7h-7v-7Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.4"/>',
    'strings':
      '<path d="M10.2 13.8l-1.4 1.4a4.5 4.5 0 1 1-6.4-6.4l1.4-1.4M13.8 10.2l1.4-1.4a4.5 4.5 0 1 1 6.4 6.4l-1.4 1.4M9.8 14.2l4.4-4.4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.6"/>',
    'linked lists':
      '<path d="M5 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M9 12h4M19 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M13 12h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'linked-lists':
      '<path d="M5 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M9 12h4M19 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M13 12h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'stacks':
      '<path d="M12 3l9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16.5l9 5 9-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
    'queues':
      '<path d="M3 8h18M3 12h14M3 16h10M17 12l4 4-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'hash tables':
      '<path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4zM9 4v16M15 4v16" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2"/>',
    'hash-tables':
      '<path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4zM9 4v16M15 4v16" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2"/>',
    'trees':
      '<path d="M12 3v4M5 10h14M5 10v4M19 10v4M12 10v4M3 17h5M10 17h4M17 17h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'graphs':
      '<circle cx="5" cy="12" r="2.4" stroke="currentColor" stroke-width="2.0"/><circle cx="12" cy="5" r="2.4" stroke="currentColor" stroke-width="2.0"/><circle cx="19" cy="12" r="2.4" stroke="currentColor" stroke-width="2.0"/><circle cx="12" cy="19" r="2.4" stroke="currentColor" stroke-width="2.0"/><path d="M7.4 10.6l3.2-3.2M14.6 6.8l2.8 3.6M17.4 13.4l-3.2 3.2M9.4 17.4l-2.8-3.6" stroke="currentColor" stroke-linecap="round" stroke-width="2.0"/>',
    'heaps':
      '<path d="M12 3l9 5v8l-9 5-9-5V8l9-5ZM12 3v18M3 8l9 5 9-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'tries':
      '<path d="M12 3v3M12 6l-5 4M12 6l5 4M7 10v3M17 10v3M7 13l-3 4M7 13l3 4M17 13l-3 4M17 13l3 4" stroke="currentColor" stroke-linecap="round" stroke-width="2.0"/>',
    'sets':
      '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" stroke-width="2.2"/><path d="M9 8a5 5 0 1 0 6.9 7" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'matrices':
      '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2"/>',
    /* ─── Algorithms ────────────────────────────────── */
    'sorting':
      '<path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"/>',
    'searching':
      '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"/>',
    'recursion':
      '<path d="M4 12a8 8 0 0 1 8-8M20 12a8 8 0 0 1-8 8M16 4l-4 4 4 4M8 20l4-4-4-4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'dynamic programming':
      '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"/><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" stroke="currentColor" stroke-linecap="round" stroke-width="3.0"/>',
    'dynamic-programming':
      '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"/><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" stroke="currentColor" stroke-linecap="round" stroke-width="3.0"/>',
    'greedy algorithms':
      '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'greedy-algorithms':
      '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'backtracking':
      '<path d="M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
    'divide and conquer':
      '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/><path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="currentColor" stroke-linecap="round" stroke-width="1.6"/>',
    'divide-and-conquer':
      '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/><path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="currentColor" stroke-linecap="round" stroke-width="1.6"/>',
    'two pointers':
      '<path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
    'two-pointers':
      '<path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
    'sliding window':
      '<path d="M3 6h18v12H3zM8 6v12M16 6v12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'sliding-window':
      '<path d="M3 6h18v12H3zM8 6v12M16 6v12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'binary search':
      '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35M8 11h6M11 8v6" stroke="currentColor" stroke-linecap="round" stroke-width="2.4"/>',
    'binary-search':
      '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35M8 11h6M11 8v6" stroke="currentColor" stroke-linecap="round" stroke-width="2.4"/>',
    /* ─── Topics ────────────────────────────────────── */
    'mathematical':
      '<path d="M12 6v6l4 2M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'math':
      '<path d="M12 6v6l4 2M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'bit manipulation':
      '<path d="M4 8h4M4 16h4M12 8h4M12 16h4M8 4v16M16 4v16" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'bit-manipulation':
      '<path d="M4 8h4M4 16h4M12 8h4M12 16h4M8 4v16M16 4v16" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'design':
      '<path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'intervals':
      '<path d="M3 6h18M3 10h12M3 14h6M15 10v8M19 10v8M15 14h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
    'concurrency':
      '<path d="M4 12h4M16 12h4M4 6l4 6-4 6M20 6l-4 6 4 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'geometry':
      '<path d="M3 20l9-16 9 16H3zM12 4v16M6 14h12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
    'number theory':
      '<path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" stroke-linecap="round" stroke-width="3.0"/><path d="M4 4h16v16H4z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"/>',
    /* ─── Fallback ──────────────────────────────────── */
    '_default':
      '<path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10ZM12 8v4M12 16h.01" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>'
  };;

  var STATUS_ICONS = {
    completed: '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.6"></path></svg>',
    attempted: '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"></path></svg>',
    not_started: '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"></path></svg>'
  };

  var STATUS_CLASS = { completed: 'done', attempted: 'attempted', not_started: 'todo' };
  var STATUS_LABEL = { completed: 'Completed', attempted: 'Attempted', not_started: 'Not started' };

  /* ── Helpers ───────────────────────────────────────────────── */

  function norm(s) {
    return String(s || '').trim().toLowerCase();
  }

  function iconSvg(category) {
    var key = norm(category);
    return '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">' +
      (ICONS[key] || ICONS['_default']) + '</svg>';
  }

  function truncate(s, max) {
    s = String(s || '');
    return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
  }

  /* ── Build one card element ────────────────────────────────── */

  function buildCard(ex, returnUrl) {
    var status       = ex.completionStatus || 'not_started';
    var statusKey    = status.replace(/-/g, '_');
    var statusCls    = STATUS_CLASS[statusKey] || 'todo';
    var statusLabel  = STATUS_LABEL[statusKey] || 'Not started';
    var diffCls      = norm(ex.difficulty);
    var diffLabel    = ex.difficulty
      ? ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1) : '';

    var encodedFrom  = encodeURIComponent(returnUrl);
    var href         = 'editor.html?id=' + encodeURIComponent(ex.id) +
                       '&from=' + encodedFrom;

    var a = document.createElement('a');
    a.className = 'exercise-card';
    a.href = href;
    a.setAttribute('aria-label', ex.name + ' (' + diffLabel + ')');
    // Data attributes for filter JS
    a.dataset.cat    = norm(ex.category);
    a.dataset.level  = norm(ex.difficulty);
    a.dataset.status = norm(statusKey.replace(/_/g, '-'));  // "not-started" etc.
    a.dataset.id     = ex.id;
    a.dataset.name   = norm(ex.name);
    a.dataset.desc   = norm(ex.shortDescription || '');

    a.innerHTML =
      '<div aria-hidden="true" class="card-icon">' + iconSvg(ex.category) + '</div>' +
      '<div aria-label="' + statusLabel + '" class="card-status ' + statusCls + '">' +
        (STATUS_ICONS[statusKey] || STATUS_ICONS['not_started']) +
      '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-title">' + escHtml(truncate(ex.name, 40)) + '</h3>' +
        '<div class="card-sub">' + escHtml(ex.name) + '</div>' +
        '<div class="card-desc">' + escHtml(ex.shortDescription || '') + '</div>' +
      '</div>' +
      '<div class="pill-row">' +
        '<span class="pill">' + escHtml(ex.category) + '</span>' +
        '<span class="pill pill-level ' + diffCls + '">' + escHtml(diffLabel) + '</span>' +
      '</div>';

    return a;
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Populate category filter checkboxes ───────────────────── */

  function populateCategoryFilter(categories) {
    var container = document.getElementById('f-category');
    if (!container) return;

    // Keep the "All" checkbox, remove any existing category-specific ones
    var allCheck = container.querySelector('input[value="all"]');
    var allLabel = allCheck ? allCheck.closest('label') : null;

    // Restore saved category selection from localStorage
    var savedKey = 'cv_menu_cat_filter';
    var savedCats = null;
    try {
      var raw = localStorage.getItem(savedKey);
      if (raw) savedCats = JSON.parse(raw);
    } catch(e) {}

    // Clear and rebuild
    container.innerHTML = '';
    if (allLabel) container.appendChild(allLabel);

    categories.forEach(function (cat) {
      var lbl = document.createElement('label');
      lbl.className = 'chk';
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.name = 'category';
      inp.value = norm(cat);
      // Restore saved state: if we have a saved list, use it; else leave unchecked (ALL handles it)
      if (savedCats && savedCats.length > 0) {
        inp.checked = savedCats.indexOf(norm(cat)) !== -1;
      }
      var span = document.createElement('span');
      span.textContent = cat;
      lbl.appendChild(inp);
      lbl.appendChild(span);
      container.appendChild(lbl);
    });

    // If we restored specific categories, uncheck ALL so individual selection shows
    if (savedCats && savedCats.length > 0 && allCheck) {
      allCheck.checked = false;
    }
  }

  /* ── Wire the search field ─────────────────────────────────── */

  function wireSearch() {
    var input = document.getElementById('menuSearch');
    if (!input) return;

    // Extend the global applyFilters to include search.
    // drawer-and-filters.js owns applyFilters; we patch it here.
    // We store the search term on the input element itself so
    // drawer-and-filters.js can read it without a global variable.
    input.addEventListener('input', function () {
      if (typeof window.__cvApplyFilters === 'function') {
        window.__cvApplyFilters();
      }
    });
  }

  /* ── Show/hide empty-state message ─────────────────────────── */

  function updateEmptyState(count) {
    var msg = document.getElementById('cvMenuEmpty');
    if (!msg) return;
    msg.style.display = count === 0 ? '' : 'none';
  }
  window.__cvUpdateEmptyState = updateEmptyState;

  /* ── Cursor tracking for cards (mirror drawer-and-filters) ─── */

  function attachCursorTracking(card) {
    var raf = 0;
    var last = null;
    function apply() {
      raf = 0;
      if (!last) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (((last.clientX - r.left) / r.width) * 100).toFixed(2) + '%');
      card.style.setProperty('--my', (((last.clientY - r.top) / r.height) * 100).toFixed(2) + '%');
    }
    card.addEventListener('mousemove', function (e) {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    card.addEventListener('mouseleave', function () {
      last = null;
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  }

  /* ── Loading state helpers ──────────────────────────────────── */

  function showLoading() {
    var grid = document.querySelector('.exercise-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="cv-menu-loading" id="cvMenuLoading">' +
      '<span>Loading exercises\u2026</span></div>';
  }

  function showError(msg) {
    var grid = document.querySelector('.exercise-grid');
    if (!grid) return;
    grid.innerHTML =
      '<div class="cv-menu-error" role="alert">' +
        '<p class="cv-menu-error-msg">Could not load exercises: ' + escHtml(msg) + '</p>' +
        '<button class="cv-menu-error-retry" onclick="location.reload()" type="button">' +
          'Retry' +
        '</button>' +
      '</div>';
  }

  /* ── Main: fetch payload and render ────────────────────────── */

  function init() {
    // Read track from URL param
    var params = new URLSearchParams(window.location.search || '');
    var track  = (params.get('track') || 'micro').toLowerCase();

    // Set page title and data-page from track label
    var trackLabels = { micro: 'Micro Challenge Menu', interview: 'Interview Questions Menu' };
    var trackLabel  = trackLabels[track] || 'Exercise Menu';

    // Update <body data-page> so sidebar.js shows the correct indicator
    document.body.dataset.page = trackLabel;

    // Update any visible track title element
    var titleEl = document.getElementById('menuTrackTitle');
    if (titleEl) titleEl.textContent = trackLabel;

    // Build the return URL (what the feedback modal's "Return to Menu" uses)
    var returnUrl = 'menu-page.html?track=' + encodeURIComponent(track);

    showLoading();

    // ── Try to use demo data first (window.__CODIVIUM_MENU_DATA__)
    // then fall back to the API. This allows server-side rendering
    // to embed the payload for instant load, matching the dashboard pattern.
    var payload = window.__CODIVIUM_MENU_DATA__ || null;

    if (payload) {
      render(payload, returnUrl);
      return;
    }

    // Fetch from API — 8 s timeout with one automatic retry on 503/429
    // Skip network call if no auth token — avoids an 8s timeout in demo/local mode
    var hasRealToken = !!(
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cv_auth_token')) ||
      (typeof localStorage   !== 'undefined' && localStorage.getItem('cv_auth_token'))
    );
    if (!hasRealToken) {
      showError('No exercises available. Please log in to view the exercise menu.');
      return;
    }

    __cvFetchWithRetry(
      '/api/menu/payload?track=' + encodeURIComponent(track),
      { headers: { 'Accept': 'application/json' } },
      8000,
      1
    )
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      render(data, returnUrl);
    })
    .catch(function (err) {
      var msg = err.name === 'AbortError'
        ? 'Request timed out — please check your connection and try again.'
        : (err.message || 'Unknown error');

      // S18: Graceful fallback — if demo data is available, render it silently
      // so the page remains functional rather than showing an error state.
      if (window.__CODIVIUM_MENU_DATA__) {
        console.warn('[Menu] API failed (' + msg + ') — falling back to embedded demo data.');
        render(window.__CODIVIUM_MENU_DATA__, returnUrl);
        return;
      }

      // No fallback available — show error with retry button
      showError(msg);
    });
  }

  function render(payload, returnUrl) {
    window.__cvMenuData = payload;

    // Set track title
    var rawLabel = payload.trackLabel || payload.track || 'Exercise Menu';
    var labelMap = { 'Micro Challenges': 'Micro Challenge Menu', 'Interview Preparation': 'Interview Questions Menu' };
    var trackLabel = labelMap[rawLabel] || rawLabel;
    document.body.dataset.page = trackLabel;
    var titleEl = document.getElementById('menuTrackTitle');
    if (titleEl) titleEl.textContent = trackLabel;
    // Update topbar active page indicator directly (sidebar.js reads body.data-page at load time only)

    // Populate category filter checkboxes
    if (payload.categories && payload.categories.length) {
      populateCategoryFilter(payload.categories);
    }

    // Render cards
    var grid = document.querySelector('.exercise-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var loading = document.getElementById('cvMenuLoading');
    if (loading) loading.remove();

    var exercises = payload.exercises || [];

    // Add empty-state placeholder (hidden by default).
    // Two messages: one for when the DB has no exercises yet, one for filter misses.
    var emptyMsg = document.createElement('div');
    emptyMsg.id = 'cvMenuEmpty';
    emptyMsg.className = 'cv-menu-empty';
    emptyMsg.dataset.total = String(exercises.length);  // lets filter JS know base count
    emptyMsg.textContent = exercises.length === 0
      ? 'No exercises are available for this track yet.'
      : 'No exercises match the current filters.';
    emptyMsg.style.display = exercises.length === 0 ? '' : 'none';
    grid.appendChild(emptyMsg);

    exercises.forEach(function (ex) {
      var card = buildCard(ex, returnUrl);
      attachCursorTracking(card);
      grid.appendChild(card);
    });

    // Signal to drawer-and-filters.js that cards are ready.
    document.dispatchEvent(new CustomEvent('cvMenuReady', {
      detail: { count: exercises.length, track: payload.track }
    }));

    // Wire search field
    wireSearch();

    // Persist category filter state whenever it changes
    // Wait for drawer-and-filters.js to wire checkboxes, then observe
    setTimeout(function() {
      var container = document.getElementById('f-category');
      if (!container) return;
      container.addEventListener('change', function() {
        var checked = Array.from(container.querySelectorAll('input[name="category"]:checked'))
          .map(function(i) { return i.value; })
          .filter(function(v) { return v !== 'all'; });
        var allBox = container.querySelector('input[value="all"]');
        try {
          if (allBox && allBox.checked) {
            localStorage.removeItem('cv_menu_cat_filter');
          } else {
            localStorage.setItem('cv_menu_cat_filter', JSON.stringify(checked));
          }
        } catch(e) {}
      });
    }, 300);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
