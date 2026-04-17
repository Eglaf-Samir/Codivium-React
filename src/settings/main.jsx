// src/settings/main.jsx — React entry point for account-settings.html
import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import AccountSettingsPage from './AccountSettingsPage.jsx';
import '../shared/brandCube.js';
import '../shared/routeConfig.js';
import HelpPanel from '../shared/HelpPanel.jsx';
import { initGlobal } from '../shared/globalInit.js';
import { initSidebar } from '../shared/initSidebar.js';

initGlobal();

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  const container = document.getElementById('settings-react-root');
  if (!container) {
    console.error('[Settings] Mount point #settings-react-root not found.');
    return;
  }
  container.innerHTML = '';
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <AccountSettingsPage />
      <HelpPanel />
    </ErrorBoundary>
  );
});
