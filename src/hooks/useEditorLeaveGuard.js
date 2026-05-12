import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLeaveConfirm } from '../context/LeaveConfirmContext.jsx';

// All routes that mount the editor — keep in sync with App.jsx <Route path>.
// Match is case-insensitive because URLs in the wild may differ from the
// declared casing (e.g. /interview/codingque vs /interview/CodingQue).
const EDITOR_PATH_PREFIXES = [
  '/editor',
  '/interview/codingque',
  '/deliberatepractice/codingque',
];

// Confirmation gate for navigations that leave the EditorPage. The legacy
// Code-Adept-React app prompted the user before ending an in-progress
// exercise so unsaved code wouldn't quietly slip away. Reproduce that here:
// when the user clicks a nav link from the editor, ask first; on confirm
// proceed with navigate() — the EditorPage unmount cleanup persists the
// current code via SaveInterviewPreparationSession / SaveDeliberatePracticeSession.
export function useEditorLeaveGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useLeaveConfirm();
  const path = location.pathname.toLowerCase();
  const inEditor = EDITOR_PATH_PREFIXES.some((p) => path.startsWith(p));

  const guardedNavigate = useCallback(async (route, opts) => {
    if (!inEditor) {
      navigate(route, opts);
      return;
    }
    const ok = await confirm({
      title: 'End the current exercise?',
      message: 'Your code and progress will be saved so you can continue later.',
      confirmText: 'Yes, end exercise',
      cancelText: 'No, keep coding',
    });
    if (ok) navigate(route, opts);
  }, [inEditor, navigate, confirm]);

  // Drop-in onClick handler for <Link> / <NavLink> / <a>. Lets the default
  // navigation happen when not in the editor; intercepts otherwise.
  const onLinkClick = useCallback((e, route, opts) => {
    if (!inEditor) return;
    e.preventDefault();
    guardedNavigate(route, opts);
  }, [inEditor, guardedNavigate]);

  return { inEditor, guardedNavigate, onLinkClick, confirm };
}
