// components/TabBar.jsx
import React, { useRef } from 'react';

const TABS = [
  { key: 'account', label: 'Account',    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/></svg> },
  { key: 'billing', label: 'Billing',    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 10h20" stroke="currentColor" strokeWidth="2"/></svg> },
  { key: 'notif',   label: 'Notifications', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { key: 'appear',  label: 'Appearance', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
];

const SUBTABS = [
  { key: 'general',  label: 'General' },
  { key: 'editor',   label: 'Code Editor' },
  { key: 'repl',     label: 'REPL' },
  { key: 'instruct', label: 'Instructions & Tutorial' },
];

export default function TabBar({ activeTab, onTabChange, activeSubTab, onSubTabChange }) {
  const tabRefs = useRef([]);
  const subRefs = useRef([]);

  function handleTabKey(e, idx) {
    if (e.key === 'ArrowRight') { e.preventDefault(); const next = (idx + 1) % TABS.length; tabRefs.current[next]?.focus(); onTabChange(TABS[next].key); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); const prev = (idx - 1 + TABS.length) % TABS.length; tabRefs.current[prev]?.focus(); onTabChange(TABS[prev].key); }
  }

  function handleSubKey(e, idx) {
    if (e.key === 'ArrowRight') { e.preventDefault(); const next = (idx + 1) % SUBTABS.length; subRefs.current[next]?.focus(); onSubTabChange(SUBTABS[next].key); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); const prev = (idx - 1 + SUBTABS.length) % SUBTABS.length; subRefs.current[prev]?.focus(); onSubTabChange(SUBTABS[prev].key); }
  }

  return (
    <>
      <div className="as-tabs" role="tablist" aria-label="Settings sections">
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            ref={el => tabRefs.current[idx] = el}
            className={`as-tab${activeTab === tab.key ? ' active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tab-${tab.key}`}
            id={`tabn-${tab.key}`}
            type="button"
            onClick={() => onTabChange(tab.key)}
            onKeyDown={e => handleTabKey(e, idx)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab nav — only visible when Appearance tab is active */}
      <div className="as-subtabs" role="tablist" aria-label="Appearance sections" hidden={activeTab !== 'appear' || undefined}>
        {SUBTABS.map((sub, idx) => (
          <button
            key={sub.key}
            ref={el => subRefs.current[idx] = el}
            className={`as-subtab${activeSubTab === sub.key ? ' active' : ''}`}
            role="tab"
            aria-selected={activeSubTab === sub.key}
            aria-controls={`asp-${sub.key}`}
            type="button"
            onClick={() => onSubTabChange(sub.key)}
            onKeyDown={e => handleSubKey(e, idx)}
          >
            {sub.label}
          </button>
        ))}
      </div>
    </>
  );
}
