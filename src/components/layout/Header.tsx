"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Phone, ShoppingBag, X, ChevronDown } from "lucide-react";
import { Logo } from "../brand/Logo";
import { useCart } from "../cart/CartProvider";
import { useStore } from "../StoreInfo";

type Cat = { name: string; slug: string; telugu: string | null };

/** Small photo shown beside each category in the Shop menu. */
const CAT_PHOTO: Record<string, string> = { "non-veg-pickles": "chicken", "veg-pickles": "mango", "sweets-laddus": "laddu", "traditional-snacks": "murukulu" };

export function Header({ categories }: { categories: Cat[] }) {
  const { count, setOpen, ready } = useCart();
  const store = useStore();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const nav = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop", children: categories },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      {store.announcement && (
        <div className="bg-maroon-800 text-gold-light">
          <div className="container-x flex h-9 items-center justify-center gap-3 text-xs sm:justify-between sm:text-[13px]">
            <span className="hidden sm:inline telugu">గోదావరి రుచులు మీ ఇంటికి</span>
            <span className="font-medium tracking-wide text-cream">{store.announcement}</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Phone className="h-3.5 w-3.5" /><a href={`tel:+91${store.phone}`} className="hover:text-cream">+91 {store.phone}</a>{store.phone2 && <>{" / "}<a href={`tel:+91${store.phone2}`} className="hover:text-cream">{store.phone2}</a></>}</span>
          </div>
        </div>
      )}
      <header className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-cream/92 shadow-[0_8px_30px_-12px_rgba(122,28,28,.25)] backdrop-blur-md" : "bg-cream"}`}>
        <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link href="/" aria-label="VSM Godavari Foods — Home" className="shrink-0">
            <Logo className="h-12 w-auto sm:h-16" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {nav.map((n) =>
              n.children ? (
                <div key={n.href} className="group relative">
                  <Link href={n.href} className={`relative flex items-center gap-1 px-4 py-2 text-[13px] font-semibold uppercase tracking-[.14em] transition hover:text-maroon-700 ${path.startsWith("/shop") ? "text-maroon-700 after:absolute after:inset-x-4 after:-bottom-0.5 after:h-px after:bg-gold" : "text-ink/80"}`}>
                    {n.label} <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" />
                  </Link>
                  {/* dropdown sits above the header border (z-[60]) and opens just below it */}
                  <div className="invisible absolute left-1/2 top-full z-[60] w-[22rem] -translate-x-1/2 translate-y-2 pt-6 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <span aria-hidden className="absolute left-1/2 top-[1.15rem] h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gold/50 bg-maroon-800" />
                    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_-20px_rgba(61,13,13,.45)] ring-1 ring-gold/40">
                      <div className="flex items-center justify-between bg-gradient-to-b from-maroon-700 to-maroon-800 px-5 py-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-[.2em] text-gold-light">Shop by category</span>
                        <span className="telugu text-xs text-gold-light/80">మా రుచులు</span>
                      </div>
                      <div className="p-2">
                        {n.children.map((c) => (
                          <Link key={c.slug} href={`/shop/${c.slug}`} className="group/item flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-gold-pale">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img loading="lazy" decoding="async" src={`/products/${CAT_PHOTO[c.slug] ?? "mango"}.webp?v=3`} alt="" className="h-11 w-11 shrink-0 rounded-full bg-white object-cover ring-2 ring-gold-light/70 transition group-hover/item:scale-110" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] font-semibold leading-tight text-ink group-hover/item:text-maroon-700">{c.name}</span>
                              {c.telugu && <span className="telugu block text-xs leading-tight text-ink/55">{c.telugu}</span>}
                            </span>
                            <span aria-hidden className="text-gold opacity-0 transition group-hover/item:translate-x-0.5 group-hover/item:opacity-100">→</span>
                          </Link>
                        ))}
                        <Link href="/shop" className="mt-1 flex items-center justify-center gap-1 rounded-2xl bg-gradient-to-b from-maroon-600 to-maroon-800 px-4 py-2.5 text-sm font-semibold text-cream transition hover:from-maroon-700 hover:to-maroon-900">View all products →</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={n.href} href={n.href} className={`relative px-4 py-2 text-[13px] font-semibold uppercase tracking-[.14em] transition hover:text-maroon-700 ${path === n.href ? "text-maroon-700 after:absolute after:inset-x-4 after:-bottom-0.5 after:h-px after:bg-gold" : "text-ink/80"}`}>{n.label}</Link>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/shop" className="btn-primary hidden sm:inline-flex">Order Now</Link>
            <button onClick={() => setOpen(true)} data-cart-icon className="relative rounded-full p-2.5 ring-1 ring-gold/50 transition hover:bg-gold-pale" aria-label={`Open cart, ${count} items`}>
              <ShoppingBag className="h-5 w-5 text-maroon-700" />
              {ready && count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-chilli px-1 text-[11px] font-bold text-white">{count}</span>
              )}
            </button>
            <button onClick={() => setMenu((m) => !m)} className="rounded-full p-2.5 ring-1 ring-gold/50 lg:hidden" aria-label="Menu" aria-expanded={menu}>
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gold/20 bg-cream lg:hidden" aria-label="Mobile">
              <div className="container-x space-y-1 py-4">
                {nav.map((n) => (
                  <div key={n.href}>
                    <Link href={n.href} className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-white">{n.label}</Link>
                    {n.children && (
                      <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                        {n.children.map((c) => (
                          <Link key={c.slug} href={`/shop/${c.slug}`} className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-gold/25">{c.name}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <a href={`tel:+91${store.phone}`} className="btn-ghost mt-2 w-full"><Phone className="h-4 w-4" /> Call +91 {store.phone}</a>
                {store.phone2 && <a href={`tel:+91${store.phone2}`} className="btn-ghost mt-2 w-full"><Phone className="h-4 w-4" /> Call +91 {store.phone2}</a>}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
        <div aria-hidden className="relative z-0 temple-border opacity-80" />
      </header>
    </>
  );
}
