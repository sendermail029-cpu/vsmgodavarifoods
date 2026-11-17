import Link from "next/link";
import { Plus } from "lucide-react";
import { getCategories, getProducts, type Product } from "@/lib/catalog";
import { rupees } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui";
import { ProductArt } from "@/components/ProductArt";
import { ProductRowActions } from "./ProductRowActions";

/** Small photo per category for the tabs / section headings. */
const CAT_PHOTO: Record<string, string> = { "non-veg-pickles": "chicken", "veg-pickles": "mango", "sweets-laddus": "laddu", "traditional-snacks": "murukulu" };

function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="bg-cream/70 text-left text-xs uppercase text-ink/50">
          <tr><th className="px-4 py-2">Product</th><th className="px-3 py-2">Pack sizes · price · stock</th><th className="px-3 py-2">Status</th><th /></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-maroon-700/5 align-top hover:bg-cream/40">
              <td className="px-4 py-3">
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">{p.image ? <img src={`/api/image/product/${p.id}`} alt="" className="h-full w-full object-cover" /> : <ProductArt art={p.art} name={p.name} className="h-full w-full" />}</span>
                  <span><span className="block font-semibold hover:text-maroon-700">{p.name}</span><span className="telugu text-xs text-ink/50">{p.telugu_name}</span></span>
                </Link>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.variants.map((v) => (
                    <span key={v.id} className={`rounded-lg px-2 py-1 text-xs ring-1 ${v.stock <= 0 ? "bg-red-50 ring-red-200" : v.stock <= v.low_stock_at ? "bg-orange-50 ring-orange-200" : "bg-white ring-maroon-700/10"}`}>
                      <b>{v.label}</b> · {rupees(v.price)} · {v.stock} pcs
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3 whitespace-nowrap"><span className={p.active ? "text-leaf font-semibold" : "font-semibold text-chilli"}>{p.active ? "Live" : "Out of stock"}</span>{p.featured ? <span className="ml-2 rounded bg-turmeric/30 px-1.5 text-[10px] font-bold">FEATURED</span> : null}</td>
              <td className="px-3 py-3 text-right"><ProductRowActions id={p.id} active={!!p.active} featured={!!p.featured} name={p.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q, cat } = await searchParams;
  const [products, cats] = await Promise.all([getProducts({ includeInactive: true, q: q?.slice(0, 60) }), getCategories({ includeInactive: true })]);

  // group every product under its category (in category order), plus "No category" at the end
  const groups = [
    ...cats.map((c) => ({ key: c.slug, name: c.name, telugu: c.telugu_name, photo: CAT_PHOTO[c.slug], items: products.filter((p) => p.category_id === c.id) })),
    { key: "none", name: "No category", telugu: null as string | null, photo: undefined as string | undefined, items: products.filter((p) => !p.category_id || !cats.some((c) => c.id === p.category_id)) },
  ].filter((g) => g.items.length || g.key !== "none");
  const shown = cat ? groups.filter((g) => g.key === cat) : groups;
  const tab = (key: string | null) => {
    const sp = new URLSearchParams();
    if (key) sp.set("cat", key);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Products & Prices" sub={`${products.length} products in ${cats.length} categories`}>
        <form>{cat && <input type="hidden" name="cat" value={cat} />}<input name="q" defaultValue={q} placeholder="Search…" className="input w-48" /></form>
        <Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </PageHeader>

      {/* category tabs */}
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by category">
        <Link href={tab(null)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${!cat ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-gold/40 hover:bg-gold-pale"}`}>
          All <span className="ml-1 opacity-70">{products.length}</span>
        </Link>
        {groups.map((g) => (
          <Link key={g.key} href={tab(g.key)} className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold ring-1 transition ${cat === g.key ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-gold/40 hover:bg-gold-pale"}`}>
            {g.photo ? <img src={`/products/${g.photo}.webp?v=3`} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-gold-light" /> : <span className="h-7 w-7 rounded-full bg-cream" />}
            {g.name} <span className="opacity-70">{g.items.length}</span>
          </Link>
        ))}
      </nav>

      {/* one card per category */}
      <div className="space-y-8">
        {shown.map((g) => (
          <section key={g.key} className="card overflow-hidden" aria-labelledby={`cat-${g.key}`}>
            <header className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-maroon-700 to-maroon-800 px-5 py-3 text-cream">
              <div className="flex items-center gap-3">
                {g.photo && <img src={`/products/${g.photo}.webp?v=3`} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-gold-light" />}
                <div>
                  <h2 id={`cat-${g.key}`} className="font-display text-lg font-bold leading-tight">{g.name}</h2>
                  {g.telugu && <p className="telugu text-xs text-gold-light">{g.telugu}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1">{g.items.length} {g.items.length === 1 ? "product" : "products"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">{g.items.filter((p) => p.active).length} live</span>
              </div>
            </header>
            {g.items.length ? <ProductTable products={g.items} /> : <p className="px-5 py-8 text-center text-sm text-ink/50">No products in this category{q ? " match your search" : " yet"}.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
