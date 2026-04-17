// src/menu/main.jsx — React entry point for the exercise menu page.
import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import MenuPage from './MenuPage.jsx';
import '../shared/brandCube.js';
import '../shared/routeConfig.js';
import { initGlobal } from '../shared/globalInit.js';
import { initSidebar } from '../shared/initSidebar.js';

initGlobal();
initSidebar();

const rootEl = document.getElementById('menu-react-root');
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <React.StrictMode>
        <MenuPage />
      </React.StrictMode>
    </ErrorBoundary>
  );
}
