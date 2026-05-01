// McqParentPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCategories }  from './hooks/useCategories.js';
import { readSettings, writeSettings, defaultSettings, readUrlParams } from './utils/storage.js';
import CategoryFilter from './components/CategoryFilter/CategoryFilter.jsx';
import OptionsPanel   from './components/OptionsPanel.jsx';
import SummaryRail    from './components/SummaryRail.jsx';
import InfoRail       from './components/InfoRail.jsx';
import McqTour, { useMcqTour } from '../mcq-shared/McqTour.jsx';
import { useGlowFollow } from '../mcq-shared/useGlowFollow.js';

const QUIZ_URL = window.__CODIVIUM_MCQ_QUIZ_URL__ || '/mcq/quiz';

function safeRedirect(url) {
  try {
    // Resolve relative to current page href, NOT origin —
    // origin-relative breaks when serving from a subdirectory.
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) return;
    window.location.href = parsed.href;
  } catch (_) {
    // Last resort: simple relative navigation always works
    window.location.href = url;
  }
}

export default function McqParentPage() {
  useGlowFollow();
  const tourState = useMcqTour({ onParent: true });
  const { categories, loading, error } = useCategories();

  const urlParams = readUrlParams();
  const saved     = readSettings();
  const base      = saved || defaultSettings();
  const initial   = urlParams ? { ...base, ...urlParams } : base;

  const [selected,    setSelected]    = useState(initial.categories || []);
  const [difficulty,  setDifficulty]  = useState(initial.difficulty || 'basic');
  const [count,       setCount]       = useState(initial.questionCount || 10);
  const [skipCorrect, setSkipCorrect] = useState(!!initial.skipCorrect);
  const [infoKey,     setInfoKey]     = useState('purpose');
  const [msg,         setMsg]         = useState('');
  const [launching,   setLaunching]   = useState(false);
  const startBtnRef = useRef(null);

  const showAdaptiveBanner = !!(urlParams?.source === 'adaptive');

  // After React mounts, tell mcq-tour.js to wire the button and resume any
  // in-progress tour (tour state is saved in sessionStorage across navigations).
  useEffect(() => {
    if (typeof window.__mcqTourWire === 'function') window.__mcqTourWire();
  }, []);

  // On first categories load: seed selection from saved settings or URL params.
  // Uses a ref so this only fires the FIRST time categories arrive — never
  // when the user clears/changes their selection afterwards.
  const categoriesSeededRef = useRef(false);
  useEffect(() => {
    if (!categories.length || categoriesSeededRef.current) return;
    categoriesSeededRef.current = true;
    // Remove any stale saved selections that no longer exist in the API list
    const catSet = new Set(categories);
    if (selected.length === 0) {
      setSelected([...categories]);
    } else {
      const valid = selected.filter(c => catSet.has(c));
      setSelected(valid.length ? valid : [...categories]);
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(() => {
    if (loading || !categories.length || launching) return;
    const cats = selected.length ? selected : [...categories];
    const settings = { categories: cats, difficulty, questionCount: count, skipCorrect };
    writeSettings(settings);
    setLaunching(true);
    setMsg('');
    safeRedirect(QUIZ_URL);
  }, [loading, categories, selected, difficulty, count, skipCorrect, launching]);

  return (
    <>
    <main className="main" id="main-content" role="main">
    <div className="page-shell">
      <div className="mcq-layout" id="mcqLayout">

        {/* Main window */}
        <section className="window window-large glow-follow" aria-label="MCQ setup">
          <div className="window-pad">
            <div className="window-head">
              <h1 className="h1 h1-center">Multiple Choice Quiz Setup</h1>
              <button className="ghost ghost-mini" id="mcqTourBtn" type="button"
                aria-label="Explore the MCQ setup page"
                onClick={tourState.start}>Explore MCQ Setup</button>
            </div>

            {/* Adaptive banner */}
            <div className="ap-source-banner" id="apSourceBanner"
              hidden={!showAdaptiveBanner || undefined} role="note">
              <span className="ap-source-icon" aria-hidden="true">◈</span>
              Recommended by your Adaptive Practice plan — settings pre-filled for you. Adjust if needed, then start.
            </div>

            <div className="divider" />

            {/* API error */}
            {error && (
              <div className="msg show" role="alert" style={{ marginBottom: 12 }}>{error}</div>
            )}

            <div className="form" aria-label="Filter form">
              <div className="filters-grid">

                {/* LEFT: category filter */}
                <CategoryFilter
                  categories={categories}
                  selected={selected}
                  onChange={setSelected}
                  onInfo={setInfoKey}
                />

                {/* RIGHT STACK */}
                <div className="right-stack">

                  {/* Difficulty + count + skip */}
                  <OptionsPanel
                    difficulty={difficulty}
                    onDifficulty={setDifficulty}
                    count={count}
                    onCount={setCount}
                    skipCorrect={skipCorrect}
                    onSkip={setSkipCorrect}
                    onInfo={setInfoKey}
                  />

                  {/* Quick guide */}
                  <section className="panel panel-quickguide glow-follow" aria-label="Quick guide">
                    <div className="qg-header">
                      <div className="label-row">
                        <div className="label">Quick Start</div>
                        <button className="info-dot info-dot-mini" id="qgInfo" type="button"
                          aria-label="What is this for?" onClick={() => setInfoKey('purpose')}>i</button>
                      </div>
                    </div>
                    <div className="qg-list" aria-label="Quick steps">
                      <div className="qg-item qg-item-flat">
                        <span>• Select one or more categories</span>
                        <button className="info-dot info-dot-mini info-inline" id="catInfo" type="button"
                          aria-label="What is a category?" onClick={() => setInfoKey('category')}>i</button>
                      </div>
                      <div className="qg-item qg-item-flat">
                        <span>• Select difficulty level</span>
                        <button className="info-dot info-dot-mini info-inline" id="diffInfo" type="button"
                          aria-label="What do difficulty levels mean?" onClick={() => setInfoKey('difficulty')}>i</button>
                      </div>
                      <div className="qg-item qg-item-flat">
                        <span>• Set the number of questions for the quiz.</span>
                        <button className="info-dot info-dot-mini info-inline" id="countInfo" type="button"
                          aria-label="What does number of questions mean?" onClick={() => setInfoKey('qcount')}>i</button>
                      </div>
                      <div className="qg-item qg-item-flat">
                        <span>• Choose to exclude questions already correctly answered.</span>
                        <button className="info-dot info-dot-mini info-inline" id="excludeGuideInfo" type="button"
                          aria-label="About exclude" onClick={() => setInfoKey('exclude')}>i</button>
                      </div>
                      <div className="qg-item qg-item-flat">
                        <span>• Hit Start Quiz.</span>
                        <button className="info-dot info-dot-mini info-inline" id="startFlashInfo" type="button"
                          aria-label="Show me the Start button" onClick={() => {
                          setInfoKey('purpose');
                          const btn = startBtnRef.current;
                          if (btn) {
                            btn.classList.remove('is-flash');
                            void btn.offsetWidth;
                            btn.classList.add('is-flash');
                            setTimeout(() => btn.classList.remove('is-flash'), 1500);
                          }
                        }}>i</button>
                      </div>
                    </div>
                  </section>

                </div>{/* /right-stack */}
              </div>{/* /filters-grid */}

              {/* Status message */}
              {msg && (
                <div className="msg show" id="msg" role="status" aria-live="polite">{msg}</div>
              )}

              {/* Start Quiz */}
              <div className="actions">
                <div className="actions-right">
                  <button
                    className="btn"
                    id="startQuiz"
                    ref={startBtnRef}
                    type="button"
                    disabled={loading || launching || !categories.length}
                    onClick={handleStart}
                  >
                    {launching ? 'Launching…' : loading ? 'Loading…' : 'Start Quiz'}
                  </button>
                </div>
              </div>

            </div>{/* /form */}
          </div>{/* /window-pad */}
        </section>{/* /window */}

        {/* RIGHT RAIL */}
        <aside className="mcq-rail" aria-label="MCQ details panels">

          <section className="window window-rail glow-follow" aria-label="Explanations">
            <InfoRail activeKey={infoKey} onClear={() => setInfoKey(null)} />
          </section>

          <section className="window window-rail window-palette glow-follow" aria-label="Selected settings">
            <SummaryRail
              categories={selected}
              allCategories={categories}
              difficulty={difficulty}
              count={count}
              skipCorrect={skipCorrect}
            />
          </section>

        </aside>
      </div>
    </div>
    </main>
    <McqTour tourState={tourState} />
    </>
  );
}
