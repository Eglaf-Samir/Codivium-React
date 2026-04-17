// components/FilterDrawer.jsx
// Full filter drawer: tab + drawer panel.
// Portaled to document.body so it sits at the same DOM level as the original HTML.
// Manages its own CSS metrics (--drawer-hide-shift, --drawer-open-shift) via ResizeObserver.
// Drag gesture on the tab follows the same pattern as the editor splitters.
//
// NEW in v1.1: exerciseType and mentalModels filter groups (micro track only).
import React, {
  useEffect, useRef, useCallback, useState,
} from 'react';
import { createPortal } from 'react-dom';

// ── Reusable multiselect checkbox group ─────────────────────────────────────
function FilterGroup({ name, label, tooltip, options, selected, onToggle }) {
  const allSelected = selected.includes('all') || selected.length === 0;
  const allOptions  = options.map(o => (typeof o === 'string' ? o.toLowerCase().replace(/[_-]+/g, ' ') : o.value));

  function handleChange(value) {
    onToggle(value, allOptions);
  }

  return (
    <div className="filter-group" data-group={name}>
      <div className="fg-head">
        <div className="fg-label">{label}</div>
        {tooltip && (
          <button
            className="info-mini"
            type="button"
            aria-label={`Info: ${label}`}
            data-tip={tooltip}
            title={tooltip}
          >
            i
          </button>
        )}
      </div>
      <div className="checklist" id={`f-${name}`} role="group" aria-label={label}>
        {/* All option */}
        <label className="chk">
          <input
            type="checkbox"
            name={name}
            value="all"
            checked={allSelected}
            onChange={() => handleChange('all')}
          />
          <span>All</span>
        </label>
        {/* Individual options */}
        {options.map(opt => {
          const value = typeof opt === 'string' ? opt.toLowerCase().replace(/[_-]+/g, ' ') : opt.value;
          const label_ = typeof opt === 'string' ? opt : opt.label;
          const checked = !allSelected && selected.includes(value);
          return (
            <label key={value} className="chk">
              <input
                type="checkbox"
                name={name}
                value={value}
                checked={checked}
                onChange={() => handleChange(value)}
              />
              <span>{label_}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FilterDrawer({
  open,
  onOpen,
  onClose,
  // Available options from API payload
  categories,
  difficultyLevels,
  exerciseTypes,   // present only on micro track
  mentalModels,    // present only on micro track
  isMicro,
  // Current selections
  selectedCategories,
  selectedLevels,
  selectedCompleteness,
  selectedExerciseTypes,
  selectedMentalModels,
  sortField,
  sortDir,
  // Setters
  toggleCategories,
  toggleLevels,
  toggleCompleteness,
  toggleExerciseTypes,
  toggleMentalModels,
  updateSortField,
  updateSortDir,
  onReset,
}) {
  const drawerRef = useRef(null);
  const tabRef    = useRef(null);

  // ── Sync body class ─────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('drawer-collapsed', !open);
    if (drawerRef.current) {
      drawerRef.current.setAttribute('aria-hidden', String(!open));
      if ('inert' in drawerRef.current) {
        drawerRef.current.inert = !open;
      } else {
        drawerRef.current.toggleAttribute('inert', !open);
      }
    }
  }, [open]);

  // ── CSS metrics computation ─────────────────────────────────────────────────
  // Sets --drawer-hide-shift and --drawer-open-shift on :root so CSS transitions work.
  const updateMetrics = useCallback(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    const cs      = getComputedStyle(document.documentElement);
    const topbarH = parseFloat(cs.getPropertyValue('--topbar-h')) || 56;
    const gap     = parseFloat(cs.getPropertyValue('--drawer-gap')) || 0;
    const paletteH = drawer.getBoundingClientRect().height || 0;

    const hideShift = Math.max(0, paletteH + gap - 2);
    const desiredTop = window.innerHeight * 0.5 - paletteH * 0.5;
    const minShift   = 8;
    const maxShift   = Math.max(minShift, window.innerHeight - paletteH - 8 - topbarH);
    const openShift  = Math.max(minShift, Math.min(maxShift, desiredTop - topbarH));

    document.documentElement.style.setProperty('--drawer-hide-shift', `${hideShift}px`);
    document.documentElement.style.setProperty('--drawer-open-shift',  `${openShift}px`);
  }, []);

  useEffect(() => {
    // Suppress transitions during initial metric calculation
    document.body.classList.add('cv-no-drawer-trans');
    updateMetrics();
    const raf = requestAnimationFrame(() => {
      document.body.classList.remove('cv-no-drawer-trans');
    });

    const ro = new ResizeObserver(updateMetrics);
    if (drawerRef.current) ro.observe(drawerRef.current);

    window.addEventListener('resize',           updateMetrics, { passive: true });
    window.addEventListener('pageshow',         updateMetrics, { passive: true });
    document.addEventListener('visibilitychange', updateMetrics);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize',           updateMetrics);
      window.removeEventListener('pageshow',         updateMetrics);
      document.removeEventListener('visibilitychange', updateMetrics);
    };
  }, [updateMetrics]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f') && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!open) {
          onOpen();
          requestAnimationFrame(() => {
            const first = drawerRef.current?.querySelector('input, select, button');
            if (first) first.focus();
          });
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpen, onClose]);

  // ── Drag gesture on tab ─────────────────────────────────────────────────────
  const dragState = useRef({
    active: false, pointerId: null,
    startX: 0, startY: 0,
    lastDX: 0, lastDY: 0,
    startCollapsed: true,
  });
  const DRAG_MAX_PX    = 96 / 2.54; // ≈ 37.8px
  const DRAG_TRIGGER   = 10;
  const VERT_BIAS      = 0.85;
  const suppressRef    = useRef(false);

  const onTabPointerDown = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const d = dragState.current;
    d.active        = true;
    d.pointerId     = e.pointerId;
    d.startX        = e.clientX;
    d.startY        = e.clientY;
    d.lastDX        = 0;
    d.lastDY        = 0;
    d.startCollapsed = !open;
    tabRef.current?.classList.add('is-dragging');
    tabRef.current?.style.setProperty('--drawer-tab-dy', '0px');
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  }, [open]);

  const onTabPointerMove = useCallback((e) => {
    const d = dragState.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    d.lastDX = dx; d.lastDY = dy;
    if (Math.abs(dy) < Math.abs(dx) * VERT_BIAS) {
      tabRef.current?.style.setProperty('--drawer-tab-dy', '0px');
      return;
    }
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    const visual = d.startCollapsed
      ? (dy > 0 ? clamp(dy, 0, DRAG_MAX_PX) : 0)
      : (dy < 0 ? clamp(dy, -DRAG_MAX_PX, 0) : 0);
    tabRef.current?.style.setProperty('--drawer-tab-dy', `${visual}px`);
  }, []);

  const resetDrag = useCallback(() => {
    dragState.current.active = false;
    tabRef.current?.classList.remove('is-dragging');
    tabRef.current?.style.setProperty('--drawer-tab-dy', '0px');
  }, []);

  const onTabPointerUp = useCallback((e) => {
    const d = dragState.current;
    if (d.pointerId !== e.pointerId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    const dy = d.lastDY;
    const isVert = Math.abs(dy) >= Math.abs(d.lastDX) * VERT_BIAS;
    if (isVert && Math.abs(dy) >= DRAG_TRIGGER) {
      suppressRef.current = true;
      if (d.startCollapsed && dy > 0) { onOpen();  resetDrag(); return; }
      if (!d.startCollapsed && dy < 0) { onClose(); resetDrag(); return; }
    }
    resetDrag();
  }, [onOpen, onClose, resetDrag]);

  const onTabClick = useCallback(() => {
    if (suppressRef.current) { suppressRef.current = false; return; }
    open ? onClose() : onOpen();
  }, [open, onOpen, onClose]);

  // ── Levels and completeness options (static) ────────────────────────────────
  const levelOptions       = difficultyLevels || ['beginner', 'intermediate', 'advanced'];
  const completenessOptions = ['Completed', 'Attempted', 'Not started'];

  // ── Render ──────────────────────────────────────────────────────────────────
  const drawerContent = (
    <div className="drawer-wrap" id="drawerWrap">
      {/* Filter drawer panel */}
      <div
        ref={drawerRef}
        className="filter-drawer"
        id="filterDrawer"
        role="region"
        aria-label="Exercise filters and sorting"
        aria-hidden={!open}
      >
        <div className="filter-left">
          <div className="filter-header">
            <div className="filter-title">FILTER PALETTE</div>
            <button
              className="filter-close"
              id="drawerClose"
              type="button"
              aria-label="Close filters"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="filter-body">
            <div className="filter-grid">

              {/* Category */}
              <FilterGroup
                name="category"
                label="Category"
                tooltip="Filter by topic area. Choose multiple categories."
                options={categories || []}
                selected={selectedCategories}
                onToggle={toggleCategories}
              />

              {/* Proficiency Level */}
              <FilterGroup
                name="level"
                label="Proficiency Level"
                tooltip="Filter by difficulty level. Choose multiple levels."
                options={levelOptions}
                selected={selectedLevels}
                onToggle={toggleLevels}
              />

              {/* Completeness */}
              <FilterGroup
                name="completeness"
                label="Completeness"
                tooltip="Filter by completion status."
                options={completenessOptions}
                selected={selectedCompleteness}
                onToggle={toggleCompleteness}
              />

              {/* Exercise Type — micro track only */}
              {isMicro && exerciseTypes && exerciseTypes.length > 0 && (
                <FilterGroup
                  name="exercisetype"
                  label="Exercise Type"
                  tooltip="Filter by exercise type — e.g. Implementation, Analytical, Debugging, Design. Micro Challenges only."
                  options={exerciseTypes}
                  selected={selectedExerciseTypes}
                  onToggle={toggleExerciseTypes}
                />
              )}

              {/* Mental Models — micro track only */}
              {isMicro && mentalModels && mentalModels.length > 0 && (
                <FilterGroup
                  name="mentalmodel"
                  label="Mental Models"
                  tooltip="Filter by the algorithmic mental model or pattern — e.g. Sliding Window, Two Pointers, Hash Map. Micro Challenges only."
                  options={mentalModels}
                  selected={selectedMentalModels}
                  onToggle={toggleMentalModels}
                />
              )}
            </div>

            {/* Sort + Apply */}
            <div className="filter-actions">
              <div className="sort-controls" aria-label="Sorting controls">
                <label className="sort-label" htmlFor="sortField">Sort by</label>
                <select
                  id="sortField"
                  name="sortField"
                  aria-label="Sort by"
                  value={sortField}
                  onChange={e => updateSortField(e.target.value)}
                >
                  <option value="title">A–Z</option>
                  <option value="category">Category</option>
                  <option value="level">Proficiency</option>
                  <option value="completeness">Completeness</option>
                </select>
                <select
                  id="sortDir"
                  name="sortDir"
                  aria-label="Sort direction"
                  value={sortDir}
                  onChange={e => updateSortDir(e.target.value)}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
              <button
                className="apply-btn"
                id="applyFilters"
                type="button"
                onClick={onClose}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer tab (the visible strip that triggers open/close) */}
      <button
        ref={tabRef}
        className="drawer-tab"
        id="drawerTab"
        type="button"
        aria-label="Toggle filters"
        aria-expanded={open}
        aria-controls="filterDrawer"
        title="Filters — Ctrl+Shift+F"
        onClick={onTabClick}
        onPointerDown={onTabPointerDown}
        onPointerMove={onTabPointerMove}
        onPointerUp={onTabPointerUp}
        onPointerCancel={resetDrag}
      >
        <span className="tab-grill" aria-hidden="true" />
        <span className="drawer-chevron" aria-hidden="true" />
      </button>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
