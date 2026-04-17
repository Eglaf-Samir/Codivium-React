(function(){
  "use strict";

  /***************************************************************
   * Cube spin + return (WAAPI, stable across repeated hovers)
   *
   * This file intentionally mirrors the cube implementation used in
   * the uploaded landing page reference (WAAPI + DOMMatrixReadOnly).
   *
   * Key properties:
   * - Uses element.animate() (WAAPI) for the spin loop.
   * - Builds keyframes that end on a full-rotation equivalent of the
   *   starting matrix (prevents loop-wrap snaps).
   * - On mouseleave: pause → read computed matrix → commit inline →
   *   force reflow → cancel → animate matrix→matrix back to rest.
   *
   * Minor addition:
   * - Respects prefers-reduced-motion and low-effects mode by skipping
   *   motion when requested.
   ***************************************************************/

  const REST_FUNC = "rotateX(-18deg) rotateY(32deg)";

  function prefersReducedMotion(){
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }

  function isLowEffects(){
    try { return document.documentElement && document.documentElement.getAttribute('data-cv-effects') === 'low'; }
    catch (e) { return false; }
  }

  function shouldAnimate(){
    return !(prefersReducedMotion() || isLowEffects());
  }

  function setupBrand(brand){
    const cube = brand.querySelector('.brand-mark.cv-cube .cube3d');
    if (!cube) return;
    if (cube.__cvCubeWaapiBound) return;
    cube.__cvCubeWaapiBound = true;

    let restMatrix = null;
    let spinAnim = null;
    let returnAnim = null;

    function computeRestMatrix(){
      const prev = cube.style.transform;
      const prevTrans = cube.style.transition;

      cube.style.transition = "none";
      cube.style.transform = REST_FUNC;
      void cube.offsetWidth;
      restMatrix = getComputedStyle(cube).transform;

      cube.style.transform = prev;
      cube.style.transition = prevTrans;
    }

    requestAnimationFrame(computeRestMatrix);
    window.addEventListener("resize", () => requestAnimationFrame(computeRestMatrix));

    function cancelReturn(){
      if (returnAnim){
        returnAnim.cancel();
        returnAnim = null;
      }
    }

    function freezeAndCancelSpin(){
      if (!spinAnim) return null;

      // Freeze current pose first (pause -> read -> commit -> reflow)
      spinAnim.pause();
      const current = getComputedStyle(cube).transform;
      const frozen = (current && current !== "none") ? current : (restMatrix || current);

      cube.style.transition = "none";
      cube.style.transform = frozen;
      void cube.offsetWidth;

      spinAnim.cancel();
      spinAnim = null;
      return frozen;
    }

    function startSpin(){
      // Motion/accessibility gates (not present in the landing file, but
      // safe and expected inside the dashboard).
      if (!shouldAnimate()){
        cancelReturn();
        freezeAndCancelSpin();
        if (!restMatrix || restMatrix === "none") computeRestMatrix();
        cube.style.transition = "none";
        cube.style.transform = REST_FUNC;
        return;
      }

      if (!restMatrix || restMatrix === "none") computeRestMatrix();
      cancelReturn();

      // Start from current pose (matrix), defaulting to restMatrix
      const start = getComputedStyle(cube).transform;
      const from = (start && start !== "none") ? start : restMatrix;

      // Build progressive tumble keyframes that keep rotating forward.
      // The final keyframe returns to the same orientation via full rotations.
      const base = new DOMMatrixReadOnly(from);
      const k1 = base.rotate(0,   0,   0).toString();
      const k2 = base.rotate(90,  180, 0).toString();
      const k3 = base.rotate(180, 360, 0).toString();
      const k4 = base.rotate(270, 540, 0).toString();
      const k5 = base.rotate(360, 720, 0).toString(); // same orientation as k1

      cube.style.transition = "none";
      cube.style.transform = from;
      void cube.offsetWidth;

      spinAnim = cube.animate(
        [
          { transform: k1 },
          { transform: k2 },
          { transform: k3 },
          { transform: k4 },
          { transform: k5 }
        ],
        { duration: 3000, iterations: Infinity, easing: "linear", fill: "forwards" }
      );
    }

    function startReturn(){
      if (!restMatrix || restMatrix === "none") computeRestMatrix();

      if (!shouldAnimate()){
        cancelReturn();
        freezeAndCancelSpin();
        cube.style.transition = "none";
        cube.style.transform = restMatrix || REST_FUNC;
        return;
      }

      const frozen = freezeAndCancelSpin() || getComputedStyle(cube).transform || restMatrix;
      const from = (frozen && frozen !== "none") ? frozen : restMatrix;

      cancelReturn();

      returnAnim = cube.animate(
        [{ transform: from }, { transform: restMatrix }],
        { duration: 2000, easing: "ease", fill: "forwards" }
      );

      returnAnim.onfinish = () => {
        cube.style.transition = "none";
        cube.style.transform = restMatrix;
        returnAnim = null;
      };
    }

    brand.addEventListener("mouseenter", startSpin);
    brand.addEventListener("mouseleave", startReturn);

    // Double-click permanently stops the spin and resets to rest.
    // Uses pointerdown (fires before mouseenter on re-entry) to set a
    // short-lived flag so the mouseenter that accompanies the click is also blocked.
    let _clickTs = 0;
    brand.addEventListener("pointerdown", function() {
      _clickTs = Date.now();
    });

    cube.addEventListener("dblclick", function(e) {
      e.preventDefault();
      e.stopPropagation();
      cancelReturn();
      freezeAndCancelSpin();
      if (!restMatrix || restMatrix === "none") computeRestMatrix();
      cube.style.transition = "none";
      cube.style.transform = restMatrix || REST_FUNC;
    });

    // Wrap startSpin: if a pointerdown happened within the last 400ms
    // (i.e. cursor arrived via a click, not a hover), skip spinning.
    brand.removeEventListener("mouseenter", startSpin);
    brand.addEventListener("mouseenter", function() {
      if (Date.now() - _clickTs < 400) return;
      startSpin();
    });
  }

  function bind(){
    const brands = document.querySelectorAll('.brand');
    if (!brands || !brands.length) return;
    brands.forEach(setupBrand);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
