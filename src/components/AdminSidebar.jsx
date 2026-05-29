import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

const ADMIN_NAV_ITEMS = [
  {
    section: 'admin-dashboard',
    to: '/AdminDashboard',
    tip: 'Dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    section: 'admin-units',
    to: '/UnitTestManagement',
    tip: 'Unit Test Management',
    label: 'Unit Test Management',
    twoLine: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M9 3v6L4 19a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 19L15 9V3"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 3h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10.5" cy="16" r="1" fill="currentColor" />
        <circle cx="14" cy="14" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    section: 'admin-deliberate',
    to: '/DeliberatePracticeManagement',
    tip: 'Deliberate Practice Management',
    label: 'Deliberate Practice Management',
    twoLine: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4"
          stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    section: 'admin-mcq',
    to: '/McqManagement',
    tip: 'MCQ Management',
    label: 'MCQ Management',
    twoLine: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M7 9h10M7 13h6M9 3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        <path d="M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
          stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    section: 'admin-packages',
    to: '/PackageManagement',
    tip: 'Package Management',
    label: 'Package Management',
    twoLine: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M3.5 7.5 12 3l8.5 4.5M3.5 7.5V17l8.5 4.5M3.5 7.5 12 12m8.5-4.5V17L12 21.5M20.5 7.5 12 12m0 0v9.5"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    section: 'admin-coupons',
    to: '/CouponsManagement',
    tip: 'Coupons Management',
    label: 'Coupons Management',
    twoLine: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6Z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 9v6" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    section: 'admin-users',
    to: '/UserManagement',
    tip: 'UserManagement',
    label: 'User Management',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <circle cx="9" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.8 19.5c0-3.2 2.8-5.5 6.2-5.5s6.2 2.3 6.2 5.5"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14.8 14.5c.7-.3 1.4-.5 2.2-.5 2.6 0 4.6 1.7 4.6 4"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function getActiveAdminSection(pathname) {
  if (pathname.startsWith('/AdminDashboard')) return 'admin-dashboard';
  if (pathname.startsWith('/UserManagement')) return 'admin-users';
  if (pathname.startsWith('/McqManagement')) return 'admin-mcq';
  if (pathname.startsWith('/PackageManagement')) return 'admin-packages';
  if (pathname.startsWith('/CouponsManagement')) return 'admin-coupons';
  if (pathname.startsWith('/UnitTestManagement')) return 'admin-units';
  if (pathname.startsWith('/DeliberatePracticeManagement')) return 'admin-deliberate';
  if (pathname.startsWith('/FaqManagement')) return 'admin-faq';
  return '';
}

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = getActiveAdminSection(location.pathname);

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('cv_sidebar_collapsed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (collapsed) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  useEffect(() => {
    const saved = localStorage.getItem('cv_sidebar_collapsed') === '1';
    if (saved) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  }, []);

  useEffect(() => { onClose?.(); }, [location.pathname]);

  function toggle() {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('cv_sidebar_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const sidebarClass = [
    'sidebar',
    'cv-admin-sidebar',
    collapsed ? 'collapsed' : '',
    isOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  function renderLabel(item) {
    if (!item.twoLine) return <span className="side-label">{item.label}</span>;
    const parts = item.label.split(' ');
    const half = Math.ceil(parts.length / 2);
    return (
      <span className="side-label two-line">
        {parts.slice(0, half).join(' ')}
        <br />
        {parts.slice(half).join(' ')}
      </span>
    );
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={sidebarClass} id="sidebar" aria-label="Admin side menu">
        <div
          className="sidebar-handle"
          role="button"
          tabIndex={0}
          aria-label={collapsed ? 'Expand side menu' : 'Collapse side menu'}
          aria-expanded={!collapsed}
          onClick={toggle}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle()}
        >
          <span className="sb-handle-ico" aria-hidden="true" />
        </div>

        <div className="side-top">
          <div className="cv-admin-badge" aria-label="Superadmin area">
            <span className="cv-admin-badge-dot" aria-hidden="true" />
            <span className="cv-admin-badge-text">Superadmin</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Admin menu">
          <div className="side-nav-items">
            {ADMIN_NAV_ITEMS.map(item => {
              const isActive = active === item.section;
              return (
                <Link
                  key={item.section}
                  to={item.to}
                  className={`side-link${isActive ? ' active' : ''}`}
                  data-section={item.section}
                  data-tip={item.tip}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="side-ico" aria-hidden="true">{item.icon}</span>
                  {renderLabel(item)}
                </Link>
              );
            })}

            <div className="side-sep" />

            <button
              type="button"
              className="side-link side-logout"
              data-section="logout"
              data-tip="Logout"
              onClick={handleLogout}
            >
              <span className="side-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="side-label">Logout</span>
            </button>
          </div>

          <div className="profile-card" aria-label="Admin profile">
            <div className="profile-avatar" aria-hidden="true">
              <img alt="" src="/assets/img/profile-placeholder.svg" />
            </div>
            <div className="profile-meta">
              <div className="profile-kicker">Role</div>
              <div className="profile-name">Superadmin</div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
