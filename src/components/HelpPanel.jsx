// components/HelpPanel.jsx
// Help & Support panel + attempt-first modal — full React conversion of cv-help-panel.js.
//
// Responsibilities:
//   1. Slide-in Help & Support panel (same HTML structure, same CSS classes)
//   2. Attempt-first detail modal (same content)
//   3. Sidebar Help button injection (useEffect into the server-rendered sidebar)
//   4. Exposes window.CodiviumHelp.open() / .close() for external callers
//
// The first-visit note is NOT rendered here.
// It is passed as props to LeftPane so it renders inline with zero polling.

import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { createPortal } from 'react-dom';

const NOTE_KEY = 'cv_attempt_note_seen';

function seen()     { try { return localStorage.getItem(NOTE_KEY) === '1'; } catch (_) { return false; } }
function markSeen() { try { localStorage.setItem(NOTE_KEY, '1'); } catch (_) {} }

/* ── Attempt-first modal ────────────────────────────────────────────────── */
function AttemptModal({ open, onClose }) {
  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      id="cvAttemptFirstModal"
      className="open"
      role="dialog"
      aria-modal="true"
      aria-label="How the attempt-first system works"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cvh-modal-card">
        <div className="cvh-modal-head">
          <h2>How the attempt-first system works</h2>
          <button className="cvh-close" type="button" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="cvh-modal-body">
          <p>
            When you open a coding exercise,{' '}
            <strong>hints, the mini tutorial, the suggested solution, and the unit tests</strong>{' '}
            are temporarily locked. This is intentional — it is the core of how Codivium builds durable skill.
          </p>
          <p>
            The research behind this is well established: if you look at the answer before you have genuinely
            attempted the problem, you learn pattern-matching rather than problem-solving. The struggle —
            even if you do not succeed — is what makes the eventual explanation or solution stick.
          </p>
          <table className="cvh-lock-table">
            <tbody>
              <tr><th>What's locked</th><th>Unlocks after</th><th>Why</th></tr>
              <tr>
                <td>Hints</td>
                <td>2 min or 2 submissions</td>
                <td>Encourages a genuine first attempt before seeking guidance</td>
              </tr>
              <tr>
                <td>Mini tutorial</td>
                <td>4 min or 3 submissions</td>
                <td>Makes the tutorial far more effective once you've tried the problem yourself</td>
              </tr>
              <tr>
                <td>Suggested solution</td>
                <td>7 min or 5 submissions</td>
                <td>Prevents solution-reading replacing problem-solving</td>
              </tr>
              <tr>
                <td>Unit tests</td>
                <td>After 1st submission</td>
                <td>Ensures you encounter real test output rather than inspecting tests in advance</td>
              </tr>
            </tbody>
          </table>
          <p>
            You can always <strong>unlock any tab early</strong> — there is an &ldquo;Unlock now&rdquo; option
            on the lock notice. The lock is a nudge, not a barrier. Using it occasionally is fine.
            Using it as a default will slow your progress.
          </p>
          <p>
            If you find the locks frustrating, that is usually a sign you are attempting problems above
            your current level. The adaptive engine will steer you toward better-matched exercises over time.
          </p>
        </div>
        <div className="cvh-modal-footer">
          <button className="cvh-btn-primary" type="button" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Help panel ─────────────────────────────────────────────────────────── */
function Panel({ open, onClose, onOpenAttemptModal }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <>
      <div
        id="cvHelpPanelBackdrop"
        className={open ? 'open' : ''}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        id="cvHelpPanel"
        ref={panelRef}
        className={open ? 'open' : ''}
        role="dialog"
        aria-modal="true"
        aria-label="Help and Support"
        tabIndex={-1}
      >
        <div className="cvh-header">
          <span className="cvh-title">Help &amp; Support</span>
          <button className="cvh-close" id="cvHelpPanelClose" type="button"
            aria-label="Close help panel" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="cvh-body">
          <div className="cvh-section-head">Using the platform</div>

          <button className="cvh-link" id="cvhAttemptFirstLink" type="button"
            onClick={() => { onClose(); setTimeout(onOpenAttemptModal, 150); }}>
            <span className="cvh-link-icon">🔒</span>
            <span className="cvh-link-text">
              <span className="cvh-link-label">How the attempt-first system works</span>
              <span className="cvh-link-hint">Why hints, tutorials and solutions are locked initially</span>
            </span>
            <span className="cvh-link-arrow">›</span>
          </button>

          <a className="cvh-link" href="codivium_insights_embedded.html" id="cvhDashboardFaqLink">
            <span className="cvh-link-icon">📊</span>
            <span className="cvh-link-text">
              <span className="cvh-link-label">How to read your dashboard</span>
              <span className="cvh-link-hint">Opens Performance Insights — use the FAQ button inside</span>
            </span>
            <span className="cvh-link-arrow">›</span>
          </a>

          <div className="cvh-divider" />
          <div className="cvh-section-head">General &amp; billing</div>

          <a className="cvh-link" href="https://www.codivium.com/faq.html"
            target="_blank" rel="noopener noreferrer">
            <span className="cvh-link-icon">❓</span>
            <span className="cvh-link-text">
              <span className="cvh-link-label">Full FAQ</span>
              <span className="cvh-link-hint">Exercise types, subscriptions, refund policy and more</span>
            </span>
            <span className="cvh-link-arrow">↗</span>
          </a>

          <div className="cvh-divider" />
          <div className="cvh-section-head">Contact us</div>

          <div className="cvh-contact">
            <div className="cvh-contact-label">Get in touch</div>
            <a className="cvh-contact-email" href="mailto:support@codivium.com">support@codivium.com</a>
            <a className="cvh-contact-email" href="mailto:contact@codivium.com">contact@codivium.com</a>
            <p className="cvh-contact-note">
              We aim to respond within one business day. For billing enquiries,
              include your account email in the message.
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── First-visit note (rendered inside LeftPane via this export) ─────────── */
export function AttemptFirstNote({ onDismiss, onLearnMore }) {
  return (
    <div id="cvAttemptFirstNote">
      <button className="cvh-note-close" type="button" aria-label="Dismiss" onClick={onDismiss}>
        ✕
      </button>
      <strong>Hints and solutions are locked for a short while.</strong>{' '}
      This gives you the space to attempt the problem first — which is what actually builds the skill.
      They unlock automatically after a couple of minutes or submissions.
      <br />
      <button className="cvh-note-learn" type="button" onClick={onLearnMore}>
        Why does this help? Learn more →
      </button>
    </div>
  );
}

/* ── Root component ─────────────────────────────────────────────────────── */
export default function HelpPanel() {
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);

  const openPanel  = useCallback(() => setPanelOpen(true),  []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const openModal  = useCallback(() => setModalOpen(true),  []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // Inject Help button into the server-rendered sidebar
  useEffect(() => {
    if (document.getElementById('cvHelpSidebarBtn')) return;

    const sideNav = document.querySelector('.side-nav');
    const sep     = sideNav?.querySelector('.side-sep');
    if (!sep) return;

    const btn = document.createElement('button');
    btn.id   = 'cvHelpSidebarBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Help and Support');
    btn.setAttribute('data-tip',   'Help & Support');
    btn.innerHTML = [
      '<span class="sb-ico-help side-ico" aria-hidden="true">',
        '<svg viewBox="0 0 24 24" fill="none" width="22" height="22">',
          '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>',
          '<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 3v.5"',
            ' stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
          '<circle cx="12" cy="16.5" r=".75" fill="currentColor"/>',
        '</svg>',
      '</span>',
      '<span class="sb-label-help side-label">Help &amp; Support</span>',
    ].join('');

    btn.addEventListener('click', openPanel);
    sideNav.insertBefore(btn, sep);

    return () => {
      btn.removeEventListener('click', openPanel);
      btn.parentNode?.removeChild(btn);
    };
  }, [openPanel]);

  // Expose window.CodiviumHelp for external callers
  useEffect(() => {
    window.CodiviumHelp = {
      open:             openPanel,
      close:            closePanel,
      openAttemptModal: openModal,
    };
  }, [openPanel, closePanel, openModal]);

  return (
    <>
      <Panel
        open={panelOpen}
        onClose={closePanel}
        onOpenAttemptModal={openModal}
      />
      <AttemptModal
        open={modalOpen}
        onClose={closeModal}
      />
    </>
  );
}
