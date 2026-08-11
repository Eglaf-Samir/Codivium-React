// src/utils/seo.js
// Sets document.title + standard SEO/social meta tags for the current page.
// Used by public (unauthenticated) pages so crawlers and link-preview bots
// get real per-page metadata, not a generic app-wide title.
//
// Runs client-side via useEffect (see App.jsx PubRoute), and is also what
// the build-time prerender script (scripts/prerender.mjs) captures into the
// static HTML snapshot for each public route.

const SITE_NAME = 'Codivium';
const SITE_URL = 'https://www.codivium.com'; // update if the production domain differs

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * @param {object} opts
 * @param {string} opts.title       Page-specific title (site name is appended automatically).
 * @param {string} [opts.description]
 * @param {string} [opts.path]      Path for the canonical URL, e.g. '/pricing'.
 * @param {string} [opts.type]      Open Graph type, defaults to 'website' ('article' for blog posts).
 */
export function setSeoMeta({ title, description, path, type = 'website' }) {
  if (typeof document === 'undefined') return;

  const fullTitle = title ? `${SITE_NAME} — ${title}` : SITE_NAME;
  document.title = fullTitle;

  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:title', fullTitle);
  upsertMeta('property', 'og:description', description);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', fullTitle);
  upsertMeta('name', 'twitter:description', description);

  if (path) {
    const url = SITE_URL.replace(/\/$/, '') + path;
    upsertLink('canonical', url);
    upsertMeta('property', 'og:url', url);
  }
}
