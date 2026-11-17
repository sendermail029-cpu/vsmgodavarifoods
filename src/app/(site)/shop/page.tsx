import type { Metadata } from "next";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { getCategories, getProducts, toCard } from "@/lib/catalog";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Shop Pickles, Sweets & Snacks Online",
  description: "Order homemade chicken pickle, mutton pickle, prawn pickle, avakaya, gongura, sunnundalu, putharekulu and Andhra snacks online. All-India delivery.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [cats, products] = await Promise.all([getCategories(), getProducts()]);
  return (
    <div className="container-x py-10">
      <header className="mb-8 text-center">
        <p className="telugu text-lg text-gold">మా ఉత్పత్తులు</p>
        <h1 className="font-display text-4xl font-black text-maroon-700 sm:text-5xl">Shop all products</h1>
        <p className="mx-auto mt-2 max-w-xl text-ink/70">Small-batch pickles, sweets and snacks — made fresh and packed hygienically.</p>
      </header>
      <ShopGrid products={products.map(toCard)} categories={cats.map((c) => ({ name: c.name, slug: c.slug, count: Number(c.product_count) }))} />
    </div>
  );
}
