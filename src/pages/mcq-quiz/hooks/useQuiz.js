// hooks/useQuiz.js
//
// Quiz state machine for the user-facing MCQ flow. Phases: loading → active
// → summary. Question fetch now hits the real Code-Adept backend
// (`POST /api/v1/mcq/GetAllbyfilterAsync`) using the IDs the setup page
// saved, with an adapter that maps the McqQuestion shape into the flat
// `options[] + correctIndices[]` shape this UI was built on.
//
// On reaching `summary` the reducer triggers `postResults` once (guarded by
// a ref so re-renders or restart-mid-summary don't double-post). The body
// shape mirrors what Code-Adept-React's McqTest.jsx submits — that's what
// UserMCQDashboardUseCases parses for the dashboard.

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { pickFromDemo, DEMO_CATEGORIES } from '../utils/demoBank.js';
import { getToken } from '../../mcq-shared/fetch.js';
import { Getallmcqbyfilter, Createmcqtimelogs } from '../../../api/mcq/apimcq';
import {
  adaptBackendQuestions,
  buildResultsPayload,
} from '../../mcq-shared/mcqAdapters.js';

const CORRECT_KEY  = 'cv.mcq.correctIds';
const SETTINGS_KEY = 'cv.mcq.settings';

// Allow demo fallback only outside production. The Codivium docs and the
// user's policy explicitly say: in production, surface real failures rather
// than hide them behind sample questions.
const ALLOW_DEMO = (typeof import.meta !== 'undefined' && import.meta?.env?.MODE !== 'production')
  || (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production');

function readSet(key) {
  try { const r = localStorage.getItem(key); const a = r ? JSON.parse(r) : []; return new Set(Array.isArray(a) ? a : []); }
  catch(_) { return new Set(); }
}
function writeSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch(_) {}
}

const INIT = {
  phase:       'loading',  // loading | active | summary | error
  questions:   [],
  index:       0,
  locked:      false,
  answers:     [],
  correctCount: 0,
  peekCount:    0,
  correctSet:  new Set(),
  sessionId:   null,
  settings:    null,
  startedAt:   null,
  loadError:   null,
  tutorialOpen: false,
  tutorialViewedThisQ: false,
  peekWarning: false,
};

function reducer(state, action) {
  switch (action.type) {

    case 'LOAD_DONE':
      return {
        ...state,
        phase:      'active',
        questions:  action.questions,
        sessionId:  action.sessionId,
        settings:   action.settings,
        startedAt:  new Date().toISOString(),
        correctSet: readSet(CORRECT_KEY),
        loadError:  null,
        index: 0, locked: false,
        answers: [], correctCount: 0, peekCount: 0,
        tutorialOpen: false, tutorialViewedThisQ: false, peekWarning: false,
      };

    case 'LOAD_FAIL':
      return { ...state, phase: 'active', questions: action.questions, settings: action.settings,
        sessionId: null, startedAt: new Date().toISOString(),
        correctSet: readSet(CORRECT_KEY), loadError: action.error || null,
        index: 0, locked: false, answers: [], correctCount: 0, peekCount: 0 };

    case 'LOAD_ERROR':
      return { ...state, phase: 'error', loadError: action.error || 'Failed to load questions.', settings: action.settings };

    case 'SHOW_PEEK_WARNING':
      return { ...state, peekWarning: true };
    case 'HIDE_PEEK_WARNING':
      return { ...state, peekWarning: false };

    case 'TOGGLE_TUTORIAL':
      return { ...state, tutorialOpen: !state.tutorialOpen,
        tutorialViewedThisQ: !state.tutorialOpen ? true : state.tutorialViewedThisQ };

    case 'SUBMIT': {
      if (state.locked) return state;
      const q          = state.questions[state.index];
      const selected   = action.selected;
      const isPeek     = action.isPeek;
      const correctSet = new Set(q.correctIndices);
      const isCorrect  = !isPeek && selected.length === q.correctIndices.length &&
                         selected.every(i => correctSet.has(i));

      const answer = {
        q, selected, isPeek, isCorrect,
        tutorialViewed: state.tutorialViewedThisQ,
        submittedAt: new Date().toISOString(),
      };

      const newAnswers     = [...state.answers, answer];
      const newCorrect     = isCorrect ? state.correctCount + 1 : state.correctCount;
      const newPeek        = isPeek    ? state.peekCount + 1    : state.peekCount;
      const newCorrectSet  = new Set(state.correctSet);
      if (isCorrect) {
        q.correctIndices.forEach(i => newCorrectSet.add(q.id + '_' + i));
        writeSet(CORRECT_KEY, newCorrectSet);
      }

      return {
        ...state,
        locked: true, peekWarning: false,
        answers:      newAnswers,
        correctCount: newCorrect,
        peekCount:    newPeek,
        correctSet:   newCorrectSet,
        tutorialOpen: false,
      };
    }

    case 'ADVANCE': {
      if (state.index < state.questions.length - 1) {
        return { ...state, index: state.index + 1, locked: false,
          tutorialOpen: false, tutorialViewedThisQ: false, peekWarning: false };
      }
      return { ...state, phase: 'summary' };
    }

    case 'RESTART_DONE':
      return {
        ...state,
        phase:       'active',
        questions:   action.questions,
        sessionId:   action.sessionId || null,
        startedAt:   new Date().toISOString(),
        loadError:   null,
        index: 0, locked: false,
        answers: [], correctCount: 0, peekCount: 0,
        tutorialOpen: false, tutorialViewedThisQ: false, peekWarning: false,
      };

    default:
      return state;
  }
}

// Resolve the request body the backend expects from the settings the parent
// page wrote to localStorage. `difficultyLevelId` and `categoryIds` are
// Guid strings; backend's McqQuestionFilterReqest uses ints, but in practice
// Cosmos `McqQuestion.DifficultyLevel.Id` is whatever paramMaster stores
// (the same value `ParamMaster.Id` returns). We forward the values verbatim.
function buildFilterBody(settings, userId) {
  return {
    DifficultyLevelID: settings.difficultyLevelId || 0,
    CategoriesIds:     Array.isArray(settings.categoryIds) ? settings.categoryIds : [],
    NoOfQuestion:      Math.max(1, Math.min(50, Number(settings.questionCount) || 10)),
    isSkipPriviosAttempetedQuestions: !!settings.skipCorrect,  // typo matches backend DTO
    userId:            userId || '00000000-0000-0000-0000-000000000000',
  };
}

async function fetchQuestionsFromAPI(settings, externalSignal = null) {
  const token = getToken();
  const userId = typeof window !== 'undefined' ? localStorage.getItem('Userid') : '';

  // Demo / unauthenticated path.
  if (!token || !userId) {
    if (ALLOW_DEMO) return { sessionId: null, questions: pickFromDemo(settings), demo: true };
    return { sessionId: null, questions: [], error: 'Please log in to take a quiz.' };
  }

  try {
    const body = buildFilterBody(settings, userId);
    const res = await Getallmcqbyfilter(JSON.stringify(body));
    if (externalSignal?.aborted) return { sessionId: null, questions: [], error: 'cancelled' };
    if (!res) throw new Error('No response');
    if (res.status === 401) return { sessionId: null, questions: [], error: 'unauthorized', status: 401 };
    if (res.status !== 200 || !Array.isArray(res.data)) throw new Error('HTTP ' + (res.status || '?'));
    if (!res.data.length) return { sessionId: null, questions: [], error: 'No matching questions found.' };
    return { sessionId: null, questions: adaptBackendQuestions(res.data) };
  } catch (e) {
    if (ALLOW_DEMO) return { sessionId: null, questions: pickFromDemo(settings), demo: true };
    return { sessionId: null, questions: [], error: 'Failed to load questions. ' + (e?.message || '') };
  }
}

async function postQuizResults(state) {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('Userid') : '';
  if (!userId) return; // demo / unauthenticated — nothing to record

  // Compute total elapsed seconds from startedAt → now. The CvTimer keeps a
  // separate display value; the only source of truth at submit time is the
  // wall-clock delta.
  const startedAt = state.startedAt ? new Date(state.startedAt) : null;
  const totalSeconds = startedAt ? Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000)) : 0;

  const body = buildResultsPayload({ answers: state.answers, totalSeconds, userId });
  try {
    const res = await Createmcqtimelogs(body);
    if (res?.status === 401) {
      // Token expired mid-quiz. Quiet log; the page-level auth guard will
      // intercept on the next route nav. We don't surface a popup mid-summary.
      console.warn('[mcq] CreateMCQLog returned 401');
      return;
    }
    if (res?.status !== 200) {
      console.warn('[mcq] CreateMCQLog failed', res?.status);
    }
  } catch (e) {
    console.warn('[mcq] CreateMCQLog threw', e);
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const resultPostedRef = useRef(false);

  // Boot: load settings + fetch questions.
  useEffect(() => {
    let settings;
    try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch(_) {}

    // No saved settings = direct navigation / cleared storage. In dev we
    // drop into demo mode so the page is still inspectable; in prod we
    // bounce to the setup page rather than show a broken state.
    if (!settings || (!settings.difficultyLevelId && !Array.isArray(settings.categoryIds))) {
      if (ALLOW_DEMO) {
        settings = {
          categories:    DEMO_CATEGORIES,
          difficulty:    'basic',
          questionCount: 10,
          skipCorrect:   false,
          _isDemo:       true,
        };
      } else {
        // Production: hard-bounce to setup. Use replace so back-button works.
        if (typeof window !== 'undefined') window.location.replace('/mcq');
        return;
      }
    }

    const abortCtrl = new AbortController();
    let cancelled = false;
    fetchQuestionsFromAPI(settings, abortCtrl.signal).then((result) => {
      if (cancelled || abortCtrl.signal.aborted) return;
      const { sessionId, questions, error, demo } = result;
      const finalSettings = demo ? { ...settings, _isDemo: true } : settings;

      if (questions && questions.length) {
        dispatch({ type: 'LOAD_DONE', questions, sessionId, settings: finalSettings });
      } else if (ALLOW_DEMO) {
        // Last-ditch demo fallback in non-production environments.
        const demoQs = pickFromDemo({ ...settings, categories: DEMO_CATEGORIES });
        if (demoQs.length) {
          dispatch({ type: 'LOAD_DONE', questions: demoQs, sessionId: null, settings: { ...settings, _isDemo: true } });
        } else {
          dispatch({ type: 'LOAD_ERROR', error: error || 'No questions available.', settings });
        }
      } else {
        dispatch({ type: 'LOAD_ERROR', error: error || 'No questions available.', settings });
      }
    });
    return () => { cancelled = true; abortCtrl.abort(); };
  }, []);

  // When the quiz enters `summary`, post results exactly once.
  useEffect(() => {
    if (state.phase !== 'summary') return;
    if (resultPostedRef.current) return;
    resultPostedRef.current = true;
    postQuizResults(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const submit = useCallback((selected, isPeek = false) => {
    dispatch({ type: 'SUBMIT', selected, isPeek });
  }, []);

  const advance = useCallback(() => {
    dispatch({ type: 'ADVANCE' });
  }, []);

  const showPeekWarning = useCallback(() => dispatch({ type: 'SHOW_PEEK_WARNING' }), []);
  const hidePeekWarning = useCallback(() => dispatch({ type: 'HIDE_PEEK_WARNING' }), []);
  const toggleTutorial  = useCallback(() => dispatch({ type: 'TOGGLE_TUTORIAL' }), []);

  const restartAbortRef = useRef(null);

  const restart = useCallback(() => {
    const settings = state.settings;
    if (!settings) return;
    restartAbortRef.current?.abort();
    const ctrl = new AbortController();
    restartAbortRef.current = ctrl;
    // Allow a fresh result-post on the next summary.
    resultPostedRef.current = false;
    fetchQuestionsFromAPI(settings, ctrl.signal).then(({ sessionId, questions }) => {
      if (ctrl.signal.aborted) return;
      if (questions && questions.length) {
        dispatch({ type: 'RESTART_DONE', questions, sessionId });
      }
    });
  }, [state.settings]);

  return { state, submit, advance, showPeekWarning, hidePeekWarning, toggleTutorial, restart };
}
