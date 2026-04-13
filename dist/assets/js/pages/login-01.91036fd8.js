(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }

  function isEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }

  function setEnabled(btn, enabled){
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute("aria-disabled", enabled ? "false" : "true");
  }

  function showMessage(text, type){
    var helper = window.CVPlaceholderFlow;
    var form = $("cvForm") || $("loginForm");
    if (helper && helper.showInlineStatus){
      helper.showInlineStatus({
        id: "loginMsg",
        className: "login-status",
        anchor: form,
        text: text,
        type: type || "info"
      });
      return;
    }
  }

  function init(){
    var form = $("cvForm") || $("loginForm");
    var email = $("cvUser") || $("cvEmail") || $("email");
    var pw = $("cvPass") || $("password");
    var btn = $("loginBtn");
    var toggle = $("passToggle");

    if (!form || !email || !pw || !btn) return;

    function validate(){
      var ok = isEmail(email.value) && String(pw.value || "").length >= 1;
      setEnabled(btn, ok);
    }

    if (toggle){
      toggle.addEventListener("click", function(){
        var showing = pw.type === "text";
        pw.type = showing ? "password" : "text";
        toggle.setAttribute("aria-pressed", showing ? "false" : "true");
        toggle.classList.toggle("is-showing", !showing);
      });
    }

    ["input","change","blur"].forEach(function(ev){
      email.addEventListener(ev, validate, { passive: true });
      pw.addEventListener(ev, validate, { passive: true });
    });

    validate();

    form.addEventListener("submit", function(e){
      e.preventDefault();
      validate();
      if (btn.disabled){
        showMessage("Enter your email and password to continue.", "error");
        return;
      }
      var helper = window.CVPlaceholderFlow;
      showMessage((helper && helper.messages && helper.messages.login) || "", "info");
    });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
