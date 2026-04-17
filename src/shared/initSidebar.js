// src/shared/initSidebar.js
// React port of sidebar.js.
// Call initSidebar() from each page's main.jsx after DOMContentLoaded.
// Operates on the static sidebar HTML — no React rendering needed.

export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const handle  = document.getElementById('sidebarHandle');
  if (!sidebar || !handle) return;
  if (sidebar._cvSidebarInit) return; // prevent double-init
  sidebar._cvSidebarInit = true;

  // ── Collapse / expand ─────────────────────────────────────────────────────
  function setCollapsed(collapsed) {
    sidebar.classList.toggle('collapsed', collapsed);
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    handle.setAttribute('aria-expanded', String(!collapsed));
    handle.setAttribute('aria-label', collapsed ? 'Expand side menu' : 'Collapse side menu');
    try { localStorage.setItem('cv_sidebar_collapsed', collapsed ? '1' : '0'); } catch (_) {}
  }

  let collapsed = false;
  try { collapsed = localStorage.getItem('cv_sidebar_collapsed') === '1'; } catch (_) {}
  setCollapsed(collapsed);

  function toggle() { setCollapsed(!sidebar.classList.contains('collapsed')); }

  // ── Active link highlight ─────────────────────────────────────────────────
  function markActiveLink() {
    const links     = Array.from(sidebar.querySelectorAll('a.side-link'));
    const curFile   = window.location.pathname.split('/').pop() || '';
    const curSearch = window.location.search || '';
    let best = null;

    links.forEach(a => {
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
      const prevLen = best ? (best.getAttribute('href') || '').split('?').slice(1).join('?').length : -1;
      if (!best || hrefSearch.length > prevLen) best = a;
    });

    // Special case: mcq-quiz → highlight mcq-parent
    if (!best && curFile === 'mcq-quiz.html') {
      best = links.find(a => (a.getAttribute('href') || '').includes('mcq-parent.html')) || null;
    }

    // Special case: editor.html → decode ?from= for track detection
    if (!best && curFile === 'editor.html') {
      const fromRaw  = new URLSearchParams(curSearch).get('from') || '';
      const directTr = new URLSearchParams(curSearch).get('track') || '';
      let fromDec = '';
      try { fromDec = decodeURIComponent(fromRaw); } catch (_) { fromDec = fromRaw; }
      const m = fromDec.match(/[?&]track=([^&]+)/);
      const track = (m ? m[1] : directTr).toLowerCase();
      best = links.find(a => {
        const h = a.getAttribute('href') || '';
        return track === 'interview' ? h.includes('track=interview') : h.includes('track=micro');
      }) || links.find(a => (a.getAttribute('href') || '').includes('menu-page.html')) || null;
    }

    // Fallback: body data-active-section
    if (!best) {
      const sec = document.body.dataset.activeSection || '';
      if (sec) best = links.find(a => a.dataset.section === sec) || null;
    }

    if (best) {
      if (!best.classList.contains('active')) {
        links.forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
        best.classList.add('active');
        best.setAttribute('aria-current', 'page');
      } else {
        links.forEach(a => {
          if (a !== best) { a.classList.remove('active'); a.removeAttribute('aria-current'); }
        });
      }
    }
  }

  markActiveLink();

  // Instant active feedback on pointerdown
  sidebar.querySelectorAll('a.side-link').forEach(a => {
    a.addEventListener('pointerdown', () => {
      if (a.classList.contains('is-disabled') ||
          a.getAttribute('aria-disabled') === 'true' ||
          a.getAttribute('data-disabled') === 'true') return;
      const prev = sidebar.querySelector('.side-link.active');
      sidebar.querySelectorAll('.side-link').forEach(l => {
        l.classList.remove('active'); l.removeAttribute('aria-current');
      });
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      a._prevActive = prev || null;
    });
    a.addEventListener('pointercancel', () => {
      sidebar.querySelectorAll('.side-link').forEach(l => {
        l.classList.remove('active'); l.removeAttribute('aria-current');
      });
      if (a._prevActive) {
        a._prevActive.classList.add('active');
        a._prevActive.setAttribute('aria-current', 'page');
      }
      a._prevActive = null;
    });
  });

  // ── Click + keyboard on handle ───────────────────────────────────────────
  let suppressNextClick = false;
  handle.addEventListener('click', e => {
    if (suppressNextClick) { e.preventDefault(); e.stopPropagation(); suppressNextClick = false; return; }
    toggle();
  });
  handle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });

  // ── Drag gesture on handle ───────────────────────────────────────────────
  const DRAG_MAX_PX    = 96 / 2.54;
  const DRAG_COMMIT_PX = 4;
  const H_BIAS         = 0.85;
  let pointerId = null, startX = 0, startY = 0, lastDX = 0, lastDY = 0;
  let startCollapsed = false, dragging = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function resetDrag() {
    pointerId = null; dragging = false;
    handle.classList.remove('is-dragging');
    handle.style.setProperty('--sb-handle-dx', '0px');
  }

  handle.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId; startX = e.clientX; startY = e.clientY;
    lastDX = 0; lastDY = 0;
    startCollapsed = sidebar.classList.contains('collapsed');
    dragging = true;
    handle.classList.add('is-dragging');
    handle.style.setProperty('--sb-handle-dx', '0px');
    try { handle.setPointerCapture(pointerId); } catch (_) {}
  });

  handle.addEventListener('pointermove', e => {
    if (!dragging || pointerId !== e.pointerId) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    lastDX = dx; lastDY = dy;
    if (Math.abs(dx) < Math.abs(dy) * H_BIAS) {
      handle.style.setProperty('--sb-handle-dx', '0px'); return;
    }
    handle.style.setProperty('--sb-handle-dx',
      startCollapsed ? `${clamp(dx, 0, DRAG_MAX_PX)}px` : `${clamp(dx, -DRAG_MAX_PX, 0)}px`);
  }, { passive: true });

  handle.addEventListener('pointerup', e => {
    if (pointerId !== e.pointerId) return;
    try { handle.releasePointerCapture(pointerId); } catch (_) {}
    const mostlyH = Math.abs(lastDX) >= Math.abs(lastDY) * H_BIAS;
    if (mostlyH) {
      if (startCollapsed  && lastDX >  DRAG_COMMIT_PX) { setCollapsed(false); suppressNextClick = true; }
      if (!startCollapsed && lastDX < -DRAG_COMMIT_PX) { setCollapsed(true);  suppressNextClick = true; }
    }
    resetDrag();
  });

  handle.addEventListener('pointercancel', e => {
    if (pointerId !== e.pointerId) return;
    resetDrag();
  });

  // Re-mark active link when React navigation dispatches cv:route-change
  document.addEventListener('cv:route-change', markActiveLink);
}
