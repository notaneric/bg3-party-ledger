/* ============================================================
   ANIM — GSAP motion. Degrades silently if GSAP/CDN unavailable
   and respects prefers-reduced-motion. Motion earns its place:
   deck deal-in (once), foil shimmer on hover, sheet open, count-ups.
   ============================================================ */

const G = () => window.gsap;
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function dealIn(cards) {
  if (!G() || reduced() || !cards.length) return;
  G().set(cards, { transformOrigin: "50% 80%" });
  G().fromTo(cards,
    { y: 60, rotateZ: (i) => (i - (cards.length - 1) / 2) * 7, scale: 0.92, opacity: 0 },
    { y: 0, rotateZ: 0, scale: 1, opacity: 1, duration: 0.85, ease: "power3.out",
      stagger: 0.12, clearProps: "transform" });
}

export function attachFoil(card) {
  if (!G()) return;
  const foil = card.querySelector(".foil");
  if (!foil) return;
  let tween;
  const sweep = () => {
    if (reduced()) return;
    if (tween) tween.kill();
    G().set(foil, { opacity: 1, backgroundPosition: "120% 0" });
    tween = G().to(foil, { backgroundPosition: "-120% 0", duration: 0.9, ease: "power2.inOut",
      onComplete: () => G().to(foil, { opacity: 0, duration: 0.2 }) });
  };
  const lift = () => !reduced() && G().to(card, { y: -10, scale: 1.025, duration: 0.35, ease: "power3.out" });
  const drop = () => !reduced() && G().to(card, { y: 0, scale: 1, duration: 0.4, ease: "power3.out" });
  card.addEventListener("mouseenter", () => { lift(); sweep(); });
  card.addEventListener("mouseleave", drop);
  card.addEventListener("focus", sweep);
}

export function flipReveal(card) {
  if (!G() || reduced()) return;
  G().fromTo(card, { rotateY: 0 }, { rotateY: 360, duration: 0.7, ease: "power2.inOut" });
}

export function openSheet(scrim, sheet) {
  if (!G() || reduced()) { if (scrim) scrim.style.opacity = 1; return; }
  G().fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" });
  G().fromTo(sheet, { y: 40, scale: 0.97, opacity: 0 },
    { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" });
}

export function countUp(el, to) {
  if (!el) return;
  const target = Number(to) || 0;
  if (!G() || reduced()) { el.textContent = target; return; }
  const o = { v: 0 };
  G().to(o, { v: target, duration: 0.9, ease: "power2.out", snap: { v: 1 },
    onUpdate: () => { el.textContent = Math.round(o.v); } });
}

export function pulse(el) {
  if (!G() || reduced() || !el) return;
  G().fromTo(el, { scale: 1 }, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: "power1.inOut" });
}
