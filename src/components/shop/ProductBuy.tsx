"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import type { ProductCard } from "@/lib/catalog";
import { rupees } from "@/lib/format";
import { useCart } from "../cart/CartProvider";

export function ProductBuy({ p }: { p: ProductCard }) {
  const { add, setOpen } = useCart();
  const router = useRouter();
  const first = p.variants.find((v) => v.stock > 0) ?? p.variants[0];
  const [vid, setVid] = useState(first?.id);
  const [qty, setQty] = useState(1);
  const v = p.variants.find((x) => x.id === vid) ?? first;
  const out = !v || v.stock <= 0;
  const line = () => v && add({ variantId: v.id, productId: p.id, slug: p.slug, name: p.name, label: v.label, price: v.price, art: p.art, image: p.image, stock: v.stock, grams: v.grams }, qty);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-black text-maroon-700">{v ? rupees(v.price * qty) : "—"}</span>
        {v?.mrp && v.mrp > v.price && <span className="text-lg text-ink/40 line-through">{rupees(v.mrp * qty)}</span>}
        <span className="text-xs text-ink/50">incl. of all taxes</span>
      </div>
      <fieldset className="mt-6">
        <legend className="label">Pack size</legend>
        <div className="flex flex-wrap gap-2">
          {p.variants.map((x) => (
            <button key={x.id} type="button" onClick={() => { setVid(x.id); setQty(1); }} disabled={x.stock <= 0} aria-pressed={x.id === v?.id}
              className={`rounded-2xl px-4 py-2.5 text-left ring-1 transition disabled:opacity-40 ${x.id === v?.id ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-maroon-700/20 hover:ring-maroon-700/60"}`}>
              <span className="block text-sm font-bold">{x.label}</span>
              <span className="block text-xs opacity-80">{x.stock > 0 ? rupees(x.price) : "Sold out"}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {v && v.stock > 0 && v.stock <= 5 && <p className="mt-3 text-sm font-semibold text-chilli">Hurry — only {v.stock} left!</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full bg-white ring-1 ring-maroon-700/20">
          <button type="button" className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
          <button type="button" className="p-3 disabled:opacity-30" disabled={!v || qty >= v.stock} onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
        </div>
        <button type="button" disabled={out} onClick={line} className="btn-ghost flex-1 bg-white py-3 text-base sm:flex-none sm:px-8"><ShoppingBag className="h-5 w-5" /> Add to cart</button>
        <button type="button" disabled={out} onClick={() => { line(); setOpen(false); router.push("/checkout"); }} className="btn-primary w-full py-3 text-base sm:w-auto sm:px-8"><Zap className="h-5 w-5" /> Buy now</button>
      </div>
    </div>
  );
}
