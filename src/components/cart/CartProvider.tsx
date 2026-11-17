"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  variantId: number; productId: number; slug: string; name: string; label: string;
  price: number; qty: number; art: string; image: string | null; stock: number; grams: number;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  grams: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** opts.open = false keeps the cart drawer closed (used when the item flies to the cart icon instead). */
  add: (l: Omit<CartLine, "qty">, qty?: number, opts?: { open?: boolean }) => void;
  setQty: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  ready: boolean;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "vsm-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines, ready]);

  const add = useCallback((l: Omit<CartLine, "qty">, qty = 1, opts?: { open?: boolean }) => {
    setLines((prev) => {
      const ex = prev.find((p) => p.variantId === l.variantId);
      if (ex) return prev.map((p) => (p.variantId === l.variantId ? { ...p, ...l, qty: Math.min(p.qty + qty, l.stock || 50) } : p));
      return [...prev, { ...l, qty: Math.min(qty, l.stock || 50) }];
    });
    if (opts?.open !== false) setOpen(true);
  }, []);

  const setQty = useCallback((variantId: number, qty: number) => {
    setLines((prev) => prev.flatMap((p) => (p.variantId !== variantId ? [p] : qty <= 0 ? [] : [{ ...p, qty: Math.min(qty, p.stock || 50) }])));
  }, []);
  const remove = useCallback((variantId: number) => setLines((p) => p.filter((l) => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(() => ({
    lines, open, setOpen, add, setQty, remove, clear, ready,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
    grams: lines.reduce((s, l) => s + l.qty * l.grams, 0),
  }), [lines, open, add, setQty, remove, clear, ready]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
