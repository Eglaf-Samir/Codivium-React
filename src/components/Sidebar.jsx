import { NavLink } from "react-router-dom";
import "../assets/components/sidebar/sidebar.css";
import "../assets/components/sidebar/menu-overrides.css";
function Sidebar() {
  // useEffect(() => {
  //   if (!document.getElementById("sidebar-script")) {
  //     const script = document.createElement("script");
  //     script.src = "../assets/components/sidebar/sidebar.js";
  //     script.defer = true;
  //     script.id = "sidebar-script";
  //     document.body.appendChild(script);
  //   }
  // }, []);
  return (
    <aside className="sidebar" id="sidebar">
      {/* TOGGLE BUTTON */}
      <div className="sidebar-handle" role="button" tabIndex="0">
        <span className="sb-handle-ico"></span>
      </div>

      <div className="side-top">
        <div className="side-title"></div>
      </div>

      <nav className="side-nav">
        {/* Adaptive Practice */}
        <NavLink to="/adaptive_practice" className="side-link">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-adaptive" />
            </svg>
          </span>
          <span className="side-label two-line">
            Adaptive
            <br />
            Practice
          </span>
        </NavLink>

        {/* Tutorials (disabled) */}
        <div className="side-link is-disabled">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-tutorials" />
            </svg>
          </span>
          <span className="side-label">Tutorials</span>
        </div>

        {/* Insights */}
        <NavLink to="/insights" className="side-link">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-insights" />
            </svg>
          </span>
          <span className="side-label two-line">
            Performance
            <br />
            Insights
          </span>
        </NavLink>

        {/* Interview */}
        <NavLink to="/interview" className="side-link">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-interview" />
            </svg>
          </span>
          <span className="side-label two-line">
            Interview
            <br />
            Preparation
          </span>
        </NavLink>

        {/* Micro */}
        <NavLink to="/micro" className="side-link">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-micro" />
            </svg>
          </span>
          <span className="side-label two-line">
            Micro
            <br />
            Challenges
          </span>
        </NavLink>

        {/* MCQ */}
        <NavLink to="/mcq" className="side-link">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-mcq" />
            </svg>
          </span>
          <span className="side-label">MCQ</span>
        </NavLink>

        <div className="side-sep"></div>

        {/* Settings */}
        <NavLink to="/settings" className="side-link">
          <span className="side-ico">
            <svg viewBox="0 0 24 24">
              <use href="#icon-settings" />
            </svg>
          </span>
          <span className="side-label two-line">
            Account &<br />
            Settings
          </span>
        </NavLink>

        {/* PROFILE */}
        <div className="profile-card">
          <div className="profile-avatar">
            <img src="/assets/img/profile-placeholder.svg" alt="" />
          </div>
          <div className="profile-meta">
            <div className="profile-kicker">Profile</div>
            <div className="profile-name">User</div>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
