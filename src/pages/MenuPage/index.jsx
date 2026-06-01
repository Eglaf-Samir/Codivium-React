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
import PackagePickerModal from './PackagePickerModal.jsx';

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

// For optional refinement filters (SubCategory, Area): "All"/none → empty array
// (no filter) instead of every id. Sending all ids would wrongly exclude
// exercises that have no subcategory/area assigned.
function toOptionalIds(selected) {
  if (!selected || selected.includes('all') || selected.length === 0) {
    return [];
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
  const [pkgModalOpen, setPkgModalOpen] = useState(false);

  const saved = loadPrefs();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => saved.categoryIds || ['all']);
  const [selectedDifficultyIds, setSelectedDifficultyIds] = useState(() => saved.difficultyIds || ['all']);
  const [selectedCompletionIds, setSelectedCompletionIds] = useState(() => saved.completionIds || ['all']);
  const [selectedExerciseTypeIds, setSelectedExerciseTypeIds] = useState(() => saved.exerciseTypeIds || ['all']);
  const [selectedMentalModelIds, setSelectedMentalModelIds] = useState(() => saved.mentalModelIds || ['all']);
  const [selectedAreaIds, setSelectedAreaIds] = useState(() => saved.areaIds || ['all']);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState(() => saved.subCategoryIds || ['all']);
  const [sortOrder, setSortOrder] = useState(() => saved.sortOrder || 'ASC');
  const [sortField, setSortField] = useState(() => saved.sortField || 'title');
  const [isFreeFirst, setIsFreeFirst] = useState(() => !!saved.freeFirst);
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
    exerciseTypeOptions,
    mentalModelOptions,
    areaOptions,
    subCategoryOptions,
    loadSubCategories,
    completionOptions,
    runFilter,
    optionsReady,
  } = useMenuData();

  // Resolved category ids the subcategory filter should reflect: the selected
  // categories, or all categories when none are picked ("All"). SubCategory is
  // category-dependent — it only shows subcategories of these categories.
  const resolvedCategoryIds = useMemo(
    () => toBackendIds(selectedCategoryIds, categoryOptions),
    [selectedCategoryIds, categoryOptions],
  );

  useEffect(() => {
    if (!optionsReady || !isMicro) return;
    loadSubCategories(resolvedCategoryIds);
  }, [resolvedCategoryIds, optionsReady, isMicro, loadSubCategories]);

  const filterBody = useMemo(
    () => ({
      DifficultyLabels: toBackendIds(selectedDifficultyIds, difficultyOptions),
      CategoryIds: toBackendIds(selectedCategoryIds, categoryOptions),
      SubCategoryIds: isMicro ? toOptionalIds(selectedSubCategoryIds) : [],
      CompletionIds: toBackendIds(selectedCompletionIds, completionOptions),
      ExerciseTypeIds: isMicro
        ? toBackendIds(selectedExerciseTypeIds, exerciseTypeOptions)
        : [],
      MentalModelIds: isMicro
        ? toBackendIds(selectedMentalModelIds, mentalModelOptions)
        : [],
      AreaIds: isMicro ? toOptionalIds(selectedAreaIds) : [],
      SortOrder: sortOrder,
    }),
    [
      selectedCategoryIds,
      selectedDifficultyIds,
      selectedCompletionIds,
      selectedExerciseTypeIds,
      selectedMentalModelIds,
      selectedAreaIds,
      selectedSubCategoryIds,
      sortOrder,
      categoryOptions,
      difficultyOptions,
      completionOptions,
      exerciseTypeOptions,
      mentalModelOptions,
      isMicro,
    ],
  );

  useEffect(() => {
    if (!optionsReady) return;
    // Backend ka mandatory check fail ho jata hai agar CategoryIds /
    // DifficultyLabels / CompletionIds empty bheje — wo empty list return
    // karta hai aur "No exercises" message dikhne lagta hai. Pehle saare
    // option arrays populate hone do, phir hi runFilter fire ho.
    if (
      filterBody.CategoryIds.length === 0 ||
      filterBody.DifficultyLabels.length === 0 ||
      filterBody.CompletionIds.length === 0
    ) {
      return;
    }
    runFilter(filterBody);
  }, [filterBody, runFilter, optionsReady]);

  const trackLabel =
    data?.trackLabel || (track === 'interview' ? 'Interview Questions Menu' : 'Micro Challenge Menu');
  const exercises = data?.exercises || [];

  const persist = useCallback(
    (next) => {
      savePrefs({
        categoryIds: selectedCategoryIds,
        difficultyIds: selectedDifficultyIds,
        completionIds: selectedCompletionIds,
        exerciseTypeIds: selectedExerciseTypeIds,
        mentalModelIds: selectedMentalModelIds,
        areaIds: selectedAreaIds,
        subCategoryIds: selectedSubCategoryIds,
        sortOrder,
        sortField,
        freeFirst: isFreeFirst,
        ...next,
      });
    },
    [
      selectedCategoryIds,
      selectedDifficultyIds,
      selectedCompletionIds,
      selectedExerciseTypeIds,
      selectedMentalModelIds,
      selectedAreaIds,
      selectedSubCategoryIds,
      sortOrder,
      sortField,
      isFreeFirst,
    ],
  );

  const updateFreeFirst = useCallback(
    (v) => {
      setIsFreeFirst(v);
      persist({ freeFirst: v });
    },
    [persist],
  );

  const toggleCategories = useCallback(
    (value, allOptions) => {
      setSelectedCategoryIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        // Category changed → its subcategories change too, so reset the
        // subcategory selection to "All" (stale picks no longer apply).
        persist({ categoryIds: next, subCategoryIds: ['all'] });
        return next;
      });
      setSelectedSubCategoryIds(['all']);
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

  const toggleExerciseTypes = useCallback(
    (value, allOptions) => {
      setSelectedExerciseTypeIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ exerciseTypeIds: next });
        return next;
      });
    },
    [persist],
  );

  const toggleMentalModels = useCallback(
    (value, allOptions) => {
      setSelectedMentalModelIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ mentalModelIds: next });
        return next;
      });
    },
    [persist],
  );

  const toggleAreas = useCallback(
    (value, allOptions) => {
      setSelectedAreaIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ areaIds: next });
        return next;
      });
    },
    [persist],
  );

  const toggleSubCategories = useCallback(
    (value, allOptions) => {
      setSelectedSubCategoryIds((prev) => {
        const next = toggleFilter(prev, value, allOptions);
        persist({ subCategoryIds: next });
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
    setSelectedExerciseTypeIds(['all']);
    setSelectedMentalModelIds(['all']);
    setSelectedAreaIds(['all']);
    setSelectedSubCategoryIds(['all']);
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

      // Access gate:
      //  • Free (isFree) questions open for everyone — even with no package.
      //  • Non-free questions need a package that grants all coding questions.
      //    If the user has no such package, show the package picker popup.
      const isFreeQuestion = !!(exercise.isFree ?? item.isFree ?? item.IsFree);
      const hasAllCoding = !!(
        activePackage?.isAccessToAllCodingQuestions ??
        activePackage?.IsAccessToAllCodingQuestions
      );
      if (!isFreeQuestion && !hasAllCoding) {
        // Remember what the user was trying to open so we can resume it after a
        // successful payment from the popup (see resume effect + PaymentSuccess).
        try {
          localStorage.setItem(
            'pendingExercise',
            JSON.stringify({ id: item.id ?? exercise.id, track }),
          );
        } catch (e) {}
        setPkgModalOpen(true);
        return;
      }

      if (item.isCoding === false) {
        navigate('/NonCoding', { state: { item } });
      } else {
        await checkAlreadyCodeAdd(item);
      }
    },
    [activePackage, checkAlreadyCodeAdd, location.pathname, location.search, navigate, track],
  );

  // Resume after payment: if the user bought from the popup, PaymentSuccess sends
  // them back to /menu. Once the list is loaded and they now have access, auto-open
  // the question they originally clicked.
  useEffect(() => {
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem('pendingExercise') || 'null'); } catch (e) {}
    if (!pending || pending.track !== track) return;
    if (!exercises || exercises.length === 0) return;

    const ex = exercises.find((e) => String(e.id) === String(pending.id));
    if (!ex) return;

    const hasAllCoding = !!(
      activePackage?.isAccessToAllCodingQuestions ??
      activePackage?.IsAccessToAllCodingQuestions
    );
    const isFree = !!(ex.isFree ?? ex.raw?.isFree);
    // Only resume once access is actually granted — avoids re-opening the popup.
    if (!isFree && !hasAllCoding) return;

    try { localStorage.removeItem('pendingExercise'); } catch (e) {}
    handleCardClick(ex);
  }, [exercises, activePackage, track, handleCardClick]);

  const handleCloseRunningCode = useCallback(() => {
    setConformShow(false);
    setSelectedItem(null);
    setOldcodeinfo(null);
  }, []);

  const filteredExercises = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = !q
      ? exercises
      : exercises.filter((ex) => {
          const n = (ex.name || '').toLowerCase();
          const d = (ex.shortDescription || '').toLowerCase();
          return n.includes(q) || d.includes(q);
        });

    // Client-side sort so ALL sort fields work (backend only sorts by title).
    const desc = sortOrder === 'DESC';
    const diffRank = (d) => {
      const x = (d || '').toLowerCase();
      if (x.startsWith('basic') || x.startsWith('begin')) return 1;
      if (x.startsWith('inter')) return 2;
      if (x.startsWith('adv')) return 3;
      return 99;
    };
    const compRank = (s) => {
      const x = (s || '').toLowerCase();
      if (x === 'not_started') return 0;
      if (x === 'attempted') return 1;
      if (x === 'completed') return 2;
      return 99;
    };

    return [...list].sort((a, b) => {
      // When enabled, free questions always float to the top; the chosen
      // sort still applies within the free and non-free groups.
      if (isFreeFirst) {
        const f = (b.isFree ? 1 : 0) - (a.isFree ? 1 : 0);
        if (f !== 0) return f;
      }
      let cmp = 0;
      switch (sortField) {
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '');
          break;
        case 'level':
          cmp = diffRank(a.difficulty) - diffRank(b.difficulty);
          break;
        case 'completeness':
          cmp = compRank(a.completionStatus) - compRank(b.completionStatus);
          break;
        case 'title':
        default:
          cmp = (a.name || '').localeCompare(b.name || '');
          break;
      }
      return desc ? -cmp : cmp;
    });
  }, [exercises, searchTerm, sortField, sortOrder, isFreeFirst]);

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
        exerciseTypes={exerciseTypeOptions}
        mentalModels={mentalModelOptions}
        areas={areaOptions}
        subCategories={subCategoryOptions}
        completionOptions={completionOptions}
        isMicro={isMicro}
        selectedCategories={selectedCategoryIds}
        selectedLevels={selectedDifficultyIds}
        selectedCompleteness={selectedCompletionIds}
        selectedExerciseTypes={selectedExerciseTypeIds}
        selectedMentalModels={selectedMentalModelIds}
        selectedAreas={selectedAreaIds}
        selectedSubCategories={selectedSubCategoryIds}
        sortField={sortField}
        sortDir={sortOrder === 'DESC' ? 'desc' : 'asc'}
        isFreeFirst={isFreeFirst}
        onToggleFreeFirst={updateFreeFirst}
        toggleCategories={toggleCategories}
        toggleLevels={toggleLevels}
        toggleCompleteness={toggleCompleteness}
        toggleExerciseTypes={toggleExerciseTypes}
        toggleMentalModels={toggleMentalModels}
        toggleAreas={toggleAreas}
        toggleSubCategories={toggleSubCategories}
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

      <PackagePickerModal
        open={pkgModalOpen}
        onClose={() => setPkgModalOpen(false)}
      />
    </main>
  );
}
