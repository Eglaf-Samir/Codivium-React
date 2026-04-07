/* cv-font-loader.js
 * Non-blocking Google Fonts loader — appends the stylesheet link
 * after page render so it never blocks the initial paint.
 * Uses FontFace API where available for fastest loading.
 */
(function () {
  'use strict';
  var href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&display=swap';
  // Check if font is already loaded (e.g. from cache via a preconnect hint)
  if (document.querySelector('link[href*="Cinzel"]')) return;
  var link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = href;
  link.crossOrigin = 'anonymous';
  (document.head || document.documentElement).appendChild(link);
})();
