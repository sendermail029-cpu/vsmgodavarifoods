"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ProductCard as PC } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

type Cat = { name: string; slug: string; count: number };

export function ShopGrid({ products, categories, active }: { products: PC[]; categories: Cat[]; active?: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const l = products.filter((p) => !t || p.name.toLowerCase().includes(t) || (p.telugu ?? "").includes(q.trim()) || (p.short ?? "").toLowerCase().includes(t));
    if (sort === "low") l.sort((a, b) => a.fromPrice - b.fromPrice);
    if (sort === "high") l.sort((a, b) => b.fromPrice - a.fromPrice);
    if (sort === "name") l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [products, q, sort]);

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-b border-maroon-700/10 bg-cream/90 px-4 py-3 backdrop-blur sm:top-20 sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0" aria-label="Categories">
            <Link href="/shop" className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${!active ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-maroon-700/15"}`}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${active === c.slug ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-maroon-700/15"}`}>
                {c.name} <span className="opacity-60">({c.count})</span>
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            <label className="relative flex-1 lg:w-64">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pickles, sweets…" className="input pl-9" />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto" aria-label="Sort">
              <option value="popular">Popular</option>
              <option value="low">Price: low → high</option>
              <option value="high">Price: high → low</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
      {list.length ? (
        <div className="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      ) : (
        <p className="py-24 text-center text-ink/60">No products found.</p>
      )}
    </>
  );
}
