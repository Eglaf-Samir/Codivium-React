// src/mcq-parent/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import McqParentPage from './McqParentPage.jsx';
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

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  const el = document.getElementById('mcq-parent-react-root');
  if (!el) { console.error('[MCQ Parent] #mcq-parent-react-root not found'); return; }
  el.innerHTML = '';
  createRoot(el).render(
    <ErrorBoundary><McqParentPage /><HelpPanel /></ErrorBoundary>
  );
});
