/* onboarding-tour.js
 * Premium first-time user onboarding tour for Codivium.
 *
 * Auto-starts on adaptive-practice.html for users with no session data.
 * Can be triggered manually at any time via #cvTourTriggerBtn or
 *   window.CodiviumTour.start()
 *
 * localStorage keys:
 *   cv_tour_completed    — '1' when tour has been completed or dismissed
 *   cv_tour_audio        — '1' muted, '0' audio on (default: on)
 *   cv_adaptive_onboarding — written at final step with orientation answers
 */

(function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var TOUR_KEY   = 'cv_tour_completed';
  var AUDIO_KEY  = 'cv_tour_audio';
  var ONBOARD_KEY = 'cv_adaptive_onboarding';

  // ── Web Audio API tone generator ──────────────────────────────────────────
  var _audioCtx = null;
  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (_) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _isMuted() {
    try { return localStorage.getItem(AUDIO_KEY) === '1'; } catch (_) { return false; }
  }

  function _playTone(freq, duration, type, gain) {
    if (_isMuted()) return;
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type || 'sine';
      osc.frequency.value = freq || 440;
      var g = gain || 0.08;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(g, ctx.currentTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.4));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (duration || 0.4));
    } catch (_) {}
  }

  function _chimeAdvance() {
    // Soft ascending two-note chime
    _playTone(523, 0.22, 'sine', 0.06); // C5
    setTimeout(function () { _playTone(659, 0.30, 'sine', 0.07); }, 80); // E5
  }

  function _chimeBack() {
    _playTone(523, 0.20, 'sine', 0.05);
    setTimeout(function () { _playTone(440, 0.28, 'sine', 0.06); }, 80); // A4
  }

  function _chimeComplete() {
    _playTone(523, 0.18, 'sine', 0.07);
    setTimeout(function () { _playTone(659, 0.18, 'sine', 0.07); }, 80);
    setTimeout(function () { _playTone(784, 0.35, 'sine', 0.09); }, 180); // G5
  }

  function _chimeOpen() {
    _playTone(392, 0.18, 'sine', 0.06); // G4
    setTimeout(function () { _playTone(523, 0.18, 'sine', 0.07); }, 100);
    setTimeout(function () { _playTone(659, 0.30, 'sine', 0.08); }, 200);
  }

  // ── Tour step definitions ─────────────────────────────────────────────────
  var STEPS = [

    // Step 0 — Welcome modal (no spotlight)
    {
      id: 'welcome',
      spotlight: null,
      icon: '✦',
      label: 'Welcome',
      title: 'Welcome to <em>Codivium</em>',
      desc: 'Codivium is a precision practice platform for Python. In two minutes, we\'ll show you everything — then launch your first personalised session immediately.',
      pills: [
        { icon: '🎯', text: 'Personalised practice' },
        { icon: '⚡', text: 'Instant feedback' },
        { icon: '📊', text: 'Performance tracking' },
        { icon: '🧠', text: 'Adaptive recommendations' },
      ],
      nextLabel: 'Take the tour →',
      skipLabel: 'Skip, go straight to practice',
    },

    // Step 1 — Sidebar navigation
    {
      id: 'sidebar',
      spotlight: '#sidebar',
      icon: '🗂️',
      label: 'Navigation',
      title: 'Your <em>navigation hub</em>',
      desc: 'The sidebar on the left takes you to every part of the platform. It collapses to icons on smaller screens. The active page is always highlighted.',
      pills: [
        { icon: '🏠', text: 'Adaptive Practice' },
        { icon: '📈', text: 'Performance Insights' },
        { icon: '🎤', text: 'Interview Prep' },
        { icon: '⚡', text: 'Micro Challenges' },
      ],
      nextLabel: 'Next →',
    },

    // Step 2 — Interview Questions
    {
      id: 'interview',
      screenshot: '<img src="assets/images/tour/panel1_editor.webp" alt="" aria-hidden="true" loading="eager" style="width:100%;height:auto;display:block;border-radius:0">',
      spotlight: '[data-section="interview"]',
      icon: '🎤',
      label: 'Interview Questions',
      title: '<em>Interview Preparation</em>',
      desc: 'Full interview-format coding problems — complete with edge cases, time constraints, and realistic difficulty scaling. Submissions are evaluated against comprehensive unit test suites. Build the skills that matter in real technical interviews.',
      pills: [
        { icon: '🧩', text: 'Full problem solving' },
        { icon: '✅', text: 'Unit test evaluation' },
        { icon: '⏱️', text: 'Realistic constraints' },
      ],
      nextLabel: 'Next →',
    },

    // Step 3 — Micro Challenges
    {
      id: 'micro',
      spotlight: '[data-section="micro"]',
      icon: '⚡',
      label: 'Micro Challenges',
      title: '<em>Micro Challenges</em>',
      desc: 'The exercise catalogue — every available Micro Challenge, organised by category and difficulty. Pick any card to open the coding editor and attempt it. Each exercise targets one specific skill, making Micro Challenges the fastest way to build coverage across the platform.',
      screenshot: '<img src="assets/images/tour/menu_page.png" alt="" aria-hidden="true" loading="eager" style="width:100%;height:auto;display:block;border-radius:0">',
      pills: [
        { icon: '📋', text: 'Browse by category' },
        { icon: '🏷️', text: 'Filter by difficulty' },
        { icon: '✅', text: 'Track completed exercises' },
      ],
      nextLabel: 'Next →',
    },

    // Step 4 — MCQ
    {
      id: 'mcq',
      screenshot: '<img src="assets/images/tour/panel3_mcq.webp" alt="" aria-hidden="true" loading="eager" style="width:100%;height:auto;display:block;border-radius:0">',
      spotlight: '[data-section="mcq"]',
      icon: '📝',
      label: 'MCQ Practice',
      title: '<em>Multiple Choice</em> Practice',
      desc: 'Quiz-format sessions across Language Basics, Functions, Data Types, and more. Each question comes with a detailed explanation and an optional mini-tutorial. Great for building conceptual breadth alongside coding practice.',
      pills: [
        { icon: '📝', text: '7 categories' },
        { icon: '🎓', text: '3 difficulty levels' },
        { icon: '💡', text: 'Explanations + tutorials' },
      ],
      nextLabel: 'Next →',
    },

    // Step 5 — Immediate feedback
    {
      id: 'feedback',
      screenshot: '<img src="assets/images/tour/panel2_feedback.webp" alt="" aria-hidden="true" loading="eager" style="width:100%;height:auto;display:block;border-radius:0">',
      spotlight: null,
      icon: '⚡',
      label: 'Feedback',
      title: '<em>Immediate feedback</em> on every submission',
      desc: 'The moment you submit a coding exercise, Codivium runs your code against a complete unit test suite and returns a detailed result: which tests passed, which failed, why, and what to focus on next. No waiting, no ambiguity.',
      pills: [
        { icon: '✅', text: 'Live unit test results' },
        { icon: '🔍', text: 'Failure explanations' },
        { icon: '📌', text: 'Next-step suggestions' },
        { icon: '💡', text: 'Optional hints & tutorial' },
      ],
      nextLabel: 'Next →',
    },

    // Step 6 — Performance Insights
    {
      id: 'insights',
      screenshot: '<img src="assets/images/tour/panel4_dashboard.webp" alt="" aria-hidden="true" loading="eager" style="width:100%;height:auto;display:block;border-radius:0">',
      spotlight: '[data-section="dashboard"]',
      icon: '📊',
      label: 'Performance Insights',
      title: 'Track your <em>real progress</em>',
      desc: 'As you practice, the Performance Insights dashboard builds a detailed picture of your ability: breadth across categories, depth of mastery, convergence heatmap, time investment, and your Codivium Score. It shows you exactly what to work on next.',
      pills: [
        { icon: '📊', text: 'Codivium Score' },
        { icon: '🗺️', text: 'Breadth tracking' },
        { icon: '🎯', text: 'Depth by category' },
        { icon: '🔥', text: 'Convergence heatmap' },
      ],
      nextLabel: 'Next →',
    },

    // Step 7 — Adaptive Practice
    {
      id: 'adaptive',
      screenshot: '<img src="assets/images/tour/section1Image.webp" alt="" aria-hidden="true" loading="eager" style="width:100%;height:auto;display:block;border-radius:0">',
      spotlight: '[data-section="home"]',
      icon: '🧠',
      label: 'Adaptive Practice',
      title: 'This page — <em>Adaptive Practice</em>',
      desc: 'You\'re here now. After a few sessions, this page analyses your history and surfaces your single most impactful next action — whether that\'s a weakness to address, a skill ready to advance, or a gap to cover. It updates every time you practice.',
      pills: [
        { icon: '🧠', text: 'AI-driven recommendations' },
        { icon: '📈', text: 'Updates with each session' },
        { icon: '🎯', text: 'One concrete next action' },
      ],
      nextLabel: 'Final step →',
    },

    // Step 8 — Handoff to orientation form
    {
      id: 'final',
      spotlight: '.ap-orientation-wrap',
      icon: '🚀',
      label: 'Ready',
      title: 'You\'re <em>ready to start</em>',
      desc: 'The tour is done. Complete the short form below — it takes 20 seconds — and we\'ll generate your first personalised practice session immediately.',
      hasVideos: true,
      nextLabel: 'Go to the form →',
    },
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var _current = 0;
  var _overlayEl = null;
  var _spotlightEl = null;
  var _tooltipEl = null;
  var _formAnswers = {};
  var _isVisible = false;

  // ── Build HTML ────────────────────────────────────────────────────────────
  function _buildOverlay() {
    if (document.getElementById('cvOnboardingTour')) return;

    var el = document.createElement('div');
    el.id = 'cvOnboardingTour';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Codivium platform tour');

    el.innerHTML = _overlayHTML();
    document.body.appendChild(el);

    // Spotlight element
    _spotlightEl = document.createElement('div');
    _spotlightEl.className = 'cvt-spotlight';
    document.body.appendChild(_spotlightEl);

    // Tooltip element
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'cvt-tooltip';
    _tooltipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(_tooltipEl);

    // Video modal
    var vm = document.createElement('div');
    vm.className = 'cvt-video-modal';
    vm.id = 'cvtVideoModal';
    vm.innerHTML = '<div class="cvt-video-player"><div id="cvtVideoFrame" style="width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:#0a0a0c;color:rgba(245,245,252,0.5);font-size:14px">Video content coming soon</div></div><button class="cvt-video-close" id="cvtVideoClose" aria-label="Close video">✕</button>';
    document.body.appendChild(vm);
    document.getElementById('cvtVideoClose').addEventListener('click', _closeVideo);

    _overlayEl = el;
    _wireEvents();
  }

  function _overlayHTML() {
    return '<div class="cvt-scene"><div class="cvt-card"><button class="cvt-audio-toggle" id="cvtAudioToggle" aria-label="Toggle audio" title="Toggle sound">🔊</button><div id="cvtSlidesWrap"></div><div class="cvt-footer"><button class="cvt-btn cvt-btn-ghost" id="cvtSkipBtn" type="button">Skip tour</button><div style="display:flex;gap:10px;align-items:center"><button class="cvt-btn cvt-btn-secondary" id="cvtBackBtn" type="button" style="display:none">← Back</button><button class="cvt-btn cvt-btn-primary" id="cvtNextBtn" type="button">Next →</button></div></div></div></div>';
  }

  // ── Slide content ─────────────────────────────────────────────────────────
  function _buildSlide(step) {
    var html = '<div class="cvt-slide active">';

    // Header
    html += '<div class="cvt-header">';
    // Only show wordmark on first slide
    if (step.id === 'welcome') {
      html += '<div class="cvt-wordmark">'
            +   '<div class="cvt-wordmark-cube">'
            +     '<div class="cvt-cube-face front">κ</div>'
            +     '<div class="cvt-cube-face right">δ</div>'
            +     '<div class="cvt-cube-face back">αδ</div>'
            +     '<div class="cvt-cube-face left">ν</div>'
            +     '<div class="cvt-cube-face top">η</div>'
            +     '<div class="cvt-cube-face bottom">φσα</div>'
            +   '</div>'
            +   '<div class="cvt-wordmark-text">Codivium</div>'
            +   '<span class="cvt-badge-new">✦ New</span>'
            + '</div>';
    }

    // Step tracker
    html += '<div class="cvt-step-track">';
    for (var i = 0; i < STEPS.length; i++) {
      var cls = i < _current ? 'done' : i === _current ? 'active' : '';
      html += '<div class="cvt-step-pip ' + cls + '"></div>';
    }
    html += '</div>';

    html += '<div class="cvt-step-label">' + step.label + ' &nbsp;·&nbsp; Step ' + (_current + 1) + ' of ' + STEPS.length + '</div>';
    html += '<div class="cvt-title">' + step.title + '</div>';
    html += '</div>'; // /header

    // Body
    html += '<div class="cvt-body">';
    html += '<p class="cvt-desc">' + step.desc + '</p>';

    // Screenshot preview (for steps that have one)
    if (step.screenshot) {
      html += '<div class="cvt-screenshot" aria-hidden="true">'
            + step.screenshot
            + '</div>';
    } else if (!step.spotlight && step.id !== 'final') {
      // Fallback illustration for steps with no screenshot
      html += '<div class="cvt-illustration"><div class="cvt-illus-inner">'
            + '<span class="cvt-illus-icon">' + step.icon + '</span>'
            + '<div class="cvt-illus-caption">Live preview available once you start practising</div>'
            + '</div></div>';
    }

    // Pills
    if (step.pills && step.pills.length) {
      html += '<div class="cvt-pills">';
      step.pills.forEach(function (p) {
        html += '<div class="cvt-pill"><span class="cvt-pill-icon">' + p.icon + '</span>' + p.text + '</div>';
      });
      html += '</div>';
    }

    // Videos (final step only)
    if (step.hasVideos) {
      html += '<div class="cvt-videos">'
            + _videoCard('What is a Micro Challenge?', '1:45', 'micro')
            + _videoCard('How immediate feedback works', '2:10', 'feedback')
            + _videoCard('How the dashboard helps later', '2:30', 'dashboard')
            + '</div>';
    }

    // Orientation form (final step only)
    if (step.hasForm) {
      html += _orientFormHTML();
    }

    html += '</div>'; // /body
    html += '</div>'; // /slide

    return html;
  }

  function _videoCard(title, dur, key) {
    var icons = { micro:'⚡', feedback:'✅', dashboard:'📊' };
    return '<div class="cvt-video-card" data-video="' + key + '">'
         + '<div class="cvt-video-thumb">'
         + '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:36px;opacity:0.3">' + (icons[key] || '▶') + '</div>'
         + '<div class="cvt-play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>'
         + '</div>'
         + '<div class="cvt-video-meta">'
         + '<div class="cvt-video-title">' + title + '</div>'
         + '<div class="cvt-video-dur">' + dur + '</div>'
         + '</div></div>';
  }

  function _orientFormHTML() {
    return '<div class="cvt-orient-block">'
         + '<div class="cvt-orient-label">What\'s your main goal right now?</div>'
         + '<div class="cvt-orient-opts" data-q="goal">'
         + '<button class="cvt-orient-opt" data-v="interview" type="button">Prepare for a job interview</button>'
         + '<button class="cvt-orient-opt" data-v="improve" type="button">Improve my Python skills</button>'
         + '<button class="cvt-orient-opt" data-v="explore" type="button">Explore and learn</button>'
         + '<button class="cvt-orient-opt" data-v="gaps" type="button">Fill specific gaps</button>'
         + '</div></div>'
         + '<div class="cvt-orient-block">'
         + '<div class="cvt-orient-label">How comfortable are you with Python?</div>'
         + '<div class="cvt-orient-opts" data-q="level">'
         + '<button class="cvt-orient-opt" data-v="beginner" type="button">Just starting out</button>'
         + '<button class="cvt-orient-opt" data-v="basic" type="button">Know the basics</button>'
         + '<button class="cvt-orient-opt" data-v="intermediate" type="button">Comfortable</button>'
         + '<button class="cvt-orient-opt" data-v="advanced" type="button">Advanced</button>'
         + '</div></div>'
         + '<div class="cvt-orient-block">'
         + '<div class="cvt-orient-label">How much time do you have right now?</div>'
         + '<div class="cvt-orient-opts" data-q="time">'
         + '<button class="cvt-orient-opt" data-v="5" type="button">About 5 minutes</button>'
         + '<button class="cvt-orient-opt" data-v="15" type="button">15–20 minutes</button>'
         + '<button class="cvt-orient-opt" data-v="30" type="button">30+ minutes</button>'
         + '</div></div>';
  }


  // ── WAAPI cube rotation (matches main brand cube behaviour) ──────────────
  // Rotates around alternating axis combinations every 1.5s, matching the
  // brand-cube.js pattern of progressive tumbling via DOMMatrixReadOnly.rotate()
  function _startCubeSpin(cubeEl) {
    if (!cubeEl || typeof cubeEl.animate !== 'function') return;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (_) {}

    // Cancel any existing animation
    if (cubeEl._cvTourAnim) {
      try { cubeEl._cvTourAnim.cancel(); } catch (_) {}
      cubeEl._cvTourAnim = null;
    }

    // Four axis-combination sets, each [rotateX°, rotateY°, rotateZ°] per step.
    // Same mechanism as brand-cube.js: DOMMatrixReadOnly.rotate(rx, ry, rz).
    var axisSets = [
      [90,  180,   0],   // X+Y tumble (primary — matches brand cube)
      [ 0,  180,  90],   // Y+Z tumble
      [90,    0, 180],   // X+Z tumble
      [60,  120,  60],   // All-axis diagonal tumble
    ];
    var axisIdx = 0;

    function runPhase() {
      var ax = axisSets[axisIdx % axisSets.length];
      axisIdx++;

      var currentTransform = '';
      try { currentTransform = getComputedStyle(cubeEl).transform || ''; } catch (_) {}
      var base;
      try {
        base = new DOMMatrixReadOnly(currentTransform && currentTransform !== 'none'
          ? currentTransform
          : 'rotateX(-18deg) rotateY(32deg)');
      } catch (_) { return; }

      var k1 = base.toString();
      var k2;
      try { k2 = base.rotate(ax[0], ax[1], ax[2]).toString(); }
      catch (_) { return; }

      var anim;
      try {
        anim = cubeEl.animate(
          [{ transform: k1 }, { transform: k2 }],
          { duration: 1500, easing: 'linear', fill: 'forwards' }
        );
      } catch (_) { return; }

      cubeEl._cvTourAnim = anim;
      anim.onfinish = function () { if (cubeEl._cvTourAnim === anim) runPhase(); };
    }

    runPhase();
  }

  // ── Render step ───────────────────────────────────────────────────────────
  function _renderStep(idx, direction) {
    _current = idx;
    var step = STEPS[idx];
    var wrap = document.getElementById('cvtSlidesWrap');
    if (!wrap) return;

    // Fade out old slide
    var old = wrap.querySelector('.cvt-slide.active');
    if (old) {
      old.classList.remove('active');
      old.classList.add('out');
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 260);
    }

    // Build new slide
    var div = document.createElement('div');
    div.innerHTML = _buildSlide(step);
    wrap.appendChild(div.firstChild);

    // Start WAAPI cube spin for this slide
    requestAnimationFrame(function () {
      var cube = wrap.querySelector('.cvt-wordmark-cube');
      if (cube) _startCubeSpin(cube);
    });

    // Update nav buttons
    var nextBtn = document.getElementById('cvtNextBtn');
    var backBtn = document.getElementById('cvtBackBtn');
    var skipBtn = document.getElementById('cvtSkipBtn');

    if (nextBtn) nextBtn.textContent = step.nextLabel || (idx === STEPS.length - 1 ? 'Launch session →' : 'Next →');
    if (backBtn) backBtn.style.display = idx > 0 ? 'inline-flex' : 'none';
    if (skipBtn) skipBtn.style.display = idx === STEPS.length - 1 ? 'none' : 'inline-flex';

    // Wire orient form answer buttons
    wrap.querySelectorAll('.cvt-orient-opts').forEach(function (grp) {
      grp.querySelectorAll('.cvt-orient-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var q = grp.getAttribute('data-q');
          var v = btn.getAttribute('data-v');
          _formAnswers[q] = v;
          grp.querySelectorAll('.cvt-orient-opt').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          // Restore any previous selection
          if (_formAnswers[q]) {
            grp.querySelectorAll('[data-v="' + _formAnswers[q] + '"]').forEach(function (b) { b.classList.add('selected'); });
          }
        });
      });
      // Restore selections
      var q = grp.getAttribute('data-q');
      if (_formAnswers[q]) {
        var sel = grp.querySelector('[data-v="' + _formAnswers[q] + '"]');
        if (sel) sel.classList.add('selected');
      }
    });

    // Wire video cards
    wrap.querySelectorAll('.cvt-video-card').forEach(function (card) {
      card.addEventListener('click', function () {
        _openVideo(card.getAttribute('data-video'));
      });
    });

    // Handle spotlight
    _updateSpotlight(step);

    // Update audio toggle
    _updateAudioToggle();
  }

  // ── Spotlight + hole-punch ───────────────────────────────────────────────
  // The page is already rendered below the tour backdrop.
  // We punch a hole through the backdrop and blur by:
  //   1. A dim layer (#cvTourDimLayer) that darkens everything OUTSIDE the hole
  //   2. A clear layer (#cvTourClearLayer) clipped to the hole — transparent passthrough
  //   3. The backdrop itself has backdrop-filter:none when has-spotlight so the
  //      clear layer shows the page in full fidelity inside the hole
  //
  // No iframes needed — the live DOM is already there.

  var _dimLayer   = null;
  var _clearLayer = null;

  function _ensureLayers() {
    if (!_dimLayer) {
      _dimLayer = document.createElement('div');
      _dimLayer.id = 'cvTourDimLayer';
      document.body.appendChild(_dimLayer);
    }
    if (!_clearLayer) {
      _clearLayer = document.createElement('div');
      _clearLayer.id = 'cvTourClearLayer';
      document.body.appendChild(_clearLayer);
    }
  }

  function _removeLayers() {
    if (_dimLayer   && _dimLayer.parentNode)   { _dimLayer.parentNode.removeChild(_dimLayer);     _dimLayer   = null; }
    if (_clearLayer && _clearLayer.parentNode) { _clearLayer.parentNode.removeChild(_clearLayer); _clearLayer = null; }
    if (_overlayEl) {
      _overlayEl.classList.remove('has-spotlight');
      _overlayEl.style.clipPath = '';
    }
  }

  // Punch a hole in the backdrop at the target element
  function _punchHole(target) {
    _ensureLayers();

    if (!target) {
      // No spotlight — remove hole, restore full backdrop blur
      _clearLayer.style.clipPath  = 'inset(0 0 100% 0)';
      _dimLayer.classList.remove('active');
      _dimLayer.style.clipPath = '';
      if (_overlayEl) {
        _overlayEl.classList.remove('has-spotlight');
        _overlayEl.style.clipPath = '';
      }
      return;
    }

    var r    = target.getBoundingClientRect();
    var pad  = 14;
    var W    = window.innerWidth;
    var H    = window.innerHeight;

    // Inset values for clip-path (from each edge)
    var top    = Math.max(0, r.top    - pad);
    var left   = Math.max(0, r.left   - pad);
    var right  = Math.max(0, W - r.right  - pad);
    var bottom = Math.max(0, H - r.bottom - pad);

    var insetStr = top + 'px ' + right + 'px ' + bottom + 'px ' + left + 'px';

    // Clear layer: ONLY visible inside the hole — shows unblurred page content
    _clearLayer.style.clipPath = 'inset(' + insetStr + ')';
    _clearLayer.style.transition = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';

    // Dim layer: covers EVERYTHING, then cuts out the hole so the hole stays bright
    _dimLayer.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, '
      + '0 ' + top + 'px, '
      + left + 'px ' + top + 'px, '
      + left + 'px ' + (H - bottom) + 'px, '
      + (W - right) + 'px ' + (H - bottom) + 'px, '
      + (W - right) + 'px ' + top + 'px, '
      + '0 ' + top + 'px)';
    _dimLayer.style.transition = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';
    _dimLayer.classList.add('active');

    // Backdrop: remove blur so the clear layer beneath shows through sharply
    if (_overlayEl) {
      _overlayEl.classList.add('has-spotlight');
      // Punch a matching hole in the backdrop's own clip-path so it doesn't cover the element
      _overlayEl.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, '
        + '0 ' + top + 'px, '
        + left + 'px ' + top + 'px, '
        + left + 'px ' + (H - bottom) + 'px, '
        + (W - right) + 'px ' + (H - bottom) + 'px, '
        + (W - right) + 'px ' + top + 'px, '
        + '0 ' + top + 'px)';
      _overlayEl.style.transition = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';
    }
  }


  // ── Spotlight ─────────────────────────────────────────────────────────────
  function _updateSpotlight(step) {
    if (!_spotlightEl || !_tooltipEl) return;

    if (!step.spotlight) {
      _spotlightEl.classList.remove('visible');
      _tooltipEl.classList.remove('visible');
      _punchHole(null);
      return;
    }

    var target = document.querySelector(step.spotlight);
    if (!target) {
      _spotlightEl.classList.remove('visible');
      _tooltipEl.classList.remove('visible');
      return;
    }

    setTimeout(function () {
      var r = target.getBoundingClientRect();
      var pad = 8;
      _spotlightEl.style.left   = (r.left - pad) + 'px';
      _spotlightEl.style.top    = (r.top  - pad) + 'px';
      _spotlightEl.style.width  = (r.width  + pad * 2) + 'px';
      _spotlightEl.style.height = (r.height + pad * 2) + 'px';
      _spotlightEl.classList.add('visible');

      // Position tooltip below or above
      var tipTop = r.bottom + pad + 12;
      var tipLeft = r.left;
      if (tipTop + 100 > window.innerHeight) {
        tipTop = r.top - 100 - pad;
      }
      if (tipLeft + 280 > window.innerWidth) {
        tipLeft = window.innerWidth - 296;
      }
      _tooltipEl.style.top  = tipTop + 'px';
      _tooltipEl.style.left = tipLeft + 'px';
      _tooltipEl.innerHTML = '<div class="cvt-tooltip-title">' + step.label + '</div>'
                           + '<div class="cvt-tooltip-body">' + step.desc.substring(0, 100) + '…</div>';
      _tooltipEl.classList.add('visible');

      // Punch hole at target element
      _punchHole(target);
    }, 50);
  }

  // ── Audio toggle ──────────────────────────────────────────────────────────
  function _updateAudioToggle() {
    var btn = document.getElementById('cvtAudioToggle');
    if (!btn) return;
    btn.textContent = _isMuted() ? '🔇' : '🔊';
    btn.title = _isMuted() ? 'Enable sound' : 'Mute sound';
  }

  // ── Video ─────────────────────────────────────────────────────────────────
  function _openVideo(key) {
    var modal = document.getElementById('cvtVideoModal');
    var frame = document.getElementById('cvtVideoFrame');
    if (!modal || !frame) return;

    var messages = {
      micro:    'Micro Challenge: a short, focused coding exercise designed to isolate one skill.<br><br>You\'ll see the problem, write your solution, and get immediate unit test feedback.<br><br><em>(Video content coming soon)</em>',
      feedback: 'Immediate Feedback: as soon as you submit, every unit test runs instantly and you see exactly which passed, which failed, and why.<br><br><em>(Video content coming soon)</em>',
      dashboard:'The Performance Dashboard builds as you practice — breadth, depth, convergence heatmap, and your Codivium Score — showing you where to focus next.<br><br><em>(Video content coming soon)</em>',
    };

    frame.innerHTML = '<div style="width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;padding:32px;box-sizing:border-box;background:var(--color-bg-surface-2,#0a0a0c);font-size:15px;line-height:1.7;color:var(--color-text-secondary,rgba(245,245,252,0.8));text-align:center">'
                    + (messages[key] || 'Video content coming soon')
                    + '</div>';
    modal.classList.add('open');
    _playTone(440, 0.18, 'sine', 0.05);
  }

  function _closeVideo() {
    var modal = document.getElementById('cvtVideoModal');
    if (modal) modal.classList.remove('open');
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function _next() {
    if (_current === STEPS.length - 1) {
      _complete();
      return;
    }
    _renderStep(_current + 1, 'forward');
  }

  function _back() {
    if (_current === 0) return;
    _renderStep(_current - 1, 'back');
  }

  function _skip() {
    _dismiss(false);
  }

  function _complete() {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) {}
    _chimeComplete();
    _dismiss(true);

    // Scroll the real adaptive orientation form into view and highlight it
    setTimeout(function () {
      document.dispatchEvent(new CustomEvent('cv:tour-complete', { detail: {} }));
      var orientCard = document.querySelector('.ap-orientation-card');
      if (orientCard) {
        // Smooth scroll to the form
        orientCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief pulse to draw the eye
        orientCard.classList.add('cvt-orient-pulse');
        setTimeout(function () {
          orientCard.classList.remove('cvt-orient-pulse');
          // Focus the first unanswered option button
          var firstBtn = orientCard.querySelector('.ap-diag-opt:not(.selected)');
          if (firstBtn) firstBtn.focus();
        }, 800);
      }
    }, 450);
  }

  function _dismiss(completed) {
    if (!_overlayEl) return;

    // 1. Mark as not visible immediately so keyboard handler ignores events
    _isVisible = false;
    document.body.classList.remove('cv-tour-open');

    // 2. Clear all overlay layers (dim + clear + clip-path on backdrop)
    try { _removeLayers(); } catch (e) {}

    // 3. Hide the main overlay (opacity → 0, pointer-events → none via CSS)
    _overlayEl.classList.remove('cvt-visible');
    // Belt-and-braces: force pointer-events off inline in case CSS specificity loses
    _overlayEl.style.pointerEvents = 'none';

    // 4. Hide spotlight + tooltip immediately
    if (_spotlightEl) {
      _spotlightEl.classList.remove('visible');
      _spotlightEl.style.opacity = '0';
    }
    if (_tooltipEl) {
      _tooltipEl.classList.remove('visible');
      _tooltipEl.style.opacity = '0';
    }

    // 5. Persist skip/complete state
    if (!completed) {
      try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) {}
    }

    // 6. Remove DOM nodes after the CSS transition finishes (0.4s + buffer)
    setTimeout(function () {
      try {
        if (_spotlightEl && _spotlightEl.parentNode) {
          _spotlightEl.parentNode.removeChild(_spotlightEl);
        }
        if (_tooltipEl && _tooltipEl.parentNode) {
          _tooltipEl.parentNode.removeChild(_tooltipEl);
        }
      } catch (_) {}
      _spotlightEl = null;
      _tooltipEl   = null;
    }, 500);
  }

  // ── Event wiring ──────────────────────────────────────────────────────────
  function _wireEvents() {
    var el = _overlayEl;
    if (!el) return;

    el.addEventListener('click', function (e) {
      var t = e.target;
      if (t.id === 'cvtNextBtn' || t.closest('#cvtNextBtn')) { _next(); return; }
      if (t.id === 'cvtBackBtn' || t.closest('#cvtBackBtn')) { _back(); return; }
      if (t.id === 'cvtSkipBtn' || t.closest('#cvtSkipBtn')) { _skip(); return; }
      if (t.id === 'cvtAudioToggle' || t.closest('#cvtAudioToggle')) {
        try {
          localStorage.setItem(AUDIO_KEY, _isMuted() ? '0' : '1');
        } catch (_) {}
        _updateAudioToggle();
        if (!_isMuted()) { _playTone(523, 0.2, 'sine', 0.07); }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!_isVisible) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') _next();
      if (e.key === 'ArrowLeft')  _back();
      if (e.key === 'Escape')     _skip();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function _start(forceShow) {
    // Resume audio context if needed (user gesture)
    var ctx = _getAudioCtx();
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (_) {} }

    if (!_overlayEl) { _buildOverlay(); }
    _current = 0;
    _formAnswers = {};

    // Restore form answers if user resumes
    try {
      var saved = localStorage.getItem(ONBOARD_KEY);
      if (saved) { _formAnswers = JSON.parse(saved); }
    } catch (_) {}

    _renderStep(0, 'forward');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        _overlayEl.classList.add('cvt-visible');
        document.body.classList.add('cv-tour-open');
        _isVisible = true;
        _chimeOpen();
      });
    });
  }

  function _hasCompletedTour() {
    try { return localStorage.getItem(TOUR_KEY) === '1'; } catch (_) { return false; }
  }

  function _isNewUser() {
    // Same hasRealToken check used throughout the platform
    try {
      var token = sessionStorage.getItem('cv_auth_token') || localStorage.getItem('cv_auth_token');
      // New user = no token (demo/pre-auth) OR explicit new-user flag
      return !token;
    } catch (_) { return true; }
  }

  // ── Auto-start logic ──────────────────────────────────────────────────────
  function _autoStart() {
    // Only auto-start if:
    // 1. On the adaptive-practice page
    // 2. Tour not already completed/skipped
    // 3. User has no data (is new user)
    if (_hasCompletedTour()) return;
    if (!_isNewUser()) return;

    // Slight delay so the page renders first
    setTimeout(function () { _start(); }, 900);
  }

  // ── Topbar trigger button ─────────────────────────────────────────────────
  function _applyTourBtnPref() {
    var btn = document.getElementById('cvTourTriggerBtn');
    if (!btn) return;
    var show = true;
    try { show = localStorage.getItem('show_tour_btn') !== '0'; } catch (_) {}
    btn.style.display = show ? '' : 'none';
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function _addSidebarTrigger() {
    var btn = document.getElementById('cvTourTriggerBtn');
    if (!btn) return;

    _applyTourBtnPref();

    // Re-apply when pref changes in another tab (standard storage event)
    window.addEventListener('storage', function (e) {
      if (e.key === 'show_tour_btn') _applyTourBtnPref();
    });
    // Re-apply when pref changes in the same tab (custom event)
    document.addEventListener('cv:pref-change', function (e) {
      if (e.detail && e.detail.key === 'show_tour_btn') _applyTourBtnPref();
    });

    if (!btn._cvTourBound) {
      btn.addEventListener('click', function () { _start(true); });
      btn._cvTourBound = true;
    }

    // Flash border once on load (only if visible)
    var showNow = true;
    try { showNow = localStorage.getItem('show_tour_btn') !== '0'; } catch (_) {}
    if (showNow && !btn._cvFlashDone) {
      btn._cvFlashDone = true;
      setTimeout(function () {
        btn.classList.add('cvt-flash');
        btn.addEventListener('animationend', function () {
          btn.classList.remove('cvt-flash');
        }, { once: true });
      }, 1200);
    }
  }

  // ── Initialise ────────────────────────────────────────────────────────────
  function _init() {
    _addSidebarTrigger();
    _autoStart();
  }

  // Expose public API
  window.CodiviumTour = {
    start:       function () { _start(true); },
    dismiss:     _dismiss,
    isCompleted: _hasCompletedTour,
    reset:       function () {
      try {
        localStorage.removeItem(TOUR_KEY);
        localStorage.removeItem(ONBOARD_KEY);
      } catch (_) {}
    },
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }



  // ── Spotlight + hole-punch ───────────────────────────────────────────────
  // The page is already rendered below the tour backdrop.
  // We punch a hole through the backdrop and blur by:
  //   1. A dim layer (#cvTourDimLayer) that darkens everything OUTSIDE the hole
  //   2. A clear layer (#cvTourClearLayer) clipped to the hole — transparent passthrough
  //   3. The backdrop itself has backdrop-filter:none when has-spotlight so the
  //      clear layer shows the page in full fidelity inside the hole
  //
  // No iframes needed — the live DOM is already there.

  var _dimLayer   = null;
  var _clearLayer = null;

  function _ensureLayers() {
    if (!_dimLayer) {
      _dimLayer = document.createElement('div');
      _dimLayer.id = 'cvTourDimLayer';
      document.body.appendChild(_dimLayer);
    }
    if (!_clearLayer) {
      _clearLayer = document.createElement('div');
      _clearLayer.id = 'cvTourClearLayer';
      document.body.appendChild(_clearLayer);
    }
  }

  function _removeLayers() {
    if (_dimLayer   && _dimLayer.parentNode)   { _dimLayer.parentNode.removeChild(_dimLayer);     _dimLayer   = null; }
    if (_clearLayer && _clearLayer.parentNode) { _clearLayer.parentNode.removeChild(_clearLayer); _clearLayer = null; }
    if (_overlayEl) {
      _overlayEl.classList.remove('has-spotlight');
      _overlayEl.style.clipPath = '';
    }
  }

  // Punch a hole in the backdrop at the target element
  function _punchHole(target) {
    _ensureLayers();

    if (!target) {
      // No spotlight — remove hole, restore full backdrop blur
      _clearLayer.style.clipPath  = 'inset(0 0 100% 0)';
      _dimLayer.classList.remove('active');
      _dimLayer.style.clipPath = '';
      if (_overlayEl) {
        _overlayEl.classList.remove('has-spotlight');
        _overlayEl.style.clipPath = '';
      }
      return;
    }

    var r    = target.getBoundingClientRect();
    var pad  = 14;
    var W    = window.innerWidth;
    var H    = window.innerHeight;

    // Inset values for clip-path (from each edge)
    var top    = Math.max(0, r.top    - pad);
    var left   = Math.max(0, r.left   - pad);
    var right  = Math.max(0, W - r.right  - pad);
    var bottom = Math.max(0, H - r.bottom - pad);

    var insetStr = top + 'px ' + right + 'px ' + bottom + 'px ' + left + 'px';

    // Clear layer: ONLY visible inside the hole — shows unblurred page content
    _clearLayer.style.clipPath = 'inset(' + insetStr + ')';
    _clearLayer.style.transition = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';

    // Dim layer: covers EVERYTHING, then cuts out the hole so the hole stays bright
    _dimLayer.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, '
      + '0 ' + top + 'px, '
      + left + 'px ' + top + 'px, '
      + left + 'px ' + (H - bottom) + 'px, '
      + (W - right) + 'px ' + (H - bottom) + 'px, '
      + (W - right) + 'px ' + top + 'px, '
      + '0 ' + top + 'px)';
    _dimLayer.style.transition = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';
    _dimLayer.classList.add('active');

    // Backdrop: remove blur so the clear layer beneath shows through sharply
    if (_overlayEl) {
      _overlayEl.classList.add('has-spotlight');
      // Punch a matching hole in the backdrop's own clip-path so it doesn't cover the element
      _overlayEl.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, '
        + '0 ' + top + 'px, '
        + left + 'px ' + top + 'px, '
        + left + 'px ' + (H - bottom) + 'px, '
        + (W - right) + 'px ' + (H - bottom) + 'px, '
        + (W - right) + 'px ' + top + 'px, '
        + '0 ' + top + 'px)';
      _overlayEl.style.transition = 'clip-path 0.45s cubic-bezier(0.23,1,0.32,1)';
    }
  }


  // ── Spotlight ─────────────────────────────────────────────────────────────
  function _updateSpotlight(step) {
    if (!_spotlightEl || !_tooltipEl) return;

    if (!step.spotlight) {
      _spotlightEl.classList.remove('visible');
      _tooltipEl.classList.remove('visible');
      _punchHole(null);
      return;
    }

    var target = document.querySelector(step.spotlight);
    if (!target) {
      _spotlightEl.classList.remove('visible');
      _tooltipEl.classList.remove('visible');
      return;
    }

    setTimeout(function () {
      var r = target.getBoundingClientRect();
      var pad = 8;
      _spotlightEl.style.left   = (r.left - pad) + 'px';
      _spotlightEl.style.top    = (r.top  - pad) + 'px';
      _spotlightEl.style.width  = (r.width  + pad * 2) + 'px';
      _spotlightEl.style.height = (r.height + pad * 2) + 'px';
      _spotlightEl.classList.add('visible');

      // Position tooltip below or above
      var tipTop = r.bottom + pad + 12;
      var tipLeft = r.left;
      if (tipTop + 100 > window.innerHeight) {
        tipTop = r.top - 100 - pad;
      }
      if (tipLeft + 280 > window.innerWidth) {
        tipLeft = window.innerWidth - 296;
      }
      _tooltipEl.style.top  = tipTop + 'px';
      _tooltipEl.style.left = tipLeft + 'px';
      _tooltipEl.innerHTML = '<div class="cvt-tooltip-title">' + step.label + '</div>'
                           + '<div class="cvt-tooltip-body">' + step.desc.substring(0, 100) + '…</div>';
      _tooltipEl.classList.add('visible');

      // Punch hole at target element
      _punchHole(target);
    }, 50);
  }

  // ── Audio toggle ──────────────────────────────────────────────────────────
  function _updateAudioToggle() {
    var btn = document.getElementById('cvtAudioToggle');
    if (!btn) return;
    btn.textContent = _isMuted() ? '🔇' : '🔊';
    btn.title = _isMuted() ? 'Enable sound' : 'Mute sound';
  }

  // ── Video ─────────────────────────────────────────────────────────────────
  function _openVideo(key) {
    var modal = document.getElementById('cvtVideoModal');
    var frame = document.getElementById('cvtVideoFrame');
    if (!modal || !frame) return;

    var messages = {
      micro:    'Micro Challenge: a short, focused coding exercise designed to isolate one skill.<br><br>You\'ll see the problem, write your solution, and get immediate unit test feedback.<br><br><em>(Video content coming soon)</em>',
      feedback: 'Immediate Feedback: as soon as you submit, every unit test runs instantly and you see exactly which passed, which failed, and why.<br><br><em>(Video content coming soon)</em>',
      dashboard:'The Performance Dashboard builds as you practice — breadth, depth, convergence heatmap, and your Codivium Score — showing you where to focus next.<br><br><em>(Video content coming soon)</em>',
    };

    frame.innerHTML = '<div style="width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;padding:32px;box-sizing:border-box;background:var(--color-bg-surface-2,#0a0a0c);font-size:15px;line-height:1.7;color:var(--color-text-secondary,rgba(245,245,252,0.8));text-align:center">'
                    + (messages[key] || 'Video content coming soon')
                    + '</div>';
    modal.classList.add('open');
    _playTone(440, 0.18, 'sine', 0.05);
  }

  function _closeVideo() {
    var modal = document.getElementById('cvtVideoModal');
    if (modal) modal.classList.remove('open');
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function _next() {
    if (_current === STEPS.length - 1) {
      _complete();
      return;
    }
    _renderStep(_current + 1, 'forward');
  }

  function _back() {
    if (_current === 0) return;
    _renderStep(_current - 1, 'back');
  }

  function _skip() {
    _dismiss(false);
  }

  function _complete() {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) {}
    _chimeComplete();
    _dismiss(true);

    // Scroll the real adaptive orientation form into view and highlight it
    setTimeout(function () {
      document.dispatchEvent(new CustomEvent('cv:tour-complete', { detail: {} }));
      var orientCard = document.querySelector('.ap-orientation-card');
      if (orientCard) {
        // Smooth scroll to the form
        orientCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief pulse to draw the eye
        orientCard.classList.add('cvt-orient-pulse');
        setTimeout(function () {
          orientCard.classList.remove('cvt-orient-pulse');
          // Focus the first unanswered option button
          var firstBtn = orientCard.querySelector('.ap-diag-opt:not(.selected)');
          if (firstBtn) firstBtn.focus();
        }, 800);
      }
    }, 450);
  }

  function _dismiss(completed) {
    if (!_overlayEl) return;

    // 1. Mark as not visible immediately so keyboard handler ignores events
    _isVisible = false;
    document.body.classList.remove('cv-tour-open');

    // 2. Clear all overlay layers (dim + clear + clip-path on backdrop)
    try { _removeLayers(); } catch (e) {}

    // 3. Hide the main overlay (opacity → 0, pointer-events → none via CSS)
    _overlayEl.classList.remove('cvt-visible');
    // Belt-and-braces: force pointer-events off inline in case CSS specificity loses
    _overlayEl.style.pointerEvents = 'none';

    // 4. Hide spotlight + tooltip immediately
    if (_spotlightEl) {
      _spotlightEl.classList.remove('visible');
      _spotlightEl.style.opacity = '0';
    }
    if (_tooltipEl) {
      _tooltipEl.classList.remove('visible');
      _tooltipEl.style.opacity = '0';
    }

    // 5. Persist skip/complete state
    if (!completed) {
      try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) {}
    }

    // 6. Remove DOM nodes after the CSS transition finishes (0.4s + buffer)
    setTimeout(function () {
      try {
        if (_spotlightEl && _spotlightEl.parentNode) {
          _spotlightEl.parentNode.removeChild(_spotlightEl);
        }
        if (_tooltipEl && _tooltipEl.parentNode) {
          _tooltipEl.parentNode.removeChild(_tooltipEl);
        }
      } catch (_) {}
      _spotlightEl = null;
      _tooltipEl   = null;
    }, 500);
  }

  // ── Event wiring ──────────────────────────────────────────────────────────
  function _wireEvents() {
    var el = _overlayEl;
    if (!el) return;

    el.addEventListener('click', function (e) {
      var t = e.target;
      if (t.id === 'cvtNextBtn' || t.closest('#cvtNextBtn')) { _next(); return; }
      if (t.id === 'cvtBackBtn' || t.closest('#cvtBackBtn')) { _back(); return; }
      if (t.id === 'cvtSkipBtn' || t.closest('#cvtSkipBtn')) { _skip(); return; }
      if (t.id === 'cvtAudioToggle' || t.closest('#cvtAudioToggle')) {
        try {
          localStorage.setItem(AUDIO_KEY, _isMuted() ? '0' : '1');
        } catch (_) {}
        _updateAudioToggle();
        if (!_isMuted()) { _playTone(523, 0.2, 'sine', 0.07); }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!_isVisible) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') _next();
      if (e.key === 'ArrowLeft')  _back();
      if (e.key === 'Escape')     _skip();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function _start(forceShow) {
    // Resume audio context if needed (user gesture)
    var ctx = _getAudioCtx();
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (_) {} }

    if (!_overlayEl) { _buildOverlay(); }
    _current = 0;
    _formAnswers = {};

    // Restore form answers if user resumes
    try {
      var saved = localStorage.getItem(ONBOARD_KEY);
      if (saved) { _formAnswers = JSON.parse(saved); }
    } catch (_) {}

    _renderStep(0, 'forward');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        _overlayEl.classList.add('cvt-visible');
        document.body.classList.add('cv-tour-open');
        _isVisible = true;
        _chimeOpen();
      });
    });
  }

  function _hasCompletedTour() {
    try { return localStorage.getItem(TOUR_KEY) === '1'; } catch (_) { return false; }
  }

  function _isNewUser() {
    // Same hasRealToken check used throughout the platform
    try {
      var token = sessionStorage.getItem('cv_auth_token') || localStorage.getItem('cv_auth_token');
      // New user = no token (demo/pre-auth) OR explicit new-user flag
      return !token;
    } catch (_) { return true; }
  }

  // ── Auto-start logic ──────────────────────────────────────────────────────
  function _autoStart() {
    // Only auto-start if:
    // 1. On the adaptive-practice page
    // 2. Tour not already completed/skipped
    // 3. User has no data (is new user)
    if (_hasCompletedTour()) return;
    if (!_isNewUser()) return;

    // Slight delay so the page renders first
    setTimeout(function () { _start(); }, 900);
  }

  // ── Topbar trigger button ─────────────────────────────────────────────────
  function _applyTourBtnPref() {
    var btn = document.getElementById('cvTourTriggerBtn');
    if (!btn) return;
    var show = true;
    try { show = localStorage.getItem('show_tour_btn') !== '0'; } catch (_) {}
    btn.style.display = show ? '' : 'none';
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function _addSidebarTrigger() {
    var btn = document.getElementById('cvTourTriggerBtn');
    if (!btn) return;

    _applyTourBtnPref();

    // Re-apply when pref changes in another tab (standard storage event)
    window.addEventListener('storage', function (e) {
      if (e.key === 'show_tour_btn') _applyTourBtnPref();
    });
    // Re-apply when pref changes in the same tab (custom event)
    document.addEventListener('cv:pref-change', function (e) {
      if (e.detail && e.detail.key === 'show_tour_btn') _applyTourBtnPref();
    });

    if (!btn._cvTourBound) {
      btn.addEventListener('click', function () { _start(true); });
      btn._cvTourBound = true;
    }

    // Flash border once on load (only if visible)
    var showNow = true;
    try { showNow = localStorage.getItem('show_tour_btn') !== '0'; } catch (_) {}
    if (showNow && !btn._cvFlashDone) {
      btn._cvFlashDone = true;
      setTimeout(function () {
        btn.classList.add('cvt-flash');
        btn.addEventListener('animationend', function () {
          btn.classList.remove('cvt-flash');
        }, { once: true });
      }, 1200);
    }
  }

  // ── Initialise ────────────────────────────────────────────────────────────
  function _init() {
    _addSidebarTrigger();
    _autoStart();
  }

  // Expose public API
  window.CodiviumTour = {
    start:       function () { _start(true); },
    dismiss:     _dismiss,
    isCompleted: _hasCompletedTour,
    reset:       function () {
      try {
        localStorage.removeItem(TOUR_KEY);
        localStorage.removeItem(ONBOARD_KEY);
      } catch (_) {}
    },
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
