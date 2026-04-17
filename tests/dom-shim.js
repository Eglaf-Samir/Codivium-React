/**
 * dom-shim.js
 * Minimal DOM environment for testing dashboard.bundle.js in Node.js.
 * Covers only what the dashboard actually reads/writes.
 * Not a spec-compliant DOM — just enough surface area to run the tests.
 */

'use strict';

function makeElement(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    innerHTML: '',
    value: '',
    type: '',
    disabled: false,
    checked: false,
    'aria-expanded': '',
    _attrs: {},
    _style: {},
    _children: [],
    _listeners: {},
    _parent: null,
    __cvHeatmapControls: false,
    __cvBound: false,
    __cvTrackSelector: false,

    get style() {
      if (!this._style.setProperty) {
        this._style.setProperty = function(prop, val) { this[prop] = val; };
        this._style.getPropertyValue = function(prop) { return this[prop] || ''; };
        this._style.removeProperty = function(prop) { delete this[prop]; };
      }
      return this._style;
    },

    // classList
    classList: null, // set below

    getAttribute(name) { return this._attrs[name] ?? null; },
    setAttribute(name, val) { this._attrs[name] = String(val); },
    hasAttribute(name) { return name in this._attrs; },
    removeAttribute(name) { delete this._attrs[name]; },

    addEventListener(type, fn) {
      this._listeners[type] = this._listeners[type] || [];
      this._listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!this._listeners[type]) return;
      this._listeners[type] = this._listeners[type].filter(f => f !== fn);
    },
    dispatchEvent(evt) {
      const fns = this._listeners[evt.type] || [];
      fns.forEach(fn => { try { fn(evt); } catch (_) {} });
      return true;
    },

    appendChild(child) {
      if (!child) return child;
      this._children.push(child);
      child._parent = this;
      return child;
    },
    insertBefore(child, ref) {
      if (!child) return child;
      const idx = ref ? this._children.indexOf(ref) : -1;
      if (idx >= 0) this._children.splice(idx, 0, child);
      else this._children.push(child);
      child._parent = this;
      return child;
    },
    removeChild(child) {
      this._children = this._children.filter(c => c !== child);
      return child;
    },
    get parentNode() { return this._parent; },
    get firstChild() { return this._children[0] || null; },

    querySelector(sel) { return queryOne(this, sel); },
    querySelectorAll(sel) { return queryAll(this, sel); },
    closest(sel) { return closestEl(this, sel); },

    getBoundingClientRect() {
      return { width: 1200, height: 800, top: 0, left: 0, right: 1200, bottom: 800 };
    },
    focus() {},
    click() {},
  };

  // classList shim
  el.classList = {
    _el: el,
    _set: new Set(),
    add(...cls) { cls.forEach(c => { this._set.add(c); this._sync(); }); },
    remove(...cls) { cls.forEach(c => { this._set.delete(c); this._sync(); }); },
    toggle(cls, force) {
      if (force === true) this.add(cls);
      else if (force === false) this.remove(cls);
      else if (this._set.has(cls)) this.remove(cls);
      else this.add(cls);
      return this._set.has(cls);
    },
    contains(cls) { return this._set.has(cls); },
    _sync() { this._el.className = [...this._set].join(' '); },
  };

  return el;
}

// Minimal selector matching
function matchesSel(el, sel) {
  if (!sel || !el || typeof el !== 'object') return false;
  // #id
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  // .class (single)
  if (sel.startsWith('.')) {
    const cls = sel.slice(1);
    return el.classList && el.classList._set.has(cls);
  }
  // tag
  if (/^[a-z]+$/i.test(sel)) return el.tagName === sel.toUpperCase();
  // tag.class
  const m = sel.match(/^([a-z]+)\.([a-z_-]+)$/i);
  if (m) return el.tagName === m[1].toUpperCase() && el.classList && el.classList._set.has(m[2]);
  // [attr=val] or [attr]
  const a = sel.match(/^\[([^\]=]+)(?:="([^"]*)")?\]$/);
  if (a) {
    const v = el.getAttribute(a[1]);
    if (a[2] === undefined) return v !== null;
    return v === a[2];
  }
  // :not() — basic ignore
  if (sel.startsWith(':not(')) return true;
  // compound — very naive
  if (sel.includes(' ')) {
    const parts = sel.trim().split(/\s+/);
    // just check the last part
    return matchesSel(el, parts[parts.length - 1]);
  }
  return false;
}

function queryAll(root, sel) {
  const results = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node !== root && matchesSel(node, sel)) results.push(node);
    (node._children || []).forEach(walk);
  }
  walk(root);
  return results;
}

function queryOne(root, sel) {
  const all = queryAll(root, sel);
  return all[0] || null;
}

function closestEl(el, sel) {
  let cur = el;
  while (cur) {
    if (matchesSel(cur, sel)) return cur;
    cur = cur._parent;
  }
  return null;
}

// localStorage shim
function makeLocalStorage() {
  const store = {};
  return {
    getItem(k) { return store[k] !== undefined ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); },
    _store: store,
  };
}

// Build the full window/document context the bundle expects
function buildEnv() {
  const localStorage = makeLocalStorage();

  const body = makeElement('body');
  body.id = '';
  const docEl = makeElement('html');
  docEl.id = '';

  // Pre-build the DOM structure the dashboard expects
  const ciMount   = makeElement('div'); ciMount.id = 'ciMount';
  const mainGrid  = makeElement('div'); mainGrid.className = 'insightsLayout';
  const colLeft   = makeElement('div'); colLeft.className = 'colLeft';
  const colRight  = makeElement('div'); colRight.className = 'colRight';
  const infoPane  = makeElement('aside'); infoPane.id = 'infoPane'; infoPane.className = 'infoPane card';
  const infoPaneHead = makeElement('div'); infoPaneHead.className = 'infoPaneHead';
  const infoPaneCloseBtn = makeElement('button'); infoPaneCloseBtn.id = 'infoPaneCloseBtn';
  infoPaneCloseBtn.className = 'infoPaneCloseBtn';

  const heatmapPanel = makeElement('div'); heatmapPanel.className = 'heatmapPanel';
  const heatmapWrap  = makeElement('div'); heatmapWrap.className = 'heatmapWrap';
  const heatmapHead  = makeElement('div'); heatmapHead.className = 'heatmapHead';
  const heatmapBody  = makeElement('div'); heatmapBody.id = 'convergenceHeatmap';
  const depthPanel   = makeElement('div'); depthPanel.className = 'depthPanel';

  // Panel classes used by panel visibility
  const scoresPalette = makeElement('div'); scoresPalette.className = 'scoresPalette';
  const timePanel     = makeElement('div'); timePanel.className = 'timePanel';
  const donutPanel    = makeElement('div'); donutPanel.className = 'donutPanel';
  const mcqPanel      = makeElement('div'); mcqPanel.className = 'mcqPanel';

  // Dock container
  const dockContainer = makeElement('div');

  // Build DOM tree
  infoPaneHead.appendChild(infoPaneCloseBtn);
  infoPane.appendChild(infoPaneHead);
  heatmapWrap.appendChild(heatmapHead);
  heatmapWrap.appendChild(heatmapBody);
  heatmapPanel.appendChild(heatmapWrap);
  colLeft.appendChild(scoresPalette);
  colLeft.appendChild(depthPanel);
  colLeft.appendChild(heatmapPanel);
  colRight.appendChild(timePanel);
  colRight.appendChild(donutPanel);
  colRight.appendChild(mcqPanel);
  mainGrid.appendChild(colLeft);
  mainGrid.appendChild(colRight);
  mainGrid.appendChild(infoPane);
  ciMount.appendChild(mainGrid);
  body.appendChild(ciMount);
  body.appendChild(dockContainer);

  // Pre-populate named elements for getElementById
  const _byId = {
    ciMount, infoPane, infoPaneCloseBtn,
    convergenceHeatmap: heatmapBody,
    infoPaneTitle: makeElement('div'),
    infoPaneSub: makeElement('div'),
    infoPaneBody: makeElement('div'),
    infoPaneInterp: makeElement('div'),
    infoPaneHint: makeElement('div'),
    infoPaneWelcome: makeElement('div'),
    infoPaneScroll: makeElement('div'),
    infoPaneTabs: makeElement('div'),
    infoPaneBody2: makeElement('div'),
    infoAgg: makeElement('div'),
    infoAggBtn: makeElement('button'),
    infoAggBody: makeElement('div'),
    anchorDate: makeElement('div'),
    codiviumScore: makeElement('span'),
    breadthScore: makeElement('span'),
    depthOverallScore: makeElement('span'),
    microDepthScore: makeElement('span'),
    interviewDepthScore: makeElement('span'),
    codiviumPointsAll: makeElement('span'),
    codiviumPoints30: makeElement('span'),
    efficiencyPtsPerHr: makeElement('span'),
    interviewBreadthScore: makeElement('span'),
    microBreadthScore: makeElement('span'),
    mcqBreadthScore: makeElement('span'),
    depthAvg: makeElement('span'),
    weightedMcqScore: makeElement('span'),
    exerciseTotalBadge: makeElement('span'),
    heatmapFocusMode: makeElement('select'),
    heatmapTopN: makeElement('input'),
    heatmapFocusControls: makeElement('div'),
    cvFaqModal: makeElement('div'),
    cvGlossaryModal: makeElement('div'),
    cvLayoutPresetDock: null, // not pre-created — tested for single creation
    brandCube: makeElement('div'),
    brandLogo: makeElement('a'),
  };

  // A minimal event
  function makeEvent(type) {
    return { type, preventDefault() {}, stopPropagation() {}, target: null };
  }

  const document = {
    _byId,
    body,
    documentElement: docEl,
    head: makeElement('head'),

    getElementById(id) { return _byId[id] || null; },
    querySelector(sel) {
      if (sel === 'body') return body;
      if (sel === 'html') return docEl;
      return queryOne(body, sel) || queryOne(docEl, sel);
    },
    querySelectorAll(sel) {
      return queryAll(body, sel).concat(queryAll(docEl, sel));
    },
    createElement(tag) { return makeElement(tag); },
    createDocumentFragment() {
      const frag = makeElement('fragment');
      frag.nodeType = 11;
      return frag;
    },
    createTextNode(txt) {
      const t = makeElement('#text');
      t.textContent = txt;
      return t;
    },
    createEvent() { return makeEvent(''); },
    createDocumentFragment() {
      const frag = makeElement('#document-fragment');
      frag.nodeType = 11;
      frag.querySelector = (sel) => queryOne(frag, sel);
      frag.querySelectorAll = (sel) => queryAll(frag, sel);
      return frag;
    },
    addEventListener() {},
    removeEventListener() {},
    _registerById(id, el) { _byId[id] = el; },
  };

  // getComputedStyle shim
  function getComputedStyle(el) {
    return {
      getPropertyValue(prop) {
        return (el && el._style && el._style[prop]) || '';
      },
    };
  }

  // MutationObserver shim
  class MutationObserver {
    observe() {}
    disconnect() {}
  }

  // ResizeObserver shim
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Canvas shim (Chart.js will fail gracefully — we guard __chartOk)
  function makeCanvas() {
    const c = makeElement('canvas');
    c.getContext = () => null;
    c.getBoundingClientRect = () => ({ width: 600, height: 300, top: 0, left: 0 });
    return c;
  }

  // Template element shim
  const _templates = {};
  function registerTemplate(id, categoryName) {
    const t = makeElement('template');
    t.id = id;
    const svg = makeElement('svg');
    t.content = { firstElementChild: svg, cloneNode: () => svg };
    _templates[id] = t;
    return t;
  }

  const _windowListeners = {};

  const window = {
    document,
    localStorage,
    location: { search: '', href: 'http://localhost/', pathname: '/' },
    innerWidth: 1440,
    innerHeight: 900,
    navigator: { userAgent: 'node-test' },
    history: { pushState() {}, replaceState() {} },
    performance: { now: () => Date.now() },
    requestAnimationFrame: fn => { setTimeout(fn, 16); return 1; },
    cancelAnimationFrame: () => {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    MutationObserver,
    ResizeObserver,
    getComputedStyle,
    CSS: { supports: () => false },
    CodiviumInsights: undefined,
    __CODIVIUM_DASHBOARD_DATA__: undefined,
    __cv_setSelectedTrack: undefined,
    Chart: undefined, // intentionally absent — tests guard around it

    addEventListener(type, fn, opts) {
      _windowListeners[type] = _windowListeners[type] || [];
      _windowListeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!_windowListeners[type]) return;
      _windowListeners[type] = _windowListeners[type].filter(f => f !== fn);
    },
    dispatchEvent(evt) {
      (_windowListeners[evt.type] || []).forEach(fn => { try { fn(evt); } catch (_) {} });
    },
    _listeners: _windowListeners,

    // Expose helpers for tests
    _dom: { body, ciMount, colLeft, infoPane, _byId, makeElement, makeEvent },
  };

  // Make window self-referential
  window.window = window;
  window.self = window;
  window.globalThis = window;

  // Link document back to window
  document.defaultView = window;

  return window;
}

module.exports = { buildEnv };
