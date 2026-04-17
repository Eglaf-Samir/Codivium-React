// MenuPage — Exercise menu page
import { useState, useEffect, useMemo, useCallback } from 'react';
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
import HelpPanel from '../../components/HelpPanel.jsx';

const PREF_KEY = 'cv_menu_filters_v3';

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

      <HelpPanel />

      {conformShow && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
          }}
          onClick={handleCloseRunningCode}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              width: '90%',
              maxWidth: 520,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 28px 16px',
              borderBottom: '1px solid #eee',
              position: 'relative',
            }}>
              <h1 style={{ margin: 0, fontSize: 26, color: '#222' }}>Welcome Back!</h1>
              <button
                onClick={handleCloseRunningCode}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 28px' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: '#333', lineHeight: 1.6 }}>
                It looks like you have some unfinished work. Would you like to
                continue where you left off, or start fresh?
              </h3>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}>
              <button
                onClick={() => {
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
                style={{
                  height: 42,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '0 22px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#17a2b8',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Start fresh
              </button>
              <button
                onClick={() => {
                  setConformShow(false);
                  navigate(codingRoute, {
                    state: {
                      item: selectedItem,
                      initialTimeInSeconds: oldcodeinfo?.totalSeconds || 0,
                      isStartFresh: false,
                      useroldcode: oldcodeinfo?.lastUserCode || '',
                      totalRunCount: oldcodeinfo?.runCount || 0,
                    },
                  });
                }}
                style={{
                  height: 42,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '0 22px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#28a745',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Continue where I left off
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}
