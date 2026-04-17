// src/insights/main.jsx — React entry point for the Performance Insights dashboard.
// Replaces dashboard.bundle.js as the rendering engine.

import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import InsightsDashboard from './InsightsDashboard.jsx';
import { initGlobal }   from '../shared/globalInit.js';
import { initSidebar } from '../shared/initSidebar.js';
import HelpPanel      from '../shared/HelpPanel.jsx';

// Queue update calls that arrive before React mounts
if (!window.CodiviumInsights) {
  window.CodiviumInsights = {};
}
window.CodiviumInsights.update = window.CodiviumInsights.update ||
  function(payload) { window.CodiviumInsights.__pendingPayload = payload; };
window.CodiviumInsights.init = window.CodiviumInsights.update;

initGlobal();
initSidebar();

function mount() {
  const el = document.getElementById('insights-react-root');
  if (!el) { console.error('[Insights] #insights-react-root not found'); return; }
  el.innerHTML = '';
  createRoot(el).render(
    <ErrorBoundary>
      <InsightsDashboard />
      <HelpPanel />
    </ErrorBoundary>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
