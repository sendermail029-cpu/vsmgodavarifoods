"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useStore, waLink } from "../StoreInfo";


const cut = (img: string) => `/products/served/${img}.webp`;
const LEAF = "/godavari/banana-leaf.webp";

/**
 * Food laid out on banana leaves on the right of the hero (cut-out photos, no backgrounds).
 * x/y = centre in % of the spread, w = width in %, z = stacking (back row lower), drift = px it sinks while scrolling.
 */
const SPREAD = [
  // flanking the big bowl, slightly behind it
  { img: "glass-mutton", name: "Mutton", href: "/product/mutton-boneless-pickle", x: 17, y: 40, w: 24, z: 1, drift: 90 },
  { img: "glass-prawn", name: "Royyala", href: "/product/prawn-pickle", x: 83, y: 40, w: 24, z: 1, drift: 90 },
  // front row of smaller bowls
  { img: "glass-mango", name: "Avakaya", href: "/product/avakaya-mango-pickle", x: 11, y: 78, w: 19, z: 4, drift: 170 },
  { img: "glass-26", name: "Gongura", href: "/product/gongura-pickle", x: 30, y: 84, w: 19, z: 5, drift: 190 },
  { img: "glass-putharekulu", name: "Putharekulu", href: "/product/putharekulu", x: 50, y: 87, w: 18, z: 6, drift: 210 },
  { img: "glass-28", name: "Sweets", href: "/shop/sweets-laddus", x: 70, y: 84, w: 17, z: 5, drift: 190 },
  { img: "glass-murukulu", name: "Janthikalu", href: "/product/janthikalu", x: 89, y: 78, w: 18, z: 4, drift: 170 },
] as const;

/** Real curry leaves tucked in among the bowls. r = rotation, z = stacking. */
const SPICES = [
  { img: "spice-curry", x: 20, y: 62, w: 26, r: -18, z: 2 },
  { img: "spice-curry", x: 82, y: 63, w: 24, r: 196, z: 2 },
] as const;

function SpreadItem({ item, i, progress, still }: { item: (typeof SPREAD)[number]; i: number; progress: MotionValue<number>; still: boolean }) {
  const y = useTransform(progress, [0, 1], [0, still ? 0 : item.drift]);
  return (
    <motion.div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, zIndex: item.z, y }}>
      <motion.div initial={{ opacity: 0, scale: 0.6, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}>
        <Link href={item.href} className="group relative block" title={item.name}>
          <span aria-hidden className="absolute inset-x-[10%] bottom-[1%] h-[14%] rounded-[50%] bg-[#0f2a10]/35 blur-md" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cut(item.img)} alt={item.name} className="hero-float relative w-full drop-shadow-[0_12px_12px_rgba(20,30,10,.3)] transition duration-300 group-hover:scale-105" style={{ animationDelay: `${-i * 0.8}s` }} />
          <span className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full bg-maroon-800 px-2.5 py-0.5 text-[10px] font-semibold text-gold-light opacity-0 shadow transition group-hover:opacity-100 sm:text-xs">{item.name}</span>
        </Link>
      </motion.div>
    </motion.div>
  );
}



/** Cycles through words: each one flips up out of a blur in a maroon pill. */
function RotatingWord({ words, still }: { words: string[]; still: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [still, words.length]);
  return (
    <span className="relative inline-grid h-[1.9em] min-w-[11.5em] overflow-hidden align-middle lg:justify-items-start" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={words[i]} className="col-start-1 row-start-1 inline-flex items-center rounded-full bg-gradient-to-b from-maroon-600 to-maroon-800 px-3.5 py-0.5 font-semibold text-gold-light shadow-md ring-1 ring-gold-light/70"
          initial={{ y: "110%", opacity: 0, filter: "blur(6px)", rotateX: -60 }} animate={{ y: "0%", opacity: 1, filter: "blur(0px)", rotateX: 0 }}
          exit={{ y: "-110%", opacity: 0, filter: "blur(6px)", rotateX: 60 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Hero() {
  const store = useStore();
  const ref = useRef<HTMLElement>(null);
  const still = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : 110]);
  const leafY = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : 60]);
  return (
    <section ref={ref} className="relative overflow-hidden bg-[radial-gradient(ellipse_at_70%_40%,#fffaf0_0%,#fbf1dc_45%,#f2e0bb_100%)]" aria-label="VSM Godavari Foods">
      <div aria-hidden className="kolam-bg pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_75%)]" />
      {/* the Godavari and the Rajamahendravaram arch bridge (real photo), full colour on the right, fading into cream behind the text */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/godavari/godavari-arch-bridge.webp" fetchPriority="high" alt="" aria-hidden className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-[50%_72%] lg:inset-y-auto lg:-top-[46%] lg:h-[150%] lg:object-[50%_50%] [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] lg:w-[78%] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_32%),linear-gradient(to_bottom,black_60%,transparent_100%)] lg:[mask-composite:intersect] lg:[-webkit-mask-composite:source-in]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(253,248,238,.85)_0%,rgba(253,248,238,.55)_40%,rgba(253,248,238,.2)_60%,transparent_75%)] lg:bg-[linear-gradient(to_right,#fdf8ee_0%,rgba(253,248,238,.92)_36%,rgba(253,248,238,0)_56%)]" />
      {/* leaves along the top-left and left edge */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden h-80 w-56 overflow-hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LEAF} alt="" className="leaf-hang absolute -left-6 -top-40 w-24 drop-shadow-[0_10px_12px_rgba(0,0,0,.25)] lg:w-28" style={{ "--r": "160deg" } as React.CSSProperties} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LEAF} alt="" className="leaf-hang absolute left-14 -top-44 w-20 brightness-95 drop-shadow-[0_10px_12px_rgba(0,0,0,.25)] lg:w-24 [animation-delay:-3s]" style={{ "--r": "200deg" } as React.CSSProperties} />
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 z-0 hidden w-32 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LEAF} alt="" className="leaf-sway w-full drop-shadow-[0_10px_12px_rgba(0,0,0,.25)]" style={{ "--r": "40deg" } as React.CSSProperties} />
      </div>
      {/* green banana leaves hanging down into the top-right corner */}
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 z-10 hidden h-72 w-64 overflow-hidden md:block lg:h-80 lg:w-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LEAF} alt="" className="leaf-hang absolute -top-40 right-24 w-24 drop-shadow-[0_10px_12px_rgba(0,0,0,.25)] lg:-top-44 lg:w-28" style={{ "--r": "162deg" } as React.CSSProperties} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LEAF} alt="" className="leaf-hang absolute -right-4 -top-36 w-24 brightness-95 drop-shadow-[0_10px_12px_rgba(0,0,0,.25)] lg:-top-40 lg:w-28 [animation-delay:-2.5s]" style={{ "--r": "196deg" } as React.CSSProperties} />
      </div>

      <div className="container-x relative grid items-center gap-6 pb-24 pt-8 sm:pb-28 lg:h-[calc(100dvh-130px)] lg:min-h-[540px] lg:grid-cols-[1fr_1.2fr] lg:gap-8 lg:pb-16 lg:pt-1">
        {/* Copy */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-20 flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="relative z-20 inline-block rounded-full bg-cream/85 px-3 font-display text-2xl italic text-maroon-600 backdrop-blur-sm sm:text-3xl lg:-ml-3" style={{ fontFamily: "var(--font-display)" }}>Taste the Tradition…</p>
          <svg aria-hidden viewBox="0 0 200 10" className="mt-1 h-2 w-40 text-gold"><path d="M2 6 C60 1 140 1 198 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
          {/* Telugu headline: each word gathers out of a soft smoky blur. English kept for search engines & screen readers. */}
          <h1 className="mt-2 w-full">
            <span className="sr-only">Godavari flavours, sealed in every jar — గోదావరి రుచులు మీ ఇంటికి</span>
            <span aria-hidden className="telugu block text-[2.6rem] leading-[1.25] [-webkit-text-stroke:0.022em_currentColor] [paint-order:stroke_fill] sm:text-6xl lg:text-[3.6rem] xl:text-[4.2rem] 2xl:text-[4.6rem]">
              {[["గోదావరి", "రుచులు"], ["మీ", "ఇంటికి"]].map((line, li) => (
                <span key={li} className={`block whitespace-nowrap ${li ? "text-maroon-600" : "text-maroon-800"}`}>
                  {line.map((w, wi) => (
                    <motion.span key={w} className="mr-[0.28em] inline-block"
                      initial={still ? false : { opacity: 0, filter: "blur(18px)", y: 28, scale: 1.25 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
                      transition={{ duration: 1.2, delay: 0.25 + (li * 2 + wi) * 0.35, ease: [0.22, 1, 0.36, 1] }}>
                      {w}
                    </motion.span>
                  ))}
                </span>
              ))}
            </span>
          </h1>
          <svg aria-hidden viewBox="0 0 220 14" className="mt-3 h-3 w-44 text-gold sm:w-56"><path d="M2 10 C60 2 150 2 218 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
          {/* "home-made food is our speciality" */}
          <motion.p initial={still ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.7 }}
            className="telugu mt-4 flex items-center gap-2 text-xl text-[#8a5a10] sm:text-2xl">
            <span aria-hidden className="text-gold">✦</span>ఇంటి వంటలే మా ప్రత్యేకత<span aria-hidden className="text-gold">✦</span>
          </motion.p>
          {/* rotating line: what we make */}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-[15px] font-medium text-ink/70 sm:text-lg lg:justify-start">
            <span>Fresh from Velpuru —</span>
            <RotatingWord words={["Non-Veg Pickles", "Veg Pickles", "Sweets", "Traditional Snacks"]} still={still} />
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/shop" className="btn-primary px-7 py-3.5 text-base">Shop now</Link>
            <a href={waLink(store.whatsapp, "Hello VSM Godavari Foods, I would like to place an order.")} target="_blank" rel="noopener noreferrer" className="btn-ghost px-7 py-3.5 text-base">Order on WhatsApp</a>
          </div>
        </motion.div>

        {/* Food spread on banana leaves, in front of the Godavari */}
        <div className="relative mx-auto aspect-[6/5] w-[108%] max-w-[60rem] -mx-[4%] sm:mx-auto sm:w-full lg:max-w-[50rem] lg:w-[min(50rem,calc((100dvh-130px-92px)*1.2))]">
          {/* soft sunlit glow behind the food */}
          <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,240,200,.55)_0%,rgba(255,240,200,.15)_50%,transparent_70%)]" />
          {/* banana leaves laid flat under the food */}
          <motion.div aria-hidden className="absolute inset-0" style={{ y: leafY }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LEAF} alt="" style={{ "--r": "-72deg" } as React.CSSProperties} className="hero-leaf absolute left-[40%] top-[60%] w-[36%] drop-shadow-[0_16px_18px_rgba(30,40,10,.3)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LEAF} alt="" style={{ "--r": "-104deg", animationDelay: "-3s" } as React.CSSProperties} className="hero-leaf absolute left-[60%] top-[58%] w-[34%] brightness-90 drop-shadow-[0_16px_18px_rgba(30,40,10,.3)]" />
          </motion.div>
          {SPREAD.map((item, i) => <SpreadItem key={item.img} item={item} i={i} progress={scrollYProgress} still={still} />)}
          {SPICES.map((sp, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={i} src={cut(sp.img)} alt="" aria-hidden initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.8 + i * 0.06 }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_6px_6px_rgba(20,30,10,.35)]"
              style={{ left: sp.x + "%", top: sp.y + "%", width: sp.w + "%", zIndex: sp.z, rotate: sp.r }} />
          ))}
          <motion.div className="absolute left-1/2 top-[42%] z-[3] w-[52%] -translate-x-1/2 -translate-y-1/2" style={{ y: heroY }}>
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              {/* The chicken pickle lifts off here and lands on its product card while you scroll */}
              <Link href="/product/chicken-boneless-pickle" className="hero-bob group relative block" data-fly-source title="Chicken pickle">
                {/* polished brass thali under the bowl */}
                <svg aria-hidden viewBox="0 0 200 50" className="absolute -left-[9%] bottom-[-3%] w-[118%]">
                  <defs>
                    <linearGradient id="thali" x1="0" x2="1"><stop offset="0" stopColor="#6b4511" /><stop offset=".25" stopColor="#f6d98a" /><stop offset=".5" stopColor="#c8962f" /><stop offset=".75" stopColor="#f0cc72" /><stop offset="1" stopColor="#6b4511" /></linearGradient>
                    <radialGradient id="thali-in" cx=".5" cy=".4"><stop offset="0" stopColor="#f6dc95" /><stop offset="1" stopColor="#a87a24" /></radialGradient>
                  </defs>
                  <ellipse cx="100" cy="30" rx="98" ry="18" fill="#2b1803" opacity=".45" />
                  <ellipse cx="100" cy="25" rx="98" ry="20" fill="url(#thali)" />
                  <ellipse cx="100" cy="23" rx="84" ry="15" fill="url(#thali-in)" />
                  <ellipse cx="100" cy="25" rx="98" ry="20" fill="none" stroke="#fff3c8" strokeOpacity=".6" strokeWidth="1.2" />
                  <ellipse className="thali-gleam" cx="100" cy="25" rx="98" ry="20" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" pathLength="100" strokeDasharray="12 88" />
                </svg>
                <span aria-hidden className="absolute inset-x-[8%] bottom-[2%] h-[14%] rounded-[50%] bg-[#0f2a10]/40 blur-lg" />
                {/* steam rising from the pickle */}
                <svg aria-hidden viewBox="0 0 120 80" className="pointer-events-none absolute left-1/2 top-[-30%] z-10 w-[56%] -translate-x-1/2">
                  {[[38, 0], [60, 1.3], [82, .6]].map(([x, d]) => (
                    <path key={x} className="hero-steam" style={{ animationDelay: d + "s" }} d={`M${x} 78 C${x - 10} 62 ${x + 10} 52 ${x} 38 S${x - 8} 16 ${x + 2} 2`} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                  ))}
                </svg>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cut("glass-25")} alt="Chicken boneless pickle" className="relative w-full drop-shadow-[0_22px_22px_rgba(20,30,10,.35)] transition duration-300 group-hover:scale-[1.03]" />
                <span className="badge-shine absolute left-1/2 top-[4%] -translate-x-1/2 overflow-hidden whitespace-nowrap rounded-full bg-gradient-to-b from-gold-light to-turmeric px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-maroon-900 shadow sm:text-[11px]">Bestseller</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* curved green wave with a gold edge, flowing into the green strip below */}
      <svg aria-hidden viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-14 w-full sm:h-20">
        <path d="M0 52 C360 10 720 92 1080 46 C1250 24 1360 30 1440 40 V90 H0Z" fill="#11391f" />
        <path d="M0 52 C360 10 720 92 1080 46 C1250 24 1360 30 1440 40" fill="none" stroke="#e1bd68" strokeWidth="3" />
        <path d="M0 62 C360 20 720 102 1080 56 C1250 34 1360 40 1440 50" fill="none" stroke="#e1bd68" strokeWidth="1" opacity=".6" />
      </svg>
    </section>
  );
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Wraps the hero and the product grid. While scrolling, a copy of the hero's chicken-pickle
 * bowl ([data-fly-source]) glides down and lands on the matching product card ([data-fly-target]).
 */
const BOWL = "/products/served/glass-25.webp";

export function PickleFlight({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const fly = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const w = wrap.current, f = fly.current;
    if (!w || !f) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const show = (el: Element | null | undefined, on: boolean) => { if (el instanceof HTMLElement) el.style.opacity = on ? "" : "0"; };

    const update = () => {
      raf = 0;
      const src = w.querySelector<HTMLElement>("[data-fly-source]");
      const dst = w.querySelector<HTMLElement>("[data-fly-target]");
      if (!src || !dst) { f.style.opacity = "0"; return; }
      const wr = w.getBoundingClientRect();
      // land exactly on the bowl image inside the card (not the whole card)
      const srcEl = src.querySelector("img") ?? src, dstEl = dst.querySelector("[data-fly-img]") ?? dst.querySelector("img") ?? dst;
      const a = srcEl.getBoundingClientRect(), b = dstEl.getBoundingClientRect();
      const ax = a.left - wr.left, ay = a.top - wr.top, bx = b.left - wr.left, by = b.top - wr.top;
      const wrapTop = wr.top + window.scrollY;
      // start after a little scroll; land when the target card sits around the middle of the screen
      const start = 30;
      const end = Math.max(start + 200, wrapTop + by + b.height / 2 - window.innerHeight * 0.55);
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      const srcImg = srcEl as Element, dstImg = dstEl as Element;

      if (p <= 0 || p >= 1) {
        f.style.opacity = "0";
        show(srcImg, p <= 0);
        show(dstImg, true);
        return;
      }
      const e = ease(p), arc = Math.sin(Math.PI * e);
      const x = ax + (bx - ax) * e - arc * Math.min(160, window.innerWidth * 0.12);
      const y = ay + (by - ay) * e;
      // keep the bowl square-ish: shrink from the hero bowl size to the card width
      const width = a.width + (b.width - a.width) * e, height = width * (a.height / a.width);
      // always fly the transparent cut-out bowl (never the product card photo, which has a white background)
      if (f.getAttribute("src") !== BOWL) f.setAttribute("src", BOWL);
      f.style.borderRadius = "0";
      f.style.background = "transparent";
      f.style.objectFit = "contain";
      f.style.opacity = "1";
      f.style.width = `${width}px`;
      f.style.height = `${height}px`;
            f.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${-7 * arc}deg) scale(${1 + 0.08 * arc})`;
      show(srcImg, false);
      show(dstImg, false);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf);
      show(w.querySelector("[data-fly-source] img"), true); show(w.querySelector("[data-fly-target] img"), true);
    };
  }, []);

  return (
    <div ref={wrap} className="relative">
      {children}
      <img ref={fly} alt="" aria-hidden src={BOWL}
        className="pointer-events-none absolute left-0 top-0 z-30 object-contain opacity-0 drop-shadow-[0_22px_22px_rgba(61,13,13,.35)] will-change-transform" />
    </div>
  );
}

export function TrustStrip() {
  const store = useStore();
  const free = store.shipping.freeAbove > 0 ? `Free above ₹${store.shipping.freeAbove.toLocaleString("en-IN")}` : "Fast & safe shipping";
  const items = [
    { icon: Leaf, t: "Pure & natural", d: "No preservatives, colours or palm oil" },
    { icon: Sparkles, t: "Homemade with love", d: "Small batches, family recipes" },
    { icon: ShieldCheck, t: "Hygienic packing", d: "Leak-proof, food-grade jars" },
    { icon: Truck, t: "All-India delivery", d: free },
  ];
  return (
    <section className="relative z-10 -mt-px bg-[radial-gradient(ellipse_at_50%_0%,#1f5a37_0%,#11391f_60%,#0a2615_100%)] text-cream">
      <div aria-hidden className="temple-border" />
      <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
        {items.map(({ icon: I, t, d }, i) => (
          <div key={t} className="flex items-start gap-3" data-aos="fade-up" data-aos-delay={i * 120}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-maroon-500 to-maroon-800 text-gold-light shadow-[0_6px_14px_-4px_rgba(0,0,0,.5)] ring-2 ring-gold-light/80 outline outline-1 outline-offset-[3px] outline-gold-light/35"><I className="h-5 w-5" /></span>
            <div><p className="font-display text-lg font-bold text-gold-light">{t}</p><p className="text-xs text-cream/70 sm:text-sm">{d}</p></div>
          </div>
        ))}
      </div>
      <div aria-hidden className="temple-border" />
    </section>
  );
}
