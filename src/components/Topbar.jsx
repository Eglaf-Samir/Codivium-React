import React, { useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEditorLeaveGuard } from '../hooks/useEditorLeaveGuard';
import useCube from '../hooks/useCube';
import { isLoggedIn } from '../utils/auth';

const NAV_LINKS = [
  { label: 'Home', route: 'landing' },
  { label: 'Articles', route: 'articles' },
  { label: 'Prices', route: 'pricing' },
  { label: 'Contact', route: 'contact' },
  { label: 'FAQ', route: 'faq' },
];

export default function Topbar({ onMenuOpen }) {
  const location = useLocation();
  const isEditor = location.pathname === '/editor';
  const loggedIn = isLoggedIn();
  // Confirms before leaving the editor so the user doesn't lose unsaved code.
  const { onLinkClick } = useEditorLeaveGuard();
  const brandRef = useRef(null);
  useCube(brandRef);

  return (
    <div className="topbar" role="navigation" aria-label="Primary">
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        aria-label="Open navigation menu"
        onClick={onMenuOpen}
      >
        <span /><span /><span />
      </button>

      {/* Brand */}
      <Link
        className="brand"
        to="/adaptive-practice"
        aria-label="Codivium Home"
        id="brandLogo"
        ref={brandRef}
        onClick={(e) => onLinkClick(e, '/adaptive-practice')}
      >
        <div className="brand-mark cv-cube" aria-hidden="true">
          <div className="cube-wrap">
            <div className="cube3d" id="brandCube">
              <div className="cube-face cube-front"><div className="cube-wire" /><div className="cube-symbol">κ</div></div>
              <div className="cube-face cube-right"><div className="cube-wire" /><div className="cube-symbol">δ</div></div>
              <div className="cube-face cube-back"><div className="cube-wire" /><div className="cube-symbol"><span className="cube-symbol-small">φσα</span></div></div>
              <div className="cube-face cube-left"><div className="cube-wire" /><div className="cube-symbol">η</div></div>
              <div className="cube-face cube-top"><div className="cube-wire" /><div className="cube-symbol">ν</div></div>
              <div className="cube-face cube-bottom"><div className="cube-wire" /><div className="cube-symbol"><span className="cube-symbol-small">δα</span></div></div>
            </div>
          </div>
        </div>
        <div className="brand-text">
          <div className="brand-name">Codivium</div>
        </div>
      </Link>


      {/* <nav role="none" aria-label="Site links" className="navlinks">
        {NAV_LINKS.map(({ label, route }) => (
          <a key={route} data-route={route} href={`${route}`} onClick={e => e.preventDefault()}>{label}</a>
        ))}
        <a data-route="join" href="/join" className="nav-join">Join</a>
        <a data-route="login" href="/login" className="nav-login">Login</a>
      </nav>

      {isEditor && (
        <Link to="/menu" className="cv-back-to-menu" aria-label="Back to exercise list">
          ← Menu
        </Link>
      )} */}
      <nav className="navlinks">

        <NavLink
          to="/" end
          onClick={(e) => onLinkClick(e, '/')}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Home
        </NavLink>

        <NavLink
          to="/articles"
          onClick={(e) => onLinkClick(e, '/articles')}
          className={() =>
            location.pathname === "/articles" || location.pathname === "/article"
              ? "active"
              : ""
          }
        >
          Articles
        </NavLink>

        <NavLink
          to="/pricing"
          onClick={(e) => onLinkClick(e, '/pricing')}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Prices
        </NavLink>

        <NavLink
          to="/contact"
          onClick={(e) => onLinkClick(e, '/contact')}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Contact
        </NavLink>

        <NavLink
          to="/faq"
          onClick={(e) => onLinkClick(e, '/faq')}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          FAQ
        </NavLink>

        {loggedIn ? (
          <NavLink
            to="/adaptive-practice"
            onClick={(e) => onLinkClick(e, '/adaptive-practice')}
            className={({ isActive }) => (isActive ? "nav-login active" : "nav-login")}
          >
            Dashboard
          </NavLink>
        ) : (
          <>
            <NavLink
              to="/join"
              onClick={(e) => onLinkClick(e, '/join')}
              className={({ isActive }) => (isActive ? "nav-join active" : "nav-join")}
            >
              Join
            </NavLink>

            <NavLink
              to="/login"
              onClick={(e) => onLinkClick(e, '/login')}
              className={({ isActive }) => (isActive ? "nav-login active" : "nav-login")}
            >
              Login
            </NavLink>
          </>
        )}

      </nav>
    </div>
  );
}
