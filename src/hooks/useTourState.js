// All tour state and lifecycle logic. No DOM side-effects.

import { useState, useEffect, useCallback } from 'react';
import { TOUR_STEPS } from '../pages/AdaptivePage/tour/tourSteps.js';

const TOUR_KEY    = 'cv_tour_completed';
const ONBOARD_KEY = 'cv_adaptive_onboarding';

function get(key, def = null) {
  try { const v = localStorage.getItem(key); return v !== null ? v : def; } catch (_) { return def; }
}
function set(key, val) { try { localStorage.setItem(key, val); } catch (_) {} }
function remove(key)   { try { localStorage.removeItem(key);  } catch (_) {} }

function hasCompleted() { return get(TOUR_KEY) === '1'; }

export function useTourState() {
  const [visible,     setVisible]     = useState(false);
  const [step,        setStep]        = useState(0);
  const [formAnswers, setFormAnswers] = useState({});
  const [videoKey,    setVideoKey]    = useState(null);

  const start = useCallback(() => {
    let saved = {};
    try { const raw = get(ONBOARD_KEY); if (raw) saved = JSON.parse(raw); } catch (_) {}
    setFormAnswers(saved);
    setStep(0);
    setVisible(true);
    document.body.classList.add('cv-tour-open');
  }, []);

  const dismiss = useCallback((completed = false) => {
    setVisible(false);
    document.body.classList.remove('cv-tour-open');
    set(TOUR_KEY, '1');
    if (completed) {
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('cv:tour-complete', { detail: {} }));
        const card = document.querySelector('.ap-orientation-card');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('cvt-orient-pulse');
          setTimeout(() => {
            card.classList.remove('cvt-orient-pulse');
            const firstBtn = card.querySelector('.ap-diag-opt:not(.selected)');
            if (firstBtn) firstBtn.focus();
          }, 800);
        }
      }, 450);
    }
  }, []);

  const next = useCallback(() => {
    setStep(s => {
      if (s >= TOUR_STEPS.length - 1) return s;
      return s + 1;
    });
  }, []);

  const back = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => dismiss(false), [dismiss]);

  const complete = useCallback(() => dismiss(true), [dismiss]);

  const answerForm = useCallback((question, value) => {
    setFormAnswers(prev => {
      const next = { ...prev, [question]: value };
      try { set(ONBOARD_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  const openVideo  = useCallback((key) => setVideoKey(key), []);
  const closeVideo = useCallback(() => setVideoKey(null), []);

  // Auto-start for first-time users (not yet completed/skipped)
  useEffect(() => {
    if (hasCompleted()) return;
    const t = setTimeout(() => start(), 900);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) return;
    function onKey(e) {
      if (e.key === 'Escape')                          { skip(); return; }
      if (e.key === 'ArrowLeft')                       { back(); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step === TOUR_STEPS.length - 1) complete();
        else next();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, step, skip, back, next, complete]);

  useEffect(() => {
    window.CodiviumTour = {
      start,
      dismiss: () => dismiss(false),
      isCompleted: hasCompleted,
      reset: () => { remove(TOUR_KEY); remove(ONBOARD_KEY); },
    };
  }, [start, dismiss]);

  useEffect(() => {
    function applyPref() {
      const btn = document.getElementById('cvTourTriggerBtn');
      if (!btn) return;
      const show = get('show_tour_btn') !== '0';
      btn.style.display = show ? '' : 'none';
      btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    applyPref();
    function onStorage(e) { if (e.key === 'show_tour_btn') applyPref(); }
    function onPref(e)    { if (e.detail?.key === 'show_tour_btn') applyPref(); }
    window.addEventListener('storage', onStorage);
    document.addEventListener('cv:pref-change', onPref);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('cv:pref-change', onPref);
    };
  }, []);

  useEffect(() => {
    const btn = document.getElementById('cvTourTriggerBtn');
    if (!btn || btn._cvTourBound) return;
    btn._cvTourBound = true;
    const handler = () => start();
    btn.addEventListener('click', handler);
    const show = get('show_tour_btn') !== '0';
    if (show && !btn._cvFlashDone) {
      btn._cvFlashDone = true;
      setTimeout(() => {
        btn.classList.add('cvt-flash');
        btn.addEventListener('animationend', () => btn.classList.remove('cvt-flash'), { once: true });
      }, 1200);
    }
    return () => { btn.removeEventListener('click', handler); btn._cvTourBound = false; };
  }, [start]);

  return {
    visible, step, formAnswers, videoKey,
    currentStep: TOUR_STEPS[step],
    totalSteps:  TOUR_STEPS.length,
    isLast:      step === TOUR_STEPS.length - 1,
    start, dismiss, next, back, skip, complete, answerForm, openVideo, closeVideo,
  };
}
