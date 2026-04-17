/* ============================================================
 * editor-page.state-model.md — State Model Reference
 *
 * This is a documentation artefact, not runtime code.
 *
 * STATE LAYERS (5 layers, listed from most persistent to most transient)
 * ============================================================
 *
 * 1. PERSISTENT USER PREFERENCES (localStorage, survives page reload)
 *    Key:   cv_exercise_id
 *    Owner: editor-page.loader.js
 *    What:  Last loaded exercise ID
 *
 *    Key:   cv_lock_cfg
 *    Owner: editor-page.locks.js
 *    What:  Lock thresholds config (set by admin controls)
 *
 *    Key:   cv_submission_count
 *    Owner: editor-page.locks.js
 *    What:  Submission count for current session / exercise
 *
 *    Key:   cv_ws_sizes
 *    Owner: editor-page.layout.js (cvd-splitters)
 *    What:  Pane sizes { topPx, leftPx, replLeftPx } in px
 *
 * 2. SERVER-LOADED EXERCISE STATE (window globals, set on page load)
 *    window.__CODIVIUM_EXERCISE_DATA__   — SSR-injected exercise payload
 *    window.__CODIVIUM_DEMO__            — dev/demo mode flag
 *    window.__cvExerciseId               — resolved exercise ID (set by loader)
 *    window.__cvExercise                 — resolved exercise object (set by editor.js)
 *
 * 3. LIVE VIEW STATE (CSS custom properties on #stage / workspace elements)
 *    --ws-left-px        workspace horizontal splitter position
 *    --ws-top-px         workspace vertical splitter position
 *    --ws-repl-left-px   REPL row splitter position
 *    --editor-font-size  code editor font size
 *    --editor-font-family
 *    --editor-font-weight
 *    --prose-font-size   prose pane font size
 *    --prose-font-family
 *    --prose-font-weight
 *
 * 4. EDITOR BUFFER STATE (CodeMirror instances)
 *    CVD.editors.candidate — CodeMirror instance for user code
 *    CVD.editors.solution  — CodeMirror instance for solution (read-only)
 *    Both accessible via window.CVD.editors
 *
 * 5. TRANSIENT UI STATE (body class list and DOM attributes)
 *    body.timer-hidden       — timer widget hidden
 *    body.sidebar-collapsed  — sidebar is collapsed
 *    body.drawer-collapsed   — sidebar starts collapsed (prevents FOUC; permanent)
 *    body.focus-editor       — code focus mode active
 *    body.focus-instructions — read focus mode active
 *    body.repl-collapsed     — REPL row hidden
 *    #stage[data-ui-theme]   — active workspace colour theme
 *    .tab-btn[data-locked]   — individual tab lock state
 *    .tab-btn[aria-selected] — active tab
 *
 * ============================================================ */
