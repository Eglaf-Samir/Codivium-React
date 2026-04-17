// src/insights/components/DashboardHeader.jsx
import React from 'react';

export default function DashboardHeader({
  anchorDate, onOpenFaq, onOpenGlossary, onStartTour,
  infoPaneOpen, onToggleInfoPane,
  analyseActive, onToggleAnalyse,
  isInfoOnly, onRefresh,
}) {
  return (
    <div className="form-head">
      <div className="form-head-left">
        <h1 className="pageTitle">
          Performance Insights Dashboard{' '}
          <button aria-label="Intro" className="infoBtn introLink"
            data-info-key="welcome" type="button">Intro</button>
          <button aria-label="Dashboard summary" className="infoBtn pageInfoBtn"
            data-info-key="dashboard_overview" type="button">i</button>
          <button aria-label="Refresh dashboard"
            className="infoBtn introLink refreshDashboardBtn" type="button"
            onClick={onRefresh}>
            Refresh dashboard
          </button>
        </h1>
        <div className="pageSubRow">
          <p className="pageSub">
            Track time, convergence, and knowledge signals across categories.
          </p>
          <span id="anchorDate" className="anchorDateTagline" aria-label="Anchor date">
            {anchorDate ? `Anchor date: ${anchorDate}` : ''}
          </span>
        </div>
      </div>

      <div className="form-head-right">
        {/* Info + Analyse toggle buttons — left of FAQ link */}
        <button
          id="cvInfoPaneToggleBtn"
          type="button"
          className={`cvInfoPaneToggleBtn${infoPaneOpen ? ' isPaneOpen' : ''}${isInfoOnly ? ' isHidden' : ''}`}
          aria-label="Toggle info panel"
          aria-pressed={infoPaneOpen}
          onClick={onToggleInfoPane}
        >
          <svg className="cvInfoPaneToggleIco" width="16" height="16"
            viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <rect x="2" y="2" width="16" height="16" rx="2"
              fill="none" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="13" y="2" width="5" height="16" rx="0"
              fill="currentColor" opacity="0.3"/>
            <line x1="13" y1="2" x2="13" y2="18"
              stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          <span className="cvInfoPaneToggleTxt">Info</span>
        </button>

        <button
          id="cvAnalyseModeBtn"
          type="button"
          className={`cvInfoPaneToggleBtn${analyseActive ? ' isPaneOpen' : ''}`}
          aria-label="Analyse mode"
          aria-pressed={analyseActive}
          onClick={onToggleAnalyse}
        >
          <svg width="16" height="16" viewBox="0 0 20 20"
            aria-hidden="true" focusable="false"
            style={{flexShrink:0, opacity:0.85}}>
            <circle cx="9" cy="9" r="5.5" fill="none"
              stroke="currentColor" strokeWidth="1.6"/>
            <line x1="13.5" y1="13.5" x2="17.5" y2="17.5"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <span className="cvInfoPaneToggleTxt">Analyse</span>
        </button>

        <div className="headHelpLinks">
          <a href="#" className="dashHelpLink" id="openFaqLink" role="link"
            onClick={e => { e.preventDefault(); onOpenFaq(); }}>
            Dashboard FAQ
          </a>
          <span className="dashHelpSep" aria-hidden="true">·</span>
          <a href="#" className="dashHelpLink" id="openGlossaryLink" role="link"
            onClick={e => { e.preventDefault(); onOpenGlossary(); }}>
            Glossary of Terms
          </a>
        </div>
        <button className="segBtn tourBtn" id="startTourBtn" type="button"
          onClick={onStartTour}>
          Explore the Dashboard
        </button>
      </div>
    </div>
  );
}
