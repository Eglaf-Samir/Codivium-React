// src/shared/McqTour.jsx
// MCQ guided tour — React port of mcq-tour.js.
// Works across both mcq-parent.html and mcq-quiz.html via sessionStorage.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'cv.mcqTour';

export const PARENT_STEPS = [
  { selector: null,                                    title: 'MCQ Quiz Setup — Overview',       body: 'This page lets you configure a Multiple Choice Quiz before starting.\n\nUse the filters on the left to choose which topics to be tested on, set the difficulty level and number of questions, then hit Start Quiz.\n\nThis tour walks through every part of the page.' },
  { selector: '#tabSimple, #tabPower',                 title: 'Simple / Power Filter',           body: 'Two modes for selecting categories.\n\nSimple Filter shows all categories as clickable pills — tap one to toggle it on or off.\n\nPower Filter is faster when you know what you want: type to search, matching categories are highlighted, press Enter to select all matches at once.' },
  { selector: '#catTabSimple',                         title: 'Category Pills (Simple Mode)',    body: 'Each pill is a topic category. Tap any pill to include it in your quiz.\n\nUse the search box above to filter by name. Use Select All or Clear to change all at once.\n\nYour selection is reflected live in the Selected Settings panel on the right.' },
  { selector: '#catTabPower',                          title: 'Power Filter',                    body: 'Type a keyword to search categories — matching items are highlighted in the list below.\n\nPress Enter to instantly select every match. Click the browse arrow (▾) to see all categories.\n\nUseful when you know the exact topic you want, or want to select a group of related topics by keyword.' },
  { selector: '.cat-meta',                             title: 'Selection Summary & View Toggle', body: 'Shows how many categories are currently selected.\n\nThe All / Selected toggle changes what you see in the list — it does not affect your selection. Switch to Selected to review only what you have chosen.\n\nClear removes all selected categories in one step.' },
  { selector: '.togglebar',                            title: 'Difficulty Level',                body: 'Choose the challenge level for your quiz.\n\nBasic covers fundamentals and core concepts.\nIntermediate introduces multi-step reasoning and common patterns.\nAdvanced targets harder edge-cases and deeper understanding.\n\nTip: stick to one difficulty while practising a topic, then move up when you are consistently strong.' },
  { selector: '.range-wrap',                           title: 'Number of Questions',             body: 'Drag the slider to choose how many questions your quiz will contain — anywhere from 10 to 50.\n\nUse the Min or Max buttons for one-tap presets.\n\nThe selected count is shown in the display above the slider and updated live in the Selected Settings panel.' },
  { selector: '.checkline',                            title: 'Exclude Previously Correct',      body: 'When enabled, the quiz skips questions you have already answered correctly in previous sessions.\n\nThis keeps your practice focused on areas where you still have gaps, rather than repeating questions you have already mastered.' },
  { selector: '.panel-quickguide',                     title: 'Quick Start Guide',               body: 'A concise reminder of the steps needed to start a quiz.\n\nEach step has a small ⓘ button — click it to read a detailed explanation in the Info panel on the right.\n\nThe final step flashes the Start Quiz button so you can find it quickly.' },
  { selector: ".window-rail[aria-label='Explanations']", title: 'Info / Explanations Panel',    body: 'Click any ⓘ button on the page and a clear explanation appears here.\n\nUse this panel to understand what each setting does before you make a choice. The × button clears the panel when you are done reading.' },
  { selector: '.window-palette',                       title: 'Selected Settings Panel',         body: 'A live summary of everything you have configured.\n\nShows the chosen difficulty (as a visual ladder), the number of questions, the categories you have selected (as pills), and whether the exclude-correct setting is active.\n\nThe green Ready indicator lights up when you have at least one category selected and the quiz is ready to start.' },
  { selector: '#startQuiz',                            title: 'Start Quiz',                      body: 'When you are happy with your settings, press Start Quiz.\n\nYour settings are saved automatically, so the next time you visit this page they will still be selected.\n\nThe next step of this tour continues on the quiz page itself.' },
];

export const QUESTION_STEPS = [
  { selector: null,                                               title: 'Quiz Page — Overview',  body: 'This is where each question is presented during your quiz.\n\nYou will see the question text, up to six answer options, your progress through the quiz, and a timer.\n\nThis tour walks through every element on the page.' },
  { selector: '#mcqQuestionText, .question-text',                 title: 'Question',              body: 'The question is displayed here. Read it carefully before selecting an answer.\n\nQuestions are drawn from the categories and difficulty level you chose on the setup page.' },
  { selector: '#mcqOptions, .options-list',                       title: 'Answer Options',        body: 'Up to six options are presented for each question. Most questions have one correct answer — select it and move on.\n\nSome questions have multiple correct answers. When that is the case, the question will say so. Select all the options that apply before submitting.\n\nOnce you submit, immediate feedback is shown — correct answers are highlighted green, incorrect answers red, and the correct answer is revealed if you were wrong.' },
  { selector: '#mcqProgress, .progress-bar',                      title: 'Progress',              body: 'Shows how far through the quiz you are — for example, Question 3 of 10.\n\nA progress bar gives a visual indication of completion. Your score so far is also shown.' },
  { selector: '#mcqTimer, .quiz-timer',                           title: 'Timer',                 body: 'Tracks how long you have been working on the current question and the quiz overall.\n\nThere is no time limit — the timer is informational only, helping you track your pace.' },
  { selector: '#mcqNextBtn, .next-question-btn',                  title: 'Next Question',         body: 'After selecting an answer, press Next to move to the following question.\n\nOn the final question, this button becomes Finish Quiz and takes you to your results summary.' },
  { selector: '#mcqExitBtn, .exit-quiz-btn',                      title: 'Exit Quiz',             body: 'Returns you to the setup page at any time.\n\nYour progress on the current quiz session will be lost if you exit early, but your historical scores and settings are always preserved.' },
  { selector: null,                                               title: 'Tour Complete',         body: 'That covers everything on the MCQ pages.\n\nGo back to the setup page whenever you are ready to start a quiz — your previous settings will still be waiting for you.\n\nGood luck!' },
];

const PARENT_COUNT = PARENT_STEPS.length;

function saveState(idx) { try { sessionStorage.setItem(STORAGE_KEY, String(idx)); } catch (_) {} }
function loadState()    { try { return parseInt(sessionStorage.getItem(STORAGE_KEY) || '-1', 10); } catch (_) { return -1; } }
function clearState()   { try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {} }

function getTarget(sel) {
  if (!sel) return null;
  for (const s of sel.split(',')) {
    try { const el = document.querySelector(s.trim()); if (el) return el; } catch (_) {}
  }
  return null;
}

function spotlightStyle(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect(), pad = 8;
  return { position:'fixed', left:r.left-pad, top:r.top-pad, width:r.width+pad*2, height:r.height+pad*2,
    zIndex:9001, outline:'3px solid rgba(246,213,138,0.75)', borderRadius:4,
    boxShadow:'0 0 0 9999px rgba(0,0,0,0.55)', pointerEvents:'none' };
}

function cardPosition(targetEl) {
  const cw=560, ch=240, vw=window.innerWidth, vh=window.innerHeight;
  let left = Math.round(vw/2 - cw/2), top = Math.round(vh/2 - ch/2);
  if (targetEl) {
    const r = targetEl.getBoundingClientRect();
    const clampL = l => Math.max(12, Math.min(vw-cw-12, l));
    if (r.bottom+16+ch < vh)      { top=r.bottom+16; left=clampL(r.left); }
    else if (r.top-ch-16 > 0)    { top=r.top-ch-16; left=clampL(r.left); }
  }
  return { position:'fixed', left, top, width:cw, zIndex:9002 };
}

export function useMcqTour({ onParent = true } = {}) {
  const [active, setActive] = useState(false);
  const [idx,    setIdx]    = useState(0);
  const [rect,   setRect]   = useState(null);

  const steps      = onParent ? PARENT_STEPS : QUESTION_STEPS;
  const localIdx   = onParent ? idx : idx - PARENT_COUNT;
  const totalLocal = steps.length;

  function updateRect(i) {
    const localI = onParent ? i : i - PARENT_COUNT;
    const sel = steps[Math.max(0, Math.min(localI, steps.length-1))]?.selector;
    requestAnimationFrame(() => {
      const el = getTarget(sel);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
      setRect(el ? el.getBoundingClientRect() : null);
    });
  }

  const start = useCallback(() => {
    const startIdx = 0;
    setIdx(startIdx); saveState(startIdx); setActive(true);
    updateRect(startIdx);
  }, []);

  const end = useCallback(() => {
    setActive(false); clearState();
    if (!onParent) window.location.href = 'mcq-parent.html';
  }, [onParent]);

  const next = useCallback(() => {
    // Last step on parent → navigate to quiz page
    if (onParent && localIdx === PARENT_COUNT - 1) {
      saveState(PARENT_COUNT);
      window.location.href = window.__CODIVIUM_MCQ_QUIZ_URL__ || 'mcq-quiz.html';
      return;
    }
    const maxIdx = onParent ? PARENT_COUNT - 1 : PARENT_COUNT + QUESTION_STEPS.length - 1;
    if (idx >= maxIdx) { end(); return; }
    const ni = idx + 1; setIdx(ni); saveState(ni); updateRect(ni);
  }, [idx, localIdx, onParent, end]);

  const prev = useCallback(() => {
    if (localIdx <= 0) return;
    const pi = idx - 1; setIdx(pi); saveState(pi); updateRect(pi);
  }, [idx, localIdx]);

  // Resume on quiz page if sessionStorage has a state
  useEffect(() => {
    if (onParent) return;
    const saved = loadState();
    if (saved >= PARENT_COUNT) {
      setIdx(saved); setActive(true); updateRect(saved);
    }
  }, [onParent]);

  // Escape key
  useEffect(() => {
    if (!active) return;
    const onKey = e => { if (e.key === 'Escape') end(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, end]);

  // Expose for external callers
  useEffect(() => {
    window.__mcqTourStart = start;
  }, [start]);

  const currentStep = steps[Math.max(0, Math.min(localIdx, steps.length-1))];
  const targetEl    = active ? getTarget(currentStep?.selector) : null;

  return { active, step: localIdx, total: totalLocal, title: currentStep?.title,
    body: currentStep?.body, idx, onParent,
    isLastOnParent: onParent && localIdx === PARENT_COUNT - 1,
    isLast: localIdx >= totalLocal - 1,
    targetEl, start, end, next, prev };
}

export default function McqTour({ tourState }) {
  const { active, step, total, title, body, isLast, isLastOnParent, onParent, targetEl, end, next, prev } = tourState;
  if (!active) return null;

  const spot = spotlightStyle(targetEl);
  const cardPos = cardPosition(targetEl);

  return createPortal(
    <>
      <div className="ciTourBackdrop" id="mcqTourBackdrop" />
      {spot && <div className="ciTourSpotlight" id="mcqTourSpotlight" style={spot} />}
      <div className="ciTourCard" id="mcqTourCard" role="dialog" aria-modal="true"
        aria-labelledby="mcqTourCardTitle" tabIndex={-1} style={cardPos}>
        <div className="ciTourCardHead">
          <div>
            <div className="ciTourCardTitle" id="mcqTourCardTitle">{title}</div>
            <div className="ciTourCardMeta" id="mcqTourStep">Step {step + 1} of {total}</div>
          </div>
          <button className="ciTourClose" type="button" aria-label="Skip tour" onClick={end}>✕</button>
        </div>
        <div className="ciTourCardBody" id="mcqTourBody" style={{ whiteSpace:'pre-line' }}>{body}</div>
        <div className="ciTourFoot">
          <button className="ciTourNavBtn" type="button" onClick={end}>Skip Tour</button>
          <div className="ciTourBtns">
            <button className="ciTourNavBtn" type="button" disabled={step === 0} onClick={prev}>Previous</button>
            <button className="ciTourNavBtn primary" type="button" onClick={next}>
              {isLastOnParent ? 'Go to Quiz Page →' : isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
