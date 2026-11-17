/** Gold divider with a lotus-bud diamond, used under section headings. */
export function Ornament({ className = "", light = false }: { className?: string; light?: boolean }) {
  const c = light ? "#ecd393" : "#b88a2e";
  return (
    <div aria-hidden className={`flex items-center gap-3 ${className}`}>
      <span className="h-px w-12 sm:w-20" style={{ background: `linear-gradient(to right, transparent, ${c})` }} />
      <svg width="34" height="14" viewBox="0 0 34 14" fill={c}>
        <circle cx="3" cy="7" r="1.6" />
        <path d="M17 0.5 23 7 17 13.5 11 7Z" />
        <path d="M17 4 19.6 7 17 10 14.4 7Z" fill={light ? "#5e1515" : "#fdf8ee"} />
        <circle cx="31" cy="7" r="1.6" />
      </svg>
      <span className="h-px w-12 sm:w-20" style={{ background: `linear-gradient(to left, transparent, ${c})` }} />
    </div>
  );
}
