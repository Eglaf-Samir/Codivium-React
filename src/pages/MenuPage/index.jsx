// MenuPage — Exercise menu page
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import { useMenuData } from '../../hooks/useMenuData.js';
import { toggleFilter } from '../../hooks/useMenuFilters.js';
import { ActivePackagebyuserid } from '../../api/pricepackage/apipackage';
import { GetInterviewPreparationSession } from '../../api/interviewprepration/apiinterviewprepration';
import { GetDeliberatePracticeSession } from '../../api/deliberatePractice/apideliberatepractice';

import MenuHeader from './MenuHeader.jsx';
import FilterDrawer from './FilterDrawer.jsx';
import ExerciseGrid from './ExerciseGrid.jsx';
import MenuTour from './MenuTour.jsx';

const PREF_KEY = 'cv_menu_filters_v3';

function fmtMmss(s) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function WelcomeBackModal({ item, oldcodeinfo, onClose, onStartFresh, onContinue }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    let raf = null, lastE = null;
    const onMove = (e) => {
      lastE = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (!lastE) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((lastE.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((lastE.clientY - r.top) / r.height) * 100}%`);
      });
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const runCount = oldcodeinfo?.runCount ?? 0;
  const spent = oldcodeinfo?.totalSeconds ?? 0;
  const exerciseName = item?.name || item?.title || 'Exercise';
  const category = item?.categoryName || item?.category || '';
  const difficulty = item?.difficultyLabel || item?.difficulty || '';
  const difficultyLabel = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    : '';

  return (
    <div
      className="fb-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome back"
      onClick={onClose}
    >
      <div className="fb-backdrop" aria-hidden="true" />
      <div className="fb-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <header className="fb-head">
          <div className="fb-title">
            <div className="fb-seal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4l3 2M21 12a9 9 0 1 1-9-9"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="fb-hgroup">
              <div className="fb-kicker">Welcome back</div>
              <h2 className="fb-exercise-name" title={exerciseName}>{exerciseName}</h2>
              <div className="fb-pills">
                {category && <span className="fb-pill cat">{category}</span>}
                {difficultyLabel && <span className="fb-pill level">{difficultyLabel}</span>}
                <span className="fb-pill tests">Runs: {runCount}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="fb-body">
          <aside className="fb-insight" aria-label="Unfinished session">
            <h3>Pick up where you left off</h3>
            <p>
              You already made {runCount} {runCount === 1 ? 'run' : 'runs'}
              {spent > 0 ? ` over ${fmtMmss(spent)}` : ''} on this exercise.
              Continue from your last saved code, or start fresh with a clean slate.
            </p>
          </aside>
        </div>

        <footer className="fb-foot">
          <div className="fb-foot-left">
            <div className="fb-stamp">
              <strong>Codivium</strong> &mdash; Resume or restart
            </div>
          </div>
          <div className="fb-foot-actions">
            <button className="fb-btn ghost" type="button" onClick={onStartFresh}>
              Start Fresh
            </button>
            <button className="fb-btn gold" type="button" onClick={onContinue}>
              Continue Where I Left Off
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch (_) {}
}

function toBackendIds(selected, options) {
  const allIds = (options || []).map((o) => o.id);
  if (!selected || selected.includes('all') || selected.length === 0) {
    return allIds;
  }
  return selected.filter((v) => v !== 'all');
}

export default function MenuPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlTrack = (new URLSearchParams(location.search).get('track') || 'micro').toLowerCase();
  const track = urlTrack;
  const isMicro = track === 'micro';
  const returnUrl = `/menu?track=${encodeURIComponent(track)}`;
  const codingRoute = track === 'interview' ? '/interview/CodingQue' : '/DeliberatePractice/CodingQue';

  const [activePackage, setActivePackage] = useState(null);
  const [oldcodeinfo, setOldcodeinfo] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [conformShow, setConformShow] = useState(false);

  const saved = loadPrefs();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => saved.categoryIds || ['all']);
  const [selectedDifficultyIds, setSelectedDifficultyIds] = useState(() => saved.difficultyIds || ['all']);
  const [selectedCompletionIds, setSelectedCompletionIds] = useState(() => saved.completionIds || ['all']);
  const [sortOrder, setSortOrder] = useState(() => saved.sortOrder || 'ASC');
  const [sortField, setSortField] = useState(() => saved.sortField || 'title');
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  const {
    data,
    loading,
    error,
    reload,
    categoryOptions,
    difficultyOptions,
    completionOptions,
    runFilter,
  } = useMenuData();

  const filterBody = useMemo(
    () => ({
      DifficultyLabels: toBackendIds(selectedDifficultyIds, difficultyOptions),
      CategoryIds: toBackendIds(selectedCategoryIds, categoryOptions),
      SubCategoryIds: [],
      CompletionIds: toBackendIds(selectedCompletionIds, completionOptions),
      SortOrder: sortOrder,
    }),
    [
      selectedCategoryIds,
      selectedDifficultyIds,
      selectedCompletionIds,
      sortOrder,
      categoryOptions,
      difficultyOptions,
      completionOptions,
    ],
  );

  useEffect(() => {
    runFilter(filterBody);
  }, [filterBody, runFilter]);

  const trackLabel =
    data?.trackLabel || (track === 'interview' ? 'Interview Questions Menu' : 'Micro Challenge Menu');
  const exercises = data?.exercises || [];

  const persist = useCallback(
    (next) => {
      savePrefs({
        categoryIds: selectedCategoryIds,
        difficultyIds: selectedDifficultyIds,
        completionIds: selectedCompletionIds,
        sortOrder,
        sortField,
        ...next,
      });
    },
    [selectedCategoryIds, selectedDifficultyIds, selectedCompletionIds, sortOrder, sortField],
  );

  const toggleCategories = useCallback(
    (value, allOptions) => {
      setSelectedCategoryIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ categoryIds: next });
        return next;
      });
    },
    [persist],
  );

  const toggleLevels = useCallback(
    (value, allOptions) => {
      setSelectedDifficultyIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ difficultyIds: next });
        return next;
      });
    },
    [persist],
  );

  const toggleCompleteness = useCallback(
    (value, allOptions) => {
      setSelectedCompletionIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ completionIds: next });
        return next;
      });
    },
    [persist],
  );

  const updateSortField = useCallback(
    (v) => {
      setSortField(v);
      persist({ sortField: v });
    },
    [persist],
  );

  const updateSortDir = useCallback(
    (v) => {
      const next = v === 'desc' ? 'DESC' : 'ASC';
      setSortOrder(next);
      persist({ sortOrder: next });
    },
    [persist],
  );

  const resetFilters = useCallback(() => {
    setSelectedCategoryIds(['all']);
    setSelectedDifficultyIds(['all']);
    setSelectedCompletionIds(['all']);
    setSortOrder('ASC');
    setSortField('title');
    savePrefs({});
  }, []);

  useEffect(() => {
    const Userid = localStorage.getItem('Userid');
    if (!Userid) {
      setActivePackage(null);
      return;
    }
    (async () => {
      try {
        const res = await ActivePackagebyuserid(Userid);
        if (res && res.status === 200) setActivePackage(res.data);
        else if (res && res.status === 401) {
          localStorage.clear();
          navigate('/login');
        } else setActivePackage(null);
      } catch (err) {
        console.error('Failed to get active package', err);
        setActivePackage(null);
      }
    })();
  }, [navigate]);

  const navigateFresh = useCallback(
    (item) => {
      navigate(codingRoute, {
        state: {
          item,
          oldcode: null,
          isStartFresh: true,
          initialTimeInSeconds: 0,
        },
      });
    },
    [navigate, codingRoute],
  );

  const checkAlreadyCodeAdd = useCallback(
    async (item) => {
      const Userid = localStorage.getItem('Userid');
      console.log('[MenuPage] checkAlreadyCodeAdd item:', item);
      setOldcodeinfo(null);
      if (!item?.isSubmitted) {
        console.log('[MenuPage] item not submitted → fresh navigate');
        navigateFresh(item);
        return;
      }
      try {
        const sessionApi =
          track === 'interview'
            ? GetInterviewPreparationSession
            : GetDeliberatePracticeSession;
        const result = await sessionApi(Userid, item.id);
        console.log('[MenuPage] session result:', result);
        if (result && result.data && result.status === 200) {
          setOldcodeinfo(result.data);
          setSelectedItem(item);
          setConformShow(true);
        } else {
          navigateFresh(item);
        }
      } catch (err) {
        console.error('checkAlreadyCodeAdd failed', err);
        navigateFresh(item);
      }
    },
    [navigateFresh, track],
  );

  const handleCardClick = useCallback(
    async (exercise) => {
      const item = exercise.raw || exercise;
      console.log('[MenuPage] card clicked, item:', item, 'activePackage:', activePackage);
      if (!activePackage) {
        const result = await Swal.fire({
          title: 'Purchase Package?',
          text: 'Please purchase package',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'OK !',
          cancelButtonText: 'No, cancel!',
          reverseButtons: true,
        });
        if (result.isConfirmed) {
          localStorage.setItem('gotopage', location.pathname + location.search);
          navigate('/price');
        }
        return;
      }
      if (item.isCoding === false) {
        navigate('/NonCoding', { state: { item } });
      } else {
        await checkAlreadyCodeAdd(item);
      }
    },
    [activePackage, checkAlreadyCodeAdd, location.pathname, location.search, navigate],
  );

  const handleCloseRunningCode = useCallback(() => {
    setConformShow(false);
    setSelectedItem(null);
    setOldcodeinfo(null);
  }, []);

  const filteredExercises = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => {
      const n = (ex.name || '').toLowerCase();
      const d = (ex.shortDescription || '').toLowerCase();
      return n.includes(q) || d.includes(q);
    });
  }, [exercises, searchTerm]);

  useEffect(() => {
    if (trackLabel) document.body.dataset.page = trackLabel;
  }, [trackLabel]);

  useEffect(() => {
    const placeholder = document.getElementById('menu-react-root-loading');
    if (placeholder) placeholder.remove();
  }, []);

  useEffect(() => {
    function preventHash(e) {
      const a = e.target.closest?.('a[href="#"]');
      if (a) e.preventDefault();
    }
    document.addEventListener('click', preventHash);
    return () => document.removeEventListener('click', preventHash);
  }, []);

  return (
    <main id="main-content" className="main stage" role="main">
      <FilterDrawer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        categories={categoryOptions}
        difficultyLevels={difficultyOptions}
        exerciseTypes={[]}
        mentalModels={[]}
        completionOptions={completionOptions}
        isMicro={isMicro}
        selectedCategories={selectedCategoryIds}
        selectedLevels={selectedDifficultyIds}
        selectedCompleteness={selectedCompletionIds}
        selectedExerciseTypes={['all']}
        selectedMentalModels={['all']}
        sortField={sortField}
        sortDir={sortOrder === 'DESC' ? 'desc' : 'asc'}
        toggleCategories={toggleCategories}
        toggleLevels={toggleLevels}
        toggleCompleteness={toggleCompleteness}
        toggleExerciseTypes={() => {}}
        toggleMentalModels={() => {}}
        updateSortField={updateSortField}
        updateSortDir={updateSortDir}
        onReset={resetFilters}
      />

      <div className="stage-shell">
        <div className="watermarks" aria-hidden="true">
          <div className="word watermark-word wm1" data-text="CODIVIUM">CODIVIUM</div>
        </div>

        <MenuHeader
          trackLabel={trackLabel}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onTourStart={() => setTourActive(true)}
        />

        <div className="grid-scroll" id="gridScroll" aria-label="Scrollable exercise grid">
          <section className="exercise-grid" aria-label="Exercise menu grid">
            <ExerciseGrid
              exercises={filteredExercises}
              totalCount={exercises.length}
              loading={loading}
              error={error}
              onRetry={reload}
              returnUrl={returnUrl}
              onCardClick={handleCardClick}
            />
          </section>
        </div>
      </div>

      <MenuTour active={tourActive} onStop={() => setTourActive(false)} />

      {conformShow && createPortal(
        <WelcomeBackModal
          item={selectedItem}
          oldcodeinfo={oldcodeinfo}
          onClose={handleCloseRunningCode}
          onStartFresh={() => {
            setConformShow(false);
            navigate(codingRoute, {
              state: {
                item: selectedItem,
                isStartFresh: true,
                initialTimeInSeconds: 0,
                useroldcode: '',
              },
            });
          }}
          onContinue={() => {
            setConformShow(false);
            const info = oldcodeinfo || {};
            const savedCode =
              info.lastUserCode ??
              info.LastUserCode ??
              info.userCode ??
              info.UserCode ??
              info.code ??
              info.Code ??
              '';
            const savedSecs =
              info.totalSeconds ?? info.TotalSeconds ?? 0;
            const savedRuns =
              info.runCount ?? info.RunCount ?? 0;
            navigate(codingRoute, {
              state: {
                item: selectedItem,
                initialTimeInSeconds: savedSecs,
                isStartFresh: false,
                useroldcode: savedCode,
                totalRunCount: savedRuns,
              },
            });
          }}
        />,
        document.body,
      )}
    </main>
  );
}
