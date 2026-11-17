"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { useStore } from "../StoreInfo";
import { calcShipping, rupees } from "@/lib/format";
import { ProductArt } from "../ProductArt";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, grams } = useCart();
  const store = useStore();
  const shipping = calcShipping(subtotal, grams, store.shipping, lines.reduce((s, l) => s + l.qty, 0));
  const toFree = store.shipping.freeAbove * 100 - subtotal;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label="Your cart"
            className="fixed right-0 top-0 z-[61] flex h-dvh w-full max-w-md flex-col bg-cream shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-maroon-700/10 px-5 py-4">
              <h2 className="font-display text-xl font-bold text-maroon-700">Your Cart</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-maroon-700/10" aria-label="Close cart"><X className="h-5 w-5" /></button>
            </div>
            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-maroon-700/30" />
                <p className="text-ink/70">Your cart is empty.</p>
                <Link href="/shop" onClick={() => setOpen(false)} className="btn-primary">Browse products</Link>
              </div>
            ) : (
              <>
                {store.shipping.freeAbove > 0 && (
                  <div className="mx-5 mt-4 rounded-2xl bg-white p-3 text-sm ring-1 ring-maroon-700/10">
                    <div className="flex items-center gap-2 font-medium"><Truck className="h-4 w-4 text-leaf" />
                      {toFree > 0 ? <>Add <b>{rupees(toFree)}</b> more for FREE delivery</> : <>You&apos;ve unlocked FREE delivery 🎉</>}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-dark">
                      <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${Math.min(100, (subtotal / (store.shipping.freeAbove * 100)) * 100)}%` }} />
                    </div>
                  </div>
                )}
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {lines.map((l) => (
                    <li key={l.variantId} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-maroon-700/10">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        {l.image ? <img loading="lazy" decoding="async" src={l.image} alt={l.name} className="h-full w-full object-cover" /> : <ProductArt art={l.art} name={l.name} className="h-full w-full" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="truncate font-semibold hover:text-maroon-700">{l.name}</Link>
                        <span className="text-xs text-ink/60">{l.label}</span>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center rounded-full ring-1 ring-maroon-700/20">
                            <button className="p-1.5" onClick={() => setQty(l.variantId, l.qty - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-7 text-center text-sm font-semibold">{l.qty}</span>
                            <button className="p-1.5 disabled:opacity-30" disabled={l.qty >= l.stock} onClick={() => setQty(l.variantId, l.qty + 1)} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                          <span className="font-semibold">{rupees(l.price * l.qty)}</span>
                        </div>
                      </div>
                      <button onClick={() => remove(l.variantId)} className="self-start p-1 text-ink/40 hover:text-chilli" aria-label={`Remove ${l.name}`}><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 border-t border-maroon-700/10 bg-white/60 px-5 py-4 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{rupees(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery (estimate)</span><span className="font-semibold">{shipping === 0 ? "FREE" : rupees(shipping)}</span></div>
                  <div className="flex justify-between border-t border-dashed border-maroon-700/20 pt-2 text-base"><span className="font-bold">Total</span><span className="font-bold text-maroon-700">{rupees(subtotal + shipping)}</span></div>
                  <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full py-3 text-base">Checkout securely</Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
