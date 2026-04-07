/* account-settings-demo.js
 * ─────────────────────────────────────────────────────────────────
 * Seeds localStorage with realistic demo data so the Account &
 * Settings page renders fully populated when opened as a demo.
 *
 * Runs before account-settings.js so the page reads the seeded
 * values on first load.
 *
 * To reset the demo back to empty state, open the browser console
 * and run: CodiviumSettingsDemo.reset()
 * ─────────────────────────────────────────────────────────────────*/
(function () {
  'use strict';

  /* ── Demo data ──────────────────────────────────────────────── */
  var DEMO = {
    /* Profile */
    cv_profile_name:  'Alex Thornton',
    cv_profile_email: 'alex.thornton@example.com',   /* displayed in JS */

    /* Notifications — mix of on/off to show both states */
    notif_weekly_summary: '0',
    notif_milestones:     '1',
    notif_in_app:         '1',
    notif_marketing:      '0',

    /* Appearance */
    cv_syntax_theme:  'obsidian-code',
    cv_ws_theme:      'original',
    as_dash_layout:   'full',
    reduce_motion:    '0',

    /* Dashboard layout (read by dashboard.js) */
    cv_active_mode: 'full',

    /* Active tab — open on Account by default */
    as_active_tab: 'account',

    /* Plan — read by loadPlan() stub, injected via window.
     * Uses the same shape as the live GET /api/user/subscription response.
     * Change tier to 'free' | 'weekly' | 'monthly' | 'annual' to test different states. */
    _demo_plan: JSON.stringify({
      tier:       'monthly',
      tierLabel:  'Monthly',
      autoRenews: true,
      expiresAt:  null,
      renewsAt:   '2026-04-22T00:00:00Z',
      dateLabel:  'Renews 22 April 2026',
      card:       'Visa ending 4242',
      discount:   null,
    }),

    /* Billing history — injected via window */
    _demo_invoices: JSON.stringify([
      { date: '22 Mar 2026', desc: 'Codivium Monthly',       amount: '£14.99', url: '#' },
      { date: '22 Feb 2026', desc: 'Codivium Monthly',       amount: '£14.99', url: '#' },
      { date: '22 Jan 2026', desc: 'Codivium Monthly',       amount: '£14.99', url: '#' },
      { date: '22 Dec 2025', desc: 'Codivium Monthly',       amount: '£14.99', url: '#' },
    ]),
  };

  /* Seed localStorage — only set keys not already saved by the user */
  try {
    var _preserveKeys = ['as_dash_layout','cv_site_theme','cv_syntax_theme','cv_ws_theme',
                         'reduce_motion','cv_drawer_speed','cv_editor_font_size',
                         'cv_repl_font_size','cv_instructions_font_size',
                         'cv_editor_font_family','cv_repl_font_family',
                         'cv_instructions_font_family','as_active_tab',
                         'notif_weekly_summary','notif_milestones',
                         'notif_in_app','notif_marketing'];
    for (var key in DEMO) {
      if (key.charAt(0) !== '_') {
        // Preserve user-set preference keys; always seed profile/billing data
        var isPreferenceKey = _preserveKeys.indexOf(key) !== -1;
        if (!isPreferenceKey || localStorage.getItem(key) === null) {
          localStorage.setItem(key, DEMO[key]);
        }
      }
    }
  } catch (e) { /* localStorage unavailable — demo still runs */ }

  /* Expose demo plan and invoices on window so account-settings.js
     can read them in its stub loadPlan() / loadBilling() functions */
  window.CODIVIUM_DEMO_PLAN     = JSON.parse(DEMO._demo_plan);
  window.CODIVIUM_DEMO_INVOICES = JSON.parse(DEMO._demo_invoices);
  window.CODIVIUM_DEMO_EMAIL    = DEMO.cv_profile_email;

  /* ── Public reset helper ─────────────────────────────────────── */
  window.CodiviumSettingsDemo = {
    reset: function () {
      var keys = Object.keys(DEMO).filter(function (k) { return k.charAt(0) !== '_'; });
      keys.forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) {}
      });
      ['CODIVIUM_DEMO_PLAN','CODIVIUM_DEMO_INVOICES','CODIVIUM_DEMO_EMAIL'].forEach(function(k){
        delete window[k];
      });
      console.log('[Codivium] Settings demo data cleared. Reload to see empty state.');
    },
  };

}());
