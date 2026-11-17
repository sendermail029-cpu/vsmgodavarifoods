/**
 * Fly a copy of a product image from where the shopper clicked "Add" to the cart icon in the header,
 * along a curved arc, shrinking as it goes. When it lands, the cart icon gives a little bounce.
 * Resolves when the animation finishes (immediately if motion is reduced or the cart icon is missing).
 */
export function flyToCart(source: HTMLElement | null, src: string): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-cart-icon]");
  if (!source || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bump(target);
    return Promise.resolve();
  }
  const a = source.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, a.height, 220);
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  Object.assign(img.style, {
    position: "fixed", zIndex: "9999", pointerEvents: "none", left: "0px", top: "0px",
    width: `${size}px`, height: `${size}px`, objectFit: "cover", borderRadius: "50%",
    boxShadow: "0 18px 40px -10px rgba(61,13,13,.55), 0 0 0 3px #e9cf8a", willChange: "transform, opacity",
  } as CSSStyleDeclaration);
  document.body.appendChild(img);

  const sx = a.left + a.width / 2 - size / 2, sy = a.top + a.height / 2 - size / 2;
  const ex = b.left + b.width / 2 - size / 2, ey = b.top + b.height / 2 - size / 2;
  const end = Math.max(0.12, 28 / size); // shrink to roughly the icon size
  // how high the arc rises — never above the top of the screen
  const lift = Math.max(0, Math.min(220, Math.abs(sy - ey) * 0.35 + 120, (sy + ey) / 2 - 4));
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = sx + (ex - sx) * t;
    const y = sy + (ey - sy) * t - Math.sin(Math.PI * t) * lift;
    const s = 1 + (end - 1) * t;
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${-25 * t}deg)`, opacity: t > 0.85 ? 1 - (t - 0.85) / 0.15 * 0.6 : 1 });
  }
  const anim = img.animate(frames, { duration: 850, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" });
  return new Promise((resolve) => {
    anim.onfinish = () => { img.remove(); bump(target); resolve(); };
    anim.oncancel = () => { img.remove(); resolve(); };
  });
}

function bump(el: HTMLElement | null) {
  el?.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.35) rotate(-8deg)" }, { transform: "scale(0.92) rotate(4deg)" }, { transform: "scale(1)" }],
    { duration: 520, easing: "ease-out" },
  );
}
