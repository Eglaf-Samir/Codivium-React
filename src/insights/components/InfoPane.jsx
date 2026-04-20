// src/insights/components/InfoPane.jsx
import React from 'react';

// Replaces literal \n with real newlines (matches vanilla setInfoPane logic)
function fixNewlines(s) {
  return (s || '').replace(/\\n/g, '\n');
}

const NAV_TABS = [
  { key: 'dashboard_overview', label: 'Overview' },
  { key: 'panel_scores',       label: 'Scores'   },
  { key: 'panel_heatmap',      label: 'Heatmap'  },
  { key: 'panel_depth',        label: 'Depth'    },
  { key: 'panel_time',         label: 'Time'     },
  { key: 'panel_exercise',     label: 'Alloc'    },
  { key: 'panel_mcq',          label: 'MCQ'      },
];

// ── Structured insight renderer (matches vanilla renderInsightObject) ────────
function InsightRenderer({ insight }) {
  if (!insight || typeof insight !== 'object') return null;
  const sections = Array.isArray(insight.sections) ? insight.sections : [];
  return (
    <div className="ciInsightWrap">
      {sections.map((sec, si) => (
        <div key={si}>
          {sec.heading && <div className="ciInsightHeading">{sec.heading}</div>}
          {(sec.blocks || []).map((b, bi) => {
            if (!b) return null;
            if (b.kind === 'bullets') {
              return (
                <ul key={bi} className="ciInsightList">
                  {(b.items || []).map((it, ii) => <li key={ii}>{it}</li>)}
                </ul>
              );
            }
            if (b.kind === 'note') {
              return <div key={bi} className="ciInsightNote">{b.text}</div>;
            }
            return <div key={bi} className="ciInsightPara" style={{whiteSpace:'pre-line'}}>{b.text}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

function AggDetails({ agg }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="infoAgg" id="infoAgg">
      <button
        className="infoAggBtn" id="infoAggBtn"
        type="button" aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen(v => !v)}
      >
        Aggregation details
      </button>
      <div className={`infoAggBody${open ? '' : ' isHidden'}`} id="infoAggBody">
        {agg}
      </div>
    </div>
  );
}

export default function InfoPane({ title, sub, body, interp, agg, onClose, hidden,
                                   showTabs, activeInfoKey, onTabClick }) {
  return (
    <aside
      aria-live="polite"
      className={`infoPane card${hidden ? ' isHidden' : ''}`}
      id="infoPane"
      aria-hidden={hidden ? 'true' : 'false'}
    >
      <div className="infoPaneHead">
        <div className="infoPaneHeadText">
          <div className="infoPaneTitle" id="infoPaneTitle">
            {title || 'Analysis'}
          </div>
          <div className="infoPaneSub" id="infoPaneSub">
            {fixNewlines(sub)}
          </div>
        </div>
        <button
          aria-label="Close analysis pane"
          className="infoPaneCloseBtn"
          id="infoPaneCloseBtn"
          title="Collapse analysis pane"
          type="button"
          onClick={onClose}
        >&#x2715;</button>
      </div>
      {/* Summary navigation tabs — visible in info_only (Summary View) mode */}
      {showTabs && (
        <div className="infoPaneTabs" id="cvInfoPaneTabs" role="tablist" aria-label="Dashboard summaries">
          {NAV_TABS.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              className={`infoPaneTabBtn${activeInfoKey === t.key ? ' isActive' : ''}`}
              aria-selected={activeInfoKey === t.key ? 'true' : 'false'}
              data-info-key={t.key}
              onClick={() => typeof onTabClick === 'function' && onTabClick(t.key)}
            >{t.label}</button>
          ))}
        </div>
      )}
      <div className="infoPaneScroll" id="infoPaneScroll">
        <div className={`infoPaneHint${showTabs ? ' isHidden' : ''}`} id="infoPaneHint">
          For any term you do not understand, refer to the{' '}
          <a href="#" className="dashHelpLink inline" id="openFaqLinkInPane">
            Dashboard FAQ
          </a>
          {' '}or the{' '}
          <a href="#" className="dashHelpLink inline" id="openGlossaryLinkInPane">
            Glossary of Terms
          </a>.
        </div>
        <div className="infoPaneWelcome" id="infoPaneWelcome" />
        {/* Use textContent-style rendering via pre-line CSS — no dangerouslySetInnerHTML */}
        <div
          className="infoPaneBody"
          id="infoPaneBody"
          style={{ whiteSpace: 'pre-line' }}
        >
          {fixNewlines(body)}
        </div>
        {interp && (
          <div className="infoPaneInterp" id="infoPaneInterp">
            <div className="infoPaneInterpTitle">Analysis of your results</div>
            {typeof interp === 'string'
              ? <div className="ciInsightPara" style={{ whiteSpace: 'pre-line' }}>{fixNewlines(interp)}</div>
              : <InsightRenderer insight={interp} />
            }
          </div>
        )}
        {/* Aggregation details — only shown when the metric has computation notes */}
        {agg && (
          <AggDetails agg={agg} />
        )}
      </div>
    </aside>
  );
}
