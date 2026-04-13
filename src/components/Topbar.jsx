import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

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
      <Link className="brand" to="/adaptive-practice" aria-label="Codivium Home" id="brandLogo">
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

        <NavLink to="/" end className={({ isActive }) =>
          isActive ? "active" : ""
        }>
          Home
        </NavLink>

        <NavLink to={"/articles"||"/article"} className={({ isActive }) =>
          isActive ? "active" : ""
        }>
          Articles
        </NavLink>

        <NavLink to="/pricing" className={({ isActive }) =>
          isActive ? "active" : ""
        }>
          Prices
        </NavLink>

        <NavLink to="/contact" className={({ isActive }) =>
          isActive ? "active" : ""
        }>
          Contact
        </NavLink>

        <NavLink to="/faq" className={({ isActive }) =>
          isActive ? "active" : ""
        }>
          FAQ
        </NavLink>

        <NavLink to="/join" className={({ isActive }) =>
          isActive ? "nav-join active" : "nav-join"
        }>
          Join
        </NavLink>

        <NavLink to="/login" className={({ isActive }) =>
          isActive ? "nav-login active" : "nav-login"
        }>
          Login
        </NavLink>

      </nav>
    </div>
  );
}
