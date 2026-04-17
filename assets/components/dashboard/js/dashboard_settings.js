(function(){
  'use strict';

  const STORAGE_KEY = 'cv.dashboard.ui';
  const DEFAULTS = {
    mode: 'full',
    panels: {
      scores: true,
      depth: true,
      heatmap: true,
      time: true,
      allocation: true,
      mcq: true,
      infoPane: true
    }
  };

  function normalizeMode(mode){
    const m = String(mode || '').trim().toLowerCase();
    if (m === 'info_only' || m === 'info-only' || m === 'summary' || m === 'summary_only' || m === 'summary-only') return 'info_only';
    return 'full';
  }

  function normalizePanels(panels){
    const out = Object.assign({}, DEFAULTS.panels);
    if (!panels || typeof panels !== 'object') return out;
    Object.keys(out).forEach((k) => {
      const v = panels[k];
      if (typeof v === 'boolean') out[k] = v;
      else if (typeof v === 'number') out[k] = !!v;
      else if (typeof v === 'string'){
        const s = v.trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes' || s === 'on') out[k] = true;
        else if (s === '0' || s === 'false' || s === 'no' || s === 'off') out[k] = false;
      }
    });
    return out;
  }

  function readPrefs(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { mode: DEFAULTS.mode, panels: Object.assign({}, DEFAULTS.panels) };
      const obj = JSON.parse(raw);
      return { mode: normalizeMode(obj.mode), panels: normalizePanels(obj.panels) };
    } catch (e) {
      return { mode: DEFAULTS.mode, panels: Object.assign({}, DEFAULTS.panels) };
    }
  }

  function writePrefs(prefs){
    const out = {
      mode: normalizeMode(prefs.mode),
      panels: normalizePanels(prefs.panels)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  }

  function $(id){ return document.getElementById(id); }

  function setModeUI(mode){
    const full = $('modeFull');
    const info = $('modeInfoOnly');
    if (full) full.checked = (mode === 'full');
    if (info) info.checked = (mode === 'info_only');

    const disable = (mode === 'info_only');
    document.querySelectorAll('[data-panel-toggle]').forEach((el) => {
      el.disabled = disable;
      el.closest('.cvCheckRow')?.classList.toggle('isDisabled', disable);
    });

    const warn = $('modeWarn');
    if (warn){
      warn.textContent = disable
        ? 'Summary View shows only the right-side analysis pane (phone-friendly). Panel toggles apply only to Full Dashboard mode.'
        : '';
    }
  }

  function setPanelsUI(panels){
    Object.keys(DEFAULTS.panels).forEach((k) => {
      const el = document.querySelector(`[data-panel-toggle="${k}"]`);
      if (!el) return;
      el.checked = !!panels[k];
    });
  }

  function getPanelsFromUI(){
    const out = Object.assign({}, DEFAULTS.panels);
    Object.keys(out).forEach((k) => {
      const el = document.querySelector(`[data-panel-toggle="${k}"]`);
      if (!el) return;
      out[k] = !!el.checked;
    });
    return out;
  }

  function getModeFromUI(){
    const info = $('modeInfoOnly');
    return (info && info.checked) ? 'info_only' : 'full';
  }

  function bind(){
    const saveBtn = $('saveBtn');
    const resetBtn = $('resetBtn');
    const openBtn = $('openDashboardBtn');

    document.querySelectorAll('input[name="mode"]').forEach((r) => {
      r.addEventListener('change', () => {
        setModeUI(getModeFromUI());
      });
    });

    if (saveBtn){
      saveBtn.addEventListener('click', () => {
        const prefs = { mode: getModeFromUI(), panels: getPanelsFromUI() };
        writePrefs(prefs);
        saveBtn.textContent = 'Saved ✓';
        setTimeout(() => { saveBtn.textContent = 'Save settings'; }, 900);
      });
    }

    if (resetBtn){
      resetBtn.addEventListener('click', () => {
        writePrefs(DEFAULTS);
        const prefs = readPrefs();
        setModeUI(prefs.mode);
        setPanelsUI(prefs.panels);
        resetBtn.textContent = 'Reset ✓';
        setTimeout(() => { resetBtn.textContent = 'Reset to defaults'; }, 900);
      });
    }

    if (openBtn){
      openBtn.addEventListener('click', () => {
        window.location.href = 'codivium_insights_embedded.html';
      });
    }
  }

  function init(){
    const prefs = readPrefs();
    setModeUI(prefs.mode);
    setPanelsUI(prefs.panels);

    const note = $('currentNote');
    if (note){
      note.textContent = `Stored preference: mode=${prefs.mode}, panels=${Object.keys(prefs.panels).filter(k=>prefs.panels[k]).join(', ') || 'none'}.`;
    }

    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
