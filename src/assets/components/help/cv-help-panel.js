/* cv-help-panel.js
 * Help & Support slide-in panel + editor first-visit attempt-first note.
 * Loaded on all authenticated pages via sidebar.
 *
 * Responsibilities:
 *   1. Inject the Help sidebar button (below separator, above Settings)
 *   2. Inject & wire the slide-in Help panel
 *   3. On editor pages: show a first-visit note about the attempt-first system
 *   4. Wire the attempt-first detail modal
 *
 * localStorage keys:
 *   cv_attempt_note_seen  — '1' once the editor note has been dismissed
 */

(function () {
  'use strict';

  var NOTE_KEY = 'cv_attempt_note_seen';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function seen(key) {
    try { return localStorage.getItem(key) === '1'; } catch (_) { return false; }
  }
  function markSeen(key) {
    try { localStorage.setItem(key, '1'); } catch (_) {}
  }
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // ── Inject Help & Support panel HTML ──────────────────────────────────────
  function buildPanel() {
    if (document.getElementById('cvHelpPanel')) return;

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.id = 'cvHelpPanelBackdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'cvHelpPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Help and Support');
    panel.setAttribute('tabindex', '-1');

    panel.innerHTML = [
      '<div class="cvh-header">',
        '<span class="cvh-title">Help &amp; Support</span>',
        '<button class="cvh-close" id="cvHelpPanelClose" type="button" aria-label="Close help panel">&#x2715;</button>',
      '</div>',
      '<div class="cvh-body">',

        '<div class="cvh-section-head">Using the platform</div>',

        '<button class="cvh-link" id="cvhAttemptFirstLink" type="button">',
          '<span class="cvh-link-icon">🔒</span>',
          '<span class="cvh-link-text">',
            '<span class="cvh-link-label">How the attempt-first system works</span>',
            '<span class="cvh-link-hint">Why hints, tutorials and solutions are locked initially</span>',
          '</span>',
          '<span class="cvh-link-arrow">›</span>',
        '</button>',

        '<a class="cvh-link" href="codivium_insights_embedded.html" id="cvhDashboardFaqLink">',
          '<span class="cvh-link-icon">📊</span>',
          '<span class="cvh-link-text">',
            '<span class="cvh-link-label">How to read your dashboard</span>',
            '<span class="cvh-link-hint">Opens Performance Insights — use the FAQ button inside</span>',
          '</span>',
          '<span class="cvh-link-arrow">›</span>',
        '</a>',

        '<div class="cvh-divider"></div>',
        '<div class="cvh-section-head">General &amp; billing</div>',

        '<a class="cvh-link" href="https://www.codivium.com/faq.html" target="_blank" rel="noopener noreferrer">',
          '<span class="cvh-link-icon">❓</span>',
          '<span class="cvh-link-text">',
            '<span class="cvh-link-label">Full FAQ</span>',
            '<span class="cvh-link-hint">Exercise types, subscriptions, refund policy and more</span>',
          '</span>',
          '<span class="cvh-link-arrow">↗</span>',
        '</a>',

        '<div class="cvh-divider"></div>',
        '<div class="cvh-section-head">Contact us</div>',

        '<div class="cvh-contact">',
          '<div class="cvh-contact-label">Get in touch</div>',
          '<a class="cvh-contact-email" href="mailto:support@codivium.com">support@codivium.com</a>',
          '<a class="cvh-contact-email" href="mailto:contact@codivium.com">contact@codivium.com</a>',
          '<p class="cvh-contact-note">We aim to respond within one business day. For billing enquiries, include your account email in the message.</p>',
        '</div>',

      '</div>', // /cvh-body
    ].join('');

    document.body.appendChild(panel);

    // Wire close
    document.getElementById('cvHelpPanelClose').addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    // Wire attempt-first link → opens detail modal
    document.getElementById('cvhAttemptFirstLink').addEventListener('click', function () {
      closePanel();
      setTimeout(openAttemptModal, 150);
    });
  }

  function openPanel() {
    var panel = document.getElementById('cvHelpPanel');
    var backdrop = document.getElementById('cvHelpPanelBackdrop');
    if (!panel) { buildPanel(); panel = document.getElementById('cvHelpPanel'); backdrop = document.getElementById('cvHelpPanelBackdrop'); }
    panel.classList.add('open');
    backdrop.classList.add('open');
    panel.focus();
  }

  function closePanel() {
    var panel = document.getElementById('cvHelpPanel');
    var backdrop = document.getElementById('cvHelpPanelBackdrop');
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  // ── Attempt-first detail modal ─────────────────────────────────────────────
  function buildAttemptModal() {
    if (document.getElementById('cvAttemptFirstModal')) return;

    var modal = document.createElement('div');
    modal.id = 'cvAttemptFirstModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'How the attempt-first system works');

    modal.innerHTML = [
      '<div class="cvh-modal-card">',
        '<div class="cvh-modal-head">',
          '<h2>How the attempt-first system works</h2>',
          '<button class="cvh-close" id="cvAttemptModalClose" type="button" aria-label="Close">&#x2715;</button>',
        '</div>',
        '<div class="cvh-modal-body">',
          '<p>When you open a coding exercise, <strong>hints, the mini tutorial, the suggested solution, and the unit tests</strong> are temporarily locked. This is intentional — it is the core of how Codivium builds durable skill.</p>',
          '<p>The research behind this is well established: if you look at the answer before you have genuinely attempted the problem, you learn pattern-matching rather than problem-solving. The struggle — even if you do not succeed — is what makes the eventual explanation or solution stick.</p>',
          '<table class="cvh-lock-table">',
            '<tr><th>What\'s locked</th><th>Unlocks after</th><th>Why</th></tr>',
            '<tr><td>Hints</td><td>2 min or 2 submissions</td><td>Encourages a genuine first attempt before seeking guidance</td></tr>',
            '<tr><td>Mini tutorial</td><td>4 min or 3 submissions</td><td>Makes the tutorial far more effective once you\'ve tried the problem yourself</td></tr>',
            '<tr><td>Suggested solution</td><td>7 min or 5 submissions</td><td>Prevents solution-reading replacing problem-solving</td></tr>',
            '<tr><td>Unit tests</td><td>After 1st submission</td><td>Ensures you encounter real test output rather than inspecting tests in advance</td></tr>',
          '</table>',
          '<p>You can always <strong>unlock any tab early</strong> — there is an "Unlock now" option on the lock notice. The lock is a nudge, not a barrier. Using it occasionally is fine. Using it as a default will slow your progress.</p>',
          '<p>If you find the locks frustrating, that is usually a sign you are attempting problems above your current level. The adaptive engine will steer you toward better-matched exercises over time.</p>',
        '</div>',
        '<div class="cvh-modal-footer">',
          '<button class="cvh-btn-primary" id="cvAttemptModalOk" type="button">Got it</button>',
        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(modal);

    document.getElementById('cvAttemptModalClose').addEventListener('click', closeAttemptModal);
    document.getElementById('cvAttemptModalOk').addEventListener('click', closeAttemptModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeAttemptModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeAttemptModal();
    });
  }

  function openAttemptModal() {
    buildAttemptModal();
    var modal = document.getElementById('cvAttemptFirstModal');
    modal.classList.add('open');
  }

  function closeAttemptModal() {
    var modal = document.getElementById('cvAttemptFirstModal');
    if (modal) modal.classList.remove('open');
  }

  // ── Inject Help button into sidebar ───────────────────────────────────────
  function injectSidebarBtn() {
    if (document.getElementById('cvHelpSidebarBtn')) return;
    var sideNav = document.querySelector('.side-nav');
    if (!sideNav) return;

    // Find the separator before the bottom-links area (before settings)
    var sep = sideNav.querySelector('.side-sep');
    if (!sep) return;

    var btn = document.createElement('button');
    btn.id = 'cvHelpSidebarBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Help and Support');
    btn.setAttribute('data-tip', 'Help & Support');
    btn.innerHTML = [
      '<span class="sb-ico-help side-ico" aria-hidden="true">',
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="22" height="22">',
          '<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>',
          '<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 3v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>',
          '<circle cx="12" cy="16.5" r=".75" fill="currentColor"/>',
        '</svg>',
      '</span>',
      '<span class="sb-label-help side-label">Help &amp; Support</span>',
    ].join('');
    btn.addEventListener('click', openPanel);

    // Insert before the separator
    sideNav.insertBefore(btn, sep);
  }

  // ── Editor first-visit note ───────────────────────────────────────────────
  function isEditorPage() {
    var page = document.body.getAttribute('data-page') || '';
    return page === 'editor' || window.location.pathname.indexOf('editor') !== -1;
  }

  function injectEditorNote() {
    if (!isEditorPage()) return;
    if (seen(NOTE_KEY)) return;
    if (document.getElementById('cvAttemptFirstNote')) return;

    // Wait for the editor to render its left pane
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      // The exercise description lives inside #paneLeft .pane-body
      var target = document.querySelector('#paneLeft .pane-body, .exercise-description, .cv-exercise-pane, #exercisePane, .pane-left .pane-content');
      if (!target && attempts < 40) return;
      clearInterval(timer);
      if (!target) return;

      var note = document.createElement('div');
      note.id = 'cvAttemptFirstNote';
      note.innerHTML = [
        '<button class="cvh-note-close" type="button" aria-label="Dismiss">&#x2715;</button>',
        '<strong>Hints and solutions are locked for a short while.</strong> ',
        'This gives you the space to attempt the problem first — which is what actually builds the skill. ',
        'They unlock automatically after a couple of minutes or submissions.',
        '<br>',
        '<button class="cvh-note-learn" type="button">Why does this help? Learn more →</button>',
      ].join('');

      // Insert at top of the pane body
      target.insertBefore(note, target.firstChild);

      // Wire close
      note.querySelector('.cvh-note-close').addEventListener('click', function () {
        markSeen(NOTE_KEY);
        note.style.transition = 'opacity 0.3s ease, max-height 0.4s ease';
        note.style.opacity = '0';
        note.style.maxHeight = '0';
        note.style.overflow = 'hidden';
        note.style.margin = '0';
        note.style.padding = '0';
        setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 400);
      });

      // Wire "learn more"
      note.querySelector('.cvh-note-learn').addEventListener('click', function () {
        openAttemptModal();
      });
    }, 250);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    buildPanel();
    injectSidebarBtn();
    injectEditorNote();
  }

  onReady(init);

  // Expose for external use
  window.CodiviumHelp = {
    open:             openPanel,
    close:            closePanel,
    openAttemptModal: openAttemptModal,
  };

})();
