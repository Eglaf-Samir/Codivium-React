// SettingsPage.jsx — Account & Settings with working theme picker
import React, { useEffect, useRef } from 'react';

function loadScript(src, onload) {
  const s = document.createElement('script');
  s.src = src + '?v=' + Date.now();
  if (onload) s.onload = onload;
  document.body.appendChild(s);
  return s;
}

// Set window.CVTheme directly — no script tag injection
function setupCVTheme() {
  if (window.CVTheme) return;
  window.CVTheme = {
    VALID:   ['obsidian','midnight','carbon','graphite','porcelain','ivory'],
    LABELS:  { obsidian:'Obsidian', midnight:'Midnight', carbon:'Carbon Ink',
                graphite:'Graphite Neon', porcelain:'Porcelain', ivory:'Ivory Syntax' },
    SWATCHES: {
      obsidian:  { bg:'#0B1020', accent:'#A78BFA' },
      midnight:  { bg:'#070812', accent:'#B9A2FF' },
      carbon:    { bg:'#0A0A0B', accent:'#D9C07C' },
      graphite:  { bg:'#1A1A2E', accent:'#A78BFA' },
      porcelain: { bg:'#F5F3EE', accent:'#6D4A1C' },
      ivory:     { bg:'#F7F5F0', accent:'#7B5728' },
    },
    get: function() {
      try { return localStorage.getItem('cv_site_theme') || 'obsidian'; } catch(e) { return 'obsidian'; }
    },
    set: function(key) {
      try { localStorage.setItem('cv_site_theme', key); } catch(e) {}
      document.documentElement.setAttribute('data-theme', key);
    },
  };
  try {
    document.documentElement.setAttribute('data-theme', window.CVTheme.get());
  } catch(e) {}
}

export default function SettingsPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Step 1: set window.CVTheme directly (no DOM injection = no React conflict)
    setupCVTheme();

    // Step 2: load demo data, then load the settings controller
    const s1 = loadScript('/account-settings-demo.js', () => {
      loadScript('/account-settings.js');
    });

    return () => {
      try { document.body.removeChild(s1); } catch (_) {}
    };
  }, []);

  return (
    <main id="main-content" className="main cv-settings" role="main">
      <div className="as-wrap">
        <div className="as-window">
          <div className="as-window-title">Account &amp; Settings</div>
          <div className="as-window-scroll">
            <div className="as-inner">

              {/* ── Main tabs ── */}
              <div className="as-tabs" role="tablist" aria-label="Settings sections">
                <button className="as-tab active" role="tab" aria-selected="true"
                  aria-controls="tab-account" id="tabn-account" type="button" data-tab="account">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>Account
                </button>
                <button className="as-tab" role="tab" aria-selected="false"
                  aria-controls="tab-billing" id="tabn-billing" type="button" data-tab="billing">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
                  </svg>Billing
                </button>
                <button className="as-tab" role="tab" aria-selected="false"
                  aria-controls="tab-notif" id="tabn-notif" type="button" data-tab="notif">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>Notifications
                </button>
                <button className="as-tab" role="tab" aria-selected="false"
                  aria-controls="tab-appear" id="tabn-appear" type="button" data-tab="appear">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>Appearance
                </button>
              </div>

              {/* Sub-tab nav (hidden until Appearance tab active) */}
              <div className="as-subtabs" role="tablist" aria-label="Appearance sections" hidden>
                <button className="as-subtab active" role="tab" aria-selected="true" aria-controls="asp-general" data-subtab="general" type="button">General</button>
                <button className="as-subtab" role="tab" aria-selected="false" aria-controls="asp-editor" data-subtab="editor" type="button">Code Editor</button>
                <button className="as-subtab" role="tab" aria-selected="false" aria-controls="asp-repl" data-subtab="repl" type="button">REPL</button>
                <button className="as-subtab" role="tab" aria-selected="false" aria-controls="asp-instruct" data-subtab="instruct" type="button">Instructions &amp; Tutorial</button>
              </div>

              <div className="as-tab-panels">

                {/* ── ACCOUNT ── */}
                <div className="as-tab-panel" id="tab-account" role="tabpanel" aria-labelledby="tabn-account" tabIndex="0">
                  <section className="as-section" aria-label="Account and Identity">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="as-section-title">Account &amp; Identity</span>
                    </div>
                    <div className="as-avatar-row">
                      <img id="asAvatarImg" src="/assets/img/profile-placeholder.svg" alt="Profile photo" className="as-avatar"/>
                      <div className="as-avatar-text">
                        <div className="as-row-label">Profile photo</div>
                        <div className="as-row-hint">JPG or PNG, up to 2 MB</div>
                      </div>
                      <div className="as-avatar-btns">
                        <button className="as-btn" type="button" id="asAvatarUploadBtn">Upload</button>
                        <button className="as-btn" type="button" id="asAvatarRemoveBtn">Remove</button>
                      </div>
                      <input type="file" id="asAvatarFile" accept="image/jpeg,image/png" className="as-file-hidden" aria-label="Upload profile photo"/>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Display name</div>
                        <div className="as-row-hint">Your profile name</div>
                      </div>
                      <span className="as-row-value" id="asDisplayNameVal">—</span>
                      <button className="as-btn" type="button" data-modal="displayName">Change</button>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text"><div className="as-row-label">Email address</div></div>
                      <span className="as-row-value" id="asEmailVal">—</span>
                      <button className="as-btn" type="button" data-modal="email">Change</button>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Password</div>
                        <div className="as-row-hint">Use a strong password you don't use elsewhere</div>
                      </div>
                      <span className="as-row-value">••••••••</span>
                      <button className="as-btn" type="button" data-modal="password">Change</button>
                    </div>
                    <p className="as-note">Changes to email or password require your current password to confirm.</p>
                  </section>
                  <section className="as-section as-danger-zone" aria-label="Danger zone">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="as-section-title">Danger zone</span>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Delete account</div>
                        <div className="as-row-hint">Permanently removes your account, all session data, and cancels any active subscription. This cannot be undone.</div>
                      </div>
                      <button className="as-btn danger" type="button" data-modal="deleteAccount">Delete account</button>
                    </div>
                  </section>
                </div>

                {/* ── BILLING ── */}
                <div className="as-tab-panel" id="tab-billing" role="tabpanel" aria-labelledby="tabn-billing" tabIndex="0" hidden>
                  <section className="as-section" aria-label="Subscription and Billing">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="as-section-title">Subscription &amp; Billing</span>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Current plan</div>
                        <div className="as-row-hint" id="asPlanRenewal">—</div>
                      </div>
                      <span className="as-plan-badge" id="asPlanBadge">—</span>
                      <button className="as-btn primary" type="button" id="asUpgradeBtn">Upgrade</button>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Payment method</div>
                        <div className="as-row-hint" id="asPaymentHint">No payment method on file</div>
                      </div>
                      <button className="as-btn" type="button" data-modal="payment">Manage</button>
                    </div>
                    <div className="as-scroll-x">
                      <table className="as-billing-table" aria-label="Billing history">
                        <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Invoice</th></tr></thead>
                        <tbody id="asBillingRows">
                          <tr><td colSpan="4" className="as-billing-empty">No billing history yet</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Cancel subscription</div>
                        <div className="as-row-hint">You'll keep access until the end of the current billing period</div>
                      </div>
                      <button className="as-btn danger" type="button" data-modal="cancelSub">Cancel plan</button>
                    </div>
                  </section>
                </div>

                {/* ── NOTIFICATIONS ── */}
                <div className="as-tab-panel" id="tab-notif" role="tabpanel" aria-labelledby="tabn-notif" tabIndex="0" hidden>
                  <section className="as-section" aria-label="Notifications">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="as-section-title">Notifications</span>
                    </div>
                    {[
                      { pref:'notif_weekly_summary', label:'Weekly progress summary', hint:'Email each Monday with your week\'s practice highlights' },
                      { pref:'notif_milestones',     label:'Milestone alerts',        hint:'Notify when you reach a new skill milestone' },
                      { pref:'notif_in_app',         label:'In-app notifications',   hint:'Show notification banners inside the platform' },
                      { pref:'notif_marketing',      label:'Product updates & tips',  hint:'Occasional emails about new features and learning tips' },
                    ].map(({ pref, label, hint }) => (
                      <div key={pref} className="as-row">
                        <div className="as-row-text">
                          <div className="as-row-label">{label}</div>
                          <div className="as-row-hint">{hint}</div>
                        </div>
                        <label className="as-switch" aria-label={label}>
                          <input type="checkbox" data-pref={pref}/><span className="as-slider"/>
                        </label>
                      </div>
                    ))}
                    <p className="as-note">Transactional emails (password reset, email verification) are always sent.</p>
                  </section>
                </div>

                {/* ── APPEARANCE ── */}
                <div className="as-tab-panel" id="tab-appear" role="tabpanel" aria-labelledby="tabn-appear" tabIndex="0" hidden>
                  <section className="as-section" aria-label="Appearance">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="as-section-title">Appearance</span>
                    </div>

                    {/* General sub-panel */}
                    <div className="as-subpanel active" id="asp-general" role="tabpanel">
                      <div className="as-subpanel-label">Site Theme</div>
                      <div className="as-row as-row-col">
                        <div className="as-row-hint">Choose a visual theme. Obsidian, Midnight, Carbon and Graphite are dark; Porcelain and Ivory are light.</div>
                      </div>
                      {/* FIX 3: this grid is populated by account-settings.js after CVTheme is injected */}
                      <div className="as-theme-grid" id="asSiteThemeGrid" role="radiogroup" aria-label="Site theme"/>

                      <div className="as-subpanel-label">Dashboard Layout</div>
                      <div className="as-row">
                        <div className="as-row-text">
                          <div className="as-row-label">Performance Insights default layout</div>
                          <div className="as-row-hint">Which layout opens when you launch Performance Insights.</div>
                        </div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asDashLayout" aria-label="Dashboard layout preset">
                            <option value="full">Full Dashboard</option>
                            <option value="coding_core">Coding Core</option>
                            <option value="info_only">Summary / Info Only</option>
                            <option value="scores_only">Scores Only</option>
                            <option value="heatmap_focus">Heatmap Focus</option>
                          </select>
                        </div>
                      </div>

                      <div className="as-subpanel-label">Accessibility</div>
                      <div className="as-row">
                        <div className="as-row-text">
                          <div className="as-row-label">Reduce motion</div>
                          <div className="as-row-hint">Minimise animations and transitions across the platform.</div>
                        </div>
                        <label className="as-switch" aria-label="Reduce motion">
                          <input type="checkbox" data-pref="reduce_motion"/><span className="as-slider"/>
                        </label>
                      </div>
                      <div className="as-row" id="asDrawerSpeedRow">
                        <div className="as-row-text">
                          <div className="as-row-label">Filter panel slide speed</div>
                          <div className="as-row-hint">How fast the filter drawer slides in and out. <span id="asDrawerSpeedLabel">154ms</span></div>
                        </div>
                        <div className="as-row-controls">
                          <input type="range" className="as-range" id="asDrawerSpeed" min="0" max="500" step="10" defaultValue="154" aria-label="Filter drawer slide speed"/>
                        </div>
                      </div>
                    </div>

                    {/* Code Editor sub-panel */}
                    <div className="as-subpanel" id="asp-editor" role="tabpanel">
                      <div className="as-subpanel-label">Colour Theme</div>
                      <div className="as-row as-row-col">
                        <div className="as-row-hint">Applied to the code editor panes.</div>
                      </div>
                      <div className="as-theme-grid" id="asEditorThemeGrid" role="radiogroup" aria-label="Editor colour theme"/>
                      <div className="as-editor-preview" id="asEditorPreview" aria-label="Editor theme preview" aria-live="polite">
                        <div className="as-ep-bar">
                          <span className="as-ep-dot as-ep-red"/><span className="as-ep-dot as-ep-amber"/><span className="as-ep-dot as-ep-green"/>
                          <span className="as-ep-filename">preview.py</span>
                        </div>
                        <div className="as-ep-code" id="asEditorPreviewCode">
                          <pre id="asEditorPreviewPre"><code id="asEditorPreviewContent"/></pre>
                        </div>
                      </div>
                      <div className="as-subpanel-label">Typography</div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font size</div><div className="as-row-hint">Code text size in editor panels.</div></div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asEditorFontSize" aria-label="Editor font size">
                            <option value="10">10px — Tiny</option><option value="11">11px — Smaller</option><option value="12">12px — Small</option>
                            <option value="13">13px — Normal</option><option value="14">14px — Medium</option><option value="15">15px — Comfortable</option>
                            <option value="16">16px — Large</option><option value="18">18px — Larger</option><option value="20">20px — Big</option>
                          </select>
                        </div>
                      </div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font family</div><div className="as-row-hint">Monospace font used in code panels.</div></div>
                        <div className="as-row-controls as-row-font-family">
                          <select className="as-select" id="asEditorFontFamily" aria-label="Editor font family">
                            <option value="system-mono">System Mono (default)</option><option value="jetbrains-mono">JetBrains Mono</option>
                            <option value="fira-code">Fira Code</option><option value="source-code-pro">Source Code Pro</option>
                            <option value="ibm-plex-mono">IBM Plex Mono</option><option value="inconsolata">Inconsolata</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* REPL sub-panel */}
                    <div className="as-subpanel" id="asp-repl" role="tabpanel">
                      <div className="as-subpanel-label">Colour Theme</div>
                      <div className="as-row as-row-col"><div className="as-row-hint">Applied to the REPL input and output panels.</div></div>
                      <div className="as-theme-grid" id="asReplThemeGrid" role="radiogroup" aria-label="REPL colour theme"/>
                      <div className="as-editor-preview" id="asReplPreview" aria-label="REPL theme preview" aria-live="polite">
                        <div className="as-ep-bar">
                          <span className="as-ep-dot as-ep-red"/><span className="as-ep-dot as-ep-amber"/><span className="as-ep-dot as-ep-green"/>
                          <span className="as-ep-filename">repl &gt;&gt;&gt;</span>
                        </div>
                        <div className="as-ep-code" id="asReplPreviewCode">
                          <pre id="asReplPreviewPre"><code id="asReplPreviewContent"/></pre>
                        </div>
                      </div>
                      <div className="as-subpanel-label">Typography</div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font size</div><div className="as-row-hint">Text size in REPL.</div></div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asReplFontSize" aria-label="REPL font size">
                            <option value="10">10px</option><option value="11">11px</option><option value="12">12px</option>
                            <option value="13">13px — Normal</option><option value="14">14px</option><option value="15">15px</option><option value="16">16px</option>
                          </select>
                        </div>
                      </div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font family</div></div>
                        <div className="as-row-controls as-row-font-family">
                          <select className="as-select" id="asReplFontFamily" aria-label="REPL font family">
                            <option value="system-mono">System Mono</option><option value="jetbrains-mono">JetBrains Mono</option>
                            <option value="fira-code">Fira Code</option><option value="source-code-pro">Source Code Pro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Instructions sub-panel */}
                    <div className="as-subpanel" id="asp-instruct" role="tabpanel">
                      <div className="as-subpanel-label">Typography</div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font size</div><div className="as-row-hint">Prose text in instructions and hints.</div></div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asInstructionsFontSize" aria-label="Instructions font size">
                            <option value="13">13px</option><option value="14">14px</option><option value="15">15px — Comfortable</option>
                            <option value="16">16px</option><option value="17">17px</option><option value="18">18px</option>
                          </select>
                        </div>
                      </div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font family</div></div>
                        <div className="as-row-controls as-row-font-family">
                          <select className="as-select" id="asInstructionsFontFamily" aria-label="Instructions font family">
                            <option value="auto">Auto (matches site theme)</option><option value="system-sans">System Sans</option>
                            <option value="noto-serif">Noto Serif</option><option value="georgia">Georgia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </section>
                </div>
              </div>{/* /as-tab-panels */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <div className="as-modal-backdrop" id="modal-displayName" role="dialog" aria-modal="true" aria-labelledby="mdnTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdnTitle">Change display name</div>
          <div className="as-modal-body">This name appears in your profile and session history.</div>
          <label className="as-field-label" htmlFor="asNewDisplayName">New display name</label>
          <input className="as-field" type="text" id="asNewDisplayName" placeholder="Your name" maxLength="60" autoComplete="name"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="saveDisplayName">Save</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-email" role="dialog" aria-modal="true" aria-labelledby="mdeTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdeTitle">Change email address</div>
          <div className="as-modal-body">A verification link will be sent to your new address.</div>
          <label className="as-field-label" htmlFor="asNewEmail">New email address</label>
          <input className="as-field" type="email" id="asNewEmail" placeholder="you@example.com" maxLength="254" autoComplete="email"/>
          <label className="as-field-label" htmlFor="asEmailPassword">Current password</label>
          <input className="as-field" type="password" id="asEmailPassword" placeholder="Current password" autoComplete="current-password" maxLength="128"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="saveEmail">Send verification</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-password" role="dialog" aria-modal="true" aria-labelledby="mdpTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdpTitle">Change password</div>
          <div className="as-modal-body">Use a strong password that you don't use on other sites.</div>
          <label className="as-field-label" htmlFor="asCurrentPassword">Current password</label>
          <input className="as-field" type="password" id="asCurrentPassword" placeholder="Current password" autoComplete="current-password" maxLength="128"/>
          <label className="as-field-label" htmlFor="asNewPassword">New password</label>
          <input className="as-field" type="password" id="asNewPassword" placeholder="New password (min. 8 characters)" autoComplete="new-password" maxLength="128"/>
          <label className="as-field-label" htmlFor="asConfirmPassword">Confirm new password</label>
          <input className="as-field" type="password" id="asConfirmPassword" placeholder="Repeat new password" autoComplete="new-password" maxLength="128"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="savePassword">Update password</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-payment" role="dialog" aria-modal="true" aria-labelledby="mdpaTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdpaTitle">Payment method</div>
          <div className="as-modal-body">Payment is handled securely by our billing provider.</div>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="goToPayment">Manage payment →</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-cancelSub" role="dialog" aria-modal="true" aria-labelledby="mdcsTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdcsTitle">Cancel subscription?</div>
          <div className="as-modal-body">You'll keep full access until the end of your current billing period.</div>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Keep my plan</button>
            <button className="as-btn danger" type="button" id="confirmCancelSub">Yes, cancel</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-deleteAccount" role="dialog" aria-modal="true" aria-labelledby="mddaTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mddaTitle">Delete account permanently?</div>
          <div className="as-modal-body">This will delete all your session data, scores, and progress. <strong className="as-danger-warn">This cannot be undone.</strong><br/><br/>Enter your password to confirm.</div>
          <input className="as-field" type="password" id="asDeleteConfirm" placeholder="Enter your password" autoComplete="current-password" maxLength="128"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn danger" type="button" id="confirmDeleteAccount" disabled>Delete my account</button>
          </div>
        </div>
      </div>
    </main>
  );
}
