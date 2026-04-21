// src/pages/mcq/McqParentPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CATEGORIES = [
  'Arrays','Strings','Stacks','Queues','Trees','Graphs',
  'Dynamic Programming','Sorting','Searching','Hash Tables',
  'Linked Lists','Heaps','Tries','Bit Manipulation','Recursion',
];

function DifficultyLadder({ level }) {
  return (
    <div className="difficulty-ladder" role="img" aria-label={`Difficulty: ${level}`}>
      {['basic','intermediate','advanced'].map(l => (
        <div key={l} className={`ladder-step${l === level ? ' active' : ''}`} data-level={l} aria-label={l}/>
      ))}
    </div>
  );
}

export default function McqSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filterMode, setFilterMode] = useState('simple');
  const [catView,    setCatView]    = useState('all');
  const [selected,   setSelected]   = useState([]);
  const [simSearch,  setSimSearch]  = useState('');
  const [powSearch,  setPowSearch]  = useState('');
  const [showDrop,   setShowDrop]   = useState(false);
  const [difficulty, setDifficulty] = useState('basic');
  const [qCount,     setQCount]     = useState(10);
  const [skipCorrect,setSkipCorrect]= useState(false);
  const [infoTitle,  setInfoTitle]  = useState('Info');
  const [infoBody,   setInfoBody]   = useState('Click an \u201ci\u201d to view a clear explanation.');
  const [msg, setMsg] = useState('');
  const dropRef = useRef(null);

  const fromAdaptive = new URLSearchParams(location.search).get('source') === 'adaptive';

  const toggleCat = cat => setSelected(prev =>
    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const showInfo = (title, text) => { setInfoTitle(title); setInfoBody(text); };

  const visibleCats = CATEGORIES.filter(c => c.toLowerCase().includes(simSearch.toLowerCase()));
  const powerFiltered = CATEGORIES.filter(c => c.toLowerCase().includes(powSearch.toLowerCase()));

  function handleStart() {
    if (!selected.length) { setMsg('Please select at least one category.'); return; }
    setMsg('');
    navigate('/mcq/quiz', { state: { categories: selected, difficulty, qCount, skipCorrect } });
  }

  useEffect(() => {
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <main id="main-content" className="main" role="main">
      <div className="watermarks" aria-hidden="true">
        <div className="wm1">CODIVIUM</div><div className="wm2">CODIVIUM</div><div className="wm3">CODIVIUM</div>
      </div>
      <div className="page-shell">
        <div className="mcq-layout">
          <section className="window window-large glow-follow" aria-label="MCQ setup">
            <div className="window-pad">
              <div className="window-head">
                <h1 className="h1 h1-center">Multiple Choice Quiz Setup</h1>
              </div>
              {fromAdaptive && (
                <div className="ap-source-banner" role="note">
                  <span className="ap-source-icon" aria-hidden="true">&#9672;</span>
                  Recommended by your Adaptive Practice plan — settings pre-filled for you.
                </div>
              )}
              <div className="divider"/>
              <div className="form" aria-label="Filter form">
                <div className="filters-grid">
                  {/* Category panel */}
                  <section className="panel panel-left glow-follow" aria-label="Category filters" data-mode={filterMode}>
                    <div className="panel-window-tabs" role="tablist" aria-label="Category filter mode">
                      {['simple','power'].map(m => (
                        <button key={m} className={`wtab${filterMode===m?' is-active':''}`} type="button"
                          role="tab" aria-selected={filterMode===m} onClick={() => setFilterMode(m)}>
                          {m === 'simple' ? 'Simple Filter' : 'Power Filter'}
                        </button>
                      ))}
                    </div>
                    <div className="panel-head">
                      <div className="panel-title">
                        <div className="label-row">
                          <div className="label">Filter Categories</div>
                          <button className="info-dot info-dot-mini" type="button"
                            onClick={() => showInfo('Filter Modes','Simple: toggle pills. Power: search palette.')}>i</button>
                        </div>
                      </div>
                    </div>
                    <div className="cat-meta" aria-label="Category selection summary">
                      <div className="cat-meta-left"><div className="cat-count">Selected: {selected.length}</div></div>
                      <div className="cat-meta-right">
                        <div className="mini-tabs" role="tablist">
                          {['all','selected'].map(v => (
                            <button key={v} className={`mini-tab${catView===v?' is-active':''}`} type="button"
                              role="tab" aria-selected={catView===v} onClick={() => setCatView(v)}>
                              {v === 'all' ? 'All' : 'Selected'}
                            </button>
                          ))}
                        </div>
                        <button className="ghost ghost-mini" type="button" onClick={() => setSelected([])}>Clear</button>
                      </div>
                    </div>

                    {/* Power tab */}
                    {filterMode === 'power' && (
                      <div className="cat-tab" aria-label="Power filter panel">
                        <div className="palette" aria-label="Category command palette">
                          <div className="help help--flush">Quick select</div>
                          <div className="control glow-follow palette-control" ref={dropRef}>
                            <input className="palette-input" type="text" placeholder="Search categories…"
                              value={powSearch} onChange={e => { setPowSearch(e.target.value); setShowDrop(true); }}
                              onFocus={() => setShowDrop(true)} aria-label="Quick category search"/>
                            <button className="palette-browse" type="button" onClick={() => setShowDrop(d => !d)}>
                              <svg viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            {showDrop && (
                              <div className="palette-dropdown" role="listbox">
                                {powerFiltered.length === 0 && <div className="palette-option palette-option--empty">No matches</div>}
                                {powerFiltered.map(cat => (
                                  <div key={cat} className={`palette-option${selected.includes(cat)?' selected':''}`}
                                    role="option" aria-selected={selected.includes(cat)}
                                    onClick={() => { toggleCat(cat); setShowDrop(false); setPowSearch(''); }}>
                                    {cat}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="category-box glow-follow" role="group">
                          <div className="category-head">
                            <div className="mini">
                              <input id="catAll" type="checkbox"
                                checked={selected.length === CATEGORIES.length}
                                onChange={e => e.target.checked ? setSelected([...CATEGORIES]) : setSelected([])}/>
                              <label htmlFor="catAll">Select all</label>
                            </div>
                          </div>
                          <div className="category-scroll">
                            {CATEGORIES.map(cat => (
                              <label key={cat} className="chk">
                                <input type="checkbox" checked={selected.includes(cat)} onChange={() => toggleCat(cat)}/>
                                <span>{cat}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple tab */}
                    {filterMode === 'simple' && (
                      <div className="cat-tab" aria-label="Simple filter panel">
                        <div className="simple-wrap">
                          <div className="simple-top">
                            <div className="control glow-follow simple-search-wrap">
                              <label className="sr-only" htmlFor="simpleSearch">Filter categories</label>
                              <input id="simpleSearch" className="simple-search" type="text"
                                placeholder="Filter categories…" value={simSearch}
                                onChange={e => setSimSearch(e.target.value)}/>
                            </div>
                            <div className="simple-actions">
                              <button className="ghost ghost-mini" type="button" onClick={() => setSelected([...CATEGORIES])}>Select all</button>
                              <button className="ghost ghost-mini" type="button" onClick={() => setSelected([])}>Clear</button>
                            </div>
                          </div>
                          <div className="help help--spaced">Tap pills to toggle categories.</div>
                          <div className="simple-groups" aria-label="Category pills">
                            {(catView === 'all' ? visibleCats : visibleCats.filter(c => selected.includes(c))).map(cat => (
                              <button key={cat} type="button"
                                className={`cat-pill${selected.includes(cat) ? ' active' : ''}`}
                                onClick={() => toggleCat(cat)}>
                                {cat}
                              </button>
                            ))}
                            {catView === 'selected' && selected.length === 0 && <div className="help">No categories selected yet.</div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Right stack */}
                  <div className="right-stack">
                    <section className="panel panel-right" aria-label="Difficulty and quiz options">
                      <div className="right-controls">
                        <div className="panel-group glow-follow">
                          <div className="label">Difficulty</div>
                          <div className="togglebar" role="radiogroup">
                            {['basic','intermediate','advanced'].map(d => (
                              <div key={d} className="toggle-item">
                                <input id={`diff_${d}`} type="radio" name="difficulty" value={d}
                                  checked={difficulty===d} onChange={() => setDifficulty(d)}/>
                                <label htmlFor={`diff_${d}`}>{d[0].toUpperCase()+d.slice(1)}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="panel-group glow-follow">
                          <div className="label">Number of Questions</div>
                          <div className="range-wrap">
                            <div className="range-meta">
                              <div className="help">Min 10 • Max 50</div>
                              <div className="qcount-display">
                                <span className="qcount-label">Selected: </span>
                                <span className="qcount-num">{qCount}</span>
                              </div>
                            </div>
                            <div className="control control--padded glow-follow">
                              <input type="range" min="10" max="50" step="1" value={qCount}
                                onChange={e => setQCount(Number(e.target.value))}/>
                            </div>
                            <div className="quick-set control glow-follow">
                              <button className="ghost" type="button" onClick={() => setQCount(10)}>Min</button>
                              <button className="ghost" type="button" onClick={() => setQCount(50)}>Max</button>
                            </div>
                          </div>
                        </div>
                        <div className="panel-group glow-follow">
                          <div className="checkline">
                            <input id="skipCorrect" type="checkbox" checked={skipCorrect}
                              onChange={e => setSkipCorrect(e.target.checked)}/>
                            <label htmlFor="skipCorrect">Exclude questions previously answered correctly</label>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="panel panel-quickguide glow-follow" aria-label="Quick guide">
                      <div className="qg-header"><div className="label">Quick Start</div></div>
                      <div className="qg-list">
                        {['Select one or more categories','Select difficulty level','Set the number of questions',
                          'Optionally exclude previously-correct questions','Hit Start Quiz.'].map(t => (
                          <div key={t} className="qg-item qg-item-flat"><span>• {t}</span></div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                {msg && <div className="msg" role="status" aria-live="polite">{msg}</div>}
                <div className="actions"><div className="actions-right">
                  <button className="btn" type="button" onClick={handleStart}>Start Quiz</button>
                </div></div>
              </div>
            </div>
          </section>

          {/* Right rail */}
          <aside className="mcq-rail" aria-label="MCQ details panels">
            <section className="window window-rail glow-follow" aria-label="Explanations">
              <div className="window-pad rail-pad">
                <div className="rail-head">
                  <div className="rail-title">{infoTitle}</div>
                  <button className="rail-clear" type="button"
                    onClick={() => { setInfoTitle('Info'); setInfoBody('Click an \u201ci\u201d to view a clear explanation.'); }}>×</button>
                </div>
                <div className="rail-body">{infoBody}</div>
              </div>
            </section>

            <section className="window window-rail window-palette glow-follow" aria-label="Selected settings">
              <div className="window-pad rail-pad">
                <div className="rail-head">
                  <div className="rail-title-row">
                    <div className="rail-title">Selected Settings</div>
                    <div className="ready-badge"><span className="ready-dot" aria-hidden="true"/><span className="ready-text">Ready</span></div>
                  </div>
                </div>
                <div className="summary">
                  <div className="summary-block">
                    <div className="summary-label">Difficulty Level</div>
                    <DifficultyLadder level={difficulty}/>
                  </div>
                  <div className="summary-block">
                    <div className="summary-row">
                      <div className="summary-k">Number of Questions</div>
                      <div className="summary-v">{qCount}</div>
                    </div>
                  </div>
                  <div className="summary-block">
                    <div className="summary-label">Categories</div>
                    <div className="summary-pills">
                      {selected.length === 0
                        ? <span className="rail-muted">None selected</span>
                        : selected.map(c => <span key={c} className="pill">{c}</span>)}
                    </div>
                  </div>
                  <div className="summary-block">
                    <div className="summary-label">Exclude Setting</div>
                    <div className="summary-text">{skipCorrect ? 'Excluding previously correct' : 'Including all questions'}</div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
