(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }

  function show(el){
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("hidden");
  }

  function hide(el){
    if (!el) return;
    el.hidden = true;
    el.setAttribute("hidden", "hidden");
  }

  function setText(el, txt){
    if (!el) return;
    el.textContent = txt;
  }

  function isEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }

  function init(){
    var form = $("contactForm");
    if (!form) return;

    var name = $("name");
    var email = $("email");
    var topic = $("topic");
    var message = $("message");
    var consent = $("consent");

    var count = $("count");
    var error = $("error");
    var success = $("success");
    var successText = $("successText");

    var clearBtn = $("clearBtn");
    var MAX_LEN = 4000;

    function updateCount(){
      if (!message || !count) return;
      var n = String(message.value || "").length;
      count.textContent = String(n) + " / " + String(MAX_LEN);
    }

    function showError(msg){
      var helper = window.CVPlaceholderFlow;
      if (helper && helper.showErrorPanel){
        helper.showErrorPanel({ errorId: "error", successId: "success", successTextId: "successText", text: msg });
        return;
      }
      hide(success);
      setText(successText, "");
      setText(error, msg);
      show(error);
    }

    function showSuccess(msg){
      var helper = window.CVPlaceholderFlow;
      if (helper && helper.showSuccessPanel){
        helper.showSuccessPanel({ errorId: "error", successId: "success", successTextId: "successText", text: msg });
        return;
      }
      hide(error);
      setText(error, "");
      setText(successText, msg);
      show(success);
    }

    if (message){
      message.addEventListener("input", updateCount, { passive: true });
      updateCount();
    }

    if (clearBtn){
      clearBtn.addEventListener("click", function(){
        form.reset();
        hide(error);
        hide(success);
        setText(error, "");
        setText(successText, "");
        updateCount();
        if (name) name.focus();
      });
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();

      hide(error);
      hide(success);
      setText(error, "");
      setText(successText, "");

      var vName = String((name && name.value) || "").trim();
      var vEmail = String((email && email.value) || "").trim();
      var vTopic = String((topic && topic.value) || "").trim();
      var vMsg = String((message && message.value) || "");

      if (!vName){
        showError("Please enter your name.");
        if (name) name.focus();
        return;
      }

      if (!isEmail(vEmail)){
        showError("Please enter a valid email address.");
        if (email) email.focus();
        return;
      }

      if (!vTopic){
        showError("Please choose a topic.");
        if (topic) topic.focus();
        return;
      }

      if (!vMsg.trim()){
        showError("Please write a message.");
        if (message) message.focus();
        return;
      }

      if (vMsg.length > MAX_LEN){
        showError("Your message is too long. Please keep it within " + String(MAX_LEN) + " characters.");
        if (message) message.focus();
        return;
      }

      if (!consent || !consent.checked){
        showError("Please confirm that we may contact you back by email.");
        if (consent) consent.focus();
        return;
      }

      var helper = window.CVPlaceholderFlow;
      showSuccess((helper && helper.messages && helper.messages.contact) || "");
    }, { passive: false });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
