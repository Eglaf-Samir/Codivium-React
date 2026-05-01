// hooks/useQuiz.js
// Quiz state machine using useReducer.
// States: loading → active → summary

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { pickFromDemo, DEMO_CATEGORIES } from '../utils/demoBank.js';
import { getToken, apiUrl} from '../../mcq-shared/fetch.js';

const CORRECT_KEY  = 'cv.mcq.correctIds';
const SETTINGS_KEY = 'cv.mcq.settings';

function readSet(key) {
  try { const r = localStorage.getItem(key); const a = r ? JSON.parse(r) : []; return new Set(Array.isArray(a) ? a : []); }
  catch(_) { return new Set(); }
}
function writeSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch(_) {}
}

const INIT = {
  phase:       'loading',  // loading | active | summary
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
        index: 0, locked: false,
        answers: [], correctCount: 0, peekCount: 0,
        tutorialOpen: false, tutorialViewedThisQ: false, peekWarning: false,
      };

    case 'LOAD_FAIL':
      return { ...state, phase: 'active', questions: action.questions, settings: action.settings,
        sessionId: null, startedAt: new Date().toISOString(),
        correctSet: readSet(CORRECT_KEY),
        index: 0, locked: false, answers: [], correctCount: 0, peekCount: 0 };

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
      const selSet     = new Set(selected);
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
        index: 0, locked: false,
        answers: [], correctCount: 0, peekCount: 0,
        tutorialOpen: false, tutorialViewedThisQ: false, peekWarning: false,
      };

    default:
      return state;
  }
}

async function fetchQuestionsFromAPI(settings, externalSignal = null) {
  const token = getToken();

  if (!token) {
    return { sessionId: null, questions: pickFromDemo(settings) };
  }

  const params = new URLSearchParams({
    categories:  (settings.categories || []).join(','),
    difficulty:  settings.difficulty || 'basic',
    count:       String(settings.questionCount || 10),
    skipCorrect: settings.skipCorrect ? 'true' : 'false',
  });

  // Use an external abort signal if provided (from useEffect cleanup), or
  // create a local timeout-only controller.
  let ctrl, tid;
  if (externalSignal) {
    ctrl = null;
    tid  = null;
  } else {
    ctrl = new AbortController();
    tid  = setTimeout(() => ctrl.abort(), 5000);
  }
  const signal = externalSignal || ctrl.signal;
  try {
    const res = await fetch(apiUrl('/api/mcq/questions?' + params), {
      signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (tid) clearTimeout(tid);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.questions) || !data.questions.length) throw new Error('Empty');
    return { sessionId: data.sessionId || null, questions: data.questions };
  } catch (_) {
    if (tid) clearTimeout(tid);
    return { sessionId: null, questions: pickFromDemo(settings) };
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(reducer, INIT);

  // Boot: load settings + fetch questions
  useEffect(() => {
    let settings;
    try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch(_) {}

    // If no settings (direct navigation / cleared storage), use demo defaults
    // rather than bouncing back to the parent page
    if (!settings) {
      settings = {
        categories:    DEMO_CATEGORIES,
        difficulty:    'basic',
        questionCount: 10,
        skipCorrect:   false,
        _isDemo:       true,   // flag so we can show a "demo mode" banner
      };
    }

    const abortCtrl = new AbortController();
    let cancelled = false;
    fetchQuestionsFromAPI(settings, abortCtrl.signal).then(({ sessionId, questions }) => {
      if (cancelled) return;
      // If the filtered demo bank returned nothing, fall back to the full bank
      const finalQuestions = (questions && questions.length)
        ? questions
        : pickFromDemo({ ...settings, categories: DEMO_CATEGORIES });

      if (!finalQuestions || !finalQuestions.length) {
        dispatch({ type: 'LOAD_FAIL', questions: [], settings });
      } else {
        dispatch({ type: 'LOAD_DONE', questions: finalQuestions, sessionId, settings });
      }
    });
    return () => { cancelled = true; abortCtrl.abort(); };
  }, []);

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
    // Abort any previous in-flight restart fetch
    restartAbortRef.current?.abort();
    const ctrl = new AbortController();
    restartAbortRef.current = ctrl;
    fetchQuestionsFromAPI(settings, ctrl.signal).then(({ sessionId, questions }) => {
      if (ctrl.signal.aborted) return;
      dispatch({ type: 'RESTART_DONE', questions, sessionId });
    });
  }, [state.settings]);

  return { state, submit, advance, showPeekWarning, hidePeekWarning, toggleTutorial, restart };
}
