import { useEffect } from 'react';

const REST_X = -18;
const REST_Y = 32;
const REST_FUNC = `rotateX(${REST_X}deg) rotateY(${REST_Y}deg)`;

function getSpinDuration() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--cv-spin-duration').trim();
  let ms = parseFloat(raw);
  if (isNaN(ms) || ms < 500) ms = 3200;
  if (raw.indexOf('s') !== -1 && raw.indexOf('ms') === -1) ms *= 1000;
  return ms;
}

export default function useCube(brandRef) {
  useEffect(() => {
    const brand = brandRef.current;
    if (!brand) return;
    const cube = brand.querySelector('.cube3d, #brandCube');
    if (!cube || !cube.animate) return;

    let spinAnim = null;
    let returnAnim = null;

    function cancelReturn() {
      if (returnAnim) { returnAnim.cancel(); returnAnim = null; }
    }

    function freezeAndCancelSpin() {
      if (!spinAnim) return null;
      spinAnim.pause();
      const c = getComputedStyle(cube).transform;
      const f = (c && c !== 'none') ? c : REST_FUNC;
      cube.style.transition = 'none';
      cube.style.transform = f;
      void cube.offsetWidth;
      spinAnim.cancel();
      spinAnim = null;
      return f;
    }

    function startSpin() {
      cancelReturn();
      const rx = REST_X, ry = REST_Y;
      const kf = [
        { transform: `rotateX(${rx}deg) rotateY(${ry}deg)` },
        { transform: `rotateX(${rx + 90}deg) rotateY(${ry + 180}deg)` },
        { transform: `rotateX(${rx + 180}deg) rotateY(${ry + 360}deg)` },
        { transform: `rotateX(${rx + 270}deg) rotateY(${ry + 540}deg)` },
        { transform: `rotateX(${rx + 360}deg) rotateY(${ry + 720}deg)` },
      ];
      cube.style.transition = 'none';
      cube.style.transform = REST_FUNC;
      void cube.offsetWidth;
      spinAnim = cube.animate(kf, {
        duration: getSpinDuration(),
        iterations: Infinity,
        easing: 'linear',
        composite: 'replace',
      });
    }

    function returnToRest(from) {
      cancelReturn();
      const f = from || getComputedStyle(cube).transform;
      returnAnim = cube.animate(
        [{ transform: f }, { transform: REST_FUNC }],
        { duration: 950, easing: 'cubic-bezier(.18,.88,.22,1)', composite: 'replace', fill: 'none' }
      );
      returnAnim.onfinish = () => {
        cube.style.transition = 'none';
        cube.style.transform = REST_FUNC;
        returnAnim = null;
      };
    }

    const onEnter = () => {
      cube.style.transition = 'none';
      cube.style.removeProperty('animation');
      cube.style.removeProperty('transform');
      void cube.offsetWidth;
      startSpin();
    };
    const onLeave = () => {
      const f = freezeAndCancelSpin();
      returnToRest(f);
    };

    brand.addEventListener('pointerenter', onEnter);
    brand.addEventListener('pointerleave', onLeave);

    return () => {
      brand.removeEventListener('pointerenter', onEnter);
      brand.removeEventListener('pointerleave', onLeave);
      cancelReturn();
      freezeAndCancelSpin();
    };
  }, [brandRef]);
}
