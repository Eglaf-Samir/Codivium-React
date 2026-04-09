import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import usePageMeta from "../../hooks/usePageMeta";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";
import Header from "../../components/Header.jsx";
import "../../assets/components/adaptive/adaptive-practice.css";
import "../../assets/components/adaptive/onboarding-tour.css";
import "../../assets/components/core/base.css";
import "../../assets/components/mcq/mcq-forms.css";
import "../../assets/components/core/tour.css";
import "../../assets/components/adaptive/adaptive-practice.js";
import "../../assets/components/adaptive/onboarding-tour.js";
import "../../assets/components/core/global.js";
import "../../assets/components/core/route-config.js";
import "../../assets/components/core/cv-font-loader.js";


function InterView() {
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add("mcq-parent");

        return () => {
            document.body.classList.remove("mcq-parent");
        };
    }, []);

    return (
        <>
            <noscript>
                <div className="cv-noscript-wall">
                    <h1>JavaScript required</h1>
                    <p>Codivium requires JavaScript to run. Please enable JavaScript in your browser settings.</p>
                </div>
            </noscript>
            <div className="svg-sprite-container">
                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <symbol id="icon-adaptive" viewBox="0 0 24 24">
                        <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                        <path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0" />
                        <path d="M9 21v-6h6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-tutorials" viewBox="0 0 24 24">
                        <path d="M2.5 5.5h7.5a3.8 3.8 0 0 1 3.8 3.8V21a2.6 2.6 0 0 0-2.6-2.6H2.5V5.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                        <path d="M21.5 5.5H14a3.8 3.8 0 0 0-3.8 3.8V21a2.6 2.6 0 0 1 2.6-2.6h8.7V5.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-insights" viewBox="0 0 24 24">
                        <path d="M4 19V5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M8 19V11" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M12 19V8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M16 19V14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M20 19V6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                    </symbol>
                    <symbol id="icon-interview" viewBox="0 0 24 24">
                        <path d="M7 7h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 17h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M6 4h12a2 2 0 0 1 2 2v14l-4-2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-micro" viewBox="0 0 24 24">
                        <path d="M12 2v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M12 18v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M4.9 4.9l2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M16.3 16.3l2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M2 12h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M18 12h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M4.9 19.1l2.8-2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M16.3 7.7l2.8-2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" stroke="currentColor" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-mcq" viewBox="0 0 24 24">
                        <path d="M7 9h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 13h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M9 3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                        <path d="M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.0" />
                    </symbol>
                    <symbol id="icon-settings" viewBox="0 0 24 24">
                        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2.0" />
                        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2.0" />
                    </symbol>
                </svg>
            </div>

            <a className="skip-link" href="#main-content">Skip to main content</a>
            <Header />
            <Sidebar />

            <aside aria-label="Side menu" className="sidebar" id="sidebar">
                <div aria-controls="sidebar" aria-expanded="true" aria-label="Toggle side menu" className="sidebar-handle" id="sidebarHandle" role="button" tabIndex="0">
                    <span aria-hidden="true" className="sb-handle-ico"></span>
                </div>
                <div className="side-top">
                    <div aria-hidden="true" className="side-title"></div>
                </div>
                <nav aria-label="Menu items" className="side-nav">
                    <NavLink className="side-link" to="/adaptive_practice">
                        <span aria-hidden="true" className="side-ico">
                            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <use href="#icon-adaptive" />
                            </svg>
                        </span>
                        <span className="side-label two-line">Adaptive<br />Practice</span>
                    </NavLink>

                    <div aria-disabled="true" className="side-link is-disabled">
                        <span aria-hidden="true" className="side-ico">
                            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <use href="#icon-tutorials" />
                            </svg>
                        </span>
                        <span className="side-label">Tutorials</span>
                        <span aria-hidden="true" className="side-comingsoon">
                            <svg viewBox="0 0 200 70" preserveAspectRatio="none">
                                <defs>
                                    <path id="csArcNav" d="M8,56 Q100,10 192,56" />
                                </defs>
                                <g className="cs-curved"><text fontSize="18">
                                    <textPath href="#csArcNav" startOffset="50%" textAnchor="middle">Coming Soon!</textPath>
                                </text></g>
                            </svg>
                        </span>
                    </div>

                    <NavLink className="side-link" to="/insights">
                        <span aria-hidden="true" className="side-ico">
                            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <use href="#icon-insights" />
                            </svg>
                        </span>
                        <span className="side-label two-line">Performance<br />Insights</span>
                    </NavLink>

                    <NavLink className="side-link" to="/interview">
                        <span aria-hidden="true" className="side-ico">
                            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <use href="#icon-interview" />
                            </svg>
                        </span>
                        <span className="side-label two-line">Interview<br />Preparation</span>
                    </NavLink>

                    <NavLink className="side-link" to="/micro">
                        <span aria-hidden="true" className="side-ico">
                            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <use href="#icon-micro" />
                            </svg>
                        </span>
                        <span className="side-label two-line">Micro<br />Challenges</span>
                    </NavLink>

                    <NavLink className="side-link" to="/mcq">
                        <span aria-hidden="true" className="side-ico">
                            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <use href="#icon-mcq" />
                            </svg>
                        </span>
                        <span className="side-label">MCQ</span>
                    </NavLink>

                    <div className="side-sep"></div>
                    <div aria-label="Account and settings" className="side-bottom-links">
                        <NavLink className="side-link" to="/settings">
                            <span aria-hidden="true" className="side-ico">
                                <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <use href="#icon-settings" />
                                </svg>
                            </span>
                            <span className="side-label two-line">Account &<br />Settings</span>
                        </NavLink>
                    </div>

                    <div aria-label="Profile summary" className="profile-card">
                        <div aria-hidden="true" className="profile-avatar">
                            <img alt="" id="profileImg" src="/assets/img/profile-placeholder.svg" />
                        </div>
                        <div className="profile-meta">
                            <div className="profile-kicker">Profile</div>
                            <div className="profile-name" id="profileName">Profile</div>
                        </div>
                    </div>
                </nav>
            </aside>
            <main id="main-content" className="main" role="main">
                <div className="page-shell">
                    <div className="adaptive-page">
                        <div
                            id="apOrientationMode"
                            // className="ap-hidden"
                            aria-label="Orientation — new user guidance"
                        >
                            <div className="ap-header">
                                <div className="ap-kicker">Welcome to Codivium</div>
                                <h1 className="ap-title">Let's find your starting point</h1>
                                <div className="ap-subtitle">
                                    Three quick questions. One clear first step. No guessing
                                    required.
                                </div>
                            </div>

                            <div className="ap-orientation-wrap">
                                <div className="ap-orientation-card window glow-follow">
                                    <div className="ap-orient-deco"></div>
                                    <div className="ap-orient-headline">
                                        Before your first session
                                    </div>
                                    <div className="ap-orient-sub">
                                        Tell us where you are and what you're aiming for. We'll take
                                        it from there — one specific recommendation, ready to launch
                                        immediately.
                                    </div>

                                    <div className="ap-diag-block">
                                        <div className="ap-diag-label">
                                            What's your main goal right now?
                                        </div>
                                        <div
                                            className="ap-diag-opts"
                                            role="group"
                                            aria-label="Goal options"
                                            data-question="goal"
                                        >
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="interview"
                                            >
                                                Prepare for a job interview
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="improve"
                                            >
                                                Improve my Python skills
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="explore"
                                            >
                                                Explore and learn
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="gaps"
                                            >
                                                Fill specific gaps
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ap-diag-block">
                                        <div className="ap-diag-label">
                                            How comfortable are you with Python?
                                        </div>
                                        <div
                                            className="ap-diag-opts"
                                            role="group"
                                            aria-label="Comfort level options"
                                            data-question="level"
                                        >
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="beginner"
                                            >
                                                Just starting out
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="basic"
                                            >
                                                Know the basics
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="intermediate"
                                            >
                                                Comfortable
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="advanced"
                                            >
                                                Advanced
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ap-diag-block">
                                        <div className="ap-diag-label">
                                            How much time do you have right now?
                                        </div>
                                        <div
                                            className="ap-diag-opts"
                                            role="group"
                                            aria-label="Time available options"
                                            data-question="time"
                                        >
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="5"
                                            >
                                                About 5 minutes
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="20"
                                            >
                                                About 20 minutes
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="60"
                                            >
                                                An hour or more
                                            </button>
                                            <button
                                                className="ap-diag-opt"
                                                type="button"
                                                data-value="20"
                                            >
                                                Not sure yet
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ap-orient-cta-wrap">
                                        <button
                                            className="btn ap-full-btn"
                                            id="apOrientSubmit"
                                            type="button"
                                        >
                                            Get my first recommendation →
                                        </button>
                                    </div>

                                    <div className="ap-orient-sci">
                                        Research shows that a targeted first activity increases the
                                        chance of returning for a second session significantly
                                        compared to open-ended browsing. — Self-determination
                                        theory, Deci &amp; Ryan
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            id="apBuildingMode"
                            className="ap-hidden"
                            aria-label="Building profile guidance"
                        >
                            <div className="ap-header">
                                <div className="ap-header-row">
                                    <div>
                                        <div className="ap-kicker">Adaptive Practice</div>
                                        <h1 className="ap-title">Building your profile</h1>
                                    </div>
                                    <div className="ap-last-session">
                                        <div className="ap-session-dot"></div>
                                        Last session 2 days ago
                                    </div>
                                </div>
                                <div className="ap-subtitle">
                                    You're 3 sessions in. A few more will give us enough to
                                    identify your specific strengths and gaps precisely.
                                </div>
                            </div>

                            <div className="ap-section-label">Recommendation</div>

                            <div className="window glow-follow ap-building-window">
                                <div className="window-pad">
                                    <div className="ap-building-note" role="note">
                                        <span className="ap-building-icon" aria-hidden="true">
                                            ◈
                                        </span>
                                        <span>
                                            Your profile is still building. This recommendation is
                                            based on limited evidence — it's a good starting point,
                                            but will become more precise after a few more sessions.
                                        </span>
                                    </div>

                                    <div
                                        className="ap-profile-meter"
                                        aria-label="Profile depth meter"
                                    >
                                        <div className="ap-profile-meter-row">
                                            <span className="ap-profile-meter-label">
                                                Profile depth
                                            </span>
                                            <span className="ap-profile-meter-val">
                                                3 of ~12 sessions for full guidance
                                            </span>
                                        </div>
                                        <div
                                            className="ap-profile-track"
                                            role="progressbar"
                                            aria-valuenow="25"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        >
                                            <div className="ap-profile-fill" data-fill="25"></div>
                                        </div>
                                    </div>

                                    <div className="ap-headline ap-headline-sm">
                                        Continue with Language Basics — you've started there and
                                        have the most data to work with.
                                    </div>
                                    <div className="ap-context ap-context-tight">
                                        You've completed 2 sessions on Language Basics at Basic
                                        difficulty. One more session gives us enough to assess
                                        whether you're ready to progress or need more practice at
                                        this level.
                                    </div>

                                    <div className="ap-sci">
                                        <div className="ap-sci-text">
                                            Deliberate practice begins with an accurate baseline —
                                            without enough data, practice time risks being
                                            misdirected.
                                        </div>
                                    </div>

                                    <div className="ap-cta-row">
                                        <a
                                            className="btn"
                                            href="mcq-parent.html?categories=Language+Basics&difficulty=basic&count=10&source=adaptive"
                                        >
                                            Continue Language Basics →
                                        </a>
                                        <a className="ghost" href="mcq-parent.html">
                                            Try something different
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            id="apFullMode"
                            className="ap-hidden"
                            aria-label="Full adaptive guidance"
                        >
                            <div className="ap-header">
                                <div className="ap-header-row">
                                    <div>
                                        <div className="ap-kicker" id="apKicker">
                                            Adaptive Practice
                                        </div>
                                        <h1 className="ap-title">Your practice guidance</h1>
                                    </div>
                                    <div className="ap-last-session">
                                        <div className="ap-session-dot"></div>
                                        <span id="apLastSession">Loading…</span>
                                    </div>
                                </div>
                                <div className="ap-subtitle" id="apSubtitle">
                                    Analysing your session data…
                                </div>
                            </div>

                            <div className="adaptive-shell">
                                <div className="ap-left-col">
                                    <div
                                        className="ap-milestone-banner"
                                        id="apMilestoneBanner"
                                        hidden
                                        role="status"
                                        aria-live="polite"
                                    ></div>

                                    <div className="ap-section-label">Primary recommendation</div>

                                    <div
                                        className="ap-primary window glow-follow"
                                        aria-label="Primary recommendation"
                                    >
                                        <div className="ap-primary-accent" aria-hidden="true"></div>
                                        <div className="ap-primary-pad">
                                            <div
                                                className="ap-type-tag"
                                                id="apPrimaryTag"
                                                aria-label="Recommendation type"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.2"
                                                    strokeLinecap="round"
                                                    aria-hidden="true"
                                                >
                                                    <circle cx="12" cy="12" r="3" />
                                                    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                                                </svg>
                                                <span>Loading…</span>
                                            </div>

                                            <h2 className="ap-headline" id="apPrimaryHeadline">
                                                Analysing your data…
                                            </h2>
                                            <div className="ap-context" id="apPrimaryContext"></div>

                                            <div
                                                className="ap-evidence"
                                                aria-label="Evidence confidence"
                                            >
                                                <div className="ap-evidence-row">
                                                    <span>Evidence confidence</span>
                                                    <span
                                                        className="ap-evidence-value"
                                                        id="apEvidenceValue"
                                                    >
                                                        —
                                                    </span>
                                                </div>
                                                <div
                                                    className="ap-evidence-track"
                                                    role="progressbar"
                                                    aria-label="Evidence confidence level"
                                                >
                                                    <div
                                                        className="ap-evidence-fill"
                                                        id="apEvidenceFill"
                                                    ></div>
                                                </div>
                                            </div>

                                            <div
                                                className="ap-sci"
                                                role="note"
                                                aria-label="Scientific basis"
                                            >
                                                <div className="ap-sci-text" id="apPrimarySci"></div>
                                                <button
                                                    className="ap-sci-toggle"
                                                    type="button"
                                                    aria-expanded="false"
                                                >
                                                    Why this works ↓
                                                </button>
                                                <div
                                                    className="ap-sci-detail"
                                                    id="apPrimarySciDetail"
                                                    role="region"
                                                ></div>
                                            </div>

                                            <div className="ap-cta-row">
                                                <a
                                                    className="btn"
                                                    id="apPrimaryCta"
                                                    href="mcq-parent.html"
                                                >
                                                    Launch →
                                                </a>
                                                <button className="ghost" type="button">
                                                    Not today
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ap-section-label">Alternatives</div>
                                    <div
                                        className="ap-alt-grid"
                                        id="apAltGrid"
                                        aria-label="Alternative recommendations"
                                    ></div>
                                </div>

                                <aside
                                    className="adaptive-sidebar-col"
                                    aria-label="Session analytics"
                                >
                                    <div
                                        className="window glow-follow ap-sidebar-card ap-quality-card"
                                        aria-label="Session quality indicator"
                                    >
                                        <div className="ap-sidebar-card-head">
                                            <div className="ap-sidebar-card-title">
                                                Last session quality
                                            </div>
                                        </div>
                                        <div className="ap-sidebar-card-body">
                                            <div
                                                className="ap-quality-levels"
                                                id="apQualityLevels"
                                                role="list"
                                                aria-label="Quality levels"
                                            ></div>
                                            <div className="ap-quality-desc">
                                                Based on accuracy, peek rate, and response confidence
                                                from your last session.
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="window glow-follow ap-sidebar-card"
                                        aria-label="Recent sessions"
                                    >
                                        <div className="ap-sidebar-card-head">
                                            <div className="ap-sidebar-card-title">
                                                Recent sessions
                                            </div>
                                        </div>
                                        <div className="ap-sidebar-card-body">
                                            <div
                                                className="ap-recent-list"
                                                id="apRecentList"
                                                role="list"
                                                aria-label="Recent session results"
                                            ></div>
                                        </div>
                                    </div>

                                    <div
                                        className="window glow-follow ap-sidebar-card"
                                        aria-label="Next spaced review"
                                    >
                                        <div className="ap-sidebar-card-head">
                                            <div className="ap-sidebar-card-title">
                                                Next spaced review
                                            </div>
                                        </div>
                                        <div className="ap-sidebar-card-body">
                                            <div className="ap-review-item-name">Arrays</div>
                                            <div className="ap-review-item-sub ap-review-item-sub--urgent">
                                                Review window open now — 16 days since last correct
                                                answers.
                                            </div>
                                            <div className="ap-review-item-name">Language Basics</div>
                                            <div className="ap-review-item-sub">
                                                Review due in 5 days — advancement unlocked.
                                            </div>
                                            <div className="ap-review-sci">
                                                Spaced repetition: reviewing at the point of
                                                near-forgetting produces more durable memory than
                                                reviewing earlier or later.
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>

                            <div className="ap-rings-full-span">
                                <div className="ap-section-label">Category progress</div>
                                <div
                                    className="ap-rings-scroll"
                                    id="apRingsContainer"
                                    aria-label="Category progression rings"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default InterView;
