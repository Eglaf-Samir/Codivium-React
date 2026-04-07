(function () {
  "use strict";

  // Shared hover glow tracking for elements using --mx/--my (used by cards/rows)
  function bindGlowTracking(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener(
        "pointermove",
        function (e) {
          var r = el.getBoundingClientRect();
          var x = ((e.clientX - r.left) / r.width) * 100;
          var y = ((e.clientY - r.top) / r.height) * 100;
          el.style.setProperty("--mx", x.toFixed(2) + "%");
          el.style.setProperty("--my", y.toFixed(2) + "%");
        },
        { passive: true },
      );
    });
  }

  // If rows are anchors, we don't need JS navigation. If they are divs, make them clickable.
  function bindRowClicks() {
    document.querySelectorAll(".bm-row[data-href]").forEach(function (row) {
      row.addEventListener("click", function () {
        var href = row.getAttribute("data-href");
        if (href) window.location.href = href;
      });
      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "link");
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var href = row.getAttribute("data-href");
          if (href) window.location.href = href;
        }
      });
    });
  }

  function init() {
    bindGlowTracking(".glow-track");
    bindRowClicks();

    // Normalize any legacy links from older template names

    document.querySelectorAll("a.bm-article").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (
        href.indexOf("/blog-article") !== -1 ||
        href.indexOf("blog_article") !== -1
      ) {
        a.setAttribute("href", "/article");
      }
      if (href.indexOf("#") === 0) {
        a.setAttribute("href", "/article");
      }
    });

    document
      .querySelectorAll("a[href='/blog_list'], a[href='blog_list']")
      .forEach(function (a) {
        a.setAttribute("href", "/articles");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
