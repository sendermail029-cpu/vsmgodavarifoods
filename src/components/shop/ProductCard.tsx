"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { flyToCart } from "../cart/flyToCart";
import { motion } from "motion/react";
import { Flame, Plus } from "lucide-react";
import type { ProductCard as PC } from "@/lib/catalog";
import { rupees } from "@/lib/format";
import { useCart } from "../cart/CartProvider";
import { ProductArt } from "../ProductArt";

export function SpiceMeter({ level }: { level: number }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Spice level ${level} of 5`} title={`Spice level ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => <Flame key={i} className={`h-3.5 w-3.5 ${i < level ? "fill-chilli text-chilli" : "text-ink/15"}`} />)}
    </span>
  );
}

/** flyTarget marks the card the home-page hero photo flies into while scrolling. */
export function ProductCard({ p, index = 0, flyTarget = false }: { p: PC; index?: number; flyTarget?: boolean }) {
  const { add } = useCart();
  const firstInStock = p.variants.find((v) => v.stock > 0) ?? p.variants[0];
  const [vid, setVid] = useState(firstInStock?.id);
  const v = p.variants.find((x) => x.id === vid) ?? firstInStock;
  const out = !v || v.stock <= 0;
  const media = useRef<HTMLAnchorElement>(null);
  const [adding, setAdding] = useState(false);

  /** fly the product photo into the cart icon, then add it (cart drawer stays closed) */
  async function addToCart() {
    if (!v || adding) return;
    setAdding(true);
    const img = media.current?.querySelector("img");
    await flyToCart(img ?? media.current, img?.currentSrc || img?.src || (p.image ?? `/products/${p.art}.webp?v=3`));
    add({ variantId: v.id, productId: p.id, slug: p.slug, name: p.name, label: v.label, price: v.price, art: p.art, image: p.image, stock: v.stock, grams: v.grams }, 1, { open: false });
    setAdding(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-maroon-900/15 hover:ring-gold/60"
    >
      <Link href={`/product/${p.slug}`} ref={media} className="relative block aspect-square overflow-hidden" data-fly-target={flyTarget || undefined}>
        {flyTarget ? (
          /* the hero bowl lands here: same cut-out bowl, normal size, centred */
          <span className="absolute inset-0 grid place-items-center bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/served/glass-25.webp" alt={p.name} loading="lazy" data-fly-img className="w-[76%] drop-shadow-[0_14px_14px_rgba(61,13,13,.25)] transition duration-500 group-hover:scale-105" />
          </span>
        ) : p.image ? (
          <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <ProductArt art={p.art} name={p.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        )}
        {v?.mrp && v.mrp > v.price && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-b from-gold-light to-turmeric px-2.5 py-1 text-[11px] font-bold text-maroon-900 shadow">
            {Math.round((1 - v.price / v.mrp) * 100)}% OFF
          </span>
        )}
        {out && <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-xs font-semibold text-white">Out of stock</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/product/${p.slug}`}><h3 className="font-display text-lg font-bold leading-tight hover:text-maroon-700">{p.name}</h3></Link>
            {p.telugu && <p className="telugu text-sm text-ink/60">{p.telugu}</p>}
          </div>
          <SpiceMeter level={p.spice} />
        </div>
        {p.variants.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pack size">
            {p.variants.map((x) => (
              <button key={x.id} role="radio" aria-checked={x.id === v?.id} onClick={() => setVid(x.id)} disabled={x.stock <= 0}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition disabled:opacity-40 disabled:line-through ${x.id === v?.id ? "bg-maroon-700 text-cream ring-maroon-700" : "ring-gold/40 hover:bg-gold-pale hover:ring-gold"}`}>
                {x.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="font-display text-2xl font-bold text-maroon-700">{v ? rupees(v.price) : "—"}</span>
            {v?.mrp && v.mrp > v.price && <span className="ml-1.5 text-sm text-ink/40 line-through">{rupees(v.mrp)}</span>}
            {p.variants.length === 1 && <span className="block text-xs text-ink/50">{v?.label}</span>}
          </div>
          <button
            disabled={out || adding}
            onClick={addToCart}
            className="btn-primary px-4" aria-label={`Add ${p.name} ${v?.label ?? ""} to cart`}>
            <Plus className="h-4 w-4" /> {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
