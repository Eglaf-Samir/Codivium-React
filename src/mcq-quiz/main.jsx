// src/mcq-quiz/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import McqQuizPage from './McqQuizPage.jsx';
import { applyStoredSyntaxTheme, bindSyntaxThemeStorageListener } from '../shared/applySyntaxTheme.js';
import '../shared/brandCube.js';
import '../shared/routeConfig.js';
import HelpPanel from '../shared/HelpPanel.jsx';
import { initGlobal } from '../shared/globalInit.js';
import { initSidebar } from '../shared/initSidebar.js';

// Apply syntax theme immediately (replaces syntax-theme-vars.js)
applyStoredSyntaxTheme();
bindSyntaxThemeStorageListener();

initGlobal();

function mount() {
  const el = document.getElementById('mcq-quiz-react-root');
  if (!el) return; // no mount point — not the quiz page
  try {
    el.innerHTML = '';
    createRoot(el).render(
      <ErrorBoundary>
        <McqQuizPage />
        <HelpPanel />
      </ErrorBoundary>
    );
  } catch (e) {
    el.innerHTML = '<div style="padding:24px;color:#ff6b8a;font-family:monospace">'
      + '<strong>Fatal mount error:</strong><br>' + String(e)
      + '<br><br><a href="mcq-parent.html">← Back to Setup</a></div>';
  }
}

// Handle all timing scenarios:
// — defer scripts run before DOMContentLoaded, so addEventListener works
// — but also handle the case where DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initSidebar(); mount(); });
} else {
    mount();
}
