import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { SITE_URL } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, products] = await Promise.all([getCategories(), getProducts()]);
  const now = new Date();
  const stat = ["", "/shop", "/about", "/contact", "/privacy-policy", "/terms-and-conditions", "/shipping-policy", "/refund-policy"];
  return [
    ...stat.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: (p === "" || p === "/shop" ? "daily" : "yearly") as "daily" | "yearly", priority: p === "" ? 1 : p === "/shop" ? 0.9 : 0.3 })),
    ...cats.map((c) => ({ url: `${SITE_URL}/shop/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: new Date(String(p.updated_at).replace(" ", "T") + "Z"), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
