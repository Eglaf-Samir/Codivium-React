import React, { useState } from 'react';
import SvgSprite from './SvgSprite.jsx';
import Topbar from './Topbar.jsx';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <SvgSprite />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Topbar onMenuOpen={() => setSidebarOpen(true)} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {children}
    </>
  );
}
