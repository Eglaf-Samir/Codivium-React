import { useEffect } from "react";

function bindGlowFollow(root = document) {
  root.querySelectorAll(".glow-follow").forEach((card) => {
    if (card.__cvGlowBound) return;
    card.__cvGlowBound = true;

    let raf = null,
      lastE = null;

    card.addEventListener(
      "pointermove",
      (e) => {
        lastE = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          if (!lastE) return;
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", lastE.clientX - r.left + "px");
          card.style.setProperty("--my", lastE.clientY - r.top + "px");
        });
      },
      { passive: true },
    );

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    });
  });
}

export function useGlowFollow() {
  useEffect(() => {
    // Bind immediately (covers elements already in the DOM)
    bindGlowFollow();

    // Re-bind when new .glow-follow elements are added dynamically.
    // Debounced: MutationObserver with subtree:true fires on every DOM change;
    // without debouncing this would call querySelectorAll on every React re-render.
    let rafId = null;
    const mo = new MutationObserver(() => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        bindGlowFollow();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}
