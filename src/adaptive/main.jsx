// src/adaptive/main.jsx — React entry point for adaptive-practice.html

import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import AdaptivePage from './AdaptivePage.jsx';
import '../shared/brandCube.js';
import '../shared/routeConfig.js';
import HelpPanel from '../shared/HelpPanel.jsx';
import { initGlobal } from '../shared/globalInit.js';
import { initSidebar } from '../shared/initSidebar.js';

initGlobal();

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  const container = document.getElementById('adaptive-react-root');
  if (!container) {
    console.error('[Adaptive] Mount point #adaptive-react-root not found.');
    return;
  }

  // Clear loading placeholder
  container.innerHTML = '';

  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <AdaptivePage />
      <HelpPanel />
    </ErrorBoundary>
  );
});
