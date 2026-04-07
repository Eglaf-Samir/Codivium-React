import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../styles/components/topbar.css";
import "../styles/components/cube.css";
 
function Header() {
 
  useEffect(() => {
    if (!document.getElementById("cube-script")) {
      const script = document.createElement("script");
      script.src = "/assets/js/cv-cube.js";
      script.defer = true;
      script.id = "cube-script";
      document.body.appendChild(script);
    }
  }, []);
 
  return (
    <div className="topbar" role="navigation">
 
      {/* LOGO */}
      <NavLink className="brand" to="/" id="brandLogo">
 
        <div className="brand-mark">
          <div className="cube-wrap">
            <div className="cube3d" id="brandCube">
 
              <div className="cube-face cube-front"><div className="cube-wire"></div><div className="cube-symbol">κ</div></div>
              <div className="cube-face cube-right"><div className="cube-wire"></div><div className="cube-symbol">δ</div></div>
              <div className="cube-face cube-back"><div className="cube-wire"></div><div className="cube-symbol"><span className="cube-symbol-small">φσα</span></div></div>
              <div className="cube-face cube-left"><div className="cube-wire"></div><div className="cube-symbol">η</div></div>
              <div className="cube-face cube-top"><div className="cube-wire"></div><div className="cube-symbol">ν</div></div>
              <div className="cube-face cube-bottom"><div className="cube-wire"></div><div className="cube-symbol"><span className="cube-symbol-small">δα</span></div></div>
 
            </div>
          </div>
        </div>
 
        <div className="brand-text">
          <div className="brand-name">Codivium</div>
        </div>
 
      </NavLink>
 
      {/* NAV LINKS */}
      <nav className="navlinks">
 
        <NavLink to="/" end className={({ isActive }) =>
          isActive ? "active" : ""
        }>
          Home
        </NavLink>
 
        <NavLink to="/articles" className={({ isActive }) =>
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
 
export default Header;
 