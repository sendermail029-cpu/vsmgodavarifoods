/** How many leaf + marigold units to draw (46px each ≈ 3.7k px: covers wide screens even while scrolled by one loop). */
const UNITS = 80;
const STEP = 46;
/** Sway timings repeat every PERIOD units, so the strip can scroll by PERIOD*STEP px and loop seamlessly. */
const PERIOD = 16;

/**
 * Mango-leaf & marigold thoranam, the festive doorway garland of every Godavari home.
 * Each leaf and marigold hangs from the cord and sways gently, slightly out of step with its neighbours,
 * like a garland moving in a breeze, while the whole garland drifts sideways in a continuous loop. (Motion is switched off for users who prefer reduced motion.)
 */
export function Thoranam({ id = "t", className = "h-[52px] w-full" }: { id?: string; className?: string }) {
  const units = [];
  for (let i = 0; i < UNITS; i++) {
    const x = i * STEP;
    const k = i % PERIOD;
    // deterministic variety so neighbours never move in lockstep
    const leafDelay = -((k * 0.73) % 3.2).toFixed(2);
    const leafDur = (3.6 + ((k * 37) % 9) / 10).toFixed(1);
    const flowerDelay = -((k * 0.51 + 1.3) % 2.8).toFixed(2);
    const flowerDur = (2.8 + ((k * 53) % 7) / 10).toFixed(1);
    units.push(
      <g key={i}>
        <g className="thoranam-leaf" style={{ animationDelay: `${leafDelay}s`, animationDuration: `${leafDur}s` }}>
          <path d={`M${x + 12} 4 C${x + 4} 15 ${x + 4} 33 ${x + 12} 49 C${x + 20} 33 ${x + 20} 15 ${x + 12} 4Z`} fill={`url(#${id}-leaf)`} />
          <path d={`M${x + 12} 7 L${x + 12} 45`} stroke="#c7e39a" strokeOpacity=".6" strokeWidth=".8" />
        </g>
        <g className="thoranam-flower" style={{ animationDelay: `${flowerDelay}s`, animationDuration: `${flowerDur}s` }}>
          <path d={`M${x + 34} 3 L${x + 34} 6`} stroke="#3e7d2c" strokeWidth="1" />
          <circle cx={x + 34} cy="11" r="6.5" fill={`url(#${id}-mg)`} />
          <circle cx={x + 34} cy="11" r="6.5" fill="none" stroke="#c45f0c" strokeOpacity=".5" strokeDasharray="1.6 1.6" />
          <circle cx={x + 34} cy="11" r="2" fill="#b84d0a" />
          <circle cx={x + 34} cy="22" r="3.6" fill={`url(#${id}-mg)`} />
        </g>
      </g>,
    );
  }
  return (
    <svg className={`${className} overflow-hidden`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-leaf`} x1="0" x2="1">
          <stop offset="0" stopColor="#5aa043" />
          <stop offset=".5" stopColor="#2f7a32" />
          <stop offset="1" stopColor="#1b5221" />
        </linearGradient>
        <radialGradient id={`${id}-mg`}>
          <stop offset="0" stopColor="#ffd25a" />
          <stop offset=".6" stopColor="#f6a417" />
          <stop offset="1" stopColor="#dd7310" />
        </radialGradient>
      </defs>
      {/* the whole garland drifts sideways continuously, looping every PERIOD units */}
      <g className="thoranam-scroll" style={{ "--loop": `${-PERIOD * STEP}px` } as React.CSSProperties}>{units}</g>
      <rect y="2.5" width="100%" height="2" fill="#e1bd68" />
    </svg>
  );
}
