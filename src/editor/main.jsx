// src/editor/main.jsx — React entry point for the editor page.
import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import EditorPage from './EditorPage.jsx';
import { initGlobal } from '../shared/globalInit.js';
import { initSidebar } from '../shared/initSidebar.js';

initGlobal();
initSidebar();

const rootEl = document.getElementById('editor-react-root');
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <React.StrictMode>
        <EditorPage />
      </React.StrictMode>
    </ErrorBoundary>
  );
}
