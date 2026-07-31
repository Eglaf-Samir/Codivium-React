// useCssLoader.js — injects <link> tags for page-specific CSS, then reports
// when every stylesheet has actually parsed via link.onload. Wrappers can
// gate their first paint on the returned `ready` flag to avoid the flash of
// unstyled content (FOUC) you'd otherwise see between commit and CSS load.
// Once a stylesheet is loaded it stays in <head> for the rest of the session,
// so revisits are instant — re-removing/re-adding a <link> triggers a parse
// stall that itself causes a flash.
import { useEffect, useState } from 'react';

const cache = new Map(); // href → { el, loaded, waiters: Set<fn> }

function ensureEntry(href) {
  let entry = cache.get(href);
  if (entry) return entry;
  const el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = href;
  el.setAttribute('data-public-css', '1');
  entry = { el, loaded: false, waiters: new Set() };
  const finish = () => {
    entry.loaded = true;
    entry.waiters.forEach((fn) => fn());
    entry.waiters.clear();
  };
  el.addEventListener('load', finish, { once: true });
  el.addEventListener('error', finish, { once: true });
  document.head.appendChild(el);
  cache.set(href, entry);
  return entry;
}

// Eager-load a set of stylesheets without subscribing to their ready state.
// Used at app boot to prime every public-page stylesheet so the first
// navigation to each page is instant (no FOUC, no network wait). The CSS
// files are scoped by `body[data-page="…"]`, so loading them all up front
// is safe — only the rules matching the current data-page apply.
export function prewarmCss(hrefs) {
  (hrefs || []).forEach((href) => ensureEntry(href));
}

// `evict` (default false): when true, the <link> tags are removed from
// <head> when the component unmounts. Use this for pages whose CSS uses
// unscoped selectors that would leak onto other routes (e.g. MCQ pages —
// `.control`, `.divider`, `.summary` etc. collide with Contact/Articles).
// Most public pages should leave evict=false so revisits are flash-free.
export function useCssLoader(hrefs, { evict = false } = {}) {
  const list = hrefs || [];
  const [ready, setReady] = useState(() =>
    list.every((h) => cache.get(h)?.loaded),
  );

  useEffect(() => {
    if (!list.length) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const pending = new Set();

    const tick = (href) => {
      if (cancelled) return;
      pending.delete(href);
      if (pending.size === 0) setReady(true);
    };

    list.forEach((href) => {
      const entry = ensureEntry(href);
      if (!entry.loaded) {
        pending.add(href);
        entry.waiters.add(() => tick(href));
      }
    });

    setReady(pending.size === 0);

    return () => {
      cancelled = true;
      if (evict) {
        list.forEach((href) => {
          const entry = cache.get(href);
          if (entry?.el?.parentNode) entry.el.parentNode.removeChild(entry.el);
          cache.delete(href);
        });
      }
      // Otherwise: keep the <link> tags cached so subsequent visits
      // to the same page are flash-free.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.join(','), evict]);

  return ready;
}
