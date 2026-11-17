/** Width of one arch unit (SVG px); enough units are drawn to cover very wide screens, the rest is clipped. */
const UNIT = 120;
const UNITS = 30;

/**
 * Scalloped gold temple-arch border with brass oil lamps (deepams) hanging on chains between the arches.
 * Lamps sway slightly and their flames flicker.
 */
export function TempleLamps({ id = "tl", className = "h-[96px] w-full" }: { id?: string; className?: string }) {
  const units = [];
  for (let i = 0; i < UNITS; i++) {
    const x = i * UNIT;
    const c = x + UNIT / 2; // lamp hangs from the point between two arches, at the unit centre
    const long = i % 2 === 0;
    const chain = long ? 42 : 24;
    units.push(
      <g key={i}>
        {/* arch scallop with a small bud on top */}
        <path d={`M${x} 8 Q${x + UNIT / 4} 30 ${c} 12 Q${x + (3 * UNIT) / 4} 30 ${x + UNIT} 8`} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2.4" />
        <path d={`M${x + UNIT / 4 - 4} 22 l4 -6 4 6 -4 4Z`} fill="#e9cf8a" />
        <path d={`M${x + (3 * UNIT) / 4 - 4} 22 l4 -6 4 6 -4 4Z`} fill="#e9cf8a" />
        {/* hanging lamp */}
        <g className="lamp-sway" style={{ animationDelay: `${-((i * 0.7) % 4)}s` }}>
          <path d={`M${c} 12 V${12 + chain}`} stroke="#c8962f" strokeWidth="1.4" strokeDasharray="2.5 1.5" />
          <g transform={`translate(${c} ${12 + chain})`}>
            {/* flame + glow */}
            <circle cx="0" cy="-2" r="10" fill={`url(#${id}-glow)`} />
            <path className="lamp-flame" style={{ animationDelay: `${-((i * 0.37) % 1.2)}s` }} d="M0 -12 C3 -7 3.5 -3 0 0 C-3.5 -3 -3 -7 0 -12Z" fill={`url(#${id}-flame)`} />
            {/* brass bowl of the lamp */}
            <path d="M-11 1 Q0 -1 11 1 Q9 9 0 10 Q-9 9 -11 1Z" fill={`url(#${id}-brass)`} />
            <path d="M-11 1 Q0 3 11 1" stroke="#fbe9b4" strokeWidth="1" fill="none" opacity=".8" />
            <path d="M0 10 V14 M-4 15 H4" stroke="#9c6f22" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      </g>,
    );
  }
  return (
    <svg className={`${className} overflow-hidden`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" x2="1">
          <stop offset="0" stopColor="#b88a2e" />
          <stop offset=".5" stopColor="#f6d98a" />
          <stop offset="1" stopColor="#b88a2e" />
        </linearGradient>
        <linearGradient id={`${id}-brass`} x1="0" x2="1">
          <stop offset="0" stopColor="#7d5314" />
          <stop offset=".35" stopColor="#f6d98a" />
          <stop offset=".6" stopColor="#c8962f" />
          <stop offset="1" stopColor="#6b4511" />
        </linearGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset=".5" stopColor="#ffc93c" />
          <stop offset="1" stopColor="#f07a12" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffd77a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect y="3" width="100%" height="2" fill={`url(#${id}-gold)`} />
      {units}
    </svg>
  );
}
