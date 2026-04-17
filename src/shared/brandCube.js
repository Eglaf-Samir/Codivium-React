// src/shared/brandCube.js
// Cube spin + return (WAAPI). Converted from brand-cube.js vanilla script.
// Import as a side-effect at the top of any bundle that renders the sidebar.
// Works identically to the original — no React state needed.

const REST_FUNC = 'rotateX(-18deg) rotateY(32deg)';

function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch (_) { return false; }
}
function isLowEffects() {
  try { return document.documentElement.getAttribute('data-cv-effects') === 'low'; }
  catch (_) { return false; }
}
function shouldAnimate() { return !(prefersReducedMotion() || isLowEffects()); }

function setupBrand(brand) {
  const cube = brand.querySelector('.brand-mark.cv-cube .cube3d');
  if (!cube || cube.__cvCubeWaapiBound) return;
  cube.__cvCubeWaapiBound = true;

  let restMatrix = null, spinAnim = null, returnAnim = null;

  function computeRestMatrix() {
    const prev = cube.style.transform, prevTrans = cube.style.transition;
    cube.style.transition = 'none';
    cube.style.transform  = REST_FUNC;
    void cube.offsetWidth;
    restMatrix = getComputedStyle(cube).transform;
    cube.style.transform  = prev;
    cube.style.transition = prevTrans;
  }

  requestAnimationFrame(computeRestMatrix);
  window.addEventListener('resize', () => requestAnimationFrame(computeRestMatrix));

  function cancelReturn() { if (returnAnim) { returnAnim.cancel(); returnAnim = null; } }

  function freezeAndCancelSpin() {
    if (!spinAnim) return null;
    spinAnim.pause();
    const current = getComputedStyle(cube).transform;
    const frozen  = (current && current !== 'none') ? current : (restMatrix || current);
    cube.style.transition = 'none';
    cube.style.transform  = frozen;
    void cube.offsetWidth;
    spinAnim.cancel(); spinAnim = null;
    return frozen;
  }

  function startSpin() {
    if (!shouldAnimate()) { cancelReturn(); freezeAndCancelSpin(); cube.style.transition='none'; cube.style.transform=REST_FUNC; return; }
    if (!restMatrix || restMatrix === 'none') computeRestMatrix();
    cancelReturn();
    const start = getComputedStyle(cube).transform;
    const from  = (start && start !== 'none') ? start : restMatrix;
    const base  = new DOMMatrixReadOnly(from);
    const kf = [
      { transform: base.rotate(0,   0,   0).toString() },
      { transform: base.rotate(90,  180, 0).toString() },
      { transform: base.rotate(180, 360, 0).toString() },
      { transform: base.rotate(270, 540, 0).toString() },
      { transform: base.rotate(360, 720, 0).toString() },
    ];
    cube.style.transition = 'none'; cube.style.transform = from; void cube.offsetWidth;
    spinAnim = cube.animate(kf, { duration:3000, iterations:Infinity, easing:'linear', fill:'forwards' });
  }

  function startReturn() {
    if (!shouldAnimate()) { cancelReturn(); freezeAndCancelSpin(); cube.style.transition='none'; cube.style.transform=restMatrix||REST_FUNC; return; }
    const frozen = freezeAndCancelSpin() || getComputedStyle(cube).transform || restMatrix;
    const from   = (frozen && frozen !== 'none') ? frozen : restMatrix;
    cancelReturn();
    returnAnim = cube.animate([{ transform:from }, { transform:restMatrix }],
      { duration:2000, easing:'ease', fill:'forwards' });
    returnAnim.onfinish = () => { cube.style.transition='none'; cube.style.transform=restMatrix; returnAnim=null; };
  }

  let _clickTs = 0;
  brand.addEventListener('pointerdown', () => { _clickTs = Date.now(); });
  brand.addEventListener('mouseenter',  () => { if (Date.now() - _clickTs >= 400) startSpin(); });
  brand.addEventListener('mouseleave',  startReturn);
  cube.addEventListener('dblclick', (e) => {
    e.preventDefault(); e.stopPropagation();
    cancelReturn(); freezeAndCancelSpin();
    if (!restMatrix || restMatrix === 'none') computeRestMatrix();
    cube.style.transition='none'; cube.style.transform=restMatrix||REST_FUNC;
  });
}

function bindBrandCube() {
  document.querySelectorAll('.brand').forEach(setupBrand);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindBrandCube);
else bindBrandCube();
