// components/AppearancePanel.jsx
// Appearance tab with four sub-panels: General, Code Editor, REPL, Instructions.

import React from 'react';
import { PrefToggle, ThemeChipGrid, SiteThemeChipGrid } from './shared/Widgets.jsx';
import { CodePreview, FontSelect } from './shared/CodePreview.jsx';
import { EDITOR_THEMES } from '../utils/themes.js';
import {
  CODE_FONT_SIZES, PROSE_FONT_SIZES,
  CODE_FONT_FAMILIES, PROSE_FONT_FAMILIES,
} from '../utils/prefs.js';

export default function AppearancePanel({ prefs, setPref, activeSubTab }) {
  const isLow = prefs.reduce_motion === '1';
  const drawerSpeed = isLow ? 0 : parseInt(prefs.cv_drawer_speed, 10);

  // Site theme — read current from CVTheme
  const currentSiteTheme = window.CVTheme?.get?.() || 'original';

  return (
    <div className="as-tab-panel" id="tab-appear" role="tabpanel" aria-labelledby="tabn-appear" tabIndex={0}>
      <section className="as-section" aria-label="Appearance">
        <div className="as-section-head">
          <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="as-section-title">Appearance</span>
        </div>

        {/* ── General ─────────────────────────────────────────────────── */}
        <div className={`as-subpanel${activeSubTab === 'general' ? ' active' : ''}`} id="asp-general" role="tabpanel">

          <div className="as-subpanel-label">Site Theme</div>
          <div className="as-row as-row-col">
            <div className="as-row-hint">Choose a visual theme for the platform.</div>
          </div>
          <SiteThemeChipGrid
            currentKey={currentSiteTheme}
            onSelect={() => { /* CVTheme.set() called inside component */ }}
          />

          <div className="as-subpanel-label">Dashboard Layout</div>
          <div className="as-row">
            <div className="as-row-text">
              <div className="as-row-label">Performance Insights default layout</div>
              <div className="as-row-hint">Which layout opens when you launch Performance Insights.</div>
            </div>
            <div className="as-row-controls">
              <select
                className="as-select" id="asDashLayout" aria-label="Dashboard layout preset"
                value={prefs.as_dash_layout}
                onChange={e => setPref('as_dash_layout', e.target.value)}
              >
                <option value="full">Full Dashboard</option>
                <option value="coding_core">Coding Core</option>
                <option value="info_only">Summary / Info Only</option>
                <option value="scores_only">Scores Only</option>
                <option value="heatmap_focus">Heatmap Focus</option>
              </select>
            </div>
          </div>

          <div className="as-subpanel-label">Accessibility</div>
          <PrefToggle
            label="Reduce motion"
            hint="Minimise animations and transitions across the platform."
            checked={isLow}
            onChange={v => setPref('reduce_motion', v ? '1' : '0')}
          />

          <div className="as-row" id="asDrawerSpeedRow">
            <div className="as-row-text">
              <div className="as-row-label">Filter panel slide speed</div>
              <div className="as-row-hint">
                How fast the filter drawer slides in and out.{' '}
                <span id="asDrawerSpeedLabel">{drawerSpeed}ms</span>
              </div>
            </div>
            <div className="as-row-controls">
              <input
                type="range" className="as-range" id="asDrawerSpeed"
                min={0} max={500} step={10}
                value={drawerSpeed}
                disabled={isLow}
                aria-label="Filter drawer slide speed"
                onChange={e => setPref('cv_drawer_speed', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Code Editor ──────────────────────────────────────────────── */}
        <div className={`as-subpanel${activeSubTab === 'editor' ? ' active' : ''}`} id="asp-editor" role="tabpanel">

          <div className="as-subpanel-label">Colour Theme</div>
          <div className="as-row as-row-col">
            <div className="as-row-hint">Applied to the code editor panes (Candidate Solution &amp; Suggested Solution).</div>
          </div>
          <ThemeChipGrid
            themes={EDITOR_THEMES}
            currentKey={prefs.cv_syntax_theme}
            onSelect={key => setPref('cv_syntax_theme', key)}
            ariaLabel="Editor colour theme"
          />
          <CodePreview
            themeKey={prefs.cv_syntax_theme}
            fontSize={prefs.cv_editor_font_size}
            fontFamily={prefs.cv_editor_font_family}
            filename="preview.py"
          />

          <div className="as-subpanel-label">Typography</div>
          <FontSelect
            label="Font size" hint="Code text size in editor panels."
            id="asEditorFontSize" options={CODE_FONT_SIZES}
            value={prefs.cv_editor_font_size}
            onChange={v => setPref('cv_editor_font_size', v)}
          />
          <FontSelect
            label="Font family" hint="Monospace font used in code panels."
            id="asEditorFontFamily" options={CODE_FONT_FAMILIES}
            value={prefs.cv_editor_font_family}
            onChange={v => setPref('cv_editor_font_family', v)}
          />
        </div>

        {/* ── REPL ─────────────────────────────────────────────────────── */}
        <div className={`as-subpanel${activeSubTab === 'repl' ? ' active' : ''}`} id="asp-repl" role="tabpanel">

          <div className="as-subpanel-label">Colour Theme</div>
          <div className="as-row as-row-col">
            <div className="as-row-hint">Applied to the REPL input and output panels, independently of the code editor.</div>
          </div>
          <ThemeChipGrid
            themes={EDITOR_THEMES}
            currentKey={prefs.cv_repl_syntax_theme}
            onSelect={key => setPref('cv_repl_syntax_theme', key)}
            ariaLabel="REPL colour theme"
          />
          <CodePreview
            themeKey={prefs.cv_repl_syntax_theme}
            fontSize={prefs.cv_repl_font_size}
            fontFamily={prefs.cv_repl_font_family}
            filename="repl >>>"
          />

          <div className="as-subpanel-label">Typography</div>
          <FontSelect
            label="Font size" hint="Text size in REPL input and output."
            id="asReplFontSize" options={CODE_FONT_SIZES}
            value={prefs.cv_repl_font_size}
            onChange={v => setPref('cv_repl_font_size', v)}
          />
          <FontSelect
            label="Font family" hint="Monospace font used in REPL panels."
            id="asReplFontFamily" options={CODE_FONT_FAMILIES}
            value={prefs.cv_repl_font_family}
            onChange={v => setPref('cv_repl_font_family', v)}
          />
        </div>

        {/* ── Instructions & Tutorial ───────────────────────────────────── */}
        <div className={`as-subpanel${activeSubTab === 'instruct' ? ' active' : ''}`} id="asp-instruct" role="tabpanel">

          <div className="as-subpanel-label">Typography</div>
          <FontSelect
            label="Font size" hint="Prose text size in instructions, hints, and tests panels."
            id="asInstructionsFontSize" options={PROSE_FONT_SIZES}
            value={prefs.cv_instructions_font_size}
            onChange={v => setPref('cv_instructions_font_size', v)}
          />
          <FontSelect
            label="Font family" hint="Font used for instructions and tutorial prose."
            id="asInstructionsFontFamily" options={PROSE_FONT_FAMILIES}
            value={prefs.cv_instructions_font_family}
            onChange={v => setPref('cv_instructions_font_family', v)}
          />

          <div className="as-subpanel-label as-subpanel-label--spaced">Site Tour</div>
          <PrefToggle
            label='Show "Codivium Site Tour" button'
            hint="Display the tour launch button in the top navigation bar on the Adaptive Practice page"
            checked={prefs.show_tour_btn === '1'}
            onChange={v => setPref('show_tour_btn', v ? '1' : '0')}
          />

          <div className="as-subpanel-label as-subpanel-label--spaced">Analytics &amp; Data</div>
          <PrefToggle
            label="Allow analytics cookies"
            hint="Permits anonymous usage data to be sent to Codivium's analytics service. No personal data or code content is ever included."
            id="asAnalyticsConsent"
            checked={prefs.analytics_consent === '1'}
            onChange={v => setPref('analytics_consent', v ? '1' : '0')}
          />
          <PrefToggle
            label="Allow performance monitoring"
            hint="Permits anonymous error reports and load-time measurements to help diagnose platform issues. No code content or personal data is included."
            id="asPerformanceConsent"
            checked={prefs.performance_consent === '1'}
            onChange={v => setPref('performance_consent', v ? '1' : '0')}
          />
          <div className="as-info-note" id="asAnalyticsNote">
            <svg className="as-info-note-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>Analytics cookies are not yet active. These preferences will take effect once analytics is enabled on the platform.</span>
          </div>
        </div>

      </section>
    </div>
  );
}
