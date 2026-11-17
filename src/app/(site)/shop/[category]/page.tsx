import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { getCategories, getCategoryBySlug, getProducts, toCard } from "@/lib/catalog";
import { SITE_URL } from "@/lib/format";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).category);
  if (!c) return {};
  return {
    title: `${c.name} Online — Homemade Godavari ${c.name}`,
    description: c.description ?? `Buy ${c.name} online from VSM Godavari Foods.`,
    alternates: { canonical: `/shop/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const [cat, cats, products] = await Promise.all([getCategoryBySlug(category), getCategories(), getProducts({ categorySlug: category })]);
  if (!cat) notFound();
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: cat.name, item: `${SITE_URL}/shop/${cat.slug}` },
    ],
  };
  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <header className="mb-8 text-center">
        {cat.telugu_name && <p className="telugu text-lg text-gold">{cat.telugu_name}</p>}
        <h1 className="font-display text-4xl font-black text-maroon-700 sm:text-5xl">{cat.name}</h1>
        {cat.description && <p className="mx-auto mt-2 max-w-xl text-ink/70">{cat.description}</p>}
      </header>
      <ShopGrid products={products.map(toCard)} active={cat.slug} categories={cats.map((c) => ({ name: c.name, slug: c.slug, count: Number(c.product_count) }))} />
    </div>
  );
}
