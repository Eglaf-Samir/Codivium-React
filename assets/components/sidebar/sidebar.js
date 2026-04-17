/* ── sidebar.js ──────────────────────────────────────────────────────────
 * Handles sidebar collapse/expand, active link highlight, drag gesture.
 *
 * Active state: matches each link's href against the current page URL.
 * The .active class drives a subtle glow + border in sidebar.css.
 */
(function(){

  const sidebar = document.getElementById('sidebar');
  const handle  = document.getElementById('sidebarHandle');

  if (!sidebar || !handle) return;

  /* ── Collapse / expand ─────────────────────────────────────────────── */
  function setCollapsed(collapsed) {
    sidebar.classList.toggle('collapsed', collapsed);
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    handle.setAttribute('aria-expanded', String(!collapsed));
    handle.setAttribute('aria-label', collapsed ? 'Expand side menu' : 'Collapse side menu');
    try { localStorage.setItem('cv_sidebar_collapsed', collapsed ? '1' : '0'); } catch(e) {}
  }

  let collapsed = false;
  try { collapsed = localStorage.getItem('cv_sidebar_collapsed') === '1'; } catch(e) {}
  setCollapsed(collapsed);

  function toggle() { setCollapsed(!sidebar.classList.contains('collapsed')); }

  /* ── Active link highlight ─────────────────────────────────────────── */
  function markActiveLink() {
    const links = Array.from(sidebar.querySelectorAll('a.side-link'));
    const loc   = window.location;
    const curFile   = loc.pathname.split('/').pop() || '';
    const curSearch = loc.search || '';

    let bestMatch = null;

    links.forEach(function(a) {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#') return;

      const hrefFile   = href.split('?')[0].split('/').pop();
      const hrefSearch = href.includes('?') ? '?' + href.split('?')[1] : '';

      if (hrefFile !== curFile) return;

      if (hrefSearch) {
        const linkTrack = new URLSearchParams(hrefSearch).get('track');
        const curTrack  = new URLSearchParams(curSearch).get('track') ||
                          new URLSearchParams(curSearch).get('from') || '';
        if (linkTrack && curTrack && linkTrack !== curTrack) return;
        if (linkTrack && !curTrack && linkTrack === 'interview') return;
      }

      if (!bestMatch || hrefSearch.length > (bestMatch.getAttribute('href') || '').split('?').slice(1).join('?').length) {
        bestMatch = a;
      }
    });

    // Special case: mcq-quiz.html → highlight mcq-parent link
    if (!bestMatch && curFile === 'mcq-quiz.html') {
      bestMatch = links.find(function(a) {
        return (a.getAttribute('href') || '').includes('mcq-parent.html');
      }) || null;
    }

    // Special case: editor.html → decode ?from= to extract track (micro vs interview)
    if (!bestMatch && curFile === 'editor.html') {
      var fromRaw = new URLSearchParams(curSearch).get('from') || '';
      var directTrack = new URLSearchParams(curSearch).get('track') || '';
      // Decode the from= value (it's URL-encoded, e.g. menu-page.html%3Ftrack%3Dinterview)
      var fromDecoded = '';
      try { fromDecoded = decodeURIComponent(fromRaw); } catch(_) { fromDecoded = fromRaw; }
      // Extract track from the decoded from URL or use direct ?track= param
      var fromTrackMatch = fromDecoded.match(/[?&]track=([^&]+)/);
      var track = (fromTrackMatch ? fromTrackMatch[1] : directTrack).toLowerCase();
      bestMatch = links.find(function(a) {
        var h = a.getAttribute('href') || '';
        if (track === 'interview') return h.includes('track=interview');
        // Default (micro or no track): prefer explicit micro link
        return h.includes('track=micro');
      }) || links.find(function(a) {
        // Final fallback: any menu-page link
        return (a.getAttribute('href') || '').includes('menu-page.html');
      }) || null;
    }

    // Fallback: body[data-active-section] → match by data-section attribute on links
    // Used by demo pages whose filename does not match any sidebar href
    if (!bestMatch) {
      const bodySection = document.body.dataset.activeSection || '';
      if (bodySection) {
        bestMatch = links.find(function(a) {
          return a.dataset.section === bodySection;
        }) || null;
      }
    }

    // Apply active state: skip entirely if the right button is already active
    // (avoids the remove-all → add-one flash caused by a brief all-unclicked repaint)
    if (bestMatch) {
      if (!bestMatch.classList.contains('active')) {
        links.forEach(function(a) {
          a.classList.remove('active');
          a.removeAttribute('aria-current');
        });
        bestMatch.classList.add('active');
        bestMatch.setAttribute('aria-current', 'page');
      } else {
        // bestMatch already active — just clean up any others that shouldn't be
        links.forEach(function(a) {
          if (a !== bestMatch) {
            a.classList.remove('active');
            a.removeAttribute('aria-current');
          }
        });
      }
    }
  }

  markActiveLink();

  // On pointerdown, immediately move .active to the clicked link.
  // .active has transition:none so it snaps instantly.
  // When CSS :active drops on pointerup, the JS .active class keeps the button
  // visually pressed — bridging the gap between pointerup and the new page painting.
  // If the user cancels (drag away / pointercancel), restore the original state.
  sidebar.querySelectorAll('a.side-link').forEach(function(a) {
    a.addEventListener('pointerdown', function() {
      if (a.classList.contains('is-disabled') ||
          a.getAttribute('aria-disabled') === 'true' ||
          a.getAttribute('data-disabled') === 'true') return;
      // Remember who was active before so we can restore on cancel
      var prev = sidebar.querySelector('.side-link.active');
      // Move .active immediately to the clicked link
      sidebar.querySelectorAll('.side-link').forEach(function(l) {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
      });
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      // Store previous for restore
      a._prevActive = prev || null;
    });
    a.addEventListener('pointercancel', function() {
      // Navigation didn't happen — restore previous active state
      sidebar.querySelectorAll('.side-link').forEach(function(l) {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
      });
      if (a._prevActive) {
        a._prevActive.classList.add('active');
        a._prevActive.setAttribute('aria-current', 'page');
      }
      a._prevActive = null;
    });
  });

  /* ── Click + keyboard on handle ────────────────────────────────────── */
  let suppressNextClick = false;

  handle.addEventListener('click', (e) => {
    if (suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClick = false;
      return;
    }
    toggle();
  });

  handle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  /* ── Drag gesture on handle (≈ 1cm) ────────────────────────────────── */
  const DRAG_MAX_PX    = 96 / 2.54; // ~37.8px
  const DRAG_COMMIT_PX = 4;
  const HORIZONTAL_BIAS = 0.85;

  let pointerId = null;
  let startX = 0, startY = 0;
  let lastDX = 0, lastDY = 0;
  let startCollapsed = false;
  let dragging = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function resetDrag() {
    pointerId = null;
    dragging  = false;
    handle.classList.remove('is-dragging');
    handle.style.setProperty('--sb-handle-dx', '0px');
  }

  handle.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId     = e.pointerId;
    startX        = e.clientX;
    startY        = e.clientY;
    lastDX        = 0;
    lastDY        = 0;
    startCollapsed = sidebar.classList.contains('collapsed');
    dragging      = true;
    handle.classList.add('is-dragging');
    handle.style.setProperty('--sb-handle-dx', '0px');
    try { handle.setPointerCapture(pointerId); } catch(err) {}
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging || pointerId !== e.pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    lastDX = dx; lastDY = dy;
    if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_BIAS) {
      handle.style.setProperty('--sb-handle-dx', '0px');
      return;
    }
    if (startCollapsed) {
      handle.style.setProperty('--sb-handle-dx', `${clamp(dx, 0, DRAG_MAX_PX)}px`);
    } else {
      handle.style.setProperty('--sb-handle-dx', `${clamp(dx, -DRAG_MAX_PX, 0)}px`);
    }
  }, { passive: true });

  handle.addEventListener('pointerup', (e) => {
    if (pointerId !== e.pointerId) return;
    try { handle.releasePointerCapture(pointerId); } catch(err) {}
    const dx = lastDX, dy = lastDY;
    const mostlyH = Math.abs(dx) >= Math.abs(dy) * HORIZONTAL_BIAS;
    if (mostlyH) {
      if (startCollapsed  && dx >  DRAG_COMMIT_PX) { setCollapsed(false); suppressNextClick = true; }
      if (!startCollapsed && dx < -DRAG_COMMIT_PX) { setCollapsed(true);  suppressNextClick = true; }
    }
    resetDrag();
  });

  handle.addEventListener('pointercancel', (e) => {
    if (pointerId !== e.pointerId) return;
    resetDrag();
  });

})();
