/* strings.js — Codivium i18n string table foundation
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-dependency string localisation layer.
 *
 * Usage:
 *   window.__t('dashboard.snapshot')         → "Snapshot"
 *   window.__t('adaptive.no_sessions_yet')   → "No sessions yet"
 *
 * To add a new language:
 *   1. Add a new key to window.__CV_STRINGS (e.g. 'fr': { ... })
 *   2. Set <html lang="fr"> on the page
 *   3. __t() will automatically resolve to the correct language
 *
 * Migration status: Foundation only.
 *   These strings are defined here but the calling code still uses hardcoded
 *   string literals. To migrate a file, replace each literal with __t('key').
 *   The English text is preserved as the fallback key so the UI is unchanged
 *   until a second language is added.
 *
 * Files containing most hardcoded strings (priority migration order):
 *   1. dashboard.00.core.js / dashboard.00a.utils.js  (~86 strings — metric labels, tooltips)
 *   2. dashboard.06.mcq-and-render.js                 (~44 strings — insight text, chart labels)
 *   3. adaptive-practice.js                           (~27 strings — level names, CTA labels)
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── String table ─────────────────────────────────────────────────────────
   * Each key is a dot-namespaced identifier. Values are the English default.
   * All other language objects must provide the same keys.
   */
  window.__CV_STRINGS = {

    'en': {

      /* ── Dashboard: metric labels (dashboard.00.core.js / utils.js) ────── */
      'dashboard.avg_attempts':       'Avg attempts',
      'dashboard.coverage':           'Coverage of categories tested via MCQs.',
      'dashboard.foundational':       'Foundational knowledge by category.',
      'dashboard.snapshot':           'Snapshot',
      'dashboard.breakdown':          'Breakdown',
      'dashboard.daily':              'Daily',
      'dashboard.weekly':             'Weekly',
      'dashboard.minutes':            'Minutes',
      'dashboard.share':              'Share',
      'dashboard.take_a_tour':        'Take a tour',
      'dashboard.aggregation_details':'Aggregation details',
      'dashboard.loading':            'Loading…',

      /* ── Dashboard: MCQ insight text (dashboard.06.mcq-and-render.js) ──── */
      'mcq.strongest':                'Strongest',
      'mcq.weakest':                  'Weakest',
      'mcq.intermediate':             'Intermediate',
      'mcq.advanced':                 'Advanced',
      'mcq.likely_explanation':       'Likely explanation',
      'mcq.what_to_do_next':          'What to do next',
      'mcq.overall_no_data':          'Overall MCQ: no question totals available yet.',
      'mcq.no_data':                  'No MCQ data available yet.',
      'mcq.start_session':            'Start session',

      /* ── Adaptive practice (adaptive-practice.js) ─────────────────────── */
      'adaptive.no_sessions_yet':     'No sessions yet',
      'adaptive.foundation':          'Foundation',
      'adaptive.consolidation':       'Consolidation',
      'adaptive.proficient':          'Proficient',
      'adaptive.fluent':              'Fluent',
      'adaptive.get_recommendation':  'Get my first recommendation →',
      'adaptive.not_today':           'Not today',
      'adaptive.why_this_works':      'Why this works ↓',
      'adaptive.about_5_min':         'About 5 minutes',
      'adaptive.about_20_min':        'About 20 minutes',
      'adaptive.an_hour_or_more':     'An hour or more',
      'adaptive.not_sure_yet':        'Not sure yet',

      /* ── Editor ─────────────────────────────────────────────────────────── */
      'editor.loading':               'Loading…',
      'editor.run':                   'Run',
      'editor.submit':                'Submit',
      'editor.back_to_menu':          'Back to menu',
      'editor.could_not_load':        'Could not load exercise',
      'editor.timed_out':             'Request timed out — please check your connection and retry.',
      'editor.retry':                 'Retry',

      /* ── MCQ quiz ────────────────────────────────────────────────────────── */
      'mcq_quiz.submit':              'Submit',
      'mcq_quiz.next':                'Next →',
      'mcq_quiz.back_to_setup':       'Back to Setup',
      'mcq_quiz.show_answer':         'Show Answer',
      'mcq_quiz.cancel':              'Cancel',
      'mcq_quiz.restart':             'Restart',

      /* ── Exercise menu ──────────────────────────────────────────────────── */
      'menu.loading':                 'Loading exercises…',
      'menu.could_not_load':          'Could not load exercises',
      'menu.retry':                   'Retry',
      'menu.apply_filters':           'Apply',

      /* ── Settings ────────────────────────────────────────────────────────── */
      'settings.save':                'Save',
      'settings.cancel':              'Cancel',
      'settings.upload':              'Upload',
      'settings.remove':              'Remove',
      'settings.display_name_updated':'Display name updated.',
    },

    /* ── Add additional languages here ─────────────────────────────────────
     * Example:
     * 'fr': {
     *   'dashboard.snapshot': 'Aperçu',
     *   'adaptive.foundation': 'Fondation',
     *   ...
     * },
     */

  };

  /* ── Translation helper ──────────────────────────────────────────────────
   * __t(key) → string
   * Resolves key in the active language, falling back to English, then the
   * key itself if no translation exists.
   */
  window.__t = function (key) {
    var lang = (document.documentElement.lang || 'en').split('-')[0].toLowerCase();
    var strings = window.__CV_STRINGS;
    var inLang = strings[lang] && strings[lang][key];
    if (inLang) return inLang;
    var inEn = strings['en'] && strings['en'][key];
    if (inEn) return inEn;
    // Fallback: return the key itself so the UI degrades gracefully
    return key;
  };

})();
