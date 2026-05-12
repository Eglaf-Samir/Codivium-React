import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Themed confirmation modal — reuses .fb-overlay / .fb-modal styles so it
// looks like the WelcomeBack and Feedback modals (dark + gold seal). Used
// when the user is leaving the editor with unsaved work.
export default function LeaveConfirmModal({
  open,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
}) {
  const modalRef = useRef(null);

  // Cursor-glow tracking — same effect the FeedbackModal uses.
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Focus the confirm button on open + close on Escape (cancel).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKey);
    const btns = modalRef.current?.querySelectorAll('button');
    if (btns?.length) btns[btns.length - 1].focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fb-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Confirm'}
      onClick={onCancel}
    >
      <div className="fb-backdrop" aria-hidden="true" />
      <div className="fb-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <header className="fb-head">
          <div className="fb-title">
            <div className="fb-seal" aria-hidden="true">
              {/* Warning glyph — matches the dark/gold palette of other modals. */}
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="fb-hgroup">
              <div className="fb-kicker">Confirm</div>
              <h2 className="fb-exercise-name" title={title}>{title}</h2>
            </div>
          </div>
        </header>

        <div className="fb-body">
          <aside className="fb-insight" aria-label="Confirmation details">
            <p>{message}</p>
          </aside>
        </div>

        <footer className="fb-foot">
          <div className="fb-foot-left">
            <div className="fb-stamp">
              <strong>Codivium</strong> &mdash; Save &amp; resume
            </div>
          </div>
          <div className="fb-foot-actions">
            <button className="fb-btn ghost" type="button" onClick={onCancel}>
              {cancelText}
            </button>
            <button className="fb-btn gold" type="button" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
