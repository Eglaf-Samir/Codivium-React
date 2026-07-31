// McqParentPage.jsx — MCQ quiz setup page (post-rewire to live backend)
//
// Wires the page to the existing Code-Adept backend (the same endpoints
// Code-Adept-React's UserMcqs.jsx page uses in production):
//   - paramMaster → difficulty list (with Guid IDs)
//   - paramMaster → MCQ categories for chosen difficulty
//   - ActivePackagebyuserid → subscription gate
//   - getUserById / UpdateUserById → server-side persistence of selection
//
// Selection is tracked by Guid ID throughout; category *names* travel
// alongside only for display in the pill component (which still works
// against strings). On Start Quiz we write the IDs to localStorage so the
// quiz page can post them straight to GetAllbyfilterAsync.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDifficultyLevels,
  useCategoriesForDifficulty,
} from './hooks/useCategories.js';
import { readSettings, writeSettings, defaultSettings, readUrlParams } from './utils/storage.js';
import CategoryFilter from './components/CategoryFilter/CategoryFilter.jsx';
import OptionsPanel   from './components/OptionsPanel.jsx';
import SummaryRail    from './components/SummaryRail.jsx';
import InfoRail       from './components/InfoRail.jsx';
import McqTour, { useMcqTour } from '../mcq-shared/McqTour.jsx';
import { useGlowFollow } from '../mcq-shared/useGlowFollow.js';
import { useCssLoader } from '../../hooks/useCssLoader.js';
import { ActivePackagebyuserid } from '../../api/pricepackage/apipackage';
import { getUserById, UpdateUserById } from '../../api/auth/apiauth';
import { GetFreeQuestionCount } from '../../api/mcq/apimcq';
import { logout } from '../../utils/auth';
import FreeQuizGateModal from './components/FreeQuizGateModal.jsx';
import PackagePickerModal from '../MenuPage/PackagePickerModal.jsx';

const MCQ_CSS = [
  '/assets/css/components/mcq/mcq-forms.css',
  '/assets/css/components/mcq/mcq-parent.css',
  '/assets/css/components/mcq/mcq-setup-overrides.css',
];

const QUIZ_URL = window.__CODIVIUM_MCQ_QUIZ_URL__ || '/mcq/quiz';

function safeRedirect(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) return;
    window.location.href = parsed.href;
  } catch (_) {
    window.location.href = url;
  }
}

// Pick a sensible default difficulty when nothing is saved/URL'd. Prefer
// "intermediate" (matches OLD project behavior); fall back to second-to-last
// then first, mirroring UserMcqs.jsx's seed logic.
function pickDefaultDifficultyId(list) {
  if (!list?.length) return '';
  const inter = list.find(d => (d.name || '').toLowerCase() === 'intermediate');
  if (inter) return inter.id;
  if (list.length > 1) return list[list.length - 2].id;
  return list[0].id;
}

export default function McqParentPage() {
  const cssReady = useCssLoader(MCQ_CSS, { evict: true });
  useGlowFollow();
  const tourState = useMcqTour({ onParent: true });
  const navigate = useNavigate();

  const userId = typeof window !== 'undefined' ? localStorage.getItem('Userid') : '';

  // Saved + URL settings as the seed for state. URL takes precedence.
  const urlParams = readUrlParams();
  const saved     = readSettings();
  const base      = saved || defaultSettings();
  const initial   = urlParams ? { ...base, ...urlParams } : base;

  // ── Data sources ─────────────────────────────────────────────
  const { difficulties, loading: loadingDiff, error: diffError } = useDifficultyLevels();
  const [difficultyLevelId, setDifficultyLevelId] = useState(initial.difficultyLevelId || '');
  const { categories, categoryNames, loading: loadingCats, error: catError } =
    useCategoriesForDifficulty(difficultyLevelId);

  // ── Selection state (carries IDs; names are for display only) ─
  const [selectedIds, setSelectedIds] = useState(Array.isArray(initial.categoryIds) ? initial.categoryIds : []);
  // Clamp to [10, 50] even for a saved/URL value — guards against stale
  // localStorage from before the 10-question minimum was enforced.
  const [count,       setCount]       = useState(
    Number.isFinite(initial.questionCount) ? Math.max(10, Math.min(50, initial.questionCount)) : 10
  );
  const [skipCorrect, setSkipCorrect] = useState(!!initial.skipCorrect);
  const [infoKey,     setInfoKey]     = useState('purpose');
  const [msg,         setMsg]         = useState('');
  const [launching,   setLaunching]   = useState(false);
  const [activePackage, setActivePackage] = useState(null);
  const [packageReady,  setPackageReady]  = useState(false);
  const [savedUser,     setSavedUser]     = useState(null);
  const [gateInfo,      setGateInfo]      = useState(null); // { freeCount } | null
  const [pkgModalOpen,  setPkgModalOpen]  = useState(false);
  const startBtnRef = useRef(null);

  // True once we know the user's package includes full MCQ access. False
  // both while the package hasn't loaded yet and for users on a package (or
  // no package) without that entitlement — either way, Start Quiz routes
  // through the free-question gate below instead of starting directly.
  const hasAllMcqAccess = React.useMemo(
    () => !!(activePackage?.isAccessToAllMCQ ?? activePackage?.IsAccessToAllMCQ),
    [activePackage]
  );

  // "Exclude questions previously answered correctly" is a package-only
  // feature. Force it off the moment we know the user isn't entitled, so a
  // value carried over from localStorage/a previous package can't sneak a
  // premium option into a free-only quiz.
  useEffect(() => {
    if (packageReady && !hasAllMcqAccess && skipCorrect) setSkipCorrect(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageReady, hasAllMcqAccess]);

  const showAdaptiveBanner = !!(urlParams?.source === 'adaptive');
  const error = diffError || catError;

  // Once difficulty list arrives, lock in a default if nothing is set yet.
  // Prefer saved → URL hint → smart pick. Runs only when difficultyLevelId
  // is still empty so user manual changes are preserved.
  const diffSeededRef = useRef(false);
  useEffect(() => {
    if (!difficulties.length || diffSeededRef.current) return;
    diffSeededRef.current = true;
    if (difficultyLevelId) return;
    // Resolve a saved name string ("intermediate") to its Guid if possible.
    const fromName = (initial.difficultyName || '').toLowerCase();
    const matchByName = difficulties.find(d => (d.name || '').toLowerCase() === fromName);
    setDifficultyLevelId(matchByName?.id || pickDefaultDifficultyId(difficulties));
  }, [difficulties]); // eslint-disable-line react-hooks/exhaustive-deps

  // After mount, wire the tour. (Existing behavior — kept as-is.)
  useEffect(() => {
    if (typeof window.__mcqTourWire === 'function') window.__mcqTourWire();
  }, []);

  // Auth-fail handler used by every API touchpoint on the page.
  const authFail = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [navigate]);

  // Load subscription gate + saved user prefs in parallel on first mount.
  // Bypassed in demo mode (no userId / token).
  useEffect(() => {
    if (!userId) { setPackageReady(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const [pkg, user] = await Promise.all([
          ActivePackagebyuserid(userId),
          getUserById(userId),
        ]);
        if (cancelled) return;
        if (pkg?.status === 401 || user?.status === 401) { authFail(); return; }
        setActivePackage(pkg?.data || null);
        if (user?.data) {
          setSavedUser(user.data);
          // If user has saved programmingLevel/selectedCategoryIds, prefer
          // them over localStorage for cross-device continuity. Only seed
          // once and only when local state hasn't already been adjusted.
          if (!difficultyLevelId && user.data.programmingLevel) {
            setDifficultyLevelId(user.data.programmingLevel);
          }
          if ((!selectedIds || !selectedIds.length) && Array.isArray(user.data.selectedCategoryIds)) {
            setSelectedIds(user.data.selectedCategoryIds);
          }
        }
      } catch (_) {
        // Non-fatal — page still works, just without gating / saved prefs.
      } finally {
        if (!cancelled) setPackageReady(true);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Once categories for the chosen difficulty arrive, normalise the saved
  // selection: drop any IDs that no longer exist; if nothing is selected,
  // default to ALL (matches OLD UserMcqs behavior).
  const catsSeededRef = useRef(false);
  useEffect(() => {
    if (!categories.length) { catsSeededRef.current = false; return; }
    if (catsSeededRef.current) return;
    catsSeededRef.current = true;

    const idSet = new Set(categories.map(c => c.id));
    // If URL provided category names but not IDs, try to resolve them now.
    let resolvedIds = selectedIds.filter(id => idSet.has(id));
    if (!resolvedIds.length && Array.isArray(initial.categoryNames) && initial.categoryNames.length) {
      const nameToId = new Map(categories.map(c => [c.name, c.id]));
      resolvedIds = initial.categoryNames.map(n => nameToId.get(n)).filter(Boolean);
    }
    setSelectedIds(resolvedIds.length ? resolvedIds : categories.map(c => c.id));
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Whenever the difficulty changes, reset the category-seed flag so the
  // next category load can re-seed the selection from scratch.
  useEffect(() => { catsSeededRef.current = false; }, [difficultyLevelId]);

  // ── User-driven changes (auto-persist to server) ─────────────
  const persistUserPrefs = useCallback(async (nextLevel, nextCategoryIds) => {
    if (!userId || !savedUser) return; // demo / not loaded yet
    const body = {
      ...savedUser,
      programmingLevel: nextLevel,
      selectedCategoryIds: nextCategoryIds,
    };
    try { await UpdateUserById(userId, JSON.stringify(body)); }
    catch (_) { /* non-fatal */ }
  }, [userId, savedUser]);

  const handleDifficultyChange = useCallback((nextId) => {
    setDifficultyLevelId(nextId);
    setSelectedIds([]); // cascade reset, like OLD
    persistUserPrefs(nextId, []);
  }, [persistUserPrefs]);

  const handleSelectionChange = useCallback((nextNames) => {
    // Pills use names; translate back to IDs.
    const nameToId = new Map(categories.map(c => [c.name, c.id]));
    const nextIds = nextNames.map(n => nameToId.get(n)).filter(Boolean);
    setSelectedIds(nextIds);
    persistUserPrefs(difficultyLevelId, nextIds);
  }, [categories, difficultyLevelId, persistUserPrefs]);

  // Translate selectedIds back to names for the pill component
  const selectedNames = React.useMemo(() => {
    const idToName = new Map(categories.map(c => [c.id, c.name]));
    return selectedIds.map(id => idToName.get(id)).filter(Boolean);
  }, [selectedIds, categories]);

  // ── Start quiz ───────────────────────────────────────────────
  // Persist settings (with both IDs and friendly names) to localStorage and
  // navigate to the quiz page. Shared by the direct-entitled path and the
  // "continue with free questions" choice from the gate modal.
  const launchQuiz = useCallback(() => {
    const difficultyName = difficulties.find(d => d.id === difficultyLevelId)?.name || '';
    const settings = {
      difficultyLevelId,
      difficultyName,
      categoryIds: selectedIds,
      categoryNames: selectedNames,
      questionCount: count,
      // Package-only feature — never persist it as on for a free-only quiz,
      // even if the checkbox somehow carried a stale true through.
      skipCorrect: hasAllMcqAccess ? skipCorrect : false,
      source: urlParams?.source || null,
      // Drives free-only question filtering in useQuiz.js for users whose
      // package doesn't include full MCQ access.
      hasAllMcqAccess,
    };
    writeSettings(settings);
    setLaunching(true);
    setMsg('');
    safeRedirect(QUIZ_URL);
  }, [difficulties, difficultyLevelId, selectedIds, selectedNames, count, skipCorrect, hasAllMcqAccess, urlParams]);

  const handleStart = useCallback(async () => {
    if (loadingDiff || loadingCats || launching) return;
    if (!difficultyLevelId) { setMsg('Please choose a difficulty level.'); return; }
    if (!selectedIds.length) { setMsg('Please choose at least one category.'); return; }

    // Free-question gate. Users without full MCQ access don't get bounced
    // straight to /pricing anymore — they see how many free questions their
    // current selection has and can either take that free quiz or open the
    // package picker. Demo mode (no userId) is allowed through untouched.
    if (userId && packageReady && !hasAllMcqAccess) {
      setLaunching(true);
      let freeCount = 0;
      try {
        const res = await GetFreeQuestionCount(JSON.stringify({
          DifficultyLevelID: difficultyLevelId,
          CategoriesIds: selectedIds,
        }));
        if (res?.status === 200 && Number.isFinite(Number(res.data))) freeCount = Number(res.data);
      } catch (_) { /* fall through with freeCount 0 — treat as "unknown = none" */ }
      setLaunching(false);
      setGateInfo({ freeCount });
      return;
    }

    launchQuiz();
  }, [
    loadingDiff, loadingCats, launching, difficultyLevelId, selectedIds,
    userId, packageReady, hasAllMcqAccess, launchQuiz,
  ]);

  const closeGate       = useCallback(() => setGateInfo(null), []);
  const continueFreeQuiz = useCallback(() => { setGateInfo(null); launchQuiz(); }, [launchQuiz]);
  const openPackagePicker = useCallback(() => { setGateInfo(null); setPkgModalOpen(true); }, []);

  // FOUC guard
  if (!cssReady) {
    return <main className="main" id="main-content" role="main" style={{ visibility: 'hidden' }} />;
  }

  const loading = loadingDiff || loadingCats || (!!userId && !packageReady);

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

            <div className="ap-source-banner" id="apSourceBanner"
              hidden={!showAdaptiveBanner || undefined} role="note">
              <span className="ap-source-icon" aria-hidden="true">◈</span>
              Recommended by your Adaptive Practice plan — settings pre-filled for you. Adjust if needed, then start.
            </div>

            <div className="divider" />

            {error && (
              <div className="msg show" role="alert" style={{ marginBottom: 12 }}>{error}</div>
            )}

            <div className="form" aria-label="Filter form">
              <div className="filters-grid">

                <CategoryFilter
                  categories={categoryNames}
                  selected={selectedNames}
                  onChange={handleSelectionChange}
                  onInfo={setInfoKey}
                />

                <div className="right-stack">

                  <OptionsPanel
                    difficulties={difficulties}
                    difficultyLevelId={difficultyLevelId}
                    onDifficulty={handleDifficultyChange}
                    count={count}
                    onCount={setCount}
                    skipCorrect={skipCorrect}
                    onSkip={setSkipCorrect}
                    skipCorrectDisabled={packageReady && !hasAllMcqAccess}
                    onInfo={setInfoKey}
                  />

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

                </div>
              </div>

              {msg && (
                <div className="msg show" id="msg" role="status" aria-live="polite">{msg}</div>
              )}

              <div className="actions">
                <div className="actions-right">
                  <button
                    className="btn"
                    id="startQuiz"
                    ref={startBtnRef}
                    type="button"
                    disabled={loading || launching || !difficultyLevelId}
                    onClick={handleStart}
                  >
                    {launching ? 'Launching…' : loading ? 'Loading…' : 'Start Quiz'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        <aside className="mcq-rail" aria-label="MCQ details panels">

          <section className="window window-rail glow-follow" aria-label="Explanations">
            <InfoRail activeKey={infoKey} onClear={() => setInfoKey(null)} />
          </section>

          <section className="window window-rail window-palette glow-follow" aria-label="Selected settings">
            <SummaryRail
              categories={selectedNames}
              allCategories={categoryNames}
              difficulty={difficulties.find(d => d.id === difficultyLevelId)?.name || ''}
              count={count}
              skipCorrect={skipCorrect}
            />
          </section>

        </aside>
      </div>
    </div>
    </main>
    <McqTour tourState={tourState} />
    <FreeQuizGateModal
      open={!!gateInfo}
      freeCount={gateInfo?.freeCount || 0}
      requestedCount={count}
      onContinueFree={continueFreeQuiz}
      onGetPackage={openPackagePicker}
      onClose={closeGate}
    />
    <PackagePickerModal open={pkgModalOpen} onClose={() => setPkgModalOpen(false)} />
    </>
  );
}
