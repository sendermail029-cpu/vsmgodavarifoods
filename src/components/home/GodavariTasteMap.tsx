"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Ornament } from "../brand/Ornament";

/** Stylised (not to scale) map of the Godavari delta, pinning each town to its famous food. */
const STOPS = [
  {
    id: "velpuru", x: 225, y: 335, town: "Velpuru", telugu: "వెల్పూరు", tag: "VSM home kitchen", art: "chicken",
    text: "Our village near Tanuku, West Godavari. Every taste on this map is made fresh by hand right here, then packed and sent to your door.",
    href: "/shop", cta: "Shop everything",
  },
  {
    id: "bhimavaram", x: 385, y: 485, town: "Bhimavaram", telugu: "భీమవరం", tag: "Royyala pachadi", art: "prawn",
    text: "The prawn heartland of the delta. Fresh catch becomes our fiery, garlicky royyala pickle.",
    href: "/product/prawn-pickle", cta: "Shop prawn pickle",
  },
  {
    id: "atreyapuram", x: 500, y: 352, town: "Atreyapuram", telugu: "ఆత్రేయపురం", tag: "Putharekulu", art: "putharekulu",
    text: "The village famous for paper-thin rice sheets rolled with ghee, jaggery and dry fruits.",
    href: "/product/putharekulu", cta: "Shop putharekulu",
  },
  {
    id: "konaseema", x: 620, y: 468, town: "Konaseema", telugu: "కోనసీమ", tag: "Sankranti ariselu", art: "ariselu",
    text: "Coconut groves between the river's arms, and festival kitchens frying jaggery ariselu in ghee.",
    href: "/product/ariselu", cta: "Shop ariselu",
  },
  {
    id: "kakinada", x: 760, y: 218, town: "Kakinada", telugu: "కాకినాడ", tag: "Kaja", art: "kaja",
    text: "The coastal town that made the layered, syrup-soaked kaja a Godavari legend.",
    href: "/product/kakinada-kaja", cta: "Shop Kakinada kaja",
  },
] as const;
type Stop = (typeof STOPS)[number];
const HUB = STOPS[0];

/** Everything made at the Velpuru kitchen (real product photos), shown circling the hub pin. */
const HUB_ITEMS = ["chicken", "mutton", "prawn", "gongura", "lemon", "sunnundalu", "kaja", "putharekulu"];

/** A gentle curve from a town to the Velpuru kitchen (SVG map coordinates). */
function routeTo(s: Stop) {
  const mx = (s.x + HUB.x) / 2, my = (s.y + HUB.y) / 2;
  const bend = s.y < HUB.y ? -60 : 50;
  return `M${s.x} ${s.y} Q${mx} ${my + bend} ${HUB.x} ${HUB.y}`;
}

/** The visible part of the map (wider than tall, so the section stays short). */
const VB = { x: -110, y: 20, w: 1320, h: 560 };
const pos = (x: number, y: number) => ({ left: `${((x - VB.x) / VB.w) * 100}%`, top: `${((y - VB.y) / VB.h) * 100}%` });

const MAIN = "M-110 38 C-40 40 0 46 28 52 C110 80 150 150 240 172 S360 232 420 280";
const GAUTAMI = "M420 280 C520 300 600 380 660 432 S735 520 768 566";
const VASISHTA = "M420 280 C442 362 470 432 470 492 S488 566 498 600";

function StoryCard({ stop, className, compact = false }: { stop: Stop; className: string; compact?: boolean }) {
  return (
    <motion.div key={stop.id} initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28 }} className={className}>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async" src={`/products/${stop.art}.webp?v=3`} alt={stop.tag} className={`arch aspect-[4/5] shrink-0 object-cover shadow-lg ring-2 ring-gold-light ${compact ? "w-20 xl:w-24" : "w-24 sm:w-28"}`} />
        <div className="min-w-0 self-end">
          <p className="telugu text-lg leading-tight text-gold-light">{stop.telugu}</p>
          <h3 className={`font-display font-bold leading-tight text-cream ${compact ? "text-lg xl:text-xl 2xl:text-2xl" : "text-2xl"} break-normal [overflow-wrap:normal]`}>{stop.town}</h3>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.2em] text-gold-light/90">{stop.id === HUB.id ? "Everything made here" : `Famous for · ${stop.tag}`}</p>
        </div>
      </div>
      <p className={`mt-3 leading-relaxed text-cream/80 ${compact ? "text-[13px]" : "text-sm"}`}>{stop.text}</p>
      {stop.id === HUB.id ? (
        <div className="mt-3 flex -space-x-2">
          {HUB_ITEMS.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" key={a} src={`/products/${a}.webp?v=3`} alt="" className="h-8 w-8 rounded-full bg-white object-cover ring-2 ring-maroon-800" />
          ))}
        </div>
      ) : (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-gold-light">
          <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-gold-light text-[10px] text-maroon-900">✓</span>
          Made fresh at our Velpuru kitchen
        </p>
      )}
      <Link href={stop.href} className={`btn-gold px-5 ${compact ? "mt-3 py-1.5" : "mt-4 py-2"}`}>{stop.cta}</Link>
    </motion.div>
  );
}

export function GodavariTasteMap() {
  const [active, setActive] = useState<Stop["id"]>("velpuru");
  const stop = STOPS.find((s) => s.id === active)!;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#1f5a37_0%,#0a2615_85%)] py-14 text-cream sm:py-16" aria-labelledby="taste-map">
      <div aria-hidden className="temple-border absolute inset-x-0 top-0" />
      <div aria-hidden className="telugu pointer-events-none absolute -left-8 bottom-0 select-none text-[14rem] leading-none text-gold-light/[0.05]">గోదావరి</div>
      <div className="container-x relative">
        <div className="mx-auto max-w-2xl text-center" data-aos="fade-down">
          <p className="telugu inline-block rounded-full bg-gradient-to-b from-maroon-600 to-maroon-800 px-5 py-1.5 text-lg text-gold-light shadow-[0_8px_18px_-8px_rgba(0,0,0,.6)] ring-2 ring-gold-light/70">గోదావరి రుచుల యాత్ర</p>
          <h2 id="taste-map" className="mt-4 font-display text-4xl font-black sm:text-5xl">A journey down the <span className="italic text-gold-light">Godavari</span></h2>
          <Ornament light className="mt-4 justify-center" />
          <p className="mt-4 text-cream/75">Every town along the river has a taste it is famous for, and every one of them is made fresh in our Velpuru home kitchen. Tap a town to taste its story.</p>
        </div>

        {/* full-bleed map: spans the whole page width (section clips any scrollbar overflow) */}
        <div className="relative left-1/2 mt-8 w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-[2rem] sm:w-[calc(100vw-3rem)] bg-[#f7ecd4] p-2 shadow-2xl shadow-black/40 ring-2 ring-gold-light outline outline-1 outline-offset-[6px] outline-gold-light/40">
          <div className="relative overflow-hidden rounded-[1.6rem]">
            <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="block h-auto w-full" role="img" aria-label="Stylised map of the Godavari river delta with Velpuru, Bhimavaram, Atreyapuram, Konaseema and Kakinada">
              <defs>
                <linearGradient id="gm-sea" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#a9cfc6" />
                  <stop offset="1" stopColor="#6fa8a0" />
                </linearGradient>
                <pattern id="gm-paddy" width="18" height="18" patternUnits="userSpaceOnUse">
                  <path d="M4 12 q2 -6 0 -9 M9 12 q1 -7 3 -10" stroke="#9db36b" strokeWidth="1.2" fill="none" opacity=".55" />
                </pattern>
              </defs>
              <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="#f7ecd4" />
              {/* paddy fields of the delta */}
              <path d="M420 280 C520 300 600 380 660 432 S735 520 768 566 L700 600 H498 C488 566 470 520 470 492 C470 432 442 362 420 280Z" fill="url(#gm-paddy)" />
              <path d="M120 300 Q250 260 380 300 Q430 420 420 560 L160 600 Q90 470 120 300Z" fill="url(#gm-paddy)" opacity=".8" />
              {/* Bay of Bengal */}
              <path d="M1000 0 C905 150 852 250 820 330 C788 430 740 520 640 560 C560 586 480 592 380 600 L1210 600 L1210 0Z" fill="url(#gm-sea)" />
              <g stroke="#fff" strokeOpacity=".5" fill="none" strokeWidth="1.5">
                <path d="M880 420 q12 -6 24 0 t24 0" /><path d="M820 520 q12 -6 24 0 t24 0" /><path d="M930 300 q12 -6 24 0 t24 0" />
              </g>
              <text x="980" y="555" textAnchor="middle" className="font-display" fontStyle="italic" fontSize="22" fill="#1f5f5b" opacity=".75">Bay of Bengal</text>
              {/* Papikondalu hills */}
              <g fill="#c9a467" opacity=".85">
                <path d="M-100 118 L-60 74 L-30 100 L10 112 L58 46 L92 92 L132 34 L180 98 L214 70 L250 118Z" />
              </g>
              <text x="128" y="140" textAnchor="middle" fontSize="15" fill="#7a5a1e" fontStyle="italic">Papikondalu</text>
              {/* the river and its two arms */}
              {[MAIN, GAUTAMI, VASISHTA].map((d, i) => (
                <g key={d}>
                  <path d={d} stroke="#3f7f7a" strokeWidth={i === 0 ? 16 : 11} fill="none" strokeLinecap="round" />
                  <path d={d} stroke="#bfe3db" strokeWidth="2.5" fill="none" strokeLinecap="round" className="godavari-current" />
                </g>
              ))}
              <text x="640" y="380" fontSize="14" fill="#1f5f5b" fontStyle="italic" transform="rotate(38 640 380)">Gautami</text>
              <text x="430" y="440" fontSize="14" fill="#1f5f5b" fontStyle="italic" transform="rotate(78 430 440)">Vasishta</text>
              {/* Rajamahendravaram + bridge */}
              <g transform="translate(372 236)" stroke="#14432a" strokeWidth="2" fill="none">
                {[0, 14, 28, 42].map((x) => <path key={x} d={`M${x} 10 Q${x + 7} 0 ${x + 14} 10`} />)}
                <path d="M0 10 H56" strokeWidth="2.5" />
              </g>
              <text x="400" y="222" textAnchor="middle" fontSize="15" fontWeight="700" fill="#14432a">Rajamahendravaram</text>
              {/* coconut palms of Konaseema */}
              {[[540, 420], [620, 520], [560, 556], [660, 470]].map(([x, y]) => (
                <g key={`${x}${y}`} transform={`translate(${x} ${y})`} stroke="#4f6b2f" strokeWidth="2" fill="none" strokeLinecap="round">
                  <path d="M0 0 C1 -8 2 -14 4 -20" />
                  <path d="M4 -20 q-9 -3 -14 2 M4 -20 q-7 -7 -12 -5 M4 -20 q6 -7 12 -6 M4 -20 q9 -2 13 4" />
                </g>
              ))}
              {/* every town's taste flows into the Velpuru kitchen */}
              {STOPS.filter((s) => s.id !== HUB.id).map((s) => {
                const on = s.id === active;
                return (
                  <g key={`route-${s.id}`} fill="none" strokeLinecap="round">
                    <path d={routeTo(s)} stroke="#fff" strokeOpacity={on ? 0.9 : 0.6} strokeWidth={on ? 7 : 5} />
                    <path d={routeTo(s)} stroke={on ? "#b8862b" : "#d4a843"} strokeOpacity={on ? 1 : 0.75} strokeWidth={on ? 3.2 : 2.2} className="supply-route" />
                  </g>
                );
              })}
              {/* boat on the main river */}
              <g transform="translate(300 196)">
                <path d="M-12 0 H12 L8 4 H-8Z" fill="#14432a" />
                <path d="M0 0 V-16 L9 -2Z" fill="#d4a843" />
              </g>
            </svg>

            {/* town pins: food photo + "Town · famous food" (HTML buttons for keyboard + screen readers) */}
            {/* Velpuru home kitchen hub: our real products circling the pin */}
            <div aria-hidden className="pointer-events-none absolute z-0 hidden -translate-x-1/2 -translate-y-1/2 sm:block" style={pos(HUB.x, HUB.y)}>
              <div className="hub-orbit relative h-36 w-36 rounded-full border border-dashed border-gold/60 lg:h-44 lg:w-44">
                {HUB_ITEMS.map((a, i) => {
                  const ang = (i / HUB_ITEMS.length) * Math.PI * 2;
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" key={a} src={`/products/${a}.webp?v=3`} alt="" className="hub-orbit-item absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white object-cover shadow-md ring-2 ring-white lg:h-10 lg:w-10"
                      style={{ left: `${50 + 50 * Math.cos(ang)}%`, top: `${50 + 50 * Math.sin(ang)}%` }} />
                  );
                })}
              </div>
            </div>

            {STOPS.map((s) => {
              const on = s.id === active;
              const hub = s.id === HUB.id;
              return (
                <button key={s.id} type="button" onClick={() => setActive(s.id)} onMouseEnter={() => setActive(s.id)} aria-pressed={on}
                  aria-label={hub ? `${s.town}, our home kitchen where every product is made` : `${s.town}, famous for ${s.tag}`}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 ${on ? "z-20" : "z-10"}`} style={pos(s.x, s.y)}>
                  {hub ? (
                    /* home kitchen: a gold medallion with a house, bigger than the other pins */
                    <span className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-[#fbe9b4] via-[#e2b457] to-[#9c6f22] shadow-[0_8px_18px_-4px_rgba(61,13,13,.6)] ring-[3px] ring-white sm:h-[4.5rem] sm:w-[4.5rem] lg:h-20 lg:w-20">
                      {on && <span className="pin-pulse absolute inset-0 rounded-full bg-gold-light" />}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" src="/brand/vsm-logo.webp?v=2" alt="VSM Godavari Foods" className="relative h-[92%] w-[92%] rounded-full object-contain" />
                    </span>
                  ) : (
                    <span className="relative block h-9 w-9 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
                      {on && <span className="pin-pulse absolute inset-0 rounded-full bg-gold-light" />}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" src={`/products/${s.art}.webp?v=3`} alt="" className={`relative h-full w-full rounded-full bg-white object-cover shadow-lg ring-[3px] transition duration-300 ${on ? "scale-110 ring-gold-light" : "ring-white group-hover:scale-105 group-hover:ring-gold-light"}`} />
                    </span>
                  )}
                  <span className={`${on ? "block" : "hidden sm:block"} absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold leading-tight shadow sm:px-3 sm:py-1 sm:text-xs ${hub ? "mt-3 bg-maroon-800 text-gold-light sm:mt-10 lg:mt-12" : `mt-1.5 ${on ? "bg-maroon-800 text-gold-light" : "bg-white/95 text-maroon-800"}`}`}>
                    {s.town}<span className="hidden font-semibold opacity-80 sm:inline"> · {s.tag}</span>
                  </span>
                </button>
              );
            })}

            {/* story card sits over the open sea on the right, clear of every pin (desktop) */}
            <div aria-live="polite" className="pointer-events-none absolute right-[1.5%] top-[5%] z-30 hidden w-[22%] min-w-[15rem] lg:block">
              <AnimatePresence mode="wait">
                <StoryCard key={stop.id} stop={stop} compact
                  className="pointer-events-auto rounded-2xl bg-gradient-to-b from-maroon-700/95 to-maroon-900/95 p-4 text-left shadow-2xl shadow-black/50 ring-2 ring-gold-light/70 backdrop-blur" />
              </AnimatePresence>
            </div>
          </div>
          <p className="px-3 pb-1 pt-2 text-right text-[10px] italic text-ink/45">Illustrated map, not to scale · Tap a town to read its story</p>
        </div>

        {/* phones, tablets & small laptops: the same story card below the map */}
        <div aria-live="polite" className="mx-auto mt-6 max-w-xl lg:hidden">
          <AnimatePresence mode="wait">
            <StoryCard key={stop.id} stop={stop} className="rounded-2xl bg-gradient-to-b from-maroon-700 to-maroon-900 p-4 text-left ring-2 ring-gold-light/60" />
          </AnimatePresence>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {STOPS.map((s) => (
              <button key={s.id} type="button" onClick={() => setActive(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${s.id === active ? "bg-maroon-700 text-gold-light ring-gold-light" : "text-cream/80 ring-gold-light/40"}`}>
                {s.town}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="temple-border absolute inset-x-0 bottom-0" />
    </section>
  );
}
