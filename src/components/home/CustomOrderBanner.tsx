import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Reveal } from "./Reveal";
import { Ornament } from "../brand/Ornament";
import { LeafCluster } from "../brand/BananaLeaves";
import { TempleLamps } from "../brand/TempleLamps";

const BOWLS = [
  { slug: "non-veg-pickles", label: "Non-Veg Pickles", img: "glass-25" },
  { slug: "veg-pickles", label: "Veg Pickles", img: "glass-26" },
  { slug: "sweets-laddus", label: "Sweets", img: "glass-28" },
  { slug: "traditional-snacks", label: "Traditional Snacks", img: "glass-murukulu" },
] as const;

/** Food served in a brass bowl or pickle jar, resting on the banana leaves and linking to its category. */
function Bowl({ b, className = "", size = "w-32" }: { b: (typeof BOWLS)[number]; className?: string; size?: string }) {
  return (
    <Link href={`/shop/${b.slug}`} className={`group flex flex-col items-center gap-1 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async"
        src={`/products/served/${b.img}.webp`}
        alt={b.label}
        loading="lazy"
        className={`h-auto drop-shadow-[0_12px_14px_rgba(20,4,4,.6)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 ${size}`}
      />
      <span className="rounded-full bg-maroon-800/95 px-2.5 py-0.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-[.14em] text-gold-light shadow-md ring-1 ring-gold-light/60 group-hover:bg-maroon-700 group-hover:text-cream sm:text-[11px] lg:whitespace-nowrap">{b.label}</span>
    </Link>
  );
}

export function CustomOrderBanner({ whatsapp }: { whatsapp: string }) {
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello VSM Godavari Foods, I'd like to place a custom order.")}`;
  return (
    <section className="container-x" aria-labelledby="custom">
      {/* Godavari green (theme rule: big sections green, actions & headlines maroon, ornaments gold). Red version: .backup/CustomOrderBanner.red.tsx */}
      <Reveal className="relative isolate overflow-hidden rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,#1f5a3a_0%,#123d27_55%,#071d12_100%)] text-center text-cream shadow-[0_30px_60px_-30px_rgba(7,29,18,.7)] ring-1 ring-gold/50">
        {/* Godavari at dusk, faintly behind everything */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[url('/godavari/boatman-bridge.webp')] bg-cover bg-bottom opacity-[0.14] mix-blend-luminosity [mask-image:linear-gradient(to_top,black_5%,transparent_70%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,transparent_30%,rgba(255,220,150,.07)_45%,transparent_60%)]" />
        <div aria-hidden className="grain absolute inset-0 -z-10" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-16 -z-10 h-56 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-gold-light/10 blur-3xl" />

        {/* double zari frame */}
        <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[2rem] border border-gold-light/45" />
        <div aria-hidden className="pointer-events-none absolute inset-[18px] rounded-[1.7rem] border border-gold-light/20" />

        {/* thoranam across the top */}
        <div aria-hidden className="absolute inset-x-6 top-[12px] drop-shadow-[0_4px_4px_rgba(0,0,0,.35)]"><TempleLamps id="banner" /></div>

        {/* real banana leaves fanning in from the lower corners */}
        <LeafCluster />
        <LeafCluster flip delay={-1.5} />

        {/* river ripples */}
        <svg aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-20 w-full" viewBox="0 0 1200 80" preserveAspectRatio="none" fill="none" stroke="#e9cf8a">
          <path d="M0 30 Q150 18 300 30 T600 30 T900 30 T1200 30" strokeOpacity=".2" />
          <path d="M0 52 Q150 42 300 52 T600 52 T900 52 T1200 52" strokeOpacity=".12" />
        </svg>

        <div className="relative px-6 pb-14 pt-20 sm:px-12 sm:pt-[5.5rem]">
          <p className="telugu inline-block rounded-full bg-gradient-to-b from-maroon-600 to-maroon-800 px-5 py-1.5 text-xl text-gold-light shadow-[0_8px_18px_-8px_rgba(0,0,0,.6)] ring-2 ring-gold-light/70 sm:text-2xl">మీకు ఎలా కావాలి?</p>
          <h2 id="custom" className="mt-4 font-display text-3xl font-black text-cream sm:text-5xl">
            Want it your way?{" "}
            <span className="bg-gradient-to-b from-[#fbe9b4] via-[#e9c46a] to-[#c08a2e] block bg-clip-text pr-1 italic text-transparent sm:inline">We&apos;ll make it.</span>
          </h2>
          <Ornament light className="mt-4 justify-center" />
          <p className="mx-auto mt-4 max-w-2xl text-cream/80">
            Tell us the flavour, spice level or home-style dish you&apos;re craving — pickles, snacks or a special sweet — and we&apos;ll prepare it fresh, the Godavari way.
          </p>
          <div className="mx-auto mt-7 grid max-w-md grid-cols-4 items-start gap-2 sm:gap-4 lg:hidden">
            {BOWLS.map((b) => <Bowl key={b.slug} b={b} size="w-[4.5rem] sm:w-24" />)}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-gold mt-8 px-7 py-3 text-base shadow-[0_0_0_6px_rgba(233,207,138,.12),0_14px_30px_-10px_rgba(0,0,0,.5)] hover:shadow-[0_0_0_10px_rgba(233,207,138,.16),0_14px_30px_-10px_rgba(0,0,0,.5)]">
            <MessageCircle className="h-5 w-5" /> Tell us on WhatsApp
          </a>
        </div>

        {/* pickles, sweets & snacks served on the leaves (desktop) */}
        <div className="absolute bottom-[36%] left-[2%] hidden lg:block"><Bowl b={BOWLS[0]} size="w-32" /></div>
        <div className="absolute bottom-[4%] left-[13.5%] hidden lg:block"><Bowl b={BOWLS[1]} size="w-32" /></div>
        <div className="absolute bottom-[4%] right-[13.5%] hidden lg:block"><Bowl b={BOWLS[2]} size="w-32" /></div>
        <div className="absolute bottom-[36%] right-[2%] hidden lg:block"><Bowl b={BOWLS[3]} size="w-32" /></div>
      </Reveal>
    </section>
  );
}
