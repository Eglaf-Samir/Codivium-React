// Codivium Section 4 Coverflow — scroll driver + step tracker
// Fixes: JS-01 undeclared variable, JS-02 initial index aligned to 0

(() => {
  const spacer = document.getElementById("cfxS4Spacer");
  const stage = document.getElementById("cfxS4Stage");
  if (!spacer || !stage) return;

  const cards = Array.from(stage.querySelectorAll(".cfx-s4-card"));
  const panelCount = cards.length;
  if (!panelCount) return;

  const scrollRoot = document.scrollingElement || document.documentElement;
  const SNAP_THRESHOLD = 0.10;
  let currentIndex = 0; // start at intro card

  function clamp(n, a, b){
    return Math.max(a, Math.min(b, n));
  }

  function getScrollTop(){
    return scrollRoot ? scrollRoot.scrollTop : (window.scrollY || window.pageYOffset || 0);
  }

  function getSectionStart(){
    return getScrollTop() + spacer.getBoundingClientRect().top;
  }

  function recalc(){
    const stepScroll = Math.max(72, Math.round(window.innerHeight * 0.22));
    const requiredHeight = Math.max(
      Math.round(window.innerHeight * 1.12),
      Math.round(window.innerHeight + ((panelCount - 1) * stepScroll))
    );
    spacer.style.height = `${requiredHeight}px`;
  }

  function progressToIndex(progress){
    if (panelCount <= 1) return 0;
    const raw = clamp(progress, 0, 1) * (panelCount - 1);
    const base = Math.floor(raw);
    const frac = raw - base;
    return clamp(base + (frac >= SNAP_THRESHOLD ? 1 : 0), 0, panelCount - 1);
  }

  function updateVisual(index){
    currentIndex = clamp(index, 0, panelCount - 1);
    cards.forEach((card, idx) => {
      card.classList.remove("is-active", "is-prev", "is-next", "is-far-left", "is-far-right");
      if (idx === currentIndex){
        card.classList.add("is-active");
      } else if (idx === currentIndex - 1){
        card.classList.add("is-prev");
      } else if (idx === currentIndex + 1){
        card.classList.add("is-next");
      } else if (idx < currentIndex){
        card.classList.add("is-far-left");
      } else {
        card.classList.add("is-far-right");
      }
    });
  }

  function updateFromScroll(){
    recalc();
    const total = Math.max(1, spacer.offsetHeight - window.innerHeight);
    const scrolled = clamp(getScrollTop() - getSectionStart(), 0, total);
    const progress = total > 0 ? (scrolled / total) : 0;
    updateVisual(progressToIndex(progress));
  }

  let ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateFromScroll();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    recalc();
    updateFromScroll();
  });

  recalc();
  updateVisual(currentIndex);
  updateFromScroll();
})();

/* ===== Section 4 premium enhancements v54 ===== */
(function(){
  const stage = document.querySelector('.cfx-s4-stage');
  if (!stage) return;

  function updateStepFromActive(){
    const cards = Array.from(document.querySelectorAll('.cfx-s4-card'));
    const idx = cards.findIndex(card => card.classList.contains('is-active'));
    if (idx >= 0) stage.setAttribute('data-step', String(idx));
  }

  updateStepFromActive();

  const observer = new MutationObserver(() => updateStepFromActive());
  const cards = document.querySelectorAll('.cfx-s4-card');
  cards.forEach(card => {
    observer.observe(card, { attributes: true, attributeFilter: ['class'] });
  });
})();
