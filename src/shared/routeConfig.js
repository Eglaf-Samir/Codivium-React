// src/shared/routeConfig.js
// Environment-aware route configuration. Converted from route-config.js.
// Import as a side-effect in each bundle main — rewrites [data-route] links.

const DEFAULTS = {
  landing:   'landing.html',
  articles:  'articles.html',
  pricing:   'pricing.html',
  contact:   'contact.html',
  faq:       'faq.html',
  dashboard: 'codivium_insights_embedded.html',
  settings:  'dashboard_view_settings.html',
  editor:    'editor.html',
  login:     'login.html',
  join:      'join.html',
  menu:      'menu-page.html',
};

const ROUTES = Object.assign({}, DEFAULTS, window.__CVD_ROUTES || {});

export function resolve(name) { return ROUTES[name] || name; }

export function rewriteLinks() {
  document.querySelectorAll('a[data-route]').forEach(a => {
    const name = a.getAttribute('data-route');
    if (name) a.href = resolve(name);
  });
}

export function override(overrides) { Object.assign(ROUTES, overrides || {}); }
export function getAll() { return Object.assign({}, ROUTES); }

// Expose on CVD for any vanilla callers
window.CVD = window.CVD || {};
window.CVD.routes = { resolve, rewrite: rewriteLinks, override, getAll, _routes: ROUTES };

// Auto-rewrite on DOMContentLoaded
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rewriteLinks);
else rewriteLinks();
