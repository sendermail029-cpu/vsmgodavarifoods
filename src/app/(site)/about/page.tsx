import type { Metadata } from "next";
import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { Reveal } from "@/components/home/Reveal";
import { HeartHandshake, Home, Leaf, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Our Godavari Story",
  description: "VSM Godavari Foods brings generations-old Godavari home recipes — pickles, sweets and snacks — from Velpuru, Tanuku to homes across India.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div>
      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-2">
        <Reveal>
          <p className="telugu text-xl text-gold">మా గురించి</p>
          <h1 className="mt-1 font-display text-5xl font-black leading-tight text-maroon-700">From our Godavari kitchen to your home.</h1>
          <p className="telugu mt-6 text-lg leading-relaxed text-ink/80">మన ఇంటి వంటల రుచిని, తరతరాల గోదావరి సంప్రదాయ రుచులను ప్రతి ఇంటికి అందించాలనే ఆశయంతో VSM Godavari Foods ప్రారంభమైంది. మా ప్రతి వంటకం సంప్రదాయ ఇంటి వంటల నుండి పుట్టినదే. ప్రతి రుచిలో ఒక జ్ఞాపకం, ప్రతి వంటకంలో ఒక కథ ఉంది.</p>
          <p className="mt-5 leading-relaxed text-ink/75">VSM Godavari Foods began with one aim — to bring the warmth of home cooking and generations-old Godavari flavours to every table. Every recipe comes from traditional home kitchens; every taste carries a memory and every dish has a story. For us, food is more than taste — it&apos;s love, memories and tradition, and we try to pack a little of that home feeling into every jar.</p>
        </Reveal>
        <Reveal delay={0.1} className="grid grid-cols-2 gap-4">
          <ProductArt art="chicken" name="Chicken pickle" className="w-full rounded-[2rem] shadow-xl" />
          <ProductArt art="laddu" name="Laddus" className="mt-10 w-full rounded-[2rem] shadow-xl" />
        </Reveal>
      </section>
      <section className="bg-white/50 py-16">
        <div className="container-x grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Home, t: "Online & offline", d: "Order on our website, WhatsApp or visit us in Velpuru." },
            { i: Truck, t: "All-India delivery", d: "Carefully packed and shipped anywhere in India." },
            { i: HeartHandshake, t: "Custom orders", d: "Tell us the pickle or snack you want — we'll make it." },
            { i: Leaf, t: "Honest ingredients", d: "No preservatives, no added colours, no palm oil." },
          ].map(({ i: I, t, d }, k) => (
            <Reveal key={t} delay={k * 0.06} className="card p-6">
              <I className="h-8 w-8 text-chilli" />
              <h2 className="mt-4 font-display text-xl font-bold">{t}</h2>
              <p className="mt-1 text-sm text-ink/70">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="container-x py-16 text-center">
        <p className="telugu text-2xl text-gold">ప్రతి ముద్దలో గోదావరి రుచి</p>
        <h2 className="mt-2 font-display text-4xl font-black text-maroon-700">Taste the difference.</h2>
        <Link href="/shop" className="btn-primary mt-6 px-6 py-3">Shop our products</Link>
      </section>
    </div>
  );
}
