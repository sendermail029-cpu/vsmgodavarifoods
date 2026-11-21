import Link from "next/link";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { FacebookIcon } from "../brand/SocialIcons";
import { Logo } from "../brand/Logo";
import { LeafCluster } from "../brand/BananaLeaves";
import { Thoranam } from "../brand/Thoranam";

type Props = { categories: { name: string; slug: string }[]; phone: string; phone2?: string; mapsUrl?: string; facebookUrl?: string; email: string; address: string; whatsapp: string };

export function Footer({ categories, phone, phone2, mapsUrl, facebookUrl, email, address, whatsapp }: Props) {
  return (
    <footer className="relative mt-20 text-cream">
      {/* a boatman under the Rajamahendravaram bridge, fading into the footer.
          TEMPORARILY HIDDEN while reviewing the footer design — remove "hidden" to bring it back. */}
      <div className="relative hidden h-56 overflow-hidden sm:h-80">
        <img src="/godavari/boatman-bridge.webp" alt="A boatman on the Godavari river under the Rajamahendravaram bridge" loading="lazy" className="h-full w-full object-cover object-[62%_60%] [mask-image:linear-gradient(to_bottom,transparent,black_30%)]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b2615]" />
        <div className="container-x absolute inset-x-0 bottom-6">
          <p className="telugu text-lg text-gold-light drop-shadow">గోదావరి ఒడ్డు నుంచి మీ ఇంటికి</p>
          <p className="font-display text-2xl font-bold text-cream drop-shadow sm:text-4xl">From the banks of the <span className="italic text-gold-light">Godavari.</span></p>
        </div>
      </div>
      {/* deep Godavari green with a faint kolam pattern and a soft gold glow */}
      <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_115%,#1f5a37_0%,#11391f_45%,#0a2615_100%)]">
        <div aria-hidden className="kolam-bg absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(233,207,138,.14),transparent_65%)]" />
        {/* festive top border: gold zari band with a mango-leaf & marigold thoranam hanging from it */}
        <div aria-hidden className="absolute inset-x-0 top-0 z-10">
          <div className="h-[3px] bg-gradient-to-r from-[#7a5414] via-[#f6d98a] to-[#7a5414]" />
          <div className="temple-border bg-[#081d10]" />
          <div className="h-px bg-gold-light/50" />
          <div className="-mt-[3px] px-2 drop-shadow-[0_6px_6px_rgba(0,0,0,.5)]"><Thoranam id="footer" className="h-[44px] w-full sm:h-[52px]" /></div>
        </div>
        <div className="container-x relative grid grid-cols-2 gap-x-6 gap-y-10 pb-6 pt-24 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-gold-light/15 lg:pt-28">
          <div className="col-span-2 flex flex-col items-center text-center lg:col-span-1 lg:items-start lg:pr-8 lg:text-left">
            <Logo light className="h-16 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/75 lg:max-w-xs">Authentic pickles, traditional sweets and snacks made the village way in Velpuru, West Godavari.</p>
            <p className="telugu mt-4 inline-block rounded-full bg-gradient-to-b from-maroon-600 to-maroon-800 px-4 py-1 text-gold-light shadow-[0_6px_14px_-6px_rgba(0,0,0,.6)] ring-2 ring-gold-light/70">గోదావరి రుచులు మీ ఇంటికి</p>
          </div>
          <div className="lg:px-8 xl:px-12">
            <h3 className="font-display text-lg font-bold text-gold-light after:mt-2 after:block after:h-[3px] after:w-10 after:rounded-full after:bg-gradient-to-r after:from-maroon-500 after:to-gold-light">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((c) => <li key={c.slug}><Link className="text-cream/80 transition hover:text-gold-light" href={`/shop/${c.slug}`}>{c.name}</Link></li>)}
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/shop">All products</Link></li>
            </ul>
          </div>
          <div className="lg:px-8 xl:px-12">
            <h3 className="font-display text-lg font-bold text-gold-light after:mt-2 after:block after:h-[3px] after:w-10 after:rounded-full after:bg-gradient-to-r after:from-maroon-500 after:to-gold-light">Help & Policies</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/about">About us</Link></li>
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/contact">Contact & custom orders</Link></li>
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/shipping-policy">Shipping & delivery</Link></li>
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/refund-policy">Cancellation & refunds</Link></li>
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/privacy-policy">Privacy policy</Link></li>
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/terms-and-conditions">Terms & conditions</Link></li>
              <li><Link className="text-cream/80 transition hover:text-gold-light" href="/photo-credits">Photo credits</Link></li>
            </ul>
          </div>
          <div className="col-span-2 lg:col-span-1 lg:pl-8 xl:pl-12">
            <h3 className="font-display text-lg font-bold text-gold-light after:mt-2 after:block after:h-[3px] after:w-10 after:rounded-full after:bg-gradient-to-r after:from-maroon-500 after:to-gold-light">Get in touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-cream/85">
              <li className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-maroon-500 to-maroon-800 shadow ring-1 ring-gold-light/70"><MapPin className="h-4 w-4 text-gold-light" /></span><span className="pt-1">{address}{mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 font-semibold text-gold-light hover:underline"><Navigation className="h-3.5 w-3.5" /> Get directions</a>}</span></li>
              <li><a className="flex items-center gap-3 transition hover:text-gold-light" href={`tel:+91${phone}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-maroon-500 to-maroon-800 shadow ring-1 ring-gold-light/70"><Phone className="h-4 w-4 text-gold-light" /></span>+91 {phone}</a></li>
              {phone2 && <li><a className="flex items-center gap-3 transition hover:text-gold-light" href={`tel:+91${phone2}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-maroon-500 to-maroon-800 shadow ring-1 ring-gold-light/70"><Phone className="h-4 w-4 text-gold-light" /></span>+91 {phone2}</a></li>}
              <li><a className="flex items-center gap-3 break-all transition hover:text-gold-light" href={`mailto:${email}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-maroon-500 to-maroon-800 shadow ring-1 ring-gold-light/70"><Mail className="h-4 w-4 text-gold-light" /></span>{email}</a></li>
              {facebookUrl && <li><a className="flex items-center gap-3 transition hover:text-gold-light" href={facebookUrl} target="_blank" rel="noopener noreferrer"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-maroon-500 to-maroon-800 shadow ring-1 ring-gold-light/70"><FacebookIcon className="h-4 w-4 text-gold-light" /></span>Follow us on Facebook</a></li>}
              <li><a className="btn-gold mt-2" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a></li>
            </ul>
          </div>
        </div>
        {/* phones & tablets: our four kinds of food in a row above the tagline */}
        <div className="container-x relative z-20 grid grid-cols-4 items-end gap-2 pt-4 sm:gap-6 lg:hidden">
          <figure className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/served/glass-25.webp" alt="Chicken pickle" loading="lazy" className="w-full max-w-[6.5rem] drop-shadow-[0_10px_12px_rgba(0,0,0,.5)]" />
            <figcaption className="rounded-full bg-maroon-800/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-gold-light ring-1 ring-gold-light/60 sm:text-xs">Pickles</figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/served/glass-26.webp" alt="Gongura pickle" loading="lazy" className="w-full max-w-[6.5rem] drop-shadow-[0_10px_12px_rgba(0,0,0,.5)]" />
            <figcaption className="rounded-full bg-maroon-800/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-gold-light ring-1 ring-gold-light/60 sm:text-xs">Veg pickles</figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/served/glass-28.webp" alt="Laddus" loading="lazy" className="w-full max-w-[6.5rem] drop-shadow-[0_10px_12px_rgba(0,0,0,.5)]" />
            <figcaption className="rounded-full bg-maroon-800/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-gold-light ring-1 ring-gold-light/60 sm:text-xs">Sweets</figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/served/glass-murukulu.webp" alt="Murukulu" loading="lazy" className="w-full max-w-[6.5rem] drop-shadow-[0_10px_12px_rgba(0,0,0,.5)]" />
            <figcaption className="rounded-full bg-maroon-800/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-gold-light ring-1 ring-gold-light/60 sm:text-xs">Snacks</figcaption>
          </figure>
        </div>
        {/* open strip framed by banana leaves, with the tagline as a big gold outline watermark (same height as before) */}
        <div className="tagline-glow relative z-10 flex h-24 items-end justify-center overflow-hidden sm:h-28 lg:h-32">
          <p className="telugu tagline-shimmer pointer-events-none relative z-10 select-none whitespace-nowrap pb-1 text-[7.2vw] leading-none sm:text-[5.6vw]">
            గోదావరి రుచులు మీ ఇంటికి
          </p>
        </div>
        {/* large screens: pickles, sweets & snacks resting in pairs on the banana leaves */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/products/served/glass-25.webp" alt="Chicken pickle" loading="lazy" className="pointer-events-none absolute z-20 hidden drop-shadow-[0_12px_14px_rgba(0,0,0,.55)] lg:block bottom-4 left-[2.5%] w-32 xl:w-36" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/products/served/glass-28.webp" alt="Sweets – laddus" loading="lazy" className="pointer-events-none absolute z-20 hidden drop-shadow-[0_12px_14px_rgba(0,0,0,.55)] lg:block bottom-14 left-[10%] w-24 xl:w-28" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/products/served/glass-26.webp" alt="Gongura pickle" loading="lazy" className="pointer-events-none absolute z-20 hidden drop-shadow-[0_12px_14px_rgba(0,0,0,.55)] lg:block bottom-4 right-[2.5%] w-32 xl:w-36" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/products/served/glass-murukulu.webp" alt="Traditional snacks – murukulu" loading="lazy" className="pointer-events-none absolute z-20 hidden drop-shadow-[0_12px_14px_rgba(0,0,0,.55)] lg:block bottom-14 right-[10%] w-24 xl:w-28" />
        <LeafCluster scale="scale-[.3] sm:scale-[.4] lg:scale-[.5]" />
        <LeafCluster flip delay={-1.5} scale="scale-[.3] sm:scale-[.4] lg:scale-[.5]" />
      </div>

      {/* gold temple-saree border between the green section and the copyright bar */}
      <div aria-hidden className="relative z-30 bg-[#071a0e]">
        <div className="h-px bg-gold-light/70" />
        <div className="temple-border" />
        <div className="h-px bg-gold-light/70" />
      </div>
      <div className="bg-[#071a0e]">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-cream/60 lg:flex-row lg:text-left">
          <p>© {new Date().getFullYear()} VSM Godavari Foods. All rights reserved.</p>
          {/* developer credit (middle of the bar) */}
          <a href="https://www.pandjtechnologies.com/" target="_blank" rel="noopener" className="group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 ring-1 ring-cream/15 transition hover:bg-white/5 hover:ring-gold-light/50">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white p-0.5 shadow-sm">
              <img src="/brand/pandj-logo.webp" alt="" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-6 object-contain" />
            </span>
            <span>Designed &amp; developed by <b className="font-semibold text-cream/90 transition group-hover:text-gold-light">P &amp; J Technologies</b></span>
          </a>
          <p className="lg:pr-20">Secure UPI payments · Hygienically packed · All-India delivery</p>
        </div>
      </div>
    </footer>
  );
}
