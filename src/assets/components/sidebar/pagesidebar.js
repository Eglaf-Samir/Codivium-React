/* Active link + collapse state — runs immediately after sidebar is parsed, before first paint */
(function () {
  try {
    if (localStorage.getItem("cv_sidebar_collapsed") === "1") {
      var sb = document.getElementById("sidebar");
      if (sb) {
        sb.classList.add("collapsed");
        document.body.classList.add("sidebar-collapsed");
      }
    }
  } catch (e) {}
  var p = window.location.pathname.split("/").pop() || "";
  var q = window.location.search || "";
  var sec = "";
  if (p === "adaptive-practice.html") sec = "home";
  else if (p === "codivium_insights_embedded.html") sec = "dashboard";
  else if (p === "mcq-parent.html" || p === "mcq-quiz.html") sec = "mcq";
  else if (p === "account-settings.html") sec = "account-settings";
  else if (p === "menu-page.html") {
    sec =
      new URLSearchParams(q).get("track") === "interview"
        ? "interview"
        : "micro";
  } else if (p === "editor.html") {
    var f = "";
    try {
      f = decodeURIComponent(new URLSearchParams(q).get("from") || "");
    } catch (e) {}
    var t = (
      (f.match(/[?&]track=([^&]+)/) || [])[1] ||
      new URLSearchParams(q).get("track") ||
      ""
    ).toLowerCase();
    sec = t === "interview" ? "interview" : "micro";
  }
  if (!sec) return;
  var links = document.querySelectorAll(".side-link");
  links.forEach(function (a) {
    var match = a.dataset.section === sec;
    a.classList.toggle("active", match);
    if (match) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
})();
