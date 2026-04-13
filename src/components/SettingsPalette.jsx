// components/SettingsPalette.jsx
// Floating settings dialog — all editor/workspace/typography/lock preferences.
import React, { useRef, useEffect } from 'react';

function Select({ id, label, value, onChange, options }) {
  return (
    <div className="palette-row">
      <label className="field-label" htmlFor={id}>{label}</label>
      <select id={id} aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ id, label, hint, checked, onChange }) {
  return (
    <div className="palette-row toggle-row">
      <div className="toggle-col">
        <div className="field-label">{label}</div>
        {hint && <div className="toggle-hint">{hint}</div>}
      </div>
      <label className="toggle">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-label={label}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span className="toggle-track" aria-hidden="true" />
      </label>
    </div>
  );
}

function LockRow({ label, minsId, attemptsId, minsVal, attemptsVal, onChangeMins, onChangeAttempts, hasMins = true }) {
  return (
    <div className="palette-row">
      <div className="field-label">{label}</div>
      <div className="cv-lock-row">
        {hasMins && (
          <>
            <span className="toggle-hint">time:</span>
            <input className="cv-lock-num" id={minsId}
              aria-label={`${label} unlock delay in minutes`}
              type="number" min="0" max="120" value={minsVal}
              onChange={e => onChangeMins(Number(e.target.value))} />
            <span className="cv-lock-sep">min, or</span>
          </>
        )}
        {!hasMins && <span className="toggle-hint">first</span>}
        <input className="cv-lock-num" id={attemptsId}
          aria-label={`${label} unlock after attempts`}
          type="number" min="1" max="20" value={attemptsVal}
          onChange={e => onChangeAttempts(Number(e.target.value))} />
        <span className="cv-lock-sep">{hasMins ? 'sub' : 'submission'}</span>
        {!hasMins && <><span /><span /></>}
      </div>
    </div>
  );
}

const SYNTAX_THEMES = [
  { value: 'obsidian-code',     label: 'Obsidian Code (Dark)' },
  { value: 'midnight-terminal', label: 'Midnight Terminal (Dark)' },
  { value: 'carbon-ink',        label: 'Carbon Ink (Dark)' },
  { value: 'graphite-neon',     label: 'Graphite Neon (Dark)' },
  { value: 'aurora-nightfall',  label: 'Aurora Nightfall (Dark)' },
  { value: 'porcelain-codebook',label: 'Porcelain Codebook (Light)' },
  { value: 'ivory-syntax',      label: 'Ivory Syntax (Light)' },
  { value: 'champagne-console', label: 'Champagne Console (Light)' },
  { value: 'slate-studio',      label: 'Slate Studio (Mid)' },
  { value: 'mist-meridian',     label: 'Mist Meridian (Mid/Light)' },
];
const WS_THEMES = [
  { value: 'original',               label: 'Original' },
  { value: 'dark-obsidian-luxe',     label: 'Obsidian Luxe (Dark)' },
  { value: 'dark-midnight-velvet',   label: 'Midnight Velvet (Dark)' },
  { value: 'dark-noir-platinum',     label: 'Noir Platinum (Dark)' },
  { value: 'dark-carbon-and-gold',   label: 'Carbon & Gold (Dark)' },
  { value: 'light-ivory-atelier',    label: 'Ivory Atelier (Light)' },
  { value: 'light-porcelain-minimal',label: 'Porcelain Minimal (Light)' },
  { value: 'light-champagne-quartz', label: 'Champagne Quartz (Light)' },
  { value: 'dark-graphite-smoke',    label: 'Graphite Smoke (Dark)' },
  { value: 'dark-sable-and-silk',    label: 'Sable & Silk (Dark)' },
  { value: 'light-slate-meridian',   label: 'Slate Meridian (Light)' },
];
const FONT_FAMILIES_MONO = [
  { value: 'system-mono',    label: 'System Mono' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono' },
  { value: 'fira-code',      label: 'Fira Code' },
  { value: 'source-code-pro',label: 'Source Code Pro' },
  { value: 'ibm-plex-mono',  label: 'IBM Plex Mono' },
  { value: 'inconsolata',    label: 'Inconsolata' },
];
const FONT_FAMILIES_UI = [
  { value: 'auto',           label: 'Auto' },
  { value: 'cinzel',         label: 'Cinzel' },
  { value: 'system-sans',    label: 'System Sans' },
  { value: 'system-serif',   label: 'System Serif' },
  { value: 'system-mono',    label: 'System Mono' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono' },
  { value: 'fira-code',      label: 'Fira Code' },
  { value: 'source-code-pro',label: 'Source Code Pro' },
  { value: 'ibm-plex-mono',  label: 'IBM Plex Mono' },
  { value: 'inconsolata',    label: 'Inconsolata' },
];
const FONT_SIZES = [
  { value: 'auto', label: 'Auto' },
  ...['12px','13px','14px','15px','16px','18px'].map(v => ({ value: v, label: v.replace('px','') })),
];
const FONT_SIZES_EDITOR = [
  ...['12px','13px','14px','15px','16px','18px'].map(v => ({ value: v, label: v.replace('px','') })),
];

export default function SettingsPalette({ open, onClose, settings, lockCfg, onLockCfgChange }) {
  const panelRef  = useRef(null);
  const s = settings;

  // Trap focus inside dialog
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector('button, select, input, [tabindex="0"]');
    el?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && open) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const [draft, setDraft] = React.useState({});
  // Reset draft whenever palette opens
  useEffect(() => { if (open) setDraft({}); }, [open]);

  const d = (key) => draft[key] !== undefined ? draft[key] : (key === 'cfg' ? lockCfg : s[key]);
  const u = (key) => (val) => setDraft(prev => ({ ...prev, [key]: val }));

  function handleApply() {
    // Apply regular settings
    const { cfg: draftCfg, ...settingsDraft } = draft;
    s.apply(settingsDraft);
    // Apply lock config changes separately (managed by useLocks, not useSettings)
    if (draftCfg && onLockCfgChange) {
      onLockCfgChange({ ...lockCfg, ...draftCfg });
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="settings-overlay open" id="settingsOverlay" aria-hidden={!open}>
      <div
        className="settings-backdrop"
        id="settingsBackdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="palette-window"
        id="settingsPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settingsTitle"
      >
        {/* Topbar */}
        <div className="palette-topbar">
          <div className="palette-title" id="settingsTitle">Settings</div>
          <div className="palette-top-controls">
            <label className="pal-opacity-label" htmlFor="palTransparency">
              <span className="pal-opacity-text">Transparency</span>
              <input id="palTransparency" type="range" min="0" max="100" step="1"
                aria-label="Palette transparency slider"
                defaultValue={0}
                onChange={e => {
                  document.documentElement.style.setProperty(
                    '--pal-bg-strength', String(1 - e.target.value / 100)
                  );
                }}
              />
            </label>
          </div>
          <button className="palette-close" id="settingsClose" type="button"
            aria-label="Close settings" onClick={onClose}>✕</button>
        </div>

        <div className="palette-content">
          <div className="palette-inner">
            {/* Editor */}
            <div className="palette-section">
              <div className="palette-title">Editor</div>
              <Select id="syntaxThemeSelect" label="Syntax Highlighting"
                value={d('syntaxTheme')} onChange={u('syntaxTheme')} options={SYNTAX_THEMES} />
              <Select id="editorFontSizeSelect" label="Editor Font Size"
                value={d('editorFontSize')} onChange={u('editorFontSize')} options={FONT_SIZES_EDITOR} />
              <Select id="editorFontFamilySelect" label="Editor Font"
                value={d('editorFontFamily')} onChange={u('editorFontFamily')} options={FONT_FAMILIES_MONO} />
              <Toggle id="editorBoldToggle" label="Bold"
                checked={d('editorBold')} onChange={u('editorBold')} />
            </div>

            {/* Workspace */}
            <div className="palette-section">
              <div className="palette-title">Workspace</div>
              <Select id="pageThemeSelect" label="Theme"
                value={d('wsTheme')} onChange={u('wsTheme')} options={WS_THEMES} />
              <Toggle id="applyThemeToPaletteToggle" label="Theme Palette"
                hint="Apply the selected workspace theme to this palette"
                checked={d('paletteThemed')} onChange={u('paletteThemed')} />
              <Toggle id="glassToggle" label="Glassmorphic"
                hint="Toggle window sheen"
                checked={d('glassOn')} onChange={u('glassOn')} />
              <Toggle id="globalThemeToggle" label="Global Theme"
                hint="Use the same workspace theme across all pages"
                checked={d('globalTheme')} onChange={u('globalTheme')} />
            </div>

            {/* Instructions & Hints */}
            <div className="palette-section">
              <div className="palette-title">Instructions &amp; Hints</div>
              <Select id="leftInfoFontFamilySelect" label="Font"
                value={d('leftFontFamily')} onChange={u('leftFontFamily')} options={FONT_FAMILIES_UI} />
              <Select id="leftInfoFontSizeSelect" label="Size"
                value={d('leftFontSize')} onChange={u('leftFontSize')} options={FONT_SIZES} />
              <Toggle id="leftInfoBoldToggle" label="Bold"
                checked={d('leftBold')} onChange={u('leftBold')} />
            </div>

            {/* Unit Tests */}
            <div className="palette-section">
              <div className="palette-title">Unit Tests</div>
              <Select id="testsFontFamilySelect" label="Font"
                value={d('testsFontFamily')} onChange={u('testsFontFamily')} options={FONT_FAMILIES_UI} />
              <Select id="testsFontSizeSelect" label="Size"
                value={d('testsFontSize')} onChange={u('testsFontSize')} options={FONT_SIZES} />
              <Toggle id="testsBoldToggle" label="Bold"
                checked={d('testsBold')} onChange={u('testsBold')} />
            </div>

            {/* REPL */}
            <div className="palette-section">
              <div className="palette-title">REPL</div>
              <Select id="replFontFamilySelect" label="Font"
                value={d('replFontFamily')} onChange={u('replFontFamily')} options={FONT_FAMILIES_UI} />
              <Select id="replFontSizeSelect" label="Size"
                value={d('replFontSize')} onChange={u('replFontSize')} options={FONT_SIZES} />
            </div>
          </div>

          {/* Lock config — full width */}
          <div className="palette-section">
            <div className="palette-title">Tab Access Timing</div>
            <LockRow label="Hints — unlock after"
              minsId="lockHintsMins" attemptsId="lockHintsAttempts"
              minsVal={d('cfg')?.hints?.minutes ?? 2}
              attemptsVal={d('cfg')?.hints?.attempts ?? 2}
              onChangeMins={v => u('cfg')({ ...d('cfg'), hints: { ...d('cfg')?.hints, minutes: v } })}
              onChangeAttempts={v => u('cfg')({ ...d('cfg'), hints: { ...d('cfg')?.hints, attempts: v } })}
            />
            <LockRow label="Mini Tutorial"
              minsId="lockTutorialMins" attemptsId="lockTutorialAttempts"
              minsVal={d('cfg')?.tutorial?.minutes ?? 4}
              attemptsVal={d('cfg')?.tutorial?.attempts ?? 3}
              onChangeMins={v => u('cfg')({ ...d('cfg'), tutorial: { ...d('cfg')?.tutorial, minutes: v } })}
              onChangeAttempts={v => u('cfg')({ ...d('cfg'), tutorial: { ...d('cfg')?.tutorial, attempts: v } })}
            />
            <LockRow label="Suggested Solution"
              minsId="lockSolutionMins" attemptsId="lockSolutionAttempts"
              minsVal={d('cfg')?.solution?.minutes ?? 7}
              attemptsVal={d('cfg')?.solution?.attempts ?? 5}
              onChangeMins={v => u('cfg')({ ...d('cfg'), solution: { ...d('cfg')?.solution, minutes: v } })}
              onChangeAttempts={v => u('cfg')({ ...d('cfg'), solution: { ...d('cfg')?.solution, attempts: v } })}
            />
            <LockRow label="Unit Tests — unlock after"
              minsId="lockTestsMins" attemptsId="lockTestsAttempts"
              minsVal={0} attemptsVal={d('cfg')?.tests?.attempts ?? 1}
              hasMins={false}
              onChangeMins={() => {}}
              onChangeAttempts={v => u('cfg')({ ...d('cfg'), tests: { ...d('cfg')?.tests, attempts: v } })}
            />
          </div>
        </div>

        <div className="palette-actions">
          <button className="apply-btn" id="applyAllControls" type="button" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
