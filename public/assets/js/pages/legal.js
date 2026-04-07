(function () {
  "use strict";

  // Legal page footer: set the current year.
  var y = document.getElementById("footerYear");
  if (y) {
    y.textContent = String(new Date().getFullYear());
  }
})();
