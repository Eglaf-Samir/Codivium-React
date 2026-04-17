/* cvdReady: safe DOMContentLoaded wrapper for deferred scripts */
(function() {
  function cvdReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
  window._cvdReady = cvdReady;
})();


/* ===== cvd-core ===== */
(function () {
  "use strict";
  const CVD = (window.CVD = window.CVD || {});

  // DOM helpers
  CVD.$ = (sel, root = document) => root.querySelector(sel);
  CVD.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // localStorage wrapper (string-only, safe fallback)
  CVD.store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return (v === null || v === undefined || v === "") ? fallback : v;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
      } catch (e) {}
    }
  };

  // Small utilities
  CVD.util = CVD.util || {};
  CVD.util.clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // HTML sanitizer — strips scripts, iframes, event handlers, javascript: URLs.
  // Used by any module that renders untrusted HTML or markdown from the API.
  CVD.util.sanitizeHtml = function(unsafeHtml) {
    try {
      const tpl = document.createElement('template');
      tpl.innerHTML = String(unsafeHtml || '');
      tpl.content.querySelectorAll('script,iframe,object,embed,link,meta').forEach(n => n.remove());
      const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const el = walker.currentNode;
        Array.from(el.attributes || []).forEach(attr => {
          const name = attr.name.toLowerCase();
          const value = (attr.value || '').trim();
          if (name.startsWith('on') || name === 'srcdoc') { el.removeAttribute(attr.name); return; }
          if (['href','src','xlink:href','formaction'].includes(name) && /^\s*javascript:/i.test(value)) { el.removeAttribute(attr.name); return; }
          if (name === 'style' && (value.toLowerCase().includes('expression(') || value.toLowerCase().includes('javascript:'))) { el.removeAttribute(attr.name); return; }
        });
        if (el.tagName && el.tagName.toLowerCase() === 'a' && (el.getAttribute('target') || '').toLowerCase() === '_blank') {
          const parts = new Set((el.getAttribute('rel') || '').split(/\s+/).filter(Boolean).map(s => s.toLowerCase()));
          parts.add('noopener'); parts.add('noreferrer');
          el.setAttribute('rel', Array.from(parts).join(' '));
        }
      }
      return tpl.innerHTML;
    } catch(e) { console.warn('[Codivium] sanitizeHtml failed:', e); return ''; }
  };

  // Prevent placeholder links (href="#") from jumping the page
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#"]');
    if (!a) return;
    e.preventDefault();
  });

})();
/* ===== cvd-timer ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const store = CVD.store;

  const TIMER_KEY = "cv_session_start_" + (window.location.search || "");

  let startTime = Date.now();  // always start fresh; backend signals reset via CVD.timer.reset()

  const digitalEl  = document.getElementById("cvTimerDigital");
  const secHand    = document.getElementById("cvTimerSecHand");
  const minHand    = document.getElementById("cvTimerMinHand");
  const hourHand   = document.getElementById("cvTimerHourHand");
  const toggleBtn  = document.getElementById("cvTimerToggle");
  const toggleIcon = document.getElementById("cvTimerToggleIcon");
  const ticksG     = document.getElementById("cvTimerTicks");

  const EYE_PATH  = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8";
  const EYE_OFF   = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";

  // Draw tick marks
  if (ticksG) {
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * 2 * Math.PI;
      var outer = 29, inner = i % 3 === 0 ? 24 : 27;
      var x1 = (32 + Math.sin(a) * outer).toFixed(2);
      var y1 = (32 - Math.cos(a) * outer).toFixed(2);
      var x2 = (32 + Math.sin(a) * inner).toFixed(2);
      var y2 = (32 - Math.cos(a) * inner).toFixed(2);
      var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", x1); ln.setAttribute("y1", y1);
      ln.setAttribute("x2", x2); ln.setAttribute("y2", y2);
      ln.setAttribute("stroke", i % 3 === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.14)");
      ln.setAttribute("stroke-width", i % 3 === 0 ? "1.5" : "1");
      ln.setAttribute("stroke-linecap", "round");
      ticksG.appendChild(ln);
    }
  }

  function hand(el, deg, cx, cy, len, tipEl, tipOff) {
    if (!el) return;
    var r = (deg - 90) * Math.PI / 180;
    var tx = cx + Math.cos(r) * len;
    var ty = cy + Math.sin(r) * len;
    el.setAttribute("x2", tx.toFixed(2));
    el.setAttribute("y2", ty.toFixed(2));
    if (tipEl) {
      // rotate tip polygon to match hand angle
      tipEl.setAttribute("transform", "rotate(" + deg + " " + cx + " " + cy + ")");
    }
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function update() {
    var elapsedMs  = Math.max(0, Date.now() - startTime);
    var elapsedS   = elapsedMs / 1000;           // fractional seconds
    var secsF      = elapsedS % 60;              // fractional seconds in minute
    var secs       = Math.floor(secsF);
    var mins       = Math.floor(elapsedS / 60) % 60;
    var hours      = Math.floor(elapsedS / 3600);
    if (digitalEl) {
      digitalEl.textContent = (hours > 0 ? hours + ":" : "") + pad(mins) + ":" + pad(secs);
    }
    // smooth sweep: secsF is fractional so seconds hand glides
    var hourTip = document.getElementById("cvTimerHourTip");
    var minTip  = document.getElementById("cvTimerMinTip");
    hand(secHand,  (secsF / 60) * 360,                                   32, 32, 24);
    hand(minHand,  (elapsedS % 3600) / 3600 * 360,                       32, 32, 21, minTip);
    hand(hourHand, (elapsedS % (12 * 3600)) / (12 * 3600) * 360,         32, 32, 14, hourTip);
  }

  function updateToggleIcon(hidden) {
    if (!toggleIcon) return;
    var paths = toggleIcon.querySelectorAll("path, circle");
    paths.forEach(function(p) { p.parentNode && p.parentNode.removeChild(p); });
    if (hidden) {
      var p1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p1.setAttribute("d", EYE_OFF); p1.setAttribute("stroke", "currentColor");
      p1.setAttribute("stroke-width", "2"); p1.setAttribute("stroke-linecap", "round");
      p1.setAttribute("stroke-linejoin", "round"); p1.setAttribute("fill", "none");
      toggleIcon.appendChild(p1);
    } else {
      var p2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p2.setAttribute("d", EYE_PATH); p2.setAttribute("stroke", "currentColor");
      p2.setAttribute("stroke-width", "2"); p2.setAttribute("stroke-linecap", "round");
      p2.setAttribute("stroke-linejoin", "round"); p2.setAttribute("fill", "none");
      toggleIcon.appendChild(p2);
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", "12"); c.setAttribute("cy", "12"); c.setAttribute("r", "3");
      c.setAttribute("stroke", "currentColor"); c.setAttribute("stroke-width", "2");
      c.setAttribute("fill", "none");
      toggleIcon.appendChild(c);
    }
  }

  var KEY_HIDDEN = "cv_timer_hidden";
  var hidden = store.get(KEY_HIDDEN, "0") === "1";
  if (hidden) document.body.classList.add("timer-hidden");
  updateToggleIcon(hidden);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function() {
      hidden = !hidden;
      document.body.classList.toggle("timer-hidden", hidden);
      store.set(KEY_HIDDEN, hidden ? "1" : "0");
      updateToggleIcon(hidden);
    });
  }

  function elapsedSeconds() {
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  }

  CVD.timer = {
    elapsedSeconds: elapsedSeconds,
    getStartTime: function() { return startTime; },
    reset: function() { startTime = Date.now(); store.set(TIMER_KEY, String(startTime)); update(); }
  };

  update();
  // requestAnimationFrame for smooth seconds sweep
  var _rafId = null;
  var _running = false;
  function loop() {
    if (!_running) return;
    update();
    _rafId = requestAnimationFrame(loop);
  }
  function startLoop() { _running = true; _rafId = requestAnimationFrame(loop); }
  function stopLoop()  { _running = false; if (_rafId) cancelAnimationFrame(_rafId); }

  startLoop();

  // Expose destroy for cleanup
  CVD.timer.destroy = function() { stopLoop(); };
  window.addEventListener("pagehide", stopLoop);
})();
/* ===== cvd-syntax-themes ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const store = CVD.store;

  const SYNTAX_THEMES = [
    {
      key: "obsidian-code",
      name: "Obsidian Code",
      mode: "dark",
      desc: "Deep obsidian base with crisp cool accents (premium, low-glare).",
      colors: {
        codeBg:"#0B1020", codeFg:"#E8EEF5",
        gutterBg:"#0A0F1D", gutterFg:"#6E7A90",
        panelBg:"#111827", panelBorder:"#273246",
        selection:"#2A3A67", linehl:"#101A34", caret:"#FFD166",
        comment:"#7E8AA5", keyword:"#A78BFA", string:"#7EE2A8", number:"#F5D68A",
        function:"#4FB0FF", type:"#34D399", variable:"#E8EEF5", builtin:"#FF5DA2",
        operator:"#C9D2DE", punct:"#9FB0C7"
      }
    },
    {
      key: "midnight-terminal",
      name: "Midnight Terminal",
      mode: "dark",
      desc: "Terminal-inspired midnight palette with strong violet keywords.",
      colors: {
        codeBg:"#070812", codeFg:"#ECEBFF",
        gutterBg:"#060610", gutterFg:"#7E7AAE",
        panelBg:"#111027", panelBorder:"#2B2A55",
        selection:"#2A1F59", linehl:"#141032", caret:"#B9A2FF",
        comment:"#8A86B8", keyword:"#B9A2FF", string:"#7EE2A8", number:"#F7D99A",
        function:"#7DD3FC", type:"#34D399", variable:"#ECEBFF", builtin:"#FF5DA2",
        operator:"#C3C1E6", punct:"#A6A4D0"
      }
    },
    {
      key: "carbon-ink",
      name: "Carbon Ink",
      mode: "dark",
      desc: "Neutral carbon blacks with ink-bright accents and restrained saturation.",
      colors: {
        codeBg:"#0A0A0B", codeFg:"#F3F1EC",
        gutterBg:"#080808", gutterFg:"#8B8579",
        panelBg:"#151516", panelBorder:"#2E2D2A",
        selection:"#2C2517", linehl:"#151312", caret:"#D9C07C",
        comment:"#8B8579", keyword:"#D9C07C", string:"#86E7B0", number:"#F7D99A",
        function:"#9AE6FF", type:"#34D399", variable:"#F3F1EC", builtin:"#FF7AA2",
        operator:"#C8C3B8", punct:"#B6B0A5"
      }
    },
    {
      key: "graphite-neon",
      name: "Graphite Neon",
      mode: "dark",
      desc: "Graphite base with neon-forward accents (great for long sessions).",
      colors: {
        codeBg:"#0B0F14", codeFg:"#F2F4F7",
        gutterBg:"#0A0D12", gutterFg:"#8793A2",
        panelBg:"#1A1D22", panelBorder:"#2D3442",
        selection:"#1D2B3A", linehl:"#121A22", caret:"#34D399",
        comment:"#8793A2", keyword:"#60A5FA", string:"#34D399", number:"#F5D68A",
        function:"#FF5DA2", type:"#A7F3D0", variable:"#F2F4F7", builtin:"#7DD3FC",
        operator:"#C7D0DD", punct:"#9FB0C7"
      }
    },
    {
      key: "aurora-nightfall",
      name: "Aurora Nightfall",
      mode: "dark",
      desc: "Aurora accents over nightfall navy — vivid but still premium.",
      colors: {
        codeBg:"#06111A", codeFg:"#EAF2FB",
        gutterBg:"#050E15", gutterFg:"#7B8CA3",
        panelBg:"#0C1C28", panelBorder:"#1F3344",
        selection:"#0F2E3F", linehl:"#071A24", caret:"#7EE2A8",
        comment:"#7B8CA3", keyword:"#7DD3FC", string:"#7EE2A8", number:"#FFD7A8",
        function:"#A78BFA", type:"#34D399", variable:"#EAF2FB", builtin:"#FF5DA2",
        operator:"#C7D0DD", punct:"#A3B6CC"
      }
    },
    {
      key: "porcelain-codebook",
      name: "Porcelain Codebook",
      mode: "light",
      desc: "Porcelain editor surface with clean, editorial color decisions.",
      colors: {
        codeBg:"#FBFCFE", codeFg:"#0F172A",
        gutterBg:"#F1F5F9", gutterFg:"#64748B",
        panelBg:"#FFFFFF", panelBorder:"#E2E8F0",
        selection:"#C7D2FE", linehl:"#EEF2FF", caret:"#2563EB",
        comment:"#64748B", keyword:"#7C3AED", string:"#0F766E", number:"#B45309",
        function:"#2563EB", type:"#0F766E", variable:"#0F172A", builtin:"#DB2777",
        operator:"#334155", punct:"#475569"
      }
    },
    {
      key: "ivory-syntax",
      name: "Ivory Syntax",
      mode: "light",
      desc: "Warm ivory base; refined contrast with soft but legible accents.",
      colors: {
        codeBg:"#FFFDF8", codeFg:"#111827",
        gutterBg:"#F3EFE6", gutterFg:"#6B7280",
        panelBg:"#FFFFFF", panelBorder:"#E5E1D6",
        selection:"#BFDBFE", linehl:"#F1F5F9", caret:"#1F3A5F",
        comment:"#6B7280", keyword:"#1F3A5F", string:"#0F766E", number:"#B45309",
        function:"#2563EB", type:"#0F766E", variable:"#111827", builtin:"#C026D3",
        operator:"#374151", punct:"#4B5563"
      }
    },
    {
      key: "champagne-console",
      name: "Champagne Console",
      mode: "light",
      desc: "Champagne-tinted light theme with confident, muted sophistication.",
      colors: {
        codeBg:"#FFFAF3", codeFg:"#1F2937",
        gutterBg:"#F3ECE2", gutterFg:"#6B7280",
        panelBg:"#FFFFFF", panelBorder:"#E9DCCF",
        selection:"#FDE68A", linehl:"#FFF7ED", caret:"#7C2D43",
        comment:"#6B7280", keyword:"#7C2D43", string:"#0F766E", number:"#92400E",
        function:"#1D4ED8", type:"#0F766E", variable:"#1F2937", builtin:"#BE185D",
        operator:"#374151", punct:"#4B5563"
      }
    },
    {
      key: "slate-studio",
      name: "Slate Studio",
      mode: "mid",
      desc: "Mid-tone slate base (neither stark dark nor bright light).",
      colors: {
        codeBg:"#1B2431", codeFg:"#E6EEF8",
        gutterBg:"#18202B", gutterFg:"#8AA0B6",
        panelBg:"#232E3D", panelBorder:"#304155",
        selection:"#2F4A6B", linehl:"#223043", caret:"#60A5FA",
        comment:"#8AA0B6", keyword:"#60A5FA", string:"#34D399", number:"#F5D68A",
        function:"#A78BFA", type:"#A7F3D0", variable:"#E6EEF8", builtin:"#FF5DA2",
        operator:"#C7D0DD", punct:"#A3B6CC"
      }
    },
    {
      key: "mist-meridian",
      name: "Mist Meridian",
      mode: "mid/light",
      desc: "Mist-grey base with gentle accents; great for daytime focus.",
      colors: {
        codeBg:"#EEF2F6", codeFg:"#0F172A",
        gutterBg:"#E2E8F0", gutterFg:"#64748B",
        panelBg:"#F7FAFD", panelBorder:"#CBD5E1",
        selection:"#A7F3D0", linehl:"#E6F4EF", caret:"#10B981",
        comment:"#64748B", keyword:"#0F2A43", string:"#0F766E", number:"#92400E",
        function:"#2563EB", type:"#0F766E", variable:"#0F172A", builtin:"#DB2777",
        operator:"#334155", punct:"#475569"
      }
    }
  ];

  const SYN_CSS = {
    codeBg: "--syn-code-bg",
    codeFg: "--syn-code-fg",
    gutterBg: "--syn-gutter-bg",
    gutterFg: "--syn-gutter-fg",
    panelBg: "--syn-panel-bg",
    panelBorder: "--syn-panel-border",
    selection: "--syn-selection-bg",
    linehl: "--syn-linehl-bg",
    caret: "--syn-caret",
    comment: "--syn-comment",
    keyword: "--syn-keyword",
    string: "--syn-string",
    number: "--syn-number",
    function: "--syn-function",
    type: "--syn-type",
    variable: "--syn-variable",
    builtin: "--syn-builtin",
    operator: "--syn-operator",
    punct: "--syn-punct",
  };

  function applySyntaxTheme(themeKey, persist=true){
    const t = SYNTAX_THEMES.find(x => x.key === themeKey) || SYNTAX_THEMES[0];
    if(!t) return;

    Object.entries(SYN_CSS).forEach(([k, cssVar]) => {
      if(t.colors[k]) document.documentElement.style.setProperty(cssVar, t.colors[k]);
    });

    // Mark editor bg lightness so CSS can adapt title colours
    // Parse the codeBg hex to determine luminance
    var bg = t.colors.codeBg || '#0B1020';
    var hex = bg.replace('#','');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var r = parseInt(hex.substr(0,2),16)/255;
    var g = parseInt(hex.substr(2,2),16)/255;
    var b = parseInt(hex.substr(4,2),16)/255;
    var lum = 0.2126*r + 0.7152*g + 0.0722*b;
    document.body.setAttribute('data-editor-bg', lum > 0.4 ? 'light' : 'dark');

    if(persist) store.set('cv_syntax_theme', t.key);
  }


  // Export
  CVD.syntax = CVD.syntax || {};
  CVD.syntax.SYNTAX_THEMES = SYNTAX_THEMES;
  CVD.syntax.applySyntaxTheme = applySyntaxTheme;
})();
/* ===== cvd-settings-palette ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;

  // ===== Settings Palette (modal) =====
  const settingsOverlay = $("#settingsOverlay");
  const settingsBackdrop = $("#settingsBackdrop");
  const settingsPanel = $("#settingsPanel");
  const settingsClose = $("#settingsClose");

  const settingsBtn = $("#settingsBtn");
  const mySettingsBtn = $("#mySettingsBtn");

  let lastPaletteAnchor = null;
  let paletteAnim = null;

  function getPalAnimMs() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--pal-anim-ms").trim() || "240ms";
    if (raw.endsWith("ms")) return Math.max(0, parseFloat(raw) || 240);
    if (raw.endsWith("s")) return Math.max(0, (parseFloat(raw) || 0.24) * 1000);
    const n = parseFloat(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 240;
  }

  function computePaletteSize(){
    const root = document.documentElement;
    const topbarH = parseFloat(getComputedStyle(root).getPropertyValue("--topbar-h")) || 62;

    const w = Math.min(1040, window.innerWidth - 56);
    const h = Math.min(860, window.innerHeight - topbarH - 56);

    root.style.setProperty("--pal-w", `${Math.max(560, Math.floor(w))}px`);
    root.style.setProperty("--pal-h", `${Math.max(560, Math.floor(h))}px`);
  }

  function getAnchorCenter(el){
    if(!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function openPalette(fromEl){
    if(!settingsOverlay || !settingsPanel) return;
    computePaletteSize();
    lastPaletteAnchor = fromEl || lastPaletteAnchor;

    settingsOverlay.classList.add("open");
    settingsOverlay.setAttribute("aria-hidden", "false");

    const anchor = getAnchorCenter(lastPaletteAnchor);
    const palSize = settingsPanel.offsetWidth || 520;

    const topbarH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h")) || 62;
    const finalLeft = (window.innerWidth - palSize) / 2;
    const finalTop = topbarH + ((window.innerHeight - topbarH - palSize) / 2);

    settingsPanel.style.left = `${finalLeft}px`;
    settingsPanel.style.top = `${finalTop}px`;

    const destCenter = { x: finalLeft + palSize / 2, y: finalTop + palSize / 2 };
    const dx = anchor.x - destCenter.x;
    const dy = anchor.y - destCenter.y;

    if(paletteAnim) paletteAnim.cancel();

    settingsPanel.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.02)`;
    settingsPanel.style.opacity = "0";

    paletteAnim = settingsPanel.animate(
      [
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.02)`, opacity: 0 },
        { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1 }
      ],
      { duration: getPalAnimMs(), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );

    paletteAnim.onfinish = () => {
      settingsPanel.style.transform = "translate3d(0px, 0px, 0) scale(1)";
      settingsPanel.style.opacity = "1";
      paletteAnim = null;
    };
  }

  function closePalette(){
    if(!settingsOverlay || !settingsPanel) return;
    if(!settingsOverlay.classList.contains("open")) return;

    computePaletteSize();

    const anchor = getAnchorCenter(lastPaletteAnchor);
    const r = settingsPanel.getBoundingClientRect();
    const destCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const dx = anchor.x - destCenter.x;
    const dy = anchor.y - destCenter.y;

    if(paletteAnim) paletteAnim.cancel();

    paletteAnim = settingsPanel.animate(
      [
        { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1 },
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.02)`, opacity: 0 }
      ],
      { duration: getPalAnimMs(), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );

    paletteAnim.onfinish = () => {
      settingsOverlay.classList.remove("open");
      settingsOverlay.setAttribute("aria-hidden", "true");
      settingsPanel.style.opacity = "0";
      settingsPanel.style.transform = "translate3d(0px, 0px, 0) scale(0.02)";
      paletteAnim = null;
    };
  }

  
  // Palette transparency (0% = opaque, 100% = fully transparent)
  function setPaletteTransparency(pct){
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const strength = (100 - clamped) + "%"; // background mix strength
    document.documentElement.style.setProperty("--pal-bg-strength", strength);
  }

  // Default transparency: 0%
  setPaletteTransparency(0);

  // #paletteTransparency is an optional input - declare safely
  const palTransparency = document.getElementById("paletteTransparency");
  if (palTransparency) palTransparency.addEventListener("input", (e) => {
    setPaletteTransparency(e.target.value);
  });

  // ===== Draggable palette (drag from anywhere except interactive controls) =====
  (function enablePaletteDrag(){
    if (!settingsPanel) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    const DRAG_THRESHOLD = 3;

    function isInteractive(target){
      if (!target) return false;
      return !!target.closest('input, textarea, select, button, a, label');
    }

    function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

    function getTopbarH(){
      const v = getComputedStyle(document.documentElement).getPropertyValue('--topbar-h');
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 82;
    }

    function onPointerDown(e){
      if (!settingsOverlay || !settingsOverlay.classList.contains('open')) return;

      // allow drag from anywhere, but don't steal gestures from form controls
      if (isInteractive(e.target)) return;

      const rect = settingsPanel.getBoundingClientRect();

      // Convert current layout to explicit left/top so we can drag smoothly.
      settingsPanel.style.left = rect.left + 'px';
      settingsPanel.style.top  = rect.top + 'px';

      startLeft = rect.left;
      startTop  = rect.top;

      startX = e.clientX;
      startY = e.clientY;

      dragging = false;

      settingsPanel.setPointerCapture?.(e.pointerId);

      function onMove(ev){
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!dragging && (Math.abs(dx) + Math.abs(dy)) < DRAG_THRESHOLD) return;
        dragging = true;
        settingsPanel.classList.add('dragging');

        const topbarH = getTopbarH();
        const maxLeft = window.innerWidth  - rect.width  - 10;
        const maxTop  = window.innerHeight - rect.height - 10;

        const nextLeft = clamp(startLeft + dx, 10, maxLeft);
        const nextTop  = clamp(startTop + dy, topbarH + 10, maxTop);

        settingsPanel.style.left = nextLeft + 'px';
        settingsPanel.style.top  = nextTop + 'px';
      }

      function onUp(ev){
        settingsPanel.classList.remove('dragging');
        settingsPanel.removeEventListener('pointermove', onMove);
        settingsPanel.removeEventListener('pointerup', onUp);
        settingsPanel.removeEventListener('pointercancel', onUp);
      }

      settingsPanel.addEventListener('pointermove', onMove, { passive: true });
      settingsPanel.addEventListener('pointerup', onUp);
      settingsPanel.addEventListener('pointercancel', onUp);
    }

    // capture on the panel itself (any blank area)
    settingsPanel.addEventListener('pointerdown', onPointerDown);
  })();

  // ── Focus trap for the settings palette ──
  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]'
    )).filter(function(el) { return el.offsetParent !== null; });
  }

  function trapFocus(e) {
    if (!settingsOverlay || !settingsOverlay.classList.contains("open")) return;
    if (!settingsPanel) return;
    const focusable = getFocusable(settingsPanel);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
  }

  function focusPalette() {
    if (!settingsPanel) return;
    const focusable = getFocusable(settingsPanel);
    if (focusable.length) focusable[0].focus();
  }

  document.addEventListener("keydown", trapFocus);

  // Return focus to trigger element on close
  const _origClose = closePalette;
  // (closePalette already handles Escape via the window keydown listener)

  settingsBtn?.addEventListener("click", () => { openPalette(settingsBtn); setTimeout(focusPalette, 260); });
  mySettingsBtn?.addEventListener("click", () => openPalette(mySettingsBtn));

  settingsClose?.addEventListener("click", closePalette);
  settingsBackdrop?.addEventListener("click", closePalette);

  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closePalette();
  });

  window.addEventListener("resize", () => {
    if(settingsOverlay && settingsOverlay.classList.contains("open")) openPalette(lastPaletteAnchor);
  });

  // Export
  CVD.palette = CVD.palette || {};
  CVD.palette.open = openPalette;
  CVD.palette.close = closePalette;
})();
/* ===== cvd-tabs ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $$ = CVD.$$;
  const store = CVD.store;

  const TAB_KEY_PREFIX = "cv_tabs_active_";
  const DEFAULTS = { left: "req", right: "candidate" };

  // ===== Tabbed panes (left/right) =====
  function setActiveTab(paneKey, target, opts = {}) {
    const btns = $$('.tab-btn[data-pane="' + paneKey + '"]');
    const panels = $$('.tab-panel[data-pane="' + paneKey + '"]');

    btns.forEach((b) => {
      const on = b.getAttribute("data-target") === target;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
      b.setAttribute("tabindex", on ? "0" : "-1");
    });

    panels.forEach((p) => {
      const on = p.getAttribute("data-panel") === target;
      p.classList.toggle("active", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });

    // Persist selection (unless explicitly suppressed)
    if (!opts.noPersist && store) {
      store.set(TAB_KEY_PREFIX + paneKey, target);
    }

    // Refresh CodeMirror editors when their panel becomes visible
    if (paneKey === "right") {
      requestAnimationFrame(() => {
        const ed = CVD.editors;
        if (!ed || typeof ed.refresh !== "function") return;
        if (target === "candidate") ed.refresh("candidate");
        if (target === "solution") ed.refresh("solution");
      });
    }
  }

  function activateTabFromElement(tabEl, opts = {}) {
    if (!tabEl) return;
    const paneKey = tabEl.getAttribute("data-pane");
    const target = tabEl.getAttribute("data-target");
    if (!paneKey || !target) return;
    setActiveTab(paneKey, target, opts);
  }

  function paneHasTarget(paneKey, target) {
    return $$('.tab-btn[data-pane="' + paneKey + '"][data-target="' + target + '"]').length > 0;
  }

  function init() {
    const panes = new Set($$('.tab-btn[data-pane]').map((b) => b.getAttribute("data-pane")).filter(Boolean));

    panes.forEach((paneKey) => {
      const saved = store ? store.get(TAB_KEY_PREFIX + paneKey, null) : null;
      const fallback = DEFAULTS[paneKey] || null;
      const target = (saved && paneHasTarget(paneKey, saved)) ? saved : fallback;

      if (target) setActiveTab(paneKey, target, { noPersist: true });
    });
  }

  // Click to activate
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('.tab-btn[role="tab"]');
    if (!btn) return;
    activateTabFromElement(btn);
    btn.focus();
  });

  // Keyboard navigation (Arrow keys / Home / End / Enter / Space)
  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (!tab) return;

    const tablist = tab.closest('[role="tablist"]');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    const idx = tabs.indexOf(tab);
    if (idx < 0) return;

    const key = e.key;

    const go = (nextIdx) => {
      const t = tabs[nextIdx];
      if (!t) return;
      t.focus();
      activateTabFromElement(t);
    };

    if (key === "ArrowRight" || key === "ArrowDown") {
      e.preventDefault();
      go((idx + 1) % tabs.length);
      return;
    }

    if (key === "ArrowLeft" || key === "ArrowUp") {
      e.preventDefault();
      go((idx - 1 + tabs.length) % tabs.length);
      return;
    }

    if (key === "Home") {
      e.preventDefault();
      go(0);
      return;
    }

    if (key === "End") {
      e.preventDefault();
      go(tabs.length - 1);
      return;
    }

    if (key === "Enter" || key === " ") {
      e.preventDefault();
      activateTabFromElement(tab);
      return;
    }
  });

  // Init once DOM is ready
  window._cvdReady( init);

  // Export
  CVD.tabs = CVD.tabs || {};
  CVD.tabs.setActiveTab = setActiveTab;
  CVD.tabs.init = init;
})();
/* ===== cvd-editors ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;
  const store = CVD.store;

  const applySyntaxTheme = (CVD.syntax && typeof CVD.syntax.applySyntaxTheme === "function")
    ? CVD.syntax.applySyntaxTheme
    : function () {};

  const editors = (CVD.editors = CVD.editors || {});
  editors.instances = editors.instances || {};
  editors.textareas = editors.textareas || {};

  // ===== CodeMirror editors =====
  const syntaxSel = $('#syntaxThemeSelect');
  const candidateTA = $('#candidateEditor');
  const solutionTA = $('#solutionEditor');

  const defaultSyntaxTheme = store.get('cv_syntax_theme', 'obsidian-code');
  if (syntaxSel) syntaxSel.value = defaultSyntaxTheme;
  applySyntaxTheme(defaultSyntaxTheme, false);

  const cmCandidate = (window.CodeMirror && candidateTA)
    ? CodeMirror.fromTextArea(candidateTA, {
        mode: 'python',
        theme: 'codivium',
        lineNumbers: false,
        lineWrapping: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        viewportMargin: 20
      })
    : null;

  const cmSolution = (window.CodeMirror && solutionTA)
    ? CodeMirror.fromTextArea(solutionTA, {
        mode: 'python',
        theme: 'codivium',
        lineNumbers: false,
        lineWrapping: true,
        readOnly: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        viewportMargin: 20
      })
    : null;

  editors.instances.candidate = cmCandidate;
  editors.instances.solution = cmSolution;

  // Analytics: code_changed (A18)
  if (cmCandidate) {
    var _changeTimer = null;
    cmCandidate.on("change", function() {
      clearTimeout(_changeTimer);
      _changeTimer = setTimeout(function() {
        var CVD = window.CVD || {};
        if (CVD.submit && typeof CVD.submit.emit === "function") {
          CVD.submit.emit("code_changed", {
            exerciseId: CVD.currentExerciseId || "",
            codeLength: cmCandidate.getValue().length
          });
        }
      }, 2000); // debounce 2s to avoid event flood
    });
  }
  editors.textareas.candidate = candidateTA || null;
  editors.textareas.solution = solutionTA || null;

  function get(name) {
    return (editors.instances && editors.instances[name]) ? editors.instances[name] : null;
  }

  function refresh(name) {
    const cm = get(name);
    if (cm && typeof cm.refresh === "function") cm.refresh();
  }

  function refreshAll() {
    refresh("candidate");
    refresh("solution");
  }

  function setValue(name, text) {
    const cm = get(name);
    if (cm && typeof cm.setValue === "function") {
      cm.setValue(text);
      return;
    }
    const ta = editors.textareas ? editors.textareas[name] : null;
    if (ta) ta.value = text;
  }

  function getSyntaxThemeKey() {
    return syntaxSel ? syntaxSel.value : defaultSyntaxTheme;
  }

  // Export API
  editors.get = get;
  editors.refresh = refresh;
  editors.refreshAll = refreshAll;
  editors.setValue = setValue;
  editors.getSyntaxThemeKey = getSyntaxThemeKey;
  editors.defaultSyntaxTheme = defaultSyntaxTheme;
})();
/* ===== cvd-workspace-theme ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;
  const store = CVD.store;

  const stage = $('#stage');
  const wsThemeSel = $('#pageThemeSelect');
  const glassToggle = $('#glassToggle');
  const paletteThemeToggle = $('#applyThemeToPaletteToggle');
  const globalThemeToggle = $('#globalThemeToggle');

  function applyWorkspaceTheme(key, persist = true) {
    if (!stage) return;
    if (key === 'original') stage.removeAttribute('data-ui-theme');
    else stage.setAttribute('data-ui-theme', key);

    if (persist) store.set('cv_ws_theme', key);
  }

  function setGlass(on, persist = true) {
    if (!stage) return;
    stage.classList.toggle('glass-off', !on);
    if (glassToggle) glassToggle.checked = !!on;
    if (persist) store.set('cv_glass_on', on ? '1' : '0');
  }

  function syncPaletteVars() {
    const stageEl = document.getElementById('stage');
    if (!stageEl) return;

    const cs = getComputedStyle(stageEl);
    const rootCs = getComputedStyle(document.documentElement);
    const body = document.body;

    body.style.setProperty('--pal-bg1', cs.getPropertyValue('--ws-surface').trim());
    body.style.setProperty('--pal-bg2', cs.getPropertyValue('--ws-bg').trim());
    body.style.setProperty('--pal-field-bg', cs.getPropertyValue('--ws-surface-2').trim());
    body.style.setProperty('--pal-field-border', cs.getPropertyValue('--ws-border-2').trim());
    body.style.setProperty('--pal-text', cs.getPropertyValue('--ws-text').trim());
    body.style.setProperty('--pal-muted', cs.getPropertyValue('--ws-muted').trim());
    body.style.setProperty('--pal-border', cs.getPropertyValue('--ws-border').trim());

    const accent =
      cs.getPropertyValue('--ws-primary').trim() ||
      cs.getPropertyValue('--accent').trim() ||
      rootCs.getPropertyValue('--accent').trim();

    body.style.setProperty('--pal-accent', accent);
  }

  function resetPaletteVars() {
    const root = document.documentElement;
    const body = document.body;

    [
      '--pal-bg1',
      '--pal-bg2',
      '--pal-field-bg',
      '--pal-field-border',
      '--pal-text',
      '--pal-muted',
      '--pal-border',
      '--pal-accent'
    ].forEach((v) => {
      body.style.removeProperty(v);
      root.style.removeProperty(v);
    });
  }

  function setPaletteThemed(on, persist = true) {
    document.body.classList.toggle('palette-themed', !!on);
    if (paletteThemeToggle) paletteThemeToggle.checked = !!on;
    if (on) syncPaletteVars(); else resetPaletteVars();
    if (persist) store.set('cv_palette_theme', on ? '1' : '0');
  }

  function readSaved() {
    return {
      wsKey: store.get('cv_ws_theme', 'original'),
      glassRaw: store.get('cv_glass_on', ''),
      paletteOn: store.get('cv_palette_theme', '0') === '1',
      globalOn: store.get('cv_use_global_ws_theme', '0') === '1',
      globalWsKey: store.get('cv_global_ws_theme', 'original')
    };
  }

  // Export
  CVD.workspaceTheme = {
    els: { stage, wsThemeSel, glassToggle, paletteThemeToggle, globalThemeToggle },
    applyWorkspaceTheme,
    setGlass,
    setPaletteThemed,
    syncPaletteVars,
    resetPaletteVars,
    readSaved
  };
})();
/* ===== cvd-typography ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;
  const store = CVD.store;

  const stage = $('#stage');

  const editorFontSizeSel = $('#editorFontSizeSelect');
  const editorFontFamilySel = $('#editorFontFamilySelect');
  const editorBoldToggle = $('#editorBoldToggle');

  const leftFamSel = $('#leftInfoFontFamilySelect');
  const leftSizeSel = $('#leftInfoFontSizeSelect');
  const leftBoldToggle = $('#leftInfoBoldToggle');

  const testsFamSel = $('#testsFontFamilySelect');
  const testsSizeSel = $('#testsFontSizeSelect');
  const testsBoldToggle = $('#testsBoldToggle');

  const replFamSel = $('#replFontFamilySelect');
  const replSizeSel = $('#replFontSizeSelect');
  const replBoldToggle = $('#replBoldToggle');

  const editorFontMap = {
    'system-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    'jetbrains-mono': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    'fira-code': '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    'source-code-pro': '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    'ibm-plex-mono': '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    'inconsolata': '"Inconsolata", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  };

  const uiFontMap = {
    'auto': '',
    'cinzel': '"Cinzel", serif',
    'system-sans': 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    'system-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    'system-mono': editorFontMap['system-mono'],
    'jetbrains-mono': editorFontMap['jetbrains-mono'],
    'fira-code': editorFontMap['fira-code'],
    'source-code-pro': editorFontMap['source-code-pro'],
    'ibm-plex-mono': editorFontMap['ibm-plex-mono'],
    'inconsolata': editorFontMap['inconsolata']
  };

  const FONT_URLS = {
    "jetbrains-mono":  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap",
    "fira-code":       "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap",
    "source-code-pro": "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap",
    "ibm-plex-mono":   "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap",
    "inconsolata":     "https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;500;600&display=swap"
  };

  const _loadedFonts = new Set();
  function ensureFontLoaded(fontKey) {
    if (!fontKey || fontKey === "system-mono") return;
    if (_loadedFonts.has(fontKey)) return;
    const url = FONT_URLS[fontKey];
    if (!url) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = url;
    document.head.appendChild(link);
    _loadedFonts.add(fontKey);
  }

  var _pendingFontSize = null;

  function refreshEditors(forceFontSize) {
    if (CVD.editors && typeof CVD.editors.refreshAll === "function") {
      CVD.editors.refreshAll();
    }
    // Set font size on CM wrapper elements, then refresh after browser reflow
    var size = forceFontSize || _pendingFontSize ||
               (stage ? stage.style.getPropertyValue('--editor-font-size').trim() : '');
    _pendingFontSize = null;
    if (size && CVD.editors) {
      ['candidate', 'solution'].forEach(function(name) {
        var cm = CVD.editors.get ? CVD.editors.get(name) : null;
        if (cm && cm.getWrapperElement) {
          var wrapper = cm.getWrapperElement();
          wrapper.style.fontSize = size;
          // Also set on the inner code/lines elements so CM measures correctly
          var scroll = wrapper.querySelector('.CodeMirror-scroll');
          if (scroll) scroll.style.fontSize = size;
        }
      });
      // setTimeout ensures the browser has reflowed before CM measures char widths
      setTimeout(function() {
        ['candidate', 'solution'].forEach(function(name) {
          var cm = CVD.editors.get ? CVD.editors.get(name) : null;
          if (cm) { try { cm.refresh(); } catch(e) {} }
        });
      }, 50);
    }
  }

  function applyEditorTypography(sizePx, fontKey, boldOn, persist = true) {
    if (!stage) return;
    ensureFontLoaded(fontKey);
    const size = sizePx || '13px';
    const font = editorFontMap[fontKey] || editorFontMap['system-mono'];

    // Set on both root and stage so CSS var reaches .cm-shell (which is in #mainWorkspace, not #stage)
    document.documentElement.style.setProperty('--editor-font-size', size);
    document.documentElement.style.setProperty('--editor-font-family', font);
    document.documentElement.style.setProperty('--editor-font-weight', boldOn ? '700' : '500');
    stage.style.setProperty('--editor-font-size', size);
    stage.style.setProperty('--editor-font-family', font);
    stage.style.setProperty('--editor-font-weight', boldOn ? '700' : '500');

    if (persist) {
      store.set('cv_editor_font_size', size);
      store.set('cv_editor_font_family', fontKey || 'system-mono');
      store.set('cv_editor_bold', boldOn ? '1' : '0');
    }

    _pendingFontSize = size;
    requestAnimationFrame(function() { refreshEditors(size); });
  }

  function applyAreaTypography(prefix, sizeVal, famKey, boldOn, persist = true) {
    if (!stage) return;

    const storePrefix = String(prefix).replace(/-/g, '_');
    const sizeProp = '--' + prefix + '-font-size';
    const famProp = '--' + prefix + '-font-family';
    const weightProp = '--' + prefix + '-font-weight';

    if (sizeVal === 'auto' || !sizeVal) {
      stage.style.removeProperty(sizeProp);
      document.documentElement.style.removeProperty(sizeProp);
    } else {
      stage.style.setProperty(sizeProp, sizeVal);
      document.documentElement.style.setProperty(sizeProp, sizeVal);
    }

    const fam = uiFontMap[famKey] || '';
    if (!fam) stage.style.removeProperty(famProp);
    else stage.style.setProperty(famProp, fam);

    if (boldOn === true) stage.style.setProperty(weightProp, '700');
    else if (boldOn === false) stage.style.setProperty(weightProp, '400');
    else stage.style.removeProperty(weightProp);

    if (persist) {
      store.set('cv_' + storePrefix + '_size', sizeVal || 'auto');
      store.set('cv_' + storePrefix + '_family', famKey || 'auto');
      store.set('cv_' + storePrefix + '_bold', boldOn ? '1' : '0');
    }
  }

  function readSaved() {
    return {
      editorSize: (function() {
      var raw = store.get('cv_editor_font_size', '13px');
      return raw && !raw.includes('px') ? raw + 'px' : (raw || '13px');
    })(),
      editorFont: store.get('cv_editor_font_family', 'system-mono'),
      editorBold: store.get('cv_editor_bold', '0') === '1',

      liSize: store.get('cv_left_info_size', 'auto'),
      liFam: store.get('cv_left_info_family', 'auto'),
      liBold: store.get('cv_left_info_bold', '0') === '1',

      tSize: store.get('cv_tests_size', 'auto'),
      tFam: store.get('cv_tests_family', 'auto'),
      tBold: store.get('cv_tests_bold', '0') === '1',

      rSize: store.get('cv_repl_size', 'auto'),
      rFam: store.get('cv_repl_family', 'auto'),
      rBold: store.get('cv_repl_bold', '0') === '1'
    };
  }

  // Export
  CVD.typography = {
    els: {
      stage,
      editorFontSizeSel, editorFontFamilySel, editorBoldToggle,
      leftFamSel, leftSizeSel, leftBoldToggle,
      testsFamSel, testsSizeSel, testsBoldToggle,
      replFamSel, replSizeSel, replBoldToggle
    },
    applyEditorTypography,
    applyAreaTypography,
    readSaved
  ,
    ensureFontLoaded: ensureFontLoaded
  };
})();
/* ===== cvd-workspace-controls ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;
  const store = CVD.store;

  const applySyntaxTheme = (CVD.syntax && typeof CVD.syntax.applySyntaxTheme === "function")
    ? CVD.syntax.applySyntaxTheme
    : function () {};

  const editors = CVD.editors || {};
  const theme = CVD.workspaceTheme || {};
  const typo = CVD.typography || {};

  const wsThemeSel = (theme.els && theme.els.wsThemeSel) ? theme.els.wsThemeSel : $('#pageThemeSelect');
  const glassToggle = (theme.els && theme.els.glassToggle) ? theme.els.glassToggle : $('#glassToggle');
  const paletteThemeToggle = (theme.els && theme.els.paletteThemeToggle) ? theme.els.paletteThemeToggle : $('#applyThemeToPaletteToggle');
  const globalThemeToggle = (theme.els && theme.els.globalThemeToggle) ? theme.els.globalThemeToggle : $('#globalThemeToggle');

  const applyBtn = $('#applyAllControls');

  function applyAll(persist = true) {
    const syntaxKey = (typeof editors.getSyntaxThemeKey === "function")
      ? editors.getSyntaxThemeKey()
      : store.get('cv_syntax_theme', 'obsidian-code');

    const wsKey = wsThemeSel ? wsThemeSel.value : 'original';

    applySyntaxTheme(syntaxKey, persist);
    if (typeof theme.applyWorkspaceTheme === "function") theme.applyWorkspaceTheme(wsKey, persist);

    // Global theme (shared across pages)
    const globalOn = globalThemeToggle ? globalThemeToggle.checked : false;
    if (persist) store.set('cv_use_global_ws_theme', globalOn ? '1' : '0');
    if (globalOn && persist) store.set('cv_global_ws_theme', wsKey);

    const glassOn = glassToggle ? glassToggle.checked : (wsKey === 'original');
    if (typeof theme.setGlass === "function") theme.setGlass(glassOn, persist);

    const palOn = paletteThemeToggle ? paletteThemeToggle.checked : false;
    if (typeof theme.setPaletteThemed === "function") theme.setPaletteThemed(palOn, persist);

    if (typo && typeof typo.applyEditorTypography === "function") {
      const els = typo.els || {};
      const editorSize = els.editorFontSizeSel ? els.editorFontSizeSel.value
          : (function(){ var raw = store.get('cv_editor_font_size','13'); return raw && !String(raw).includes('px') ? raw+'px' : (raw||'13px'); })();
      const editorFontKey = els.editorFontFamilySel ? els.editorFontFamilySel.value : 'system-mono';
      const editorBold = els.editorBoldToggle ? els.editorBoldToggle.checked : false;

      const liSize = els.leftSizeSel ? els.leftSizeSel.value : 'auto';
      const liFam = els.leftFamSel ? els.leftFamSel.value : 'auto';
      const liBold = els.leftBoldToggle ? els.leftBoldToggle.checked : false;

      const tSize = els.testsSizeSel ? els.testsSizeSel.value : 'auto';
      const tFam = els.testsFamSel ? els.testsFamSel.value : 'auto';
      const tBold = els.testsBoldToggle ? els.testsBoldToggle.checked : false;

      const rSize = els.replSizeSel ? els.replSizeSel.value : 'auto';
      const rFam = els.replFamSel ? els.replFamSel.value : 'auto';
      const rBold = els.replBoldToggle ? els.replBoldToggle.checked : false;

      typo.applyEditorTypography(editorSize, editorFontKey, editorBold, persist);
      typo.applyAreaTypography('left-info', liSize, liFam, liBold, persist);
      typo.applyAreaTypography('tests', tSize, tFam, tBold, persist);
      typo.applyAreaTypography('repl', rSize, rFam, rBold, persist);
    }
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => applyAll(true));
  }

  // If user changes theme, gently pre-set glass default (can be overridden before applying)
  if (wsThemeSel && glassToggle) {
    wsThemeSel.addEventListener('change', () => {
      glassToggle.checked = (wsThemeSel.value === 'original');
    });
  }

  // ===== Initialize controls from storage and apply immediately =====
  const savedTheme = (typeof theme.readSaved === "function") ? theme.readSaved() : {
    wsKey: store.get('cv_ws_theme', 'original'),
    glassRaw: store.get('cv_glass_on', ''),
    paletteOn: store.get('cv_palette_theme', '0') === '1',
    globalOn: store.get('cv_use_global_ws_theme', '0') === '1',
    globalWsKey: store.get('cv_global_ws_theme', 'original')
  };

  const savedTypo = (typeof typo.readSaved === "function") ? typo.readSaved() : null;

  // Workspace theme select
  if (wsThemeSel) {
    let initialWs = savedTheme.wsKey;
    if (savedTheme.globalOn) initialWs = savedTheme.globalWsKey || initialWs;

    const has = Array.from(wsThemeSel.options).some(o => o.value === initialWs);
    wsThemeSel.value = has ? initialWs : 'original';
    if (!has) store.set('cv_ws_theme', 'original');
  }

  // Toggles
  if (globalThemeToggle) globalThemeToggle.checked = !!savedTheme.globalOn;
  if (paletteThemeToggle) paletteThemeToggle.checked = !!savedTheme.paletteOn;

  if (glassToggle) {
    if (savedTheme.glassRaw === '') glassToggle.checked = ((wsThemeSel ? wsThemeSel.value : savedTheme.wsKey) === 'original');
    else glassToggle.checked = (savedTheme.glassRaw === '1');
  }

  // Typography selects/toggles
  if (savedTypo && typo.els) {
    const els = typo.els;
    if (els.editorFontSizeSel) els.editorFontSizeSel.value = savedTypo.editorSize;
    if (els.editorFontFamilySel) els.editorFontFamilySel.value = savedTypo.editorFont;
    if (els.editorBoldToggle) els.editorBoldToggle.checked = savedTypo.editorBold;

    if (els.leftSizeSel) els.leftSizeSel.value = savedTypo.liSize;
    if (els.leftFamSel) els.leftFamSel.value = savedTypo.liFam;
    if (els.leftBoldToggle) els.leftBoldToggle.checked = savedTypo.liBold;

    if (els.testsSizeSel) els.testsSizeSel.value = savedTypo.tSize;
    if (els.testsFamSel) els.testsFamSel.value = savedTypo.tFam;
    if (els.testsBoldToggle) els.testsBoldToggle.checked = savedTypo.tBold;

    if (els.replSizeSel) els.replSizeSel.value = savedTypo.rSize;
    if (els.replFamSel) els.replFamSel.value = savedTypo.rFam;
    if (els.replBoldToggle) els.replBoldToggle.checked = savedTypo.rBold;
  }

  // Load saved editor font lazily on startup
  if (savedTypo && savedTypo.editorFont && CVD.typography && CVD.typography.ensureFontLoaded) CVD.typography.ensureFontLoaded(savedTypo.editorFont);

  // Apply font size after DOM ready — palette els may not exist, so call directly
  // Wrapped in _cvdReady so CM editors are fully initialised and laid out
  window._cvdReady(function() {
    var _cvdFontStyleTag = null;
    function pxVal(key, def) {
      var v = CVD.store.get(key, def);
      return (v && !v.includes('px')) ? v + 'px' : (v || def);
    }
    function fontFam(key, def) {
      var v = CVD.store.get(key, def);
      var maps = {
        'system-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        'jetbrains-mono': '"JetBrains Mono", monospace',
        'fira-code': '"Fira Code", monospace',
        'source-code-pro': '"Source Code Pro", monospace',
        'ibm-plex-mono': '"IBM Plex Mono", monospace',
        'inconsolata': '"Inconsolata", monospace',
        'auto': '',
        'cinzel': '"Cinzel", serif',
        'system-sans': 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        'system-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", serif'
      };
      return maps[v] || maps[def] || '';
    }
    function applyEditorFontSizeFromStorage() {
      var edSz     = pxVal('cv_editor_font_size', '13px');
      var replSz   = pxVal('cv_repl_font_size', '13px');
      var instSz   = pxVal('cv_instructions_font_size', '15px');
      var edFam    = fontFam('cv_editor_font_family', 'system-mono');
      var replFam  = fontFam('cv_repl_font_family', 'system-mono');
      var instFam  = fontFam('cv_instructions_font_family', 'auto');
      if (!_cvdFontStyleTag) {
        _cvdFontStyleTag = document.createElement('style');
        _cvdFontStyleTag.id = 'cvd-editor-font-override';
        document.head.appendChild(_cvdFontStyleTag);
      }
      var edFamRule    = edFam  ? ' font-family: ' + edFam + ' !important;'   : '';
      var replFamRule  = replFam ? ' font-family: ' + replFam + ' !important;' : '';
      var instFamRule  = instFam ? ' font-family: ' + instFam + ' !important;' : '';
      _cvdFontStyleTag.textContent =
        '.cm-shell .CodeMirror, .cm-shell .CodeMirror * { font-size: ' + edSz + ' !important;' + edFamRule + ' }' +
        '#paneReplIn .CodeMirror, #paneReplIn .CodeMirror * { font-size: ' + replSz + ' !important;' + replFamRule + ' }' +
        '#replOutputCode { font-size: ' + replSz + ' !important;' + replFamRule + ' }' +
        '#paneLeft .pane-body p, #paneLeft .pane-body li, #paneLeft .pane-body td,' +
        '#paneLeft .pane-body th, #paneLeft .pane-body h1, #paneLeft .pane-body h2,' +
        '#paneLeft .pane-body h3, #paneLeft .pane-body h4,' +
        '#paneLeft .pane-body blockquote { font-size: ' + instSz + ' !important;' + instFamRule + ' }';
      setTimeout(function() {
        if (CVD.editors && CVD.editors.refreshAll) CVD.editors.refreshAll();
        if (CVD.repl && CVD.repl.cm && CVD.repl.cm.refresh) CVD.repl.cm.refresh();
      }, 50);
    }
    // Apply on load
    applyEditorFontSizeFromStorage();
    // Apply REPL syntax theme separately from editor syntax theme
    var REPL_SYN_MAP = {
      codeBg:    '--repl-syn-code-bg',  codeFg:   '--repl-syn-code-fg',
      gutterBg:  '--repl-syn-gutter-bg',gutterFg: '--repl-syn-gutter-fg',
      panelBg:   '--repl-syn-panel-bg', panelBorder: '--repl-syn-border',
      selection: '--repl-syn-selection',caret:    '--repl-syn-caret',
      comment:   '--repl-syn-comment',  keyword:  '--repl-syn-keyword',
      string:    '--repl-syn-string',   number:   '--repl-syn-number',
      function:  '--repl-syn-function'
    };
    function applyReplSyntaxTheme() {
      // Use saved REPL theme if set; otherwise use the saved editor theme.
      // Either way, write explicit values so REPL is decoupled from --syn-* live vars.
      var themes = (CVD.syntax && CVD.syntax.SYNTAX_THEMES) ? CVD.syntax.SYNTAX_THEMES : [];
      var replKey   = CVD.store.get('cv_repl_syntax_theme', null);
      var editorKey = CVD.store.get('cv_syntax_theme', 'obsidian-code');
      var useKey    = replKey || editorKey;
      var t = themes.find(function(x){ return x.key === useKey; })
           || themes.find(function(x){ return x.key === 'obsidian-code'; })
           || themes[0];
      if (!t || !t.colors) return;
      Object.keys(REPL_SYN_MAP).forEach(function(k) {
        if (t.colors[k]) document.documentElement.style.setProperty(REPL_SYN_MAP[k], t.colors[k]);
      });
      if (CVD.repl && CVD.repl.cm && CVD.repl.cm.refresh) CVD.repl.cm.refresh();
    }
    applyReplSyntaxTheme();

    // Re-apply whenever settings page saves a new value (cross-tab)
    window.addEventListener('storage', function(e) {
      var fontKeys = ['cv_editor_font_size','cv_repl_font_size','cv_instructions_font_size','cv_editor_font_family','cv_repl_font_family','cv_instructions_font_family'];
      if (fontKeys.indexOf(e.key) !== -1) applyEditorFontSizeFromStorage();
      if (e.key === 'cv_repl_syntax_theme' || e.key === 'cv_syntax_theme') applyReplSyntaxTheme();
    });
  });

  // Apply immediately on load (without overwriting storage keys)
  applyAll(false);

  // Export
  CVD.workspaceControls = { applyAll };
})();
/* ===== cvd-splitters ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;

  const clamp = (CVD.util && typeof CVD.util.clamp === "function")
    ? CVD.util.clamp
    : (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  const setActiveTab = (CVD.tabs && typeof CVD.tabs.setActiveTab === "function")
    ? CVD.tabs.setActiveTab
    : function () {};

  const updateGapWordmark = (CVD.sidebar && typeof CVD.sidebar.updateGapWordmark === "function")
    ? CVD.sidebar.updateGapWordmark
    : function () {};

  // ===== Splitters (drag to resize) =====
  // Elements queried lazily because stage-shell is appended at end of body
  let ws = null, splitTopV = null, splitMainH = null, splitReplV = null;
  function initSplitterEls() {
    ws = $('#workspace');
    splitTopV = $('#splitTopV');
    splitMainH = $('#splitMainH');
    splitReplV = $('#splitReplV');
  }

  function getVarPx(name, fallback){
    if(!ws) return fallback;
    const v = getComputedStyle(ws).getPropertyValue(name).trim();
    return v.endsWith('px') ? parseFloat(v) : fallback;
  }

  function readSizes(){
    try{
      const raw = localStorage.getItem('cv_ws_sizes');
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function writeSizes(s){
    try{ localStorage.setItem('cv_ws_sizes', JSON.stringify(s)); }catch(e){}
  }

  function applyDefaultsIfNeeded(){
    if(!ws) return;
    const rect = ws.getBoundingClientRect();
    const split = 10;
    const saved = readSizes() || {};
    const initialTop = (saved.topPx ?? Math.round((rect.height - split) * 0.75));
    const initialLeft = (saved.leftPx ?? Math.round((rect.width - split) * 0.24));  /* reader 24% = 80% of 30% */
    const initialReplLeft = (saved.replLeftPx ?? Math.round((rect.width - split) * 0.50));
    ws.style.setProperty('--ws-top-px', initialTop + 'px');
    ws.style.setProperty('--ws-left-px', initialLeft + 'px');
    ws.style.setProperty('--ws-repl-left-px', initialReplLeft + 'px');
  }

  function clampToBounds(){
    if(!ws) return;
    const rect = ws.getBoundingClientRect();
    const split = 10;

    const minBottom = 140;
    const minTop = 220;

    const topPx = getVarPx('--ws-top-px', Math.round((rect.height - split) * 0.75));
    const maxTop = Math.max(minTop, rect.height - split - minBottom);
    const clampedTop = clamp(topPx, minTop, maxTop);

    const minSide = 320;
    const leftPx = getVarPx('--ws-left-px', Math.round((rect.width - split) * 0.5));
    const maxLeft = Math.max(minSide, rect.width - split - minSide);
    const clampedLeft = clamp(leftPx, minSide, maxLeft);

    const minRepl = 240;
    const replLeftPx = getVarPx('--ws-repl-left-px', Math.round((rect.width - split) * 0.5));
    const maxReplLeft = Math.max(minRepl, rect.width - split - minRepl);
    const clampedReplLeft = clamp(replLeftPx, minRepl, maxReplLeft);

    ws.style.setProperty('--ws-top-px', clampedTop + 'px');
    ws.style.setProperty('--ws-left-px', clampedLeft + 'px');
    ws.style.setProperty('--ws-repl-left-px', clampedReplLeft + 'px');
    writeSizes({ topPx: clampedTop, leftPx: clampedLeft, replLeftPx: clampedReplLeft });
  }

  window.addEventListener('load', () => {
    initSplitterEls();
    applyDefaultsIfNeeded();
    requestAnimationFrame(clampToBounds);
    bindSplitter(splitTopV, 'left');
    bindSplitter(splitMainH, 'top');
    bindSplitter(splitReplV, 'repl');
  });

  window.addEventListener('resize', () => {
    clampToBounds();
  });

  const drag = { active:false, kind:null, startX:0, startY:0, startVal:0 };

  function beginDrag(kind, e){
    if(!ws) return;
    drag.active = true;
    drag.kind = kind;
    drag.startX = e.clientX;
    drag.startY = e.clientY;

    if(kind === 'left'){
      drag.startVal = getVarPx('--ws-left-px', 0);
      splitTopV && splitTopV.classList.add('dragging');
    }else if(kind === 'top'){
      drag.startVal = getVarPx('--ws-top-px', 0);
      splitMainH && splitMainH.classList.add('dragging');
    }else if(kind === 'repl'){
      drag.startVal = getVarPx('--ws-repl-left-px', 0);
      splitReplV && splitReplV.classList.add('dragging');
    }
    e.preventDefault();
  }

  function endDrag(){
    drag.active = false;
    drag.kind = null;
    splitTopV && splitTopV.classList.remove('dragging');
    splitMainH && splitMainH.classList.remove('dragging');
    splitReplV && splitReplV.classList.remove('dragging');
    clampToBounds();
  }

  function onMove(e){
    if(!drag.active || !ws) return;
    const rect = ws.getBoundingClientRect();
    const split = 10;

    if(drag.kind === 'left'){
      const delta = e.clientX - drag.startX;
      const minSide = 320;
      const maxLeft = Math.max(minSide, rect.width - split - minSide);
      const next = clamp(drag.startVal + delta, minSide, maxLeft);
      ws.style.setProperty('--ws-left-px', next + 'px');
      updateGapWordmark();
    }else if(drag.kind === 'top'){
      const delta = e.clientY - drag.startY;
      const minBottom = 140;
      const minTop = 220;
      const maxTop = Math.max(minTop, rect.height - split - minBottom);
      const next = clamp(drag.startVal + delta, minTop, maxTop);
      ws.style.setProperty('--ws-top-px', next + 'px');
    }else if(drag.kind === 'repl'){
      const delta = e.clientX - drag.startX;
      const minRepl = 240;
      const maxReplLeft = Math.max(minRepl, rect.width - split - minRepl);
      const next = clamp(drag.startVal + delta, minRepl, maxReplLeft);
      ws.style.setProperty('--ws-repl-left-px', next + 'px');
    }
  }

  function bindSplitter(el, kind){
    if(!el) return;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      beginDrag(kind, e);
    });
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 36 : 16;
      if(kind === 'left' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
        const cur = getVarPx('--ws-left-px', 0);
        const delta = (e.key === 'ArrowLeft') ? -step : step;
        ws.style.setProperty('--ws-left-px', (cur + delta) + 'px');
        clampToBounds();
        e.preventDefault();
      }
      if(kind === 'top' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')){
        const cur = getVarPx('--ws-top-px', 0);
        const delta = (e.key === 'ArrowUp') ? -step : step;
        ws.style.setProperty('--ws-top-px', (cur + delta) + 'px');
        clampToBounds();
        e.preventDefault();
      }
      if(kind === 'repl' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
        const cur = getVarPx('--ws-repl-left-px', 0);
        const delta = (e.key === 'ArrowLeft') ? -step : step;
        ws.style.setProperty('--ws-repl-left-px', (cur + delta) + 'px');
        clampToBounds();
        e.preventDefault();
      }
    });
  }


  // Export (optional)
  CVD.splitters = CVD.splitters || {};
})();
/* ===== cvd-focus-modes ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;
  const store = CVD.store;

  const body = document.body;

  const KEY_FOCUS = "cv_focus_mode";
  const KEY_REPL_COLLAPSED = "cv_repl_collapsed";

  function setBtnActive(mode) {
    [["default","#focusDefaultBtn"],["editor","#focusEditorBtn"],["instructions","#focusReadBtn"]].forEach(([m,sel]) => {
      const b = $(sel);
      if (b) b.classList.toggle("active", m === mode);
    });
  }

  function applyReplButtonState() {
    const btnRepl = $("#replToggleBtn");
    if (!btnRepl) return;
    const isCollapsed = body.classList.contains("repl-collapsed");
    btnRepl.classList.toggle("active", !isCollapsed);
    btnRepl.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  }

  function setReplCollapsed(collapsed, opts = {}) {
    body.classList.toggle("repl-collapsed", !!collapsed);
    applyReplButtonState();
    if (!opts.noPersist && store) store.set(KEY_REPL_COLLAPSED, collapsed ? "1" : "0");

    // Let splitters clamp if needed
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  function setFocusMode(mode, opts = {}) {
    const next = (mode === "editor" || mode === "instructions") ? mode : "default";

    body.classList.toggle("focus-editor", next === "editor");
    body.classList.toggle("focus-instructions", next === "instructions");

    setBtnActive(next);

    if (!opts.noPersist && store) store.set(KEY_FOCUS, next);

    // Editors need refresh after layout changes
    requestAnimationFrame(() => {
      if (CVD.editors && typeof CVD.editors.refreshAll === "function") {
        CVD.editors.refreshAll();
      }
      window.dispatchEvent(new Event("resize"));
    });
  }

  function init() {
    const btnDefault = $("#focusDefaultBtn");
    const btnEditor  = $("#focusEditorBtn");
    const btnRead    = $("#focusReadBtn");
    const btnRepl    = $("#replToggleBtn");

    const savedMode = store ? store.get(KEY_FOCUS, "default") : "default";
    const replCollapsed = store ? store.get(KEY_REPL_COLLAPSED, "0") : "0";

    setFocusMode(savedMode, { noPersist: true });
    setReplCollapsed(replCollapsed === "1", { noPersist: true });

    btnDefault && btnDefault.addEventListener("click", () => setFocusMode("default"));
    btnEditor  && btnEditor.addEventListener("click",  () => setFocusMode("editor"));
    btnRead    && btnRead.addEventListener("click",    () => setFocusMode("instructions"));
    btnRepl    && btnRepl.addEventListener("click", () => {
      const isCollapsed = body.classList.contains("repl-collapsed");
      setReplCollapsed(!isCollapsed);
    });
  }

  window._cvdReady( init);

  CVD.focus = CVD.focus || {};
  CVD.focus.setMode = setFocusMode;
  CVD.focus.setReplCollapsed = setReplCollapsed;
})();
/* ===== cvd-repl ===== */
(function () {
  "use strict";
  const CVD = window.CVD;
  const $ = CVD.$;
  const store = CVD.store;

  const input = $("#replInput");
  // Upgrade plain textarea to CodeMirror for syntax highlighting + auto-indent
  let cmRepl = null;
  function initReplCM() {
    if (!window.CodeMirror || !input) return;
    cmRepl = CodeMirror.fromTextArea(input, {
      mode: 'python',
      theme: 'codivium',
      lineNumbers: false,
      lineWrapping: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      autofocus: false,
      extraKeys: {
        'Ctrl-Enter': function() { run(); },
        'Cmd-Enter':  function() { run(); },
        'Alt-Up':   function() { recallHistory(-1); },
        'Alt-Down': function() { recallHistory(1); },
        'Tab': function(cm) {
          if (cm.somethingSelected()) { cm.indentSelection('add'); }
          else { cm.replaceSelection('    ', 'end'); }
        }
      }
    });
    // Apply current syntax theme colours
    if (window.CVD && CVD.syntax && typeof CVD.syntax.applySyntaxTheme === 'function') {
      CVD.syntax.applySyntaxTheme(
        (window.CVD.store && CVD.store.get('cv_syntax_theme', 'obsidian-code')) || 'obsidian-code',
        false
      );
    }
    // Sync font settings
    if (window.CVD && CVD.repl) {
      var size   = CVD.store ? CVD.store.get('cv_repl_size', 'auto') : 'auto';
      var family = CVD.store ? CVD.store.get('cv_repl_font_family', '') : '';
      if (size && size !== 'auto') cmRepl.getWrapperElement().style.fontSize = size;
      if (family) cmRepl.getWrapperElement().style.fontFamily = family;
    }
    // Listen for external theme changes
    document.addEventListener('cv:theme-change', function() {
      if (cmRepl) cmRepl.refresh();
    });
  }
  const outCode = $("#replOutputCode");

  const btnRun = $("#replRunBtn");
  const btnToEditor = $("#replToEditorBtn");
  const btnClear = $("#replClearBtn");
  const btnCopyOut = $("#replCopyOutBtn");
  const btnClearOut = $("#replClearOutBtn");

  const HISTORY_KEY = "cv_repl_history";
  const HISTORY_MAX = 30;

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch (e) {
      return [];
    }
  }

  function writeHistory(arr) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-HISTORY_MAX)));
    } catch (e) {}
  }

  let history = readHistory();
  let historyIdx = history.length;

  function scrollOutputToBottom() {
    if (!outCode) return;
    const pre = outCode.closest("pre");
    if (!pre) return;
    pre.scrollTop = pre.scrollHeight;
  }

  function appendOutput(text) {
    if (!outCode) return;
    const cur = outCode.textContent || "";
    outCode.textContent = cur ? (cur + "\n" + text) : text;
    scrollOutputToBottom();
  }

  function run() {
    if (!input) return;
    const code = (cmRepl ? cmRepl.getValue() : input.value) || "";
    const trimmed = code.trim();
    if (!trimmed) return;

    // History (de-dupe consecutive)
    if (!history.length || history[history.length - 1] !== code) {
      history.push(code);
      history = history.slice(-HISTORY_MAX);
      writeHistory(history);
    }
    historyIdx = history.length;

    // Log input into output area (runner can listen for the event below)
    appendOutput(">>> " + trimmed.replace(/\n/g, "\n... "));

    // Notify external runner (if you wire one later)
    try {
      window.dispatchEvent(new CustomEvent("cvd:repl-run", { detail: { code } }));
    } catch (e) {}
  }

  function clearInput() {
    if (!input && !cmRepl) return;
    if (cmRepl) { cmRepl.setValue(""); cmRepl.focus(); }
    else { if (cmRepl) cmRepl.setValue(""); else input.value = ""; input.focus(); }
    historyIdx = history.length;
  }

  function clearOutput() {
    if (!outCode) return;
    outCode.textContent = "";
  }

  function appendToEditor() {
    if (!input) return;
    const code = (cmRepl ? cmRepl.getValue() : input.value) || "";
    if (!code.trim()) return;

    const ed = CVD.editors;
    if (!ed || typeof ed.get !== "function") return;

    const cm = ed.get("candidate");
    if (cm && cm.getDoc) {
      const doc = cm.getDoc();
      const endPos = doc.posFromIndex(doc.getValue().length);
      doc.replaceRange("\n\n" + code.replace(/\s+$/,"") + "\n", endPos);
      cm.focus();
      cm.refresh && cm.refresh();
      return;
    }

    // Fallback: plain textarea
    const ta = ed.textareas ? ed.textareas.candidate : null;
    if (ta) {
      ta.value = (ta.value || "") + "\n\n" + code.replace(/\s+$/,"") + "\n";
      ta.focus();
    }
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
      const tmp = document.createElement("textarea");
      tmp.value = text;
      tmp.setAttribute("readonly", "");
      tmp.style.position = "fixed";
      tmp.style.left = "-9999px";
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      return true;
    } catch (e) {
      return false;
    }
  }

  function flashBtn(btn, text) {
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = prev;
      btn.disabled = false;
    }, 650);
  }

  function copyOutput() {
    if (!outCode) return;
    const text = outCode.textContent || "";
    copyText(text).then((ok) => {
      flashBtn(btnCopyOut, ok ? "Copied" : "Nope");
    });
  }

  function recallHistory(delta) {
    if (!input) return;
    history = readHistory();
    if (!history.length) return;

    historyIdx = Math.max(0, Math.min(history.length, historyIdx + delta));

    if (historyIdx === history.length) {
      if (cmRepl) cmRepl.setValue(""); else input.value = "";
    } else {
      if (cmRepl) cmRepl.setValue(history[historyIdx]); else input.value = history[historyIdx];
    }
    requestAnimationFrame(() => {
      if (!cmRepl) { input.selectionStart = (cmRepl ? cmRepl.getValue() : input.value).length; }
      if (!cmRepl) { input.selectionEnd = (cmRepl ? cmRepl.getValue() : input.value).length; }
    });
  }

  function bind() {
    if (!input) return;

    btnRun && btnRun.addEventListener("click", run);
    btnClear && btnClear.addEventListener("click", clearInput);
    btnToEditor && btnToEditor.addEventListener("click", appendToEditor);

    btnCopyOut && btnCopyOut.addEventListener("click", copyOutput);
    btnClearOut && btnClearOut.addEventListener("click", clearOutput);

    input.addEventListener("keydown", (e) => {
      // Run: Ctrl+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
        return;
      }

      // History: Alt+Up / Alt+Down
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        recallHistory(e.key === "ArrowUp" ? -1 : 1);
      }
    });
  }

  window._cvdReady(function() { bind(); initReplCM(); });

  CVD.repl = CVD.repl || {};
  CVD.repl.run = run;
  Object.defineProperty(CVD.repl, 'cm', { get: function() { return cmRepl; } });
  CVD.repl.clearOutput = clearOutput;
})();
/* ===== cvd-locks ===== */
(function () {
  "use strict";
  var CVD = window.CVD;
  var store = CVD.store;

  var WHY = {
    hints:    "Hints are locked initially to encourage genuine problem-solving. Reaching for hints too early reduces the cognitive effort that builds long-term memory.",
    tutorial: "The mini tutorial is locked briefly so you attempt the problem first. Working through it yourself — even imperfectly — makes the tutorial far more effective.",
    solution: "Seeing the suggested solution before you have made a real attempt teaches pattern-matching, not problem-solving. A short lock ensures you build the skill, not just the answer.",
    tests:    "Unit tests are locked until after your first submission so you encounter the real test runner output rather than inspecting the tests in advance."
  };

  var DEFAULT_CFG = {
    hints:    { minutes: 2,   attempts: 2 },
    tutorial: { minutes: 4,   attempts: 3 },
    solution: { minutes: 7,   attempts: 5 },
    tests:    { minutes: 9999, attempts: 1 }
  };

  var cfg = null;
  var submissionCount = 0;
  var forceUnlocked = {};  // key → true if force-unlocked this session

  function loadCfg() {
    try {
      var raw = localStorage.getItem("cv_lock_cfg");
      var parsed = raw ? JSON.parse(raw) : null;
      cfg = Object.assign({}, DEFAULT_CFG, parsed || {});
    } catch(e) { cfg = Object.assign({}, DEFAULT_CFG); }
  }

  function saveCfg() {
    try { localStorage.setItem("cv_lock_cfg", JSON.stringify(cfg)); } catch(e) {}
  }

  function isUnlocked(key) {
    if (forceUnlocked[key]) return true;
    var c = cfg[key];
    if (!c) return true;
    var elapsed = CVD.timer ? (CVD.timer.elapsedSeconds() / 60) : 0;
    return (elapsed >= c.minutes) || (submissionCount >= c.attempts);
  }

  function timeUnlockLabel(key) {
    var c = cfg[key];
    if (!c || c.minutes >= 9999) return null;
    var elapsed = CVD.timer ? (CVD.timer.elapsedSeconds() / 60) : 0;
    var mLeft = Math.ceil(c.minutes - elapsed);
    return mLeft > 0 ? mLeft + " minute" + (mLeft !== 1 ? "s" : "") : null;
  }

  function attemptsUnlockLabel(key) {
    var c = cfg[key];
    if (!c) return null;
    var aLeft = c.attempts - submissionCount;
    return aLeft > 0 ? aLeft + " submission" + (aLeft !== 1 ? "s" : "") : null;
  }

  function updateAllLocks() {
    document.querySelectorAll(".tab-btn[data-lock-key]").forEach(function(btn) {
      var key = btn.getAttribute("data-lock-key");
      var locked = !isUnlocked(key);
      btn.setAttribute("data-locked", locked ? "true" : "false");
      if (locked) btn.setAttribute("aria-disabled", "true");
      else btn.removeAttribute("aria-disabled");
    });
  }

  // ── Rich lock tooltip with force-unlock button ─────────────────────────────
  var activeTooltip = null;
  var tooltipTimer  = null;

  function removeTooltip() {
    if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
    if (tooltipTimer)  { clearTimeout(tooltipTimer); tooltipTimer = null; }
  }

  function showLockTooltip(btn, key) {
    removeTooltip();
    var c = cfg[key];
    var tLeft = timeUnlockLabel(key);
    var aLeft = attemptsUnlockLabel(key);
    var why   = WHY[key] || "This tab is temporarily locked.";

    var parts = [];
    if (tLeft) parts.push(tLeft);
    if (aLeft) parts.push(aLeft);
    var whenText = parts.length ? "Unlocks in: " + parts.join(" or ") : "Almost unlocked.";

    var tip = document.createElement("div");
    tip.className = "cv-lock-tooltip";
    tip.innerHTML =
      "<button class=\"cv-lt-close\" type=\"button\" aria-label=\"Close\">&#x2715;</button>" +
      "<div class=\"cv-lt-why\">" + escTip(why) + "</div>" +
      "<div class=\"cv-lt-when\">" + escTip(whenText) + "</div>" +
      "<button class=\"cv-lt-unlock\" data-lock-key=\"" + key + "\" type=\"button\">Unlock now</button>";

    // Append to body so .pane overflow:hidden doesn't clip/block it
    document.body.appendChild(tip);
    var btnRect = btn.getBoundingClientRect();
    tip.style.left = btnRect.left + "px";
    tip.style.top  = (btnRect.bottom + 6) + "px";

    activeTooltip = tip;

    tip.querySelector(".cv-lt-unlock").addEventListener("click", function(e) {
      e.stopImmediatePropagation();
      var k = this.getAttribute("data-lock-key");
      confirmForceUnlock(k, btn);
    });

    tip.querySelector(".cv-lt-close").addEventListener("click", function(e) {
      e.stopImmediatePropagation();
      removeTooltip();
    });

    // Auto-dismiss after 5s unless user is hovering
    tooltipTimer = setTimeout(removeTooltip, 7000);
    tip.addEventListener("mouseenter", function() { clearTimeout(tooltipTimer); });
    tip.addEventListener("mouseleave", function() { tooltipTimer = setTimeout(removeTooltip, 3200); });
  }

  function escTip(s) {
    return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  var CONFIRM_MESSAGES = {
    hints:    "This tab was locked to encourage you to work through the problem independently first. Hints can short-circuit the struggle that leads to real learning. Are you sure you want to unlock it now?",
    tutorial: "The tutorial was locked so you would attempt the problem before reading the explanation. Seeing the tutorial first reduces its effectiveness. Unlock anyway?",
    solution: "The suggested solution was locked to prevent you from seeing the answer before making a genuine attempt. Unlocking it now may limit what you learn from this exercise. Proceed?",
    tests:    "Unit tests were locked until after your first submission to keep the challenge fair and to simulate real conditions. Unlock anyway?"
  };

  function confirmForceUnlock(key, btn) {
    removeTooltip();
    forceUnlocked[key] = true;
    updateAllLocks();
    // Activate the tab that was just unlocked
    if (CVD.tabs && typeof CVD.tabs.setActiveTab === "function") {
      var pane = btn ? btn.getAttribute("data-pane") : null;
      var target = btn ? btn.getAttribute("data-target") : null;
      if (pane && target) CVD.tabs.setActiveTab(pane, target);
    }
  }

  // Intercept clicks and keyboard activations on locked tabs (capture phase)
  // This runs before cvd-tabs's keydown handler so we can block activation.
  function interceptLockedTab(e) {
    var btn = e.target.closest(".tab-btn[data-lock-key]");
    if (!btn || btn.getAttribute("data-locked") !== "true") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showLockTooltip(btn, btn.getAttribute("data-lock-key"));
  }
  document.addEventListener("click", interceptLockedTab, true);
  document.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    interceptLockedTab(e);
  }, true);

  // Also show tooltip on hover (after short delay)
  document.addEventListener("mouseover", function(e) {
    var btn = e.target.closest(".tab-btn[data-lock-key][data-locked=\"true\"]");
    if (!btn) return;
    if (activeTooltip) return; // don't stack tooltips
    var key = btn.getAttribute("data-lock-key");
    tooltipTimer = setTimeout(function() {
      if (btn.getAttribute("data-locked") === "true") showLockTooltip(btn, key);
    }, 600);
  });

  document.addEventListener("mouseout", function(e) {
    var btn = e.target.closest(".tab-btn[data-lock-key]");
    if (!btn || activeTooltip) return;
    clearTimeout(tooltipTimer);
  });

  function onSubmission() {
    submissionCount++;
    try { localStorage.setItem("cv_submission_count", String(submissionCount)); } catch(e) {}
    updateAllLocks();
  }

  // Init on DOMContentLoaded so tab buttons exist when updateAllLocks runs
  window._cvdReady( function() {
    // Restore submission count
    try {
      var n = parseInt(localStorage.getItem("cv_submission_count") || "0", 10);
      submissionCount = isNaN(n) ? 0 : n;
    } catch(e) {}

    loadCfg();
    updateAllLocks();
  });

  // Recheck every 15s for time-based unlocking
  const _lockInterval = setInterval(updateAllLocks, 15000);
  window.addEventListener("pagehide", function() { clearInterval(_lockInterval); });

  // Wire settings palette lock config inputs on Apply
  window._cvdReady( function() {
    var applyBtn = document.getElementById("applyAllControls");
    if (applyBtn) {
      applyBtn.addEventListener("click", function() {
        function numVal(id, fallback) {
          var el = document.getElementById(id);
          var v = el ? parseInt(el.value, 10) : NaN;
          return isNaN(v) ? fallback : v;
        }
        cfg.hints.minutes    = numVal("lockHintsMins",        DEFAULT_CFG.hints.minutes);
        cfg.hints.attempts   = numVal("lockHintsAttempts",    DEFAULT_CFG.hints.attempts);
        cfg.tutorial.minutes  = numVal("lockTutorialMins",    DEFAULT_CFG.tutorial.minutes);
        cfg.tutorial.attempts = numVal("lockTutorialAttempts",DEFAULT_CFG.tutorial.attempts);
        cfg.solution.minutes  = numVal("lockSolutionMins",    DEFAULT_CFG.solution.minutes);
        cfg.solution.attempts = numVal("lockSolutionAttempts",DEFAULT_CFG.solution.attempts);
        cfg.tests.attempts    = numVal("lockTestsAttempts",   DEFAULT_CFG.tests.attempts);
        saveCfg();
        updateAllLocks();
      });
    }

    // Restore config values into inputs
    function setInput(id, val) { var el = document.getElementById(id); if (el) el.value = val; }
    setInput("lockHintsMins",        cfg.hints.minutes);
    setInput("lockHintsAttempts",    cfg.hints.attempts);
    setInput("lockTutorialMins",     cfg.tutorial.minutes);
    setInput("lockTutorialAttempts", cfg.tutorial.attempts);
    setInput("lockSolutionMins",     cfg.solution.minutes);
    setInput("lockSolutionAttempts", cfg.solution.attempts);
    setInput("lockTestsAttempts",    cfg.tests.attempts);
  });

  CVD.locks = {
    update: updateAllLocks,
    onSubmission: onSubmission,
    isUnlocked: isUnlocked,
    getSubmissionCount: function() { return submissionCount; },
    getConfig: function() { return cfg; },
    destroy: function() { clearInterval(_lockInterval); }
  };
})();
/* ===== cvd-exercise-loader ===== */
(function () {
  "use strict";
  var CVD = window.CVD;

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderMd(text) {
    // Always sanitize — never fall back to no-op to prevent XSS on unready util
    var sanitize = (CVD.util && typeof CVD.util.sanitizeHtml === "function")
      ? CVD.util.sanitizeHtml
      : function(s) {
          // Minimal fallback: strip all tags
          return String(s || "").replace(/<[^>]*>/g, "");
        };
    if (window.marked && typeof window.marked.parse === "function") {
      return sanitize(window.marked.parse(String(text || "")));
    }
    return "<pre>" + esc(text) + "</pre>";
  }

  function buildInstructions(ex) {
    var out = '';
    if (ex.name) out += '<h2 class="pane-title">' + esc(ex.name) + '</h2>';
    if (ex.category || ex.difficulty) {
      out += '<div class="cv-exercise-meta">';
      if (ex.category)   out += '<span class="pill pill-level">' + esc(ex.category) + '</span>';
      if (ex.difficulty) out += '<span class="pill">' + esc(ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)) + '</span>';
      if (ex.testsTotal) out += '<span class="pill">' + esc(String(ex.testsTotal)) + ' tests</span>';
      out += '</div>';
    }
    // problemStatement carries the full instructions content — problem description,
    // constraints, and worked examples are all authored inline within this field.
    if (ex.problemStatement) out += '<div class="pane-lead">' + renderMd(ex.problemStatement) + '</div>';
    if (ex.priorAttempts > 0) {
      out += '<p class="cv-prior-info">'
        + 'Prior attempts: ' + esc(String(ex.priorAttempts))
        + (ex.bestPriorScore != null ? ' &mdash; best: ' + esc(String(ex.bestPriorScore)) + '%' : '')
        + (ex.lastSolvedAt ? ' &mdash; last: ' + esc(ex.lastSolvedAt) : '') + '</p>';
    }
    return out;
  }

  function load(payload) {
    if (!payload) return;

    // Document title + page h1
    document.title = "Codivium — " + (payload.name || "Exercise");
    var h1El = document.getElementById("exercisePageTitle");
    if (h1El && payload.name) h1El.textContent = payload.name;

    // Store exercise metadata on CVD for use by feedback adapter
    CVD.currentExerciseMeta = {
      name:       payload.name       || "",
      category:   payload.category   || "",
      difficulty: payload.difficulty || "",
      testsTotal: payload.testsTotal || 0,
      returnMenuUrl: (function() {
        try {
          return decodeURIComponent(
            new URLSearchParams(window.location.search || "").get("from") || ""
          ) || "menu-page.html";
        } catch(e) { return "menu-page.html"; }
      })()
    };

    // Instructions pane
    var instr = document.getElementById("instructionsContent");
    if (instr) instr.innerHTML = buildInstructions(payload);

    // Hints
    var hintsEl = document.getElementById("hintsContent");
    if (hintsEl && payload.hints) hintsEl.innerHTML = renderMd(payload.hints);

    // Unit tests source — split into one collapsible sub-window per def test_xxx()
    var testsEl = document.getElementById("unitTestsContent");
    if (testsEl && payload.unitTestsSource) {
      var src = payload.unitTestsSource;
      // Split on every `def test_` boundary (preserving the def line)
      var blocks = src.trim().split(/\n(?=def test_)/);
      if (blocks.length <= 1) {
        // Fallback: single block, show as before
        testsEl.innerHTML =
          "<pre class=\"code-area\"><code>" + esc(src) + "</code></pre>";
      } else {
        testsEl.innerHTML = blocks.map(function (block, i) {
          var nameM   = block.match(/^def\s+(\w+)\s*\(\s*\)/);
          var rawName = nameM ? nameM[1] : "test_" + (i + 1);
          var label   = rawName + "()";
          var bodyId  = "cv-ut-body-" + i;
          // Cards start collapsed (hidden body, aria-expanded false)
          return "<div class=\"cv-unit-test-card\" data-test-name=\"" + esc(rawName) + "\">" +
            "<button class=\"cv-unit-test-header\" aria-expanded=\"false\" " +
                    "aria-controls=\"" + bodyId + "\" type=\"button\">" +
              "<span class=\"cv-unit-test-index\">" + (i + 1) + "</span>" +
              "<code class=\"cv-unit-test-name\">" + esc(label) + "</code>" +
              "<span class=\"cv-unit-test-status\" aria-hidden=\"true\"></span>" +
              "<span class=\"cv-unit-test-chevron\" aria-hidden=\"true\"></span>" +
            "</button>" +
            "<div class=\"cv-unit-test-body\" id=\"" + bodyId + "\" hidden>" +
              "<pre><code>" + esc(block.trim()) + "</code></pre>" +
            "</div>" +
          "</div>";
        }).join("");

        // Single delegated click handler on the container
        testsEl.addEventListener("click", function (e) {
          var btn = e.target.closest(".cv-unit-test-header");
          if (!btn) return;
          var card    = btn.closest(".cv-unit-test-card");
          var bodyId  = btn.getAttribute("aria-controls");
          var body    = bodyId ? document.getElementById(bodyId) : null;
          if (!body) return;
          var isOpen  = btn.getAttribute("aria-expanded") === "true";
          btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
          if (isOpen) {
            body.hidden = true;
          } else {
            body.removeAttribute("hidden");
          }
        });
      }
    }

    // Mini tutorial
    var tutEl = document.getElementById("miniTutorialContent");
    if (tutEl && payload.miniTutorial) tutEl.innerHTML = renderMd(payload.miniTutorial);

    // Code scaffold
    if (payload.codeScaffold && CVD.editors && typeof CVD.editors.setValue === "function") {
      CVD.editors.setValue("candidate", payload.codeScaffold);
    } else if (payload.codeScaffold) {
      var ta = document.getElementById("candidateEditor");
      if (ta) ta.value = payload.codeScaffold;
    }

    // Suggested solution
    if (payload.suggestedSolution && CVD.editors && typeof CVD.editors.setValue === "function") {
      CVD.editors.setValue("solution", payload.suggestedSolution);
    } else if (payload.suggestedSolution) {
      var sa = document.getElementById("solutionEditor");
      if (sa) sa.value = payload.suggestedSolution;
    }

    // Store exercise ID; reset timer + submission count if exercise changed
    var prevId = "";
    try { prevId = localStorage.getItem("cv_exercise_id") || ""; } catch(e) {}
    var newId = payload.id || "";
    var isNewExercise = (newId && newId !== prevId);
    if (isNewExercise) {
      try {
        localStorage.setItem("cv_exercise_id", newId);
        localStorage.setItem("cv_submission_count", "0");
      } catch(e) {}
      if (CVD.timer) CVD.timer.reset();

      // First time opening this exercise this session: show Instructions tab
      if (CVD.tabs && CVD.tabs.setActiveTab) CVD.tabs.setActiveTab("left", "req");
    }
    CVD.currentExerciseId = newId;

    // Update lock state now that exercise is loaded
    if (CVD.locks) CVD.locks.update();

    // Enable submit now that exercise is loaded (A14/A16)
    if (CVD.submit && typeof CVD.submit.enable === "function") {
      CVD.submit.enable(newId || payload.id || "");
    }

    // M4: Wire back-to-menu link from ?from= URL parameter
    (function() {
      try {
        var fromParam = new URLSearchParams(window.location.search || "").get("from");
        var backLink  = document.getElementById("backToMenu");
        if (backLink && fromParam) {
          backLink.href = decodeURIComponent(fromParam);
          backLink.removeAttribute("hidden");
        }
      } catch(e) { /* safe to ignore */ }
    })();

    // Analytics: exercise loaded (A18)
    if (CVD.submit && typeof CVD.submit.emit === "function") {
      CVD.submit.emit("exercise_loaded", {
        exerciseId: payload.id || "",
        name: payload.name || "",
        difficulty: payload.difficulty || "",
        testsTotal: payload.testsTotal || 0
      });
    }
  }

  // Demo data for local development without backend.
  // Set window.__CODIVIUM_DEMO__ = true in a <script> before this file loads to activate.
  // Then populate window.__CODIVIUM_EXERCISE_DATA__ with the exercise shape.
  var DEMO_EXERCISE = {
    id: "demo_001", name: "Minimum Window Substring",
    category: "Strings", difficulty: "advanced", testsTotal: 24,
    problemStatement: "Given strings s and t, find the minimum window in s that contains all characters of t.",
    constraints: ["1 \u2264 s.length \u2264 10\u2075", "1 \u2264 t.length \u2264 10\u2074", "s and t consist of English letters"],
    examples: [{ input: "s=\"ADOBECODEBANC\", t=\"ABC\"", output: "\"BANC\"", explanation: "BANC contains A, B, C." }],
    codeScaffold: "def minWindow(s: str, t: str) -> str:\n    # Your solution here\n    pass\n",
    hints: "**Hint 1:** Consider using a sliding window approach.\n\n**Hint 2:** A hash map tracking character frequencies will help.",
    miniTutorial: "## Sliding Window Pattern\nUse two pointers and expand/contract the window as you find/lose required characters.",
    unitTestsSource: "def test_min_window():\n    assert minWindow('ADOBECODEBANC', 'ABC') == 'BANC'\n    assert minWindow('a', 'a') == 'a'\n    assert minWindow('a', 'aa') == ''\n",
    suggestedSolution: "def minWindow(s, t):\n    from collections import Counter\n    need = Counter(t)\n    missing = len(t)\n    best = ''\n    l = 0\n    for r, c in enumerate(s):\n        if need[c] > 0:\n            missing -= 1\n        need[c] -= 1\n        while missing == 0:\n            w = s[l:r+1]\n            if not best or len(w) < len(best):\n                best = w\n            need[s[l]] += 1\n            if need[s[l]] > 0:\n                missing += 1\n            l += 1\n    return best\n",
    priorAttempts: 0
  };

  function autoLoad() {
    // Priority 1: server-rendered data embedded in page
    if (window.__CODIVIUM_EXERCISE_DATA__) { load(window.__CODIVIUM_EXERCISE_DATA__); return; }

    // Priority 2: demo mode for local development (set window.__CODIVIUM_DEMO__ = true)
    if (window.__CODIVIUM_DEMO__) { load(DEMO_EXERCISE); return; }

    // Priority 3: fetch from ?id= URL parameter
    var params = new URLSearchParams(window.location.search || "");
    var id = params.get("id");
    if (!id) return;

    // Skip network call if no auth token — avoids a 10s timeout in demo/local mode
    var hasRealToken = !!(
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("cv_auth_token")) ||
      (typeof localStorage   !== "undefined" && localStorage.getItem("cv_auth_token"))
    );
    if (!hasRealToken) return;

    __cvFetchWithRetry(
      "/api/exercise?id=" + encodeURIComponent(id),
      { headers: getAuthHeaders({ "Accept": "application/json" }) },
      10000,
      1
    )
    .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(data) { load(data); })
    .catch(function(err) {
      console.warn("[Codivium] Exercise load failed:", err);
      var instr = document.getElementById("instructionsContent");
      var errMsg = err && err.name === "AbortError"
        ? "Request timed out — please check your connection and retry."
        : (err && err.message ? String(err.message).replace(/</g,"&lt;") : "Unknown error");
      if (instr) {
        instr.innerHTML =
          "<div class=\"cv-load-error\">" +
          "<p class=\"cv-load-error-title\">Could not load exercise</p>" +
          "<p class=\"cv-load-error-msg\">" + errMsg + "</p>" +
          "<button class=\"cv-load-error-retry\" type=\"button\">Retry</button>" +
          "</div>";
        var retry = instr.querySelector(".cv-load-error-retry");
        if (retry) retry.addEventListener("click", function() {
          instr.innerHTML = "<p class=\"hint-note\">Loading\u2026</p>";
          autoLoad();
        });
      }
    });
  }

  CVD.exercise = { load: load, autoLoad: autoLoad };

  if (document.readyState === "loading") {
    window._cvdReady( autoLoad);
  } else {
    autoLoad();
  }
})();
/* ===== cvd-submit-stub ===== */
(function () {
  "use strict";
  var CVD = window.CVD || {};

  var _sessionId    = null;
  var _sessionStart = Date.now();
  var _submitting   = false;
  var _attemptCount = 0;

  /* ── Helpers ──────────────────────────────────────────────── */
  function $id(id) { return document.getElementById(id); }

  function createSessionId() {
    return "sess_" + Date.now().toString(36) + "_" +
           Math.random().toString(36).slice(2, 8);
  }

  function elapsedSecs() {
    return Math.round((Date.now() - _sessionStart) / 1000);
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ── Status + pending UX (A17) ────────────────────────────── */
  function setStatus(msg, cls) {
    var el = $id("editorStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.className   = "cv-editor-status" + (cls ? " cv-status-" + cls : "");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("role", "status");
  }

  function setPending(on) {
    var btn = $id("submitSolution");
    if (!btn) return;
    btn.disabled    = on;
    btn.textContent = on ? "Running tests\u2026" : "Submit";
    btn.setAttribute("aria-busy", on ? "true" : "false");
    _submitting = on;
  }

  /* ── Validation (A16) ─────────────────────────────────────── */
  function getCode() {
    if (CVD.editors && CVD.editors.candidate &&
        typeof CVD.editors.candidate.getValue === "function") {
      return CVD.editors.candidate.getValue();
    }
    var ta = $id("candidateEditor");
    return ta ? ta.value : "";
  }

  function validate() {
    var code = getCode();
    if (!code || !code.trim()) {
      setStatus("Write some code before submitting.", "warn");
      return null;
    }
    var exerciseId = window.__cvExerciseId ||
      (CVD.store && CVD.store.get("cv_exercise_id", "")) || "";
    if (!exerciseId) {
      setStatus("No exercise loaded \u2014 cannot submit.", "warn");
      return null;
    }
    if (!_sessionId) {
      // Session should have been created at exercise load — create now as fallback
      _sessionId = createSessionId();
    }
    return { code: code.trim(), exerciseId: exerciseId };
  }

  /* ── Test results renderer (A17) ─────────────────────────── */
  function renderResults(response) {
    var panel   = $id("testResults");
    var summary = $id("testSummary");
    var list    = $id("testCaseList");
    if (!panel) return;

    panel.hidden = false;

    var passed  = response.testsPassed || 0;
    var total   = response.testsTotal  || 0;
    var results = response.testResults || [];   // per-test array (new API field)
    var failed  = response.failedTests || [];   // legacy fallback

    if (summary) {
      summary.textContent = passed + " / " + total + " test" +
        (total !== 1 ? "s" : "") + " passed";
      summary.className = "cv-test-summary " +
        (response.accepted ? "cv-test-pass" : "cv-test-fail");
    }

    // ── Stamp tick/cross on Unit Tests tab cards (if rendered) ─────────────
    if (results.length > 0) {
      var testsEl = $id("unitTestsContent");
      if (testsEl) {
        results.forEach(function (t) {
          if (!t.name) return;
          var card = testsEl.querySelector(
            ".cv-unit-test-card[data-test-name=\"" + t.name + "\"]"
          );
          if (!card) return;
          var statusEl = card.querySelector(".cv-unit-test-status");
          var isPass   = (t.status === "pass");
          if (statusEl) {
            statusEl.textContent    = isPass ? "✓" : "✗";
            statusEl.className      = "cv-unit-test-status " +
              (isPass ? "cv-ut-status-pass" : "cv-ut-status-fail");
            statusEl.removeAttribute("aria-hidden");
            statusEl.setAttribute("aria-label", isPass ? "Passed" : "Failed");
          }
          // Also mark the card itself so the header colour can change
          card.setAttribute("data-status", isPass ? "pass" : "fail");
        });
      }
    }

    if (!list) return;

    // ── Per-test sub-windows (new: testResults array present) ──────────────
    if (results.length > 0) {
      list.innerHTML = results.map(function (t, i) {
        var isPass = (t.status === "pass");
        var label  = t.name ? esc(t.name) + "()" : "Test " + (i + 1);
        return "<li class=\"cv-test-item " + (isPass ? "cv-test-pass" : "cv-test-fail") + "\">" +
          "<div class=\"cv-test-label\">" +
            "<span class=\"cv-test-index\">" + (i + 1) + "</span>" +
            "<code class=\"cv-test-name\">" + label + "</code>" +
            "<span class=\"cv-test-badge " + (isPass ? "cv-badge-pass" : "cv-badge-fail") + "\">" +
              (isPass ? "PASS" : "FAIL") +
            "</span>" +
          "</div>" +
          (!isPass
            ? "<div class=\"cv-test-row\"><span class=\"cv-tr-key\">Input:</span>" +
              "<code>" + esc(t.input || "") + "</code></div>" +
              "<div class=\"cv-test-row\"><span class=\"cv-tr-key\">Expected:</span>" +
              "<code>" + esc(t.expected || "") + "</code></div>" +
              "<div class=\"cv-test-row\"><span class=\"cv-tr-key\">Got:</span>" +
              "<code class=\"cv-got\">" + esc(t.got || "") + "</code></div>"
            : "") +
        "</li>";
      }).join("");
      return;
    }

    // ── Legacy fallback: failedTests array only (old API) ──────────────────
    if (!failed.length) {
      list.innerHTML = "<li class=\"cv-test-item cv-test-pass\">" +
        "All " + total + " tests passed.</li>";
    } else {
      list.innerHTML = failed.map(function (t, i) {
        return "<li class=\"cv-test-item cv-test-fail\">" +
          "<div class=\"cv-test-label\">Failed test " + (i + 1) + "</div>" +
          "<div class=\"cv-test-row\"><span class=\"cv-tr-key\">Input:</span>" +
          "<code>" + esc(t.input) + "</code></div>" +
          "<div class=\"cv-test-row\"><span class=\"cv-tr-key\">Expected:</span>" +
          "<code>" + esc(t.expected) + "</code></div>" +
          "<div class=\"cv-test-row\"><span class=\"cv-tr-key\">Got:</span>" +
          "<code class=\"cv-got\">" + esc(t.got) + "</code></div></li>";
      }).join("") +
      (passed > 0
        ? "<li class=\"cv-test-item cv-test-info\">" + passed +
          " other test" + (passed !== 1 ? "s" : "") + " passed.</li>"
        : "");
    }
  }

  function clearResults() {
    var panel = $id("testResults");
    if (panel) { panel.hidden = true; }
    var list = $id("testCaseList");
    if (list) { list.innerHTML = ""; }
    var summary = $id("testSummary");
    if (summary) { summary.textContent = ""; summary.className = "cv-test-summary"; }
  }

  /* ── Analytics (A18) ─────────────────────────────────────── */
  function emit(event, detail) {
    try {
      var payload = Object.assign({ sessionId: _sessionId, ts: Date.now() }, detail || {});
      // 1. CustomEvent for host-page listeners
      document.dispatchEvent(new CustomEvent("cvd:" + event, { detail: payload, bubbles: false }));
      // 2. CVD.analytics hook (set window.CVD.analytics = { track: fn } to intercept)
      if (CVD.analytics && typeof CVD.analytics.track === "function") {
        CVD.analytics.track(event, payload);
      }
      // 3. window.cvdTrack shorthand
      if (typeof window.cvdTrack === "function") {
        window.cvdTrack(event, payload);
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  /* ── Submit handler (A14) ─────────────────────────────────── */
  function handleSubmit() {
    if (_submitting) return;

    var validated = validate();
    if (!validated) return;

    _attemptCount++;
    emit("submit_clicked", {
      exerciseId: validated.exerciseId,
      attempt: _attemptCount,
      codeLength: validated.code.length
    });

    var countEl = $id("attemptCount");
    if (countEl) countEl.textContent = "Attempt " + _attemptCount;

    setPending(true);
    clearResults();
    setStatus("Running tests\u2026", "running");

    /* CSRF token — set window.__CODIVIUM_CSRF_TOKEN before this script loads */
    var headers = { "Content-Type": "application/json", "Accept": "application/json" };
    if (window.__CODIVIUM_CSRF_TOKEN) {
      headers["X-Csrf-Token"] = window.__CODIVIUM_CSRF_TOKEN;
    }

    /* In demo mode (no backend), return a fake accepted response so the
     * feedback modal can be exercised. Set window.__CODIVIUM_DEMO_SUBMIT__
     * to false in a <script> before editor-page.js to disable this.
     * See: contracts/IFeedbackBuilder.contract.md for the feedback shape.
     */
    if (window.__CODIVIUM_DEMO__) {
      var demoDelay = 900; // ms — simulate network latency
      setTimeout(function () {
        var meta      = (CVD.currentExerciseMeta || {});
        var isPrev    = (meta && meta.category === "Arrays"); // arrays demo has prior history
        var demoResp  = {
          accepted:     _attemptCount > 1,
          testsPassed:  _attemptCount > 1 ? (meta.testsTotal || 10) : 7,
          testsTotal:   meta.testsTotal || 10,
          /* Per-test sub-windows: one entry per unit test in source order.
           * On first attempt: 3 tests fail (showing the expanded input/expected/got rows).
           * On subsequent attempts: all tests pass (showing compact pass badges). */
          testResults: (function () {
            var allPass = _attemptCount > 1;
            var tests = [
              { name: "test_example1",    input: "nums = [-1,0,1,2,-1,-4]", expected: "[[-1,-1,2],[-1,0,1]]", got: allPass ? "[[-1,-1,2],[-1,0,1]]" : "[[-1,-1,2],[-1,0,1]]", status: "pass" },
              { name: "test_no_result",   input: "nums = [0,1,1]",           expected: "[]",                   got: "[]",                                                       status: "pass" },
              { name: "test_zeros",       input: "nums = [0,0,0]",           expected: "[[0,0,0]]",            got: allPass ? "[[0,0,0]]" : "[]",                               status: allPass ? "pass" : "fail" },
              { name: "test_empty",       input: "nums = []",                expected: "[]",                   got: "[]",                                                       status: "pass" },
              { name: "test_two_elements",input: "nums = [0,0]",             expected: "[]",                   got: "[]",                                                       status: "pass" },
              { name: "test_duplicates",  input: "nums = [-2,0,0,2,2]",      expected: "[[-2,0,2]]",           got: allPass ? "[[-2,0,2]]" : "[[-2,0,2],[-2,0,2]]",             status: allPass ? "pass" : "fail" },
              { name: "test_all_same",    input: "nums = [1,1,1]",           expected: "[]",                   got: "[]",                                                       status: "pass" },
              { name: "test_negatives",   input: "nums = [-4,-2,-2,0,1,2,3]",expected: "len > 0",              got: allPass ? "len > 0" : "[]",                                 status: allPass ? "pass" : "fail" },
              { name: "test_positive_only",input:"nums = [1,2,3,4,5]",       expected: "[]",                   got: "[]",                                                       status: "pass" },
              { name: "test_with_zeros",  input: "nums = [-2,-1,0,1,2,3]",   expected: "contains [-1,0,1]",    got: allPass ? "contains [-1,0,1]" : "contains [-1,0,1]",        status: "pass" }
            ];
            return tests;
          })(),
          failedTests: [],   // legacy field — kept for backward compatibility
          feedback: {
            exerciseName:          meta.name       || "Exercise",
            category:              meta.category   || "Strings",
            difficulty:            meta.difficulty || "advanced",
            isFirstSolve:          !isPrev,
            bestPreSuccessPercent: _attemptCount > 1 ? 92 : null,
            timeToFirstAttemptSecs: Math.max(30, Math.round(elapsedSecs() * 0.18)),
            avgIterationSeconds:   _attemptCount > 1 ? Math.round(elapsedSecs() / _attemptCount) : null,
            /* Pre-computed by IFeedbackBuilder (demo approximation) */
            insightText: (function() {
              var lines = [];
              if (_attemptCount === 1) lines.push("First-attempt acceptance \u2014 your pre-submission reasoning was precise.");
              else if (_attemptCount === 2) lines.push("Two submissions to acceptance. Your first attempt already reached 92% of tests \u2014 one focused iteration closed the gap.");
              else lines.push("Accepted in " + _attemptCount + " submissions.");
              var ratio = elapsedSecs() / (meta.difficulty === "advanced" ? 9600 : meta.difficulty === "intermediate" ? 7200 : 5400);
              if (ratio <= 0.30) lines.push("Time to acceptance was well inside the reference window \u2014 strong signal of a solid mental model.");
              else if (ratio <= 0.60) lines.push("Solve time is comfortably within the expected range.");
              else lines.push("Solid effort \u2014 keep practising to tighten the time.");
              if (isPrev) lines.push("8% faster than your previous attempt \u2014 growing familiarity with this problem structure is paying off.");
              return lines.join(" ");
            })(),
            chips: (function() {
              var c = [];
              if (_attemptCount === 1) c.push("First-try pass");
              else if (_attemptCount === 2) c.push("A2 convergence");
              if (!isPrev) c.push("First solve");
              else c.push("Personal best time");
              if (_attemptCount > 1) c.push("Best pre-pass: 92%");
              return c;
            })(),
            nextSuggestion: _attemptCount === 1
              ? "Strong run \u2014 try a harder challenge."
              : "Continue: next " + (meta.difficulty || "advanced") + " " + (meta.category || "Strings") + " exercise.",
            performanceTier: _attemptCount === 1 ? "optimal" : (_attemptCount <= 2 ? "good" : "acceptable"),
            history: isPrev ? [
              { timeToSuccessSeconds: 1020, attempts: 4 },
              { timeToSuccessSeconds: 880,  attempts: 3 },
              { timeToSuccessSeconds: 790,  attempts: 2 },
              { timeToSuccessSeconds: elapsedSecs(), attempts: _attemptCount }
            ] : [],
            deltas: isPrev ? { timeToSuccess: -8, attempts: -25 } : null
          }
        };
        setPending(false);
        if (CVD.locks && typeof CVD.locks.onSubmission === "function") CVD.locks.onSubmission();
        renderResults(demoResp);
        setStatus("All tests passed! (demo mode)", "success");
        emit("submit_success", { exerciseId: validated.exerciseId, attempt: _attemptCount,
          testsPassed: demoResp.testsPassed, testsTotal: demoResp.testsTotal });

        /* Show feedback modal */
        if (typeof window.CodiviumFeedback !== "undefined" &&
            typeof window.CodiviumFeedback.show === "function") {
          var fb   = demoResp.feedback;
          var mta  = (CVD.currentExerciseMeta || {});
          window.CodiviumFeedback.show({
            exerciseId:   validated.exerciseId,
            exerciseName: fb.exerciseName,
            category:     fb.category,
            difficulty:   fb.difficulty,
            testsPassed:  demoResp.testsPassed,
            testsTotal:   demoResp.testsTotal,
            returnMenuUrl: mta.returnMenuUrl || "menu-page.html",
            current: {
              timeToSuccessSeconds:   elapsedSecs(),
              attempts:               _attemptCount,
              bestPreSuccessPercent:  fb.bestPreSuccessPercent,
              timeToFirstAttemptSecs: fb.timeToFirstAttemptSecs,
              avgIterationSeconds:    fb.avgIterationSeconds
            },
            insightText:     fb.insightText,
            chips:           fb.chips,
            nextSuggestion:  fb.nextSuggestion,
            performanceTier: fb.performanceTier,
            isFirstSolve:    fb.isFirstSolve,
            history:         fb.history,
            deltas:          fb.deltas
          });
        }
      }, demoDelay);
      return; // Don't make the real fetch
    }

    /* Input validation: guard against oversized submissions */
    const MAX_CODE_BYTES = 51200; // 50 KB
    if (new Blob([body]).size > MAX_CODE_BYTES) {
      CVD.feedback && CVD.feedback.showError && CVD.feedback.showError('Code submission too large (max 50 KB). Please reduce your solution size.');
      return;
    }

    /* Payload shape: see contracts/exercise-workspace-api.contract.md */
    __cvFetch("/api/exercise/submit", {
      method:      "POST",
      headers:     headers,
      body: JSON.stringify({
        exerciseId:  validated.exerciseId,
        track:       (function() {
          try {
            var from = decodeURIComponent(
              new URLSearchParams(window.location.search || "").get("from") || ""
            );
            var m = from.match(/[?&]track=([^&]+)/);
            return m ? m[1] : "micro";
          } catch(e) { return "micro"; }
        })(),
        code:        validated.code,
        sessionId:   _sessionId,
        elapsedSecs: elapsedSecs(),
        attempt:     _attemptCount
      })
    }, 15000)
    .then(function (r) {
      if (r.status === 429) throw Object.assign(new Error("Rate limited"),
        { code: "RATE_LIMITED", status: 429 });
      if (!r.ok) throw Object.assign(new Error("HTTP " + r.status),
        { status: r.status });
      return r.json();
    })
    .then(function (response) {
      setPending(false);

      /* Notify lock system of submission */
      if (CVD.locks && typeof CVD.locks.onSubmission === "function") {
        CVD.locks.onSubmission();
      }

      renderResults(response);

      if (response.accepted) {
        setStatus("All tests passed!", "success");
        emit("submit_success", {
          exerciseId: validated.exerciseId,
          attempt: _attemptCount,
          testsPassed: response.testsPassed,
          testsTotal: response.testsTotal
        });
        /* Show feedback modal.
         * The server (IFeedbackBuilder) pre-computes insightText, chips, nextSuggestion,
         * performanceTier, bestPreSuccessPercent, avgIterationSeconds, history, deltas.
         * The client contributes timeToSuccessSeconds (measured here) and attempts (counted here).
         * See: contracts/IFeedbackBuilder.contract.md
         * See: feedback.js header for the complete result shape.
         */
        if (typeof window.CodiviumFeedback !== "undefined" &&
            typeof window.CodiviumFeedback.show === "function") {
          var fb   = response.feedback || {};
          var meta = (CVD.currentExerciseMeta || {});
          var exId = window.__cvExerciseId || "";

          var feedbackPayload = {
            /* ── Identity ── */
            exerciseId:   exId,
            exerciseName: fb.exerciseName || meta.name || "Exercise",
            category:     fb.category    || meta.category || "",
            difficulty:   fb.difficulty  || meta.difficulty || "",

            /* ── Test outcome ── */
            testsPassed:  response.testsPassed || 0,
            testsTotal:   response.testsTotal  || meta.testsTotal || 0,

            /* ── Navigation ── */
            returnMenuUrl:   meta.returnMenuUrl || "menu-page.html",
            nextExerciseId:  fb.nextExerciseId  || null,
            nextExerciseName: fb.nextExerciseName || null,

            /* ── Current session metrics ──
             * timeToSuccessSeconds + attempts: CLIENT measures these.
             * Everything else: SERVER provides via IFeedbackBuilder.
             */
            current: {
              timeToSuccessSeconds:   elapsedSecs(),    /* client */
              attempts:               _attemptCount,    /* client */
              bestPreSuccessPercent:  fb.bestPreSuccessPercent  != null ? fb.bestPreSuccessPercent  : null,
              timeToFirstAttemptSecs: fb.timeToFirstAttemptSecs != null ? fb.timeToFirstAttemptSecs : null,
              avgIterationSeconds:    fb.avgIterationSeconds    != null ? fb.avgIterationSeconds    : null
            },

            /* ── Server-computed display fields (IFeedbackBuilder) ── */
            insightText:     fb.insightText     || "",
            chips:           Array.isArray(fb.chips) ? fb.chips : [],
            nextSuggestion:  fb.nextSuggestion  || "",
            performanceTier: fb.performanceTier || null,

            /* ── History + deltas (optional — enables charts + delta indicators) ── */
            isFirstSolve: fb.isFirstSolve != null ? fb.isFirstSolve : false,
            history:      Array.isArray(fb.history) ? fb.history : [],
            deltas:       fb.deltas || null
          };

          window.CodiviumFeedback.show(feedbackPayload);
        }
      } else {
        var p = response.testsPassed || 0;
        var t = response.testsTotal  || 0;
        setStatus(p + " / " + t + " tests passed \u2014 keep going.", "fail");
        emit("submit_fail", {
          exerciseId: validated.exerciseId,
          attempt: _attemptCount,
          testsPassed: p,
          testsTotal: t
        });
      }
    })
    .catch(function (err) {
      setPending(false);
      var msg = err.code === "RATE_LIMITED"
        ? "Too many submissions \u2014 please wait before retrying."
        : "Submission error: " + (err.message || "Unknown error") + " \u2014 please try again.";
      setStatus(msg, "error");
      emit("submit_error", {
        exerciseId: validated.exerciseId,
        attempt: _attemptCount,
        error: err.message,
        status: err.status
      });
    });
  }

  /* ── Init ─────────────────────────────────────────────────── */
  window._cvdReady( function () {
    var btn = $id("submitSolution");
    if (!btn) return;
    btn.addEventListener("click", handleSubmit);
    btn.disabled = true; /* Re-enabled when exercise loads via CVD.submit.enable() */
  });

  /* ── Public API ───────────────────────────────────────────── */
  CVD.submit = {
    enable: function (exerciseId) {
      var btn = $id("submitSolution");
      if (btn) btn.disabled = false;
      if (exerciseId) window.__cvExerciseId = exerciseId;
      /* Create session ID at exercise load time */
      if (!_sessionId) {
        _sessionId    = createSessionId();
        _sessionStart = Date.now();
      }
      emit("exercise_loaded", { exerciseId: exerciseId || "" });
    },
    disable: function () {
      var btn = $id("submitSolution");
      if (btn) btn.disabled = true;
    },
    getSessionId: function () { return _sessionId; },
    emit: emit  /* expose for loader/tab modules to fire analytics events */
  };

  window.CVD = CVD;
})();



/* ===== cvd-tour ===== */
(function() {
  "use strict";
  var CVD = window.CVD || {};

  var STEPS = [
    {
      target: "#paneLeft",
      title: "Exercise Window",
      body: "This is your primary reading pane. The Exercise tab shows the problem statement, constraints, and examples. Work through it carefully before writing code."
    },
    {
      target: "#tab-left-req",
      title: "Exercise Tab",
      body: "Start here — read the full problem description, understand the inputs and outputs, and study the examples before touching the editor."
    },
    {
      target: "#tab-left-hints",
      title: "Hints (Locked)",
      body: "Hints unlock after a set number of submissions. They guide you toward the solution without giving it away. Resist the urge to unlock early — the struggle builds skill."
    },
    {
      target: "#tab-left-tests",
      title: "Unit Tests (Locked)",
      body: "View the full test suite after enough attempts. Tests reveal edge cases you may not have considered."
    },
    {
      target: "#tab-left-tutorial",
      title: "Mini Tutorial (Locked)",
      body: "A concise tutorial on the core concept behind this exercise. Unlocks after a set number of attempts — try the problem genuinely first."
    },
    {
      target: "#paneRight",
      title: "Code Editor",
      body: "Write your Python solution here. The editor supports syntax highlighting, auto-indent, and multiple colour themes. Your code persists across sessions."
    },
    {
      target: "#tab-right-candidate",
      title: "Your Code Tab",
      body: "This is your working space. Write, test, and refine your solution here."
    },
    {
      target: "#tab-right-solution",
      title: "Suggested Solution (Locked)",
      body: "A model solution unlocks after you submit. Compare it to your own approach to deepen understanding — there's often more than one good answer."
    },
    {
      target: "#submitSolution",
      title: "Submit Button",
      body: "When you\'re satisfied with your solution, submit it. Each submission is tracked. Your code is checked against the full test suite and feedback is shown below."
    },
    {
      target: "#paneReplIn",
      title: "REPL Input",
      body: "Run arbitrary Python here without submitting. Use it to test ideas, debug edge cases, or explore library functions. Hit the Run button or Ctrl+Enter."
    },
    {
      target: "#paneReplOut",
      title: "REPL Output",
      body: "Output from your REPL runs appears here — print statements, errors, and return values. Clear it with the button in the pane header."
    },
    {
      target: "#wsControls",
      title: "Layout Controls",
      body: "Switch between three workspace layouts: Default (all panes), Code Focus (editor maximised), and Read Focus (instructions maximised). The REPL toggle shows or hides the bottom row."
    },
    {
      target: "#cvTimer",
      title: "Session Timer",
      body: "Tracks how long you\'ve spent on this exercise. The analog clock face and digital readout update every second. Click the eye toggle to hide or show it."
    }
  ];

  var current = 0;
  var overlay, spotlight, card;

  function $(sel) { return document.querySelector(sel); }

  function getRect(sel) {
    var el = $(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 };
  }

  function buildCard() {
    overlay = document.createElement("div");
    overlay.id = "tourOverlay";
    document.body.appendChild(overlay);

    spotlight = document.createElement("div");
    spotlight.id = "tourSpotlight";
    document.body.appendChild(spotlight);

    card = document.createElement("div");
    card.id = "tourCard";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Guided tour");
    card.setAttribute("tabindex", "-1");
    var closeBtn = document.createElement("button");
    closeBtn.id = "tourClose";
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.setAttribute("aria-label", "Close tour");
    closeBtn.addEventListener("click", endTour);
    card.appendChild(closeBtn);
    document.body.appendChild(card);

    // Focus trap inside tour card
    card.addEventListener("keydown", function(e) {
      if (e.key !== "Tab") return;
      var focusable = Array.from(card.querySelectorAll("button, [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

  }

  function positionCard(rect) {
    if (!rect) return;
    var cardW = 320, cardH = 180;
    var vw = window.innerWidth, vh = window.innerHeight;
    var top, left;
    // Prefer below
    if (rect.top + rect.height + cardH + 16 < vh) {
      top = rect.top + rect.height + 10;
    } else {
      top = rect.top - cardH - 10;
    }
    // Align left with target, but clamp
    left = rect.left;
    if (left + cardW > vw - 10) left = vw - cardW - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    card.style.top  = top + "px";
    card.style.left = left + "px";
  }

  function render() {
    var step = STEPS[current];
    var rect = getRect(step.target);

    // Spotlight
    if (rect) {
      spotlight.style.top    = rect.top + "px";
      spotlight.style.left   = rect.left + "px";
      spotlight.style.width  = rect.width + "px";
      spotlight.style.height = rect.height + "px";
    }

    // Card content
    var dots = STEPS.map(function(_, i) {
      return "<div class=\"tour-dot" + (i === current ? " active" : "") + "\"></div>";
    }).join("");

    card.innerHTML =
      "<button id=\"tourClose\" aria-label=\"Close tour\">&#x2715;</button>" +
      "<div class=\"tour-step-label\">Step " + (current + 1) + " of " + STEPS.length + "</div>" +
      "<div class=\"tour-title\">" + step.title + "</div>" +
      "<div class=\"tour-body\">" + step.body + "</div>" +
      "<div class=\"tour-actions\">" +
        "<div class=\"tour-dots\">" + dots + "</div>" +
        "<div class=\"tour-nav\">" +
          (current > 0 ? "<button class=\"tour-nav-btn\" id=\"tourPrev\">Back</button>" : "") +
          (current < STEPS.length - 1
            ? "<button class=\"tour-nav-btn primary\" id=\"tourNext\">Next</button>"
            : "<button class=\"tour-nav-btn primary\" id=\"tourEnd\">Finish</button>") +
        "</div>" +
      "</div>";

    card.querySelector("#tourClose").addEventListener("click", endTour);
    var prevBtn = card.querySelector("#tourPrev");
    var nextBtn = card.querySelector("#tourNext");
    var endBtn  = card.querySelector("#tourEnd");
    if (prevBtn) prevBtn.addEventListener("click", function() { current--; render(); });
    if (nextBtn) nextBtn.addEventListener("click", function() { current++; render(); });
    if (endBtn)  endBtn.addEventListener("click",  endTour);

    positionCard(rect);
    // Move focus into the card for keyboard users
    requestAnimationFrame(function() {
      var firstBtn = card.querySelector("button");
      if (firstBtn) firstBtn.focus();
    });
  }

  function startTour() {
    current = 0;
    if (!overlay) buildCard();
    overlay.style.display = "block";
    spotlight.style.display = "block";
    card.style.display = "block";
    render();
  }

  function endTour() {
    if (overlay)    overlay.style.display    = "none";
    if (spotlight)  spotlight.style.display  = "none";
    if (card)       card.style.display       = "none";
  }

  window._cvdReady( function() {
    var btn = document.getElementById("tourBtn");
    if (btn) btn.addEventListener("click", startTour);
  });

  // Close on Escape
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") endTour();
  });

  CVD.tour = { start: startTour, end: endTour };
})();
