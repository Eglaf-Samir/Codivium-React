/**
 * route-config.js
 * ============================================================
 * Environment-aware route configuration for Codivium pages.
 *
 * OWNER: Route/link management for all package HTML pages
 * DOES NOT OWN: Any page content or navigation chrome
 * STATUS: DEPLOY — include in production build
 *
 * USAGE
 * -----
 * Include this script in any page that needs environment-aware
 * link resolution:
 *
 *   <script src="assets/components/core/route-config.js"></script>
 *
 * Then call:
 *   CVD.routes.resolve("landing")  // → "/" in prod, "landing.html" in local
 *
 * OVERRIDE PER ENVIRONMENT
 * ------------------------
 * Before this script loads, set window.__CVD_ROUTES to override
 * individual routes. Your server can inject this at render time:
 *
 *   <script>
 *     window.__CVD_ROUTES = {
 *       landing:  "/",
 *       articles: "/blog",
 *       pricing:  "/plans"
 *     };
 *   </script>
 *
 * ROUTE TYPES
 * -----------
 * SITE_ROUTE     — served by application server; .html stubs exist for local dev
 * PACKAGE_PAGE   — part of this package; same path in all environments
 * ============================================================
 */

(function () {
  "use strict";

  var CVD = window.CVD = window.CVD || {};

  /**
   * Default route table.
   *
   * Keys are logical route names.
   * Values are the default hrefs (local dev / file:// / package context).
   *
   * In production, override with window.__CVD_ROUTES before this script loads.
   */
  var DEFAULTS = {
    // ── Site-level routes (application server) ─────────────────
    // Default: .html stub (local dev). Override: bare path or full URL.
    landing:    "landing.html",    // → "/" or "/home" in production
    articles:   "articles.html",   // → "/articles" or "/blog"
    pricing:    "pricing.html",    // → "/pricing" or "/plans"
    contact:    "contact.html",    // → "/contact"
    faq:        "faq.html",        // → "/faq" or "/help"

    // ── Package runtime pages (same in all environments) ────────
    dashboard:  "codivium_insights_embedded.html",
    settings:   "dashboard_view_settings.html",
    editor:     "editor.html",

    // ── Package demo/stub pages ──────────────────────────────────
    login:      "login.html",
    join:       "join.html",
    menu:       "menu-page.html",
  };

  /**
   * Merge server/environment overrides with defaults.
   * window.__CVD_ROUTES may be set by server-rendered script before this loads.
   */
  var ROUTES = Object.assign({}, DEFAULTS, window.__CVD_ROUTES || {});

  /**
   * Resolve a logical route name to an href.
   * Falls back to the raw name if not found (safe pass-through).
   *
   * @param {string} name  Logical route key (e.g. "landing", "dashboard")
   * @returns {string}     href suitable for use in <a href="...">
   */
  function resolve(name) {
    return ROUTES[name] || name;
  }

  /**
   * Rewrite all [data-route] attributes in the document to their resolved hrefs.
   * Call this once on DOMContentLoaded.
   *
   * Usage in HTML:
   *   <a data-route="landing" href="landing.html">Home</a>
   *
   * After rewrite, href is replaced with the resolved route.
   * The data-route attribute is preserved for debugging.
   */
  function rewriteLinks() {
    var anchors = document.querySelectorAll("a[data-route]");
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var routeName = a.getAttribute("data-route");
      if (routeName) {
        a.href = resolve(routeName);
      }
    }
  }

  /**
   * Override one or more routes at runtime.
   * Useful for SPA contexts that resolve routes differently per page.
   *
   * @param {Object} overrides  Map of route name → href
   */
  function override(overrides) {
    Object.assign(ROUTES, overrides || {});
  }

  /**
   * Get the current resolved route table (read-only copy).
   */
  function getAll() {
    return Object.assign({}, ROUTES);
  }

  // Auto-rewrite on DOMContentLoaded if the document is still loading.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rewriteLinks);
  } else {
    rewriteLinks();
  }

  CVD.routes = {
    resolve:    resolve,
    rewrite:    rewriteLinks,
    override:   override,
    getAll:     getAll,
    _defaults:  DEFAULTS,
    _routes:    ROUTES,
  };

})();
