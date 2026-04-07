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
  // core helpers -> logo -> sidebar -> global -> Chart.js -> dashboard parts
  scripts.push(absOrRel('assets/components/logo/brand-cube.js'));
  scripts.push(absOrRel('assets/components/sidebar/sidebar.js'));
  scripts.push(absOrRel('assets/components/core/telemetry.js'));
  scripts.push(absOrRel('assets/components/core/global.js'));
  // Chart.js (local-first, CDN fallback)
  scripts.push({
    src: absOrRel('assets/vendor/chartjs/chart.umd.min.js'),
    fallback: allowCdn ? {
      primary: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
      // NOTE: SRI intentionally omitted here because this package supports
      // multiple CDN fallbacks. For strict environments, prefer running
      // ./scripts/fetch_vendor_deps.sh and keeping data-cv-allow-cdn="false".
      crossorigin: 'anonymous',
      referrerPolicy: 'no-referrer',
      fallback: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js'
    } : null
  });
  function injectStylesheetLocalFirst(localHref, cdnHref, integrity) {
    try {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = localHref;
      link.onerror = function(){
        if (!allowCdn) return;
        try {
          link.onerror = null;
          link.href = cdnHref;
          if (integrity) link.integrity = integrity;
          link.crossOrigin = 'anonymous';
          link.referrerPolicy = 'no-referrer';
        } catch(_e) {}
      };
      document.head.appendChild(link);
    } catch(_e) {}
  }

  if (wantsKatex) {
    injectStylesheetLocalFirst(
      absOrRel('assets/vendor/katex/katex.min.css'),
      'https://cdn.jsdelivr.net/npm/katex@0.16.33/dist/katex.min.css',
      'sha384-fgYS3VC1089n2J3rVcEbXDHlnDLQ9B2Y1hvpQ720q1NvxCduQqT4JoGc4u2QCnzE'
    );

    scripts.push({
      src: absOrRel('assets/vendor/katex/katex.min.js'),
      fallback: allowCdn ? {
        primary: 'https://cdn.jsdelivr.net/npm/katex@0.16.33/dist/katex.min.js',
        integrity: 'sha384-YPHNAPyrxGS8BNnA7Q4ommqra8WQPEjooVSLzFgwgs8OXJBvadbyvx4QpfiFurGr',
        crossorigin: 'anonymous',
        referrerPolicy: 'no-referrer'
      } : null
    });
    scripts.push({
      src: absOrRel('assets/vendor/katex/contrib/auto-render.min.js'),
      fallback: allowCdn ? {
        primary: 'https://cdn.jsdelivr.net/npm/katex@0.16.33/dist/contrib/auto-render.min.js',
        integrity: 'sha384-JKXHIJf8PKPyDFptuKZoUyMRQJAmQKj4B4xyOca62ebJhciMYGiDdq/9twUUWyZH',
        crossorigin: 'anonymous',
        referrerPolicy: 'no-referrer'
      } : null
    });
  }

  // Dashboard (bundled into one module-scope file to avoid global leakage)
  scripts.push(absOrRel('assets/components/dashboard/js/dashboard.bundle.js'));

  loadSequential(scripts, 0);
})();