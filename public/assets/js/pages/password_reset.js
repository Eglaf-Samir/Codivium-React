(function(){
  "use strict";

  (function () {
    const card = document.getElementById("resetCard");
    if (!card) return;

    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", mx + "%");
      card.style.setProperty("--my", my + "%");
    });
  })();

  (function () {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";
    const tokenInput = document.getElementById("cvToken");
    if (tokenInput) tokenInput.value = token;
  })();

  function bindToggle(btnId, inputId){
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", () => {
      const on = btn.classList.toggle("is-on");
      input.type = on ? "text" : "password";
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Hide password" : "Show password");
    });
  }
  bindToggle("toggleNew", "cvNewPass");
  bindToggle("toggleConfirm", "cvConfirmPass");

  const capsIndicator = document.getElementById("capsIndicator");
  function capsHandler(e){
    const caps = e.getModifierState && e.getModifierState("CapsLock");
    if (!capsIndicator) return;
    capsIndicator.classList.toggle("is-on", !!caps);
  }
  ["cvNewPass","cvConfirmPass"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("keydown", capsHandler);
    el.addEventListener("keyup", capsHandler);
    el.addEventListener("focus", capsHandler);
  });

  const newPass = document.getElementById("cvNewPass");
  const confirmPass = document.getElementById("cvConfirmPass");
  const resetBtn = document.getElementById("resetBtn");
  const msg = document.getElementById("formMsg");

  function setMsg(text, type){
    if (!msg) return;
    msg.textContent = text || "";
    msg.classList.remove("error","ok","info");
    if (type) msg.classList.add(type);
  }

  function validate(){
    const a = (newPass?.value || "");
    const b = (confirmPass?.value || "");
    const minOk = a.length >= 10 && b.length >= 10;
    const match = a.length > 0 && a === b;

    if (!a && !b){
      setMsg("", null);
    } else if (!minOk){
      setMsg("Password must be at least 10 characters.", "error");
    } else if (!match){
      setMsg("Passwords do not match.", "error");
    } else {
      setMsg("Ready to submit when a live reset endpoint is connected.", "ok");
    }

    if (resetBtn) resetBtn.disabled = !(minOk && match);
  }

  [newPass, confirmPass].forEach(el => el && el.addEventListener("input", validate));
  validate();

  document.getElementById("resetForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    validate();
    if (resetBtn && resetBtn.disabled) return;
    const helper = window.CVPlaceholderFlow;
    setMsg((helper && helper.messages && helper.messages.reset) || "", "error");
  });
})();
