import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEditorLeaveGuard } from '../hooks/useEditorLeaveGuard';
import { logout } from '../utils/auth';

const NAV_ITEMS = [
  { section: 'adaptive', to: '/adaptive-practice', tip: 'Adaptive Practice', icon: 'icon-adaptive', label: 'Adaptive Practice', twoLine: true },
  { section: 'tutorials', to: null, disabled: true, tip: 'Tutorials (Coming Soon)', icon: 'icon-tutorials', label: 'Tutorials', comingSoon: true },
  { section: 'insights', to: '/insights', tip: 'Performance Insights', icon: 'icon-insights', label: 'Performance Insights', twoLine: true },
  { section: 'interview', to: '/menu?track=interview', tip: 'Interview Preparation', icon: 'icon-interview', label: 'Interview Preparation', twoLine: true },
  { section: 'micro', to: '/menu?track=micro', tip: 'Micro Challenges', icon: 'icon-micro', label: 'Micro Challenges', twoLine: true },
  { section: 'mcq', to: '/mcq', tip: 'Multiple Choice Quizzes', icon: 'icon-mcq', label: 'MCQ' },
];

function getActiveSection(pathname, search) {
  if (pathname.startsWith('/adaptive-practice')) return 'adaptive';
  if (pathname.startsWith('/insights')) return 'insights';
  if (pathname.startsWith('/mcq')) return 'mcq';
  if (pathname.startsWith('/settings')) return 'settings';

  if (pathname.startsWith('/interview')) return 'interview';
  if (pathname.startsWith('/DeliberatePractice')) return 'micro';

  if (pathname.startsWith('/menu')) {
    const track = (new URLSearchParams(search).get('track') || '').toLowerCase();
    if (track === 'interview') return 'interview';
    if (track === 'micro') return 'micro';
  }

  if (pathname.startsWith('/editor')) {
    const track = (new URLSearchParams(search).get('track') || '').toLowerCase();
    if (track === 'interview') return 'interview';
    if (track === 'micro') return 'micro';
  }
  return '';
}

function SideIcon({ id }) {
  return (
    <span className="side-ico" aria-hidden="true">
      <svg fill="none" viewBox="0 0 24 24" aria-hidden="true"><use href={`#${id}`} /></svg>
    </span>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = getActiveSection(location.pathname, location.search);

  // Editor leave-confirmation — see useEditorLeaveGuard for behaviour.
  const { inEditor, onLinkClick: onNavLinkClick, confirm } = useEditorLeaveGuard();

  async function handleLogout() {
    if (inEditor) {
      const ok = await confirm({
        title: 'End the current exercise and log out?',
        message: 'Your code and progress will be saved so you can continue later.',
        confirmText: 'Yes, log out',
        cancelText: 'No, keep coding',
      });
      if (!ok) return;
    }
    logout();
    navigate('/login', { replace: true });
  }
  // ── FIX 1: Initialise from localStorage AND sync body class ──
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('cv_sidebar_collapsed') === '1'; } catch { return false; }
  });

  // Sync body class whenever collapsed state changes (drives .main left transition)
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [collapsed]);

  // On mount: ensure body class matches persisted state
  useEffect(() => {
    const saved = localStorage.getItem('cv_sidebar_collapsed') === '1';
    if (saved) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { onClose?.(); }, [location.pathname]);

  function toggle() {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('cv_sidebar_collapsed', next ? '1' : '0'); } catch { }
      return next;
    });
  }

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    isOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={sidebarClass} id="sidebar" aria-label="Side menu">
        {/* Collapse handle */}
        <div
          className="sidebar-handle"
          id="sidebarHandle"
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
          <div className="side-title" aria-hidden="true" />
        </div>

        {/* ── FIX 2: scrollable nav ── */}
        <nav className="side-nav" aria-label="Menu items">
          {/* Primary nav items */}
          <div className="side-nav-items">
            {NAV_ITEMS.map(item => {
              const isActive = active === item.section;
              const labelParts = item.twoLine ? item.label.split(' ') : null;

              if (item.disabled) {
                return (
                  <a key={item.section} className="side-link is-disabled"
                    href="#" onClick={e => e.preventDefault()}
                    aria-disabled="true" data-section={item.section} data-tip={item.tip}>
                    <SideIcon id={item.icon} />
                    <span className="side-label">{item.label}</span>
                    {item.comingSoon && (
                      <span className="side-comingsoon" aria-hidden="true">
                        <svg viewBox="0 0 200 70" preserveAspectRatio="none">
                          <defs><path id="csArcNav" d="M8,56 Q100,10 192,56" /></defs>
                          <g className="cs-curved">
                            <text fontSize="18"><textPath href="#csArcNav" startOffset="50%" textAnchor="middle">Coming Soon!</textPath></text>
                          </g>
                        </svg>
                      </span>
                    )}
                  </a>
                );
              }

              return (
                <Link
                  key={item.section}
                  to={item.to}
                  className={`side-link${isActive ? ' active' : ''}`}
                  data-section={item.section}
                  data-tip={item.tip}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => onNavLinkClick(e, item.to)}
                >
                  <SideIcon id={item.icon} />
                  {item.twoLine && labelParts ? (
                    <span className="side-label two-line">
                      {labelParts.slice(0, Math.ceil(labelParts.length / 2)).join(' ')}
                      <br />
                      {labelParts.slice(Math.ceil(labelParts.length / 2)).join(' ')}
                    </span>
                  ) : (
                    <span className="side-label">{item.label}</span>
                  )}
                </Link>
              );
            })}

            {/* Help & Support — React-rendered to avoid direct DOM manipulation */}
            <button
              id="cvHelpSidebarBtn"
              type="button"
              aria-label="Help and Support"
              data-tip="Help &amp; Support"
              onClick={() => window.CodiviumHelp?.open()}
            >
              <span className="sb-ico-help side-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 3v.5"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="12" cy="16.5" r=".75" fill="currentColor" />
                </svg>
              </span>
              <span className="sb-label-help side-label">Help &amp; Support</span>
            </button>

            <div className="side-sep" />

            {/* Settings */}
            <Link
              className={`side-link${active === 'settings' ? ' active' : ''}`}
              to="/settings"
              data-section="settings"
              data-tip="Account &amp; Settings"
              aria-current={active === 'settings' ? 'page' : undefined}
              onClick={(e) => onNavLinkClick(e, '/settings')}
            >
              <SideIcon id="icon-settings" />
              <span className="side-label two-line">Account &amp;<br />Settings</span>
            </Link>

            {/* Logout */}
            <button
              type="button"
              className="side-link side-logout"
              data-section="logout"
              data-tip="Logout"
              onClick={handleLogout}
            >
              <span className="side-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="side-label">Logout</span>
            </button>
          </div>

          {/* Profile card — stays at bottom */}
          <div className="profile-card" aria-label="Profile summary">
            <div className="profile-avatar" aria-hidden="true">
              <img alt="" id="profileImg" src="/assets/img/profile-placeholder.svg" />
            </div>
            <div className="profile-meta">
              <div className="profile-kicker">Profile</div>
              <div className="profile-name" id="profileName">Profile</div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
