/* Codivium Scoring (KaTeX) — auto-render bootstrap
   - Keeps the HTML doc CSP-friendly (no inline scripts)
   - Renders $$...$$ and \( ... \) blocks
*/

(() => {
  "use strict";

  function safeRender() {
    const fn = window.renderMathInElement;
    if (typeof fn !== "function") {
      // KaTeX not loaded (offline / blocked). Leave the raw TeX visible.
      return;
    }

    try {
      fn(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false,
        strict: "ignore"
      });
    } catch (_) {
      // Best-effort render only; never hard-fail the doc.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeRender, { once: true });
  } else {
    safeRender();
  }
})();
