import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf, ShieldCheck, Truck, Clock } from "lucide-react";
import { getProductBySlug, getProducts, toCard } from "@/lib/catalog";
import { SITE_URL } from "@/lib/format";
import { ProductArt } from "@/components/ProductArt";
import { ProductBuy } from "@/components/shop/ProductBuy";
import { ProductCard, SpiceMeter } from "@/components/shop/ProductCard";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const desc = p.short_description ?? `${p.name} from VSM Godavari Foods.`;
  return {
    title: `${p.name}${p.telugu_name ? ` (${p.telugu_name})` : ""} — Buy Online`,
    description: `${desc} Homemade in West Godavari. No preservatives. All-India delivery.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: p.image ? [`/api/image/product/${p.id}`] : ["/og.png"] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const card = toCard(p);
  const related = (await getProducts({ categorySlug: p.category_slug ?? undefined })).filter((x) => x.id !== p.id).slice(0, 4);
  const prices = p.variants.map((v) => v.price / 100);
  const ld = {
    "@context": "https://schema.org", "@type": "Product",
    name: p.name, description: p.description ?? p.short_description, sku: `VSM-${p.id}`,
    image: p.image ? `${SITE_URL}/api/image/product/${p.id}` : `${SITE_URL}/og.png`,
    brand: { "@type": "Brand", name: "VSM Godavari Foods" }, category: p.category_name,
    offers: {
      "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: p.variants.length,
      availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${p.slug}`,
    },
  };
  return (
    <div className="container-x py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-maroon-700">Home</Link> / <Link href="/shop" className="hover:text-maroon-700">Shop</Link>
        {p.category_slug && <> / <Link href={`/shop/${p.category_slug}`} className="hover:text-maroon-700">{p.category_name}</Link></>}
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-maroon-700/10">
            {card.image ? <img src={card.image} alt={p.name} className="aspect-square w-full object-cover" /> : <ProductArt art={p.art} name={p.name} className="aspect-square w-full" />}
          </div>
        </div>
        <div>
          {p.category_name && <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">{p.category_name}</p>}
          <h1 className="mt-2 font-display text-4xl font-black leading-tight text-maroon-700 sm:text-5xl">{p.name}</h1>
          {p.telugu_name && <p className="telugu mt-1 text-2xl text-ink/70">{p.telugu_name}</p>}
          <div className="mt-3 flex items-center gap-3 text-sm"><SpiceMeter level={p.spice_level} />{p.spice_level > 0 && <span className="text-ink/60">Spice level</span>}</div>
          {p.short_description && <p className="mt-4 text-lg text-ink/80">{p.short_description}</p>}
          <div className="mt-6"><ProductBuy p={card} /></div>
          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <li className="card flex items-center gap-2 p-3"><Leaf className="h-5 w-5 text-leaf" /> No preservatives</li>
            <li className="card flex items-center gap-2 p-3"><ShieldCheck className="h-5 w-5 text-leaf" /> Hygienic, sealed pack</li>
            <li className="card flex items-center gap-2 p-3"><Truck className="h-5 w-5 text-leaf" /> All-India delivery</li>
            <li className="card flex items-center gap-2 p-3"><Clock className="h-5 w-5 text-leaf" /> Made in small batches</li>
          </ul>
          <div className="mt-8 space-y-3">
            {p.description && <details open className="card p-5"><summary className="cursor-pointer font-display text-lg font-bold">Description</summary><p className="mt-3 whitespace-pre-line text-ink/80">{p.description}</p></details>}
            {p.ingredients && <details className="card p-5"><summary className="cursor-pointer font-display text-lg font-bold">Ingredients</summary><p className="mt-3 text-ink/80">{p.ingredients}</p></details>}
            {p.shelf_life && <details className="card p-5"><summary className="cursor-pointer font-display text-lg font-bold">Shelf life & storage</summary><p className="mt-3 text-ink/80">{p.shelf_life}</p></details>}
            <details className="card p-5"><summary className="cursor-pointer font-display text-lg font-bold">Delivery & returns</summary>
              <p className="mt-3 text-ink/80">Dispatched within 1–3 working days and delivered across India. Food items can&apos;t be returned once delivered for hygiene reasons, but if your order arrives damaged or wrong, we&apos;ll replace or refund it. See our <Link className="text-maroon-700 underline" href="/refund-policy">refund policy</Link>.</p>
            </details>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl font-black text-maroon-700">You may also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">{related.map((r, i) => <ProductCard key={r.id} p={toCard(r)} index={i} />)}</div>
        </section>
      )}
    </div>
  );
}
