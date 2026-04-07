(() => {
  const SETTINGS_KEY = 'cv.mcq.settings';

  // ── Category data ─────────────────────────────────────────────────────────
  // CATEGORY_BANK is populated by loadCategories() from GET /api/mcq/categories.
  // It starts empty. If the API call fails, showCategoryError() shows a message
  // and the Start Quiz button is disabled until categories are available.
  let CATEGORY_BANK = [];
  let _categoryObjects = []; // full category objects from API {id, displayName}



  function el(id){ return document.getElementById(id); }

  function readSettings(){
    try{
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(_){
      return null;
    }
  }

  function writeSettings(settings){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(_){ /* noop */ }
  }


  /* ── URL parameter pre-seeding (P-INF-01) ───────────────────────────────────
   * Reads ?categories=&difficulty=&count=&skipCorrect=&source= from the URL.
   * Priority chain: URL params → localStorage → defaultSettings().
   * URL params pre-fill the UI but do NOT overwrite localStorage — only the
   * "Start Quiz" button writes to localStorage, preserving the user's ability
   * to adjust before launching.
   * Used by adaptive-practice.html to launch a pre-configured quiz in one click.
   *
   * ?source=adaptive  — shows a context banner explaining the recommendation origin
   * ?categories=      — comma-separated category display names (URL-encoded)
   * ?difficulty=      — basic | intermediate | advanced
   * ?count=           — integer 1–50
   * ?skipCorrect=     — true | false
   */
  function readUrlParams() {
    try {
      const p = new URLSearchParams(window.location.search || '');
      const cats = p.get('categories');
      const diff = p.get('difficulty');
      const cnt  = p.get('count');
      const skip = p.get('skipCorrect');
      const src  = p.get('source');

      const result = {};
      if (cats)  result.categories   = cats.split(',').map(c => decodeURIComponent(c.trim())).filter(Boolean);
      if (diff && ['basic','intermediate','advanced'].includes(diff)) result.difficulty = diff;
      if (cnt)   result.questionCount = Math.max(1, Math.min(50, parseInt(cnt, 10) || 10));
      if (skip)  result.skipCorrect   = skip === 'true';
      if (src)   result.source        = src;

      return Object.keys(result).length > 0 ? result : null;
    } catch(_) { return null; }
  }

  /* Merge URL params over a settings object without mutating it */
  function applyUrlParams(settings, urlParams) {
    if (!urlParams) return settings;
    return Object.assign({}, settings, urlParams);
  }

  function defaultSettings(){
    return {
      categories: [...CATEGORY_BANK],   // Default: all topics
      difficulty: 'basic',              // Default: Basic
      questionCount: 10,                // Default: 10
      skipCorrect: false                // Default: Off
    };
  }

  // --- Categories (checkbox list) -------------------------------------------------


  function populateCategories(selected){
    const wrap = el('categoryList');
    if (!wrap) return;

    wrap.innerHTML = '';

    const selectedSet = new Set(selected || []);

    CATEGORY_BANK.forEach((name) => {
      const row = document.createElement('div');
      row.className = 'category-row';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = name;
      cb.id = `cat_${name.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}`;
      cb.checked = selectedSet.has(name);

      const lab = document.createElement('label');
      lab.htmlFor = cb.id;
      lab.textContent = name;

      row.appendChild(cb);
      row.appendChild(lab);
      wrap.appendChild(row);
    });

    syncSelectAllState();
    syncRowSelectedStyles();
  }


  function getSelectedCategories(){
    const wrap = el('categoryList');
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll('input[type="checkbox"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }

  function setCategoryChecked(value, checked){
    const wrap = el('categoryList');
    if (!wrap) return;
    const cb = Array.from(wrap.querySelectorAll('input[type="checkbox"]')).find(x => x.value === value);
    if (cb){ cb.checked = checked; }
  }

  function setAllCategories(checked){
    const wrap = el('categoryList');
    if (!wrap) return;
    wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = checked; });
    syncSelectAllState();
    syncRowSelectedStyles();
  }

  function syncSelectAllState(){
    const all = el('catAll');
    const wrap = el('categoryList');
    if (!all || !wrap) return;

    const cbs = Array.from(wrap.querySelectorAll('input[type="checkbox"]'));
    const checked = cbs.filter(x => x.checked).length;

    all.indeterminate = checked > 0 && checked < cbs.length;
    all.checked = checked === cbs.length;
  }

  function syncRowSelectedStyles(){
    const wrap = el('categoryList');
    if (!wrap) return;
    wrap.querySelectorAll('.category-row').forEach((row) => {
      const cb = row.querySelector('input[type="checkbox"]');
      row.classList.toggle('is-selected', !!(cb && cb.checked));
    });
  }

  // View mode: All | Selected
  let categoryView = 'all'; // 'all' | 'selected'


  function applyCategoryView(){
    const wrap = el('categoryList');
    if (!wrap) return;

    wrap.querySelectorAll('.category-row').forEach((row) => {
      const cb = row.querySelector('input[type="checkbox"]');
      const show = categoryView === 'all' ? true : !!(cb && cb.checked);
      row.style.display = show ? '' : 'none';
    });
  }


  // --- Mode tabs (Simple / Power) -------------------------------------------------

  function initModeTabs(){
    const panel = el('catPanel');
    const tabSimple = el('tabSimple');
    const tabPower = el('tabPower');
    const tabSimpleBody = el('catTabSimple');
    const tabPowerBody = el('catTabPower');
    if (!panel || !tabSimple || !tabPower || !tabSimpleBody || !tabPowerBody) return;

    function setMode(mode){
      panel.dataset.mode = mode;

      const isSimple = mode === 'simple';
      tabSimple.classList.toggle('is-active', isSimple);
      tabPower.classList.toggle('is-active', !isSimple);
      tabSimple.setAttribute('aria-selected', isSimple ? 'true' : 'false');
      tabPower.setAttribute('aria-selected', !isSimple ? 'true' : 'false');

      // Show/hide panels via .is-active class only.
      // CSS in mcq-setup-overrides.css sets both panels to display:none at ID
      // specificity, then .is-active { display:flex/block !important } wins.
      tabSimpleBody.classList.toggle('is-active', isSimple);
      tabPowerBody.classList.toggle('is-active', !isSimple);
      tabSimpleBody.setAttribute('aria-hidden', isSimple ? 'false' : 'true');
      tabPowerBody.setAttribute('aria-hidden', !isSimple ? 'false' : 'true');

      // Close palette dropdown if leaving power mode.
      if (isSimple){
        const dd = el('catPaletteDropdown');
        const inp = el('catPaletteInput');
        if (dd) dd.classList.remove('open');
        if (inp){
          inp.setAttribute('aria-expanded', 'false');
          inp.value = '';
        }
        clearMatchHighlights();
      }
    }

    tabSimple.addEventListener('click', () => setMode('simple'));
    tabPower.addEventListener('click', () => setMode('power'));

    // Default
    setMode('simple');
  }

  // --- Category meta bar (Selected count + All/Selected + Clear) ------------------

  function syncCatMeta(){
    const out = el('catCountText');
    if (!out) return;

    const selected = getSelectedCategories();
    const n = selected.length;

    if (n === CATEGORY_BANK.length){
      out.textContent = `Selected: All (${CATEGORY_BANK.length})`;
    }else{
      out.textContent = `Selected: ${n}`;
    }
  }

  function initCatMeta(){
    const btnAll = el('catViewAll');
    const btnSel = el('catViewSelected');
    const clear = el('catClear');
    if (!btnAll || !btnSel || !clear) return;

    const setView = (v) => {
      categoryView = v;
      btnAll.classList.toggle('is-active', v === 'all');
      btnSel.classList.toggle('is-active', v === 'selected');
      btnAll.setAttribute('aria-selected', v === 'all' ? 'true' : 'false');
      btnSel.setAttribute('aria-selected', v === 'selected' ? 'true' : 'false');
      applyCategoryView();
          dispatchCatSync();
    };

    btnAll.addEventListener('click', () => setView('all'));
    btnSel.addEventListener('click', () => setView('selected'));

    clear.addEventListener('click', () => {
      setAllCategories(false);
      syncCatMeta();
      applyCategoryView();
      dispatchCatSync();
    });

    setView('all');
  }

  // --- Power palette (type-to-search + Enter selects matches) ---------------------

  function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function makeRegex(q){
    if (!q) return null;
    try{ return new RegExp(q, 'i'); }
    catch(_){
      try{ return new RegExp(escapeRegExp(q), 'i'); }
      catch(__){ return null; }
    }
  }

  function clearMatchHighlights(){
    const wrap = el('categoryList');
    if (!wrap) return;
    wrap.querySelectorAll('.category-row.is-match').forEach(r => r.classList.remove('is-match'));
  }

  /**
   * Highlight matching items in the checkbox list beneath the palette.
   * Returns the matching category names.
   */
  function highlightCategoryList(q){
    const wrap = el('categoryList');
    if (!wrap) return [];
    const rows = Array.from(wrap.querySelectorAll('.category-row'));
    rows.forEach(r => r.classList.remove('is-match'));

    const qq = (q || '').trim();
    if (!qq) return [];

    const rx = makeRegex(qq);
    if (!rx) return [];

    const matches = [];
    rows.forEach((row) => {
      const cb = row.querySelector('input[type="checkbox"]');
      const name = cb ? cb.value : row.textContent.trim();
      if (rx.test(name)){
        row.classList.add('is-match');
        matches.push(name);
      }
    });
    return matches;
  }

  function initCategoryPalette(){
    const control = el('catPaletteControl');
    const input = el('catPaletteInput');
    const browse = el('catPaletteBrowse');
    const dropdown = el('catPaletteDropdown');
    if (!control || !input || !browse || !dropdown) return;

    let isOpen = false;

    function open(){
      isOpen = true;
      dropdown.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      render();
    }

    function close(){
      isOpen = false;
      dropdown.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
      clearMatchHighlights();
    }

    function outsideClick(e){
      if (!control.contains(e.target)) close();
    }

    function renderOption(label, checked){
      const row = document.createElement('div');
      row.className = 'popt';
      row.setAttribute('role', 'option');

      const main = document.createElement('div');
      main.className = 'popt-main';

      const box = document.createElement('div');
      box.className = 'popt-check';
      box.textContent = checked ? '✓' : '';
      main.appendChild(box);

      const text = document.createElement('div');
      text.className = 'popt-label';
      text.textContent = label;
      main.appendChild(text);

      row.appendChild(main);

      row.addEventListener('click', () => {
        const selected = new Set(getSelectedCategories());
        setCategoryChecked(label, !selected.has(label));
        syncSelectAllState();
        syncRowSelectedStyles();
        syncCatMeta();
        applyCategoryView();
        dispatchCatSync();
        render();
      });

      return row;
    }

    function render(){
      if (!isOpen) return;

      const q = (input.value || '').trim().toLowerCase();
      dropdown.innerHTML = '';

      const head = document.createElement('div');
      head.className = 'pdrop-head';
      const t = document.createElement('div');
      t.className = 'pdrop-title';
      t.textContent = q ? 'Search results' : `All categories (${CATEGORY_BANK.length})`;
      head.appendChild(t);
      dropdown.appendChild(head);

      const scroll = document.createElement('div');
      scroll.className = 'pdrop-scroll';

      const selected = new Set(getSelectedCategories());

      const items = q
        ? CATEGORY_BANK.filter(n => n.toLowerCase().includes(q)).slice(0, 30)
        : CATEGORY_BANK;

      if (!items.length){
        const empty = document.createElement('div');
        empty.className = 'pdrop-empty';
        empty.textContent = 'No matches.';
        scroll.appendChild(empty);
      }else{
        items.forEach((name) => scroll.appendChild(renderOption(name, selected.has(name))));
      }

      dropdown.appendChild(scroll);
    }

    browse.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isOpen){
        open();
        document.addEventListener('mousedown', outsideClick);
      }else{
        close();
        document.removeEventListener('mousedown', outsideClick);
      }
      input.focus();
    });

    input.addEventListener('focus', () => {
      if (!isOpen){
        open();
        document.addEventListener('mousedown', outsideClick);
      }
    });

    input.addEventListener('input', () => {
      if (!isOpen) open();
      highlightCategoryList(input.value);
      render();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown'){
        if (!isOpen){
          open();
          document.addEventListener('mousedown', outsideClick);
        }
        e.preventDefault();
      }
      if (e.key === 'Escape'){
        close();
        document.removeEventListener('mousedown', outsideClick);
      }
      if (e.key === 'Enter'){
        const q = (input.value || '').trim();
        if (q){
          // Add ALL regex matches; then clear.
          const matches = highlightCategoryList(q);
          if (matches.length){
            const selected = new Set(getSelectedCategories());
            let changed = false;
            matches.forEach((name) => {
              if (!selected.has(name)){
                setCategoryChecked(name, true);
                changed = true;
              }
            });
            if (changed){
              syncSelectAllState();
              syncRowSelectedStyles();
              syncCatMeta();
              applyCategoryView();
              dispatchCatSync();
            }
          }
          input.value = '';
          clearMatchHighlights();
          render();
          e.preventDefault();
          return;
        }

        // If no query, pick the first option.
        if (isOpen){
          const first = dropdown.querySelector('.popt');
          if (first){ first.click(); e.preventDefault(); }
        }
      }
    });
  }

  // --- Simple pill filter ----------------------------------------------------------


  function initSimpleFilter(){
    const wrap = el('simpleCatGroups');
    const search = el('simpleSearch');
    const btnAll = el('pillsSelectAll');
    const btnClear = el('pillsClearAll');
    if (!wrap) return;

    let query = '';

    function render(){
      wrap.innerHTML = '';

      const selected = new Set(getSelectedCategories());
      const rx = query ? makeRegex(query) : null;

      const grid = document.createElement('div');
      grid.className = 'simple-pillgrid simple-pillgrid-flat';

      CATEGORY_BANK.forEach((name, idx) => {
        const pill = document.createElement('div');
        pill.className = 'pill';

        const id = `sp_${idx}`;

        const input = document.createElement('input');
        input.id = id;
        input.type = 'checkbox';
        input.checked = selected.has(name);

        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = name;

        const match = !rx || rx.test(name);
        const show = match && (categoryView === 'all' || input.checked);
        pill.style.display = show ? '' : 'none';

        input.addEventListener('change', () => {
          setCategoryChecked(name, input.checked);
          syncSelectAllState();
          syncRowSelectedStyles();
          syncCatMeta();
          applyCategoryView();
          dispatchCatSync();
          render();
        });

        pill.appendChild(input);
        pill.appendChild(label);

        if (input.checked) pill.classList.add('is-picked');

        grid.appendChild(pill);
      });

      wrap.appendChild(grid);
    }

    if (search){
      search.addEventListener('input', () => {
        query = (search.value || '').trim();
        render();
      });
    }

    if (btnAll){
      btnAll.addEventListener('click', () => {
        setAllCategories(true);
        syncCatMeta();
        applyCategoryView();
        dispatchCatSync();
        render();
      });
    }

    if (btnClear){
      btnClear.addEventListener('click', () => {
        setAllCategories(false);
        syncCatMeta();
        applyCategoryView();
        dispatchCatSync();
        render();
      });
    }

    document.addEventListener('cv:mcq-cats-sync', render);
    render();
  }


  function dispatchCatSync(){
    document.dispatchEvent(new Event('cv:mcq-cats-sync'));
  }

  // --- Info rail ------------------------------------------------------------------

  function initInfoRail(){
    const titleEl = el('infoRailTitle');
    const bodyEl = el('infoRailBody');
    const clear = el('infoRailClear');
    if (!titleEl || !bodyEl) return;

    const INFO = {
      purpose: {
        title: 'What this is for',
        body: `
          <p>The purpose of the Multiple-Choice Quizzes is to help you identify your strengths and, even more importantly, your weaknesses in areas of python coding and programming generally.</p>
          <p>The suggested way to approach this is to select a single difficulty level and go one topic at a time, so that you can identify what level your knowledge is of that particular topic. You can also select multiple topics — even all topics — if you wish.</p>
          <p>You can then go back and improve your skills and knowledge in any topics where the quizzes show you have a gap, or some level of weakness.</p>
          <p><b>When you’re ready:</b> set your filters, then press <b>Start Quiz</b>.</p>
        `
      },
      mode: {
        title: 'Simple vs Power Filter',
        body: `
          <p><b>Simple Filter</b> is a visual, low-noise way to choose categories using pills.</p>
          <p><b>Power Filter</b> is fastest when you know what you want:</p>
          <ul>
            <li>Type to search.</li>
            <li>Matching categories in the list are highlighted.</li>
            <li>Press <b>Enter</b> to select all matches.</li>
          </ul>
        `
      },
      category: {
        title: 'What is a category?',
        body: `
          <p><b>Categories</b> are the topics you’ll be tested on (for example: Data Types &amp; Data Structures, Regular Expressions, Functions).</p>
          <ul>
            <li>Select <b>one</b> category to focus your practice, or select <b>multiple</b> to mix topics.</li>
            <li><b>Select all</b> chooses every category in the list.</li>
            <li>Use <b>All / Selected</b> to switch between the full list and only the categories you’ve chosen.</li>
          </ul>
          <p>In the future, categories will be grouped into <b>Category Classes</b> (collections of related categories).</p>
          <p><b>Right now</b>, all categories belong to one class: <b>General Python</b>. Soon, Codivium will add more classes such as <b>Numpy</b>, <b>Pandas</b>, <b>Machine Learning</b>, and more.</p>
        `
      },

      selectedview: {
        title: 'All vs Selected (view) + Clear',
        body: `
          <p>The <b>All / Selected</b> switch is a <b>view filter</b> — it changes what you see, not what you’ve chosen.</p>
          <ul>
            <li><b>All</b> shows the full list so you can add more categories.</li>
            <li><b>Selected</b> shows only what you’ve chosen — great for reviewing and removing items without noise.</li>
          </ul>
          <p><b>Clear</b> removes all selected categories in one step. Use it when you want to start fresh.</p>
          <p>Tip: if you’re in <b>Selected</b> view and need to add topics, switch back to <b>All</b>.</p>
        `
      },
      difficulty: {
        title: 'Difficulty levels',
        body: `
          <p>Choose the level that matches how challenging you want the quiz to be:</p>
          <ul>
            <li><b>Basic</b>: fundamentals and core concepts.</li>
            <li><b>Intermediate</b>: multi-step reasoning and common patterns.</li>
            <li><b>Advanced</b>: harder edge-cases, deeper understanding, and trickier problems.</li>
          </ul>
          <p>Tip: stick to <b>one difficulty</b> while focusing on a topic, then move up when you’re consistently strong.</p>
        `
      },
      qcount: {
        title: 'Number of questions',
        body: `
          <p>This sets <b>how many questions</b> will be included in your quiz session.</p>
          <ul>
            <li>Use the slider to choose any value between <b>10</b> and <b>50</b>.</li>
            <li>Use <b>Min</b> / <b>Max</b> for one-tap presets.</li>
          </ul>
        `
      },
      exclude: {
        title: 'Exclude previously-correct questions',
        body: `
          <p>If enabled, the quiz will <b>avoid questions you’ve previously answered correctly</b> (when your history is available).</p>
          <p>This helps you spend more time on areas you still need to improve.</p>
        `
      }
    };

    const setContent = (key) => {
      const c = INFO[key];
      if (!c) return;
      titleEl.textContent = c.title;
      bodyEl.innerHTML = c.body;
      bodyEl.scrollTop = 0;
    };

    const wire = (id, key) => {
      const btn = el(id);
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContent(key);
      });
    };

    wire('modeInfo', 'mode');
    wire('qgInfo', 'purpose');
    wire('catInfo', 'category');
    wire('diffInfo', 'difficulty');
    wire('countInfo', 'qcount');
    wire('selectedViewInfo', 'selectedview');
    wire('excludeInfo', 'exclude');
    wire('excludeGuideInfo', 'exclude');

    if (clear){
      clear.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        titleEl.textContent = 'Info';
        bodyEl.innerHTML = '<div class="rail-muted">Click an “i” to view a clear explanation.</div>';
      });
    }

    setContent('purpose');
  }

  // --- Question count -------------------------------------------------------------

  function syncQuestionCountUI(val){
    const span = el('qCountValue');
    if (span) span.textContent = String(val);
  }

  function syncRangeFill(){
    const range = el('qCount');
    if (!range) return;
    const min = Number(range.min || 0);
    const max = Number(range.max || 100);
    const v = Number(range.value);
    const pct = (max > min) ? ((v - min) / (max - min)) * 100 : 0;
    range.style.setProperty('--pct', `${Math.max(0, Math.min(100, pct))}%`);
  }

  // --- Summary rail ---------------------------------------------------------------

  function initSummaryPanel(){
    const ladder = el('diffLadder');
    const outCount = el('sumCount');
    const outCats = el('sumCats');
    const outExclude = el('sumExclude');

    let expanded = false;

    function setLadder(diff){
      if (!ladder) return;
      const order = ['basic','intermediate','advanced'];
      const idx = Math.max(0, order.indexOf(diff));
      ladder.querySelectorAll('.ladder-step').forEach((s) => {
        const si = order.indexOf(s.dataset.level);
        s.classList.toggle('is-active', si !== -1 && si <= idx);
      });
    }

    function renderCats(list){
      if (!outCats) return;
      outCats.innerHTML = '';

      const cats = (list && list.length) ? list : [...CATEGORY_BANK];

      // Display "All" as one pill.
      if (cats.length === CATEGORY_BANK.length){
        const pill = document.createElement('div');
        pill.className = 'summary-pill';
        pill.textContent = `All categories (${CATEGORY_BANK.length})`;
        outCats.appendChild(pill);
        return;
      }

      const MAX = expanded ? 999 : 5;
      const show = cats.slice(0, MAX);

      show.forEach((name) => {
        const pill = document.createElement('div');
        pill.className = 'summary-pill';
        pill.textContent = name;
        outCats.appendChild(pill);
      });

      if (!expanded && cats.length > MAX){
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'summary-more';
        more.textContent = `+${cats.length - MAX} more`;
        more.addEventListener('click', () => {
          expanded = true;
          renderCats(getSelectedCategories());
        });
        outCats.appendChild(more);
      }else if (expanded && cats.length > 6){
        const less = document.createElement('button');
        less.type = 'button';
        less.className = 'summary-more';
        less.textContent = 'Show less';
        less.addEventListener('click', () => {
          expanded = false;
          renderCats(getSelectedCategories());
        });
        outCats.appendChild(less);
      }
    }

    function update(){
      const difficultyEl = document.querySelector('input[name="difficulty"]:checked');
      const diff = difficultyEl ? difficultyEl.value : 'basic';
      setLadder(diff);

      const range = el('qCount');
      const count = range ? Number(range.value) : 10;
      if (outCount) outCount.textContent = String(Number.isFinite(count) ? count : 10);

      const skip = el('skipCorrect');
      const isSkip = !!(skip && skip.checked);
      if (outExclude){
        outExclude.textContent = isSkip
          ? 'The quiz will not show questions which you have already answered correctly in previous quizzes'
          : 'The quiz will select from the full set of available questions, whether you have answered them before or not.';
      }

      renderCats(getSelectedCategories());
      syncCatMeta();
    }

    const range = el('qCount');
    if (range) range.addEventListener('input', update);

    document.querySelectorAll('input[name="difficulty"]').forEach((i) => i.addEventListener('change', update));

    const skip = el('skipCorrect');
    if (skip) skip.addEventListener('change', update);

    const wrap = el('categoryList');
    if (wrap) wrap.addEventListener('change', update);

    document.addEventListener('cv:mcq-cats-sync', update);

    update();
  }

  // --- Messaging -----------------------------------------------------------------

  function showMsg(text){
    const msg = el('msg');
    if (!msg) return;
    msg.textContent = text;
    msg.classList.add('show');
  }

  function hideMsg(){
    const msg = el('msg');
    if (!msg) return;
    msg.classList.remove('show');
  }

  // --- Boot ----------------------------------------------------------------------


  // --- Profile hydration (migrated from shared.js — runs when sidebar.js is absent) ----------
  // When integrated into the package, sidebar.js does NOT hydrate profile images.
  // This fills the profile card from localStorage keys matching shared.js format.
  // Keys: cv.profileImage (data URL), cv.profileName (string)

  function hydrateProfile(){
    const imgEl = document.getElementById('profileImg');
    const nameEl = document.getElementById('profileName');
    if (!imgEl && !nameEl) return;
    let img = null, name = null;
    try{
      img  = localStorage.getItem('cv_profile_image');
      name = localStorage.getItem('cv_profile_name');
    }catch(_){}
    if (imgEl && img) imgEl.src = img;
    if (nameEl) nameEl.textContent = (name && name.trim()) ? name.trim() : 'Profile';
  }

  // --- Glow-follow cursor highlight (migrated from shared.js) -------------------------
  // When integrated, sidebar.js does NOT include this handler.
  // global.js does NOT include it either — it lives here for the MCQ pages.
  // Uses pointermove/pointerleave so CSS radial gradients can track the cursor.


  // --- Active sidebar link (migrated + corrected from shared.js) -------------------------
  // shared.js read data-page from document.documentElement (the <html> element).
  // Our HTML fix (A6) correctly puts data-page on <body> to match package sidebar.js.
  // This version reads from document.body.dataset.page — consistent with the package.

  function setActiveSideLink(){
    const current = (document.body && document.body.dataset && document.body.dataset.page) || '';
    if (!current) return;
    document.querySelectorAll('.side-link').forEach((a) => {
      a.classList.toggle('active', (a.getAttribute('data-section') || '') === current.toLowerCase() ||
        (a.getAttribute('data-page') || '') === current.toLowerCase());
    });
  }

  // Note: shared.js included a default-collapse for max-width:920px screens.
  // When integrated with the package, sidebar.js handles this via its own
  // state restoration logic. Do NOT duplicate it here.

  // --- Mini popover (#miniPop) -------------------------------------------------------
  // Floating opaque dialog for notices (e.g. Coming Soon).
  // Usage: window.mcqShowPop('Title', 'Body text') or mcqShowPop('Title', htmlString, true)
  // The dialog has no wired trigger in the current HTML — this exposes a public API
  // for mcq-parent.js or future callers to open it.

  const _pop = {
    overlay: null, title: null, body: null, close: null, _lastFocus: null
  };

  function initMiniPop(){
    _pop.overlay = document.getElementById('miniPop');
    _pop.title   = document.getElementById('miniPopTitle');
    _pop.body    = document.getElementById('miniPopBody');
    _pop.close   = document.getElementById('miniPopClose');
    if (!_pop.overlay) return;

    _pop.close && _pop.close.addEventListener('click', closeMiniPop);

    // Close on Escape
    _pop.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){ e.preventDefault(); closeMiniPop(); }
    });

    // Close on backdrop click (click outside the inner dialog box)
    _pop.overlay.addEventListener('click', (e) => {
      if (e.target === _pop.overlay) closeMiniPop();
    });
  }

  function openMiniPop(titleText, bodyHTML, isHtml){
    if (!_pop.overlay) return;
    _pop.lastFocus = document.activeElement;
    if (_pop.title) _pop.title.textContent = titleText || 'Notice';
    if (_pop.body){
      if (isHtml) _pop.body.innerHTML = bodyHTML || '';
      else        _pop.body.textContent = bodyHTML || '';
    }
    _pop.overlay.hidden = false;
    _pop.overlay.removeAttribute('hidden');
    // Move focus to close button (first focusable element)
    requestAnimationFrame(() => {
      const first = _pop.overlay.querySelector('button, [tabindex]');
      if (first) first.focus();
    });
    // Focus trap: keep Tab cycling inside the pop-up
    function trapFocus(e) {
      if (e.key !== 'Tab' && e.key !== 'Escape') return;
      if (e.key === 'Escape') { closeMiniPop(); return; }
      const focusable = Array.from(_pop.overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hidden && !el.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    _pop.overlay._trap = trapFocus;
    _pop.overlay.addEventListener('keydown', trapFocus);
  }

  function closeMiniPop(){
    if (!_pop.overlay) return;
    _pop.overlay.hidden = true;
    // Remove focus trap
    if (_pop.overlay._trap) {
      _pop.overlay.removeEventListener('keydown', _pop.overlay._trap);
      _pop.overlay._trap = null;
    }
    // Restore focus to trigger
    if (_pop.lastFocus && typeof _pop.lastFocus.focus === 'function'){
      _pop.lastFocus.focus();
    }
    _pop.lastFocus = null;
  }

  /* ── Category loader: GET /api/mcq/categories ─────────────────────────────
   * Populates CATEGORY_BANK from the API. If the API fails or returns no
   * categories, showCategoryError() is called and Start Quiz is disabled.
   * ─────────────────────────────────────────────────────────────────────── */
  async function loadCategories() {
    try {
      // Skip network call only if no auth token AND no demo mock is in place.
      // demo_mcq_categories.js monkey-patches __cvFetchWithRetry to return fake data —
      // if that mock is present, let the call proceed so the mock can intercept it.
      const hasRealToken = !!(
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cv_auth_token')) ||
        (typeof localStorage   !== 'undefined' && localStorage.getItem('cv_auth_token'))
      );
      const hasDemoMock = window.__CODIVIUM_MCQ_CATEGORIES_MOCKED__ === true;
      if (!hasRealToken && !hasDemoMock) throw new Error('No auth token');

      const res = await __cvFetchWithRetry('/api/mcq/categories', {
        headers: getAuthHeaders({ 'Accept': 'application/json' })
      }, 5000, 1);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        // Populate with displayName strings (what settings store)
        CATEGORY_BANK = data.categories.map(c => c.displayName);
        // Store the full objects for id→displayName mapping
        _categoryObjects = data.categories;
      } else {
        throw new Error('No categories returned');
      }
    } catch (err) {
      const reason = err.name === 'AbortError' ? 'Request timed out' : err.message;
      console.warn('[MCQ] Could not load categories from API:', reason);
      // Leave CATEGORY_BANK empty — caller handles the error state
      throw err;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const urlParams  = readUrlParams();
    const settings   = applyUrlParams(readSettings() || defaultSettings(), urlParams);

    // Show adaptive-source banner if launched from adaptive practice page
    const sourceBanner = el('apSourceBanner');
    if (sourceBanner) sourceBanner.hidden = !(urlParams && urlParams.source === 'adaptive');

    initModeTabs();
    initInfoRail();
    initCatMeta();

    // Categories
    populateCategories(settings.categories);

    // Power palette
    initCategoryPalette();

    // Simple pills
    initSimpleFilter();

    // Select all checkbox
    const catAll = el('catAll');
    if (catAll){
      catAll.addEventListener('change', () => {
        setAllCategories(catAll.checked);
        syncCatMeta();
        applyCategoryView();
        dispatchCatSync();
      });
    }

    const categoryList = el('categoryList');
    if (categoryList){
      categoryList.addEventListener('change', (e) => {
        const t = e.target;
        if (t && t.matches('input[type="checkbox"]')){
          syncSelectAllState();
          syncRowSelectedStyles();
          syncCatMeta();
          applyCategoryView();
          dispatchCatSync();
        }
      });
    }

    // Apply initial view and meta
    syncCatMeta();
    applyCategoryView();

    // Difficulty default
    const diff = settings.difficulty || 'basic';
    const diffInput = document.querySelector(`input[name="difficulty"][value="${diff}"]`);
    if (diffInput) diffInput.checked = true;

    // Count default
    const range = el('qCount');
    if (range){
      range.value = String(settings.questionCount || 10);
      syncQuestionCountUI(range.value);
      syncRangeFill();
      range.addEventListener('input', () => {
        syncQuestionCountUI(range.value);
        syncRangeFill();
      });
    }

    const setMin = el('setMin');
    const setMax = el('setMax');
    if (setMin && range){
      setMin.addEventListener('click', () => {
        range.value = '10';
        range.dispatchEvent(new Event('input', { bubbles:true }));
      });
    }
    if (setMax && range){
      setMax.addEventListener('click', () => {
        range.value = '50';
        range.dispatchEvent(new Event('input', { bubbles:true }));
      });
    }

    // Skip correct default
    const skip = el('skipCorrect');
    if (skip) skip.checked = !!settings.skipCorrect;

    // Summary rail
    initSummaryPanel();

    // Migrated from shared.js (package sidebar.js handles sidebar; these are MCQ-specific)
    hydrateProfile();
    setActiveSideLink();
    initGlowFollow();
    initMiniPop();

    // Start Quiz button — declared here so both the loadCategories promise
    // branches (then/catch) can enable or disable it.
    const start = el('startQuiz');

    // Disable immediately — re-enabled only after categories load successfully
    if (start) {
      start.disabled = true;
      start.setAttribute('aria-disabled', 'true');
    }

    // Load categories from API, then render the category list
    loadCategories().then(() => {
      // Render category list with live data from API
      const pillWrap = el('categoryList');
      if (pillWrap) {
        const currentSelected = new Set(getSelectedCategories());
        pillWrap.innerHTML = '';
        CATEGORY_BANK.forEach((name) => {
          const row = document.createElement('div');
          row.className = 'category-row';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = name;
          cb.id = 'cat_' + name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
          cb.checked = currentSelected.has(name);
          const lab = document.createElement('label');
          lab.htmlFor = cb.id;
          lab.textContent = name;
          row.appendChild(cb);
          row.appendChild(lab);
          pillWrap.appendChild(row);
        });
        syncSelectAllState();
        syncRowSelectedStyles();
      }
      // Trigger initSimpleFilter's own render via its event listener —
      // this re-renders the pills with all their proper click handlers intact.
      document.dispatchEvent(new CustomEvent('cv:mcq-cats-sync'));
      syncCatMeta();
      if (start) {
        start.disabled = false;
        start.removeAttribute('aria-disabled');
      }
    }).catch(() => {
      // API failed and no categories available — disable Start Quiz and show message
      if (start) {
        start.disabled = true;
        start.setAttribute('aria-disabled', 'true');
      }
      showMsg('Categories could not be loaded. Please check your connection and refresh the page.');
      const pillWrap = el('categoryList');
      const simpleWrap = el('simpleCatGroups');
      if (pillWrap) pillWrap.innerHTML = '<p class="cv-cat-error">Categories unavailable — please refresh.</p>';
      if (simpleWrap) simpleWrap.innerHTML = '';
    });

    // Wire Start Quiz click handler
    if (start){
      start.addEventListener('click', () => {
        hideMsg();

        let categories = getSelectedCategories();
        if (!categories.length){
          // Default: if nothing is selected, treat it as “All categories”.
          categories = [...CATEGORY_BANK];
          setAllCategories(true);
        }

        const difficultyEl = document.querySelector('input[name="difficulty"]:checked') || { value: 'basic' };
        const count = range ? Number(range.value) : 10;

        const next = {
          categories,
          difficulty: difficultyEl.value || 'basic',
          questionCount: Number.isFinite(count) ? count : 10,
          skipCorrect: !!(skip && skip.checked)
        };

        writeSettings(next);
        // Validate URL before redirect: only allow same-origin or relative paths
        var _quizUrl = window.__CODIVIUM_MCQ_QUIZ_URL__ || 'mcq-quiz.html';
        try {
          var _parsed = new URL(_quizUrl, window.location.origin);
          if (_parsed.origin !== window.location.origin) _quizUrl = 'mcq-quiz.html';
        } catch(_) { _quizUrl = 'mcq-quiz.html'; }
        window.location.href = _quizUrl;
      });

    const startFlash = el('startFlashInfo');
    if (startFlash && start){
      startFlash.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Trigger a 1.5s premium flash on the Start Quiz button.
        start.classList.remove('is-flash');
        // force reflow so the animation restarts on repeated clicks
        void start.offsetWidth;
        start.classList.add('is-flash');
        setTimeout(() => start.classList.remove('is-flash'), 1500);
      });
    }
    }
  });
  // Public API for external callers (e.g. future MCQ pages or integration tests)
  window.MCQParent = {
    getCategoryObjects: function() { return _categoryObjects; },
    showPop: openMiniPop,
    closePop: closeMiniPop
  };

  // ── Cleanup on page navigation ────────────────────────────────────────────
  // Window-level listeners are removed on pagehide for SPA safety.
  // Element-scoped listeners (input, overlay) are cleaned up when elements are removed.
  window.addEventListener('pagehide', function() {
    // Best-effort: clear any window-level scroll/resize observers if added later
    try { window.__mcqParentCleanup && window.__mcqParentCleanup(); } catch(_) {}
  }, { once: true });

})();