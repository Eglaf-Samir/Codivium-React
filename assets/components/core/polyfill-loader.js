(function () {
  'use strict';

  // Resolve the base URL from the location of THIS script so the dashboard works
  // whether the HTML is opened from the project root or a subfolder (e.g. /demo).
  function resolveAssetBase() {
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i] && scripts[i].src ? String(scripts[i].src) : '';
        if (!src) continue;
        if (src.indexOf('polyfill-loader.js') === -1) continue;
        // Expected location: .../assets/components/core/polyfill-loader.js
        // Base becomes: .../
        var base = src.replace(/assets\/components\/core\/polyfill-loader\.js(\?.*)?$/i, '');
        // Fallback: if the expected pattern didn't match, strip the filename.
        if (base === src) {
          var q = base.indexOf('?');
          if (q >= 0) base = base.slice(0, q);
          var idx = base.lastIndexOf('polyfill-loader.js');
          if (idx >= 0) base = base.slice(0, idx);
        }
        return base;
      }
    } catch (e) {
      // fall through
    }
    return '';
  }

  var ASSET_BASE = resolveAssetBase();
  if (ASSET_BASE && !/\/$/.test(ASSET_BASE)) ASSET_BASE += '/';

  function joinUrl(base, path) {
    if (!base) return path;
    if (!path) return base;
    if (/^https?:\/\//i.test(path)) return path;
    if (/^file:\/\//i.test(path)) return path;
    if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
    if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
    return base + path;
  }


  function absOrRel(path) {
    // Leave absolute URLs untouched.
    if (/^https?:\/\//i.test(path)) return path;
    return ASSET_BASE + path;
  }

  function hasClosest() {
    return !!(window.Element && Element.prototype && Element.prototype.closest);
  }

  function hasReplaceAll() {
    return typeof String.prototype.replaceAll === 'function';
  }

  function hasResizeObserver() {
    return typeof window.ResizeObserver === 'function';
  }

  function needsPolyfills() {
    return !hasResizeObserver() || !hasClosest() || !hasReplaceAll();
  }

  function loadScript(item, done) {
    var src = (typeof item === 'string') ? item : (item && (item.src || item.primary)) ? (item.src || item.primary) : '';
    var fallback = (typeof item === 'object' && item) ? (item.fallback || null) : null;
    var integrity = (typeof item === 'object' && item) ? (item.integrity || '') : '';
    var crossorigin = (typeof item === 'object' && item) ? (item.crossorigin || '') : '';
    var referrerPolicy = (typeof item === 'object' && item) ? (item.referrerPolicy || '') : '';
    if (!src) { done(); return; }

    var s = document.createElement('script');
    s.src = src;
    s.async = false; // preserve order
    if (integrity) s.integrity = integrity;
    if (crossorigin) s.crossOrigin = crossorigin;
    if (referrerPolicy) s.referrerPolicy = referrerPolicy;
    s.onload = function () { done(); };
    s.onerror = function () {
      if (fallback) {
        loadScript(fallback, done);
      } else {
        done();
      }
    };
    document.head.appendChild(s);
  }

  function loadSequential(list, i) {
    if (i >= list.length) return;
    loadScript(list[i], function () {
      loadSequential(list, i + 1);
    });
  }


  // Environment flags (CSP/security): allow CDN fallbacks only when explicitly enabled
  var docEl = document.documentElement;
  var bodyEl = document.body;
  var allowCdn = false;
  var wantsKatex = false;
  try {
    allowCdn = (docEl && docEl.getAttribute('data-cv-allow-cdn') === 'true') || (bodyEl && bodyEl.getAttribute('data-cv-allow-cdn') === 'true');
    wantsKatex = (docEl && docEl.getAttribute('data-cv-katex') === 'true') || (bodyEl && bodyEl.getAttribute('data-cv-katex') === 'true');
  } catch(e) {}

  var scripts = [];

  if (needsPolyfills()) {
    scripts.push(absOrRel('assets/components/core/polyfills.js'));
  }

  // Load app scripts in a known order:
  // brand-cube (logo animation) + telemetry only.
  // global.js and sidebar.js are intentionally omitted here:
  // src/insights/main.jsx calls initGlobal() + initSidebar() after mounting,
  // so loading them again here would cause duplicate initialisation.
  scripts.push(absOrRel('assets/components/logo/brand-cube.js'));
  scripts.push(absOrRel('assets/components/core/telemetry.js'));
  // Chart.js is bundled directly into insights-dashboard.bundle.js
  // (vite.config.insights.js: external:[]) so no separate load is needed here.

  loadSequential(scripts, 0);
})();