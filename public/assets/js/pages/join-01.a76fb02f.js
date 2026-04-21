(function(){
  "use strict";

  // Pre-select plan from URL ?plan=week|month|year
  (function(){
    var params = new URLSearchParams(window.location.search);
    var plan = params.get('plan');
    var hidden = document.getElementById('selectedPlan');
    if (hidden && plan) hidden.value = plan;
  })();

  function $(id){ return document.getElementById(id); }

  function isEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }

  function pwStrong(v){
    v = String(v || "");
    if (v.length < 8) return false;
    if (!/[a-z]/.test(v)) return false;
    if (!/[A-Z]/.test(v)) return false;
    if (!/[0-9]/.test(v)) return false;
    if (!/[^A-Za-z0-9]/.test(v)) return false;
    return true;
  }

  function setEnabled(btn, enabled){
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute("aria-disabled", enabled ? "false" : "true");
  }

  function showToast(text){
    var helper = window.CVPlaceholderFlow;
    if (helper && helper.showToast){
      helper.showToast({
        boxId: "toast",
        titleId: "toastTitle",
        textId: "toastMsg",
        title: "Info",
        text: text
      });
    }
  }

  function init(){
    var form = $("subscribeForm");
    var email = $("email");
    var pw = $("password");
    var pw2 = $("password2");
    var agree = $("agree");
    var btn = $("subscribeBtn");
    var toggle = $("pwToggle");

    if (!form || !email || !pw || !pw2 || !agree || !btn) return;

    function validate(){
      var ok = isEmail(email.value) && pwStrong(pw.value) && (pw2.value === pw.value) && !!agree.checked;
      setEnabled(btn, ok);
    }

    if (toggle){
      toggle.addEventListener("click", function(){
        var showing = pw.type === "text";
        pw.type = showing ? "password" : "text";
        pw2.type = showing ? "password" : "text";
        toggle.textContent = showing ? "Show" : "Hide";
        toggle.setAttribute("aria-pressed", showing ? "false" : "true");
      });
    }

    ["input","change","blur"].forEach(function(ev){
      email.addEventListener(ev, validate, { passive: true });
      pw.addEventListener(ev, validate, { passive: true });
      pw2.addEventListener(ev, validate, { passive: true });
      agree.addEventListener(ev, validate, { passive: true });
    });

    validate();

    form.addEventListener("submit", function(e){
      e.preventDefault();
      validate();
      if (btn.disabled){
        showToast("Please complete the form to continue.");
        return;
      }
      var helper = window.CVPlaceholderFlow;
      showToast((helper && helper.messages && helper.messages.join) || "");
    });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
