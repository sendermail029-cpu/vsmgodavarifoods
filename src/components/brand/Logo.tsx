import { VSM_PATH, SUB_PATH, SUB_WIDTH, LOCKUP_WIDTH } from "./logo-data";

const LOGO_SRC = "/brand/vsm-logo.webp?v=2"; // bump v when the logo image changes

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_SRC} alt="" aria-hidden className={`${className} aspect-square object-contain`} />;
}

export function Logo({ className = "h-11 w-auto", light = false }: { className?: string; light?: boolean }) {
  const wx = 136;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="img" aria-label="VSM Godavari Foods">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_SRC} alt="" aria-hidden className="h-full w-auto aspect-square object-contain drop-shadow-sm" />
      <svg viewBox={`${wx - 4} 14 ${LOCKUP_WIDTH - wx + 4} 96`} className="h-full w-auto" aria-hidden>
        <path transform={`translate(${wx} 66)`} d={VSM_PATH} fill={light ? "#FBF1DE" : "#7A1C1C"} />
        <path transform={`translate(${wx + 2} 92)`} d={SUB_PATH} fill={light ? "#E2A425" : "#2A1210"} />
        <rect x={wx + 2} y={100} width={SUB_WIDTH} height={2.4} rx={1.2} fill="#E2A425" />
      </svg>
    </span>
  );
}
