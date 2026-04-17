    (function(){
      // --- Filter drawer toggle (tab) ---
      const drawerTab = document.getElementById('drawerTab');
      const drawer = document.getElementById('filterDrawer');
      const drawerWrap = document.getElementById('drawerWrap');
      function setInert(el, inertOn){
        if(!el) return;
        // Prefer property if supported (spec-compliant), fallback to attribute.
        try{
          if('inert' in el) el.inert = !!inertOn;
          else el.toggleAttribute('inert', !!inertOn);
        }catch(e){
          try{ el.toggleAttribute('inert', !!inertOn); }catch(_){}
        }
      }

      function _readPxVar(name, fallback){
        const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
        const n = parseFloat((raw || '').trim());
        return Number.isFinite(n) ? n : fallback;
      }
      function _setPxVar(name, px){
        document.documentElement.style.setProperty(name, (Math.round(px*100)/100) + 'px');
      }
      function updateDrawerMetrics(){
        if(!drawerWrap || !drawer) return;
        const topbarH = _readPxVar('--topbar-h', 56);
        const gap = _readPxVar('--drawer-gap', 0);
        const paletteH = drawer.getBoundingClientRect().height || 0;
        // Hide shift: move palette fully behind topbar while keeping tab flush to topbar.
        _setPxVar('--drawer-hide-shift', Math.max(0, (paletteH + gap) - 2));
        // Open shift: center palette vertically in viewport.
        const desiredTop = (window.innerHeight * 0.5) - (paletteH * 0.5);
        let openShift = desiredTop - topbarH;
        const minShift = 8;
        const maxShift = Math.max(minShift, (window.innerHeight - paletteH - 8) - topbarH);
        if(!Number.isFinite(openShift)) openShift = 0;
        openShift = Math.max(minShift, Math.min(maxShift, openShift));
        _setPxVar('--drawer-open-shift', openShift);
      }
      let _metricsRAF = null;
      function scheduleDrawerMetrics(){
        if(_metricsRAF) cancelAnimationFrame(_metricsRAF);
        _metricsRAF = requestAnimationFrame(() => {
          updateDrawerMetrics();
          _metricsRAF = null;
        });
      }
      window.addEventListener('resize', () => scheduleDrawerMetrics(), { passive: true });


      function setDrawerCollapsed(collapsed){
        document.body.classList.toggle('drawer-collapsed', collapsed);
        if(drawerTab){
          drawerTab.setAttribute('aria-expanded', String(!collapsed));
        }
        if(drawer){
          drawer.setAttribute('aria-hidden', String(collapsed));
          setInert(drawer, collapsed);
        }
        // Recompute palette metrics after state changes so the mid-screen position stays correct.
        scheduleDrawerMetrics();
      }

      // Default collapsed (hidden) — suppress ALL transitions during initial metric
      // calculation so the filter never visibly slides up on page open.
      document.body.classList.add('cv-no-drawer-trans');
      setDrawerCollapsed(true);
      // Run metrics synchronously (without RAF) for the initial state so the
      // CSS variable is set before the first paint.
      if (drawerWrap && drawer) { updateDrawerMetrics(); }
      // Remove no-transition flag on the NEXT frame, after the metric is applied.
      requestAnimationFrame(function() {
        document.body.classList.remove('cv-no-drawer-trans');
      });

      // Fix 4: re-measure on back-forward cache restore and visibility change
      // so the tab never ends up behind the topbar after navigation
      window.addEventListener('pageshow', function(e) {
        scheduleDrawerMetrics();
        // Force tab to correct position after bfcache restore
        if (e.persisted) {
          setTimeout(function() { scheduleDrawerMetrics(); }, 100);
        }
      });
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') scheduleDrawerMetrics();
      });

      // Prevent click after drag-commit
      let suppressNextClick = false;

      
      // ---- Drag gesture (≈ 1cm) + animated tab travel (vertical) ----
      // CSS pixels: 1in = 96px, 1cm = 96/2.54 px
      const DRAG_MAX_PX = 96 / 2.54; // ~37.8px (≈ 1cm)
      const DRAG_TRIGGER_PX = 10;    // small intentional drag triggers on release
      const VERTICAL_BIAS = 0.85;    // allow slightly diagonal drags

      let dPointerId = null;
      let dStartX = 0, dStartY = 0;
      let dLastDX = 0, dLastDY = 0;
      let dStartCollapsed = false;
      let dDragging = false;

      function dClamp(v, minV, maxV){ return Math.max(minV, Math.min(maxV, v)); }

      function dReset(){
        dPointerId = null;
        dDragging = false;
        dLastDX = 0;
        dLastDY = 0;
        if(drawerTab){
          drawerTab.classList.remove('is-dragging');
          // glide back to rest
          drawerTab.style.setProperty('--drawer-tab-dy','0px');
        }
      }

      function dIsVertical(){
        return Math.abs(dLastDY) >= (Math.abs(dLastDX) * VERTICAL_BIAS);
      }

      if(drawerTab){
        drawerTab.addEventListener('pointerdown', (e) => {
          if(e.pointerType === 'mouse' && e.button !== 0) return;

          dPointerId = e.pointerId;
          dStartX = e.clientX;
          dStartY = e.clientY;
          dLastDX = 0;
          dLastDY = 0;
          dStartCollapsed = document.body.classList.contains('drawer-collapsed');
          dDragging = true;

          drawerTab.classList.add('is-dragging');
          drawerTab.style.setProperty('--drawer-tab-dy','0px');

          try { drawerTab.setPointerCapture(dPointerId); } catch(err){}
        });

        drawerTab.addEventListener('pointermove', (e) => {
          if(!dDragging || dPointerId !== e.pointerId) return;

          const dx = e.clientX - dStartX;
          const dy = e.clientY - dStartY;
          dLastDX = dx;
          dLastDY = dy;

          // If the gesture is mostly horizontal, don't move the tab
          if(Math.abs(dy) < Math.abs(dx) * VERTICAL_BIAS){
            drawerTab.style.setProperty('--drawer-tab-dy','0px');
            return;
          }

          // Visual travel only in allowed direction (up to 1cm)
          if(dStartCollapsed){
            const visual = dy > 0 ? dClamp(dy, 0, DRAG_MAX_PX) : 0;
            drawerTab.style.setProperty('--drawer-tab-dy', `${visual}px`);
          }else{
            const visual = dy < 0 ? dClamp(dy, -DRAG_MAX_PX, 0) : 0;
            drawerTab.style.setProperty('--drawer-tab-dy', `${visual}px`);
          }
        }, { passive: true });

        function dCommit(){
          if(!dIsVertical()) return;

          const dy = dLastDY;

          // Suppress click when user performs an intentional drag
          if(Math.abs(dy) >= DRAG_TRIGGER_PX){
            suppressNextClick = true;

            if(dStartCollapsed && dy > 0){
              setDrawerCollapsed(false);
              return;
            }
            if(!dStartCollapsed && dy < 0){
              setDrawerCollapsed(true);
              return;
            }
          }
        }

        drawerTab.addEventListener('pointerup', (e) => {
          if(dPointerId !== e.pointerId) return;
          try { drawerTab.releasePointerCapture(dPointerId); } catch(err){}
          dCommit();
          dReset();
        });

        drawerTab.addEventListener('pointercancel', (e) => {
          if(dPointerId !== e.pointerId) return;
          dReset();
        });
      }

      // Close button (equivalent to clicking the tab)
      const drawerClose = document.getElementById('drawerClose');
      if(drawerClose){
        drawerClose.addEventListener('click', () => setDrawerCollapsed(true));

      // Fix 5: Ctrl+Shift+F keyboard shortcut to open filter drawer
      document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f') && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          if (document.body.classList.contains('drawer-collapsed')) {
            setDrawerCollapsed(false);
            // Move focus into the drawer for keyboard users
            requestAnimationFrame(function() {
              var firstInput = drawer && drawer.querySelector('input, select, button');
              if (firstInput) firstInput.focus();
            });
          } else {
            setDrawerCollapsed(true);
          }
        }
      });
      }

if(drawerTab){
        drawerTab.addEventListener('click', (e) => {
          if(suppressNextClick){ suppressNextClick = false; return; }
          setDrawerCollapsed(!document.body.classList.contains('drawer-collapsed'));
        });
}

      window.addEventListener('keydown', (e) => {
        if(e.key === 'Escape'){
          setDrawerCollapsed(true);
        }
      });

      // --- Card border highlight follows cursor position ---
      // cards are re-queried inside applyFilters() for dynamic support
      Array.from(document.querySelectorAll('.exercise-card')).forEach((card) => {
        let raf = 0;
        let lastEvent = null;

        function apply(){
          raf = 0;
          if(!lastEvent) return;
          const e = lastEvent;

          const r = card.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;

          card.style.setProperty('--mx', x.toFixed(2) + '%');
          card.style.setProperty('--my', y.toFixed(2) + '%');
        }

        card.addEventListener('mousemove', (e) => {
          lastEvent = e;
          if(raf) return;
          raf = requestAnimationFrame(apply);
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
          lastEvent = null;
          card.style.removeProperty('--mx');
          card.style.removeProperty('--my');
        });
      });

      // --- Filters + sorting (Apply button) ---
      const applyBtn = document.getElementById('applyFilters');

      const completenessChecks = Array.from(document.querySelectorAll('input[name="completeness"]'));
      const categoryChecks = Array.from(document.querySelectorAll('input[name="category"]'));
      const levelChecks = Array.from(document.querySelectorAll('input[name="level"]'));

      function wireAllExclusive(name){
        // Use a container reference for event delegation so dynamically
        // added checkboxes (e.g. category boxes built by menu-data.js after
        // this function runs) automatically participate in the ALL logic.
        const container = document.querySelector(
          `[id="f-${name}"], [data-filter-group="${name}"]`
        ) || document.body;

        function getAll(){ return container.querySelector(`input[name="${name}"][value="all"]`); }
        function getOthers(){ return Array.from(container.querySelectorAll(`input[name="${name}"]`)).filter(i => normalize(i.value) !== 'all'); }
        function getInputs(){ return Array.from(container.querySelectorAll(`input[name="${name}"]`)); }

        function ensureAtLeastOne(){
          const all = getAll();
          const any = getInputs().some(i => i.checked);
          if(!any && all) all.checked = true;
        }

        function collapseToAllIfAllChecked(){
          const all = getAll();
          const others = getOthers();
          if(!all) return;
          if(others.length && others.every(i => i.checked)){
            all.checked = true;
            others.forEach(i => { i.checked = false; });
          }
        }

        // Event delegation on container — works for checkboxes added after init
        container.addEventListener('change', (e) => {
          const inp = e.target;
          if(!inp || inp.type !== 'checkbox' || inp.name !== name) return;

          const all = getAll();
          if(!all) return;

          if(inp === all){
            if(all.checked){
              // ALL checked: uncheck every individual
              getOthers().forEach(i => { i.checked = false; });
            } else {
              // ALL unchecked: ensure something is still selected
              ensureAtLeastOne();
            }
          } else {
            if(inp.checked){
              // Individual checked: ALL should be off
              all.checked = false;
              // If every individual is now checked, collapse back to ALL
              collapseToAllIfAllChecked();
            } else {
              // Individual unchecked: if nothing left, fall back to ALL
              ensureAtLeastOne();
            }
          }

          // Trigger filter update
          if(typeof applyFilters === 'function') applyFilters();
        });

        // NOTE: do NOT call collapseToAllIfAllChecked() or ensureAtLeastOne() here.
        // For the category group, boxes are built dynamically by menu-data.js AFTER
        // this function runs — calling them now would operate on an empty set and
        // incorrectly force ALL=true. The cvMenuReady handler below does the post-init check.
      }

      function rewireAllExclusiveAfterRender(){
        // Called after cvMenuReady so localStorage-restored state is honoured correctly.
        // Check each group: if nothing checked, fall back to ALL.
        ['completeness','category','level'].forEach(function(name){
          const container = document.querySelector(`[id="f-${name}"], [data-filter-group="${name}"]`) || document.body;
          const all = container.querySelector(`input[name="${name}"][value="all"]`);
          const inputs = Array.from(container.querySelectorAll(`input[name="${name}"]`));
          const any = inputs.some(i => i.checked);
          if(!any && all) all.checked = true;
          // If ALL is explicitly checked, uncheck individuals
          if(all && all.checked){
            inputs.filter(i => normalize(i.value) !== 'all').forEach(i => { i.checked = false; });
          }
        });
      }

      wireAllExclusive('completeness');
      wireAllExclusive('category');
      wireAllExclusive('level');

      const sortFieldSel = document.getElementById('sortField');
      const sortDirSel = document.getElementById('sortDir');
      let sortKey = normalize(sortFieldSel ? sortFieldSel.value : 'title') || 'title';
      let sortDir = normalize(sortDirSel ? sortDirSel.value : 'asc') || 'asc';

      if(sortFieldSel){
        sortFieldSel.addEventListener('change', () => {
          sortKey = normalize(sortFieldSel.value) || 'title';
        });
      }
      if(sortDirSel){
        sortDirSel.addEventListener('change', () => {
          sortDir = normalize(sortDirSel.value) || 'asc';
        });
      }

      function normalize(s){ return String(s || "").trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," "); }

      function getCardMeta(card){
        // Prefer data-* attributes written by menu-data.js (accurate, fast).
        // Fall back to DOM inspection for the static demo cards.
        const cat    = normalize(card.dataset.cat  || card.getAttribute('data-cat') || '');
        const level  = normalize(card.dataset.level || '');
        const status = normalize(card.dataset.status || (function(){
          const el = card.querySelector('.card-status');
          return (el && el.classList.contains('done')) ? 'completed' : 'not-started';
        })());
        const title  = normalize(card.dataset.name  || (function(){
          const el = card.querySelector('.card-title');
          return el ? el.textContent : '';
        })());
        const desc   = normalize(card.dataset.desc  || (function(){
          const el = card.querySelector('.card-desc');
          return el ? el.textContent : '';
        })());
        return { cat, status, level, title, desc };
      }

      function compareBy(key, dir){
        const mult = (dir === 'desc') ? -1 : 1;

        const orderLevel = { 'basic': 0, 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
        const orderStatus = { 'not started': 0, 'completed': 1 }; // asc => not started first

        return (a, b) => {
          const A = getCardMeta(a);
          const B = getCardMeta(b);

          let av, bv;

          if(key === 'category'){
            av = A.cat; bv = B.cat;
          } else if(key === 'level'){
            av = orderLevel[A.level] ?? 999;
            bv = orderLevel[B.level] ?? 999;
          } else if(key === 'completeness'){
            av = orderStatus[A.status] ?? 999;
            bv = orderStatus[B.status] ?? 999;
          } else {
            av = A.title; bv = B.title;
          }

          if(av < bv) return -1 * mult;
          if(av > bv) return  1 * mult;

          // stable tie-breaker
          if(A.title < B.title) return -1;
          if(A.title > B.title) return  1;
          return 0;
        };
      }

      function applyFilters(){
        // Re-query cards each time so dynamically added cards are included.
        const allCards = Array.from(document.querySelectorAll('.exercise-card'));

        const completenessVals = Array.from(document.querySelectorAll('input[name="completeness"]:checked')).map(i => normalize(i.value));
        const categoryVals     = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(i => normalize(i.value));
        const levelVals        = Array.from(document.querySelectorAll('input[name="level"]:checked')).map(i => normalize(i.value));

        // Search term from #menuSearch input
        const searchInput = document.getElementById('menuSearch');
        const searchTerm  = normalize(searchInput ? searchInput.value : '');

        let visibleCount = 0;

        allCards.forEach((card) => {
          const meta = getCardMeta(card);

          const passCompleteness = !completenessVals.length || completenessVals.includes('all') || completenessVals.includes(meta.status);
          const passCategory     = !categoryVals.length     || categoryVals.includes('all')     || categoryVals.includes(meta.cat);
          const passLevel        = !levelVals.length        || levelVals.includes('all')        || levelVals.includes(meta.level);
          const passSearch       = !searchTerm ||
            meta.title.includes(searchTerm) ||
            meta.desc.includes(searchTerm);

          const show = passCompleteness && passCategory && passLevel && passSearch;
          card.style.display = show ? '' : 'none';
          if(show) visibleCount++;
        });

        // Sort visible cards within grid
        const grid = document.querySelector('.exercise-grid');
        if(!grid) return;

        const visible = allCards.filter(c => c.style.display !== 'none');
        const key = sortKey || 'title';
        visible.sort(compareBy(key, sortDir));
        visible.forEach((card) => grid.appendChild(card));

        // Update empty state if menu-data.js exposed the helper
        if(typeof window.__cvUpdateEmptyState === 'function'){
          window.__cvUpdateEmptyState(visibleCount);
        }
      }

      // Expose globally so menu-data.js can call it after rendering cards
      window.__cvApplyFilters = applyFilters;

      if(applyBtn){
        applyBtn.addEventListener('click', applyFilters);
      }

      // Re-apply when menu-data.js has finished rendering
      document.addEventListener('cvMenuReady', function(){
        // After dynamic cards + category checkboxes are built,
        // validate ALL-exclusive state then apply filters.
        rewireAllExclusiveAfterRender();
        applyFilters();
      });

      // Apply once on load (handles static demo cards)
      applyFilters();
    })();

  // Cleanup on navigation: remove document-level custom event listener
  window.addEventListener('pagehide', function() {
    try {
      document.removeEventListener('cvMenuReady', rewireAllExclusiveAfterRender);
    } catch(_) {}
  }, { once: true });
