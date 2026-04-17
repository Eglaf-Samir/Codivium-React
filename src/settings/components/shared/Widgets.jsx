// components/shared/Toast.jsx
import React from 'react';

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className="as-toast"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(14,16,26,0.96)',
        border: `1px solid ${toast.isError ? 'rgba(220,80,80,0.40)' : 'rgba(246,213,138,0.35)'}`,
        color: 'rgba(245,245,252,0.92)', borderRadius: '12px', padding: '10px 18px',
        fontSize: '13px', fontFamily: 'var(--font-ui)', zIndex: 9999,
        boxShadow: '0 16px 40px rgba(0,0,0,0.55)', pointerEvents: 'none',
      }}
    >
      {toast.msg}
    </div>
  );
}

// ── PrefToggle ───────────────────────────────────────────────────────────────

export function PrefToggle({ label, hint, checked, onChange, id }) {
  const inputId = id || `pref-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="as-row">
      <div className="as-row-text">
        <div className="as-row-label">{label}</div>
        {hint && <div className="as-row-hint">{hint}</div>}
      </div>
      <label className="as-switch" aria-label={label}>
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="as-slider" />
      </label>
    </div>
  );
}

// ── ThemeChipGrid ─────────────────────────────────────────────────────────────

export function ThemeChipGrid({ themes, currentKey, onSelect, ariaLabel }) {
  return (
    <div className="as-theme-grid" role="radiogroup" aria-label={ariaLabel}>
      {themes.map((theme) => {
        const isLight = theme.dot?.startsWith('#F') || theme.dot?.startsWith('#E');
        const isActive = theme.key === currentKey;
        return (
          <button
            key={theme.key}
            type="button"
            className={`as-theme-chip${isActive ? ' active' : ''}`}
            role="radio"
            aria-checked={isActive}
            aria-label={`${theme.name} ${ariaLabel}`}
            data-theme-key={theme.key}
            onClick={() => onSelect(theme.key)}
          >
            <span
              className="as-theme-dot"
              style={{
                background: theme.dot,
                borderColor: isLight ? 'rgba(255,255,255,0.25)' : undefined,
              }}
            />
            {theme.name}
          </button>
        );
      })}
    </div>
  );
}

// ── SiteThemeChipGrid ─────────────────────────────────────────────────────────

export function SiteThemeChipGrid({ currentKey, onSelect }) {
  const CVTheme = window.CVTheme;
  if (!CVTheme) return null;

  return (
    <div className="as-theme-grid" id="asSiteThemeGrid" role="radiogroup" aria-label="Site theme">
      {CVTheme.VALID.map((key) => {
        const sw      = CVTheme.SWATCHES[key];
        const label   = CVTheme.LABELS?.[key] || key;
        const isActive = key === currentKey;
        return (
          <button
            key={key}
            type="button"
            className={`as-theme-chip${isActive ? ' active' : ''}`}
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} site theme`}
            data-theme-key={key}
            onClick={() => {
              CVTheme.set(key);
              onSelect(key);
            }}
          >
            <span
              className="as-site-preview"
              style={{
                '--preview-bg': sw.bg,
                '--preview-accent': sw.accent,
                '--preview-accent2': sw.accent2 || sw.accent,
              }}
            >
              <span className="as-site-preview-lines">
                <span /><span /><span />
              </span>
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
