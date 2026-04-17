(function () {
  'use strict';

  // -----------------------------
  // Element.closest() polyfill
  // -----------------------------
  if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;
      if (!document.documentElement.contains(el)) return null;
      do {
        if (el.matches ? el.matches(s) :
            el.msMatchesSelector ? el.msMatchesSelector(s) :
            el.webkitMatchesSelector ? el.webkitMatchesSelector(s) : false) {
          return el;
        }
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // -----------------------------
  // String.replaceAll() polyfill
  // (supports string search; RegExp supported if it's global)
  // -----------------------------
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search, replacement) {
      var str = String(this);
      if (search && Object.prototype.toString.call(search) === '[object RegExp]') {
        if (!search.global) {
          throw new TypeError('replaceAll must be called with a global RegExp');
        }
        return str.replace(search, replacement);
      }
      return str.split(String(search)).join(String(replacement));
    };
  }

  // -----------------------------
  // ResizeObserver polyfill (lightweight)
  // - Observes size changes via RAF polling + window resize.
  // - Good enough for chart re-render triggers.
  // -----------------------------
  if (!window.ResizeObserver) {
    // A low-overhead ResizeObserver polyfill:
    // - Polls at a low frequency when stable, speeds up briefly when changes occur.
    // - Stops when there are no observed elements.
    // - Backs off when the tab is hidden.
    function ResizeObserver(callback) {
      this._cb = callback;
      this._elements = [];
      this._sizes = [];
      this._timer = null;
      this._intervalMs = 250;
      this._fastMs = 80;
      this._slowMs = 250;
      this._hiddenMs = 1000;
      this._tick = this._tick.bind(this);

      var self = this;
      this._onResize = function () { self._schedule(true); };
      this._onVis = function () { self._schedule(true); };
      window.addEventListener('resize', this._onResize);
      document.addEventListener('visibilitychange', this._onVis);
    }

    ResizeObserver.prototype.observe = function (el) {
      if (!el) return;
      for (var i = 0; i < this._elements.length; i++) {
        if (this._elements[i] === el) return;
      }
      this._elements.push(el);
      this._sizes.push({ w: el.clientWidth, h: el.clientHeight });
      this._schedule(true);
    };

    ResizeObserver.prototype.unobserve = function (el) {
      for (var i = 0; i < this._elements.length; i++) {
        if (this._elements[i] === el) {
          this._elements.splice(i, 1);
          this._sizes.splice(i, 1);
          break;
        }
      }
      if (!this._elements.length) this._stop();
    };

    ResizeObserver.prototype.disconnect = function () {
      this._elements = [];
      this._sizes = [];
      this._stop();
      window.removeEventListener('resize', this._onResize);
      document.removeEventListener('visibilitychange', this._onVis);
    };

    ResizeObserver.prototype._stop = function () {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    };

    ResizeObserver.prototype._schedule = function (forceFast) {
      if (!this._elements.length) { this._stop(); return; }
      if (forceFast) this._intervalMs = this._fastMs;
      if (this._timer) return;
      var self = this;
      var delay = (document && document.hidden) ? this._hiddenMs : this._intervalMs;
      this._timer = setTimeout(function () {
        self._timer = null;
        self._tick();
      }, delay);
    };

    ResizeObserver.prototype._tick = function () {
      if (!this._elements.length) { this._stop(); return; }

      var entries = [];
      for (var i = 0; i < this._elements.length; i++) {
        var el = this._elements[i];
        if (!el) continue;
        var w = el.clientWidth;
        var h = el.clientHeight;
        var prev = this._sizes[i];
        if (!prev || prev.w !== w || prev.h !== h) {
          this._sizes[i] = { w: w, h: h };
          entries.push({ target: el, contentRect: { width: w, height: h } });
        }
      }

      if (entries.length) {
        // stay fast briefly when changes happen
        this._intervalMs = this._fastMs;
        try { this._cb(entries, this); } catch (e) {}
        // after one fast tick, return to slow polling
        var self = this;
        setTimeout(function () { self._intervalMs = self._slowMs; }, this._fastMs);
      }

      this._schedule(false);
    };

    window.ResizeObserver = ResizeObserver;
  }
})();