(function (window, document) {
  "use strict";

  function byId(id) {
    return id ? document.getElementById(id) : null;
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text || "";
  }

  function show(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("hidden");
    el.classList.add("is-visible");
  }

  function hide(el) {
    if (!el) return;
    el.hidden = true;
    el.setAttribute("hidden", "hidden");
    el.classList.remove("is-visible");
  }

  function ensureStatus(containerId, className, anchor) {
    var existing = byId(containerId);
    if (existing) return existing;

    var el = document.createElement("div");
    el.id = containerId;
    if (className) el.className = className;
    el.setAttribute("aria-live", "polite");
    el.hidden = true;

    var anchorEl = anchor && anchor.nodeType === 1 ? anchor : null;
    if (anchorEl && anchorEl.parentNode) {
      anchorEl.parentNode.insertBefore(el, anchorEl.nextSibling);
    }
    return el;
  }

  function showToast(opts) {
    opts = opts || {};
    var box = byId(opts.boxId || "toast");
    var titleEl = byId(opts.titleId || "toastTitle");
    var textEl = byId(opts.textId || "toastText") || byId(opts.textId || "toastMsg");
    if (!box) return;
    if (titleEl && opts.title) setText(titleEl, opts.title);
    if (textEl) setText(textEl, opts.text || "");
    box.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      box.classList.remove("show");
    }, opts.duration || 3400);
  }

  function showInlineStatus(opts) {
    opts = opts || {};
    var el = byId(opts.id);
    if (!el) {
      el = ensureStatus(opts.id, opts.className, opts.anchor);
    }
    if (!el) return;
    setText(el, opts.text || "");
    el.classList.remove("error", "ok", "info");
    if (opts.type) el.classList.add(opts.type);
    if (opts.text) {
      show(el);
    } else {
      hide(el);
    }
  }

  function showSuccessPanel(opts) {
    opts = opts || {};
    var errorEl = byId(opts.errorId);
    var successEl = byId(opts.successId);
    var successTextEl = byId(opts.successTextId);
    if (errorEl) {
      setText(errorEl, "");
      hide(errorEl);
    }
    if (successTextEl) setText(successTextEl, opts.text || "");
    if (successEl) show(successEl);
  }

  function showErrorPanel(opts) {
    opts = opts || {};
    var errorEl = byId(opts.errorId);
    var successEl = byId(opts.successId);
    var successTextEl = byId(opts.successTextId);
    if (successEl) hide(successEl);
    if (successTextEl) setText(successTextEl, "");
    if (errorEl) {
      setText(errorEl, opts.text || "");
      show(errorEl);
    }
  }

  window.CVPlaceholderFlow = {
    messages: {
      login: "",
      join: "",
      contact: "",
      reset: ""
    },
    ensureStatus: ensureStatus,
    showToast: showToast,
    showInlineStatus: showInlineStatus,
    showSuccessPanel: showSuccessPanel,
    showErrorPanel: showErrorPanel,
    hide: hide,
    show: show,
    setText: setText,
    byId: byId
  };
})(window, document);
