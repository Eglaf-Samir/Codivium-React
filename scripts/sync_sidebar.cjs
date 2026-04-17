#!/usr/bin/env node
/**
 * scripts/sync_sidebar.js
 *
 * Ensures every HTML page in the package has the canonical sidebar HTML.
 * Run this whenever the sidebar content changes, then commit the results.
 *
 * Usage: node scripts/sync_sidebar.js [--check]
 *   --check  exits non-zero if any page is out of sync (for CI)
 *
 * The canonical sidebar is defined in:
 *   assets/components/sidebar/sidebar.js  (behaviour)
 *   assets/components/sidebar/sidebar.css (styles)
 *
 * The canonical HTML is embedded in this script.
 */

const fs   = require('fs');
const path = require('path');
const checkOnly = process.argv.includes('--check');

// ── Canonical sidebar (root-relative hrefs) ───────────────────────────────
const CANONICAL_ROOT = `<aside aria-label="Side menu" class="sidebar" id="sidebar">
<div aria-controls="sidebar" aria-expanded="true" aria-label="Toggle side menu" class="sidebar-handle" id="sidebarHandle" role="button" tabindex="0">
<span aria-hidden="true" class="sb-handle-ico"></span>
</div>
<div class="side-top">
<div aria-hidden="true" class="side-title"></div>
</div>
<nav aria-label="Menu items" class="side-nav">

<a class="side-link" data-section="home" data-tip="Adaptive Practice" href="adaptive-practice.html">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M3 10.5 12 3l9 7.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path>
<path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.0"></path>
<path d="M9 21v-6h6v6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.0"></path>
</svg>
</span>
<span class="side-label">Adaptive Practice</span>
</a>

<a aria-disabled="true" class="side-link is-disabled" data-disabled="true" data-section="tutorials" data-tip="Tutorials (Coming Soon)" href="#">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M2.5 5.5h7.5a3.8 3.8 0 0 1 3.8 3.8V21a2.6 2.6 0 0 0-2.6-2.6H2.5V5.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"></path>
<path d="M21.5 5.5H14a3.8 3.8 0 0 0-3.8 3.8V21a2.6 2.6 0 0 1 2.6-2.6h8.7V5.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"></path>
</svg>
</span>
<span class="side-label">Tutorials</span>
<span aria-hidden="true" class="side-comingsoon">
<svg viewBox="0 0 200 70" preserveAspectRatio="none">
<defs><path id="csArcNav" d="M8,56 Q100,10 192,56"/></defs>
<g class="cs-curved"><text font-size="18"><textPath href="#csArcNav" startOffset="50%" text-anchor="middle">Coming Soon!</textPath></text></g>
</svg>
</span>
</a>

<a class="side-link" data-section="dashboard" data-tip="Performance Insights" href="codivium_insights_embedded.html">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M4 19V5" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M8 19V11" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M12 19V8" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M16 19V14" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M20 19V6" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
</svg>
</span>
<span class="side-label two-line">Performance<br/>Insights</span>
</a>

<a class="side-link" data-section="interview" data-tip="Interview Preparation" href="menu-page.html?track=interview">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M7 7h10" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M7 12h6" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M7 17h10" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M6 4h12a2 2 0 0 1 2 2v14l-4-2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"></path>
</svg>
</span>
<span class="side-label two-line">Interview<br/>Preparation</span>
</a>

<a class="side-link" data-section="micro" data-tip="Micro Challenges" href="menu-page.html?track=micro">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M12 2v4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M12 18v4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M4.9 4.9l2.8 2.8" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M16.3 16.3l2.8 2.8" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M2 12h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M18 12h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M4.9 19.1l2.8-2.8" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M16.3 7.7l2.8-2.8" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" stroke="currentColor" stroke-width="2.0"></path>
</svg>
</span>
<span class="side-label">Micro Challenges</span>
</a>

<a class="side-link" data-section="mcq" data-tip="Multiple Choice Quizzes" href="mcq-parent.html">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M7 9h10" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M7 13h6" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M9 3h6" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"></path>
<path d="M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"></path>
</svg>
</span>
<span class="side-label">MCQ</span>
</a>

<div class="side-sep"></div>
<div aria-label="Account and settings" class="side-bottom-links">
<a class="side-link" data-section="account-settings" data-tip="Account &amp; Settings" href="dashboard_view_settings.html">
<span aria-hidden="true" class="side-ico">
<svg fill="none" viewBox="0 0 24 24">
<path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-linecap="round" stroke-width="2.0"></path>
<path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="2.0"></path>
</svg>
</span>
<span class="side-label two-line">Account &amp;<br/>Settings</span>
</a>
</div>

<div aria-label="Profile summary" class="profile-card">
<div aria-hidden="true" class="profile-avatar">
<img alt="" id="profileImg" src="assets/img/profile-placeholder.svg"/>
</div>
<div class="profile-meta">
<div class="profile-kicker">Profile</div>
<div class="profile-name" id="profileName">Profile</div>
</div>
</div>

</nav>
</aside>`;

// demo/ variant uses ../ relative paths
const CANONICAL_DEMO = CANONICAL_ROOT
  .replace(/href="adaptive-practice.html"/g,       'href="../adaptive-practice.html"')
  .replace(/href="codivium_insights_embedded.html"/g, 'href="../codivium_insights_embedded.html"')
  .replace(/href="menu-page.html\?track=interview"/g, 'href="../menu-page.html?track=interview"')
  .replace(/href="menu-page.html\?track=micro"/g,    'href="../menu-page.html?track=micro"')
  .replace(/href="mcq-parent.html"/g,               'href="../mcq-parent.html"')
  .replace(/href="dashboard_view_settings.html"/g,  'href="../dashboard_view_settings.html"')
  .replace(/src="assets\/img\/profile-placeholder.svg"/g, 'src="../assets/img/profile-placeholder.svg"');

const ROOT = path.join(__dirname, '..');
let errors = 0, updated = 0;

function processDir(dir, canonical) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const fpath = path.join(dir, file);
    const html  = fs.readFileSync(fpath, 'utf8');
    const m     = html.match(/<aside[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/aside>/);
    if (!m) continue;
    const normalise = s => s.replace(/\s+/g, ' ').trim();
    if (normalise(m[0]) === normalise(canonical)) continue;
    if (checkOnly) {
      console.error('OUT OF SYNC: ' + fpath);
      errors++;
    } else {
      const updated_html = html.replace(m[0], canonical);
      fs.writeFileSync(fpath, updated_html);
      console.log('Updated: ' + file);
      updated++;
    }
  }
}

processDir(ROOT,                CANONICAL_ROOT);
processDir(path.join(ROOT, 'demo'), CANONICAL_DEMO);

if (checkOnly) {
  if (errors) { console.error(errors + ' page(s) out of sync.'); process.exit(1); }
  else { console.log('All sidebars in sync ✓'); }
} else {
  console.log('Done. Updated ' + updated + ' page(s).');
}
