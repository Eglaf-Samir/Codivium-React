(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }

  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  function initReaderControls(){
    var reading = $("apReading");
    var scrollEl = $("apScroll");
    var prog = $("apProg");

    if (!reading || !scrollEl) return;

    var baseSize = 18;
    var size = baseSize;

    function setSize(){
      reading.style.setProperty("--fs", size + "px");
    }

    function setProgress(){
      var max = scrollEl.scrollHeight - scrollEl.clientHeight;
      var pct = max > 0 ? (scrollEl.scrollTop / max) * 100 : 0;
      if (prog) prog.style.width = pct.toFixed(2) + "%";
    }

    // Font controls
    var minus = $("fontMinus");
    var plus = $("fontPlus");
    if (minus){
      minus.addEventListener("click", function(){
        size = clamp(size - 1, 14, 24);
        setSize();
      });
    }
    if (plus){
      plus.addEventListener("click", function(){
        size = clamp(size + 1, 14, 24);
        setSize();
      });
    }

    // Theme toggles (day/night within the article frame only)
    var themeToggle = $("themeToggle");
    var softToggle = $("softToggle");
    var widthToggle = $("widthToggle");

    var dayMode = false;
    var softMode = false;
    var wideMode = false;

    function applyModes(){
      if (dayMode){
        reading.style.setProperty("--bg", "rgb(250,252,253)");
        reading.style.setProperty("--fg", "rgb(3,7,10)");
        themeToggle && (themeToggle.textContent = "Night");
      } else {
        reading.style.setProperty("--bg", "rgb(10, 10, 14)");
        reading.style.setProperty("--fg", "rgba(245,245,252,0.88)");
        themeToggle && (themeToggle.textContent = "Day");
      }

      if (softMode){
        // Soft reading mode:
        // - If in Day mode: very light cream background inside the reader frame only
        // - If in Night mode: a softer dark background (less harsh than the default)
        if (dayMode){
          reading.style.setProperty("--bg", "rgb(252, 248, 240)");
          reading.style.setProperty("--fg", "rgb(10, 10, 14)");
          reading.style.borderColor = "rgba(15, 23, 42, 0.10)";
        } else {
          reading.style.setProperty("--bg", "rgb(28, 28, 36)");
          reading.style.setProperty("--fg", "rgba(245,245,252,0.90)");
          reading.style.borderColor = "rgba(255,255,255,0.045)";
        }
        softToggle && (softToggle.textContent = "Soft✓");
      } else {
        // restore border; bg/fg are handled by dayMode above
        reading.style.borderColor = dayMode ? "rgba(15, 23, 42, 0.10)" : "rgba(255,255,255,0.06)";
        softToggle && (softToggle.textContent = "Soft");
      }

      if (wideMode){
        reading.style.setProperty("--measure", "96ch");
        widthToggle && (widthToggle.textContent = "Narrow");
      } else {
        reading.style.setProperty("--measure", "82ch");
        widthToggle && (widthToggle.textContent = "Wide");
      }
    }

    if (themeToggle){
      themeToggle.addEventListener("click", function(){
        dayMode = !dayMode;
        applyModes();
      });
    }
    if (softToggle){
      softToggle.addEventListener("click", function(){
        softMode = !softMode;
        applyModes();
      });
    }
    if (widthToggle){
      widthToggle.addEventListener("click", function(){
        wideMode = !wideMode;
        applyModes();
      });
    }

    // Copy link
    var copyBtn = $("copyLink");
    if (copyBtn && navigator.clipboard){
      copyBtn.addEventListener("click", function(){
        navigator.clipboard.writeText(window.location.href).catch(function(){});
      });
    }

    // Print
    var printBtn = $("printBtn");
    if (printBtn){
      printBtn.addEventListener("click", function(){
        window.print();
      });
    }

    // Top
    var topBtn = $("topBtn");
    if (topBtn){
      topBtn.addEventListener("click", function(){
        scrollEl.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Progress
    scrollEl.addEventListener("scroll", setProgress, { passive: true });
    setSize();
    applyModes();
    setProgress();
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initReaderControls);
  } else {
    initReaderControls();
  }
})();