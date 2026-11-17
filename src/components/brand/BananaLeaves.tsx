const LEAF = "/godavari/banana-leaf.webp";

/** Real banana leaf (photo texture), swaying gently from its base. `r` is the resting tilt. */
export function Leaf({ r, x, b, w, delay = "0s", className = "" }: { r: string; x: number; b: number; w: number; delay?: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LEAF}
      alt=""
      aria-hidden
      loading="lazy"
      className={`leaf-sway pointer-events-none absolute h-auto max-w-none drop-shadow-[0_14px_18px_rgba(20,4,4,.55)] ${className}`}
      style={{ "--r": r, left: x, bottom: b, width: w, animationDelay: delay } as React.CSSProperties}
    />
  );
}

/**
 * Three leaves fanning in from a lower corner, laid out at a 440×420 design size.
 * `scale` sets the responsive size (Tailwind scale classes); `flip` mirrors it for the right corner.
 */
export function LeafCluster({ flip = false, delay = 0, scale = "scale-[.4] sm:scale-[.58] lg:scale-[.78]" }: { flip?: boolean; delay?: number; scale?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute bottom-0 ${flip ? "right-0 -scale-x-100" : "left-0"}`}>
      <div className={`relative h-[420px] w-[440px] origin-bottom-left ${scale}`}>
        <Leaf r="10deg" x={-96} b={-30} w={150} delay={`${delay - 2}s`} className="brightness-[.8]" />
        <Leaf r="42deg" x={-40} b={-70} w={160} delay={`${delay - 4}s`} className="brightness-90" />
        <Leaf r="76deg" x={-60} b={-52} w={170} delay={`${delay}s`} />
      </div>
    </div>
  );
}
