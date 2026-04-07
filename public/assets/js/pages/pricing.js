(function () {
  "use strict";

  // Launch offer (front-end display only)
  // - Week: no discount
  // - Monthly/Annual: 60% off launch offer
  var DISCOUNT_FACTOR = 0.4; // pay 40% of base (i.e., 60% off)

  // Base prices (USD) for each billing mode.
  // Adjust these later when you wire the real checkout/pricing source of truth.
  var BASE = {
    week: 15,
    month: 75,
    year: 675,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function fmt(amount) {
    // whole dollars for premium pricing display
    var rounded = Math.round(amount);
    return "$" + String(rounded);
  }

  function setText(el, txt) {
    if (!el) return;
    el.textContent = txt;
  }

  function show(el) {
    if (!el) return;
    el.classList.remove("is-hidden");
  }
  function hide(el) {
    if (!el) return;
    el.classList.add("is-hidden");
  }

  function applyPricing(mode) {
    var base = BASE[mode];
    if (typeof base !== "number") return;

    var priceOriginal = $("#priceOriginal");
    var priceAmount = $("#priceAmount");
    var pricePer = $("#pricePer");
    var priceNote = $("#priceNote");
    var billingTag = $("#billingTag");
    var discountBanner = $("#discountBanner");
    var discountReason = $("#discountReason");
    var selectBtn = $("#selectBtn");

    var discounted;
    var hasDiscount = mode !== "week";

    if (hasDiscount) {
      discounted = base * DISCOUNT_FACTOR;

      // Update amounts (show original + discounted)
      setText(priceOriginal, fmt(base));
      setText(priceAmount, fmt(discounted));

      show(priceOriginal);
      show(discountBanner);
      setText(discountReason, "Launch offer — 60% off.");
    } else {
      // Week: no launch discount
      setText(priceAmount, fmt(base));
      hide(priceOriginal);
      hide(discountBanner);
    }

    // Update cadence text + button label + note/tag
    if (mode === "week") {
      setText(pricePer, "/ week");
      setText(priceNote, "Week-only access. Ends after 7 days.");
      setText(billingTag, "Week only");
      setText(selectBtn, "Select Week");
      var cancelLine = $("#cancelLine");
      setText(cancelLine, "No cancellation needed");
    } else if (mode === "month") {
      setText(pricePer, "/ month");
      setText(priceNote, "Renews automatically at the end of each month.");
      setText(billingTag, "Auto-renew");
      setText(selectBtn, "Select Monthly");
      cancelLine = $("#cancelLine");
      setText(cancelLine, "Cancel anytime");
    } else if (mode === "year") {
      setText(pricePer, "/ year");
      setText(priceNote, "Renews automatically at the end of each year.");
      setText(billingTag, "Best value");
      setText(selectBtn, "Select Annual");
      cancelLine = $("#cancelLine");
      setText(cancelLine, "Cancel anytime");
    }
  }

  function init() {
    var radios = $all("input[type='radio'][name='billing']");
    if (!radios.length) return;

    function currentMode() {
      var checked = radios.find(function (r) {
        return r.checked;
      });
      return checked ? checked.value : "month";
    }

    // Initial
    applyPricing(currentMode());

    // Updates (pricing display)
    radios.forEach(function (r) {
      r.addEventListener(
        "change",
        function () {
          applyPricing(currentMode());
        },
        { passive: true },
      );
    });

    // CTA: proceed to Join (bind once)
    var selectBtn = $("#selectBtn");
    if (selectBtn && !selectBtn.dataset.cvdBound) {
      selectBtn.dataset.cvdBound = "1";
      selectBtn.addEventListener("click", function () {
        var mode = currentMode();
        window.location.href = "/join?plan=" + encodeURIComponent(mode);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
