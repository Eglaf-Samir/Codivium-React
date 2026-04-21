import React, { useState } from 'react';
import SvgSprite from './SvgSprite.jsx';
import Topbar from './Topbar.jsx';
import Sidebar from './Sidebar.jsx';
import HelpPanel from './HelpPanel.jsx';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <SvgSprite />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Topbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {children}
      <HelpPanel />
    </>
  );
}
