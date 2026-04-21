(function(){
  function init(){
    var brand = document.querySelector(".brand");
    var cube  = document.querySelector(".cube3d,#brandCube");
    if (!brand || !cube || !cube.animate) return;

    if (cube.dataset.cvdCubeInit === "1") return;
    cube.dataset.cvdCubeInit = "1";

    var REST_X    = -18;
    var REST_Y    =  32;
    var REST_FUNC = "rotateX(" + REST_X + "deg) rotateY(" + REST_Y + "deg)";

    // Read spin duration from CSS token (allows per-page tuning without forking this file)
    function getSpinDuration(){
      var raw = getComputedStyle(document.documentElement)
                  .getPropertyValue("--cv-spin-duration").trim();
      var ms = parseFloat(raw);
      if (isNaN(ms) || ms < 500) ms = 3200;
      // handle "4200ms" vs "4.2s"
      if (raw.indexOf("s") !== -1 && raw.indexOf("ms") === -1) ms *= 1000;
      return ms;
    }

    var spinAnim   = null;
    var returnAnim = null;

    brand.addEventListener("dblclick", function(e){ e.preventDefault(); });

    function cancelReturn(){
      if (returnAnim){ returnAnim.cancel(); returnAnim = null; }
    }

    function freezeAndCancelSpin(){
      if (!spinAnim) return null;
      spinAnim.pause();
      var current = getComputedStyle(cube).transform;
      var frozen  = (current && current !== "none") ? current : REST_FUNC;
      cube.style.transition = "none";
      cube.style.transform  = frozen;
      void cube.offsetWidth;
      spinAnim.cancel();
      spinAnim = null;
      return frozen;
    }

    function startSpin(){
      cancelReturn();
      var rx = REST_X, ry = REST_Y;
      var keyframes = [
        { transform: "rotateX(" + (rx      ) + "deg) rotateY(" + (ry      ) + "deg)" },
        { transform: "rotateX(" + (rx +  90) + "deg) rotateY(" + (ry + 180) + "deg)" },
        { transform: "rotateX(" + (rx + 180) + "deg) rotateY(" + (ry + 360) + "deg)" },
        { transform: "rotateX(" + (rx + 270) + "deg) rotateY(" + (ry + 540) + "deg)" },
        { transform: "rotateX(" + (rx + 360) + "deg) rotateY(" + (ry + 720) + "deg)" }
      ];
      cube.style.transition = "none";
      cube.style.transform  = REST_FUNC;
      void cube.offsetWidth;
      spinAnim = cube.animate(keyframes, {
        duration:   getSpinDuration(),
        iterations: Infinity,
        easing:     "linear",
        composite:  "replace"
      });
    }

    function returnToRest(fromTransform){
      cancelReturn();
      var from = fromTransform || getComputedStyle(cube).transform;
      returnAnim = cube.animate(
        [{ transform: from }, { transform: REST_FUNC }],
        { duration: 950, easing: "cubic-bezier(.18,.88,.22,1)", composite: "replace", fill: "none" }
      );
      returnAnim.onfinish = function(){
        cube.style.transition = "none";
        cube.style.transform  = REST_FUNC;
        returnAnim = null;
      };
    }

    brand.addEventListener("pointerenter", function(){
      cube.style.transition = "none";
      cube.style.removeProperty("animation");
      cube.style.removeProperty("transform");
      void cube.offsetWidth;
      startSpin();
    });

    brand.addEventListener("pointerleave", function(){
      var frozen = freezeAndCancelSpin();
      returnToRest(frozen);
    });
  }

  window.CodiviumInitCube = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
