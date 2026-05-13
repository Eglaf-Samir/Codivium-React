// PublicWrapper.jsx — wraps all public pages
// Injects/removes the correct CSS and resets body state
import React, { useLayoutEffect } from 'react';
import { useCssLoader, prewarmCss } from '../hooks/useCssLoader.js';

// CSS shared by ALL public pages
const BASE_CSS = [
  '/assets/css/fonts-local.588ad1fe.css',
  '/assets/css/components/site-settings.css',
  '/assets/css/codivium-core.04136018.css',
  '/assets/css/components/topbar.3757acfd.css',
  '/assets/css/components/topbar-normalization.css',
  '/assets/css/components/cube.73ae0dd9.css',
];

// Map of page → additional CSS files
export const PAGE_CSS = {
  landing:        ['/assets/css/landing.5d57535b.css',
                   '/assets/css/components/landing-stability.css',
                   '/assets/css/components/section4-coverflow.css',
                   '/assets/components/codivium-constellation/codivium-constellation.ffeeb29b.css'],
  join:           ['/assets/css/components/watermark.c83fb1f0.css',
                   '/assets/css/components/forms-theme.unified.css',
                   '/assets/css/pages/join.fb76c4f9.css'],
  login:          ['/assets/css/components/watermark.c83fb1f0.css',
                   '/assets/css/components/forms-theme.unified.css',
                   '/assets/css/pages/login.3cd22354.css'],
  pricing:        ['/assets/css/components/watermark.c83fb1f0.css',
                   '/assets/css/components/forms-theme.unified.css',
                   '/assets/css/pages/pricing.d58fcdbd.css'],
  faq:            ['/assets/css/pages/faq.c23630f9.css'],
  contact:        ['/assets/css/components/watermark.c83fb1f0.css',
                   '/assets/css/components/forms-theme.unified.css',
                   '/assets/css/pages/contact.6f9ec9aa.css'],
  articles:       ['/assets/css/pages/articles.5a4b5f2f.css',
                   '/assets/css/components/content-pages-normalization.css'],
  article:        ['/assets/css/pages/article.45dd6e0a.css',
                   '/assets/css/components/content-pages-normalization.css'],
  legal:          ['/assets/css/pages/legal.63bdbd7d.css'],
  password_reset: ['/assets/css/components/watermark.c83fb1f0.css',
                   '/assets/css/components/forms-theme.unified.css',
                   '/assets/css/pages/password_reset.0e1fe29f.css'],
  forget_password:['/assets/css/components/watermark.c83fb1f0.css',
                   '/assets/css/components/forms-theme.unified.css',
                   '/assets/css/pages/password_reset.0e1fe29f.css'],
};

// App body classes that must be removed on public pages
const APP_CLASSES = [
  'sidebar-collapsed','mcq-quiz','mcq-parent','cv-settings','drawer-collapsed','cv-app',
];

// Prewarm at module load time — every public-page CSS file starts fetching
// the moment this module is imported, which happens before React even
// renders the first route. Each file is `body[data-page="…"]` scoped so
// loading them all is inert until the right data-page activates. By the
// time the user clicks a navlink, the target page's CSS is already parsed
// and in <head>; useState's lazy init below returns true immediately and
// the page mounts fully styled — no blank, no FOUC.
prewarmCss(Array.from(
  new Set([...BASE_CSS, ...Object.values(PAGE_CSS).flat()]),
));

export default function PublicWrapper({ page, children }) {
  const extraCss = PAGE_CSS[page] || [];
  const cssReady = useCssLoader([...BASE_CSS, ...extraCss]);

  // useLayoutEffect runs before the browser paints, so the body class /
  // data-page attribute is correct for the very first frame of the new
  // page — no flash of the old page's scoped styles.
  useLayoutEffect(() => {
    APP_CLASSES.forEach(c => document.body.classList.remove(c));
    document.body.setAttribute('data-page', page);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    return () => {
      document.body.removeAttribute('data-page');
      document.body.style.overflow = '';
    };
  }, [page]);

  // Only hide the page on cold cache — on the very first visit to any
  // public page in a fresh session, give CSS a chance to land before we
  // paint. Once anything is cached (post-prewarm), cssReady is true on
  // the first render and the children show without a blank frame.
  if (!cssReady) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }
  return <>{children}</>;
}
