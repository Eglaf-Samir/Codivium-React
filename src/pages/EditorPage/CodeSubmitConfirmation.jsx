// components/CodeSubmitConfirmation.jsx
// Shown automatically after a Run Code pass where all unit tests succeeded.
// "YES" finalises the submission; "NO" closes and lets the user keep editing.
// Styled with the project's shared fb-modal classes for visual consistency.
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const CodeSubmitConfirmation = ({ showConfirm, onSubmitCode, handleClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showConfirm, handleClose]);

  if (!showConfirm) return null;

  return createPortal(
    <div
      className="fb-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm submission"
      onClick={handleClose}
    >
      <div className="fb-backdrop" aria-hidden="true" />
      <div
        className="fb-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="fb-head">
          <div className="fb-title">
            <div className="fb-seal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="fb-hgroup">
              <div className="fb-kicker">All unit tests passed</div>
              <h2 className="fb-exercise-name">Submit your solution?</h2>
            </div>
          </div>
        </header>

        <div className="fb-body">
          <aside className="fb-insight" aria-label="Submission prompt">
            <p>All unit tests have run successfully.</p>
            <p>You may submit this solution now to record your success.</p>
            <p>Would you like to submit now?</p>
          </aside>
        </div>

        <footer className="fb-foot">
          <div className="fb-foot-left">
            <div className="fb-stamp">
              <strong>Codivium</strong> &mdash; Confirm submission
            </div>
          </div>
          <div className="fb-foot-actions">
            <button className="fb-btn ghost" type="button" onClick={handleClose}>
              No
            </button>
            <button className="fb-btn gold" type="button" onClick={onSubmitCode}>
              Yes, Submit
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

export default CodeSubmitConfirmation;
