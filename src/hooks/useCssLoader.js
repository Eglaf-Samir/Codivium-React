// useCssLoader.js — injects <link> tags on mount, removes on unmount
// Used by ALL public pages to load their CSS without polluting the app bundle
import { useEffect } from 'react';

const cache = new Map(); // href → { el, count }

export function useCssLoader(hrefs) {
  useEffect(() => {
    if (!hrefs || !hrefs.length) return;

    hrefs.forEach(href => {
      if (cache.has(href)) {
        cache.get(href).count++;
      } else {
        const el = document.createElement('link');
        el.rel  = 'stylesheet';
        el.href = href;
        el.setAttribute('data-public-css', '1');
        document.head.appendChild(el);
        cache.set(href, { el, count: 1 });
      }
    });

    return () => {
      hrefs.forEach(href => {
        const entry = cache.get(href);
        if (!entry) return;
        entry.count--;
        if (entry.count <= 0) {
          try { document.head.removeChild(entry.el); } catch (_) {}
          cache.delete(href);
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrefs.join(',')]);
}
