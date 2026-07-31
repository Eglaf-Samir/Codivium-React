import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLeaveConfirm } from '../context/LeaveConfirmContext.jsx';

// Routes whose page registers a save-and-exit handshake before letting
// the user navigate away. Coding-exercise pages all behave the same: the
// editor unmount cleanup persists code via its own SaveSession call.
// MCQ quiz uses a window-global (window.__cvMcqSaveAndExit) so the
// sidebar can wait for results to flush before navigating.
//
// Match is case-insensitive — URLs in the wild may differ from declared
// casing (e.g. /interview/codingque vs /interview/CodingQue).
const EDITOR_PATH_PREFIXES = [
  '/editor',
  '/interview/codingque',
  '/deliberatepractice/codingque',
];

const MCQ_QUIZ_PATH_PREFIX = '/mcq/quiz';

// Live probe (read at every call) — `window.__cvMcqSaveAndExit` is
// registered by McqQuizPage when phase === 'active' and cleared on
// summary / unmount. Sidebar renders BEFORE McqQuizPage's useEffect, so
// we can't capture this at hook-render time — it has to be re-evaluated
// at click time.
function isMcqQuizActive() {
  return typeof window !== 'undefined' && typeof window.__cvMcqSaveAndExit === 'function';
}

// Confirmation gate for navigations that leave an in-progress page.
//
// • Editor — message references the exercise; saving is handled by
//   EditorPage's own unmount cleanup.
// • MCQ quiz — message references the quiz; we await
//   window.__cvMcqSaveAndExit() so partial answers reach the backend
//   (McqTimeLog) before the component unmounts.
export function useEditorLeaveGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useLeaveConfirm();
  const path = location.pathname.toLowerCase();

  // Path flags are stable for the route's lifetime.
  const inEditorPath = EDITOR_PATH_PREFIXES.some((p) => path.startsWith(p));
  const inMcqPath    = path.startsWith(MCQ_QUIZ_PATH_PREFIX);

  // Click-time guard — re-evaluates the MCQ probe so a callback registered
  // after Sidebar's first render is still honoured.
  const guardedNavigate = useCallback(async (route, opts) => {
    const mcqGuarded = inMcqPath && isMcqQuizActive();
    if (!inEditorPath && !mcqGuarded) {
      navigate(route, opts);
      return;
    }

    const dialog = mcqGuarded
      ? {
          title: 'End the quiz?',
          message: 'Your answers so far will be submitted and you can review them in your dashboard.',
          confirmText: 'Yes, end the quiz',
          cancelText: 'No, keep going',
        }
      : {
          title: 'End the current exercise?',
          message: 'Your code and progress will be saved so you can continue later.',
          confirmText: 'Yes, end exercise',
          cancelText: 'No, keep coding',
        };

    const ok = await confirm(dialog);
    if (!ok) return;

    if (mcqGuarded) {
      try { await window.__cvMcqSaveAndExit(); }
      catch (_) { /* navigation should still proceed even if save errors */ }
    }
    navigate(route, opts);
  }, [inEditorPath, inMcqPath, navigate, confirm]);

  // Drop-in onClick handler for <Link> / <NavLink> / <a>. Falls through
  // (no preventDefault) when nothing is guarded; intercepts otherwise.
  const onLinkClick = useCallback((e, route, opts) => {
    const mcqGuarded = inMcqPath && isMcqQuizActive();
    if (!inEditorPath && !mcqGuarded) return;
    e.preventDefault();
    guardedNavigate(route, opts);
  }, [inEditorPath, inMcqPath, guardedNavigate]);

  // `isGuardActive()` — call this at click time (NOT at render time) to
  // see whether the user is currently in a guarded context. Used by
  // Sidebar.handleLogout to decide whether to show the confirm + flush
  // save before signing out. `isInMcqQuiz()` differentiates copy.
  const isGuardActive = useCallback(
    () => inEditorPath || (inMcqPath && isMcqQuizActive()),
    [inEditorPath, inMcqPath],
  );
  const isInMcqQuiz = useCallback(
    () => inMcqPath && isMcqQuizActive(),
    [inMcqPath],
  );

  return {
    // Render-time snapshots — backwards-compat. For correctness at click
    // time use the live functions below.
    inEditor: inEditorPath,
    inMcqQuiz: inMcqPath && isMcqQuizActive(),
    // Live probes — call at click time.
    isGuardActive,
    isInMcqQuiz,
    guardedNavigate,
    onLinkClick,
    confirm,
  };
}
