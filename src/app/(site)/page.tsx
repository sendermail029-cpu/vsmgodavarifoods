import Link from "next/link";
import { Hero, PickleFlight, TrustStrip } from "@/components/home/Hero";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductArt } from "@/components/ProductArt";
import { getCategories, getProducts, toCard } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { Ornament } from "@/components/brand/Ornament";
import { GodavariTasteMap } from "@/components/home/GodavariTasteMap";
import { AOSInit } from "@/components/home/AOSInit";
import { CustomOrderBanner } from "@/components/home/CustomOrderBanner";

export const revalidate = 60;

const CAT_ART: Record<string, string> = { "non-veg-pickles": "chicken", "veg-pickles": "mango", "sweets-laddus": "laddu", "traditional-snacks": "murukulu" };

const FAQ = [
  { q: "Do your pickles contain preservatives or artificial colours?", a: "No. We use only salt, oil, chilli and natural spices — the traditional way pickles are preserved. No artificial preservatives, no added colours and no palm oil." },
  { q: "Do you deliver outside Andhra Pradesh?", a: "Yes, we deliver across India. Delivery is free for orders above the free-shipping amount shown at checkout; smaller orders are charged by weight." },
  { q: "How long do non-veg pickles last?", a: "Our chicken, mutton and prawn pickles stay fresh for about 45 days at room temperature and up to 3 months in the fridge. Always use a dry spoon." },
  { q: "How can I pay?", a: "Pay securely by UPI (Google Pay, PhonePe, Paytm, BHIM or any UPI app) directly to our business account. We accept online payment only (no Cash on Delivery)." },
  { q: "Can I place a custom order?", a: "Yes! Tell us the flavour, spice level or dish you want on WhatsApp and we will make it for you." },
];

export default async function Home() {
  const [cats, featured, s] = await Promise.all([getCategories(), getProducts({ featured: true, limit: 8 }), getSettings()]);
  const flyId = featured.find((p) => p.art === "chicken")?.id;
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
      <AOSInit />
      <PickleFlight>
        <Hero />
        {/* Featured */}
        <section className="kolam-bg border-y border-gold/20 bg-gold-pale/40 py-20" aria-labelledby="best">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div data-aos="fade-right">
                <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">Bestsellers</p>
                <h2 id="best" className="mt-1 font-display text-4xl font-black text-maroon-700 sm:text-5xl">Customer <span className="italic text-maroon-500">favourites</span></h2>
                <Ornament className="mt-3" />
              </div>
              <Link href="/shop" className="btn-ghost" data-aos="fade-left">View all products</Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {featured.map((p, i) => <ProductCard key={p.id} p={toCard(p)} index={i} flyTarget={p.id === flyId} />)}
            </div>
          </div>
        </section>

      </PickleFlight>
      <TrustStrip />

      {/* Categories */}
      <section className="container-x py-20" aria-labelledby="cats">
        <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
          <p className="telugu text-lg text-gold">మా ప్రత్యేకతలు</p>
          <h2 id="cats" className="font-display text-4xl font-black text-maroon-700 sm:text-5xl">Made for <span className="italic text-maroon-500">every meal</span></h2>
          <Ornament className="mt-4 justify-center" />
          <p className="mt-4 text-ink/70">Godavari-inspired veg pickles, non-veg specials, festival sweets and traditional snacks in authentic village-style flavours.</p>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
          {cats.map((c, i) => (
            <div key={c.id} data-aos="zoom-in-up" data-aos-delay={i * 120}>
              <Link href={`/shop/${c.slug}`} className="group arch gold-frame relative block overflow-hidden bg-white shadow-[0_18px_40px_-20px_rgba(94,21,21,.5)] transition duration-500 hover:-translate-y-1">
                <div className="aspect-[3/4] overflow-hidden">
                  {c.image ? (
                    <img src={`/api/image/category/${c.id}`} alt={c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <ProductArt art={CAT_ART[c.slug] ?? "mango"} name={c.name} className="h-full w-full transition duration-700 group-hover:scale-110" />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-maroon-900/95 via-maroon-900/60 to-transparent p-4 pt-16 text-center text-cream">
                  {c.telugu_name && <p className="telugu text-sm text-gold-light">{c.telugu_name}</p>}
                  <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl">{c.name}</h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.2em] text-gold-light/90">{c.product_count} products</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <GodavariTasteMap />

      {/* Story */}
      <section className="container-x grid items-center gap-12 py-24 lg:grid-cols-2" aria-labelledby="story">
        <div className="relative" data-aos="fade-right">
          <div className="grid grid-cols-2 gap-4">
            <ProductArt art="gongura" name="Gongura pickle" className="arch gold-frame aspect-[4/5] w-full shadow-xl" />
            <ProductArt art="sunnundalu" name="Sunnundalu" className="arch gold-frame mt-12 aspect-[4/5] w-full shadow-xl" />
            <ProductArt art="prawn" name="Prawn pickle" className="arch gold-frame -mt-12 aspect-[4/5] w-full shadow-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/putharekulu-pot.webp" alt="Putharekulu being made on a traditional clay pot over a wood fire" loading="lazy" className="arch gold-frame aspect-[4/5] w-full bg-white object-contain shadow-xl" />
          </div>
        </div>
        <div data-aos="fade-left" data-aos-delay="150">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">Our story</p>
          <h2 id="story" className="mt-2 font-display text-4xl font-black leading-tight text-maroon-700 sm:text-5xl">Not just food.<br />It&apos;s <span className="italic text-maroon-500">the taste of home.</span></h2>
          <Ornament className="mt-4" />
          <p className="telugu mt-4 text-lg text-ink/80">మన ఇంటి వంటల రుచిని, తరతరాల గోదావరి సంప్రదాయ రుచులను ప్రతి ఇంటికి అందించాలనే ఆశయంతో ప్రారంభమైంది.</p>
          <p className="mt-4 text-ink/75">VSM Godavari Foods began with one simple aim — to bring the warmth of home cooking and generations-old Godavari flavours to every table. Every recipe comes from traditional home kitchens, and every jar carries a memory. Food is more than taste: it&apos;s love, memories and tradition.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[["Godavari", "Flavours"], ["Traditional", "Recipes"], ["Homemade", "Goodness"]].map(([a, b], i) => (
              <div key={a} className="card px-2 py-4" data-aos="flip-up" data-aos-delay={300 + i * 120}><p className="font-display text-lg font-bold text-maroon-700">{a}</p><p className="text-[11px] uppercase tracking-[.18em] text-gold">{b}</p></div>
            ))}
          </div>
          <Link href="/about" className="btn-primary mt-8">Read our story</Link>
        </div>
      </section>

      {/* Custom order */}
      <div data-aos="zoom-in" data-aos-duration="900"><CustomOrderBanner whatsapp={s.whatsapp} /></div>

      {/* FAQ */}
      <section className="container-x max-w-3xl py-24" aria-labelledby="faq">
        <div data-aos="fade-down">
        <p className="telugu text-center text-lg text-gold">మీ సందేహాలు</p>
        <h2 id="faq" className="text-center font-display text-4xl font-black text-maroon-700">Frequently asked <span className="italic text-maroon-500">questions</span></h2>
        <Ornament className="mt-4 justify-center" />
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((f, i) => (
            <details key={f.q} className="card group p-5 open:shadow-md" data-aos="fade-up" data-aos-delay={i * 100}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold transition group-open:text-maroon-700">
                {f.q}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg text-gold ring-1 ring-gold/50 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
